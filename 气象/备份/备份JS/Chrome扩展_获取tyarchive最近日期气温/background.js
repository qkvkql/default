// When the toolbar icon is clicked:
//  - If content.js is already running (auto-injected), send a toggleUI message
//  - If the tab somehow doesn't have it yet, inject it first then toggle
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    // Try sending toggleUI message to already-running content script
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleUI' });
    if (response && response.status === 'ok') return;
  } catch (err) {
    // Content script not yet running (e.g. page was open before extension was installed)
    // Inject it first
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (injErr) {
      console.error('[Tyarchive BG] Injection failed:', injErr);
    }
  }
});

// ── Clipboard relay ─────────────────────────────────────────────────────────────
// Content scripts lose the user-gesture context by the time the chart data
// arrives.  The background can use chrome.scripting.executeScript to run code
// in the tab's page context — this is always trusted and requires no gesture.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // ── copyToClipboard ───────────────────────────────────────────────
  if (request.action === 'copyToClipboard' && sender.tab && sender.tab.id) {
    const text = request.text || '';
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      func: (clipText) => {
        return navigator.clipboard.writeText(clipText)
          .then(() => ({ ok: true }))
          .catch((e) => ({ ok: false, err: e.message }));
      },
      args: [text]
    }).then((results) => {
      const result = results && results[0] && results[0].result;
      sendResponse(result || { ok: false });
    }).catch((e) => {
      console.error('[Tyarchive BG] scripting.executeScript failed:', e);
      sendResponse({ ok: false, err: e.message });
    });
    return true; // keep channel open for async sendResponse
  }

  // ── parseExcel: inject xlsx.full.min.js into page main world, parse bytes ──
  if (request.action === 'parseExcel' && sender.tab && sender.tab.id) {
    const { byteArray, xlsxUrl } = request;

    // First inject xlsx.full.min.js into the tab's main world (if not already there),
    // then run the parsing logic and return station records.
    chrome.scripting.executeScript({
      target: { tabId: sender.tab.id },
      world: 'MAIN',
      func: (arr, xlsxSrc) => {
        // Returns a Promise; chrome.scripting resolves it automatically.
        return new Promise((resolve, reject) => {
          const doProcess = () => {
            try {
              const XLSX = window.XLSX;
              const wb   = XLSX.read(new Uint8Array(arr), { type: 'array' });
              const ws   = wb.Sheets[wb.SheetNames[0]];
              const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

              // Mirror generate_data.py: filter country == '中国', keep 4 columns
              const china = rows.filter(r => String(r['country'] || '').trim() === '中国');

              const formatId = (val) => {
                if (val === null || val === undefined) return '';
                const s = String(val).trim();
                if (s === '' || s === 'nan' || s === 'NaN') return '';
                const n = parseFloat(s);
                if (!isNaN(n) && isFinite(n)) return String(Math.round(n));
                return s;
              };

              const stations = china.map(r => {
                let usaf    = formatId(r['USAF']     ?? r['usaf']     ?? '');
                if (usaf) usaf = usaf.padStart(5, '0');
                const domesId = formatId(r['domes_id'] ?? r['Domes_id'] ?? r['domesid'] ?? '');
                const level1  = String(r['level1']   ?? r['Level1']   ?? '').trim();
                const cnName  = String(r['cn_name']  ?? r['CN_Name']  ?? r['name']     ?? '').trim();
                return { USAF: usaf, domes_id: domesId, level1, cn_name: cnName };
              }).filter(s => s.USAF || s.domes_id || s.cn_name);

              resolve(stations);
            } catch (e) {
              reject(e.message || String(e));
            }
          };

          if (window.XLSX) {
            doProcess();
          } else {
            const s = document.createElement('script');
            s.src = xlsxSrc;
            s.onload = () => { s.remove(); doProcess(); };
            s.onerror = () => reject('Failed to load xlsx.full.min.js');
            document.head.appendChild(s);
          }
        });
      },
      args: [byteArray, xlsxUrl]
    }).then((results) => {
      const stations = results && results[0] && results[0].result;
      if (Array.isArray(stations)) {
        sendResponse({ ok: true, stations });
      } else {
        sendResponse({ ok: false, error: 'No station array returned' });
      }
    }).catch((e) => {
      console.error('[Tyarchive BG] parseExcel failed:', e);
      sendResponse({ ok: false, error: e.message || String(e) });
    });
    return true;
  }

  // ── saveStationsJson: download updated stations.json to Downloads folder ───
  if (request.action === 'saveStationsJson') {
    const json    = request.json || '[]';
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(json);
    chrome.downloads.download(
      { url: dataUrl, filename: 'stations.json', saveAs: false, conflictAction: 'overwrite' },
      (downloadId) => sendResponse({ ok: !!downloadId })
    );
    return true;
  }

  // ── fetchAvgTemp: open localhost:1004, poll DOM until avg value ready ──────
  // Opens a new tab to http://localhost:1004/?station=<5-digit>&date=<YYYY-MM-DD>,
  // waits for the page to load, then polls the first
  // <code class="copy-num" title="Click to copy"> element every 1.5 s until it
  // has a stable (non-transient) value, or 30 s have elapsed.
  // Returns { ok: true, avg: <string> } or { ok: false, error }.
  // If the page returns "unable", avg is "" (data missing for that date).
  if (request.action === 'fetchAvgTemp') {
    const { station, date } = request;
    if (!station || !date) {
      sendResponse({ ok: false, error: 'Missing station or date' });
      return false;
    }

    const url = `http://localhost:1004/?station=${station}&date=${date}`;

    (async () => {
      let newTab;
      try {
        // 1. Open the helper page in a background tab (not focused)
        newTab = await chrome.tabs.create({ url, active: false });
        const tabId = newTab.id;

        // 2. Wait for the tab's initial page load to complete (up to 10 s)
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            chrome.tabs.onUpdated.removeListener(listener);
            resolve(); // proceed even if still "loading"
          }, 10000);

          const listener = (updatedTabId, info) => {
            if (updatedTabId === tabId && info.status === 'complete') {
              clearTimeout(timeout);
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });

        // 3. Poll the DOM until the avg value is ready (up to 30 s, every 1.5 s).
        //    Transient / not-yet-computed states to skip:
        //      - element absent (null)
        //      - empty text ""
        //      - placeholder strings: "calculating", "loading", "…", "--", "..."
        const POLL_INTERVAL_MS = 1500;
        const POLL_TIMEOUT_MS  = 30000;
        // Values that mean "not ready yet — keep polling".
        // NOTE: "unable" is intentionally NOT here; it is a terminal result
        // (page finished computing but data is missing) → breaks the loop immediately.
        const TRANSIENT = new Set(['', 'calculating', 'loading', '…', '--', '...']);


        let rawAvg  = null;
        let elapsed = 0;

        while (elapsed < POLL_TIMEOUT_MS) {
          await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
          elapsed += POLL_INTERVAL_MS;

          let results;
          try {
            results = await chrome.scripting.executeScript({
              target: { tabId },
              func: () => {
                // Primary target: the copy-num code element
                const el = document.querySelector('code.copy-num[title="Click to copy"]');
                if (el) return el.textContent.trim();
                // Fallback: if the page shows "unable" in the surrounding container
                // before populating code.copy-num, detect it early so we don't
                // keep polling unnecessarily for the full 30 s.
                const container = document.querySelector('span.e8');
                if (container && container.textContent.toLowerCase().includes('unable')) {
                  return 'unable';
                }
                return null;
              }
            });
          } catch (scriptErr) {
            // Tab may still be navigating after load; keep polling
            console.warn(`[Tyarchive BG] fetchAvgTemp script error at ${elapsed} ms:`, scriptErr.message);
            continue;
          }

          const val = results && results[0] && results[0].result;

          // Accept the value only when the element exists AND has a non-transient string
          if (val !== null && val !== undefined && !TRANSIENT.has(val.toLowerCase())) {
            rawAvg = val;
            console.log(`[Tyarchive BG] fetchAvgTemp: got "${rawAvg}" after ${elapsed} ms`);
            break;
          }

          console.log(`[Tyarchive BG] fetchAvgTemp: polling (${elapsed} ms) — value=${JSON.stringify(val)}`);
        }

        if (!rawAvg) {
          console.warn(`[Tyarchive BG] fetchAvgTemp: timed out after ${elapsed} ms, no value found`);
        }

        // "unable" → page has no mean temp for that date → return empty string
        const avg = (!rawAvg || rawAvg.toLowerCase() === 'unable') ? '' : rawAvg;
        sendResponse({ ok: true, avg });

      } catch (err) {
        console.error('[Tyarchive BG] fetchAvgTemp error:', err);
        sendResponse({ ok: false, error: err.message || String(err) });
      } finally {
        // Always close the helper tab when done (success or failure)
        if (newTab && newTab.id) {
          try { await chrome.tabs.remove(newTab.id); } catch (_) {}
        }
      }
    })();

    return true; // keep message channel open for async sendResponse
  }

});
