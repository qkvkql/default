import os
import pandas as pd
import traceback
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# --- CONFIGURATION ---
PREDEFINED_FILES = {
    "站点信息(Python)": r"D:\文档\GIT SYNC\default\气象\For_Python_站点信息和记录.xlsx",
    "Mongol冷站记录": r"D:\文档\GIT SYNC\default\气象\蒙古存档.xlsx",
    "站点信息(老版)": r"D:\文档\GIT SYNC\default\气象\站点信息.xlsx"
}

# NEW: Set your row limit here
MAX_ROWS = 2000

def parse_excel(filepath_or_buffer):
    try:
        engine = None
        if isinstance(filepath_or_buffer, str):
            if filepath_or_buffer.lower().endswith('.xls'):
                engine = 'xlrd'
            else:
                engine = 'openpyxl'

        # Read all sheets
        xls_dict = pd.read_excel(filepath_or_buffer, sheet_name=None, engine=engine)
        
        output_data = {}
        sheet_names = list(xls_dict.keys())

        # --- 1. NEW LOGIC: Check Row Count BEFORE processing ---
        for sheet_name, df in xls_dict.items():
            row_count = len(df)
            if row_count > MAX_ROWS:
                return {
                    "success": False, 
                    "error": f"File rejected: Sheet '{sheet_name}' has {row_count} rows. (Limit is {MAX_ROWS} rows)"
                }
        # -------------------------------------------------------

        for sheet_name, df in xls_dict.items():
            # Date formatting
            for col in df.columns:
                if pd.api.types.is_datetime64_any_dtype(df[col]):
                    df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')

            # Conversions
            df = df.astype(object)
            df = df.fillna("")
            df = df.astype(str)
            df = df.replace(["nan", "<NA>", "None", "NaT", "inf", "-inf"], "")

            headers = df.columns.tolist()
            rows = df.values.tolist()
            
            output_data[sheet_name] = {
                "headers": headers,
                "rows": rows
            }
        
        return {"success": True, "sheets": sheet_names, "data": output_data}

    except Exception as e:
        print("\n!!!!!!!!!!! SERVER ERROR !!!!!!!!!!!")
        traceback.print_exc()
        print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
        return {"success": False, "error": str(e)}

# ... (The rest of your routes remain exactly the same) ...

@app.route('/')
def index():
    return render_template('index.html', file_keys=PREDEFINED_FILES.keys())

@app.route('/get_predefined', methods=['POST'])
def get_predefined():
    data = request.json
    file_key = data.get('key')
    file_path = PREDEFINED_FILES.get(file_key)
    
    if not file_path:
        return jsonify({"success": False, "error": "File key not found."})
    if not os.path.exists(file_path):
        return jsonify({"success": False, "error": f"File not found: {file_path}"})
    
    return jsonify(parse_excel(file_path))

@app.route('/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"})
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No file selected"})
        
    return jsonify(parse_excel(file))

if __name__ == '__main__':
    app.run(debug=True, port=1003)