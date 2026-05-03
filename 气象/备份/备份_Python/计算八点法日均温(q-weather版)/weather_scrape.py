"""Fetch hourly history from q-weather.info and compute 8- and 4-point daily mean temperatures."""

from __future__ import annotations

import calendar
import re
from datetime import date, datetime, timedelta
from typing import Any

import requests
from bs4 import BeautifulSoup

BASE = "https://q-weather.info"
USER_AGENT = (
    "Mozilla/5.0 (compatible; EightPointTemp/1.0; +https://q-weather.info/) "
    "Python-requests"
)

# (calendar date of the observation, hour 0-23) -> temperature °C
ObsMap = dict[tuple[str, int], float]

_ROW_TIME_RE = re.compile(
    r"^(\d{4}-\d{2}-\d{2})\s+(\d{2}):\d{2}\s+([+-]\d{4})$"
)
_STATION_NAME_RE = re.compile(r"查询\s*\d+\s*\(([^)]+)\)\s*的历史天气")


def _history_url(station: str, d: date) -> str:
    return f"{BASE}/weather/{station}/history/?date={d.isoformat()}"


def fetch_observations(station: str, d: date, timeout: float = 30.0) -> ObsMap:
    """Parse one history page: map (YYYY-MM-DD, hour) -> instantaneous temperature."""
    url = _history_url(station, d)
    r = requests.get(
        url,
        timeout=timeout,
        headers={"User-Agent": USER_AGENT},
    )
    r.raise_for_status()
    r.encoding = r.apparent_encoding or "utf-8"
    return parse_history_html(r.text)


def parse_station_name(html: str) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    h1 = soup.find("h1")
    if h1 is None:
        return None
    text = h1.get_text(" ", strip=True)
    m = _STATION_NAME_RE.search(text)
    if m:
        return m.group(1).strip() or None
    return None


def fetch_station_name(station: str, d: date, timeout: float = 30.0) -> str | None:
    url = _history_url(station, d)
    r = requests.get(
        url,
        timeout=timeout,
        headers={"User-Agent": USER_AGENT},
    )
    r.raise_for_status()
    r.encoding = r.apparent_encoding or "utf-8"
    return parse_station_name(r.text)


def parse_history_html(html: str) -> ObsMap:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", class_="border")
    if table is None:
        return {}
    tbody = table.find("tbody")
    if tbody is None:
        return {}
    out: ObsMap = {}
    for tr in tbody.find_all("tr"):
        cells = tr.find_all("td")
        if len(cells) < 2:
            continue
        time_text = cells[0].get_text(strip=True)
        m = _ROW_TIME_RE.match(time_text)
        if not m:
            continue
        day_s, hour_s, _tz = m.group(1), m.group(2), m.group(3)
        hour = int(hour_s, 10)
        temp_raw = cells[1].get_text(strip=True)
        if temp_raw == "" or temp_raw == "-":
            continue
        try:
            temp = float(temp_raw)
        except ValueError:
            continue
        out[(day_s, hour)] = temp
    return out


def required_slots_eight(target: date) -> list[tuple[str, int]]:
    prev = target - timedelta(days=1)
    return [
        (prev.isoformat(), 23),
        (target.isoformat(), 2),
        (target.isoformat(), 5),
        (target.isoformat(), 8),
        (target.isoformat(), 11),
        (target.isoformat(), 14),
        (target.isoformat(), 17),
        (target.isoformat(), 20),
    ]


def required_slots_four(target: date) -> list[tuple[str, int]]:
    d = target.isoformat()
    return [(d, 2), (d, 8), (d, 14), (d, 20)]


def slot_label(day: str, hour: int) -> str:
    return f"{day} {hour:02d}:00"


def unique_eight_point_slots_month(year: int, month: int) -> list[tuple[str, int]]:
    """
    All distinct observation times needed for every daily 8-point mean in that month.
    First slot is last day of previous month at 23:00; last slots are last day of month
    at 02..20 (no 23:00 on last day).
    """
    _, n_days = calendar.monthrange(year, month)
    seen: set[tuple[str, int]] = set()
    ordered: list[tuple[str, int]] = []
    for day in range(1, n_days + 1):
        cur = date(year, month, day)
        prev = cur - timedelta(days=1)
        keys = [(prev.isoformat(), 23)]
        keys += [(cur.isoformat(), h) for h in (2, 5, 8, 11, 14, 17, 20)]
        for key in keys:
            if key not in seen:
                seen.add(key)
                ordered.append(key)
    return ordered


