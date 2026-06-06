/**
 * NASA Worldview Color-Temperature Table Extension
 * Content Script - injected into worldview.earthdata.nasa.gov
 */
(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  let paletteCache = null;  // full palettes-custom.json cache
  let tablePanel = null;    // currently visible panel DOM element
  let isInitialized = false;

  // ─── URL Layer Parsing ────────────────────────────────────────────────────

  /**
   * Parse the `l` URL parameter into an array of layer objects.
   * Each layer may have options like: LayerName(palette=rainbow_3,min=213.2,max=260.3)
   */
  function parseLayersFromUrl() {
    const url = new URL(window.location.href);
    const layersParam = url.searchParams.get('l');
    if (!layersParam) return [];

    const layers = [];
    let i = 0;
    const str = layersParam;

    while (i < str.length) {
      let parenDepth = 0;
      const start = i;

      while (i < str.length) {
        if (str[i] === '(') parenDepth++;
        else if (str[i] === ')') parenDepth--;
        else if (str[i] === ',' && parenDepth === 0) break;
        i++;
      }

      const layerStr = str.substring(start, i).trim();
      i++; // skip comma

      if (!layerStr) continue;

      const parenIdx = layerStr.indexOf('(');
      if (parenIdx !== -1) {
        const name = layerStr.substring(0, parenIdx).trim();
        const optStr = layerStr.substring(parenIdx + 1, layerStr.lastIndexOf(')'));
        const opts = {};

        // Parse comma-separated options inside parentheses
        // options themselves may not have nested parens
        optStr.split(',').forEach(opt => {
          const eqIdx = opt.indexOf('=');
          if (eqIdx !== -1) {
            opts[opt.substring(0, eqIdx).trim()] = opt.substring(eqIdx + 1).trim();
          } else {
            opts[opt.trim()] = true;
          }
        });

        layers.push({ name, opts });
      } else {
        layers.push({ name: layerStr, opts: {} });
      }
    }

    return layers;
  }

  /** Return only layers that have palette, min, and max options */
  function getPaletteLayers() {
    return parseLayersFromUrl().filter(l =>
      l.opts.palette &&
      l.opts.min !== undefined &&
      l.opts.max !== undefined
    );
  }

  // ─── Palette Data ─────────────────────────────────────────────────────────

  /**
   * Fetch and cache the full palettes-custom.json from the Worldview server.
   * Returns the JSON object, or null on failure.
   */
  async function fetchAllPalettes() {
    if (paletteCache !== null) return paletteCache;

    try {
      const resp = await fetch('/config/palettes-custom.json', { cache: 'force-cache' });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      paletteCache = await resp.json();
      return paletteCache;
    } catch (err) {
      console.warn('[NCT] Could not load palettes-custom.json:', err);
      paletteCache = {};
      return paletteCache;
    }
  }

  /**
   * Get the color array for a named palette.
   * Colors are 8-char hex strings like "0030f5ff" (RRGGBBAA).
   */
  async function getPaletteColors(paletteName) {
    const all = await fetchAllPalettes();
    const entry = all[paletteName];
    if (!entry || !Array.isArray(entry.colors)) return null;
    return entry.colors;
  }

  // ─── Table Data Generation ────────────────────────────────────────────────

  /**
   * Given an array of RRGGBBAA hex color strings and a temperature range [minK, maxK],
   * compute the correspondence table rows.
   *
   * Color index 0  → minK
   * Color index N-1 → maxK
   * Each entry covers a range of ±halfStep around its center temperature.
   */
  function generateTableRows(colors, minK, maxK) {
    const N = colors.length;
    if (N === 0) return [];

    const totalRange = maxK - minK;
    // If only 1 color, it covers the whole range
    const step = N > 1 ? totalRange / (N - 1) : totalRange;
    const halfStep = step / 2;

    return colors.map((colorHex, i) => {
      const center = N > 1
        ? minK + (i / (N - 1)) * totalRange
        : (minK + maxK) / 2;

      const startK = center - halfStep;
      const endK = center + halfStep;

      // Strip alpha channel, uppercase
      const hex = '#' + colorHex.substring(0, 6).toUpperCase();

      return {
        index: i,
        hex,
        target: round1(center),
        start: round1(startK),
        end: round1(endK)
      };
    });
  }

  function round1(v) {
    return Math.round(v * 10) / 10;
  }

  // ─── Panel UI ─────────────────────────────────────────────────────────────

  /** Remove existing panel if present */
  function removePanel() {
    if (tablePanel) {
      tablePanel.remove();
      tablePanel = null;
    }
  }

  /**
   * Show the color-temperature table for the given layer info object.
   * { name, opts: { palette, min, max, ... } }
   */
  async function showTablePanel(layerInfo) {
    removePanel();

    const { name, opts } = layerInfo;
    const paletteName = opts.palette;
    const minK = parseFloat(opts.min);
    const maxK = parseFloat(opts.max);
    const isSquash = opts.squash === 'true' || opts.squash === true;

    // ── Create panel skeleton ──
    const panel = document.createElement('div');
    panel.id = 'nct-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Color Temperature Table');
    panel.innerHTML = buildPanelHTML(name, paletteName, minK, maxK, isSquash);
    document.body.appendChild(panel);
    tablePanel = panel;

    // Close button
    panel.querySelector('#nct-close-btn').addEventListener('click', removePanel);

    // ESC key closes panel
    const keyHandler = (e) => { if (e.key === 'Escape') { removePanel(); document.removeEventListener('keydown', keyHandler); } };
    document.addEventListener('keydown', keyHandler);

    // Make panel draggable by its header
    makeDraggable(panel, panel.querySelector('#nct-header'));

    // Export buttons
    panel.querySelector('#nct-export-csv').addEventListener('click', () => exportCSV(panel));
    panel.querySelector('#nct-export-copy').addEventListener('click', () => copyToClipboard(panel));

    // ── Fetch palette and render table ──
    const loadingEl = panel.querySelector('#nct-loading');

    const colors = await getPaletteColors(paletteName);

    if (!colors) {
      loadingEl.innerHTML = `
        <div class="nct-error">
          <span class="nct-error-icon">⚠️</span>
          Failed to load palette "<strong>${paletteName}</strong>".<br>
          Make sure you are on <em>worldview.earthdata.nasa.gov</em>.
        </div>`;
      return;
    }

    const rows = generateTableRows(colors, minK, maxK);

    // Replace loading indicator with table
    loadingEl.outerHTML = buildTableHTML(rows, paletteName, colors.length, minK, maxK);

    // Store rows on panel for export
    panel._tableRows = rows;
    panel._layerName = name;
    panel._paletteName = paletteName;

    // Animate in
    panel.classList.add('nct-visible');
  }

  // ── HTML builders ──

  function buildPanelHTML(layerName, paletteName, minK, maxK, isSquash) {
    const shortName = layerName.replace(/_/g, ' ');
    return `
      <div id="nct-header">
        <div id="nct-header-info">
          <div id="nct-icon">🌡️</div>
          <div id="nct-title-block">
            <div id="nct-layer-name" title="${layerName}">${shortName}</div>
            <div id="nct-subtitle">
              Palette: <span class="nct-badge">${paletteName}</span>
              &nbsp;|&nbsp; ${minK} K → ${maxK} K
              ${isSquash ? '&nbsp;<span class="nct-badge nct-badge-squash">squash</span>' : ''}
            </div>
          </div>
        </div>
        <button id="nct-close-btn" title="Close (Esc)" aria-label="Close">✕</button>
      </div>

      <div id="nct-toolbar">
        <button id="nct-export-csv" class="nct-btn" title="Download as CSV">⬇ CSV</button>
        <button id="nct-export-copy" class="nct-btn" title="Copy table to clipboard">📋 Copy</button>
      </div>

      <div id="nct-loading">
        <div class="nct-spinner"></div>
        <span>Loading palette data…</span>
      </div>
    `;
  }

  function buildTableHTML(rows, paletteName, colorCount, minK, maxK) {
    const step = colorCount > 1
      ? round1((maxK - minK) / (colorCount - 1))
      : round1(maxK - minK);

    const rowsHtml = rows.map(r => `
      <tr>
        <td class="nct-td-swatch">
          <div class="nct-swatch" style="background:${r.hex};" title="${r.hex}"></div>
        </td>
        <td class="nct-td-hex nct-mono">${r.hex}</td>
        <td class="nct-td-num">${r.target}</td>
        <td class="nct-td-num">${r.start}</td>
        <td class="nct-td-num">${r.end}</td>
      </tr>
    `).join('');

    return `
      <div id="nct-stats">
        <span>${colorCount} color entries</span>
        <span>Step ≈ ${step} K / color</span>
        <span>Total range: ${round1(maxK - minK)} K</span>
      </div>
      <div id="nct-table-wrapper">
        <table id="nct-table" data-palette="${paletteName}">
          <thead>
            <tr>
              <th>Swatch</th>
              <th>Color Code</th>
              <th>Target K</th>
              <th>Start K</th>
              <th>End K</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </div>
    `;
  }

  // ─── Draggable Panel ──────────────────────────────────────────────────────

  function makeDraggable(el, handle) {
    let dragging = false;
    let ox = 0, oy = 0;

    handle.style.cursor = 'move';

    handle.addEventListener('mousedown', e => {
      if (e.target.closest('#nct-close-btn')) return;
      dragging = true;
      const rect = el.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      el.style.transition = 'none';
      e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      let left = e.clientX - ox;
      let top = e.clientY - oy;
      // Keep inside viewport
      left = Math.max(0, Math.min(left, window.innerWidth - el.offsetWidth));
      top = Math.max(0, Math.min(top, window.innerHeight - 60));
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.right = 'auto';
      el.style.bottom = 'auto';
    });

    document.addEventListener('mouseup', () => { dragging = false; });
  }

  // ─── Export Helpers ───────────────────────────────────────────────────────

  function exportCSV(panel) {
    const rows = panel._tableRows;
    if (!rows) return;
    const name = panel._layerName || 'layer';
    const palette = panel._paletteName || 'palette';

    const header = 'Color Code,Target Kelvin Value,Kelvin Value Start,Kelvin Value End';
    const body = rows.map(r => `${r.hex},${r.target},${r.start},${r.end}`).join('\n');
    const csv = header + '\n' + body;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}_${palette}_kelvin_table.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard(panel) {
    const rows = panel._tableRows;
    if (!rows) return;

    const header = 'Color Code\tTarget Kelvin Value\tKelvin Value Start\tKelvin Value End';
    const body = rows.map(r => `${r.hex}\t${r.target}\t${r.start}\t${r.end}`).join('\n');
    const text = header + '\n' + body;

    try {
      await navigator.clipboard.writeText(text);
      const btn = panel.querySelector('#nct-export-copy');
      const orig = btn.textContent;
      btn.textContent = '✓ Copied!';
      btn.classList.add('nct-btn-success');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('nct-btn-success');
      }, 2000);
    } catch (e) {
      console.warn('[NCT] Clipboard write failed:', e);
    }
  }

  // ─── Layer Click Detection ────────────────────────────────────────────────

  /**
   * Walk up the DOM from the clicked element trying to identify a layer item.
   * Returns { layerId } or null.
   *
   * Strategy (in order):
   *   1. Element or ancestor has data-layer-id / data-testid containing layer name
   *   2. Element or ancestor id starts with a known layer ID prefix
   *   3. Element or ancestor contains a <canvas> or known palette bar (gradient layer has one)
   */
  function resolveLayerId(target, paletteLayers) {
    // Build a set of known palette layer names for quick lookup
    const paletteNames = new Set(paletteLayers.map(l => l.name));

    // Traverse up DOM
    let el = target;
    const maxDepth = 12;
    let depth = 0;

    while (el && el !== document.body && depth < maxDepth) {
      // 1. data-layer-id attribute
      if (el.dataset && el.dataset.layerId && paletteNames.has(el.dataset.layerId)) {
        return el.dataset.layerId;
      }

      // 2. id contains a known layer name
      if (el.id) {
        for (const name of paletteNames) {
          if (el.id === name || el.id.includes(name)) {
            return name;
          }
        }
      }

      // 3. aria-label contains a known layer name
      const aria = el.getAttribute && el.getAttribute('aria-label');
      if (aria) {
        for (const name of paletteNames) {
          if (aria.includes(name)) return name;
        }
      }

      el = el.parentElement;
      depth++;
    }

    return null;
  }

  /**
   * Heuristic: check if the clicked area is on a blank (non-interactive) space
   * of a layer item that has a palette.
   * We look for these patterns around the click target's ancestor chain.
   */
  function isLayerItemBlankSpace(target) {
    // Don't trigger if clicking on actual buttons/links/inputs/icons
    if (target.closest('button, a, input, select, canvas, [role="button"], [role="checkbox"]')) {
      return false;
    }
    return true;
  }

  /**
   * Try to find which palette layer was clicked by looking at the DOM structure.
   * Uses position-based fallback: finds all visible layer items in the panel,
   * maps their indices to the URL layer list (preserving order), and identifies
   * which item the click was inside.
   */
  function findLayerByPosition(target, paletteLayers) {
    // Find the layers container panel
    const containers = [
      document.querySelector('#wv-layers-options'),
      document.querySelector('.layer-list'),
      document.querySelector('[class*="layer-list"]'),
      document.querySelector('[class*="active-layer"]'),
      document.querySelector('[id*="layer"]'),
    ].filter(Boolean);

    if (!containers.length) return null;

    // For each container, look for list items
    for (const container of containers) {
      const items = Array.from(container.querySelectorAll('li, [class*="layer-item"]'));
      if (items.length === 0) continue;

      for (let i = 0; i < items.length; i++) {
        if (items[i].contains(target)) {
          // This item is at index i in the DOM; try to match to a palette layer
          // The DOM order should roughly match the URL layer order
          if (i < paletteLayers.length) {
            return paletteLayers[i].name;
          }
        }
      }
    }

    return null;
  }

  // ─── Main Click Listener ──────────────────────────────────────────────────

  function setupClickDetection() {
    document.addEventListener('click', async (e) => {
      // Ignore clicks on our own panel
      if (tablePanel && tablePanel.contains(e.target)) return;

      // Only process non-interactive click targets
      if (!isLayerItemBlankSpace(e.target)) return;

      const paletteLayers = getPaletteLayers();
      if (paletteLayers.length === 0) return;

      // Try to resolve layer id from DOM attributes
      let layerId = resolveLayerId(e.target, paletteLayers);

      // Fallback: position-based matching
      if (!layerId) {
        layerId = findLayerByPosition(e.target, paletteLayers);
      }

      if (!layerId) return;

      const layer = paletteLayers.find(l => l.name === layerId);
      if (!layer) return;

      await showTablePanel(layer);
    }, true); // useCapture = true to run before page handlers
  }

  // ─── Inject Helper Overlay ────────────────────────────────────────────────
  /**
   * Injects a small "🌡️ Click layer" hint badge into the page so the user
   * knows the extension is active. Also provides a manual layer picker button
   * as a reliable fallback when DOM detection fails.
   */
  function injectHintButton() {
    if (document.getElementById('nct-hint-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'nct-hint-btn';
    btn.title = 'Show Color-Temperature Table for a palette layer';
    btn.innerHTML = `
      <span class="nct-hint-icon">🌡️</span>
      <span class="nct-hint-label">Color Table</span>
    `;

    btn.addEventListener('click', async () => {
      const paletteLayers = getPaletteLayers();
      if (paletteLayers.length === 0) {
        showNoLayersNotice();
        return;
      }

      if (paletteLayers.length === 1) {
        await showTablePanel(paletteLayers[0]);
        return;
      }

      // Multiple palette layers: show picker
      showLayerPicker(paletteLayers);
    });

    document.body.appendChild(btn);
  }

  function showNoLayersNotice() {
    removePanel();
    const panel = document.createElement('div');
    panel.id = 'nct-panel';
    panel.innerHTML = `
      <div id="nct-header">
        <div id="nct-header-info">
          <div id="nct-icon">🌡️</div>
          <div id="nct-title-block">
            <div id="nct-layer-name">No Palette Layers Found</div>
            <div id="nct-subtitle">Add a layer with a color palette (e.g., Brightness Temperature)</div>
          </div>
        </div>
        <button id="nct-close-btn" title="Close">✕</button>
      </div>
      <div id="nct-loading">
        <div class="nct-error">
          <span class="nct-error-icon">ℹ️</span>
          No layers with palette and temperature range found in the current URL.<br><br>
          Add a <strong>Brightness Temperature</strong> layer (like VIIRS or MODIS) and make sure
          it has <code>palette=…</code>, <code>min=…</code> and <code>max=…</code> in the URL.
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    tablePanel = panel;
    panel.querySelector('#nct-close-btn').addEventListener('click', removePanel);
    panel.classList.add('nct-visible');
    makeDraggable(panel, panel.querySelector('#nct-header'));
  }

  /** Show a picker panel listing all palette layers */
  function showLayerPicker(paletteLayers) {
    removePanel();

    const panel = document.createElement('div');
    panel.id = 'nct-panel';

    const itemsHtml = paletteLayers.map((l, i) => `
      <div class="nct-picker-item" data-idx="${i}" tabindex="0" role="button">
        <div class="nct-picker-name">${l.name.replace(/_/g, ' ')}</div>
        <div class="nct-picker-meta">
          palette: <strong>${l.opts.palette}</strong>
          &nbsp;|&nbsp; ${l.opts.min} K → ${l.opts.max} K
        </div>
      </div>
    `).join('');

    panel.innerHTML = `
      <div id="nct-header">
        <div id="nct-header-info">
          <div id="nct-icon">🌡️</div>
          <div id="nct-title-block">
            <div id="nct-layer-name">Select a Palette Layer</div>
            <div id="nct-subtitle">${paletteLayers.length} layers with temperature palette</div>
          </div>
        </div>
        <button id="nct-close-btn" title="Close">✕</button>
      </div>
      <div id="nct-picker-list">${itemsHtml}</div>
    `;

    document.body.appendChild(panel);
    tablePanel = panel;
    panel.querySelector('#nct-close-btn').addEventListener('click', removePanel);
    panel.classList.add('nct-visible');
    makeDraggable(panel, panel.querySelector('#nct-header'));

    panel.querySelectorAll('.nct-picker-item').forEach(item => {
      const activate = async () => {
        const idx = parseInt(item.dataset.idx, 10);
        await showTablePanel(paletteLayers[idx]);
      };
      item.addEventListener('click', activate);
      item.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') activate(); });
    });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    setupClickDetection();

    // Inject hint button after the app shell is ready
    const waitForApp = setInterval(() => {
      if (document.querySelector('#app') || document.querySelector('.wv-content-panel')) {
        clearInterval(waitForApp);
        // Small delay to let React render its first paint
        setTimeout(injectHintButton, 1500);
      }
    }, 300);

    // Fallback: inject after 4 seconds regardless
    setTimeout(injectHintButton, 4000);

    // Refresh hint button on URL changes (SPA navigation)
    let lastHref = window.location.href;
    setInterval(() => {
      if (window.location.href !== lastHref) {
        lastHref = window.location.href;
        // Close panel if active layer params changed
        if (tablePanel) removePanel();
      }
    }, 500);
  }

  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
