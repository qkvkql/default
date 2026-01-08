import os
import pandas as pd
import traceback
import json
from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

PREDEFINED_FILES = {
    "站点信息(Python)": r"D:\文档\GIT SYNC\default\气象\For_Python_站点信息和记录.xlsx",
    "Mongol冷站记录": r"D:\文档\GIT SYNC\default\气象\蒙古存档.xlsx",
    "站点信息(老版)": r"D:\文档\GIT SYNC\default\气象\站点信息.xlsx"
}

MAX_ROWS = 2000

def parse_file(filepath_or_buffer, global_keyword="", column_filters=None):
    try:
        # Detect file type
        filename = ""
        if hasattr(filepath_or_buffer, 'filename'):
            filename = filepath_or_buffer.filename
        elif isinstance(filepath_or_buffer, str):
            filename = filepath_or_buffer

        is_csv = filename.lower().endswith('.csv')
        
        if is_csv:
            df = pd.read_csv(filepath_or_buffer)
            xls_dict = {"CSV_Data": df}
        else:
            engine = None
            if isinstance(filepath_or_buffer, str):
                if filepath_or_buffer.lower().endswith('.xls'):
                    engine = 'xlrd'
                else:
                    engine = 'openpyxl'

            xls_dict = pd.read_excel(filepath_or_buffer, sheet_name=None, engine=engine)
        
        output_data = {}
        sheet_names = list(xls_dict.keys())
        
        # Clean inputs
        global_keyword = str(global_keyword).strip().lower()
        if column_filters is None:
            column_filters = {}

        for sheet_name, df in xls_dict.items():
            # 2. Reformat Date columns to string for search/display
            for col in df.columns:
                if pd.api.types.is_datetime64_any_dtype(df[col]):
                    df[col] = df[col].dt.strftime('%Y-%m-%d %H:%M:%S')

            # 3. COLUMN FILTERS (Ordered before Global Search and final string conversion)
            if isinstance(column_filters, list):
                for f in column_filters:
                    col_name = f.get('column')
                    f_type = f.get('type', 'string')
                    if col_name not in df.columns:
                        continue
                    
                    if f_type == 'string':
                        val = f.get('value')
                        if val:
                            df = df[df[col_name].astype(str).str.contains(str(val), case=False, na=False)]
                    elif f_type == 'number':
                        try:
                            start = float(f.get('start', 0))
                            step = float(f.get('step', 0))
                            end = start + step
                            # Numeric comparison: convert col to numeric safely
                            num_col = pd.to_numeric(df[col_name], errors='coerce')
                            df = df[(num_col >= start) & (num_col <= end)]
                        except (ValueError, TypeError):
                            continue
            elif isinstance(column_filters, dict):
                # Backward compatibility for any old-style calls
                for col_name, search_val in column_filters.items():
                    if col_name in df.columns and search_val:
                        df = df[df[col_name].astype(str).str.contains(str(search_val), case=False, na=False)]

            # 4. GLOBAL SEARCH
            if global_keyword:
                # Temporary string version for row-wide search
                mask = df.astype(str).apply(lambda row: row.str.contains(global_keyword, case=False).any(), axis=1)
                df = df[mask]

            # 5. FINAL STRING CONVERSION FOR DISPLAY
            df = df.astype(object).fillna("").astype(str)
            df = df.replace(["nan", "<NA>", "None", "NaT", "inf", "-inf"], "")

            # 6. ROW LIMIT CHECK
            # Instead of erroring, we set a flag
            row_count = len(df)
            is_too_large = row_count > MAX_ROWS
            
            headers = df.columns.tolist()
            
            # If too large, send empty rows to save bandwidth, but KEEP HEADERS
            if is_too_large:
                rows = [] 
            else:
                rows = df.values.tolist()
            
            output_data[sheet_name] = {
                "headers": headers,
                "rows": rows,
                "row_count": row_count,  # Send actual count
                "too_large": is_too_large # Tell frontend if it was truncated
            }
        
        return {"success": True, "sheets": sheet_names, "data": output_data}

    except Exception as e:
        print("\n!!!!!!!!!!! SERVER ERROR !!!!!!!!!!!")
        traceback.print_exc()
        return {"success": False, "error": str(e)}

@app.route('/')
def index():
    return render_template('index.html', file_keys=PREDEFINED_FILES.keys())

@app.route('/get_predefined', methods=['POST'])
def get_predefined():
    data = request.json
    file_key = data.get('key')
    keyword = data.get('keyword', "")
    col_filters = data.get('column_filters', {})
    
    file_path = PREDEFINED_FILES.get(file_key)
    if not file_path or not os.path.exists(file_path):
        return jsonify({"success": False, "error": f"File not found: {file_path}"})
    
    return jsonify(parse_file(file_path, keyword, col_filters))

@app.route('/upload_file', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"})
    
    file = request.files['file']
    keyword = request.form.get('keyword', "")
    col_filters_str = request.form.get('column_filters', '{}')
    try:
        col_filters = json.loads(col_filters_str)
    except:
        col_filters = {}

    if file.filename == '':
        return jsonify({"success": False, "error": "No file selected"})
        
    return jsonify(parse_file(file, keyword, col_filters))

if __name__ == '__main__':
    app.run(debug=True, port=1003)