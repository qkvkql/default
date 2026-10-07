# Pogodaiklimat daily temperature scraper

Downloads daily minimum, maximum, and 8-observation average temperatures for one Pogodaiklimat station, from 1971 through the current year, into an Excel workbook. The site restricts summary data to registered users, so a Pogodaiklimat account is required.

## Run

1. Install Python 3.10 or newer.
2. In this folder, install the dependencies:

   ```powershell
   py -m pip install -r requirements.txt
   ```

3. Start the browser console by double-clicking `Start Scraper.bat` in this folder. The browser page opens automatically. You can also start it from PowerShell:

   ```powershell
   py web_console.py
   ```

4. Enter the five-digit station number and your Pogodaiklimat username and password. Choose either all years or **One month only**; for a single month, enter a year from 1971 through the current year and choose a month. The single-month mode requests just that year/month page using the site's `m` parameter. Credentials are submitted to the site over HTTPS and are not saved by the app.

The page shows retrieval progress and provides a button to download the workbook when it is ready. An all-years export is saved as `pogodaiklimat_<station number>_daily_weather.xlsx`; a single-month export is saved separately as `pogodaiklimat_<station number>_<year>_<month>_daily_weather.xlsx`. Both contain station number, station name, separate year, month, and day columns, daily min, daily max, and daily average in °C. Exact duplicate daily records are reduced to one row. If a date has multiple different temperature combinations, the page lists it in red after retrieval and keeps those records in the workbook for review. Dates without any of the three requested temperature values are omitted. A blank individual value remains blank when the other requested values exist.

All-years mode makes one request per year with a short delay; single-month mode makes one summary request for the selected month. If sign-in fails, the site returns an unexpected page structure, or a request fails, the page shows the reason and the app does not write a partial workbook. Keep the console window open while the export runs; press Ctrl+C there to stop the local server.
