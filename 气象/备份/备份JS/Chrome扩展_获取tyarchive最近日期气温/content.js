// Tyarchive Extractor - Content Script (no iframe, uses Shadow DOM for style isolation)
(function () {
  'use strict';

  const WRAPPER_ID = 'tyarchive-extractor-root';

  // ── Toggle if already injected ──────────────────────────────────────────────
  const existingRoot = document.getElementById(WRAPPER_ID);
  if (existingRoot) {
    const panel = existingRoot.shadowRoot.getElementById('panel');
    panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    return;
  }

  // ── Create host element with Shadow DOM (isolates our CSS from the page) ────
  const host = document.createElement('div');
  host.id = WRAPPER_ID;
  document.documentElement.appendChild(host);                 // attach to <html>, not <body>

  const shadow = host.attachShadow({ mode: 'open' });

  // ── Styles (scoped inside shadow root) ─────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    #panel {
      position: fixed;
      top: 0;
      left: 0;
      width: 340px;
      height: 660px;
      background: #0f172a;
      border: 1px solid #334155;
      border-left: none;
      border-radius: 0 12px 12px 0;
      box-shadow: 5px 10px 40px rgba(0,0,0,0.7);
      z-index: 2147483647;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      color: #f8fafc;
    }

    /* ── Header ── */
    #drag-header {
      height: 42px;
      min-height: 42px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      cursor: grab;
      user-select: none;
    }
    #drag-header:active { cursor: grabbing; }
    #header-title {
      font-size: 13px;
      font-weight: 600;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    #close-btn {
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      font-size: 22px;
      line-height: 1;
      width: 28px;
      height: 28px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    #close-btn:hover { background: rgba(255,255,255,0.12); }

    /* ── Body ── */
    #body {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 14px 14px 10px;
      overflow: hidden;
      background: radial-gradient(circle at top left, rgba(59,130,246,0.08), transparent 50%), #0f172a;
    }

    /* ── Search ── */
    #search-wrap {
      position: relative;
      margin-bottom: 12px;
    }
    #search-icon {
      position: absolute;
      left: 11px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      pointer-events: none;
      display: flex;
      align-items: center;
    }
    #search-input {
      width: 100%;
      padding: 10px 14px 10px 36px;
      border-radius: 8px;
      border: 1px solid #334155;
      background: rgba(30,41,59,0.8);
      color: #f8fafc;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    #search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
    }
    #search-input::placeholder { color: #64748b; }

    /* ── Table container ── */
    #table-wrap {
      flex: 1;
      overflow-y: auto;
      border-radius: 8px;
      border: 1px solid #334155;
      background: #1e293b;
    }
    #table-wrap::-webkit-scrollbar { width: 7px; }
    #table-wrap::-webkit-scrollbar-track { background: #1e293b; }
    #table-wrap::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }

    table { width: 100%; border-collapse: collapse; }
    thead {
      position: sticky;
      top: 0;
      background: rgba(15,23,42,0.97);
      z-index: 1;
    }
    th {
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #94a3b8;
      border-bottom: 1px solid #334155;
      text-align: left;
      white-space: nowrap;
    }
    td {
      padding: 8px 14px;
      font-size: 13px;
      color: #cbd5e1;
      border-bottom: 1px solid rgba(51,65,85,0.45);
      vertical-align: middle;
    }
    .station-name {
      font-size: 13px;
      font-weight: 500;
      color: #e2e8f0;
      line-height: 1.4;
    }
    .station-ids {
      display: flex;
      gap: 6px;
      margin-top: 5px;
      flex-wrap: wrap;
    }
    .btn-id {
      padding: 3px 10px;
      border-radius: 20px;
      border: 1px solid #475569;
      background: rgba(51,65,85,0.5);
      color: #94a3b8;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
      font-family: inherit;
    }
    .btn-id:hover  { background: rgba(71,85,105,0.7); border-color: #64748b; color: #cbd5e1; }
    .btn-id:active { transform: scale(0.95); }
    .btn-id.copied { background: rgba(16,185,129,0.2); border-color: #10b981; color: #10b981; }
    tbody tr:hover td { background: rgba(51,65,85,0.35); }
    tbody tr:last-child td { border-bottom: none; }

    .btn-select {
      padding: 5px 11px;
      border-radius: 6px;
      border: none;
      background: #3b82f6;
      color: #fff;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      white-space: nowrap;
    }
    .btn-select:hover  { background: #2563eb; }
    .btn-select:active { transform: scale(0.94); }
    .btn-copied { background: #10b981 !important; }

    .empty-row td {
      text-align: center;
      padding: 36px;
      color: #64748b;
      font-size: 13px;
    }
    .error-row td { color: #f87171; }

    /* ── Toast message ── */
    #toast {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%) translateY(12px);
      background: #7f1d1d;
      border: 1px solid #ef4444;
      color: #fca5a5;
      font-size: 12px;
      font-weight: 500;
      padding: 7px 14px;
      border-radius: 8px;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease, background 0.15s, border-color 0.15s, color 0.15s;
      z-index: 10;
    }
    #toast.show {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    #toast.success {
      background: #052e16;
      border-color: #16a34a;
      color: #86efac;
    }
    /* date label inside success toast rendered larger */
    #toast .toast-date {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    /* ── Result button (replaces Select after successful retrieval) ── */
    .btn-result {
      padding: 5px 11px;
      border-radius: 6px;
      border: none;
      background: #059669;
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      white-space: nowrap;
      font-family: monospace;
      letter-spacing: 0.04em;
    }
    .btn-result:hover  { background: #047857; }
    .btn-result:active { transform: scale(0.94); }
    .btn-result.flash  { background: #10b981 !important; }

    /* ── Station-type radio toggle ── */
    .station-type-wrap {
      display: flex;
      gap: 4px;
      margin-top: 6px;
    }
    .station-type-wrap label {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 2px 8px;
      border-radius: 20px;
      border: 1px solid #475569;
      background: rgba(51,65,85,0.4);
      color: #94a3b8;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      user-select: none;
    }
    .station-type-wrap input[type="radio"] { display: none; }
    .station-type-wrap label:has(input:checked) {
      background: rgba(59,130,246,0.22);
      border-color: #3b82f6;
      color: #93c5fd;
    }

    /* ── Add-station section ── */
    #add-station-section {
      margin-top: 8px;
      border-top: 1px solid #334155;
      padding-top: 8px;
    }
    #add-station-form {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      align-items: center;
    }
    #add-name, #add-id {
      flex: 1 1 0;
      min-width: 60px;
      padding: 5px 9px;
      border-radius: 7px;
      border: 1px solid #334155;
      background: rgba(30,41,59,0.85);
      color: #f8fafc;
      font-size: 12px;
      outline: none;
      transition: border-color 0.2s;
    }
    #add-name:focus, #add-id:focus { border-color: #3b82f6; }
    #add-name::placeholder, #add-id::placeholder { color: #64748b; }
    .add-type-wrap {
      display: flex;
      gap: 4px;
    }
    .add-type-wrap label {
      display: flex;
      align-items: center;
      gap: 3px;
      padding: 3px 8px;
      border-radius: 20px;
      border: 1px solid #475569;
      background: rgba(51,65,85,0.4);
      color: #94a3b8;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      user-select: none;
    }
    .add-type-wrap input[type="radio"] { display: none; }
    .add-type-wrap label:has(input:checked) {
      background: rgba(59,130,246,0.22);
      border-color: #3b82f6;
      color: #93c5fd;
    }
    #add-btn {
      padding: 5px 11px;
      border-radius: 7px;
      border: none;
      background: #3b82f6;
      color: #fff;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      line-height: 1;
      transition: background 0.2s;
    }
    #add-btn:hover { background: #2563eb; }

    /* ── Manual station badge + delete ── */
    .manual-badge {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 10px;
      background: rgba(20,184,166,0.2);
      border: 1px solid #14b8a6;
      color: #2dd4bf;
      font-size: 10px;
      font-weight: 600;
      margin-left: 6px;
      vertical-align: middle;
    }
    .btn-delete-manual {
      background: none;
      border: none;
      color: #64748b;
      font-size: 14px;
      cursor: pointer;
      padding: 0 4px;
      line-height: 1;
      transition: color 0.15s;
    }
    .btn-delete-manual:hover { color: #f87171; }

    /* ── Status bar ── */
    #body { position: relative; }
    #status-bar {
      margin-top: 8px;
      font-size: 11px;
      color: #64748b;
      text-align: right;
    }
  `;
  shadow.appendChild(style);

  // ── Panel HTML ──────────────────────────────────────────────────────────────
  const panel = document.createElement('div');
  panel.id = 'panel';
  panel.innerHTML = `
    <div id="drag-header">
      <span id="header-title">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
          <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
        </svg>
        Tyarchive Extractor
      </span>
      <button id="close-btn" title="Close">&#x00D7;</button>
    </div>
    <div id="body">
      <div id="search-wrap">
        <span id="search-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </span>
        <input id="search-input" type="text" placeholder="Search by name, province, USAF or Domes ID…" autocomplete="off" />
      </div>
      <div id="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Station</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="stations-body">
            <tr class="empty-row"><td colspan="5">Loading station data…</td></tr>
          </tbody>
        </table>
      </div>
      <div id="status-bar">Loading…</div>
      <div id="add-station-section">
        <div id="add-station-form">
          <input id="add-name" type="text" placeholder="名称（可选）" autocomplete="off" />
          <input id="add-id"   type="text" placeholder="站号" autocomplete="off" />
          <div class="add-type-wrap">
            <label><input type="radio" name="add-type" value="basic" checked> 国家站</label>
            <label><input type="radio" name="add-type" value="auto"> 自动站</label>
          </div>
          <button id="add-btn" title="添加站点">＋</button>
        </div>
      </div>
      <div id="toast"></div>
    </div>
  `;
  shadow.appendChild(panel);

  // ── References ──────────────────────────────────────────────────────────────
  const dragHeader   = shadow.getElementById('drag-header');
  const closeBtn     = shadow.getElementById('close-btn');
  const searchInput  = shadow.getElementById('search-input');
  const stationsBody = shadow.getElementById('stations-body');
  const statusBar    = shadow.getElementById('status-bar');
  const toast        = shadow.getElementById('toast');

  let allStations     = [];
  let toastTimer      = null;
  let activeSelectBtn = null;   // btn-select that most recently triggered a search
  // Persists retrieved results across renderTable re-renders.
  // Key: `${usaf}|${domesId}`, Value: { clipText, minLabel, maxLabel }
  const resultMap = new Map();
  // Persists user's manual station-type radio overrides across re-renders.
  // Key: same as resultMap (`${usaf}|${domesId}`), Value: 'basic' | 'auto'
  const typeOverrideMap = new Map();
  // Stations added manually by the user (not from stations.json)
  let manualStations = [];

  // ── Toast helper ─────────────────────────────────────────────────────────────
  // type: 'error' (default, red) | 'success' (green)
  // When type === 'success' the msg may contain a <span class="toast-date"> node;
  // pass an Element or an HTML string for msg in that case.
  function showToast(msg, type = 'error') {
    if (msg instanceof Node) {
      toast.innerHTML = '';
      toast.appendChild(msg);
    } else {
      toast.innerHTML = msg;   // allow inline HTML for date span
    }
    toast.classList.toggle('success', type === 'success');
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      toast.classList.remove('success');
    }, type === 'success' ? 5500 : 2500);
  }

  // ── Custom data-view overlay styles (injected into shadow root once) ────────
  const dataViewStyle = document.createElement('style');
  dataViewStyle.textContent = `
    #dv-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.55);
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: dv-fade-in 0.18s ease;
    }
    @keyframes dv-fade-in { from { opacity:0; } to { opacity:1; } }

    #dv-box {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 14px;
      box-shadow: 0 24px 80px rgba(0,0,0,0.7);
      width: min(92vw, 760px);
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #f8fafc;
    }
    #dv-header {
      padding: 14px 18px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-weight: 600;
      font-size: 14px;
      color: #cbd5e1;
      flex-shrink: 0;
    }
    #dv-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 22px;
      line-height: 1;
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
    }
    #dv-close:hover { background: rgba(255,255,255,0.12); }
    #dv-copy {
      background: #3b82f6;
      border: none;
      color: #fff;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 14px;
      border-radius: 7px;
      cursor: pointer;
      margin-right: 10px;
      transition: background 0.2s;
    }
    #dv-copy:hover { background: #2563eb; }
    #dv-copy.copied { background: #10b981; }
    #dv-body {
      overflow-y: auto;
      padding: 14px 18px 18px;
      flex: 1;
    }
    #dv-body::-webkit-scrollbar { width: 7px; }
    #dv-body::-webkit-scrollbar-track { background: #0f172a; }
    #dv-body::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
    .dv-section { margin-bottom: 22px; }
    .dv-series-name {
      font-size: 12px;
      font-weight: 600;
      color: #7dd3fc;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid #1e293b;
    }
    .dv-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;
    }
    .dv-table th {
      padding: 7px 12px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      background: rgba(30,41,59,0.8);
      border-bottom: 1px solid #334155;
      white-space: nowrap;
    }
    .dv-table td {
      padding: 6px 12px;
      color: #cbd5e1;
      border-bottom: 1px solid rgba(51,65,85,0.35);
      white-space: nowrap;
    }
    .dv-table tbody tr:hover td { background: rgba(51,65,85,0.3); }
    .dv-table tbody tr:last-child td { border-bottom: none; }
    .dv-empty { color: #64748b; font-size: 13px; padding: 24px 0; text-align: center; }
  `;
  shadow.appendChild(dataViewStyle);

  // ── showCustomDataView: extract ECharts data and show our own overlay ────────
  function showCustomDataView(chart) {
    const opt = chart.getOption();
    const xAxis  = opt.xAxis  && opt.xAxis[0];
    const series = opt.series || [];

    // x-axis categories / data
    const xData = (xAxis && (xAxis.data || [])) || [];

    // Remove existing overlay if any
    const existing = shadow.getElementById('dv-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'dv-overlay';

    // Build table HTML per series
    let tablesHtml = '';
    const hasX = xData.length > 0;

    series.forEach((s, si) => {
      const sName = s.name || `Series ${si + 1}`;
      const sData = s.data || [];
      if (!sData.length) return;

      // Detect if values are plain scalars or [x,y] pairs
      const sample = sData[0];
      const isPairs = Array.isArray(sample);

      let rows = '';
      if (hasX && !isPairs) {
        sData.forEach((val, i) => {
          const xLabel = xData[i] !== undefined ? xData[i] : i;
          const v = val === null || val === undefined ? '-' : val;
          rows += `<tr><td>${xLabel}</td><td>${v}</td></tr>`;
        });
        tablesHtml += `
          <div class="dv-section">
            <div class="dv-series-name">${sName}</div>
            <table class="dv-table">
              <thead><tr><th>时间 / 类别</th><th>数值</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;
      } else if (isPairs) {
        sData.forEach(pair => {
          const x = pair[0] !== undefined ? pair[0] : '-';
          const y = pair[1] !== undefined ? pair[1] : '-';
          rows += `<tr><td>${x}</td><td>${y}</td></tr>`;
        });
        tablesHtml += `
          <div class="dv-section">
            <div class="dv-series-name">${sName}</div>
            <table class="dv-table">
              <thead><tr><th>X</th><th>Y</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;
      } else {
        sData.forEach((val, i) => {
          const v = val === null || val === undefined ? '-' : val;
          rows += `<tr><td>${i}</td><td>${v}</td></tr>`;
        });
        tablesHtml += `
          <div class="dv-section">
            <div class="dv-series-name">${sName}</div>
            <table class="dv-table">
              <thead><tr><th>#</th><th>数值</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;
      }
    });

    if (!tablesHtml) tablesHtml = '<div class="dv-empty">暂无可提取的数据</div>';

    overlay.innerHTML = `
      <div id="dv-box">
        <div id="dv-header">
          <span>📊 数据视图</span>
          <div style="display:flex;align-items:center;">
            <button id="dv-copy">复制数据</button>
            <button id="dv-close">&#x00D7;</button>
          </div>
        </div>
        <div id="dv-body">${tablesHtml}</div>
      </div>
    `;
    shadow.appendChild(overlay);

    // Close on backdrop click or close button
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    shadow.getElementById('dv-close').addEventListener('click', () => overlay.remove());

    // Copy-to-clipboard: build TSV
    shadow.getElementById('dv-copy').addEventListener('click', async function() {
      let tsv = '';
      series.forEach(s => {
        const sName = s.name || '';
        const sData = s.data || [];
        if (!sData.length) return;
        tsv += `# ${sName}\n`;
        const isPairs = Array.isArray(sData[0]);
        if (hasX && !isPairs) {
          sData.forEach((val, i) => {
            tsv += `${xData[i] !== undefined ? xData[i] : i}\t${val ?? ''}\n`;
          });
        } else if (isPairs) {
          sData.forEach(p => { tsv += `${p[0] ?? ''}\t${p[1] ?? ''}\n`; });
        } else {
          sData.forEach((val, i) => { tsv += `${i}\t${val ?? ''}\n`; });
        }
        tsv += '\n';
      });
      try { await navigator.clipboard.writeText(tsv); } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = tsv;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      this.textContent = '✓ 已复制';
      this.classList.add('copied');
      setTimeout(() => { this.textContent = '复制数据'; this.classList.remove('copied'); }, 1500);
    });

    console.log('[Tyarchive] Custom 数据视图 overlay shown');
  }

  // ── triggerDataView: open ECharts 数据视图 after chart renders ───────────────
  function triggerDataView() {
    let waited = 0;
    const INTERVAL = 300;
    const MAX_WAIT = 12000;  // chart may take several seconds to load data

    const poller = setInterval(() => {
      waited += INTERVAL;

      const canvas = document.querySelector('canvas[data-zr-dom-id]');
      if (!canvas) {
        if (waited >= MAX_WAIT) { clearInterval(poller); console.warn('[Tyarchive] Chart canvas never appeared'); }
        return;
      }

      // Give the chart a bit more time to finish rendering data after canvas appears
      if (waited < 800) return;

      clearInterval(poller);
      console.log('[Tyarchive] Chart canvas found, attempting 数据视图…');

      // ── Strategy 1: Find ECharts instance via internal DOM property ─────────
      // ECharts stores instance ID on the container as an attribute: _ec_<id>
      // Also check window.echarts.getInstanceByDom() walking up the DOM tree
      const findChartInstance = () => {
        // Method A: walk up the DOM and try echarts.getInstanceByDom()
        if (window.echarts) {
          let el = canvas.parentElement;
          while (el && el !== document.documentElement) {
            try {
              const inst = echarts.getInstanceByDom(el);
              if (inst) return inst;
            } catch (_) {}
            el = el.parentElement;
          }
        }

        // Method B: scan all DOM elements for ECharts internal property keys
        // ECharts sets a property like "_ec_XXXX" on the container element
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
          const keys = Object.keys(div);
          const ecKey = keys.find(k => k.startsWith('_ec_'));
          if (ecKey) {
            // The value is the instance id; retrieve via echarts if available
            if (window.echarts) {
              try {
                const inst = echarts.getInstanceByDom(div);
                if (inst) return inst;
              } catch (_) {}
            }
          }
        }
        return null;
      };

      const chartInst = findChartInstance();

      if (chartInst) {
        console.log('[Tyarchive] ECharts instance found:', chartInst);

        // ── Sub-strategy 1a: Use our custom data view (most reliable) ──────
        showCustomDataView(chartInst);
        return;
      }

      console.warn('[Tyarchive] ECharts instance not found, trying canvas simulation…');

      // ── Strategy 2: ZRender handler.dispatch() ──────────────────────────────
      // ZRender instance is accessible via canvas.parentElement.__zr (internal)
      // and we can fire a click event at a specific pixel position
      const tryZRender = () => {
        try {
          const zrEl = canvas.parentElement;
          // ZRender stores itself as __zr or zrender on the container
          const zr = zrEl.__zr || zrEl.zrender || zrEl._zr;
          if (zr && zr.handler) {
            const rect = canvas.getBoundingClientRect();
            const dpr  = window.devicePixelRatio || 1;
            // ECharts toolbox default: top-right, itemSize=15, itemGap=8
            // Each icon is 15px wide + 8px gap = 23px each, rightmost first
            const topY = 10; // toolbox top padding ~10px in canvas coords
            // Try multiple x positions from right edge inward
            const canvasW = rect.width;
            const xPositions = [canvasW - 12, canvasW - 35, canvasW - 58, canvasW - 81, canvasW - 104];
            for (const cx of xPositions) {
              zr.handler.dispatch('click', {
                zrX: cx, zrY: topY,
                type: 'click',
                target: null
              });
            }
            console.log('[Tyarchive] 数据视图 attempted via ZRender handler.dispatch()');
            return true;
          }
        } catch (e) { console.warn('[Tyarchive] ZRender dispatch error:', e); }
        return false;
      };

      if (tryZRender()) return;

      // ── Strategy 3: Canvas MouseEvent simulation ────────────────────────────
      const rect = canvas.getBoundingClientRect();
      const dpr  = window.devicePixelRatio || 1;
      // Spray positions across the top-right area of the canvas
      const xOffsets = [15, 38, 61, 84, 107, 130];
      const yOffsets = [8, 13, 18, 22, 28];

      xOffsets.forEach(xOff => {
        yOffsets.forEach(yOff => {
          const evOpts = {
            clientX: rect.right - xOff,
            clientY: rect.top  + yOff,
            bubbles: true, cancelable: true
          };
          canvas.dispatchEvent(new MouseEvent('mousemove', evOpts));
          canvas.dispatchEvent(new MouseEvent('mousedown', evOpts));
          canvas.dispatchEvent(new MouseEvent('mouseup',   evOpts));
          canvas.dispatchEvent(new MouseEvent('click',     evOpts));
        });
      });
      console.log('[Tyarchive] 数据视图 attempted via canvas MouseEvent spray');
    }, INTERVAL);
  }

  // ── watchNativeDataView: intercept ECharts native data-view textarea ─────────
  // ECharts sets textarea content via element.value (DOM property), NOT as an
  // HTML attribute — so the raw HTML always shows an empty textarea.
  // We observe DOM mutations, detect the textarea, read .value after a tick,
  // then hide the native panel and show our own styled overlay instead.
  function watchNativeDataView() {
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;

          // Check if this node IS the textarea, or contains one
          const ta = (node.tagName === 'TEXTAREA') ? node
                   : node.querySelector?.('textarea');
          if (!ta) continue;

          // ECharts data-view textareas have inline monospace font style
          const style = ta.getAttribute('style') || '';
          if (!style.includes('monospace') && !style.includes('font-family')) continue;

          // Use a short delay — ECharts sets .value slightly after DOM insertion
          setTimeout(() => {
            const text = ta.value;
            if (!text) return; // not a data-view textarea (empty)

            console.log('[Tyarchive] Native 数据视图 textarea detected, value length:', text.length);

            // Hide the native ECharts data-view container so it doesn't show
            // The textarea is usually nested inside a div added by ECharts
            let nativeContainer = ta.parentElement;
            // Walk up to find the outermost injected container (usually 2–3 levels)
            while (nativeContainer &&
                   nativeContainer !== document.body &&
                   nativeContainer !== document.documentElement) {
              const cs = window.getComputedStyle(nativeContainer);
              // ECharts data-view uses a full-cover absolutely-positioned div
              if (cs.position === 'absolute' && nativeContainer.style.zIndex) {
                nativeContainer.style.display = 'none';
                break;
              }
              nativeContainer = nativeContainer.parentElement;
            }

            // Parse the raw text and show in our custom overlay
            showTextDataView(text);
          }, 60);

          return; // handle only the first matching textarea per mutation batch
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[Tyarchive] MutationObserver watching for native 数据视图 textarea');
    return observer; // caller can disconnect() if needed
  }

  // ── showTextDataView: extract min/max temp from native ECharts textarea ────────
  // Column layout (0-indexed, tab-separated):
  //   0: date | 1: rainfall | 2: climate avg (1991-2020) | 3: (unused) |
  //   4: daily avg temp | 5: daily max temp | 6: daily min temp | (7+: rest)
  // Target: latest displayed date where min OR max is not NaN.
  async function showTextDataView(rawText) {
    // Helper: treat 'NaN' string as empty
    const clean = v => (v || '').trim() === 'NaN' ? '' : (v || '').trim();
    const isValid = v => clean(v) !== '';  // has a real value

    // Split into lines, discard blanks
    const lines = rawText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    // Walk from the bottom, find the latest row that:
    //   • starts with a digit (data row, not a header)
    //   • has >= 7 tab-separated columns
    //   • has a non-NaN value for min (col 6) OR max (col 5)
    let targetCols = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      const cols = lines[i].split('\t');
      if (cols.length >= 7 && /^\d/.test(cols[0].trim())) {
        const maxVal = clean(cols[5]);
        const minVal = clean(cols[6]);
        if (isValid(maxVal) || isValid(minVal)) {
          targetCols = cols;
          break;
        }
        // Both NaN — skip this date and continue searching
        console.log(`[Tyarchive] Skipping ${cols[0].trim()} (both min/max are NaN)`);
      }
    }

    if (!targetCols) {
      showToast('未能找到有效气温数据！');
      console.warn('[Tyarchive] showTextDataView: no valid data line found in:\n', rawText);
      return;
    }

    const date = targetCols[0].trim();
    const max  = clean(targetCols[5]);  // daily max temp
    const min  = clean(targetCols[6]);  // daily min temp

    // Format: min\tmax  (NaN converted to empty string)
    const clipText = `${min}\t${max}`;

    console.log(`[Tyarchive] Target date: ${date} | min=${min || 'NaN'} max=${max || 'NaN'}`);
    console.log(`[Tyarchive] Copying to clipboard: "${clipText}"`);

    // ── Robust clipboard write ─────────────────────────────────────────────────
    // This runs from a MutationObserver callback — no live user-gesture context.
    // navigator.clipboard requires either a fresh gesture OR the clipboardWrite
    // permission (now granted in manifest).  We try three methods in sequence
    // so at least one always succeeds.
    const writeClipboard = async (text) => {
      // Method 1: navigator.clipboard (works with clipboardWrite permission)
      try {
        await navigator.clipboard.writeText(text);
        console.log('[Tyarchive] Clipboard written via navigator.clipboard');
        return true;
      } catch (e1) {
        console.warn('[Tyarchive] navigator.clipboard failed:', e1.message);
      }

      // Method 2: relay through background → chrome.scripting.executeScript
      // This runs in the page context and is always allowed for extensions.
      try {
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: 'copyToClipboard', text },
            (resp) => {
              if (chrome.runtime.lastError) return reject(chrome.runtime.lastError);
              resp && resp.ok ? resolve() : reject(new Error('bg copy failed'));
            }
          );
        });
        console.log('[Tyarchive] Clipboard written via background relay');
        return true;
      } catch (e2) {
        console.warn('[Tyarchive] Background relay failed:', e2.message);
      }

      // Method 3: execCommand fallback (legacy, may fail without gesture)
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0.01;width:1px;height:1px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        ta.remove();
        if (ok) {
          console.log('[Tyarchive] Clipboard written via execCommand');
          return true;
        }
      } catch (e3) {
        console.warn('[Tyarchive] execCommand failed:', e3.message);
      }

      console.error('[Tyarchive] All clipboard methods failed!');
      return false;
    };

    await writeClipboard(clipText);

    // ── Show success toast with enlarged date ────────────────────────────────
    const minLabel = min || '—';
    const maxLabel = max || '—';
    // Build HTML: date in a larger span, then the values
    showToast(`✓ <span class="toast-date">${date}</span>  min ${minLabel} / max ${maxLabel}`, 'success');

    // ── Persist result so re-renders (search bar) keep the button state ────
    if (activeSelectBtn && activeSelectBtn.isConnected) {
      const stationKey = `${activeSelectBtn.getAttribute('data-usaf') ?? ''}|${activeSelectBtn.getAttribute('data-domesid') ?? ''}`;
      resultMap.set(stationKey, { clipText, minLabel, maxLabel });

      // Transform the button in-place immediately
      const btn = activeSelectBtn;
      btn.classList.remove('btn-select', 'btn-copied');
      btn.classList.add('btn-result');
      btn.disabled = false;
      btn.removeAttribute('data-domesid');
      btn.removeAttribute('data-usaf');
      btn.removeAttribute('data-name');
      btn.setAttribute('data-result', clipText);
      btn.textContent = `${minLabel}\t${maxLabel}`;
    }
    activeSelectBtn = null;
  }

  // Start watching for native ECharts textarea immediately
  watchNativeDataView();

  // ── Render table ────────────────────────────────────────────────────────────
  function renderTable(stations) {
    if (stations.length === 0) {
      stationsBody.innerHTML = `<tr class="empty-row"><td colspan="2">No stations found.</td></tr>`;
      statusBar.textContent = '0 results';
      return;
    }

    const frag = document.createDocumentFragment();
    stations.forEach(s => {
      // Use empty string as the copy value when a field is missing
      const usaf     = s.USAF     ?? '';
      const domesId  = s.domes_id ?? '';
      const province = s.level1   || '-';
      const name     = s.cn_name  || '-';

      // Label shown on pill button: the raw value, or a greyed placeholder
      const usafLabel   = usaf    || '—';
      const domesLabel  = domesId || '—';

      // Determine default station type from the data rule, then check override
      const stationKey  = `${usaf}|${domesId}`;
      const defaultType = (!!usaf && !domesId) ? 'basic'
                        : (!!domesId && !usaf)  ? 'auto'
                        : 'basic';   // both or neither → default basic
      const currentType = typeOverrideMap.get(stationKey) ?? defaultType;
      const savedResult = resultMap.get(stationKey);

      // Unique name for this row's radio group (scoped to shadow root)
      const radioName = `stype-${stationKey.replace(/[^a-zA-Z0-9]/g, '_')}`;

      const isManual = !!s._manual;
      const manualBadge = isManual ? '<span class="manual-badge">自定义</span>' : '';
      const deleteBtn   = isManual
        ? `<button class="btn-delete-manual" data-skey="${stationKey}" title="删除此站点">×</button>`
        : '';

      const actionBtnHtml = savedResult
        ? `<button class="btn-result" data-result="${savedResult.clipText}">${savedResult.minLabel}\t${savedResult.maxLabel}</button>${deleteBtn}`
        : `<button class="btn-select" data-domesid="${domesId}" data-usaf="${usaf}" data-name="${name}">Select</button>${deleteBtn}`;

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="station-name">${province} &middot; ${name}${manualBadge}</div>
          <div class="station-ids">
            <button class="btn-id" data-copy="${usaf}"   title="Copy USAF">${usafLabel}</button>
            <button class="btn-id" data-copy="${domesId}" title="Copy Domes ID">${domesLabel}</button>
          </div>
          <div class="station-type-wrap" data-skey="${stationKey}">
            <label title="国家站（使用 USAF）">
              <input type="radio" name="${radioName}" value="basic" ${currentType === 'basic' ? 'checked' : ''}>
              国家站
            </label>
            <label title="自动站（使用 Domes ID）">
              <input type="radio" name="${radioName}" value="auto" ${currentType === 'auto' ? 'checked' : ''}>
              自动站
            </label>
          </div>
        </td>
        <td>${actionBtnHtml}</td>
      `;
      frag.appendChild(tr);
    });

    stationsBody.innerHTML = '';
    stationsBody.appendChild(frag);

    // (delegated listener is attached once below, outside renderTable)

    statusBar.textContent = `${stations.length} stations`;
  }

  // ── Shared helper: re-render respecting current search query ────────────────
  function getAllDisplayStations() {
    return [...manualStations, ...allStations];
  }
  function rerender() {
    const q = searchInput.value.toLowerCase().trim();
    if (!q) { renderTable(getAllDisplayStations()); return; }
    const filtered = getAllDisplayStations().filter(s =>
      (String(s.USAF     || '')).toLowerCase().includes(q) ||
      (String(s.domes_id || '')).toLowerCase().includes(q) ||
      (s.level1  || '').toLowerCase().includes(q) ||
      (s.cn_name || '').toLowerCase().includes(q)
    );
    renderTable(filtered);
  }

  // ── Delegated click listener — attached ONCE so it never stacks up ──────────
  stationsBody.addEventListener('click', async e => {
    // Radio: save station-type override
    if (e.target.type === 'radio' && e.target.name?.startsWith('stype-')) {
      const wrap = e.target.closest('.station-type-wrap');
      if (wrap) typeOverrideMap.set(wrap.dataset.skey, e.target.value);
      return;
    }

    // Delete manual station
    if (e.target.classList.contains('btn-delete-manual')) {
      const skey = e.target.getAttribute('data-skey');
      manualStations = manualStations.filter(s => `${s.USAF ?? ''}|${s.domes_id ?? ''}` !== skey);
      resultMap.delete(skey);
      typeOverrideMap.delete(skey);
      rerender();
      return;
    }

    // Copy-ID buttons
    if (e.target.classList.contains('btn-id')) {
      const btn = e.target;
      const text = btn.getAttribute('data-copy');   // may be empty string
      try {
        await navigator.clipboard.writeText(text);
      } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      const orig = btn.textContent;
      btn.classList.add('copied');
      btn.textContent = '✓';
      setTimeout(() => { btn.classList.remove('copied'); btn.textContent = orig; }, 1200);
      return;
    }

    // Result buttons (already-retrieved — quick copy, no re-search)
    if (e.target.classList.contains('btn-result')) {
      const btn       = e.target;
      const clipText  = btn.getAttribute('data-result') || '';
      try { await navigator.clipboard.writeText(clipText); } catch (_) {
        const ta = document.createElement('textarea');
        ta.value = clipText;
        ta.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      // Brief flash to confirm copy
      btn.classList.add('flash');
      setTimeout(() => btn.classList.remove('flash'), 600);
      return;
    }

    // Select buttons
    if (e.target.classList.contains('btn-select')) {
      const btn     = e.target;

      // Prevent double-click / re-entry during the whole automation flow
      if (btn.disabled) return;
      btn.disabled = true;
      btn.textContent = '…';

      const usaf    = btn.getAttribute('data-usaf');
      const domesId = btn.getAttribute('data-domesid');
      const name    = btn.getAttribute('data-name');

      // Helper: pause for a given number of milliseconds
      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

      // Helper: restore button state on failure
      const fail = msg => {
        showToast(msg);
        btn.disabled = false;
        btn.textContent = 'Select';
      };

      // Remember which button triggered this search so we can transform it on success
      activeSelectBtn = btn;

      // Determine station type from the row's radio selection
      const row          = btn.closest('tr');
      const checkedRadio = row?.querySelector('input[type="radio"]:checked');
      const isBasic      = !checkedRadio || checkedRadio.value === 'basic';

      // Read current mode from the host page's toggle button
      const modeToggle  = document.getElementById('toggleStationType');
      const isAutoMode  = modeToggle ? modeToggle.classList.contains('active') : false;
      const needsToggle = (isBasic && isAutoMode) || (!isBasic && !isAutoMode);

      // Every station has exactly one ID; radio only controls which website mode to use
      const stationNum = usaf || domesId;
      if (!stationNum) { fail('站点编号缺失！'); return; }
      console.log(`[Tyarchive] Selecting: ${name} (${stationNum}) [${isBasic ? '国家站模式' : '自动站模式'}]`);

      (async () => {
        // ── Step 1: locate the page's search box ──────────────────────────
        const pageSearch = document.getElementById('search');
        if (!pageSearch) { fail('未找到页面搜索框！'); return; }

        // ── Step 2: auto-toggle station mode if it doesn't match ───────────
        if (needsToggle && modeToggle) {
          console.log(`[Tyarchive] Mode mismatch — clicking toggle to switch mode`);
          modeToggle.click();
          await sleep(800);
        }

        // ── Step 3: wait 800 ms before touching anything ───────────────────
        await sleep(800);

        // ── Step 4: fill the search box and fire input events ──────────────
        const nativeInputSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        ).set;
        nativeInputSetter.call(pageSearch, stationNum);
        pageSearch.dispatchEvent(new Event('input',  { bubbles: true }));
        pageSearch.dispatchEvent(new Event('change', { bubbles: true }));
        pageSearch.focus();
        console.log(`[Tyarchive] Typed "${stationNum}" into search box`);

        // ── Step 5: wait 600 ms for the dropdown to appear ─────────────────
        await sleep(600);

        // ── Step 6: poll for the dropdown result (up to 4 s) ──────────────
        let firstItem = null;
        for (let waited = 0; waited < 4000; waited += 150) {
          const resultsList = document.getElementById('search-results');
          firstItem = resultsList && resultsList.querySelector('li');
          if (firstItem) break;
          await sleep(150);
        }

        if (!firstItem) {
          fail('未找到匹配的站点结果！');
          console.warn('[Tyarchive] Dropdown result not found');
          return;
        }

        firstItem.click();
        console.log(`[Tyarchive] Clicked result: ${firstItem.textContent.trim()}`);

        // ── Step 7: wait 800 ms after selecting result ─────────────────────
        await sleep(800);

        // ── Step 8: find and click the search submit button ────────────────
        const searchForm = pageSearch.closest('form');
        const submitBtn  = searchForm
          ? searchForm.querySelector('button[type="submit"]')
          : document.querySelector('button[type="submit"] .fa-search')?.closest('button');

        if (!submitBtn) {
          fail('未找到提交按钮！');
          console.warn('[Tyarchive] Search submit button not found');
          return;
        }

        submitBtn.focus();
        const enterOpts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
        submitBtn.dispatchEvent(new KeyboardEvent('keydown',  enterOpts));
        submitBtn.dispatchEvent(new KeyboardEvent('keypress', enterOpts));
        submitBtn.dispatchEvent(new KeyboardEvent('keyup',    enterOpts));
        submitBtn.click();
        console.log('[Tyarchive] Submitted search form');

        // ── Step 9: wait 1 s before starting to watch for the chart ────────
        await sleep(1000);

        // ── Step 10: trigger data view ──────────────────────────────────────
        triggerDataView();

        // ── Intermediate visual feedback (will be overwritten by result btn) ─
        // Clear any previously highlighted select button
        const prev = stationsBody.querySelector('.btn-copied');
        if (prev && prev !== btn) { prev.classList.remove('btn-copied'); prev.textContent = 'Select'; }
        btn.textContent = '⏳';
        btn.disabled = false;
      })();
    }
  });

  // ── Load data ───────────────────────────────────────────────────────────────
  (async () => {
    try {
      const url  = chrome.runtime.getURL('stations.json');
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      allStations = await resp.json();
      renderTable(getAllDisplayStations());
    } catch (err) {
      console.error('[Tyarchive] Failed to load stations.json:', err);
      stationsBody.innerHTML = `<tr class="empty-row error-row"><td colspan="2">❌ Failed to load stations.json — check extension console.</td></tr>`;
      statusBar.textContent = 'Error';
    }
  })();

  // ── Search ──────────────────────────────────────────────────────────────────
  searchInput.addEventListener('input', () => rerender());

  // ── Add-station form ────────────────────────────────────────────────────────
  const addNameInput = shadow.getElementById('add-name');
  const addIdInput   = shadow.getElementById('add-id');
  const addBtn       = shadow.getElementById('add-btn');

  function doAddStation() {
    const idVal   = addIdInput.value.trim();
    const nameVal = addNameInput.value.trim();
    if (!idVal) { showToast('请输入站号！'); return; }

    const selectedType = shadow.querySelector('input[name="add-type"]:checked')?.value || 'basic';
    const newStation = {
      cn_name:  nameVal || idVal,
      level1:   '',
      USAF:     selectedType === 'basic' ? idVal : '',
      domes_id: selectedType === 'auto'  ? idVal : '',
      _manual:  true,
    };

    // Reject duplicates
    const key = `${newStation.USAF}|${newStation.domes_id}`;
    if (manualStations.some(s => `${s.USAF ?? ''}|${s.domes_id ?? ''}` === key)) {
      showToast('该站号已存在！');
      return;
    }

    manualStations.push(newStation);
    addIdInput.value   = '';
    addNameInput.value = '';
    rerender();
    showToast(`✓ 已添加 ${newStation.cn_name}`, 'success');
  }

  addBtn.addEventListener('click', doAddStation);
  // Enter key in the ID field submits
  addIdInput.addEventListener('keydown', e => { if (e.key === 'Enter') doAddStation(); });

  // ── Close button ────────────────────────────────────────────────────────────
  closeBtn.addEventListener('click', () => { panel.style.display = 'none'; });

  // ── Message listener (icon click → background.js → toggleUI) ───────────────
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleUI') {
      panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
      sendResponse({ status: 'ok' });
    }
  });

  // ── Drag ────────────────────────────────────────────────────────────────────
  let dragging = false, startX, startY, offX = 0, offY = 0;

  dragHeader.addEventListener('mousedown', e => {
    if (e.target === closeBtn) return;
    dragging = true;
    startX = e.clientX - offX;
    startY = e.clientY - offY;
    dragHeader.style.cursor = 'grabbing';
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    offX = e.clientX - startX;
    offY = e.clientY - startY;
    panel.style.transform = `translate3d(${offX}px, ${offY}px, 0)`;
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    dragHeader.style.cursor = 'grab';
  });

  // ── Auto-click 雨温曲线 tab 1 s after page load ─────────────────────────────
  setTimeout(() => {
    const btn = document.querySelector('a.category-button[data-category="雨温曲线"]');
    if (btn) {
      btn.click();
      console.log('[Tyarchive] Auto-clicked 雨温曲线 tab');
    } else {
      console.warn('[Tyarchive] 雨温曲线 tab not found');
    }
  }, 1000);

})();
