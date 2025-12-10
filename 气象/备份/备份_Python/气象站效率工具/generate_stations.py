# ******** ******** ******** 保证各种语言、特殊符号解码正常 ******** ******** ********
import sys
sys.stdout.reconfigure(encoding='utf-8')

import pandas as pd
import os
import inspect

# ==========================================
# 1. & 2. Define the Class for URL Generation
# ==========================================
class StationUrlGenerators:
    """
    Define methods here. 
    Returns "#" if required data is missing (buttons become grey).
    """
    def __init__(self, row_data):
        self.usaf = str(row_data.get('USAF', '')).strip()
        self.rp5 = str(row_data.get('rp5', '')).strip()
        self.name = str(row_data.get('cn_name', '')).strip()
        self.lat = str(row_data.get('latitude', '')).strip()
        self.lon = str(row_data.get('longitude', '')).strip()
        self.elev = str(row_data.get('elev', '')).strip()

    # --- DEFINED METHODS (In Order) ---

    def url_ogimet_hour(self):
        # Requires USAF
        if not self.usaf: return "#"
        return f"https://ogimet.com/cgi-bin/gsynres?ind={self.usaf}&decoded=yes&ndays=7&ano={{y}}&mes={{m}}&day={{d}}&hora={{h}}"

    def url_rp5_hour(self):
        # Requires rp5
        if not self.rp5: return "#"
        return f"https://rp5.ru/Weather_archive_in_{self.rp5}"

    def url_pogodaiklimat_month_avg(self):
        # Requires USAF
        if not self.usaf: return "#"
        return f"http://www.pogodaiklimat.ru/history/{self.usaf}.htm"

    def url_pogodaiklimat_hour(self):
        # Requires USAF
        if not self.usaf: return "#"
        return f"http://www.pogodaiklimat.ru/weather.php?id={self.usaf}"
    
    def url_pogodaiklimat_day(self):
        # Requires USAF
        if not self.usaf: return "#"
        return f"http://www.pogodaiklimat.ru/monitor.php?id={self.usaf}"

    def url_ogimet_day(self):
        # Requires USAF
        if not self.usaf: return "#"
        return f"https://ogimet.com/cgi-bin/gsynres?ind={self.usaf}&ord=REV&enviar=Ver&ndays=30&ano={{y}}&mes={{m}}&day={{d}}&hora={{h}}"
    
    def url_q_weather_day(self):
        # Requires USAF
        if not self.usaf: return "#"
        return f"https://q-weather.info/weather/{self.usaf}/today/"

    def url_google_maps(self):
        # Requires Latitude AND Longitude
        if not self.lat or not self.lon: return "#"
        return f"https://www.google.com/maps?q={self.lat},{self.lon}"
    
    def url_google_earth(self):
        # Requires Latitude AND Longitude
        if not self.lat or not self.lon: return "#"
        return f"https://earth.google.com/web/@{self.lat},{self.lon},2733.91273008a,1270795.35540774d,30.00000006y,0h,0t,0r/"

    def url_terrain_color_map(self):
        # Requires Latitude AND Longitude
        if not self.lat or not self.lon: return "#"
        return f"https://en-au.topographic-map.com/world/?center={self.lat}%2C{self.lon}&zoom=6&base=6"

    def url_pogodaiklimat_climate(self):
        # Requires USAF
        if not self.usaf: return "#"
        return f"http://www.pogodaiklimat.ru/climate.php?id={self.usaf}"
    def url_pogodaiklimat_climate4(self):
        # Requires USAF
        if not self.usaf: return "#"
        return f"http://www.pogodaiklimat.ru/climate4.php?id={self.usaf}"
    def url_pogodaiklimat_climat7(self):
        # Requires USAF
        if not self.usaf: return "#"
        return f"http://www.pogodaiklimat.ru/climate7.php?id={self.usaf}"

# ==========================================
# 3. Read Data and Apply Logic
# ==========================================
def clean_number_string(val):
    if pd.isna(val) or str(val).strip() == "":
        return ""
    try:
        return str(int(float(val)))
    except (ValueError, TypeError):
        return str(val).strip()

