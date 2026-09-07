/**
 * offscreen.js — Clipboard Poller
 *
 * This script runs inside a hidden offscreen document (Manifest V3).
 * Because it lives in an extension context with clipboardRead/Write permissions,
 * it can call navigator.clipboard.readText() without a user gesture.
 *
 * Every 500 ms it reads the clipboard. If the content looks like a coordinate
 * pair in one of the supported formats, it converts it to a TAB-separated
 * "lat\tlng" pair and writes the result back to the clipboard.
 *
 * Supported formats:
 *   Format 1 – plain decimal (Google Maps copy):
 *     "39.9042, 116.4074"   → "39.9042\t116.4074"
 *     "-33.8688, 151.2093"  → "-33.8688\t151.2093"
 *
 *   Format 2 – degree + direction:
 *     "44.8678°N, 110.117°E" → "44.8678\t110.117"
 *     "33.45°S, 70.667°W"   → "-33.45\t-70.667"
 */

// Format 1: plain decimal  e.g. "39.9042, 116.4074"
const COORD_RE = /^(-?\d{1,3}(?:\.\d+)?),\s+(-?\d{1,3}(?:\.\d+)?)$/;

// Format 2: degree + N/S/E/W  e.g. "44.8678°N, 110.117°E"
const COORD_DIR_RE = /^(\d{1,3}(?:\.\d+)?)°([NS]),\s*(\d{1,3}(?:\.\d+)?)°([EW])$/i;

/**
 * Try to match text against either coordinate format.
 * Returns { lat, lng } as strings if matched, otherwise null.
 */
function parseCoord(text) {
  let m = text.match(COORD_RE);
  if (m) return { lat: m[1], lng: m[2] };

  m = text.match(COORD_DIR_RE);
  if (m) {
    const lat = (m[2].toUpperCase() === 'S' ? '-' : '') + m[1];
    const lng = (m[4].toUpperCase() === 'W' ? '-' : '') + m[3];
    return { lat, lng };
  }

  return null;
}

// Track the last value we wrote so we don't convert our own output again
let lastWritten = null;

async function checkClipboard() {
  let text;
  try {
    text = await navigator.clipboard.readText();
  } catch (_) {
    // Clipboard may be temporarily unavailable (e.g. locked by another process)
    return;
  }

  const trimmed = text.trim();

  // If this is something we already wrote, do nothing
  if (trimmed === lastWritten) return;

  const coord = parseCoord(trimmed);
  if (!coord) {
    // Not a coordinate — reset so a new coordinate can be caught later
    lastWritten = null;
    return;
  }

  // Build tab-separated version
  const converted = `${coord.lat}\t${coord.lng}`;

  // Record before writing so the next poll skips our own write
  lastWritten = converted;

  try {
    await navigator.clipboard.writeText(converted);
  } catch (_) {
    lastWritten = null; // Write failed — allow a retry
    return;
  }

  // Tell the background service worker to flash the badge
  chrome.runtime.sendMessage({ type: 'COORD_CONVERTED' });
}

// Poll every 500 ms
setInterval(checkClipboard, 500);
