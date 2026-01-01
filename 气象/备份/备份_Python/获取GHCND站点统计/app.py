import os
import io
import requests
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, session
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from user_agents import parse
from datetime import datetime
from flask_login import UserMixin, login_user, LoginManager, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import concurrent.futures
from dotenv import load_dotenv
from flask_wtf.csrf import CSRFProtect, generate_csrf
import json

load_dotenv()

app = Flask(__name__)

# --- CONFIGURATION ---
basedir = os.path.abspath(os.path.dirname(__file__))
instance_path = os.path.join(basedir, 'instance')
if not os.path.exists(instance_path):
    os.makedirs(instance_path)

app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(instance_path, "visitors.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-change-this-key')
app.config['WTF_CSRF_SECRET_KEY'] = os.getenv('WTF_CSRF_SECRET_KEY', app.config['SECRET_KEY'])

db = SQLAlchemy(app)
csrf = CSRFProtect(app)

# --- TRANSLATIONS ---
TRANSLATIONS = {}
TRANSLATIONS_FILE = 'translations.json'
if os.path.exists(TRANSLATIONS_FILE):
    with open(TRANSLATIONS_FILE, 'r', encoding='utf-8') as f:
        TRANSLATIONS = json.load(f)

def get_translation(key, lang=None, **kwargs):
    """Get translation for a key, with optional format parameters"""
    if lang is None:
        lang = session.get('language', 'zh')
    keys = key.split('.')
    try:
        value = TRANSLATIONS.get(lang, TRANSLATIONS.get('en', {}))
        for k in keys:
            value = value[k]
        if kwargs:
            return value.format(**kwargs)
        return value
    except (KeyError, TypeError, AttributeError):
        # Fallback to English, then to key itself
        try:
            value = TRANSLATIONS.get('en', {})
            for k in keys:
                value = value[k]
            if kwargs:
                return value.format(**kwargs)
            return value
        except (KeyError, TypeError, AttributeError):
            return key

def get_current_language():
    """Get current language from session, default to 'en'"""
    return session.get('language', 'zh')

@app.context_processor
def inject_csrf_token():
    return dict(csrf_token=generate_csrf, t=get_translation, lang=get_current_language)

# --- LOGIN MANAGER ---
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# --- CUSTOM DECORATORS ---
def admin_required(f):
    @wraps(f)
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_admin:
            flash("Access denied.") 
            return redirect(url_for('home'))
        return f(*args, **kwargs)
    return decorated_function

def advanced_permission_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Check if user is authenticated and has advanced access
        if current_user.is_authenticated:
            if not (current_user.is_admin or current_user.user_level == 'advanced'):
                return jsonify({'status': 'error', 'message': 'Permission denied.'}), 403
        # Check if visitor has advanced access
        elif session.get('is_visitor_access') and session.get('visitor_level') == 'advanced':
            pass  # Allow access
        else:
            return jsonify({'status': 'error', 'message': 'Permission denied.'}), 403
        return f(*args, **kwargs)
    return decorated_function

# Decorator to allow Logged In Users OR Special Visitors
def auth_or_visitor_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        is_user = current_user.is_authenticated
        is_visitor = session.get('is_visitor_access')
        
        if not is_user and not is_visitor:
            # Check if this is a JSON request (POST with JSON content-type or GET with 'q' param)
            if request.content_type and 'application/json' in request.content_type:
                return jsonify({'status': 'error', 'message': 'Authentication required'}), 401
            if 'q' in request.args:
                return jsonify({'status': 'error', 'message': 'Authentication required'}), 401
            return redirect(url_for('login'))
            
        return f(*args, **kwargs)
    return decorated_function

# --- MODELS ---
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(150), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    user_level = db.Column(db.String(20), default='basic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Visitor(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(150), nullable=True) 
    ip_address = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    country = db.Column(db.String(50))
    city = db.Column(db.String(50))
    device_type = db.Column(db.String(50))
    os = db.Column(db.String(50))
    browser = db.Column(db.String(50))
    device_brand = db.Column(db.String(50))

class Invitation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(50), unique=True, nullable=False)
    platform = db.Column(db.String(50))
    note = db.Column(db.String(200))
    level_grant = db.Column(db.String(20), default='basic') 
    is_used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    used_at = db.Column(db.DateTime, nullable=True)
    used_by = db.Column(db.String(150), nullable=True) 

with app.app_context():
    db.create_all()

# --- CACHE & STATION LOADING ---
GHCND_FILE = 'ghcnd-stations.txt'
GSOD_FILE = 'isd-history.txt'
GHCND_DF = None
GSOD_DF = None

def load_ghcnd_stations():
    global GHCND_DF
    if os.path.exists(GHCND_FILE):
        print(f"Loading GHCND stations from {GHCND_FILE}...")
        col_specs = [(0, 11), (12, 20), (21, 30), (31, 37), (38, 40), (41, 71)]
        col_names = ['ID', 'LAT', 'LON', 'ELEV', 'STATE', 'NAME']
        try:
            df = pd.read_fwf(GHCND_FILE, colspecs=col_specs, names=col_names, header=None)
            df['LAT'] = pd.to_numeric(df['LAT'], errors='coerce')
            df['LON'] = pd.to_numeric(df['LON'], errors='coerce')
            df['ELEV'] = pd.to_numeric(df['ELEV'], errors='coerce')
            # Elevation Range Check: -500 to 9000 meters
            df.loc[(df['ELEV'] < -500) | (df['ELEV'] > 9000), 'ELEV'] = np.nan
            df['NAME'] = df['NAME'].str.strip()
            df['STATE'] = df['STATE'].fillna('')
            GHCND_DF = df
            print(f"Successfully loaded {len(df)} GHCND stations.")
        except Exception: pass

def load_gsod_stations():
    global GSOD_DF
    if os.path.exists(GSOD_FILE):
        print(f"Loading GSOD stations from {GSOD_FILE}...")
        col_specs = [(0, 6), (7, 12), (13, 42), (43, 45), (48, 50), (57, 64), (65, 73), (74, 81)]
        col_names = ['USAF', 'WBAN', 'NAME', 'CTRY', 'STATE', 'LAT', 'LON', 'ELEV']
        try:
            with open(GSOD_FILE, 'r') as f:
                lines = f.readlines()
            header_idx = 0
            for i, line in enumerate(lines[:50]):
                if "USAF" in line and "WBAN" in line:
                    header_idx = i
                    break
            df = pd.read_fwf(GSOD_FILE, colspecs=col_specs, names=col_names, header=None, skiprows=header_idx+1)
            df = df.dropna(subset=['USAF', 'WBAN'])
            df['ID'] = df['USAF'].astype(str).str.zfill(6) + df['WBAN'].astype(str).str.zfill(5)
            df['LAT'] = pd.to_numeric(df['LAT'], errors='coerce')
            df['LON'] = pd.to_numeric(df['LON'], errors='coerce')
            df['ELEV'] = pd.to_numeric(df['ELEV'], errors='coerce')
            # Elevation Range Check: -500 to 9000 meters
            df.loc[(df['ELEV'] < -500) | (df['ELEV'] > 9000), 'ELEV'] = np.nan
            df['NAME'] = df['NAME'].fillna('').astype(str).str.strip()
            df['CTRY'] = df['CTRY'].fillna('')
            df['STATE'] = df['STATE'].fillna('')
            GSOD_DF = df
            print(f"Successfully loaded {len(df)} GSOD stations.")
        except Exception: pass

load_ghcnd_stations()
load_gsod_stations()

# --- HELPER FUNCTIONS ---
def clean_nan_for_json(obj):
    """Recursively replace NaN values with None for JSON serialization"""
    if isinstance(obj, dict):
        return {k: clean_nan_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_for_json(item) for item in obj]
    elif isinstance(obj, (float, np.floating)):
        if pd.isna(obj) or np.isnan(obj):
            return None
        return float(obj)
    elif isinstance(obj, (int, np.integer)):
        return int(obj)
    elif pd.isna(obj):
        return None
    return obj

def haversine_vectorized(lat1, lon1, lat2_series, lon2_series):
    R = 6371
    phi1, phi2 = np.radians(lat1), np.radians(lat2_series)
    dphi = np.radians(lat2_series - lat1)
    dlambda = np.radians(lon2_series - lon1)
    a = np.sin(dphi/2)**2 + np.cos(phi1)*np.cos(phi2) * np.sin(dlambda/2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1-a))
    return R * c

