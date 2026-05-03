#!/usr/bin/env python3
"""CLI: scrape q-weather.info and print 8-point daily average temperature."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime

from weather_scrape import compute_eight_point_average, compute_monthly_partial_means


def main() -> int:
    p = argparse.ArgumentParser(
        description="8- and 4-point daily mean temperatures from q-weather.info "
        "(8: prev 23:00 + day 02,05,08,11,14,17,20; 4: day 02,08,14,20)."
    )
    p.add_argument("station", help="Weather station number, e.g. 50136")
    p.add_argument("date", help="Target calendar date YYYY-MM-DD")
    p.add_argument(
        "--json",
        action="store_true",
        help="Print full JSON result instead of a one-line summary",
    )
    p.add_argument(
        "--monthly",
        action="store_true",
        help="Also compute partial monthly means (slow; many HTTP requests)",
    )
    args = p.parse_args()

    try:
        target = datetime.strptime(args.date, "%Y-%m-%d").date()
    except ValueError:
        print("Invalid date; use YYYY-MM-DD", file=sys.stderr)
        return 2

    station = str(args.station).strip()
    if not station:
        print("Station id is required", file=sys.stderr)
        return 2

    try:
        result = compute_eight_point_average(station, target)
    except Exception as e:
        print(str(e), file=sys.stderr)
        return 1

    if args.json:
        out = dict(result)
        if args.monthly:
            try:
                out["monthly"] = compute_monthly_partial_means(station, target)
            except Exception as e:
                out["monthly"] = None
                out["monthly_error"] = str(e)
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return 0 if (result["ok"] or result.get("four_point_ok")) else 3

    if result["ok"]:
        print(f"8-point: {result['average']} °C")
    else:
        print(
            "8-point: unable — missing: " + ", ".join(result["missing"]),
            file=sys.stderr,
        )
    if result.get("four_point_ok"):
        print(f"4-point: {result['four_point_average']} °C")
    else:
        miss = result.get("four_point_missing") or []
        print("4-point: unable — missing: " + ", ".join(miss), file=sys.stderr)

    if args.monthly:
        try:
            mon = compute_monthly_partial_means(station, target)
        except Exception as e:
            print("Monthly: failed —", e, file=sys.stderr)
            mon = {}
        if mon.get("month"):
            m8 = mon.get("eight_point") or {}
            m4 = mon.get("four_point") or {}
            if m8.get("mean") is not None:
                print(
                    f"Month {mon['month']} 8-point (partial): {m8['mean']} °C "
                    f"({m8['used_count']}/{m8['required_count']} hours; "
                    f"{m8.get('missing_count', 0)} missing)"
                )
            else:
                print(f"Month {mon['month']} 8-point (partial): no data", file=sys.stderr)
            if m4.get("mean") is not None:
                print(
                    f"Month {mon['month']} 4-point (partial): {m4['mean']} °C "
                    f"({m4['used_count']}/{m4['required_count']} hours; "
                    f"{m4.get('missing_count', 0)} missing)"
                )
            else:
                print(f"Month {mon['month']} 4-point (partial): no data", file=sys.stderr)

    return 0 if (result["ok"] or result.get("four_point_ok")) else 3


if __name__ == "__main__":
    raise SystemExit(main())
