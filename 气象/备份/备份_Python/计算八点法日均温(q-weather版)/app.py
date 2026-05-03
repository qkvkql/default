"""Web UI + JSON API for 8-point daily average temperature (q-weather.info)."""

from __future__ import annotations

from datetime import datetime

from flask import Flask, jsonify, render_template, request

from weather_scrape import compute_eight_point_average, compute_monthly_partial_means

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


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


@app.route("/api/monthly")
def api_monthly():
    station = (request.args.get("station") or "").strip()
    date_s = (request.args.get("date") or "").strip()
    if not station or not date_s:
        return jsonify({"error": "Missing station or date"}), 400
    try:
        target = datetime.strptime(date_s, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date; use YYYY-MM-DD"}), 400
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


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=1004, debug=True)
