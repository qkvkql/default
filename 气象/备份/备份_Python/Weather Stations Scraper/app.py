import os
import subprocess
import signal
import sys
import json
import re
from datetime import datetime, timezone
from flask import Flask, render_template, Response, request, send_from_directory, jsonify

# Set static_folder to current directory to allow accessing existing css/js files easily
app = Flask(__name__, template_folder='templates', static_folder='.')

# Global variable to hold the running process
current_process = None

def get_console_stations():
    """Return stations with an RP5 location for the single-station console tool."""
    import openpyxl

    with open('config.json', 'r', encoding='utf-8') as config_file:
        config = json.load(config_file)
    workbook = openpyxl.load_workbook(config['station_list_path'], read_only=True, data_only=True)
    try:
        sheet = workbook['站点信息和记录']
        rows = sheet.iter_rows(values_only=True)
        headers = next(rows, None)
        if not headers:
            return []
        indexes = {name: index for index, name in enumerate(headers) if name is not None}
        required = ('USAF', 'rp5')
        if any(name not in indexes for name in required):
            raise ValueError('The station sheet must contain USAF and rp5 columns.')

        stations = []
        for row in rows:
            rp5 = row[indexes['rp5']] if indexes['rp5'] < len(row) else None
            usaf = row[indexes['USAF']] if indexes['USAF'] < len(row) else None
            if rp5 is None or not str(rp5).strip() or usaf is None or not str(usaf).strip():
                continue
            cn_name = row[indexes['cn_name']] if 'cn_name' in indexes and indexes['cn_name'] < len(row) else ''
            name = str(cn_name).strip() if cn_name else str(rp5).strip()
            stations.append({'id': str(usaf).strip(), 'name': name, 'rp5': str(rp5).strip()})
        return stations
    finally:
        workbook.close()

@app.route('/')
def index():
    """Render the control panel."""
    return render_template('console.html', target_date=datetime.now(timezone.utc).strftime('%Y-%m-%d'))

@app.route('/console_stations')
def console_stations():
    try:
        return jsonify(get_console_stations())
    except Exception as exc:
        return jsonify({'error': str(exc)}), 500

@app.route('/calculate_average', methods=['POST'])
def calculate_average():
    payload = request.get_json(silent=True) or {}
    station_id = str(payload.get('station', '')).strip()
    source = str(payload.get('source', '')).strip().lower()
    target_date = str(payload.get('date', '')).strip()
    if source not in ('rp5', 'ogimet'):
        return jsonify({'error': 'Choose rp5 or ogimet as the data source.'}), 400
    if not station_id:
        return jsonify({'error': 'Choose a station.'}), 400
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', target_date):
        return jsonify({'error': 'Enter a valid date in YYYY-MM-DD format.'}), 400
    try:
        datetime.strptime(target_date, '%Y-%m-%d')
    except ValueError:
        return jsonify({'error': 'Enter a valid date in YYYY-MM-DD format.'}), 400

    try:
        import scrape_wmo
        station = next((item for item in scrape_wmo.station_list if str(item.get('USAF', '')).strip() == station_id), None)
        if station is None or not station.get('rp5'):
            return jsonify({'error': 'The selected station is not available in the station list.'}), 400
        scrape_wmo.target_date = target_date
        fetch = (scrape_wmo.get_daily_temperature_rp5 if source == 'rp5'
                 else scrape_wmo.get_daily_temperature_ogimet)
        result = fetch(station_id, station.get('timezone'))
        return jsonify({'result': result, 'station': station.get('cn_name') or station.get('rp5'),
                        'source': source, 'date': target_date})
    except Exception as exc:
        app.logger.exception('Single-station average calculation failed')
        return jsonify({'error': str(exc)}), 500

@app.route('/view_image')
def view_image():
    """Serve your existing make_image.html."""
    return send_from_directory('.', 'make_image.html')

@app.route('/run_script/<script_name>')
def run_script(script_name):
    """Run a python script and stream output via Server-Sent Events (SSE)."""
    global current_process
    
    # Map friendly names to actual filenames
    scripts = {
        'scrape': 'scrape_wmo.py',
        'bad_stations': 'open_bad_stations.py',
        'export': 'export_to_html.py',
        'add_to_mongolia': 'record_only_for_mongolia.py'
    }
    
    filename = scripts.get(script_name)
    if not filename:
        return "Invalid script", 400

    if current_process and current_process.poll() is None:
        return "A process is already running.", 409

    def generate():
        global current_process
        # Run python in unbuffered mode (-u) so output is sent immediately
        cmd = [sys.executable, '-u', filename]
        
        # Start subprocess
        current_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT, # Merge errors into output
            text=True,
            bufsize=1,
            encoding='utf-8',   # <--- FIX 1: Force UTF-8 encoding
            errors='replace'
        )

        # Stream output line by line
        try:
            for line in iter(current_process.stdout.readline, ''):
                if line:
                    yield f"data: {line}\n\n"
                else:
                    break
        finally:
            current_process.stdout.close()
            current_process.wait()
            current_process = None
            yield "data: [PROCESS FINISHED]\n\n"

    return Response(generate(), mimetype='text/event-stream')

@app.route('/stop_script', methods=['POST'])
def stop_script():
    """Stop the currently running process."""
    global current_process
    if current_process and current_process.poll() is None:
        # Kill the process
        if sys.platform == 'win32':
            current_process.send_signal(signal.SIGTERM)
        else:
            current_process.kill()
        
        current_process = None
        return jsonify({"status": "Process stopped"})
    return jsonify({"status": "No running process to stop"})

# --- Route to serve specific static files from root if needed explicitly ---
@app.route('/<path:filename>')
def serve_root_files(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    print("Starting server at http://127.0.0.1:1000")
    app.run(debug=True, port=1000)