def load_and_process_data(file_path):
    print(f"Reading file: {file_path}")
    
    if not os.path.exists(file_path):
        print("Error: File not found.")
        return []

    try:
        df = pd.read_excel(file_path, sheet_name="站点信息和记录", engine='openpyxl')
    except Exception as e:
        print(f"Error reading Excel: {e}")
        return []

    processed_rows = []

    for index, row in df.iterrows():
        # Condition: ID not empty AND Name not empty
        id_val = row.get('id')
        name_val = row.get('cn_name')

        if pd.notna(id_val) and pd.notna(name_val) and str(name_val).strip() != "":
            
            # Clean Data
            usaf_clean = clean_number_string(row.get('USAF'))
            rp5_clean = clean_number_string(row.get('rp5'))
            
            row_dict = row.fillna('').to_dict()
            row_dict['USAF'] = usaf_clean
            row_dict['rp5'] = rp5_clean
            row_dict['latitude'] = str(row.get('latitude', '')).strip()
            row_dict['longitude'] = str(row.get('longitude', '')).strip()

            processed_rows.append(row_dict)

    print(f"Total rows found: {len(df)}")
    print(f"Rows matching criteria: {len(processed_rows)}")
    return processed_rows

# ==========================================
# 4. Build HTML Page
# ==========================================
def generate_html(stations, output_file="站点大全.html"):
    
    html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>站点助手</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; background-color: #f4f6f8; padding: 20px; }
        
        /* Control Panel */
        .controls { 
            background: #fff; padding: 20px; border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px;
            display: flex; flex-direction: column; align-items: center; gap: 15px;
        }
        
        .search-input { 
            padding: 10px; width: 350px; font-size: 16px; 
            border: 1px solid #ccc; border-radius: 5px; 
        }

        .checkbox-wrapper {
            display: flex; align-items: center; font-size: 18px; font-weight: bold; color: #333;
            background: #e9ecef; padding: 10px 20px; border-radius: 50px;
            cursor: pointer; user-select: none;
        }
        .checkbox-wrapper:hover { background: #dee2e6; }
        .checkbox-wrapper input { width: 25px; height: 25px; margin-right: 10px; cursor: pointer; }

        /* Grid Layout */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 20px; }

        /* Station Card */
        .card {
            background: white; border-radius: 8px; padding: 20px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
            transition: transform 0.2s;
        }
        .card:hover { transform: translateY(-3px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
        
        .card h3 { margin: 0 0 10px 0; color: #2c3e50; font-size: 1.1em; }
        
        /* Meta Data Styling */
        .meta { color: #555; font-size: 0.9em; margin-bottom: 15px; line-height: 1.6; }
        .meta-label { font-weight: bold; color: #777; }
        
        /* Copyable Fields Styling */
        .copyable {
            cursor: copy;
            color: #0056b3;
            border-bottom: 1px dashed #a0cfff;
            position: relative;
            padding: 0 2px;
            transition: background 0.2s;
        }
        .copyable:hover { background-color: #e6f2ff; }
        
        /* Tooltip 'Copied!' effect */
        .copyable::after {
            content: "Copied!";
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
            white-space: nowrap;
        }
        .copyable.show-tooltip::after { opacity: 1; }

        /* Buttons */
        .btn-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .btn {
            text-decoration: none; color: white; background-color: #3498db;
            padding: 6px 10px; border-radius: 4px; font-size: 0.85em;
            transition: background 0.2s; border: none;
        }
        .btn:hover { background-color: #2980b9; }
        .btn.disabled { 
            background-color: #e0e0e0; color: #a0a0a0; 
            pointer-events: none; cursor: not-allowed;
        }
    </style>
</head>
<body>

    <div class="controls">
        <label class="checkbox-wrapper">
            <input type="checkbox" id="force12Btn" onchange="updateAllLinks()">
            Force Hour to 12:00 UTC
        </label>
        
        <!-- Updated Placeholder to reflect RP5 is searchable -->
        <input type="text" class="search-input" id="searchInput" onkeyup="filterStations()" 
               placeholder="Search by Name, USAF, RP5, or ID...">
               
        <div id="timeDisplay" style="color: #666; font-size: 0.9em;"></div>
    </div>

    <div class="grid" id="stationGrid">
    """

    for data in stations:
        gen_instance = StationUrlGenerators(data)
        
        # Prepare Data
        id_val = str(int(data.get('id', '')))
        cn_name = str(data.get('cn_name', ''))
        level1 = str(data.get('level1', ''))
        usaf = str(data.get('USAF', ''))
        rp5 = str(data.get('rp5', ''))
        lat = str(data.get('latitude', ''))
        lon = str(data.get('longitude', ''))

        display_name = f"{level1} {cn_name}".strip()
        
        # --- UPDATE: Added rp5 to search terms ---
        search_terms = f"{id_val} {level1} {cn_name} {usaf} {rp5}"

        # Logic for Coordinates string (Tab separated for copy)
        if lat and lon:
            coord_val = f"{lat}\t{lon}" 
        else:
            coord_val = ""

        html_content += f"""
        <div class="card" data-search="{search_terms}">
            <h3>{display_name}</h3>
            <div class="meta">
                <span class="meta-label">ID:</span> {id_val} <br>
                
                <span class="meta-label">USAF:</span> 
                <span class="copyable" onclick="copyText(this)" data-value="{usaf}">{usaf if usaf else '-'}</span> 
                
                | <span class="meta-label">RP5:</span> 
                <span class="copyable" onclick="copyText(this)" data-value="{rp5}">{rp5 if rp5 else '-'}</span> 
                
                <br>
                <span class="meta-label">Coords:</span> 
                <span class="copyable" onclick="copyText(this)" data-value="{coord_val}" 
                      style="white-space: pre;">{coord_val if coord_val else '-'}</span>
            </div>
            <div class="btn-container">
        """

        # Generate Buttons
        for method_name, func in StationUrlGenerators.__dict__.items():
            if method_name.startswith('url_') and callable(func):
                try:
                    url_template = func(gen_instance)
                except Exception:
                    url_template = "#"

                display_btn_name = method_name.replace('url_', '').replace('_', ' ').title()
                is_disabled = "disabled" if (not url_template or url_template == "#") else ""
                
                html_content += f"""
                <a href="#" class="btn dynamic-link {is_disabled}" 
                   data-template="{url_template}">{display_btn_name}</a>
                """

        html_content += """
            </div>
        </div>
        """

    html_content += """
    </div>

    <script>
        // --- 1. Copy Functionality ---
        function copyText(element) {
            const textToCopy = element.getAttribute('data-value');
            if (!textToCopy || textToCopy === "-") return;

            navigator.clipboard.writeText(textToCopy).then(() => {
                element.classList.add('show-tooltip');
                setTimeout(() => {
                    element.classList.remove('show-tooltip');
                }, 1000);
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }

        // --- 2. Time & URL Logic ---
        function getUtcTimeComponents() {
            const now = new Date();
            const y = now.getUTCFullYear();
            const m = String(now.getUTCMonth() + 1).padStart(2, '0');
            const d = String(now.getUTCDate()).padStart(2, '0');
            const temp_h = String(now.getUTCHours()).padStart(2, '0');
            return { y, m, d, temp_h };
        }

        function updateAllLinks() {
            const timeObj = getUtcTimeComponents();
            const checkbox = document.getElementById('force12Btn');
            let h = checkbox.checked ? "12" : timeObj.temp_h;

            document.getElementById('timeDisplay').innerText = 
                `Base Time (UTC): ${timeObj.y}-${timeObj.m}-${timeObj.d} ${h}:00`;

            const links = document.querySelectorAll('.dynamic-link');

            links.forEach(link => {
                let template = link.getAttribute('data-template');
                if (template && template !== "#") {
                    let finalUrl = template
                        .replace(/{y}/g, timeObj.y)
                        .replace(/{m}/g, timeObj.m)
                        .replace(/{d}/g, timeObj.d)
                        .replace(/{h}/g, h);
                    link.href = finalUrl;
                }
            });
        }

        // --- 3. Filter Logic ---
        function filterStations() {
            const input = document.getElementById('searchInput').value.toUpperCase();
            const cards = document.getElementsByClassName('card');
            for (let i = 0; i < cards.length; i++) {
                // This data-search attribute now includes RP5
                const searchData = cards[i].getAttribute('data-search');
                if (searchData.toUpperCase().indexOf(input) > -1) {
                    cards[i].style.display = "";
                } else {
                    cards[i].style.display = "none";
                }
            }
        }

        window.onload = function() {
            updateAllLinks();
        };
    </script>
</body>
</html>
    """

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    
    print(f"Success! Generated: {os.path.abspath(output_file)}")

# ==========================================
# Main Execution
# ==========================================
if __name__ == "__main__":
    FILE_PATH = r"D:\文档\GIT SYNC\default\气象\For_Python_站点信息和记录.xlsx"
    
    data = load_and_process_data(FILE_PATH)
    
    if data:
        generate_html(data)