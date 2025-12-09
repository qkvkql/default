import os
import pandas as pd
import numpy as np
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# --- CONFIGURATION & CACHE ---
STATIONS_FILE = 'ghcnd-stations.txt'
STATIONS_DF = None

def load_stations_locally():
    global STATIONS_DF
    if os.path.exists(STATIONS_FILE):
        print(f"Loading stations from local file: {STATIONS_FILE}...")
        col_specs = [(0, 11), (38, 40), (41, 71)]
        col_names = ['ID', 'STATE', 'NAME']
        try:
            df = pd.read_fwf(STATIONS_FILE, colspecs=col_specs, names=col_names, header=None)
            df['STATE'] = df['STATE'].fillna('')
            df['NAME'] = df['NAME'].str.strip()
            df['ID'] = df['ID'].str.strip()
            STATIONS_DF = df
            print(f"Successfully loaded {len(df)} stations.")
        except Exception as e:
            print(f"Error reading local file: {e}")
    else:
        print(f"Warning: {STATIONS_FILE} not found. Search function will be empty.")

load_stations_locally()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search_stations', methods=['GET'])
def search_stations():
    query = request.args.get('q', '').strip().upper()
    if STATIONS_DF is None or not query: return jsonify([])
    mask = (STATIONS_DF['ID'].str.contains(query, case=False)) | \
           (STATIONS_DF['NAME'].str.contains(query, case=False))
    results_df = STATIONS_DF[mask].head(20)
    results = []
    for _, row in results_df.iterrows():
        label_text = row['NAME']
        if row['STATE']: label_text += f" ({row['STATE']})"
        results.append({'value': f"{row['ID']} - {label_text}"})
    return jsonify(results)

