"""Web UI + JSON API for 8-point daily average temperature (q-weather.info)."""

from __future__ import annotations

import csv
import functools
import re
from datetime import date, datetime
from pathlib import Path

import openpyxl
from flask import Flask, jsonify, render_template, request

from weather_scrape import compute_eight_point_average, compute_monthly_partial_means

# Path to the station info Excel file
STATIONS_XLSX = r"D:\文档\GIT SYNC\default\气象\For_Python_站点信息和记录.xlsx"
BULK_STATIONS_CSV = Path(__file__).with_name("bulk_stations.csv")


@functools.lru_cache(maxsize=1)
def _load_stations() -> list[dict]:
    """Read the Excel file once and return filtered station list."""
    wb = openpyxl.load_workbook(STATIONS_XLSX, read_only=True, data_only=True)
    ws = wb.active
    rows = ws.iter_rows(values_only=True)
    headers = [str(h) if h is not None else "" for h in next(rows)]
    stations: list[dict] = []
    for row in rows:
        rd = dict(zip(headers, row))
        usaf = str(rd.get("USAF") or "").strip()
        country = str(rd.get("country") or "").strip()
        if country == "中国" and len(usaf) == 5 and usaf.isdigit():
            stations.append(
                {
                    "usaf": usaf,
                    "level1": str(rd.get("level1") or "").strip(),
                    "cn_name": str(rd.get("cn_name") or "").strip(),
                }
            )
    wb.close()
    stations.sort(key=lambda s: s["usaf"])
    return stations

app = Flask(__name__)


def _load_bulk_stations() -> list[dict[str, str]]:
    """Read and validate the shared CSV source for bulk calculations."""
    with BULK_STATIONS_CSV.open("r", encoding="utf-8-sig", newline="") as source:
        station_values = csv.DictReader(source)
        if not station_values.fieldnames or not {"name", "station_id"}.issubset(station_values.fieldnames):
            raise ValueError("Bulk station CSV must have name and station_id columns.")
        station_values = list(station_values)

    stations = []
    for value in station_values:
        station = str(value.get("station_id") or "").strip()
        name = str(value.get("name") or "").strip()
        if not re.fullmatch(r"\d{5}", station):
            raise ValueError(f"Invalid station number in bulk station CSV: {station!r}")
        if not name:
            raise ValueError(f"Missing station name for station {station} in bulk station CSV.")
        if not any(item["station"] == station for item in stations):
            stations.append({"station": station, "name": name})
    return stations


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/stations")
def api_stations():
    """Return China weather stations with 5-digit USAF codes."""
    try:
        return jsonify(_load_stations())
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


@app.route("/api/calculate")
def api_calculate():
    station = (request.args.get("station") or "").strip()
    date_s = (request.args.get("date") or "").strip()
    if not station or not date_s:
        return jsonify({"error": "Missing station or date"}), 400
    try:
        target = datetime.strptime(date_s, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date; use YYYY-MM-DD"}), 400
    try:
        result = compute_eight_point_average(station, target)
    except Exception as e:
        return (
            jsonify(
                {
                    "error": "Failed to fetch or parse q-weather.info",
                    "detail": str(e),
                }
            ),
            502,
        )
    return jsonify(result)


@app.route("/api/bulk-calculate")
def api_bulk_calculate():
    date_s = (request.args.get("date") or "").strip()
    if not date_s:
        return jsonify({"error": "Missing date"}), 400
    try:
        target = datetime.strptime(date_s, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date; use YYYY-MM-DD"}), 400

    try:
        stations = _load_bulk_stations()
    except (OSError, csv.Error, ValueError) as exc:
        return jsonify({"error": f"Could not load bulk station list: {exc}"}), 500

    if not stations:
        return jsonify({"error": "The bulk station list is empty."}), 400

    results = []
    for station_entry in stations:
        station = station_entry["station"]
        station_name = station_entry["name"]
        try:
            result = compute_eight_point_average(station, target)
            results.append(
                {
                    "station": station,
                    "station_name": station_name,
                    "eight_point_ok": result["ok"],
                    "eight_point_average": result["average"],
                    "four_point_ok": result["four_point_ok"],
                    "four_point_average": result["four_point_average"],
                }
            )
        except Exception as exc:
            results.append({"station": station, "station_name": station_name, "error": str(exc)})

    return jsonify({"date": target.isoformat(), "results": results})


@app.route("/api/monthly")
def api_monthly():
    station = (request.args.get("station") or "").strip()
    date_s = (request.args.get("date") or "").strip()
    year_s = (request.args.get("year") or "").strip()
    month_s = (request.args.get("month") or "").strip()

    if not station:
        return jsonify({"error": "Missing station"}), 400

    target: date | None = None
    if year_s and month_s:
        try:
            y = int(year_s, 10)
            mo = int(month_s, 10)
            if mo < 1 or mo > 12 or y < 1900 or y > 2100:
                raise ValueError
            target = date(y, mo, 1)
        except ValueError:
            return jsonify({"error": "Invalid year or month"}), 400
    elif date_s:
        try:
            target = datetime.strptime(date_s, "%Y-%m-%d").date()
        except ValueError:
            return jsonify({"error": "Invalid date; use YYYY-MM-DD"}), 400
    else:
        return jsonify(
            {"error": "Provide date=YYYY-MM-DD or both year and month (1–12)"}
        ), 400
    try:
        result = compute_monthly_partial_means(station, target)
    except Exception as e:
        return (
            jsonify(
                {
                    "error": "Failed to fetch or parse q-weather.info",
                    "detail": str(e),
                }
            ),
            502,
        )
    return jsonify(result)


@app.route("/api/bulk-monthly")
def api_bulk_monthly():
    year_s = (request.args.get("year") or "").strip()
    month_s = (request.args.get("month") or "").strip()
    try:
        year = int(year_s, 10)
        month = int(month_s, 10)
        if month < 1 or month > 12 or year < 1900 or year > 2100:
            raise ValueError
        target = date(year, month, 1)
    except ValueError:
        return jsonify({"error": "Invalid year or month"}), 400

    try:
        stations = _load_bulk_stations()
    except (OSError, csv.Error, ValueError) as exc:
        return jsonify({"error": f"Could not load bulk station list: {exc}"}), 500

    if not stations:
        return jsonify({"error": "The bulk station list is empty."}), 400

    results = []
    for station_entry in stations:
        station = station_entry["station"]
        station_name = station_entry["name"]
        try:
            result = compute_monthly_partial_means(station, target)
            eight = result["eight_point"]
            four = result["four_point"]
            results.append(
                {
                    "station": station,
                    "station_name": station_name,
                    "eight_point_average": eight["mean"],
                    "eight_point_available": eight["used_count"],
                    "eight_point_expected": eight["required_count"],
                    "four_point_average": four["mean"],
                    "four_point_available": four["used_count"],
                    "four_point_expected": four["required_count"],
                }
            )
        except Exception as exc:
            results.append({"station": station, "station_name": station_name, "error": str(exc)})

    return jsonify({"month": target.strftime("%Y-%m"), "results": results})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=1004, debug=True)
