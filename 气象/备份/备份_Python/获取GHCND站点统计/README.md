# NOAA Global Daily Statistics

A comprehensive Flask-based web application for analyzing global daily weather data from NOAA's GHCND (Global Historical Climatology Network Daily), GSOD (Global Summary of the Day), and SSODv2 (Synoptic Summary of the Day) datasets.

## Features

*   **Multiple Data Sources**: switch between GHCND, legacy GSOD, successor SSODv2, or an uploaded spreadsheet.
*   **Advanced Statistics**: Calculate Min/Avg/Max temperatures, threshold counts (days above/below specific temperatures), and "Explosive Power" (temperature variance).
*   **Period Analysis**: Compare weather patterns across different years, seasons (Winter/Summer), and custom date ranges.
*   **Multi-Station Analysis**: Search and compare multiple stations based on distance, coordinates, or country.
*   **Visualizations**: Interactive tables and statistics for easy data consumption.
*   **Access Control**: Robust user management system with Admin roles, standard users, and "Special Visitor" access via invitation codes.
*   **Visitor Tracking**: Tracks visitor statistics including IP location, device type, and OS.
*   **Localization**: Full support for English and Chinese (Simplified) interfaces.

## Project Structure

```
├── app.py                 # Main Flask application entry point
├── ghcnd-stations.txt     # GHCND station metadata file
├── isd-history.txt        # GSOD station metadata file
├── ghcnh-station-list.csv # GHCNh/SSODv2 station metadata file
├── requirements.txt       # Python dependencies
├── translations.json      # Localization strings (en/zh)
├── visitors.db            # SQLite database for users and tracking
├── static/                # CSS, JavaScript, and static assets
└── templates/             # HTML templates (Jinja2)
```

## Installation

1.  **Clone the repository** or download the source code.
2.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Prepare Data Files**:
    Ensure `ghcnd-stations.txt` and `isd-history.txt` are present in the root directory. These files contain necessary station metadata.
4.  **Run the Application**:
    ```bash
    python app.py
    ```
5.  **Access the App**:
    Open your browser and navigate to `http://localhost:1002`.

## Application Logic

### Backend (`app.py`)
*   **Data Loading**: On startup, the app loads station metadata from text files into Pandas DataFrames for fast searching.
*   **Data Fetching**: 
    *   **GHCND**: Fetches CSV data directly from NOAA S3 buckets.
    *   **GSOD**: Uses the NCEI API to fetch JSON data.
*   **SSODv2**: Uses the NCEI Access Data Service API by default; the station/year and station-period bulk CSV URLs remain selectable for availability checks.
*   **Data Processing**: Cleans raw data, converts GSOD temperatures from Fahrenheit to Celsius, and filters records by date and element.
*   **Statistics Engine**: Calculates complex metrics like "Explosive Power" (standard deviation of temperature anomalies) and consecutive day streaks matching specific criteria.

### Frontend
*   **Interactive UI**: Built with HTML5, CSS3, and Vanilla JavaScript.
*   **Dynamic Data**: Uses AJAX (`fetch` API) to communicate with the backend `get_data` and `search_stations` endpoints without reloading the page.
*   **Localization**: Frontend content is dynamically rendered based on the selected language in the session.

## User Management
*   **Admin**: Full access to visitor statistics (`/visitor_stats`) and invitation management.
*   **Advanced/Basic User**: Access levels determined by the invitation code used during signup.
*   **Visitor Mode**: Temporary access granted via special link codes.

## Localization
The application supports English and Chinese. Language preferences are stored in the user session and can be toggled via the interface. Translations are managed in `translations.json`.