@app.route('/get_data', methods=['POST'])
def get_data():
    try:
        req = request.json
        
        # 1. Parse Parameters
        raw_id = req.get('station_id', '').strip()
        station_id = raw_id.split(' - ')[0] if ' - ' in raw_id else raw_id
        start_date = req.get('start_date')
        end_date = req.get('end_date')
        month_filter = req.get('month_filter')
        period_mode = req.get('period') 
        hemisphere = req.get('hemisphere', 'north') # Default North
        
        sort_by = req.get('sort_by', 'DATE')
        sort_dir = req.get('sort_dir', 'desc')

        thresh_params = {
            'TMIN': {'val': req.get('tmin_val'), 'dir': req.get('tmin_dir')},
            'TAVG': {'val': req.get('tavg_val'), 'dir': req.get('tavg_dir')},
            'TMAX': {'val': req.get('tmax_val'), 'dir': req.get('tmax_dir')},
        }

        # 2. Fetch Data
        url = f'https://noaa-ghcn-pds.s3.amazonaws.com/csv/by_station/{station_id}.csv'
        try:
            df = pd.read_csv(url, parse_dates=['DATE'], usecols=['ID', 'DATE', 'ELEMENT', 'DATA_VALUE'])
        except Exception:
            return jsonify({'status': 'error', 'message': f'Station ID {station_id} not found on AWS.'})

        # 3. Filter Data (Date)
        if start_date: df = df[df['DATE'] >= start_date]
        if end_date: df = df[df['DATE'] <= end_date]
        
        # Month Filter
        if month_filter and month_filter != "0":
            if month_filter == "winter_3":
                df = df[df['DATE'].dt.month.isin([12, 1, 2])]
            elif month_filter == "summer_3":
                df = df[df['DATE'].dt.month.isin([6, 7, 8])]
            else:
                df = df[df['DATE'].dt.month == int(month_filter)]

        df = df[df['ELEMENT'].isin(['TMIN', 'TAVG', 'TMAX'])].copy()
        df['DATA_VALUE'] = df['DATA_VALUE'] / 10.0 

        # Helper: Value + Dates
        def get_val_and_dates(sub_df, method='min'):
            if sub_df.empty: return {'val': '-', 'dates': []}
            target_val = sub_df['DATA_VALUE'].min() if method == 'min' else sub_df['DATA_VALUE'].max()
            matches = sub_df[sub_df['DATA_VALUE'] == target_val]['DATE']
            return {'val': float(target_val), 'dates': matches.dt.strftime('%Y-%m-%d').tolist()}

        # --- GLOBAL STATISTICS ---
        stats = {}
        def calc_global_stats(element_name):
            sub_df = df[df['ELEMENT'] == element_name]
            if sub_df.empty: 
                return {'min': {'val': '-', 'dates':[]}, 'avg': '-', 'max': {'val': '-', 'dates':[]}, 'count_match': 0}
            
            t_val = thresh_params[element_name]['val']
            t_dir = thresh_params[element_name]['dir']
            count_match = 0
            if t_val is not None and t_val != "":
                if t_dir == 'lte': count_match = int((sub_df['DATA_VALUE'] <= float(t_val)).sum())
                else: count_match = int((sub_df['DATA_VALUE'] >= float(t_val)).sum())

            return {
                'min': get_val_and_dates(sub_df, 'min'),
                'avg': float(round(sub_df['DATA_VALUE'].mean(), 2)),
                'max': get_val_and_dates(sub_df, 'max'),
                'count_match': count_match
            }

        stats['TMIN'] = calc_global_stats('TMIN')
        stats['TAVG'] = calc_global_stats('TAVG')
        stats['TMAX'] = calc_global_stats('TMAX')

        # --- PERIOD LOGIC ---
        df['Season_Year'] = df['DATE'].dt.year
        if period_mode == 'p1': 
            mask = (df['DATE'].dt.month < 7) | ((df['DATE'].dt.month == 7) & (df['DATE'].dt.day < 16))
            df.loc[mask, 'Season_Year'] = df['Season_Year'] - 1
        else:
            mask = (df['DATE'].dt.month == 1) & (df['DATE'].dt.day < 16)
            df.loc[mask, 'Season_Year'] = df['Season_Year'] - 1

        period_stats = []
        
        # Collection lists for averages
        # Format: list of values that PASSED the logic check
        list_min_tmin = []
        list_min_tmax = []
        list_max_tmin = []
        list_max_tmax = []

        # Tracking total valid ranges vs total periods
        # We start with 0 and increment.
        # "Total" = Number of years processed
        # "Used" = Number of years that passed the >60 check
        
        # Initialize Counters
        count_total = 0
        count_used_min_tmin = 0
        count_used_min_tmax = 0
        count_used_max_tmin = 0
        count_used_max_tmax = 0

        unique_seasons = sorted(df['Season_Year'].unique(), reverse=True)

        for year in unique_seasons:
            season_df = df[df['Season_Year'] == year]
            if season_df.empty: continue
            
            count_total += 1

            # Count Helper for threshold
            def get_thresh_count(elem):
                t_val = thresh_params[elem]['val']
                t_dir = thresh_params[elem]['dir']
                vals = season_df[season_df['ELEMENT'] == elem]['DATA_VALUE']
                if vals.empty or t_val is None or t_val == "": return 0
                if t_dir == 'lte': return int((vals <= float(t_val)).sum())
                else: return int((vals >= float(t_val)).sum())

            s_tmin_df = season_df[season_df['ELEMENT'] == 'TMIN']
            s_tmax_df = season_df[season_df['ELEMENT'] == 'TMAX']

            # --- EXTREMES ---
            min_tmin_obj = get_val_and_dates(s_tmin_df, 'min')
            max_tmin_obj = get_val_and_dates(s_tmin_df, 'max')
            min_tmax_obj = get_val_and_dates(s_tmax_df, 'min')
            max_tmax_obj = get_val_and_dates(s_tmax_df, 'max')

            # --- COMPLEX LOGIC FOR AVERAGES ---
            # 1. Calculate record counts for DJF and JJA within this period
            # DJF: Dec, Jan, Feb
            count_djf_tmin = season_df[(season_df['DATE'].dt.month.isin([12, 1, 2])) & (season_df['ELEMENT'] == 'TMIN')].shape[0]
            count_djf_tmax = season_df[(season_df['DATE'].dt.month.isin([12, 1, 2])) & (season_df['ELEMENT'] == 'TMAX')].shape[0]
            
            # JJA: Jun, Jul, Aug
            count_jja_tmin = season_df[(season_df['DATE'].dt.month.isin([6, 7, 8])) & (season_df['ELEMENT'] == 'TMIN')].shape[0]
            count_jja_tmax = season_df[(season_df['DATE'].dt.month.isin([6, 7, 8])) & (season_df['ELEMENT'] == 'TMAX')].shape[0]

            # 2. Determine Validity based on Cases
            
            # -- Metric: Min TMIN --
            # Case 1 (NH & P1) OR Case 4 (SH & P2) -> Check Winter (NH=DJF, SH=JJA) >= 60
            valid_min_tmin = True # Default
            if hemisphere == 'north' and period_mode == 'p1':
                if count_djf_tmin < 60: valid_min_tmin = False
            elif hemisphere == 'south' and period_mode == 'p2':
                if count_jja_tmin < 60: valid_min_tmin = False
            
            if valid_min_tmin and min_tmin_obj['val'] != '-':
                list_min_tmin.append(min_tmin_obj['val'])
                count_used_min_tmin += 1

            # -- Metric: Min TMAX --
            # Case 1 (NH & P1) OR Case 4 (SH & P2) -> Check Winter >= 60
            valid_min_tmax = True
            if hemisphere == 'north' and period_mode == 'p1':
                if count_djf_tmax < 60: valid_min_tmax = False
            elif hemisphere == 'south' and period_mode == 'p2':
                if count_jja_tmax < 60: valid_min_tmax = False

            if valid_min_tmax and min_tmax_obj['val'] != '-':
                list_min_tmax.append(min_tmax_obj['val'])
                count_used_min_tmax += 1

            # -- Metric: Max TMIN --
            # Case 2 (NH & P2) OR Case 3 (SH & P1) -> Check Summer (NH=JJA, SH=DJF) >= 60
            valid_max_tmin = True
            if hemisphere == 'north' and period_mode == 'p2':
                if count_jja_tmin < 60: valid_max_tmin = False
            elif hemisphere == 'south' and period_mode == 'p1':
                if count_djf_tmin < 60: valid_max_tmin = False
            
            if valid_max_tmin and max_tmin_obj['val'] != '-':
                list_max_tmin.append(max_tmin_obj['val'])
                count_used_max_tmin += 1

            # -- Metric: Max TMAX --
            # Case 2 (NH & P2) OR Case 3 (SH & P1) -> Check Summer >= 60
            valid_max_tmax = True
            if hemisphere == 'north' and period_mode == 'p2':
                if count_jja_tmax < 60: valid_max_tmax = False
            elif hemisphere == 'south' and period_mode == 'p1':
                if count_djf_tmax < 60: valid_max_tmax = False
            
            if valid_max_tmax and max_tmax_obj['val'] != '-':
                list_max_tmax.append(max_tmax_obj['val'])
                count_used_max_tmax += 1

            # Append to detail list
            period_stats.append({
                'range': f"{year}-{year+1}",
                'min_tmin': min_tmin_obj,
                'max_tmin': max_tmin_obj,
                'min_tmax': min_tmax_obj,
                'max_tmax': max_tmax_obj,
                'cnt_tmin': get_thresh_count('TMIN'),
                'cnt_tavg': get_thresh_count('TAVG'),
                'cnt_tmax': get_thresh_count('TMAX')
            })

        # --- CALCULATE AVERAGES ---
        def get_avg_data(lst, used_count):
            avg = float(round(sum(lst) / len(lst), 2)) if lst else '-'
            return {'val': avg, 'used': used_count, 'total': count_total}

        period_summary = {
            'avg_min_tmin': get_avg_data(list_min_tmin, count_used_min_tmin),
            'avg_min_tmax': get_avg_data(list_min_tmax, count_used_min_tmax),
            'avg_max_tmin': get_avg_data(list_max_tmin, count_used_max_tmin),
            'avg_max_tmax': get_avg_data(list_max_tmax, count_used_max_tmax)
        }

        # --- SORTING & RECORD LIST ---
        sort_col_map = {'ID': 'ID', 'DATE': 'DATE', 'ELEMENT': 'ELEMENT', 'DATA_VALUE': 'DATA_VALUE'}
        target_col = sort_col_map.get(sort_by, 'DATE')
        is_asc = (sort_dir == 'asc')

        records_df = df.sort_values(by=target_col, ascending=is_asc).head(500)
        records_df['DATE'] = records_df['DATE'].dt.strftime('%Y-%m-%d')
        records_list = records_df[['ID', 'DATE', 'ELEMENT', 'DATA_VALUE']].to_dict(orient='records')

        return jsonify({
            'status': 'success', 
            'stats': stats, 
            'period_stats': period_stats,
            'period_summary': period_summary,
            'records': records_list
        })

    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(debug=True)