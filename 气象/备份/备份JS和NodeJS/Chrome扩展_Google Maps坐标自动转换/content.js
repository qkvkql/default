/**
 * content.js  —  runs in isolated extension world
 *
 * Handles two scenarios:
 *
 * 1. DOM "copy" event  (user selects text and presses Ctrl+C)
 *    Intercepts the event, checks for a coordinate pattern, and rewrites
 *    the clipboard data before the browser commits it.
 *
 * 2. CustomEvent from injected.js  (Google Maps right-click menu)
 *    injected.js lives in the MAIN world and patches writeText(); it fires
 *    a CustomEvent on window so we can notify the background service worker
 *    to flash the badge.
 */

// Format 1: plain decimal  e.g. "39.9042, 116.4074"
const COORD_RE = /^(-?\d{1,3}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/;

// Format 2: degree + N/S/E/W  e.g. "44.8678°N, 110.117°E"
const COORD_DIR_RE = /^(\d{1,3}(?:\.\d+)?)°([NS]),\s*(\d{1,3}(?:\.\d+)?)°([EW])$/i;

function parseCoord(text) {
  let m = text.match(COORD_RE);
  if (m) return { lat: m[1], lng: m[2] };

  m = text.match(COORD_DIR_RE);
  if (m) {
    return {
      lat: (m[2].toUpperCase() === 'S' ? '-' : '') + m[1],
      lng: (m[4].toUpperCase() === 'W' ? '-' : '') + m[3],
    };
  }
  return null;
}

// ── Scenario 1: Ctrl+C / keyboard copy ──────────────────────────────────────────────
document.addEventListener('copy', (e) => {
  const selected = (window.getSelection()?.toString() ?? '').trim();
  const coord = parseCoord(selected);
  if (!coord) return;

  const converted = coord.lat + '\t' + coord.lng;
  e.clipboardData.setData('text/plain', converted);
  e.preventDefault();

  chrome.runtime.sendMessage({ type: 'COORD_CONVERTED' });
});

// ── Scenario 2: Google Maps writeText() interception (from injected.js) ──────
window.addEventListener('__gmapCoordConverted__', () => {
  chrome.runtime.sendMessage({ type: 'COORD_CONVERTED' });
});