def four_point_slots_month(year: int, month: int) -> list[tuple[str, int]]:
    """02, 08, 14, 20 on each calendar day of the month (chronological)."""
    _, n_days = calendar.monthrange(year, month)
    out: list[tuple[str, int]] = []
    for day in range(1, n_days + 1):
        cur = date(year, month, day)
        d = cur.isoformat()
        for h in (2, 8, 14, 20):
            out.append((d, h))
    return out


def _dates_needed_for_slots(slots: list[tuple[str, int]]) -> set[date]:
    return {datetime.strptime(s, "%Y-%m-%d").date() for s, _ in slots}


def _merge_observations_for_dates(
    station: str, dates: set[date], *, timeout: float
) -> ObsMap:
    merged: ObsMap = {}
    for d in sorted(dates):
        merged.update(fetch_observations(station, d, timeout=timeout))
    return merged


def partial_mean_over_slots(merged: ObsMap, slots: list[tuple[str, int]]) -> dict[str, Any]:
    """Mean over available slots only; list every missing slot label."""
    values: list[float] = []
    missing: list[str] = []
    for day_s, hour in slots:
        key = (day_s, hour)
        if key in merged:
            values.append(merged[key])
        else:
            missing.append(slot_label(day_s, hour))
    used = len(values)
    req = len(slots)
    mean = round(sum(values) / used, 2) if used else None
    return {
        "mean": mean,
        "used_count": used,
        "required_count": req,
        "missing": missing,
        "missing_count": len(missing),
    }


def compute_monthly_partial_means(
    station: str, target: date, *, timeout: float = 30.0
) -> dict[str, Any]:
    """8- and 4-point style coverage for target's calendar month; partial means + missing list."""
    y, m = target.year, target.month
    slots8 = unique_eight_point_slots_month(y, m)
    slots4 = four_point_slots_month(y, m)
    dates = _dates_needed_for_slots(slots8) | _dates_needed_for_slots(slots4)
    merged = _merge_observations_for_dates(station, dates, timeout=timeout)
    station_name = fetch_station_name(station, target, timeout=timeout)
    return {
        "month": f"{y:04d}-{m:02d}",
        "eight_point": partial_mean_over_slots(merged, slots8),
        "four_point": partial_mean_over_slots(merged, slots4),
        "station": station,
        "station_name": station_name,
    }


def _evaluate_slots(merged: ObsMap, slots: list[tuple[str, int]]) -> dict[str, Any]:
    points: list[dict[str, Any]] = []
    missing: list[str] = []
    temps: list[float] = []
    for day_s, hour in slots:
        key = (day_s, hour)
        label = slot_label(day_s, hour)
        if key not in merged:
            missing.append(label)
            points.append({"slot": label, "temperature": None})
        else:
            t = merged[key]
            temps.append(t)
            points.append({"slot": label, "temperature": t})
    if missing:
        return {
            "ok": False,
            "average": None,
            "points": points,
            "missing": missing,
        }
    avg = sum(temps) / len(temps)
    return {
        "ok": True,
        "average": round(avg, 2),
        "points": points,
        "missing": [],
    }


def compute_eight_point_average(
    station: str,
    target: date,
    *,
    timeout: float = 30.0,
) -> dict[str, Any]:
    """
    Return JSON-serializable result for 8-point (ok, average, points, missing) plus
    four_point_* for the same calendar day at 02, 08, 14, 20 (independent completeness).
    Monthly partial means are computed separately (see compute_monthly_partial_means).
    """
    prev = target - timedelta(days=1)
    obs_prev = fetch_observations(station, prev, timeout=timeout)
    obs_day = fetch_observations(station, target, timeout=timeout)
    station_name = fetch_station_name(station, target, timeout=timeout)
    merged: ObsMap = {**obs_prev, **obs_day}

    eight = _evaluate_slots(merged, required_slots_eight(target))
    four = _evaluate_slots(merged, required_slots_four(target))
    return {
        "ok": eight["ok"],
        "average": eight["average"],
        "points": eight["points"],
        "missing": eight["missing"],
        "four_point_ok": four["ok"],
        "four_point_average": four["average"],
        "four_point_points": four["points"],
        "four_point_missing": four["missing"],
        "station": station,
        "station_name": station_name,
        "date": target.isoformat(),
    }