def fetch_and_clean_data(source, station_id, start_date, end_date):
    df = pd.DataFrame()
    if source == 'GHCND':
        url = f'https://noaa-ghcn-pds.s3.amazonaws.com/csv/by_station/{station_id}.csv'
        try:
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                df = pd.read_csv(io.StringIO(resp.text), parse_dates=['DATE'], usecols=['ID', 'DATE', 'ELEMENT', 'DATA_VALUE'])
            else:
                return df
            if start_date: df = df[df['DATE'] >= start_date]
            if end_date: df = df[df['DATE'] <= end_date]
            df = df[df['ELEMENT'].isin(['TMIN', 'TAVG', 'TMAX'])].copy()
            df['DATA_VALUE'] = df['DATA_VALUE'] / 10.0
            # Filter Extreme Values: -110 to 70 Celsius
            df = df[(df['DATA_VALUE'] >= -110) & (df['DATA_VALUE'] <= 70)]
        except Exception:
            return pd.DataFrame()
    else:
        api_url = "https://www.ncei.noaa.gov/access/services/data/v1"
        # GSOD API requires startDate and endDate
        s_date = start_date if start_date else '1800-01-01'
        e_date = end_date if end_date else datetime.now().strftime('%Y-%m-%d')
        
        params = {
            'dataset': 'global-summary-of-the-day', 'stations': station_id,
            'startDate': s_date, 'endDate': e_date,
            'dataTypes': 'TEMP,MAX,MIN', 'format': 'json', 'units': 'standard', 'includeStationName': 'false',
            'limit': 1000
        }
        try:
            resp = requests.get(api_url, params=params, timeout=15)
            if resp.status_code == 200:
                raw_data = resp.json()
                if raw_data:
                    temp_df = pd.DataFrame(raw_data)
                    temp_df['DATE'] = pd.to_datetime(temp_df['DATE'])
                    for col in ['TEMP', 'MAX', 'MIN']:
                        if col in temp_df.columns:
                            temp_df[col] = temp_df[col].astype(str).str.replace('*', '', regex=False)
                            temp_df[col] = pd.to_numeric(temp_df[col], errors='coerce')
                            temp_df[col] = (temp_df[col] - 32) * 5.0 / 9.0
                            temp_df[col] = temp_df[col].round(1)
                    temp_df = temp_df.rename(columns={'TEMP': 'TAVG', 'MAX': 'TMAX', 'MIN': 'TMIN'})
                    df = temp_df.melt(id_vars=['STATION', 'DATE'], value_vars=['TAVG', 'TMAX', 'TMIN'], var_name='ELEMENT', value_name='DATA_VALUE')
                    df = df.rename(columns={'STATION': 'ID'})
                    df = df.dropna(subset=['DATA_VALUE'])
                    df = df[(df['DATA_VALUE'] >= -110) & (df['DATA_VALUE'] <= 70)]
        except Exception: pass
    return df

# --- TRACKING ---
def get_ip_location(ip1):
    ip = '127.0.0.1'
    if ',' in ip1:
        ip = ip1.split(',')[0]
    else:
        ip = ip1
    if ip == '127.0.0.1': return "Local", "Local"
    try:
        response = requests.get(f'http://ip-api.com/json/{ip}', timeout=3)
        data = response.json()
        if data['status'] == 'success':
            return data.get('country', 'Unknown'), data.get('city', 'Unknown')
    except: pass
    return "Unknown", "Unknown"

@app.before_request
def track_visitor():
    if request.endpoint in ['static', 'search_stations', 'visitor_stats', 'clear_visitor_db', 'login', 'signup', 'logout', 'invitation']: 
        return
    if request.headers.getlist("X-Forwarded-For"): ip = request.headers.getlist("X-Forwarded-For")[0]
    else: ip = request.remote_addr
    ua_string = request.headers.get('User-Agent') or ''
    device_type = "PC"
    os_family, browser_family, device_brand = "Unknown", "Unknown", "Generic"
    try:
        user_agent = parse(ua_string) if ua_string else None
        if user_agent:
            if user_agent.is_mobile: device_type = "Mobile"
            if user_agent.is_tablet: device_type = "Tablet"
            os_family = user_agent.os.family
            browser_family = user_agent.browser.family
            device_brand = user_agent.device.brand or "Generic"
    except Exception:
        user_agent = None
    country, city = get_ip_location(ip)
    
    identity = "Visitor"
    if current_user.is_authenticated:
        identity = current_user.username
    elif session.get('is_visitor_access'):
        identity = "Special Visitor"

    new_visit = Visitor(
        username=identity,
        ip_address=ip,
        country=country,
        city=city,
        device_type=device_type,
        os=os_family,
        browser=browser_family,
        device_brand=device_brand
    )
    try:
        db.session.add(new_visit)
        db.session.commit()
    except Exception as e: print(f"Tracking Error: {e}")

