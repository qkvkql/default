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
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///visitors.db'
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
        lang = session.get('language', 'en')
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
    return session.get('language', 'en')

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
        except Exception:
            return pd.DataFrame()
    else:
        api_url = "https://www.ncei.noaa.gov/access/services/data/v1"
        params = {
            'dataset': 'global-summary-of-the-day', 'stations': station_id,
            'startDate': start_date, 'endDate': end_date,
            'dataTypes': 'TEMP,MAX,MIN', 'format': 'json', 'units': 'standard', 'includeStationName': 'false'
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
                    df = df[(df['DATA_VALUE'] >= -120) & (df['DATA_VALUE'] <= 80)]
        except Exception: pass
    return df

# --- TRACKING ---
def get_ip_location(ip):
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
    return render_template('index.html')

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
        period_mode = req.get('period') 
        hemisphere = req.get('hemisphere', 'north')
        sort_by = req.get('sort_by', 'DATE')
        sort_dir = req.get('sort_dir', 'desc')
        selected_elements = req.get('selected_elements', ['TMIN', 'TAVG', 'TMAX'])
        record_limit = int(req.get('limit', 15))
        custom_avg_tmin = req.get('custom_avg_tmin')
        custom_avg_tavg = req.get('custom_avg_tavg')
        custom_avg_tmax = req.get('custom_avg_tmax')

        thresh_params = {'TMIN': {'val': req.get('tmin_val'), 'dir': req.get('tmin_dir')}, 'TAVG': {'val': req.get('tavg_val'), 'dir': req.get('tavg_dir')}, 'TMAX': {'val': req.get('tmax_val'), 'dir': req.get('tmax_dir')}}

        df = fetch_and_clean_data(source, station_id, start_date, end_date)
        if month_filter and month_filter != "0":
            if month_filter == "winter_3": df = df[df['DATE'].dt.month.isin([12, 1, 2])]
            elif month_filter == "summer_3": df = df[df['DATE'].dt.month.isin([6, 7, 8])]
            else: df = df[df['DATE'].dt.month == int(month_filter)]

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
            return {'min': get_val_and_dates(sub_df, 'min'), 'avg': float(round(natural_avg, 2)), 'max': get_val_and_dates(sub_df, 'max'), 'count_match': count_match, 'explosive_power': explosive_power}

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
            valid_min_tmin = True
            if hemisphere == 'north' and period_mode == 'p1' and count_djf_tmin < 60: valid_min_tmin = False
            elif hemisphere == 'south' and period_mode == 'p2' and count_jja_tmin < 60: valid_min_tmin = False
            if valid_min_tmin and min_tmin_obj['val'] != '-': list_min_tmin.append(min_tmin_obj['val']); count_used_min_tmin += 1
            valid_min_tmax = True
            if hemisphere == 'north' and period_mode == 'p1' and count_djf_tmax < 60: valid_min_tmax = False
            elif hemisphere == 'south' and period_mode == 'p2' and count_jja_tmax < 60: valid_min_tmax = False
            if valid_min_tmax and min_tmax_obj['val'] != '-': list_min_tmax.append(min_tmax_obj['val']); count_used_min_tmax += 1
            valid_max_tmin = True
            if hemisphere == 'north' and period_mode == 'p2' and count_jja_tmin < 60: valid_max_tmin = False
            elif hemisphere == 'south' and period_mode == 'p1' and count_djf_tmin < 60: valid_max_tmin = False
            if valid_max_tmin and max_tmin_obj['val'] != '-': list_max_tmin.append(max_tmin_obj['val']); count_used_max_tmin += 1
            valid_max_tmax = True
            if hemisphere == 'north' and period_mode == 'p2' and count_jja_tmax < 60: valid_max_tmax = False
            elif hemisphere == 'south' and period_mode == 'p1' and count_djf_tmax < 60: valid_max_tmax = False
            if valid_max_tmax and max_tmax_obj['val'] != '-': list_max_tmax.append(max_tmax_obj['val']); count_used_max_tmax += 1
            period_stats.append({
                'range': f"{year}-{year+1}",
                'min_tmin': min_tmin_obj, 'max_tmin': max_tmin_obj, 'min_tmax': min_tmax_obj, 'max_tmax': max_tmax_obj,
                'cnt_tmin': get_thresh_count('TMIN'), 'cnt_tavg': get_thresh_count('TAVG'), 'cnt_tmax': get_thresh_count('TMAX')
            })

        def get_avg_data(lst, used_count):
            avg = float(round(sum(lst) / len(lst), 2)) if lst else '-'
            return {'val': avg, 'used': used_count, 'total': count_total}

        period_summary = {'avg_min_tmin': get_avg_data(list_min_tmin, count_used_min_tmin), 'avg_min_tmax': get_avg_data(list_min_tmax, count_used_min_tmax), 'avg_max_tmin': get_avg_data(list_max_tmin, count_used_max_tmin), 'avg_max_tmax': get_avg_data(list_max_tmax, count_used_max_tmax)}

        if selected_elements: records_df = df[df['ELEMENT'].isin(selected_elements)].copy()
        else: records_df = df.copy()
        sort_col_map = {'ID': 'ID', 'DATE': 'DATE', 'ELEMENT': 'ELEMENT', 'DATA_VALUE': 'DATA_VALUE'}
        target_col = sort_col_map.get(sort_by, 'DATE')
        is_asc = (sort_dir == 'asc')
        records_df = records_df.sort_values(by=target_col, ascending=is_asc).head(record_limit)
        records_df['DATE'] = records_df['DATE'].dt.strftime('%Y-%m-%d')
        records_list = records_df[['ID', 'DATE', 'ELEMENT', 'DATA_VALUE']].to_dict(orient='records')

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
            multi_limit = int(req.get('multi_limit', 15))

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
                if lat_min: temp_st_df = temp_st_df[temp_st_df['LAT'] >= float(lat_min)]
                if lat_max: temp_st_df = temp_st_df[temp_st_df['LAT'] <= float(lat_max)]
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
                sort_map = {'id': 'ID', 'lat': 'LAT', 'lon': 'LON', 'elev': 'ELEV', 'dist': 'DIST', 'country': 'ID', 'name': 'NAME'}
                sort_key = sort_map.get(multi_sort_by, 'DIST')
                temp_st_df = temp_st_df.sort_values(by=sort_key, ascending=ms_sort_asc).head(multi_limit)
                
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
        MAX_MULTI_IDS = 200
        if len(station_ids) > MAX_MULTI_IDS:
            return jsonify({'status': 'error', 'message': f'Max {MAX_MULTI_IDS} stations allowed'}), 400
        source = req.get('source', 'GHCND')
        metric = req.get('metric', 'avg_tavg')
        start_date = req.get('start_date')
        end_date = req.get('end_date')
        month_filter = req.get('month_filter')
        period_mode = req.get('period')
        
        # Get Thresholds (Handle empty strings safely)
        def safe_float(val):
            return float(val) if val else 0.0

        t_val_tmin = safe_float(req.get('tmin_val'))
        t_dir_tmin = req.get('tmin_dir')
        t_val_tavg = safe_float(req.get('tavg_val'))
        t_dir_tavg = req.get('tavg_dir')
        t_val_tmax = safe_float(req.get('tmax_val'))
        t_dir_tmax = req.get('tmax_dir')

        results = []

        def process_station(sid):
            s_name = "Unknown"
            # Get Station Name
            if source == 'GHCND':
                row = GHCND_DF[GHCND_DF['ID'] == sid]
                if not row.empty: s_name = row.iloc[0]['NAME']
            else:
                row = GSOD_DF[GSOD_DF['ID'] == sid]
                if not row.empty: s_name = row.iloc[0]['NAME']

            # Fetch Data
            df = fetch_and_clean_data(source, sid, start_date, end_date)
            if df.empty: return {'id': sid, 'name': s_name, 'val': '-', 'dates': []}

            # Filter Month
            if month_filter and month_filter != "0":
                if month_filter == "winter_3": df = df[df['DATE'].dt.month.isin([12, 1, 2])]
                elif month_filter == "summer_3": df = df[df['DATE'].dt.month.isin([6, 7, 8])]
                else: df = df[df['DATE'].dt.month == int(month_filter)]

            val = '-'
            dates_info = []
            
            # --- METRIC LOGIC WITH TYPE CASTING ---
            
            # 1. Averages
            if metric.startswith('avg_'):
                elem = metric.split('_')[1].upper()
                sub = df[df['ELEMENT'] == elem]
                if not sub.empty: 
                    # Convert numpy float to python float
                    val = float(round(sub['DATA_VALUE'].mean(), 2))
            
            # 2. Minimums
            elif metric.startswith('min_'):
                elem = metric.split('_')[1].upper()
                sub = df[df['ELEMENT'] == elem]
                if not sub.empty: 
                    # Convert numpy float to python float
                    min_val = sub['DATA_VALUE'].min()
                    val = float(min_val)
                    dates_info = sub[sub['DATA_VALUE'] == min_val]['DATE'].dt.strftime('%Y-%m-%d').tolist()
            
            # 3. Maximums (Value)
            elif metric.startswith('max_') and 'days' not in metric:
                elem = metric.split('_')[1].upper()
                sub = df[df['ELEMENT'] == elem]
                if not sub.empty: 
                    # Convert numpy float to python float
                    max_val = sub['DATA_VALUE'].max()
                    val = float(max_val)
                    dates_info = sub[sub['DATA_VALUE'] == max_val]['DATE'].dt.strftime('%Y-%m-%d').tolist()
            
            # 4. Maximum Days (Count)
            elif 'days' in metric:
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
                    curr_t_val, curr_t_dir = 0, 'lte'
                    if elem == 'TMIN': curr_t_val, curr_t_dir = t_val_tmin, t_dir_tmin
                    elif elem == 'TAVG': curr_t_val, curr_t_dir = t_val_tavg, t_dir_tavg
                    elif elem == 'TMAX': curr_t_val, curr_t_dir = t_val_tmax, t_dir_tmax
                    
                    # Filter matches
                    if curr_t_dir == 'lte':
                        sub['is_match'] = sub['DATA_VALUE'] <= curr_t_val
                    else:
                        sub['is_match'] = sub['DATA_VALUE'] >= curr_t_val
                    
                    # Count matches per season
                    counts = sub[sub['is_match']].groupby('Season_Year').size()
                    
                    # Convert numpy int64 to python int
                    if not counts.empty:
                        # .item() safely converts numpy scalars to python scalars
                        val = int(counts.max()) 
                        top_seasons = counts[counts == counts.max()].index.tolist()
                        if top_seasons:
                            dates_info = [f"{int(y)}-{int(y)+1}" for y in top_seasons]
                    else:
                        val = 0

            return {'id': sid, 'name': s_name, 'val': val, 'dates': dates_info}

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

if __name__ == '__main__':
    app.run(debug=True, port=1002)