import pandas as pd
import json
import math

def generate_json(input_file, output_file):
    print(f"Reading {input_file}...")
    try:
        df = pd.read_excel(input_file)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    stations = []
    
    print("Processing rows...")
    for index, row in df.iterrows():
        try:
            lat = row.get('latitude')
            lon = row.get('longitude')
            
            # Skip invalid coordinates
            if pd.isna(lat) or pd.isna(lon):
                continue
                
            # Helper to safely get value or None
            def get_val(col):
                val = row.get(col)
                if pd.isna(val):
                    return None
                return val

            # Construct station object
            station = {
                "id": get_val('id'),
                "cn_name": str(get_val('cn_name') or get_val('domes_name') or ""),
                "domes_name": str(get_val('domes_name') or ""),
                "lat": float(lat),
                "lon": float(lon),
                "elev": get_val('elev'),
                "min": get_val('min'),
                "max": get_val('max'),
                "avg": get_val('avg'),
                "stereotype": str(get_val('stereotype') or ""),
                "province_capital": str(get_val('province_capital') or ""),
                "country": str(get_val('country') or ""),
                "timezone": str(get_val('timezone') or "")
            }
            
            stations.append(station)
            
        except Exception as e:
            print(f"Skipping row {index}: {e}")
            continue

    print(f"Writing {len(stations)} stations to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(stations, f, ensure_ascii=False, indent=2)
    print("Done.")

if __name__ == "__main__":
    generate_json('stations.xlsx', 'stations.json')