# --- AUTH ROUTES ---
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            session.pop('is_visitor_access', None)
            if user.is_admin: return redirect(url_for('visitor_stats'))
            else: return redirect(url_for('home'))
        else: flash('Invalid username or password')
    return render_template('login.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    # 1. SPECIAL VISITOR LOGIC
    code_str = request.args.get('guest')
    if code_str and code_str.startswith('as_visitor_'):
        invitation = Invitation.query.filter_by(code=code_str).first()
        # CHANGED: We check if it exists. We DO NOT mark it as used.
        # It allows unlimited reuse.
        if invitation:
            session['is_visitor_access'] = True
            # Check if this is an advanced visitor code
            if invitation.level_grant == 'advanced':
                session['visitor_level'] = 'advanced'
                flash("Welcome! You have advanced access.")
            else:
                session['visitor_level'] = 'basic'
                flash("Welcome! You have basic access.")
            return redirect(url_for('home'))
        else:
            flash("Invalid visitor access code.")
            return redirect(url_for('login'))

    is_admin_user = current_user.is_authenticated and current_user.is_admin
    is_first_user = (User.query.count() == 0)
    
    # 2. Check Invitation for Normal Signup
    if not is_first_user and not is_admin_user:
        if not code_str:
            flash("Invitation code required.")
            return render_template('signup.html')
        invitation = Invitation.query.filter_by(code=code_str).first()
        if not invitation:
            flash("Invalid invitation code.")
            return redirect(url_for('login'))
        if invitation.is_used:
            flash("This invitation code has already been used.")
            return redirect(url_for('login'))

    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if User.query.filter_by(username=username).first():
            flash('Username already exists.')
            return redirect(url_for('signup', guest=code_str))
        
        user_level = 'basic' 
        if not is_first_user and not is_admin_user:
             invitation = Invitation.query.filter_by(code=code_str).first()
             if invitation and not invitation.is_used:
                 invitation.is_used = True
                 invitation.used_at = datetime.utcnow()
                 invitation.used_by = username
                 user_level = invitation.level_grant

        new_user = User(username=username, is_admin=is_first_user, user_level=user_level)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        if not is_admin_user:
            login_user(new_user)
            if is_first_user: return redirect(url_for('visitor_stats'))
            return redirect(url_for('home'))
        else:
             flash(f"User {username} created successfully!")
             return redirect(url_for('visitor_stats'))

    return render_template('signup.html')

@app.route('/logout')
def logout():
    if current_user.is_authenticated:
        logout_user()
    session.pop('is_visitor_access', None)
    session.pop('visitor_level', None)
    return redirect(url_for('login'))

# --- INVITATION MANAGEMENT ---
@app.route('/invitation', methods=['GET', 'POST'])
@admin_required
def invitation_page():
    if request.method == 'POST':
        code = request.form.get('code')
        platform = request.form.get('platform')
        note = request.form.get('note')
        level = request.form.get('level')
        if code and platform and note:
            if Invitation.query.filter_by(code=code).first(): flash("Code already exists.")
            else:
                new_inv = Invitation(code=code, platform=platform, note=note, level_grant=level)
                db.session.add(new_inv)
                db.session.commit()
                flash("Invitation created.")
        else: flash("All fields required.")
        return redirect(url_for('invitation_page'))
    search_q = request.args.get('q', '').strip()
    limit = int(request.args.get('limit', 15))
    query = Invitation.query
    if search_q:
        query = query.filter((Invitation.code.contains(search_q)) | (Invitation.platform.contains(search_q)) | (Invitation.note.contains(search_q)))
    invitations = query.order_by(Invitation.created_at.desc()).limit(limit).all()
    return render_template('invitation.html', invitations=invitations, search_q=search_q, limit=limit)

@app.route('/invitation/edit/<int:id>', methods=['GET', 'POST'])
@admin_required
def edit_invitation(id):
    inv = Invitation.query.get_or_404(id)
    if request.method == 'POST':
        new_code = request.form.get('code')
        if new_code != inv.code and Invitation.query.filter_by(code=new_code).first():
            flash("Code already exists.")
            return redirect(url_for('edit_invitation', id=id))
        inv.code = new_code
        inv.platform = request.form.get('platform')
        inv.note = request.form.get('note')
        inv.level_grant = request.form.get('level')
        inv.is_used = True if request.form.get('is_used') else False
        if not inv.is_used: inv.used_by = None; inv.used_at = None
        db.session.commit()
        flash("Invitation updated.")
        return redirect(url_for('invitation_page'))
    return render_template('edit_invitation.html', inv=inv)

@app.route('/invitation/delete/<int:id>', methods=['POST'])
@admin_required
def delete_invitation(id):
    inv = Invitation.query.get_or_404(id)
    db.session.delete(inv)
    db.session.commit()
    flash("Invitation deleted.")
    return redirect(url_for('invitation_page'))

# --- APP ROUTES ---

@app.route('/')
def home():
    ghcnd_count = len(GHCND_DF) if GHCND_DF is not None else 0
    gsod_count = len(GSOD_DF) if GSOD_DF is not None else 0
    return render_template('index.html', ghcnd_count=ghcnd_count, gsod_count=gsod_count)

@app.route('/set_language/<lang>')
def set_language(lang):
    """Set language preference"""
    if lang in TRANSLATIONS:
        session['language'] = lang
    return redirect(request.referrer or url_for('home'))

@app.route('/search_stations', methods=['GET'])
@auth_or_visitor_required
def search_stations():
    query = request.args.get('q', '').strip().upper()
    source = request.args.get('source', 'GHCND')
    if not query: return jsonify([])
    df = GHCND_DF if source == 'GHCND' else GSOD_DF
    if df is None: return jsonify([])
    if source == 'GSOD': mask = (df['USAF'].str.contains(query, case=False)) | (df['NAME'].str.contains(query, case=False))
    else: mask = (df['ID'].str.contains(query, case=False)) | (df['NAME'].str.contains(query, case=False))
    results_df = df[mask].head(20)
    results = []
    for _, row in results_df.iterrows():
        label_text = row['NAME']
        state = str(row['STATE']).strip()
        if state and state.lower() != 'nan': label_text += f" ({state})"
        lat = row['LAT'] if pd.notna(row['LAT']) else '-'
        lon = row['LON'] if pd.notna(row['LON']) else '-'
        elev = row['ELEV'] if pd.notna(row['ELEV']) else '-'
        results.append({'value': f"{row['ID']} - {label_text}", 'id': row['ID'], 'name': label_text, 'lat': lat, 'lon': lon, 'elev': elev})
    return jsonify(results)

@app.route('/get_data', methods=['POST'])
@auth_or_visitor_required
@csrf.exempt
def get_data():
    try:
        req = request.json
        if req is None:
            return jsonify({'status': 'error', 'message': 'Invalid request: JSON data required'}), 400
        has_advanced_access = False
        if current_user.is_authenticated:
            if current_user.is_admin or current_user.user_level == 'advanced':
                has_advanced_access = True
        elif session.get('is_visitor_access') and session.get('visitor_level') == 'advanced':
            has_advanced_access = True
        
        source = req.get('source', 'GHCND')
        station_id = req.get('station_id', '').split(' - ')[0]
        start_date = req.get('start_date')
        end_date = req.get('end_date')
        month_filter = req.get('month_filter')
        day_filter = req.get('day_filter', '0')
        period_mode = req.get('period') 
        hemisphere = req.get('hemisphere', 'north')
        sort_by = req.get('sort_by', 'DATE')
        sort_dir = req.get('sort_dir', 'desc')
        selected_elements = req.get('selected_elements', ['TMIN', 'TAVG', 'TMAX'])
        record_limit = int(req.get('limit', 5))
        custom_avg_tmin = req.get('custom_avg_tmin')
        custom_avg_tavg = req.get('custom_avg_tavg')
        custom_avg_tmax = req.get('custom_avg_tmax')

        thresh_params = {'TMIN': {'val': req.get('tmin_val'), 'dir': req.get('tmin_dir')}, 'TAVG': {'val': req.get('tavg_val'), 'dir': req.get('tavg_dir')}, 'TMAX': {'val': req.get('tmax_val'), 'dir': req.get('tmax_dir')}}

        df = fetch_and_clean_data(source, station_id, start_date, end_date)
        if df.empty:
            return jsonify({'status': 'error', 'message': get_translation('messages.station_data_error')})

        if month_filter and month_filter != "0":
            if month_filter == "winter_3": df = df[df['DATE'].dt.month.isin([12, 1, 2])]
            elif month_filter == "summer_3": df = df[df['DATE'].dt.month.isin([6, 7, 8])]
            else: 
                df = df[df['DATE'].dt.month == int(month_filter)]
                # Apply day filter if specified and month is a single month (not winter_3 or summer_3)
                if day_filter and day_filter != "0":
                    df = df[df['DATE'].dt.day == int(day_filter)]

        def get_val_and_dates(sub_df, method='min'):
            if sub_df.empty: return {'val': '-', 'dates': []}
            target_val = sub_df['DATA_VALUE'].min() if method == 'min' else sub_df['DATA_VALUE'].max()
            matches = sub_df[sub_df['DATA_VALUE'] == target_val]['DATE']
            return {'val': float(target_val), 'dates': matches.dt.strftime('%Y-%m-%d').tolist()}

        stats = {}
        def calc_global_stats(element_name, custom_avg_input):
            sub_df = df[df['ELEMENT'] == element_name]
            if sub_df.empty: return {'min': {'val': '-', 'dates':[]}, 'avg': '-', 'max': {'val': '-', 'dates':[]}, 'count_match': 0, 'explosive_power': '-'}
            natural_avg = sub_df['DATA_VALUE'].mean()
            target_mean = float(custom_avg_input) if (custom_avg_input is not None and custom_avg_input != "") else natural_avg
            variance = ((sub_df['DATA_VALUE'] - target_mean) ** 2).mean()
            explosive_power = float(round(np.sqrt(variance), 2))
            t_val = thresh_params[element_name]['val']
            t_dir = thresh_params[element_name]['dir']
            count_match = 0
            if t_val is not None and t_val != "":
                if t_dir == 'lte': count_match = int((sub_df['DATA_VALUE'] <= float(t_val)).sum())
                else: count_match = int((sub_df['DATA_VALUE'] >= float(t_val)).sum())
            return {'min': get_val_and_dates(sub_df, 'min'), 'avg': float(round(natural_avg, 2)), 'max': get_val_and_dates(sub_df, 'max'), 'count_match': count_match, 'explosive_power': explosive_power, 'total': int(len(sub_df))}

        stats['TMIN'] = calc_global_stats('TMIN', custom_avg_tmin)
        stats['TAVG'] = calc_global_stats('TAVG', custom_avg_tavg)
        stats['TMAX'] = calc_global_stats('TMAX', custom_avg_tmax)

        df['Season_Year'] = df['DATE'].dt.year
        if period_mode == 'p1': mask = (df['DATE'].dt.month < 7) | ((df['DATE'].dt.month == 7) & (df['DATE'].dt.day < 16)); df.loc[mask, 'Season_Year'] = df['Season_Year'] - 1
        else: mask = (df['DATE'].dt.month == 1) & (df['DATE'].dt.day < 16); df.loc[mask, 'Season_Year'] = df['Season_Year'] - 1

        period_stats = []
        list_min_tmin, list_min_tmax, list_max_tmin, list_max_tmax = [], [], [], []
        count_total, count_used_min_tmin, count_used_min_tmax, count_used_max_tmin, count_used_max_tmax = 0, 0, 0, 0, 0
        unique_seasons = sorted(df['Season_Year'].unique(), reverse=True)

        for year in unique_seasons:
            season_df = df[df['Season_Year'] == year]
            if season_df.empty: continue
            count_total += 1
            def get_thresh_count(elem):
                t_val = thresh_params[elem]['val']
                t_dir = thresh_params[elem]['dir']
                vals = season_df[season_df['ELEMENT'] == elem]['DATA_VALUE']
                if vals.empty or t_val is None or t_val == "": return 0
                if t_dir == 'lte': return int((vals <= float(t_val)).sum())
                else: return int((vals >= float(t_val)).sum())
            s_tmin_df = season_df[season_df['ELEMENT'] == 'TMIN']
            s_tmax_df = season_df[season_df['ELEMENT'] == 'TMAX']
            min_tmin_obj = get_val_and_dates(s_tmin_df, 'min')
            max_tmin_obj = get_val_and_dates(s_tmin_df, 'max')
            min_tmax_obj = get_val_and_dates(s_tmax_df, 'min')
            max_tmax_obj = get_val_and_dates(s_tmax_df, 'max')
            count_djf_tmin = season_df[(season_df['DATE'].dt.month.isin([12, 1, 2])) & (season_df['ELEMENT'] == 'TMIN')].shape[0]
            count_djf_tmax = season_df[(season_df['DATE'].dt.month.isin([12, 1, 2])) & (season_df['ELEMENT'] == 'TMAX')].shape[0]
            count_jja_tmin = season_df[(season_df['DATE'].dt.month.isin([6, 7, 8])) & (season_df['ELEMENT'] == 'TMIN')].shape[0]
            count_jja_tmax = season_df[(season_df['DATE'].dt.month.isin([6, 7, 8])) & (season_df['ELEMENT'] == 'TMAX')].shape[0]
            season_cdt1 = ((hemisphere == 'north' and period_mode == 'p1') or (hemisphere == 'south' and period_mode == 'p2'))
            season_cdt2 = ((hemisphere == 'north' and period_mode == 'p2') or (hemisphere == 'south' and period_mode == 'p1'))
            
            valid_min_tmin = True
            if season_cdt2: valid_min_tmin = False
            if hemisphere == 'north' and period_mode == 'p1' and count_djf_tmin < 60: valid_min_tmin = False
            elif hemisphere == 'south' and period_mode == 'p2' and count_jja_tmin < 60: valid_min_tmin = False
            if valid_min_tmin and min_tmin_obj['val'] != '-': list_min_tmin.append(min_tmin_obj['val']); count_used_min_tmin += 1
            
            valid_min_tmax = True
            if season_cdt2: valid_min_tmax = False
            if hemisphere == 'north' and period_mode == 'p1' and count_djf_tmax < 60: valid_min_tmax = False
            elif hemisphere == 'south' and period_mode == 'p2' and count_jja_tmax < 60: valid_min_tmax = False
            if valid_min_tmax and min_tmax_obj['val'] != '-': list_min_tmax.append(min_tmax_obj['val']); count_used_min_tmax += 1
            
            valid_max_tmin = True
            if season_cdt1: valid_max_tmin = False
            if hemisphere == 'north' and period_mode == 'p2' and count_jja_tmin < 60: valid_max_tmin = False
            elif hemisphere == 'south' and period_mode == 'p1' and count_djf_tmin < 60: valid_max_tmin = False
            if valid_max_tmin and max_tmin_obj['val'] != '-': list_max_tmin.append(max_tmin_obj['val']); count_used_max_tmin += 1
            
            valid_max_tmax = True
            if season_cdt1: valid_max_tmax = False
            if hemisphere == 'north' and period_mode == 'p2' and count_jja_tmax < 60: valid_max_tmax = False
            elif hemisphere == 'south' and period_mode == 'p1' and count_djf_tmax < 60: valid_max_tmax = False
            if valid_max_tmax and max_tmax_obj['val'] != '-': list_max_tmax.append(max_tmax_obj['val']); count_used_max_tmax += 1
            
            # Calculate Counts
            count_actual = season_df['DATE'].nunique()
            count_expected = 0
            try:
                if period_mode == 'p1':
                    s_date = datetime(year, 7, 16)
                    e_date = datetime(year + 1, 7, 15)
                else: 
                    # Default p2 or others: Jan 16 Y to Jan 15 Y+1
                    s_date = datetime(year, 1, 16)
                    e_date = datetime(year + 1, 1, 15)
                count_expected = (e_date - s_date).days + 1
            except: pass

            period_stats.append({
                'range': f"{year}-{year+1}",
                'count_actual': count_actual,
                'count_expected': count_expected,
                'min_tmin': min_tmin_obj, 'max_tmin': max_tmin_obj, 'min_tmax': min_tmax_obj, 'max_tmax': max_tmax_obj,
                'cnt_tmin': get_thresh_count('TMIN'), 'cnt_tavg': get_thresh_count('TAVG'), 'cnt_tmax': get_thresh_count('TMAX')
            })

        def get_avg_data(lst, used_count):
            avg = float(round(sum(lst) / len(lst), 2)) if lst else '-'
            return {'val': avg, 'used': used_count, 'total': count_total}

        period_summary = {'avg_min_tmin': get_avg_data(list_min_tmin, count_used_min_tmin), 'avg_min_tmax': get_avg_data(list_min_tmax, count_used_min_tmax), 'avg_max_tmin': get_avg_data(list_max_tmin, count_used_max_tmin), 'avg_max_tmax': get_avg_data(list_max_tmax, count_used_max_tmax)}

        # Refactor: Pivot for Record List (One row per Date)
        # We always fetch TMIN, TAVG, TMAX now for the list, ignoring separate element filters for display
        records_df = df[df['ELEMENT'].isin(['TMIN', 'TAVG', 'TMAX'])].copy()
        
        # Pivot: 
        # Index: DATE, Columns: ELEMENT, Values: DATA_VALUE
        if not records_df.empty:
            pivoted_df = records_df.pivot(index='DATE', columns='ELEMENT', values='DATA_VALUE')
        else:
            pivoted_df = pd.DataFrame(columns=['TMIN', 'TAVG', 'TMAX'])

        # Ensure all columns exist
        for col in ['TMIN', 'TAVG', 'TMAX']:
            if col not in pivoted_df.columns:
                pivoted_df[col] = np.nan

        # Reset index to make DATE a column again
        pivoted_df = pivoted_df.reset_index()

        # Sorting logic
        # sort_by can be DATE, TMIN, TAVG, TMAX
        target_col = sort_by
        if target_col == 'ID': target_col = 'DATE' # Fallback if someone tries to sort by ID which effectively doesn't change much for single station
        
        is_asc = (sort_dir == 'asc')
        
        # Sort
        if target_col in pivoted_df.columns:
            pivoted_df = pivoted_df.sort_values(by=target_col, ascending=is_asc, na_position='last')
        
        # Limit
        pivoted_df = pivoted_df.head(record_limit)
        
        # Format Date
        pivoted_df['DATE'] = pivoted_df['DATE'].dt.strftime('%Y-%m-%d')
        
        # Convert to records (list of dicts)
        # Result: [{'DATE': '...', 'TMIN': x, 'TAVG': y, 'TMAX': z}, ...]
        records_list = pivoted_df.to_dict(orient='records')

        multi_stations = []
        if has_advanced_access:
            center_mode = req.get('center_mode', 'station')
            center_lat_input = req.get('center_lat')
            center_lon_input = req.get('center_lon')
            max_dist = req.get('max_dist', 'no_limit')
            country_limit = req.get('country_limit', '').strip().upper()
            lat_min = req.get('lat_min')
            lat_max = req.get('lat_max')
            lon_min = req.get('lon_min')
            lon_max = req.get('lon_max')
            elev_min = req.get('elev_min')
            elev_max = req.get('elev_max')
            wban_limit = req.get('wban_limit', 'no')
            multi_sort_by = req.get('multi_sort_by', 'distance')
            multi_sort_dir = req.get('multi_sort_dir', 'asc')
            multi_limit = int(req.get('multi_limit', 5))

            st_df = GHCND_DF if source == 'GHCND' else GSOD_DF
            if center_mode == 'coords':
                try: center_lat, center_lon = float(center_lat_input), float(center_lon_input)
                except: center_lat, center_lon = 0, 0
            else:
                station_row = st_df[st_df['ID'] == station_id]
                if not station_row.empty: center_lat, center_lon = station_row.iloc[0]['LAT'], station_row.iloc[0]['LON']
                else: center_lat, center_lon = 0, 0

            if st_df is not None and not pd.isna(center_lat) and not pd.isna(center_lon):
                temp_st_df = st_df.copy()
                include_opposite_lat = req.get('include_opposite_lat', False)
                
                if lat_min and lat_max:
                    if include_opposite_lat:
                         # Logic: (LAT >= lat_min & LAT <= lat_max) OR (LAT >= -lat_max & LAT <= -lat_min)
                         # Note: -lat_max is the smaller value in the negative range, -lat_min is the larger.
                         # Example: 30 to 45. Negative: -45 to -30.
                         l_min, l_max = float(lat_min), float(lat_max)
                         temp_st_df = temp_st_df[
                             ((temp_st_df['LAT'] >= l_min) & (temp_st_df['LAT'] <= l_max)) |
                             ((temp_st_df['LAT'] >= -l_max) & (temp_st_df['LAT'] <= -l_min))
                         ]
                    else:
                        temp_st_df = temp_st_df[(temp_st_df['LAT'] >= float(lat_min)) & (temp_st_df['LAT'] <= float(lat_max))]
                elif lat_min: temp_st_df = temp_st_df[temp_st_df['LAT'] >= float(lat_min)]
                elif lat_max: temp_st_df = temp_st_df[temp_st_df['LAT'] <= float(lat_max)]
                if lon_min: temp_st_df = temp_st_df[temp_st_df['LON'] >= float(lon_min)]
                if lon_max: temp_st_df = temp_st_df[temp_st_df['LON'] <= float(lon_max)]
                if elev_min: temp_st_df = temp_st_df[temp_st_df['ELEV'] >= float(elev_min)]
                if elev_max: temp_st_df = temp_st_df[temp_st_df['ELEV'] <= float(elev_max)]
                if country_limit:
                    if source == 'GHCND': temp_st_df = temp_st_df[temp_st_df['ID'].str[:2].str.upper() == country_limit]
                    else: temp_st_df = temp_st_df[temp_st_df['CTRY'].str.upper() == country_limit]
                if source == 'GSOD' and wban_limit == '99999': temp_st_df = temp_st_df[temp_st_df['WBAN'] == '99999']

                temp_st_df['DIST'] = haversine_vectorized(center_lat, center_lon, temp_st_df['LAT'], temp_st_df['LON'])
                if max_dist != 'no_limit':
                    limit_km = float(max_dist)
                    temp_st_df = temp_st_df[temp_st_df['DIST'] <= limit_km]
                
                ms_sort_asc = (multi_sort_dir == 'asc')
                
                # Add explicit COUNTRY column for sorting
                if source == 'GHCND':
                    temp_st_df['COUNTRY_CODE'] = temp_st_df['ID'].str[:2].str.upper()
                else:
                    temp_st_df['COUNTRY_CODE'] = temp_st_df['CTRY'].str.upper()

                sort_map = {'id': 'ID', 'lat': 'LAT', 'lon': 'LON', 'elev': 'ELEV', 'dist': 'DIST', 'country': 'COUNTRY_CODE', 'name': 'NAME'}
                sort_key = sort_map.get(multi_sort_by, 'DIST')
                
                # Sort with NaNs always at the bottom regardless of direction
                # We do this by splitting the dataframe into valid and invalid parts
                is_valid = temp_st_df[sort_key].notna()
                # If it's a string column, also check for truly empty values like '', ' ', 'None', '-'
                if temp_st_df[sort_key].dtype == object:
                    s_clean = temp_st_df[sort_key].astype(str).str.strip()
                    is_valid &= (s_clean != '') & (s_clean.str.lower() != 'none') & (s_clean != '-')
                    # For NAME column, must contain at least one English alphabet
                    if sort_key == 'NAME':
                        is_valid &= s_clean.str.contains(r'[a-zA-Z]', regex=True)

                valid_df = temp_st_df[is_valid].sort_values(by=sort_key, ascending=ms_sort_asc)
                invalid_df = temp_st_df[~is_valid]
                
                temp_st_df = pd.concat([valid_df, invalid_df]).head(multi_limit)
                
                for _, row in temp_st_df.iterrows():
                    c_name = row['CTRY'] if source == 'GSOD' else row['ID'][:2]
                    # Convert NaN values to None (which becomes null in JSON)
                    lat_val = float(row['LAT']) if pd.notna(row['LAT']) else None
                    lon_val = float(row['LON']) if pd.notna(row['LON']) else None
                    elev_val = float(row['ELEV']) if pd.notna(row['ELEV']) else None
                    dist_val = round(float(row['DIST']), 2) if pd.notna(row['DIST']) else None
                    multi_stations.append({
                        'id': str(row['ID']), 'name': str(row['NAME']) if pd.notna(row['NAME']) else '', 
                        'lat': lat_val, 'lon': lon_val, 'elev': elev_val,
                        'dist': dist_val, 'country': str(c_name) if pd.notna(c_name) else ''
                    })

        response_data = {
            'status': 'success', 
            'stats': stats, 
            'period_stats': period_stats, 
            'period_summary': period_summary, 
            'records': records_list, 
            'multi_stations': multi_stations
        }
        # Clean NaN values before JSON serialization
        response_data = clean_nan_for_json(response_data)
        return jsonify(response_data)
    except Exception as e:
        import traceback; traceback.print_exc()
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/get_multi_stats', methods=['POST'])
@advanced_permission_required 
@csrf.exempt
def get_multi_stats():
    try:
        req = request.json
        station_ids = req.get('station_ids', [])
        if not isinstance(station_ids, list):
            return jsonify({'status': 'error', 'message': 'station_ids must be a list'}), 400
        station_ids = [str(s).strip() for s in station_ids if str(s).strip()]
        MAX_MULTI_IDS = 10000
        if len(station_ids) > MAX_MULTI_IDS:
            return jsonify({'status': 'error', 'message': f'Max {MAX_MULTI_IDS} stations allowed'}), 400
        source = req.get('source', 'GHCND')
        metric = req.get('metric', 'avg_tavg')
        start_date = req.get('start_date')
        end_date = req.get('end_date')
        month_filter = req.get('month_filter')
        day_filter = req.get('day_filter', '0')
        period_mode = req.get('period')
        
        # Get Thresholds (Handle empty strings safely - preserve None if empty)
        def get_t_val(key):
            v = req.get(key)
            if v is None or str(v).strip() == "": return None
            try: return float(v)
            except: return None

        t_val_tmin = get_t_val('tmin_val')
        t_dir_tmin = req.get('tmin_dir')
        t_val_tavg = get_t_val('tavg_val')
        t_dir_tavg = req.get('tavg_dir')
        t_val_tmax = get_t_val('tmax_val')
        t_dir_tmax = req.get('tmax_dir')

        results = []

        def process_station(sid):
            s_name = "Unknown"
            lat, lon, elev = '-', '-', '-'
            # Get Station Name and Info
            if source == 'GHCND':
                row = GHCND_DF[GHCND_DF['ID'] == sid]
                if not row.empty:
                    s_name = row.iloc[0]['NAME']
                    lat, lon, elev = row.iloc[0]['LAT'], row.iloc[0]['LON'], row.iloc[0]['ELEV']
            else:
                row = GSOD_DF[GSOD_DF['ID'] == sid]
                if not row.empty:
                    s_name = row.iloc[0]['NAME']
                    lat, lon, elev = row.iloc[0]['LAT'], row.iloc[0]['LON'], row.iloc[0]['ELEV']

            # Fetch Data
            df = fetch_and_clean_data(source, sid, start_date, end_date)
            if df.empty: return {'id': sid, 'name': s_name, 'lat': lat, 'lon': lon, 'elev': elev, 'val': '-', 'dates': []}

            # Filter Month
            if month_filter and month_filter != "0":
                if month_filter == "winter_3": df = df[df['DATE'].dt.month.isin([12, 1, 2])]
                elif month_filter == "summer_3": df = df[df['DATE'].dt.month.isin([6, 7, 8])]
                else: 
                    df = df[df['DATE'].dt.month == int(month_filter)]
                    # Apply day filter if specified and month is a single month (not winter_3 or summer_3)
                    if day_filter and day_filter != "0":
                        df = df[df['DATE'].dt.day == int(day_filter)]

            val = '-'
            dates_info = []
            
            # --- METRIC LOGIC WITH TYPE CASTING ---
            
            # 1. Monthly Average Extremes (Check first to avoid prefix conflicts with min_/max_)
            if metric.startswith('min_monthly_avg_') or metric.startswith('max_monthly_avg_'):
                is_min = metric.startswith('min_')
                elem = metric.split('_')[3].upper()
                
                # Use the already filtered 'df' to respect UI selections (Month/Day filters)
                sub = df[df['ELEMENT'] == elem]
                
                if not sub.empty:
                    # Group by Calendar Month (1-12) and calculate mean across all selected years in 'df'
                    monthly_avg = sub.groupby(sub['DATE'].dt.month)['DATA_VALUE'].mean()
                    
                    if not monthly_avg.empty:
                        target_val = monthly_avg.min() if is_min else monthly_avg.max()
                        val = float(round(target_val, 2))
                        
                        # Identify calendar months matching target_val (use epsilon for floats)
                        matching_mask = np.isclose(monthly_avg, target_val, atol=1e-5)
                        matching_months = sorted(monthly_avg[matching_mask].index.tolist())
                        
                        month_map = {
                            1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun',
                            7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'
                        }
                        dates_info = [month_map[m] for m in matching_months]
                    else:
                        val = '-'
                else:
                    val = '-'

            # 2. Averages
            elif metric.startswith('avg_'):
                elem = metric.split('_')[1].upper()
                sub = df[df['ELEMENT'] == elem]
                if not sub.empty: 
                    # Convert numpy float to python float
                    val = float(round(sub['DATA_VALUE'].mean(), 2))
            
            # 3. Minimums
            elif metric.startswith('min_'):
                elem = metric.split('_')[1].upper()
                sub = df[df['ELEMENT'] == elem]
                if not sub.empty: 
                    # Convert numpy float to python float
                    min_val = sub['DATA_VALUE'].min()
                    val = float(min_val)
                    dates_info = sub[sub['DATA_VALUE'] == min_val]['DATE'].dt.strftime('%Y-%m-%d').tolist()
            
            # 4. Maximums (Value)
            elif metric.startswith('max_') and 'days' not in metric:
                elem = metric.split('_')[1].upper()
                sub = df[df['ELEMENT'] == elem]
                if not sub.empty: 
                    # Convert numpy float to python float
                    max_val = sub['DATA_VALUE'].max()
                    val = float(max_val)
                    dates_info = sub[sub['DATA_VALUE'] == max_val]['DATE'].dt.strftime('%Y-%m-%d').tolist()
            
            # 5. Maximum Days per Period (Count)
            elif metric.startswith('max_days_'):
                elem = metric.split('_')[2].upper()
                sub = df[df['ELEMENT'] == elem]
                
                if not sub.empty:
                    sub = sub.copy()
                    sub['Season_Year'] = sub['DATE'].dt.year
                    
                    # Apply Season Year Logic
                    if period_mode == 'p1':
                        mask = (sub['DATE'].dt.month < 7) | ((sub['DATE'].dt.month == 7) & (sub['DATE'].dt.day < 16))
                        sub.loc[mask, 'Season_Year'] = sub['Season_Year'] - 1
                    else:
                        mask = (sub['DATE'].dt.month == 1) & (sub['DATE'].dt.day < 16)
                        sub.loc[mask, 'Season_Year'] = sub['Season_Year'] - 1
                    
                    # Determine Threshold
                    curr_t_val, curr_t_dir = None, 'lte'
                    if elem == 'TMIN': curr_t_val, curr_t_dir = t_val_tmin, t_dir_tmin
                    elif elem == 'TAVG': curr_t_val, curr_t_dir = t_val_tavg, t_dir_tavg
                    elif elem == 'TMAX': curr_t_val, curr_t_dir = t_val_tmax, t_dir_tmax
                    
                    if curr_t_val is not None:
                        # Filter matches
                        if curr_t_dir == 'lte':
                            sub['is_match'] = sub['DATA_VALUE'] <= curr_t_val
                        else:
                            sub['is_match'] = sub['DATA_VALUE'] >= curr_t_val
                        
                        # Count matches per season
                        counts = sub[sub['is_match']].groupby('Season_Year').size()
                        
                        if not counts.empty:
                            val = int(counts.max()) 
                            top_seasons = counts[counts == counts.max()].index.tolist()
                            if top_seasons:
                                dates_info = [f"{int(y)}-{int(y)+1}" for y in top_seasons]
                        else:
                            val = 0
                    else:
                        val = '-' # No threshold provided
                else:
                    val = 0

            # 6. Total Days across all records (Count matching threshold)
            elif metric.startswith('total_days_'):
                elem = metric.split('_')[2].upper()
                sub = df[df['ELEMENT'] == elem]
                
                if not sub.empty:
                    # Determine Threshold
                    curr_t_val, curr_t_dir = None, 'lte'
                    if elem == 'TMIN': curr_t_val, curr_t_dir = t_val_tmin, t_dir_tmin
                    elif elem == 'TAVG': curr_t_val, curr_t_dir = t_val_tavg, t_dir_tavg
                    elif elem == 'TMAX': curr_t_val, curr_t_dir = t_val_tmax, t_dir_tmax
                    
                    if curr_t_val is not None:
                        # Filter matches
                        if curr_t_dir == 'lte':
                            match_count = (sub['DATA_VALUE'] <= curr_t_val).sum()
                        else:
                            match_count = (sub['DATA_VALUE'] >= curr_t_val).sum()
                        val = int(match_count)
                    else:
                        val = '-' # No threshold
                    
                    dates_info = [] # No dates for total sum
                else:
                    val = 0
                    dates_info = []

            # 7. Total days with valid value (non-null)
            elif metric.startswith('valid_days_'):
                elem = metric.split('_')[2].upper()
                sub = df[df['ELEMENT'] == elem]
                if not sub.empty:
                    val = int(len(sub))
                else:
                    val = 0
                dates_info = []

            return {'id': sid, 'name': s_name, 'lat': lat, 'lon': lon, 'elev': elev, 'val': val, 'dates': dates_info}

        # Run Parallel Processing
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(process_station, station_ids))

        # Clean NaN values before JSON serialization
        response_data = {'status': 'success', 'results': clean_nan_for_json(results)}
        return jsonify(response_data)

    except Exception as e:
        # Print error to terminal for easier debugging
        print("Multi Stats Error:", str(e))
        return jsonify({'status': 'error', 'message': str(e)})

