# app.py
from flask import Flask, render_template, jsonify, request
import my_logic
import scrape_wmo

app = Flask(__name__)

FUNCTION_MAP = {
    'btn_time': my_logic.get_server_time,
    'btn_greet': my_logic.greet_user,    # Requires 'name'
    'btn_add': my_logic.calculate_sum,    # Requires 'a' and 'b'
    'btn-scrape': scrape_wmo.run
}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/execute_function/<func_key>', methods=['POST'])
def execute_function(func_key):
    if func_key not in FUNCTION_MAP:
        return jsonify({"error": "Function not found"}), 404

    # 1. Get arguments from the JSON body sent by JavaScript
    # If no data sent, default to empty dict {}
    data = request.get_json() or {}
    
    # 2. Get the specific 'args' dictionary from that data
    func_args = data.get('args', {})

    try:
        selected_function = FUNCTION_MAP[func_key]
        
        # 3. Call function with unpacked arguments (**func_args)
        # This turns {'name': 'John'} into greet_user(name='John')
        result_data = selected_function(**func_args)
        
        return jsonify({"status": "success", "result": result_data})

    except TypeError as e:
        return jsonify({"status": "error", "message": f"Argument Mismatch: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)