/**
 * injected.js  —  runs in MAIN world (page's own JS context)
 *
 * This script is injected at document_start into EVERY page's JS context,
 * meaning it shares the same window / navigator object as the page itself.
 *
 * It wraps navigator.clipboard.writeText so that BEFORE any text reaches
 * the clipboard, we check whether it looks like a Google Maps coordinate
 * pair. If it does, we convert ", " → "\t" transparently.
 *
 * This is the only reliable way to catch the coordinate that Google Maps
 * copies when you click the "lat, lng" entry at the top of its right-click
 * context menu — because that action calls writeText() directly and never
 * fires a DOM "copy" event.
 */
(function () {
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

  const _origWriteText = navigator.clipboard.writeText.bind(navigator.clipboard);

  navigator.clipboard.writeText = function (text) {
    const trimmed = (text || '').trim();
    const coord = parseCoord(trimmed);

    if (coord) {
      const converted = coord.lat + '\t' + coord.lng;
      // Tell the isolated-world content script so it can flash the badge
      window.dispatchEvent(
        new CustomEvent('__gmapCoordConverted__', { detail: { converted } })
      );
      return _origWriteText(converted);
    }

    return _origWriteText(text);
  };
})();
