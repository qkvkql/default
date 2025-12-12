import os
import subprocess
import signal
import sys
from flask import Flask, render_template, Response, request, send_from_directory, jsonify

# Set static_folder to current directory to allow accessing existing css/js files easily
app = Flask(__name__, template_folder='templates', static_folder='.')

# Global variable to hold the running process
current_process = None

@app.route('/')
def index():
    """Render the control panel."""
    return render_template('console.html')

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