@app.route('/clear_visitor_db', methods=['POST'])
@admin_required
def clear_visitor_db():
    try:
        db.session.query(Visitor).delete()
        db.session.commit()
        return redirect(url_for('visitor_stats'))
    except Exception as e:
        return f"Error clearing DB: {e}"

@app.route('/visitor_stats')
@admin_required
def visitor_stats():
    visits = Visitor.query.order_by(Visitor.timestamp.desc()).limit(50).all()
    total_visits = Visitor.query.count()
    def get_aggregated_stats(column):
        return db.session.query(column, func.count(Visitor.id).label('count')).group_by(column).order_by(func.count(Visitor.id).desc()).all()
    analytics = {
        'Users': get_aggregated_stats(Visitor.username), 'IPs': get_aggregated_stats(Visitor.ip_address),
        'Devices': get_aggregated_stats(Visitor.device_type), 'OS': get_aggregated_stats(Visitor.os),
        'Browsers': get_aggregated_stats(Visitor.browser), 'Locations': get_aggregated_stats(Visitor.country)
    }
    return render_template('stats.html', visits=visits, count=total_visits, analytics=analytics)

@app.route('/manage_users')
@admin_required
def manage_users():
    search_query = request.args.get('q', '').strip()
    if search_query:
        users = User.query.filter(User.username.contains(search_query)).all()
    else:
        users = User.query.all()
    return render_template('manage_users.html', users=users, search_query=search_query)

