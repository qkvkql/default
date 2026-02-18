import pandas as pd
import html

def create_kml(input_file, output_file):
    print(f"Reading {input_file}...")
    try:
        df = pd.read_excel(input_file)
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return

    # Basic KML Header
    kml_header = """<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Weather Stations</name>
    <Style id="station_style">
      <IconStyle>
        <scale>0.8</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png</href>
        </Icon>
      </IconStyle>
      <LabelStyle>
        <scale>0</scale>
      </LabelStyle>
    </Style>
    <StyleMap id="station_point">
      <Pair>
        <key>normal</key>
        <styleUrl>#station_style</styleUrl>
      </Pair>
      <Pair>
        <key>highlight</key>
        <styleUrl>#station_style</styleUrl>
      </Pair>
    </StyleMap>
"""
    kml_footer = """  </Document>
</kml>"""

    print("Generating KML content...")
    placemarks = []
    
    for index, row in df.iterrows():
        try:
            # Extract basic info (handle NaNs gracefully)
            lat = row.get('latitude')
            lon = row.get('longitude')
            
            if pd.isna(lat) or pd.isna(lon):
                continue
                
            name = str(row.get('cn_name', 'Unknown'))
            if pd.isna(name) or name == 'nan':
                name = str(row.get('domes_name', f"Station {index}"))

            # Build Description Table
            desc_html = '<table border="1" style="border-collapse:collapse; white-space:nowrap;">'
            
            # Fields to display
            fields = [
                ('ID', 'id'), ('USAF', 'USAF'), ('WBAN', 'WBAN'), 
                ('Chinese Name', 'cn_name'), ('DOMES Name', 'domes_name'),
                ('Country', 'country'), ('Province/Capital', 'province_capital'),
                ('Latitude', 'latitude'), ('Longitude', 'longitude'), ('Elevation', 'elev'),
                ('Min Temp', 'min'), ('Max Temp', 'max'), ('Avg Temp', 'avg'),
                ('Timezone', 'timezone'), ('Note', 'note')
            ]
            
            for label, col in fields:
                val = row.get(col, '')
                if pd.notna(val) and str(val).strip() != '':
                    desc_html += f'<tr><td style="font-weight:bold; padding:2px 5px;">{html.escape(label)}</td><td style="padding:2px 5px;">{html.escape(str(val))}</td></tr>'
            
            desc_html += '</table>'
            
            # Create Placemark
            pm = f"""    <Placemark>
      <name>{html.escape(name)}</name>
      <description><![CDATA[{desc_html}]]></description>
      <styleUrl>#station_point</styleUrl>
      <Point>
        <coordinates>{lon},{lat},0</coordinates>
      </Point>
    </Placemark>"""
            placemarks.append(pm)
            
        except Exception as e:
            print(f"Skipping row {index}: {e}")
            continue

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(kml_header)
        f.write('\n'.join(placemarks))
        f.write(kml_footer)
        
    print(f"Successfully created {output_file} with {len(placemarks)} stations.")

if __name__ == "__main__":
    create_kml('stations.xlsx', 'stations.kml')
