import pandas as pd
import json
import os

def generate_stations_json():
    file_path = r"D:\文档\GIT SYNC\default\气象\For_Python_站点信息和记录.xlsx"
    output_path = r"d:\文档\NodeJsFiles\Chrome扩展_获取tyarchive最近日期气温\stations.json"

    print(f"Reading {file_path}...")
    # Read the Excel file
    df = pd.read_excel(file_path)

    # Filter for stations in China
    china_stations = df[df['country'] == '中国'].copy()

    # Select columns that would be useful for display and identification
    # Select specific columns
    columns_to_keep = ['USAF', 'domes_id', 'level1', 'cn_name']
    available_columns = [col for col in columns_to_keep if col in china_stations.columns]
    china_stations = china_stations[available_columns]

    def format_id(val):
        if pd.isna(val) or str(val).strip() == "":
            return ""
        try:
            return str(int(float(val)))
        except ValueError:
            return str(val).strip()

    if 'USAF' in china_stations.columns:
        china_stations['USAF'] = china_stations['USAF'].apply(format_id).apply(lambda x: x.zfill(5) if x else "")
    
    if 'domes_id' in china_stations.columns:
        china_stations['domes_id'] = china_stations['domes_id'].apply(format_id)

    # Replace NaN with empty string
    china_stations = china_stations.fillna("")

    # Convert to a list of dictionaries
    stations_list = china_stations.to_dict(orient='records')

    # Save to JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(stations_list, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated {output_path} with {len(stations_list)} stations.")

if __name__ == "__main__":
    generate_stations_json()