@app.route('/user/add', methods=['POST'])
@admin_required
def add_user():
    username = request.form.get('username')
    password = request.form.get('password')
    user_level = request.form.get('user_level')
    is_admin = True if request.form.get('is_admin') else False

    if User.query.filter_by(username=username).first():
        flash('Username already exists.')
    else:
        new_user = User(username=username, is_admin=is_admin, user_level=user_level)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        flash(f'User {username} added successfully.')
    return redirect(url_for('manage_users'))

@app.route('/user/edit/<int:user_id>', methods=['GET', 'POST'])
@admin_required
def edit_user(user_id):
    user = User.query.get_or_404(user_id)
    if request.method == 'POST':
        new_username = request.form.get('username')
        new_password = request.form.get('password')
        user.user_level = request.form.get('user_level')
        user.is_admin = True if request.form.get('is_admin') else False
        
        if new_username != user.username and User.query.filter_by(username=new_username).first():
            flash('Username already exists.')
            return redirect(url_for('edit_user', user_id=user.id))
        
        user.username = new_username
        if new_password: user.set_password(new_password)
        db.session.commit()
        flash(f'User {user.username} updated.')
        return redirect(url_for('manage_users'))
    return render_template('edit_user.html', user=user)

@app.route('/user/delete/<int:user_id>', methods=['POST'])
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.id == current_user.id:
        flash("You cannot delete your own account while logged in.")
        return redirect(url_for('manage_users'))
    db.session.delete(user)
    db.session.commit()
    flash(f'User {user.username} deleted.')
    return redirect(url_for('manage_users'))

