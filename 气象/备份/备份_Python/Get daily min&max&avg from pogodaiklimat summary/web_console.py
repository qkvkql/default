from __future__ import annotations

import json
import calendar
import re
import threading
import time
import webbrowser
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

import requests

from pogodaiklimat_scraper import (
    BASE_URL,
    FIRST_YEAR,
    REQUEST_DELAY_SECONDS,
    ScrapeError,
    authenticate,
    deduplicate_records,
    fetch_year,
    write_workbook,
)


HOST = "127.0.0.1"
PORT = 8765
PROJECT_DIR = Path(__file__).resolve().parent
STATE_LOCK = threading.Lock()
STATE = {
    "status": "idle",
    "station": "",
    "year": None,
    "current_year": None,
    "mode": "all",
    "month": None,
    "records": 0,
    "message": "Enter your station number and Pogodaiklimat account to begin.",
    "error": "",
    "download": "",
    "suspect_dates": [],
    "log": [],
}


PAGE = r"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pogodaiklimat weather export</title>
  <style>
    :root { color-scheme: light; --ink:#172437; --muted:#62718a; --blue:#1769aa; --line:#d9e2ec; }
    * { box-sizing:border-box; }
    body { margin:0; background:#f1f5f9; color:var(--ink); font:16px/1.5 system-ui,Segoe UI,Arial,sans-serif; }
    main { width:min(760px, calc(100% - 32px)); margin:48px auto; }
    .card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:30px; box-shadow:0 12px 32px #233b5312; }
    h1 { margin:0 0 4px; font-size:26px; letter-spacing:-.02em; }
    .intro { color:var(--muted); margin:0 0 24px; }
    .notice { border:1px solid #d9e8f6; border-left:4px solid var(--blue); border-radius:8px; padding:12px 14px; background:#f5faff; color:#304c69; margin:18px 0 22px; }
    label { display:block; font-weight:650; margin:16px 0 6px; }
    input, select { width:100%; padding:12px 13px; border:1px solid #b9c7d6; border-radius:8px; font:inherit; color:var(--ink); background:#fff; }
    input:focus, select:focus { outline:3px solid #1769aa26; border-color:var(--blue); }
    .small { color:var(--muted); font-size:13px; margin:5px 0 0; }
    button, .download { display:inline-flex; align-items:center; justify-content:center; margin-top:22px; min-height:44px; border:0; border-radius:8px; padding:10px 18px; background:var(--blue); color:#fff; font:inherit; font-weight:700; text-decoration:none; cursor:pointer; }
    button:disabled { opacity:.55; cursor:wait; }
    .status { margin-top:26px; padding-top:20px; border-top:1px solid var(--line); }
    .statusline { display:flex; align-items:center; justify-content:space-between; gap:12px; font-weight:650; }
    .badge { border-radius:20px; background:#edf2f7; padding:3px 10px; font-size:12px; color:#475569; text-transform:uppercase; letter-spacing:.04em; }
    .badge.running { background:#e6f2ff; color:#075b9c; }
    .badge.done { background:#e7f7ed; color:#176b37; }
    .badge.error { background:#fff0ed; color:#a32f1e; }
    .progress { height:9px; border-radius:10px; overflow:hidden; background:#e8eef4; margin:14px 0; }
    .bar { height:100%; width:0; background:linear-gradient(90deg,#1769aa,#38a0e8); transition:width .35s ease; }
    .message { color:var(--muted); min-height:24px; }
    .error { color:#a32f1e; background:#fff4f1; border-radius:8px; padding:10px 12px; margin-top:12px; }
    .suspects { margin-top:12px; border-radius:8px; padding:12px 14px; }
    .suspect-warning { color:#a11919; background:#fff0f0; border:1px solid #f1c3c3; }
    .suspect-ok { color:#176b37; background:#effaf2; border:1px solid #ccebd5; }
    .suspects strong { display:block; margin-bottom:4px; }
    .log { max-height:190px; overflow:auto; margin:14px 0 0; padding:12px 14px; border-radius:8px; background:#f6f8fa; color:#536276; font:13px/1.6 ui-monospace,Consolas,monospace; white-space:pre-wrap; }
    .download[hidden], .error[hidden], .log[hidden] { display:none; }
    @media (max-width:520px) { main { margin:20px auto; } .card { padding:22px 18px; } h1 { font-size:22px; } }
  </style>
</head>
<body>
<main><section class="card">
  <h1>Daily weather export</h1>
  <p class="intro">Download a station’s daily temperatures from Pogodaiklimat as an Excel file.</p>
  <div class="notice">Pogodaiklimat requires a registered account to view summary data. Your sign-in is forwarded to the site over HTTPS and is not saved by this local app.</div>
  <form id="scrapeForm">
    <label for="station">Weather station number</label>
    <input id="station" name="station" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" placeholder="For example, 44211" required>
    <p class="small">Enter exactly five digits.</p>
    <label for="mode">Retrieval range</label>
    <select id="mode" name="mode">
      <option value="all">All years (1971 to current year)</option>
      <option value="month">One month only</option>
    </select>
    <div id="monthOptions" hidden>
      <label for="year">Year</label>
      <input id="year" name="year" type="number" min="1971" step="1" placeholder="For example, 2011" disabled>
      <label for="month">Month</label>
      <select id="month" name="month" disabled>
        <option value="1">January</option><option value="2">February</option>
        <option value="3">March</option><option value="4">April</option>
        <option value="5">May</option><option value="6">June</option>
        <option value="7">July</option><option value="8">August</option>
        <option value="9">September</option><option value="10">October</option>
        <option value="11">November</option><option value="12">December</option>
      </select>
      <p class="small">Only this month is requested from the site.</p>
    </div>
    <label for="username">Pogodaiklimat username</label>
    <input id="username" name="username" autocomplete="username" required>
    <label for="password">Pogodaiklimat password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required>
    <p class="small">Credentials are used only to sign in for this export and are not written to disk.</p>
    <button id="start" type="submit">Start download</button>
  </form>
  <section class="status" aria-live="polite">
    <div class="statusline"><span id="statusText">Ready</span><span id="badge" class="badge">idle</span></div>
    <div class="progress"><div id="bar" class="bar"></div></div>
    <div id="message" class="message">Enter your details to start.</div>
    <div id="error" class="error" hidden></div>
    <div id="suspects" class="suspects" hidden><strong id="suspectTitle"></strong><span id="suspectDates"></span></div>
    <pre id="log" class="log" hidden></pre>
    <a id="download" class="download" href="/api/download" hidden>Download Excel workbook</a>
  </section>
</section></main>
<script>
const form = document.getElementById('scrapeForm');
const start = document.getElementById('start');
const statusText = document.getElementById('statusText');
const modeInput = document.getElementById('mode');
const monthOptions = document.getElementById('monthOptions');
const yearInput = document.getElementById('year');
const monthInput = document.getElementById('month');
const badge = document.getElementById('badge');
const message = document.getElementById('message');
const error = document.getElementById('error');
const suspects = document.getElementById('suspects');
const suspectTitle = document.getElementById('suspectTitle');
const suspectDates = document.getElementById('suspectDates');
const bar = document.getElementById('bar');
const log = document.getElementById('log');
const download = document.getElementById('download');
let polling = false;

function render(s) {
  badge.textContent = s.status;
  badge.className = 'badge ' + s.status;
  statusText.textContent = s.status === 'running' ? (s.mode === 'month' ? `Working on station ${s.station} · ${String(s.month).padStart(2, '0')}/${s.year}` : `Working on station ${s.station}`) :
    s.status === 'done' ? 'Export complete' : s.status === 'error' ? 'Could not complete export' : 'Ready';
  message.textContent = s.message || '';
  const progress = s.mode === 'month' ? (s.status === 'done' ? 100 : s.status === 'running' ? 25 : 0) :
    (s.current_year && s.year ? ((s.year - 1971 + (s.status === 'done' ? 1 : 0)) / (s.current_year - 1971 + 1)) * 100 : 0);
  bar.style.width = Math.max(0, Math.min(100, progress)) + '%';
  error.textContent = s.error || '';
  error.hidden = !s.error;
  const dates = s.suspect_dates || [];
  suspects.hidden = s.status !== 'done';
  suspects.className = 'suspects ' + (dates.length ? 'suspect-warning' : 'suspect-ok');
  suspectTitle.textContent = dates.length ? `Suspect dates (${dates.length}):` : 'No conflicting duplicate dates found.';
  suspectDates.textContent = dates.join(', ');
  log.textContent = (s.log || []).join('\n');
  log.hidden = !s.log || !s.log.length;
  download.hidden = s.status !== 'done';
  start.disabled = s.status === 'running';
}

function updateRangeFields() {
  const singleMonth = modeInput.value === 'month';
  monthOptions.hidden = !singleMonth;
  yearInput.disabled = !singleMonth;
  yearInput.required = singleMonth;
  yearInput.max = String(new Date().getFullYear());
  monthInput.disabled = !singleMonth;
  monthInput.required = singleMonth;
}
modeInput.addEventListener('change', updateRangeFields);
updateRangeFields();

async function poll() {
  if (polling) return;
  polling = true;
  try {
    const response = await fetch('/api/status', {cache:'no-store'});
    const state = await response.json();
    render(state);
    return state;
  } finally { polling = false; }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  error.hidden = true; download.hidden = true;
  const payload = {
    station: document.getElementById('station').value.trim(),
    mode: modeInput.value,
    year: modeInput.value === 'month' ? yearInput.value : '',
    month: modeInput.value === 'month' ? monthInput.value : '',
    username: document.getElementById('username').value,
    password: document.getElementById('password').value
  };
  document.getElementById('password').value = '';
  start.disabled = true;
  message.textContent = 'Signing in and preparing the export…';
  try {
    const response = await fetch('/api/start', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not start the export.');
    document.getElementById('username').value = '';
    render(result.state);
    const timer = setInterval(async () => {
      try {
        const state = await poll();
        if (state && state.status !== 'running') clearInterval(timer);
      } catch (_) { message.textContent = 'Could not refresh progress. The local server may have stopped.'; }
    }, 800);
  } catch (e) {
    error.textContent = e.message;
    error.hidden = false;
    start.disabled = false;
  }
  payload.password = '';
});
poll();
</script>
</body>
</html>"""


def snapshot() -> dict:
    with STATE_LOCK:
        return {**STATE, "log": list(STATE["log"])}


def set_state(**changes) -> None:
    with STATE_LOCK:
        STATE.update(changes)


def add_log(message: str) -> None:
    with STATE_LOCK:
        STATE["log"].append(message)
        STATE["log"] = STATE["log"][-120:]


def scrape_job(
    station: str,
    username: str,
    password: str,
    mode: str,
    selected_year: int | None,
    selected_month: int | None,
) -> None:
    current_year = date.today().year
    years = range(FIRST_YEAR, current_year + 1) if mode == "all" else [selected_year]
    first_year = FIRST_YEAR if mode == "all" else selected_year
    set_state(
        status="running",
        station=station,
        year=first_year,
        current_year=current_year,
        mode=mode,
        month=selected_month,
        records=0,
        message=(
            "Signing in to Pogodaiklimat…"
            if mode == "all"
            else f"Preparing to retrieve {calendar.month_name[selected_month]} {selected_year}…"
        ),
        error="",
        download="",
        suspect_dates=[],
        log=[],
    )
    records = []
    try:
        with requests.Session() as session:
            session.headers.update(
                {"User-Agent": "PogodaiklimatDailyWeatherScraper/1.0 (personal data export)"}
            )
            authenticate(session, username, password)
            # Do not keep the password in the worker's local variables after submitting it.
            username = ""
            password = ""

            for year in years:
                if mode == "month":
                    period_label = f"{calendar.month_name[selected_month]} {year}"
                    set_state(year=year, message=f"Loading {period_label} only…")
                else:
                    period_label = str(year)
                    set_state(year=year, message=f"Loading {year}…")
                year_records = fetch_year(
                    session,
                    station,
                    year,
                    month=selected_month if mode == "month" else None,
                )
                records.extend(year_records)
                set_state(records=len(records), message=f"Finished {period_label}: {len(year_records)} daily records.")
                add_log(f"{period_label}: {len(year_records)} records")
                if mode == "all" and year < current_year:
                    time.sleep(REQUEST_DELAY_SECONDS)

        if not records:
            raise ScrapeError(
                "No daily records were found. Check the station number and confirm that your account can view summary data."
            )
        raw_record_count = len(records)
        records, suspect_dates = deduplicate_records(records)
        if len(records) != raw_record_count:
            add_log(f"Removed {raw_record_count - len(records)} exact duplicate daily record(s).")
        records.sort(key=lambda item: item.observation_date)
        if mode == "month":
            output_name = f"pogodaiklimat_{station}_{selected_year}_{selected_month:02d}_daily_weather.xlsx"
        else:
            output_name = f"pogodaiklimat_{station}_daily_weather.xlsx"
        output_path = PROJECT_DIR / output_name
        write_workbook(records, station, output_path)
        completed_year = selected_year if mode == "month" else current_year
        set_state(
            status="done",
            year=completed_year,
            current_year=completed_year if mode == "month" else current_year,
            records=len(records),
            message=(
                f"Saved {len(records):,} daily records for {calendar.month_name[selected_month]} {selected_year}. Your Excel file is ready."
                if mode == "month"
                else f"Saved {len(records):,} daily records. Your Excel file is ready."
            ),
            download=output_path.name,
            suspect_dates=[day.strftime("%d.%m.%Y") for day in suspect_dates],
            error="",
        )
    except (ScrapeError, requests.RequestException) as exc:
        set_state(status="error", message="The export stopped before an Excel file was created.", error=str(exc))
        add_log("Stopped: " + str(exc))
    except Exception as exc:  # Surface unexpected failures in the page instead of hiding them in the terminal.
        set_state(status="error", message="An unexpected error stopped the export.", error=f"{type(exc).__name__}: {exc}")
        add_log(f"Stopped: {type(exc).__name__}: {exc}")


class ConsoleHandler(BaseHTTPRequestHandler):
    server_version = "PogodaiklimatConsole/1.0"

    def send_bytes(self, body: bytes, content_type: str, status: int = 200, extra_headers=None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if extra_headers:
            for name, value in extra_headers.items():
                self.send_header(name, value)
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, data: dict, status: int = 200) -> None:
        self.send_bytes(json.dumps(data, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8", status)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/":
            self.send_bytes(PAGE.encode("utf-8"), "text/html; charset=utf-8")
        elif path == "/api/status":
            self.send_json(snapshot())
        elif path == "/api/download":
            state = snapshot()
            filename = state.get("download")
            if state["status"] != "done" or not filename:
                self.send_json({"error": "No completed workbook is available."}, 404)
                return
            safe_name = Path(filename).name
            file_path = PROJECT_DIR / safe_name
            if not file_path.is_file():
                self.send_json({"error": "The workbook could not be found. Run the export again."}, 404)
                return
            body = file_path.read_bytes()
            self.send_bytes(
                body,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                extra_headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
            )
        else:
            self.send_bytes(b"Not found", "text/plain; charset=utf-8", 404)

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/start":
            self.send_json({"error": "Not found."}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 16_384:
                raise ValueError("Request is empty or too large.")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            station = str(payload.get("station", "")).strip()
            username = str(payload.get("username", "")).strip()
            password = str(payload.get("password", ""))
            mode = str(payload.get("mode", "all"))
            if not re.fullmatch(r"[0-9]{5}", station):
                raise ValueError("Enter the station number as exactly five digits.")
            if not username or not password:
                raise ValueError("Enter your Pogodaiklimat username and password.")
            if mode not in {"all", "month"}:
                raise ValueError("Select either all years or a single month.")
            if mode == "month":
                try:
                    selected_year = int(payload.get("year", ""))
                    selected_month = int(payload.get("month", ""))
                except (TypeError, ValueError) as exc:
                    raise ValueError("Enter a valid year and month.") from exc
                if not FIRST_YEAR <= selected_year <= date.today().year:
                    raise ValueError(f"Year must be between {FIRST_YEAR} and {date.today().year}.")
                if not 1 <= selected_month <= 12:
                    raise ValueError("Month must be between 1 and 12.")
            else:
                selected_year = None
                selected_month = None
        except (ValueError, UnicodeDecodeError, json.JSONDecodeError) as exc:
            self.send_json({"error": str(exc)}, 400)
            return

        with STATE_LOCK:
            if STATE["status"] == "running":
                self.send_json({"error": "An export is already running."}, 409)
                return
            STATE.update(status="running", station=station, mode=mode, log=[])
        worker = threading.Thread(
            target=scrape_job,
            args=(station, username, password, mode, selected_year, selected_month),
            daemon=True,
        )
        worker.start()
        self.send_json({"state": snapshot()}, 202)

    def log_message(self, format: str, *args) -> None:
        # Avoid putting request details or account-related activity into a log file or console.
        return


def main() -> None:
    server = ThreadingHTTPServer((HOST, PORT), ConsoleHandler)
    server.daemon_threads = True
    url = f"http://{HOST}:{PORT}"
    print(f"Pogodaiklimat console is running at {url}")
    print("Keep this window open while using the page. Press Ctrl+C to stop the local server.")
    threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping the local console…")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
