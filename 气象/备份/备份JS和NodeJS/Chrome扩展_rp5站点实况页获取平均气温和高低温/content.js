(() => {
  const ROOT_ID = 'rp5-stat-temp-extension';
  const JOB_KEY = 'rp5StatTempJob';
  if (document.getElementById(ROOT_ID)) return;

  const host = document.createElement('div');
  host.id = ROOT_ID;
  host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;right:8px;top:8px;';
  document.documentElement.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      *{box-sizing:border-box} .panel{width:360px;max-height:calc(100vh - 16px);overflow:auto;padding:14px;background:#fff;color:#172033;border:1px solid #1769aa;border-radius:10px;box-shadow:0 5px 24px #0003;font:14px/1.4 Arial,sans-serif}
      .head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;font-size:16px;font-weight:700;color:#07599a}.head-actions{display:flex;gap:3px;flex:none}.head button{width:28px;height:28px;border:0;border-radius:4px;background:none;font-size:20px;line-height:1;cursor:pointer;color:#667}.head button:hover{background:#edf4f9}
      label{display:block;margin:8px 0 3px;font-weight:600}input,select{width:100%;height:34px;padding:5px 8px;border:1px solid #aab7c4;border-radius:4px;font:14px Arial,sans-serif;color:#172033;background:#fff}#endTime{border:2px solid #c62828}
      .dates{display:flex;gap:8px}.dates>div{flex:1;min-width:0}button.run{width:100%;margin-top:12px;padding:9px;border:0;border-radius:5px;background:#0878bd;color:white;font-weight:700;font-size:14px;cursor:pointer}button:disabled{opacity:.6;cursor:wait}
      button.copy{margin-top:8px;padding:6px 10px;border:1px solid #9ab1c5;border-radius:4px;background:#fff;color:#07599a;font-weight:600;cursor:pointer}.status{margin-top:10px;white-space:pre-line;color:#27374a}.result{margin-top:9px;padding:9px;background:#f0f7fc;border-radius:5px;font-size:15px;font-weight:600;white-space:pre-line}.result.error{background:#fff0ed;color:#9b2c1f}.result .avg-count.incomplete{color:#c62828}.points{max-height:220px;overflow:auto;margin:8px 0 0;padding:8px;background:#f7f8fa;border:1px solid #d9e0e7;border-radius:5px;font:12px/1.5 Consolas,monospace;white-space:pre;tab-size:4}.hint{margin-top:6px;color:#617286;font-size:12px}
      .panel.collapsed{width:max-content;max-width:calc(100vw - 16px);max-height:none;overflow:visible;padding:7px 10px}.panel.collapsed .head{margin:0}.panel.collapsed>:not(.head){display:none}
    </style>
    <section class="panel">
      <div class="head"><span>RP5 temperature stats · v1.0.5</span><span class="head-actions"><button class="collapse" title="Collapse panel" aria-label="Collapse panel" aria-expanded="true">−</button><button class="close" title="Close panel" aria-label="Close panel">×</button></span></div>
      <label for="periodEnd">Period end date</label><input id="periodEnd" type="text" inputmode="numeric" placeholder="YYYY-MM-DD" maxlength="10" pattern="\\d{4}-\\d{2}-\\d{2}" autocomplete="off">
      <label for="selection">Page selection period</label><select id="selection"><option value="7" selected>7 days</option><option value="30">30 days</option></select>
      <label for="endTime">Statistical end time (00–24)</label><input id="endTime" type="text" inputmode="numeric" value="20" placeholder="00–24" maxlength="2" pattern="\\d{2}" autocomplete="off">
      <div class="dates"><div><label for="startDate">Target start date</label><input id="startDate" type="text" inputmode="numeric" placeholder="YYYY-MM-DD" maxlength="10" pattern="\\d{4}-\\d{2}-\\d{2}" autocomplete="off"></div><div><label for="targetEnd">Target end date</label><input id="targetEnd" type="text" inputmode="numeric" placeholder="YYYY-MM-DD" maxlength="10" pattern="\\d{4}-\\d{2}-\\d{2}" autocomplete="off"></div></div>
      <button class="run">Get min/max/avg</button>
      <div class="status" role="status">Open an RP5 weather archive page to calculate temperatures.</div>
      <div class="result" hidden></div><button class="copy" hidden>Copy detailed temperatures</button><pre class="points" hidden></pre><div class="hint">Date range includes both endpoints (maximum 30 days).</div>
    </section>`;

  const $ = (s) => shadow.querySelector(s);
  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  for (const id of ['periodEnd', 'startDate', 'targetEnd']) $( `#${id}`).value = todayISO;
  $('.close').addEventListener('click', () => host.remove());
  $('.collapse').addEventListener('click', () => {
    const collapsed = $('.panel').classList.toggle('collapsed');
    $('.collapse').textContent = collapsed ? '+' : '−';
    $('.collapse').title = collapsed ? 'Expand panel' : 'Collapse panel';
    $('.collapse').setAttribute('aria-label', $('.collapse').title);
    $('.collapse').setAttribute('aria-expanded', String(!collapsed));
  });
  $('.copy').addEventListener('click', copyPointDetails);
  $('.run').addEventListener('click', startCalculation);

  const existingJob = readJob();
  if (existingJob) {
    if (/^\d{2}:00$/.test(existingJob.endTime)) existingJob.endTime = existingJob.endTime.slice(0, 2);
    populate(existingJob);
    if (existingJob.phase === 'waiting' && Number(existingJob.timeOrigin) !== performance.timeOrigin) {
      existingJob.phase = 'loaded';
      existingJob.timeOrigin = performance.timeOrigin;
      saveJob(existingJob);
      calculateWhenReady(existingJob, true);
    } else if (existingJob.phase === 'waiting') {
      setStatus('Waiting for the RP5 archive table to refresh…');
      waitForTable(existingJob, existingJob.oldSignature);
    }
  }

  function populate(job) {
    $('#periodEnd').value = job.periodEnd;
    $('#endTime').value = job.endTime;
    $('#selection').value = String(job.selection);
    $('#startDate').value = job.startDate;
    $('#targetEnd').value = job.targetEnd;
  }

  function startCalculation() {
    const job = {
      periodEnd: $('#periodEnd').value,
      endTime: $('#endTime').value,
      selection: Number($('#selection').value),
      startDate: $('#startDate').value,
      targetEnd: $('#targetEnd').value,
      phase: 'setup',
      startedAt: Date.now()
    };
    try { validate(job); } catch (error) { setStatus(error.message); return; }
    if (!document.querySelector('#archiveTable')) {
      setStatus('No #archiveTable was found. Open an RP5 weather archive page first.');
      return;
    }
    $('.run').disabled = true;
    $('.result').hidden = true;
    $('.copy').hidden = true;
    $('.points').hidden = true;
    setStatus('Applying archive date and selection period…');
    saveJob(job);
    const dateInput = document.querySelector('#calender_archive');
    const radios = [...document.querySelectorAll('input[name="pe"]')];
    const periodInput = radios.find((r) => Number(r.value) === job.selection);
    const selectButton = [...document.querySelectorAll('.archButton')].find((el) => /select/i.test(el.textContent));
    if (!dateInput || !periodInput || !selectButton) {
      finishError('Could not find the RP5 archive date, period options, or Select button.');
      return;
    }
    job.oldSignature = tableSignature();
    job.phase = 'waiting';
    job.timeOrigin = performance.timeOrigin;
    saveJob(job);
    dateInput.value = toPageDate(job.periodEnd);
    dateInput.dispatchEvent(new Event('input', { bubbles: true }));
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    periodInput.click();
    periodInput.checked = true;
    periodInput.dispatchEvent(new Event('change', { bubbles: true }));
    // Persist phase before invoking RP5's own refresh handler; it may navigate.
    selectButton.click();
    waitForTable(job, job.oldSignature);
  }

  function validate(job) {
    for (const [label, value] of [['Period end date', job.periodEnd], ['Target start date', job.startDate], ['Target end date', job.targetEnd]]) {
      if (!isStrictDate(value)) throw new Error(`${label} must use YYYY-MM-DD and be a valid calendar date.`);
    }
    if (!/^\d{2}$/.test(job.endTime) || Number(job.endTime) > 24) throw new Error('Statistical end time must be two digits from 00 to 24.');
    if (job.targetEnd < job.startDate) throw new Error('Target end date must be on or after target start date.');
    const count = dayDiff(job.startDate, job.targetEnd) + 1;
    if (count > 30) throw new Error('The target range can contain at most 30 dates.');
    if (job.targetEnd > job.periodEnd) throw new Error('Target end date must not be later than Period end date.');
    if (count > job.selection) throw new Error(`The ${job.selection}-day page selection is too short for this target range. Choose ${count > 7 ? '30' : '7'} days.`);
  }

  function waitForTable(job, oldSignature) {
    const start = Date.now();
    const tick = () => {
      const sig = tableSignature();
      if (sig && sig !== oldSignature) {
        job.phase = 'loaded'; job.timeOrigin = performance.timeOrigin; saveJob(job);
        calculateWhenReady(job, false); return;
      }
      if (Date.now() - start > 2500 && sig && pageSelectionMatches(job)) {
        try {
          const rows = readRows(document.querySelector('#archiveTable'));
          if (rows.some((r) => dateKey(r.date) === job.periodEnd)) {
            job.phase = 'loaded'; job.timeOrigin = performance.timeOrigin; saveJob(job);
            calculateWhenReady(job, true); return;
          }
        } catch { /* Keep waiting while RP5 updates its table. */ }
      }
      // On a fresh document the RP5 table has already completed its load.
      if (Date.now() - start > 2500 && job.phase === 'loaded') { calculateWhenReady(job, true); return; }
      if (Date.now() - start > 20000) { finishError('The RP5 table did not refresh. Check the selected date and try again.'); return; }
      setTimeout(tick, 350);
    };
    tick();
  }

  function pageSelectionMatches(job) {
    const dateInput = document.querySelector('#calender_archive');
    const selectedRadio = document.querySelector('input[name="pe"]:checked');
    if (!dateInput || !selectedRadio || Number(selectedRadio.value) !== job.selection) return false;
    return [toPageDate(job.periodEnd), job.periodEnd].includes(dateInput.value.trim());
  }

  async function calculateWhenReady(job, freshDocument) {
    const table = document.querySelector('#archiveTable');
    if (!table) {
      if (Date.now() - job.startedAt > 20000) { finishError('RP5 reloaded without an archive table. Reopen the hourly archive page and try again.'); return; }
      setTimeout(() => calculateWhenReady(job, freshDocument), 500); return;
    }
    if (!freshDocument && tableSignature() === job.oldSignature) {
      job.phase = 'waiting'; saveJob(job); waitForTable(job, job.oldSignature); return;
    }
    try {
      const rows = readRows(table);
      const selectedDate = job.periodEnd;
      if (!rows.some((r) => dateKey(r.date) === selectedDate)) {
        throw new Error('The refreshed table does not include the selected Period end date.');
      }
      const values = calculate(rows, job);
      renderResult(values);
      $('.result').classList.remove('error');
      $('.result').hidden = false;
      $('.points').textContent = values.points.map((point) => `${point.date}\t${point.time}\t${point.temperature === null ? '—' : point.temperature}`).join('\n');
      $('.points').hidden = false;
      $('.copy').hidden = false;
      const copied = await copySummary(values);
      setStatus(`Calculated ${job.startDate}${job.startDate === job.targetEnd ? '' : ` to ${job.targetEnd}`}.${copied ? ' Min/max/avg copied to clipboard.' : ' Could not copy min/max/avg to clipboard.'}`);
      sessionStorage.removeItem(JOB_KEY);
      $('.run').disabled = false;
    } catch (error) { finishError(error.message); }
  }

  function readRows(table) {
    const tableTrs = [...table.querySelectorAll('tr')];
    if (!tableTrs.length) throw new Error('The archive table has no header.');
    const grid = expandTableRows(tableTrs);
    const header = grid[0];
    const colIndex = (id) => header.indexOf(table.querySelector(`#${id}`));
    const dateIndex = 0;
    const timeIndex = 1;
    const tempIndex = colIndex('t_archive_t');
    const minIndex = colIndex('t_archive_tn');
    const maxIndex = colIndex('t_archive_tx');
    if ([tempIndex, minIndex, maxIndex].some((i) => !Number.isInteger(i) || i < 0)) throw new Error('Could not locate T, Tn, and Tx columns.');
    let activeDate = null;
    const result = [];
    for (const cells of grid.slice(1)) {
      const dateCell = cells[dateIndex];
      if (dateCell?.classList.contains('cl_dt')) {
        const parsedDate = parseDate(dateCell.innerText || dateCell.textContent, activeDate);
        if (parsedDate) activeDate = parsedDate;
      }
      const timeCell = cells[timeIndex];
      if (!activeDate || !timeCell) continue;
      const hourText = (timeCell.innerText || timeCell.textContent).trim();
      const hour = Number.parseInt(hourText, 10);
      if (!Number.isFinite(hour)) continue;
      result.push({
        // Use the calendar date and hour shown in RP5 directly as local wall time.
        date: new Date(activeDate.getFullYear(), activeDate.getMonth(), activeDate.getDate(), hour),
        t: valueAt(cells[tempIndex]),
        tn: valueAt(cells[minIndex]),
        tx: valueAt(cells[maxIndex])
      });
    }
    if (!result.length) throw new Error('No hourly observations were found in #archiveTable.');
    if (!result.some((row) => row.t !== null || row.tn !== null || row.tx !== null)) {
      throw new Error('Hourly rows were found, but no numeric T, Tn, or Tx values could be read from the archive table.');
    }
    return result;
  }

  function expandTableRows(rows) {
    const grid = [];
    const spans = new Map();
    for (const tr of rows) {
      const row = [];
      for (const [column, span] of [...spans]) {
        row[column] = span.cell;
        span.remaining -= 1;
        if (span.remaining <= 0) spans.delete(column);
      }
      let column = 0;
      for (const cell of [...tr.children]) {
        while (row[column]) column += 1;
        const colSpan = Math.max(1, cell.colSpan || 1);
        const rowSpan = Math.max(1, cell.rowSpan || 1);
        for (let offset = 0; offset < colSpan; offset += 1) {
          const targetColumn = column + offset;
          row[targetColumn] = cell;
          if (rowSpan > 1) spans.set(targetColumn, { cell, remaining: rowSpan - 1 });
        }
        column += colSpan;
      }
      grid.push(row);
    }
    return grid;
  }

  function calculate(rows, job) {
    const endHour = Number(job.endTime);
    const start = dateAtHour(job.startDate, endHour);
    start.setDate(start.getDate() - 1);
    const finish = dateAtHour(job.targetEnd, endHour);
    const hourlyRows = rows.filter((r) => r.date >= start && r.date <= finish);
    // Match the Python scraper: use hourly T for the full day, and use Tn/Tx
    // from the second half (midpoint through end). The starting 20:00 row is
    // the previous statistical date's ending report and must not roll forward.
    const midpoint = new Date(start);
    midpoint.setHours(midpoint.getHours() + 12);
    const extremaRows = rows.filter((r) => r.date >= midpoint && r.date <= finish);
    const extrema = [
      ...hourlyRows.map((r) => r.t),
      ...extremaRows.flatMap((r) => [r.tn, r.tx])
    ].filter((v) => v !== null);
    const points = [];
    const pointDetails = [];
    const days = dayDiff(job.startDate, job.targetEnd) + 1;
    for (let day = 0; day < days; day++) {
      const dayEnd = dateAtHour(job.startDate, endHour);
      dayEnd.setDate(dayEnd.getDate() + day);
      for (let i = 7; i >= 0; i--) {
        const pointTime = new Date(dayEnd);
        pointTime.setHours(pointTime.getHours() - i * 3);
        const point = rows.find((r) => r.date.getTime() === pointTime.getTime() && r.t !== null);
        if (point) points.push(point.t);
        pointDetails.push({
          date: dateKey(pointTime),
          time: `${String(pointTime.getHours()).padStart(2, '0')}:${String(pointTime.getMinutes()).padStart(2, '0')}`,
          temperature: point ? point.t : null
        });
      }
    }
    return {
      min: extrema.length ? Math.min(...extrema) : null,
      max: extrema.length ? Math.max(...extrema) : null,
      avg: points.length ? points.reduce((a, b) => a + b, 0) / points.length : null,
      count: points.length,
      required: days * 8,
      points: pointDetails
    };
  }

  function valueAt(cell) {
    if (!cell) return null;
    // RP5 keeps Celsius in .t_0 even when the page displays another unit.
    const celsius = cell.querySelector('.t_0');
    const visibleTemperature = [...cell.querySelectorAll('.t_1,.t_2,.t_3')]
      .find((el) => getComputedStyle(el).display !== 'none');
    const candidates = [
      celsius?.innerText, celsius?.textContent,
      visibleTemperature?.innerText, visibleTemperature?.textContent,
      cell.innerText, cell.textContent
    ];
    for (const candidate of candidates) {
      if (!candidate) continue;
      const match = candidate.replace(/\u2212/g, '-').match(/[-+]?\d+(?:[.,]\d+)?/);
      if (!match) continue;
      const n = Number(match[0].replace(',', '.'));
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

  async function copyPointDetails() {
    const text = $('.points').textContent;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = 'position:fixed;left:-9999px;top:0;';
        shadow.appendChild(textarea);
        textarea.select();
        const copied = document.execCommand('copy');
        textarea.remove();
        if (!copied) throw new Error('Clipboard copy was blocked.');
      }
      setStatus(`Copied ${$('.points').textContent.split('\n').length} hourly points.`);
    } catch {
      setStatus('Could not copy the point list. Check clipboard permission and try again.');
    }
  }

  async function copySummary(values) {
    const text = `${format(values.min)}\t${format(values.max)}\t${values.avg === null ? '—' : values.avg.toFixed(2)}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch { /* Fall back to the extension's clipboardWrite permission. */ }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;left:-9999px;top:0;';
      shadow.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      return copied;
    } catch { return false; }
  }

  function parseDate(text, previousDate = null) {
    const clean = text.replace(/\u00a0/g, ' ').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
    const full = clean.match(/(\d{4})\s+([A-Za-z]+)\s+(\d{1,2})/);
    const partial = clean.match(/([A-Za-z]+)\s+(\d{1,2})/);
    const match = full || partial;
    if (!match) return null;
    const year = full ? Number(full[1]) : (previousDate ? previousDate.getFullYear() : new Date().getFullYear());
    const monthName = full ? full[2] : partial[1];
    const day = Number(full ? full[3] : partial[2]);
    const month = new Date(`${monthName} 1, 2000`).getMonth();
    if (!Number.isFinite(month)) return null;
    const result = new Date(year, month, day);
    // The archive is newest-first; a month increase means the rows crossed into the prior year.
    if (!full && previousDate && result > previousDate) result.setFullYear(result.getFullYear() - 1);
    return result;
  }

  function tableSignature() {
    const table = document.querySelector('#archiveTable');
    return table ? `${table.rows.length}:${(table.innerText || '').slice(0, 350)}:${(table.innerText || '').slice(-350)}` : '';
  }
  function dayDiff(a, b) {
    const start = new Date(`${a}T12:00:00`);
    const end = new Date(`${b}T12:00:00`);
    return Math.round((end - start) / 86400000);
  }
  function isStrictDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }
  function dateAtHour(iso, hour) {
    const [year, month, day] = iso.split('-').map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(hour, 0, 0, 0);
    return date;
  }
  function dateKey(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function toPageDate(iso) { const [y, m, d] = iso.split('-'); return `${d}.${m}.${y}`; }
  function format(n) { return n === null ? '—' : `${n}`; }
  function renderResult(values) {
    const result = $('.result');
    result.replaceChildren();
    result.append(document.createTextNode(`Min: ${format(values.min)}\nMax: ${format(values.max)}\nAvg: ${values.avg === null ? '—' : values.avg.toFixed(2)} ( `));
    const count = document.createElement('span');
    count.className = `avg-count${values.count !== values.required ? ' incomplete' : ''}`;
    count.textContent = `${values.count} / ${values.required}`;
    result.append(count, document.createTextNode(' )'));
  }
  function setStatus(message) { $('.status').textContent = message; }
  function saveJob(job) { sessionStorage.setItem(JOB_KEY, JSON.stringify(job)); }
  function readJob() { try { return JSON.parse(sessionStorage.getItem(JOB_KEY) || 'null'); } catch { return null; } }
  function finishError(message) {
    setStatus(message);
    $('.result').textContent = `Could not calculate: ${message}`;
    $('.result').classList.add('error');
    $('.result').hidden = false;
    $('.copy').hidden = true;
    $('.points').hidden = true;
    $('.run').disabled = false;
    sessionStorage.removeItem(JOB_KEY);
  }
})();