@app.route('/year_stats')
@auth_or_visitor_required
def year_stats():
    station_id = request.args.get('station_id')
    source = request.args.get('source', 'GHCND')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    # Thresholds
    tmin_val = request.args.get('tmin_val')
    tmin_dir = request.args.get('tmin_dir')
    tavg_val = request.args.get('tavg_val')
    tavg_dir = request.args.get('tavg_dir')
    tmax_val = request.args.get('tmax_val')
    tmax_dir = request.args.get('tmax_dir')
    
    thresh_params = {'TMIN': {'val': tmin_val, 'dir': tmin_dir}, 'TAVG': {'val': tavg_val, 'dir': tavg_dir}, 'TMAX': {'val': tmax_val, 'dir': tmax_dir}}
    
    custom_avg_tmin = request.args.get('custom_avg_tmin')
    custom_avg_tavg = request.args.get('custom_avg_tavg')
    custom_avg_tmax = request.args.get('custom_avg_tmax')
    
    station_name = station_id
    station_info = {'lat': '-', 'lon': '-', 'elev': '-'}
    try:
        st_df = GHCND_DF if source == 'GHCND' else GSOD_DF
        if st_df is not None:
             row = st_df[st_df['ID'] == station_id]
             if not row.empty: 
                 station_name = f"{station_id} - {row.iloc[0]['NAME']}"
                 station_info['lat'] = row.iloc[0]['LAT']
                 station_info['lon'] = row.iloc[0]['LON']
                 station_info['elev'] = row.iloc[0]['ELEV']
    except: pass

    df = fetch_and_clean_data(source, station_id, start_date, end_date)
    
    if df.empty:
        return render_template('year_stats.html', tables=[], station_name=station_name, error_msg=get_translation('messages.station_data_error'))

    month_names = {
        0: get_translation('months.full_year'),
        1: get_translation('months.january'), 2: get_translation('months.february'), 3: get_translation('months.march'),
        4: get_translation('months.april'), 5: get_translation('months.may'), 6: get_translation('months.june'),
        7: get_translation('months.july'), 8: get_translation('months.august'), 9: get_translation('months.september'),
        10: get_translation('months.october'), 11: get_translation('months.november'), 12: get_translation('months.december')
    }

    results = []

    def get_val_and_dates(sub_df, method='min'):
        if sub_df.empty: return {'val': '-', 'dates': []}
        target_val = sub_df['DATA_VALUE'].min() if method == 'min' else sub_df['DATA_VALUE'].max()
        matches = sub_df[sub_df['DATA_VALUE'] == target_val]['DATE']
        return {'val': float(target_val), 'dates': matches.dt.strftime('%Y-%m-%d').tolist()}

    year_order = list(range(1, 13)) + [0]
    for m in year_order:
        # Filter
        if m == 0:
            sub_df = df.copy()
        else:
            sub_df = df[df['DATE'].dt.month == m].copy()
            
        stats = {}
        # Calc stats for TMIN, TAVG, TMAX
        for elem, custom_avg in [('TMIN', custom_avg_tmin), ('TAVG', custom_avg_tavg), ('TMAX', custom_avg_tmax)]:
            elem_df = sub_df[sub_df['ELEMENT'] == elem]
            if elem_df.empty:
                stats[elem] = {'min': {'val': '-', 'dates':[]}, 'avg': '-', 'max': {'val': '-', 'dates':[]}, 'count_match': 0, 'explosive_power': '-', 'total': 0, 'total_valid': 0}
            else:
                natural_avg = elem_df['DATA_VALUE'].mean()
                target_mean = float(custom_avg) if (custom_avg is not None and custom_avg != "") else natural_avg
                variance = ((elem_df['DATA_VALUE'] - target_mean) ** 2).mean()
                explosive_power = float(round(np.sqrt(variance), 2))
                
                t_val = thresh_params[elem]['val']
                t_dir = thresh_params[elem]['dir']
                count_match = 0
                if t_val is not None and t_val != "":
                    if t_dir == 'lte': count_match = int((elem_df['DATA_VALUE'] <= float(t_val)).sum())
                    else: count_match = int((elem_df['DATA_VALUE'] >= float(t_val)).sum())
                
                stats[elem] = {
                    'min': get_val_and_dates(elem_df, 'min'),
                    'avg': float(round(natural_avg, 2)),
                    'max': get_val_and_dates(elem_df, 'max'),
                    'count_match': count_match,
                    'explosive_power': explosive_power,
                    'total': int(len(elem_df)),
                    'total_valid': int(len(elem_df))
                }
        
        results.append({'month_idx': m, 'month_name': month_names.get(m, str(m)), 'stats': stats})

    # Sorting Logic
    sort_row = request.args.get('sort_row')
    if not sort_row: sort_row = 'TAVG' # Default Row
    
    sort_col = request.args.get('sort_col')
    if not sort_col: sort_col = 'avg' # Default Col
    
    sort_order = request.args.get('sort_order', 'asc')

    if sort_row and sort_col:
        full_year_res = [r for r in results if r['month_idx'] == 0]
        monthly_res = [r for r in results if r['month_idx'] != 0]

        def get_val(item):
            try:
                elem_stats = item['stats'].get(sort_row)
                if not elem_stats: return None
                val = elem_stats[sort_col]['val'] if sort_col in ['min', 'max'] else elem_stats.get(sort_col)
                if val == '-' or val is None: return None
                return float(val)
            except: return None

        valid_res = []
        invalid_res = []
        
        for item in monthly_res:
            v = get_val(item)
            if v is not None: valid_res.append((v, item))
            else: invalid_res.append(item)
        
        valid_res.sort(key=lambda x: x[0], reverse=(sort_order == 'desc'))
        sorted_valid_items = [x[1] for x in valid_res]
        
        results = sorted_valid_items + invalid_res + full_year_res

    return render_template('year_stats.html', tables=results, station_name=station_name, station_info=station_info)

