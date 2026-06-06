// popup.js — Popup script for the Color-Temperature Table extension

(function () {
  const NASA_WORLDVIEW_URL = 'https://worldview.earthdata.nasa.gov/';

  /**
   * Parse layers with palette info from a Worldview URL string.
   */
  function parsePaletteLayersFromUrl(urlStr) {
    let url;
    try { url = new URL(urlStr); } catch { return []; }
    const layersParam = url.searchParams.get('l');
    if (!layersParam) return [];

    const layers = [];
    let i = 0;

    while (i < layersParam.length) {
      let parenDepth = 0;
      const start = i;
      while (i < layersParam.length) {
        if (layersParam[i] === '(') parenDepth++;
        else if (layersParam[i] === ')') parenDepth--;
        else if (layersParam[i] === ',' && parenDepth === 0) break;
        i++;
      }
      const layerStr = layersParam.substring(start, i).trim();
      i++;

      const parenIdx = layerStr.indexOf('(');
      if (parenIdx !== -1) {
        const name = layerStr.substring(0, parenIdx).trim();
        const optStr = layerStr.substring(parenIdx + 1, layerStr.lastIndexOf(')'));
        const opts = {};
        optStr.split(',').forEach(opt => {
          const eq = opt.indexOf('=');
          if (eq !== -1) opts[opt.substring(0, eq).trim()] = opt.substring(eq + 1).trim();
          else opts[opt.trim()] = true;
        });
        if (opts.palette && opts.min && opts.max) {
          layers.push({ name, opts });
        }
      }
    }

    return layers;
  }

  /**
   * Generate a color from the first color in the palette name (for the chip).
   * We hardcode a few palette → first-color mappings.
   */
  function paletteToColor(paletteName) {
    const map = {
      'rainbow_3': '#0030f5',
      'rainbow_2': '#ff0000',
      'rainbow': '#0000ff',
      'red_1': '#ff0000',
      'blue_1': '#0030f5',
    };
    return map[paletteName] || '#388bfd';
  }

  // ── Check active tab ──────────────────────────────────────────────────────

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab) return;

    const isWorldview = tab.url && tab.url.includes('worldview.earthdata.nasa.gov');

    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');

    if (isWorldview) {
      indicator.className = 'status-indicator active';
      statusText.textContent = 'Active on Worldview ✓';

      // Show detected palette layers
      const paletteLayers = parsePaletteLayersFromUrl(tab.url);
      if (paletteLayers.length > 0) {
        const section = document.getElementById('layers-section');
        const chips = document.getElementById('layer-chips');
        section.style.display = 'block';

        chips.innerHTML = paletteLayers.map(l => `
          <div class="layer-chip">
            <div class="layer-chip-dot" style="background:${paletteToColor(l.opts.palette)};"></div>
            <span>${l.name.replace(/_/g, ' ').replace(/Brightness/g, 'BT').substring(0, 32)}</span>
            <span style="color:#3a5878">${l.opts.min}–${l.opts.max}K</span>
          </div>
        `).join('');
      }
    } else {
      indicator.className = 'status-indicator inactive';
      statusText.textContent = 'Navigate to Worldview to use';
    }
  });

  // ── Open Worldview button ─────────────────────────────────────────────────
  document.getElementById('open-worldview-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: NASA_WORLDVIEW_URL });
  });

})();
