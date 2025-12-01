from flask import Flask, render_template, jsonify
import subprocess
import os
import signal

app = Flask(__name__)

# Global variable to hold the running process
current_process = None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/export_to_html', methods=['POST'])
def export_to_html():
    return run_script('export_to_html.py')

@app.route('/scrape_wmo', methods=['POST'])
def scrape_wmo():
    return run_script('scrape_wmo.py')

# --- NEW ROUTE: STOP ---
@app.route('/stop', methods=['POST'])
def stop_script():
    global current_process
    
    if current_process is None:
        return jsonify({'status': 'error', 'message': 'No script is running.'})

    #Check if process is still active
    if current_process.poll() is None:
        try:
            # Kill the process tree (terminate)
            current_process.terminate()
            # If it's stubborn, force kill:
            # current_process.kill() 
            return jsonify({'status': 'success', 'message': 'Script stopped successfully.'})
        except Exception as e:
            return jsonify({'status': 'error', 'message': str(e)})
    else:
        return jsonify({'status': 'error', 'message': 'Script already finished.'})

def run_script(script_name):
    global current_process

    # Prevent running two scripts at once
    if current_process is not None and current_process.poll() is None:
        return jsonify({'output': 'Error: A script is already running. Please stop it first.', 'status': 'error'})

    try:
        # Use Popen instead of run. This allows us to access the process later.
        # 'start_new_session=True' helps ensure we can kill the whole process tree if needed
        current_process = subprocess.Popen(
            ['python', '-u', script_name], 
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            # shell=False is safer
        )

        # communicate() waits for the process to finish OR to be killed
        stdout, stderr = current_process.communicate()

        output = stdout
        if stderr:
            output += "\n[STDERR]:\n" + stderr
        
        # If the user clicked stop, the return code will indicate termination
        if current_process.returncode != 0 and current_process.returncode is not None:
             output += "\n\n[SYSTEM]: Process terminated or finished with errors."

        return jsonify({'output': output, 'status': 'success'})
        
    except Exception as e:
        return jsonify({'output': str(e), 'status': 'error'})
    finally:
        # Clean up global variable
        current_process = None

if __name__ == '__main__':
    app.run(debug=True, port=5000)