@app.route('/date_details')
@auth_or_visitor_required
def date_details():
    station_id = request.args.get('station_id')
    source = request.args.get('source', 'GHCND')
    query_type = request.args.get('type') # 'period' or 'list'
    value = request.args.get('value')
    period_mode = request.args.get('period_mode', 'p1')
    
    # Optional: fetch station name for display
    station_name = station_id
    try:
        if source == 'GHCND':
            row = GHCND_DF[GHCND_DF['ID'] == station_id]
            if not row.empty: station_name = f"{station_id} - {row.iloc[0]['NAME']}"
        else:
            row = GSOD_DF[GSOD_DF['ID'] == station_id]
            if not row.empty: station_name = f"{station_id} - {row.iloc[0]['NAME']}"
    except: pass
    
    # NEW: Fetch Station Info (Lat, Lon, Elev)
    station_info = {'lat': '-', 'lon': '-', 'elev': '-'}
    try:
        if source == 'GHCND':
            row = GHCND_DF[GHCND_DF['ID'] == station_id]
            if not row.empty:
                station_info['lat'] = row.iloc[0]['LAT']
                station_info['lon'] = row.iloc[0]['LON']
                station_info['elev'] = row.iloc[0]['ELEV']
        else:
            row = GSOD_DF[GSOD_DF['ID'] == station_id]
            if not row.empty:
                station_info['lat'] = row.iloc[0]['LAT']
                station_info['lon'] = row.iloc[0]['LON']
                station_info['elev'] = row.iloc[0]['ELEV']
    except: pass
    
    # Thresholds
    thresholds = {
        'TMIN': {'val': request.args.get('tmin_val'), 'dir': request.args.get('tmin_dir')},
        'TAVG': {'val': request.args.get('tavg_val'), 'dir': request.args.get('tavg_dir')},
        'TMAX': {'val': request.args.get('tmax_val'), 'dir': request.args.get('tmax_dir')}
    }

    df = pd.DataFrame()
    
    # 1. Determine Start/End dates based on type
    req_start = None
    req_end = None
    target_dates = []

    if query_type == 'period':
        # value expected format "YYYY-YYYY" e.g. "1968-1969"
        try:
            year_part = int(value.split('-')[0])
            if period_mode == 'p1': # July 16 Y to July 15 Y+1
                req_start = f"{year_part}-07-16"
                req_end = f"{year_part+1}-07-15"
            else: # Jan 16 Y to Jan 15 Y+1
                req_start = f"{year_part}-01-16"
                req_end = f"{year_part+1}-01-15"
        except: pass
        
    elif query_type == 'list':
        # value expected: "YYYY-MM-DD,YYYY-MM-DD..."
        try:
            target_dates = value.split(',')
            # Find min/max to optimize fetch
            dt_objs = [datetime.strptime(d.strip(), '%Y-%m-%d') for d in target_dates if d.strip()]
            if dt_objs:
                req_start = min(dt_objs).strftime('%Y-%m-%d')
                req_end = max(dt_objs).strftime('%Y-%m-%d')
        except: pass

    # 2. Fetch Data
    if req_start and req_end:
        df = fetch_and_clean_data(source, station_id, req_start, req_end)
    
    if df.empty:
        return render_template('date_details.html', records=[], station_name=station_name, 
                               info_text=f"{query_type.capitalize()}: {value}",
                               error_msg=get_translation('messages.station_data_error'))

    # 3. Filter specific dates if 'list'
    if query_type == 'list' and not df.empty and target_dates:
        df['DATE_STR'] = df['DATE'].dt.strftime('%Y-%m-%d')
        df = df[df['DATE_STR'].isin(target_dates)].drop(columns=['DATE_STR'])

    # 4. Pivot (Date x Elements)
    records_list = []
    if not df.empty:
        df = df[df['ELEMENT'].isin(['TMIN', 'TAVG', 'TMAX'])].copy()
        pivot = df.pivot(index='DATE', columns='ELEMENT', values='DATA_VALUE')
        for col in ['TMIN', 'TAVG', 'TMAX']:
            if col not in pivot.columns: pivot[col] = np.nan
        pivot = pivot.reset_index()
        pivot = pivot.sort_values('DATE')
        pivot['DATE'] = pivot['DATE'].dt.strftime('%Y-%m-%d')
        records_list = pivot.to_dict(orient='records')

    # 5. Calculate Consecutive Streaks
    streaks_data = {}
    expected_total = None

    if query_type == 'period' and req_start and req_end:
        try:
            d1 = datetime.strptime(req_start, '%Y-%m-%d')
            d2 = datetime.strptime(req_end, '%Y-%m-%d')
            expected_total = (d2 - d1).days + 1
        except: pass

    if not df.empty:
        # Helper to find streaks
        def get_top_streaks(col, val_str, direction):
            if not val_str: return []
            try:
                thresh = float(val_str)
            except:
                return []
            
            # Filter
            # direction values are 'lte' (<=) or 'gte' (>=)
            if direction == 'lte':
                mask = (df['ELEMENT'] == col) & (df['DATA_VALUE'] <= thresh)
            elif direction == 'gte':
                mask = (df['ELEMENT'] == col) & (df['DATA_VALUE'] >= thresh)
            else:
                return []
            
            # Find consecutive groups
            matches = df[mask].sort_values('DATE')
            if matches.empty: return []
            
            # Calculate difference between consecutive dates
            matches['grp'] = (matches['DATE'] - pd.to_timedelta(matches['DATE'].groupby((matches['DATE'].diff() != pd.Timedelta('1 days')).cumsum()).cumcount(), unit='d'))
            
            streaks = matches.groupby('grp').agg(
                start_date=('DATE', 'min'),
                end_date=('DATE', 'max'),
                count=('DATE', 'count')
            ).reset_index(drop=True)
            
            # Sort by count desc
            streaks = streaks.sort_values('count', ascending=False).head(10)
            
            # Format
            result = []
            for _, row in streaks.iterrows():
                s = row['start_date'].strftime('%Y-%m-%d')
                e = row['end_date'].strftime('%Y-%m-%d')
                c = row['count']
                
                to_str = get_translation('params.to')
                if s == e:
                    day_text = get_translation('details_page.day', count=int(c))
                    result.append(f"{s} ({day_text})")
                else:
                    days_text = get_translation('details_page.days', count=int(c))
                    result.append(f"{s} {to_str} {e} ({days_text})")
            return result

        streaks_data['TMIN'] = get_top_streaks('TMIN', thresholds['TMIN']['val'], thresholds['TMIN']['dir'])
        streaks_data['TAVG'] = get_top_streaks('TAVG', thresholds['TAVG']['val'], thresholds['TAVG']['dir'])
        streaks_data['TMAX'] = get_top_streaks('TMAX', thresholds['TMAX']['val'], thresholds['TMAX']['dir'])

    # Render template
    return render_template('date_details.html', 
                           records=records_list, 
                           station_name=station_name, 
                           query_type=query_type,
                           value=value,
                           streaks=streaks_data,
                           thresholds=thresholds,
                           expected_total=expected_total,
                           station_info=station_info,
                           period_mode=period_mode)

@app.route('/period_stats')
@auth_or_visitor_required
def period_stats():
    try:
        station_id = request.args.get('station_id')
        source = request.args.get('source', 'GHCND')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        month_filter = request.args.get('month_filter')
        day_filter = request.args.get('day_filter', '0')
        period_mode = request.args.get('period', 'p1')
        hemisphere = request.args.get('hemisphere', 'north')
        
        thresh_params = {
            'TMIN': {'val': request.args.get('tmin_val'), 'dir': request.args.get('tmin_dir')},
            'TAVG': {'val': request.args.get('tavg_val'), 'dir': request.args.get('tavg_dir')},
            'TMAX': {'val': request.args.get('tmax_val'), 'dir': request.args.get('tmax_dir')}
        }

        # Station Name and Info
        station_name = station_id
        station_info = {'lat': '-', 'lon': '-', 'elev': '-'}
        st_df = GHCND_DF if source == 'GHCND' else GSOD_DF
        if st_df is not None:
            row = st_df[st_df['ID'] == station_id]
            if not row.empty:
                station_name = f"{station_id} - {row.iloc[0]['NAME']}"
                station_info['lat'] = row.iloc[0]['LAT']
                station_info['lon'] = row.iloc[0]['LON']
                station_info['elev'] = row.iloc[0]['ELEV']

        df = fetch_and_clean_data(source, station_id, start_date, end_date)
        if df.empty:
            return render_template('period_stats.html', station_name=station_name, station_info=station_info, 
                                   period_summary=None, period_stats=[], error_msg=get_translation('messages.station_data_error'))

        # Apply Month/Day filters if any (though usually we want the full range for period stats)
        if month_filter and month_filter != "0":
            if month_filter == "winter_3": df = df[df['DATE'].dt.month.isin([12, 1, 2])]
            elif month_filter == "summer_3": df = df[df['DATE'].dt.month.isin([6, 7, 8])]
            else: 
                df = df[df['DATE'].dt.month == int(month_filter)]
                if day_filter and day_filter != "0":
                    df = df[df['DATE'].dt.day == int(day_filter)]

        def get_val_and_dates(sub_df, method='min'):
            if sub_df.empty: return {'val': '-', 'dates': []}
            target_val = sub_df['DATA_VALUE'].min() if method == 'min' else sub_df['DATA_VALUE'].max()
            matches = sub_df[sub_df['DATA_VALUE'] == target_val]['DATE']
            return {'val': float(target_val), 'dates': matches.dt.strftime('%Y-%m-%d').tolist()}

        # Period Stats Calculation (Adapted from get_data)
        df['Season_Year'] = df['DATE'].dt.year
        if period_mode == 'p1': 
            mask = (df['DATE'].dt.month < 7) | ((df['DATE'].dt.month == 7) & (df['DATE'].dt.day < 16))
            df.loc[mask, 'Season_Year'] = df['Season_Year'] - 1
        else: 
            mask = (df['DATE'].dt.month == 1) & (df['DATE'].dt.day < 16)
            df.loc[mask, 'Season_Year'] = df['Season_Year'] - 1

        period_stats_list = []
        list_min_tmin, list_min_tmax, list_max_tmin, list_max_tmax = [], [], [], []
        count_total, count_used_min_tmin, count_used_min_tmax, count_used_max_tmin, count_used_max_tmax = 0, 0, 0, 0, 0
        unique_seasons = sorted(df['Season_Year'].unique(), reverse=True)

        for year in unique_seasons:
            season_df = df[df['Season_Year'] == year]
            if season_df.empty: continue
            count_total += 1
            def get_thresh_count(elem):
                t_val = thresh_params[elem]['val']
                t_dir = thresh_params[elem]['dir']
                vals = season_df[season_df['ELEMENT'] == elem]['DATA_VALUE']
                if vals.empty or t_val is None or t_val == "": return 0
                if t_dir == 'lte': return int((vals <= float(t_val)).sum())
                else: return int((vals >= float(t_val)).sum())
            s_tmin_df = season_df[season_df['ELEMENT'] == 'TMIN']
            s_tmax_df = season_df[season_df['ELEMENT'] == 'TMAX']
            min_tmin_obj = get_val_and_dates(s_tmin_df, 'min')
            max_tmin_obj = get_val_and_dates(s_tmin_df, 'max')
            min_tmax_obj = get_val_and_dates(s_tmax_df, 'min')
            max_tmax_obj = get_val_and_dates(s_tmax_df, 'max')
            
            count_djf_tmin = season_df[(season_df['DATE'].dt.month.isin([12, 1, 2])) & (season_df['ELEMENT'] == 'TMIN')].shape[0]
            count_djf_tmax = season_df[(season_df['DATE'].dt.month.isin([12, 1, 2])) & (season_df['ELEMENT'] == 'TMAX')].shape[0]
            count_jja_tmin = season_df[(season_df['DATE'].dt.month.isin([6, 7, 8])) & (season_df['ELEMENT'] == 'TMIN')].shape[0]
            count_jja_tmax = season_df[(season_df['DATE'].dt.month.isin([6, 7, 8])) & (season_df['ELEMENT'] == 'TMAX')].shape[0]
            
            season_cdt1 = ((hemisphere == 'north' and period_mode == 'p1') or (hemisphere == 'south' and period_mode == 'p2'))
            season_cdt2 = ((hemisphere == 'north' and period_mode == 'p2') or (hemisphere == 'south' and period_mode == 'p1'))
            
            valid_min_tmin = True
            if season_cdt2: valid_min_tmin = False
            if hemisphere == 'north' and period_mode == 'p1' and count_djf_tmin < 60: valid_min_tmin = False
            elif hemisphere == 'south' and period_mode == 'p2' and count_jja_tmin < 60: valid_min_tmin = False
            if valid_min_tmin and min_tmin_obj['val'] != '-': list_min_tmin.append(min_tmin_obj['val']); count_used_min_tmin += 1
            
            valid_min_tmax = True
            if season_cdt2: valid_min_tmax = False
            if hemisphere == 'north' and period_mode == 'p1' and count_djf_tmax < 60: valid_min_tmax = False
            elif hemisphere == 'south' and period_mode == 'p2' and count_jja_tmax < 60: valid_min_tmax = False
            if valid_min_tmax and min_tmax_obj['val'] != '-': list_min_tmax.append(min_tmax_obj['val']); count_used_min_tmax += 1
            
            valid_max_tmin = True
            if season_cdt1: valid_max_tmin = False
            if hemisphere == 'north' and period_mode == 'p2' and count_jja_tmin < 60: valid_max_tmin = False
            elif hemisphere == 'south' and period_mode == 'p1' and count_djf_tmin < 60: valid_max_tmin = False
            if valid_max_tmin and max_tmin_obj['val'] != '-': list_max_tmin.append(max_tmin_obj['val']); count_used_max_tmin += 1
            
            valid_max_tmax = True
            if season_cdt1: valid_max_tmax = False
            if hemisphere == 'north' and period_mode == 'p2' and count_jja_tmax < 60: valid_max_tmax = False
            elif hemisphere == 'south' and period_mode == 'p1' and count_djf_tmax < 60: valid_max_tmax = False
            if valid_max_tmax and max_tmax_obj['val'] != '-': list_max_tmax.append(max_tmax_obj['val']); count_used_max_tmax += 1
            
            count_actual = season_df['DATE'].nunique()
            count_expected = 0
            try:
                if period_mode == 'p1': s_date, e_date = datetime(year, 7, 16), datetime(year + 1, 7, 15)
                else: s_date, e_date = datetime(year, 1, 16), datetime(year + 1, 1, 15)
                count_expected = (e_date - s_date).days + 1
            except: pass

            period_stats_list.append({
                'range': f"{year}-{year+1}",
                'count_actual': count_actual,
                'count_expected': count_expected,
                'min_tmin': min_tmin_obj, 'max_tmin': max_tmin_obj, 'min_tmax': min_tmax_obj, 'max_tmax': max_tmax_obj,
                'cnt_tmin': get_thresh_count('TMIN'), 'cnt_tavg': get_thresh_count('TAVG'), 'cnt_tmax': get_thresh_count('TMAX')
            })

        def get_avg_data(lst, used_count):
            avg = float(round(sum(lst) / len(lst), 2)) if lst else '-'
            return {'val': avg, 'used': used_count, 'total': count_total}

        period_summary = {
            'avg_min_tmin': get_avg_data(list_min_tmin, count_used_min_tmin),
            'avg_min_tmax': get_avg_data(list_min_tmax, count_used_min_tmax),
            'avg_max_tmin': get_avg_data(list_max_tmin, count_used_max_tmin),
            'avg_max_tmax': get_avg_data(list_max_tmax, count_used_max_tmax)
        }

        return render_template('period_stats.html', station_name=station_name, station_info=station_info, 
                               period_summary=period_summary, period_stats=period_stats_list, source=source, station_id=station_id,
                               period_mode=period_mode)
    except Exception as e:
        import traceback; traceback.print_exc()
        return str(e), 500

