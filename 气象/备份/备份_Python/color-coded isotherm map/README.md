# Color-coded Isotherm Map

This is a local Flask project for drawing a color-coded isotherm map from an Excel source file and one or more KML boundary files.

## Features

- Select an Excel file in the browser.
- Choose latitude, longitude, and value columns after the file is read.
- Select one or more KML files and clip the rendered surface to those polygon boundaries.
- Edit human-friendly temperature color intervals.
- Draw a standalone Kriging interpolation image clipped to the selected KML boundaries, with the boundary outline included in the PNG.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open the local URL printed by Flask, usually:

```text
http://127.0.0.1:5000
```

## Input Notes

- Excel files should contain numeric latitude, longitude, and value columns.
- KML files must contain `Polygon` boundaries. Multiple polygons and multiple KML files are merged into one clipping boundary.
- Color rules must be continuous. For example, `-10 to 0`, `0 to 10`, and `10 to 20`.
