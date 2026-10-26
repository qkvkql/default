(() => {
  const ROOT_ID = 'rp5-stat-temp-extension';
  const JOB_KEY = 'rp5StatTempJob';
  const MAX_FOR_COMPARE = 10;
  const MIN_VALID_TEMP = -100;
  const MAX_VALID_TEMP = 70;
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
      .checkbox-row{display:flex;align-items:center;gap:7px;margin:8px 0 3px;font-weight:600}.checkbox-row input{width:16px;height:16px;margin:0;flex:none}
      button.copy{margin-top:8px;padding:6px 10px;border:1px solid #9ab1c5;border-radius:4px;background:#fff;color:#07599a;font-weight:600;cursor:pointer}.status{margin-top:10px;white-space:pre-line;color:#27374a}.result{margin-top:9px;padding:9px;background:#f0f7fc;border-radius:5px;font-size:15px;font-weight:600;white-space:pre-line}.result.error{background:#fff0ed;color:#9b2c1f}.result .avg-count.incomplete{color:#c62828}.points{max-height:220px;overflow:auto;margin:8px 0 0;padding:8px;background:#f7f8fa;border:1px solid #d9e0e7;border-radius:5px;font:12px/1.5 Consolas,monospace;white-space:pre;tab-size:4}.hint{margin-top:6px;color:#617286;font-size:12px}
      .panel.collapsed{width:max-content;max-width:calc(100vw - 16px);max-height:none;overflow:visible;padding:7px 10px}.panel.collapsed .head{margin:0}.panel.collapsed>:not(.head){display:none}
      .archive-tool{margin-top:14px;padding-top:10px;border-top:1px solid #d9e0e7}.archive-tool-head{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:700;color:#07599a}.archive-tool-head button{border:0;background:none;color:#07599a;font-size:18px;cursor:pointer}.archive-tool-body[hidden]{display:none}.archive-tool-body button{width:100%;margin-top:8px;padding:8px;border:1px solid #9ab1c5;border-radius:4px;background:#fff;color:#07599a;font-weight:600;cursor:pointer}.archive-tool-body button.primary{border:0;background:#0878bd;color:#fff}.archive-tool-body button:disabled{opacity:.55;cursor:wait}.archive-status{margin-top:7px;color:#617286;font-size:12px;white-space:pre-line}
    </style>
    <section class="panel">
      <div class="head"><span>RP5 temperature stats · v1.0.5</span><span class="head-actions"><button class="collapse" title="Collapse panel" aria-label="Collapse panel" aria-expanded="true">−</button><button class="close" title="Close panel" aria-label="Close panel">×</button></span></div>
      <label for="periodEnd">Period end date</label><input id="periodEnd" type="text" inputmode="numeric" placeholder="YYYY-MM-DD" maxlength="10" pattern="\\d{4}-\\d{2}-\\d{2}" autocomplete="off">
      <label for="selection">Page selection period</label><select id="selection"><option value="7" selected>7 days</option><option value="30">30 days</option></select>
      <label for="endTime">Statistical end time (00–24)</label><input id="endTime" type="text" inputmode="numeric" value="20" placeholder="00–24" maxlength="2" pattern="\\d{2}" autocomplete="off">
      <label class="checkbox-row"><input id="isChineseStation" type="checkbox">Is Chinese Station</label>
      <div class="dates"><div><label for="startDate">Target start date</label><input id="startDate" type="text" inputmode="numeric" placeholder="YYYY-MM-DD" maxlength="10" pattern="\\d{4}-\\d{2}-\\d{2}" autocomplete="off"></div><div><label for="targetEnd">Target end date</label><input id="targetEnd" type="text" inputmode="numeric" placeholder="YYYY-MM-DD" maxlength="10" pattern="\\d{4}-\\d{2}-\\d{2}" autocomplete="off"></div></div>
      <button class="run">Get min/max/avg</button>
      <div class="status" role="status">Open an RP5 weather archive page to calculate temperatures.</div>
      <div class="result" hidden></div><button class="copy" hidden>Copy detailed temperatures</button><pre class="points" hidden></pre><div class="hint">Date range includes both endpoints (maximum 30 days).</div>
      <section class="archive-tool"><div class="archive-tool-head"><span>Generate formatted Excel file from RP5 downloaded archive</span><button class="archive-collapse" aria-expanded="false" title="Expand section">+</button></div><div class="archive-tool-body" hidden><input class="archive-file" type="file" accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden><button class="upload-archive">Upload source file (.xlsx, .xls, or .csv)</button><button class="generate-archive primary" disabled>Generate target file</button><div class="archive-status" role="status">Upload an RP5 weather archive file to begin.</div></div></section>
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
  $('.archive-collapse').addEventListener('click', () => {
    const body = $('.archive-tool-body');
    body.hidden = !body.hidden;
    $('.archive-collapse').textContent = body.hidden ? '+' : '−';
    $('.archive-collapse').title = body.hidden ? 'Expand section' : 'Collapse section';
    $('.archive-collapse').setAttribute('aria-expanded', String(!body.hidden));
  });
  $('.upload-archive').addEventListener('click', () => $('.archive-file').click());
  $('.archive-file').addEventListener('change', () => {
    const file = $('.archive-file').files[0];
    $('.generate-archive').disabled = !file;
    $('.archive-status').textContent = file ? `Ready: ${file.name}` : 'Upload an RP5 weather archive file to begin.';
  });
  $('.generate-archive').addEventListener('click', generateArchiveWorkbook);

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
    $('#isChineseStation').checked = Boolean(job.isChineseStation);
  }

  function startCalculation() {
    const job = {
      periodEnd: $('#periodEnd').value,
      endTime: $('#endTime').value,
      selection: Number($('#selection').value),
      startDate: $('#startDate').value,
      targetEnd: $('#targetEnd').value,
      isChineseStation: $('#isChineseStation').checked,
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
      throw new Error('Hourly rows were found, but no valid T, Tn, or Tx values could be read from the archive table.');
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

  async function generateArchiveWorkbook() {
    const button = $('.generate-archive');
    const file = $('.archive-file').files[0];
    if (!file) return;
    button.disabled = true;
    $('.archive-status').textContent = 'Reading source archive…';
    try {
      const source = await readArchiveFile(file);
      const endTime = $('#endTime').value;
      if (!/^\d{2}$/.test(endTime) || Number(endTime) > 24) {
        throw new Error('Set Statistical end time to two digits from 00 to 24 before generating the file.');
      }
      const { rows, stationName, stationNumber } = source;
      if (!rows.length) throw new Error('No hourly weather rows were found in the source file.');
      $('.archive-status').textContent = `Calculating ${rows.length.toLocaleString()} observations…`;
      let firstTime = Infinity;
      let lastTime = -Infinity;
      const byDate = new Map();
      for (const row of rows) {
        firstTime = Math.min(firstTime, row.date.getTime());
        lastTime = Math.max(lastTime, row.date.getTime());
        const key = dateKey(row.date);
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key).push(row);
      }
      const first = new Date(firstTime);
      const last = new Date(lastTime);
      const startISO = dateKey(first);
      const endISO = dateKey(last);
      const days = dayDiff(startISO, endISO) + 1;
      const output = [['Station number', 'Station name', 'Date', 'Year', 'Month', 'Day', 'min', 'max', 'avg', 'Tx']];
      for (let offset = 0; offset < days; offset += 1) {
        const day = dateAtHour(startISO, 12);
        day.setDate(day.getDate() + offset);
        const iso = dateKey(day);
        const end = dateAtHour(iso, Number(endTime));
        const start = new Date(end);
        start.setDate(start.getDate() - 1);
        const dailyRows = [...new Set([dateKey(start), dateKey(end)])].flatMap((key) => byDate.get(key) || []);
        const stats = calculate(dailyRows, { startDate: iso, targetEnd: iso, endTime, isChineseStation: $('#isChineseStation').checked });
        const txAtEndTime = dailyRows.find((row) => row.date.getTime() === end.getTime() && row.tx !== null)?.tx ?? null;
        const perfectAvg = stats.count === stats.required && stats.avg !== null;
        output.push([stationNumber, stationName, iso, iso.slice(0, 4), iso.slice(5, 7), iso.slice(8, 10),
          stats.min === null ? '' : stats.min, stats.max === null ? '' : stats.max, perfectAvg ? Number(stats.avg) : '',
          txAtEndTime ?? '']);
        if (offset % 200 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
      }
      const blob = createXlsxBlob(output);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace(/\.(xlsx|csv)$/i, '')}_formatted.xlsx`;
      document.documentElement.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      $('.archive-status').textContent = `Generated ${output.length - 1} daily rows for ${stationName || 'the source station'}.`;
    } catch (error) {
      $('.archive-status').textContent = `Could not generate target file: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  }

  async function readArchiveFile(file) {
    const name = file.name.toLowerCase();
    let grid;
    if (!/\.(xlsx|xls|csv)$/i.test(name)) throw new Error('Choose an .xlsx, .xls, or .csv weather archive.');
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b;
    const isLegacyBinaryXls = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
    if (isZip) {
      grid = await parseXlsx(buffer);
    } else if (isLegacyBinaryXls) {
      grid = parseBinaryXls(buffer);
    } else {
      const text = new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '').trimStart();
      grid = /^<(?:!doctype\s+html|html|table)\b/i.test(text) ? parseHtmlTable(text) : parseDelimited(text);
    }
    const headerIndex = grid.findIndex((row) => /^\s*Local time in\b/i.test(String(row[0] ?? '').trim()));
    if (headerIndex < 0) throw new Error('Could not find a header row beginning with “Local time in …”.');
    const headers = grid[headerIndex].map((v) => String(v ?? '').trim());
    const findColumn = (name) => headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());
    const dateIndex = 0;
    const tIndex = findColumn('T');
    const tnIndex = findColumn('Tn');
    const txIndex = findColumn('Tx');
    if ([tIndex, tnIndex, txIndex].some((i) => i < 0)) throw new Error('The archive header must contain T, Tn, and Tx columns.');
    const rows = [];
    for (const sourceRow of grid.slice(headerIndex + 1)) {
      const date = parseArchiveDateTime(sourceRow[dateIndex]);
      if (!date) continue;
      rows.push({ date, t: archiveTemperature(sourceRow[tIndex]), tn: archiveTemperature(sourceRow[tnIndex]), tx: archiveTemperature(sourceRow[txIndex]) });
    }
    if (!rows.length) throw new Error('No rows with recognizable local date and time values were found.');
    const stationName = headers[0].replace(/^\s*Local time in\s*/i, '').trim();
    const metadata = grid.slice(0, headerIndex).flat().map((v) => String(v ?? '')).join('\n');
    const numberMatch = metadata.match(/(?:station\s*(?:number|no\.?|index|id)|WMO[_\s-]*(?:ID|index|number|no\.?))\s*[:=#№-]?\s*(\d{4,8})/i);
    return { rows, stationName, stationNumber: numberMatch?.[1] || '' };
  }

  function parseDelimited(text) {
    const sample = text.split(/\r?\n/).filter((line) => line.trim()).slice(0, 12).join('\n');
    const delimiters = ['\t', ';', ','];
    const delimiter = delimiters.sort((a, b) => {
      const count = (char) => (sample.match(new RegExp(char === '\t' ? '\\t' : char, 'g')) || []).length;
      return count(b) - count(a);
    })[0];
    const rows = [];
    let row = [];
    let value = '';
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      if (quoted) {
        if (char === '"' && text[i + 1] === '"') { value += '"'; i += 1; }
        else if (char === '"') quoted = false;
        else value += char;
      } else if (char === '"') quoted = true;
      else if (char === delimiter) { row.push(value); value = ''; }
      else if (char === '\n' || char === '\r') {
        if (char === '\r' && text[i + 1] === '\n') i += 1;
        row.push(value); value = '';
        if (row.some((cell) => cell.trim())) rows.push(row);
        row = [];
      } else value += char;
    }
    row.push(value);
    if (row.some((cell) => cell.trim())) rows.push(row);
    return rows;
  }

  function parseHtmlTable(text) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const table = doc.querySelector('table');
    if (!table) throw new Error('The .xls file contains HTML but no worksheet table.');
    return [...table.querySelectorAll('tr')].map((tr) => [...tr.querySelectorAll('th,td')].map((cell) => cell.textContent.trim()));
  }

  function parseBinaryXls(buffer) {
    if (!globalThis.XLSX) throw new Error('The Excel file reader did not load. Reload the RP5 page and try again.');
    const workbook = globalThis.XLSX.read(buffer, { type: 'array', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('The .xls workbook does not contain a worksheet.');
    return globalThis.XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: true, defval: '' });
  }

  function archiveTemperature(value) {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const match = String(value).replace(/\u2212/g, '-').match(/[-+]?\d+(?:[.,]\d+)?/);
    if (!match) return null;
    const number = Number(match[0].replace(',', '.'));
    return Number.isFinite(number) && number > MIN_VALID_TEMP && number < MAX_VALID_TEMP ? number : null;
  }

  function parseArchiveDateTime(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return excelSerialDate(value);
    const text = String(value ?? '').trim().replace(/\u00a0/g, ' ');
    if (/^\d{5}(?:\.\d+)?$/.test(text) && Number(text) >= 20000 && Number(text) <= 80000) {
      return excelSerialDate(Number(text));
    }
    let match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T]+(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) return makeLocalDate(+match[1], +match[2], +match[3], +(match[4] || 0), +(match[5] || 0));
    match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?:[ T]+(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) return makeLocalDate(+match[3], +match[2], +match[1], +(match[4] || 0), +(match[5] || 0));
    match = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:[ ,]+(\d{1,2})(?::(\d{1,2}))?)?/);
    if (match) {
      const month = new Date(`${match[2]} 1, 2000`).getMonth();
      if (Number.isFinite(month)) return makeLocalDate(+match[3], month + 1, +match[1], +(match[4] || 0), +(match[5] || 0));
    }
    return null;
  }

  function excelSerialDate(serial) {
    const date = new Date(1899, 11, 30);
    date.setDate(date.getDate() + Math.floor(serial));
    const minutes = Math.round((serial - Math.floor(serial)) * 1440);
    date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return date;
  }

  function makeLocalDate(year, month, day, hour, minute) {
    const result = new Date(0);
    result.setFullYear(year, month - 1, day);
    result.setHours(hour, minute, 0, 0);
    return Number.isNaN(result.getTime()) ? null : result;
  }

  async function parseXlsx(buffer) {
    const files = await unzipEntries(buffer);
    const readXml = (path) => {
      const content = files.get(path);
      if (!content) throw new Error(`The workbook is missing ${path}.`);
      return new DOMParser().parseFromString(new TextDecoder().decode(content), 'application/xml');
    };
    const workbook = readXml('xl/workbook.xml');
    const relationId = workbook.getElementsByTagName('sheet')[0]?.getAttribute('r:id');
    if (!relationId) throw new Error('Could not locate a worksheet in the Excel file.');
    const rels = readXml('xl/_rels/workbook.xml.rels');
    const relation = [...rels.getElementsByTagName('Relationship')].find((item) => item.getAttribute('Id') === relationId);
    if (!relation) throw new Error('Could not locate the first worksheet in the Excel file.');
    const target = relation.getAttribute('Target').replace(/^\//, '');
    const sheetPath = target.startsWith('xl/') ? target : `xl/${target.replace(/^\.\//, '')}`;
    const shared = files.has('xl/sharedStrings.xml') ? readXml('xl/sharedStrings.xml') : null;
    const strings = shared ? [...shared.getElementsByTagName('si')].map((si) => [...si.getElementsByTagName('t')].map((t) => t.textContent).join('')) : [];
    const sheet = readXml(sheetPath);
    const grid = [];
    for (const row of [...sheet.getElementsByTagName('row')]) {
      const values = [];
      for (const cell of [...row.getElementsByTagName('c')]) {
        const ref = cell.getAttribute('r') || '';
        const column = [...ref.match(/[A-Z]+/g) || ['A']][0];
        const index = column.split('').reduce((n, char) => n * 26 + char.charCodeAt(0) - 64, 0) - 1;
        const type = cell.getAttribute('t');
        let value = cell.getElementsByTagName('v')[0]?.textContent ?? '';
        if (type === 's') value = strings[Number(value)] ?? '';
        else if (type === 'inlineStr') value = [...cell.getElementsByTagName('t')].map((item) => item.textContent).join('');
        values[index] = value;
      }
      grid.push(values);
    }
    return grid;
  }

  async function unzipEntries(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i -= 1) {
      if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('The .xlsx file is not a valid ZIP workbook.');
    const count = view.getUint16(eocd + 10, true);
    let cursor = view.getUint32(eocd + 16, true);
    const files = new Map();
    for (let i = 0; i < count; i += 1) {
      if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('Could not read the Excel workbook directory.');
      const method = view.getUint16(cursor + 10, true);
      const compressedSize = view.getUint32(cursor + 20, true);
      const nameLength = view.getUint16(cursor + 28, true);
      const extraLength = view.getUint16(cursor + 30, true);
      const commentLength = view.getUint16(cursor + 32, true);
      const localOffset = view.getUint32(cursor + 42, true);
      const name = new TextDecoder().decode(bytes.slice(cursor + 46, cursor + 46 + nameLength));
      const localNameLength = view.getUint16(localOffset + 26, true);
      const localExtraLength = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const compressed = bytes.slice(start, start + compressedSize);
      let content;
      if (method === 0) content = compressed;
      else if (method === 8 && typeof DecompressionStream !== 'undefined') {
        const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        content = new Uint8Array(await new Response(stream).arrayBuffer());
      } else throw new Error('This Excel file uses an unsupported compression method. Save it as a standard .xlsx file and retry.');
      files.set(name, content);
      cursor += 46 + nameLength + extraLength + commentLength;
    }
    return files;
  }

  function createXlsxBlob(rows) {
    const xmlEscape = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const columnName = (number) => { let name = ''; while (number) { number -= 1; name = String.fromCharCode(65 + number % 26) + name; number = Math.floor(number / 26); } return name; };
    const sheetRows = rows.map((row, r) => `<row r="${r + 1}">${row.map((value, c) => {
      const ref = `${columnName(c + 1)}${r + 1}`;
      if (value === '' || value === null || value === undefined) return `<c r="${ref}"/>`;
      if (typeof value === 'number') return `<c r="${ref}"><v>${value}</v></c>`;
      return `<c r="${ref}" t="inlineStr"><is><t>${xmlEscape(value)}</t></is></c>`;
    }).join('')}</row>`).join('');
    const files = {
      '[Content_Types].xml': '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
      '_rels/.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      'xl/workbook.xml': '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Daily temperatures" sheetId="1" r:id="rId1"/></sheets></workbook>',
      'xl/_rels/workbook.xml.rels': '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
      'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`
    };
    return new Blob([zipStored(files)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  function zipStored(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;
    const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
    const crc32 = (data) => { let crc = 0xffffffff; for (const byte of data) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8); return (crc ^ 0xffffffff) >>> 0; };
    const u16 = (n) => [n & 255, n >>> 8 & 255];
    const u32 = (n) => [n & 255, n >>> 8 & 255, n >>> 16 & 255, n >>> 24 & 255];
    for (const [name, text] of Object.entries(files)) {
      const filename = encoder.encode(name);
      const data = encoder.encode(text);
      const crc = crc32(data);
      const local = new Uint8Array([...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(filename.length), ...u16(0), ...filename, ...data]);
      localParts.push(local);
      centralParts.push(new Uint8Array([...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(filename.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...filename]));
      offset += local.length;
    }
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const end = new Uint8Array([...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(centralParts.length), ...u16(centralParts.length), ...u32(centralSize), ...u32(offset), ...u16(0)]);
    return new Blob([...localParts, ...centralParts, end]);
  }

  function calculate(rows, job) {
    const endHour = Number(job.endTime);
    const isSingleTargetDate = job.startDate === job.targetEnd;
    const start = dateAtHour(job.startDate, endHour);
    start.setDate(start.getDate() - 1);
    const finish = dateAtHour(job.targetEnd, endHour);
    const hourlyRows = rows.filter((r) => r.date >= start && r.date <= finish);
    // For a single target date, compare reported Tn/Tx with hourly T extrema
    // in the statistical day window. For multi-date ranges, reported extrema
    // are included without this plausibility check because it can reject valid
    // min/max values across the requested range. The starting end-time row
    // belongs to the previous statistical day.
    let min = null;
    let max = null;
    let minIsSuspicious = false;
    let maxIsSuspicious = false;
    for (let day = 0; day < dayDiff(job.startDate, job.targetEnd) + 1; day++) {
      const dayEnd = dateAtHour(job.startDate, endHour);
      dayEnd.setDate(dayEnd.getDate() + day);
      const dayStart = new Date(dayEnd);
      dayStart.setDate(dayStart.getDate() - 1);
      const midpoint = new Date(dayStart);
      midpoint.setHours(midpoint.getHours() + 12);

      const dayHourly = rows
        .filter((r) => r.date >= dayStart && r.date <= dayEnd)
        .map((r) => r.t)
        .filter((v) => v !== null);
      const dayReported = rows.filter((r) => r.date >= midpoint && r.date <= dayEnd);
      const endRow = job.isChineseStation ? rows.find((r) => r.date.getTime() === dayEnd.getTime()) : null;
      const reportedMins = job.isChineseStation
        ? (endRow?.tn !== null && endRow?.tn !== undefined ? [endRow.tn] : [])
        : dayReported.map((r) => r.tn).filter((v) => v !== null);
      const reportedMaxes = job.isChineseStation
        ? (endRow?.tx !== null && endRow?.tx !== undefined ? [endRow.tx] : [])
        : dayReported.map((r) => r.tx).filter((v) => v !== null);
      const dayValues = [...dayHourly, ...reportedMins, ...reportedMaxes];

      if (dayValues.length) {
        const reportedMin = reportedMins.length ? Math.min(...reportedMins) : null;
        const reportedMax = reportedMaxes.length ? Math.max(...reportedMaxes) : null;
        if (job.isChineseStation) {
          const dayMin = reportedMin ?? (dayHourly.length ? Math.min(...dayHourly) : null);
          const dayMax = reportedMax ?? (dayHourly.length ? Math.max(...dayHourly) : null);
          if (dayMin !== null) min = min === null ? dayMin : Math.min(min, dayMin);
          if (dayMax !== null) max = max === null ? dayMax : Math.max(max, dayMax);
        } else if (isSingleTargetDate && reportedMin !== null && dayHourly.length && Math.abs(reportedMin - Math.min(...dayHourly)) >= MAX_FOR_COMPARE) {
          minIsSuspicious = true;
        } else {
          const dayMin = Math.min(...dayValues);
          min = min === null ? dayMin : Math.min(min, dayMin);
        }
        if (isSingleTargetDate && reportedMax !== null && dayHourly.length && Math.abs(reportedMax - Math.max(...dayHourly)) >= MAX_FOR_COMPARE) {
          maxIsSuspicious = true;
        } else {
          const dayMax = Math.max(...dayValues);
          max = max === null ? dayMax : Math.max(max, dayMax);
        }
      }
    }
    if (minIsSuspicious) min = '';
    if (maxIsSuspicious) max = '';
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
      min,
      max,
      avg: points.length ? formatAverage(points) : null,
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
      if (Number.isFinite(n)) {
        return n > MIN_VALID_TEMP && n < MAX_VALID_TEMP ? n : null;
      }
    }
    return null;
  }

  function formatAverage(values) {
    // RP5 temperatures are reported to tenths of a degree. Sum those tenths
    // as integers, then round the exact rational mean to hundredths (ties away
    // from zero) so binary floating-point cannot change the displayed result.
    const sumTenths = values.reduce((sum, value) => sum + Math.round(value * 10), 0);
    const numerator = Math.abs(sumTenths) * 10;
    const count = values.length;
    let hundredths = Math.floor(numerator / count);
    if ((numerator % count) * 2 >= count) hundredths += 1;
    const sign = sumTenths < 0 ? '-' : '';
    return `${sign}${Math.floor(hundredths / 100)}.${String(hundredths % 100).padStart(2, '0')}`;
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
    const text = `${format(values.min)}\t${format(values.max)}\t${values.avg === null ? '—' : values.avg}`;
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
    result.append(document.createTextNode(`Min: ${format(values.min)}\nMax: ${format(values.max)}\nAvg: ${values.avg === null ? '—' : values.avg} ( `));
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