@app.route('/extreme_temps')
@auth_or_visitor_required
def extreme_temps():
    station_id = request.args.get('station_id')
    source = request.args.get('source', 'GHCND')
    season = request.args.get('season', 'winter') # 'winter' or 'summer'
    
    # Station Name
    station_name = station_id
    try:
        if source == 'GHCND':
            row = GHCND_DF[GHCND_DF['ID'] == station_id]
            if not row.empty: station_name = f"{station_id} - {row.iloc[0]['NAME']}"
        else:
            row = GSOD_DF[GSOD_DF['ID'] == station_id]
            if not row.empty: station_name = f"{station_id} - {row.iloc[0]['NAME']}"
    except: pass

    # Fetch Station Info (Lat, Lon, Elev) - Same logic as before to pass to extreme_temps
    station_info = {'lat': '-', 'lon': '-', 'elev': '-'}
    try:
        if source == 'GHCND':
            row = GHCND_DF[GHCND_DF['ID'] == station_id]
            if not row.empty:
                station_info['lat'] = row.iloc[0]['LAT']
                station_info['lon'] = row.iloc[0]['LON']
                station_info['elev'] = row.iloc[0]['ELEV']
        else:
            row = GSOD_DF[GSOD_DF['ID'] == station_id]
            if not row.empty:
                station_info['lat'] = row.iloc[0]['LAT']
                station_info['lon'] = row.iloc[0]['LON']
                station_info['elev'] = row.iloc[0]['ELEV']
    except: pass

    # Fetch ALL data (start_date=None, end_date=None)
    df = fetch_and_clean_data(source, station_id, None, None)
    
    results = []
    if not df.empty:
        df = df[df['ELEMENT'].isin(['TMIN', 'TMAX'])].copy()
        
        # FULL YEAR Logic - Do not filter by month
        # df = df[df['DATE'].dt.month.isin([12, 1, 2, 29])] # REMOVED
            
        # Add Month-Day column
        df['MD'] = df['DATE'].dt.strftime('%m-%d')
        
        # Generate all MDs for the FULL YEAR
        all_mds = []
        # Days per month (Leap year standard)
        # 1:31, 2:29, 3:31, 4:30, 5:31, 6:30, 7:31, 8:31, 9:30, 10:31, 11:30, 12:31
        days_in_month = {1:31, 2:29, 3:31, 4:30, 5:31, 6:30, 7:31, 8:31, 9:30, 10:31, 11:30, 12:31}
        for m in range(1, 13):
            for d in range(1, days_in_month[m] + 1):
                all_mds.append(f"{m:02d}-{d:02d}")
            
        grouped = df.groupby('MD')
        
        for md in all_mds:
            # Prepare empty entry even if no data exists (to ensure full calendar 366 rows)
            # User said "It should have 365 or 366 rows in good situation."
            # If no data, we should probably output the date with '-'
            
            entry = {'md': md}
            has_data = False
            
            sub = pd.DataFrame()
            if md in grouped.groups:
                sub = grouped.get_group(md)
            
            # Logic: Calculate ALL 4 Extremes
            sub_tmin = sub[sub['ELEMENT'] == 'TMIN'] if not sub.empty else pd.DataFrame()
            sub_tmax = sub[sub['ELEMENT'] == 'TMAX'] if not sub.empty else pd.DataFrame()
            
            # 1. Min TMIN (Record Low)
            if not sub_tmin.empty:
                val = sub_tmin['DATA_VALUE'].min()
                dates = sub_tmin[sub_tmin['DATA_VALUE'] == val]['DATE'].dt.year.tolist()
                entry['min_tmin_val'] = val
                entry['min_tmin_years'] = dates
            else:
                entry['min_tmin_val'] = '-'
                entry['min_tmin_years'] = []

            # 2. Min TMAX (Coldest Day)
            if not sub_tmax.empty:
                val = sub_tmax['DATA_VALUE'].min()
                dates = sub_tmax[sub_tmax['DATA_VALUE'] == val]['DATE'].dt.year.tolist()
                entry['min_tmax_val'] = val
                entry['min_tmax_years'] = dates
            else:
                entry['min_tmax_val'] = '-'
                entry['min_tmax_years'] = []

            # 3. Max TMIN (Warmest Night)
            if not sub_tmin.empty:
                val = sub_tmin['DATA_VALUE'].max()
                dates = sub_tmin[sub_tmin['DATA_VALUE'] == val]['DATE'].dt.year.tolist()
                entry['max_tmin_val'] = val
                entry['max_tmin_years'] = dates
            else:
                entry['max_tmin_val'] = '-'
                entry['max_tmin_years'] = []

            # 4. Max TMAX (Hottest Day)
            if not sub_tmax.empty:
                val = sub_tmax['DATA_VALUE'].max()
                dates = sub_tmax[sub_tmax['DATA_VALUE'] == val]['DATE'].dt.year.tolist()
                entry['max_tmax_val'] = val
                entry['max_tmax_years'] = dates
            else:
                entry['max_tmax_val'] = '-'
                entry['max_tmax_years'] = []
            
            entry['count_tmin_val'] = len(sub_tmin)
            entry['count_tmin_years'] = sub_tmin['DATE'].dt.year.tolist() if not sub_tmin.empty else []
            entry['count_tmax_val'] = len(sub_tmax)
            entry['count_tmax_years'] = sub_tmax['DATE'].dt.year.tolist() if not sub_tmax.empty else []
            
            results.append(entry)

    return render_template('extreme_temps.html', results=results, station_id=station_id, station_name=station_name, source=source, season=season, station_info=station_info)

if __name__ == '__main__':
    app.run(debug=True, port=1002)