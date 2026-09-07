(function () {
  "use strict";

  const BRAND_TEXT = "Worldview";
  const LAYER_NAME_PATTERN = /Brightness\s+Temperature/i;
  const KELVIN_MIN_PATTERN = /(-?\d+(?:\.\d+)?)\s*(?:[-\u2013\u2014]\s*-?\d+(?:\.\d+)?\s*)?K\b/;
  const HIDDEN_STYLE_PATTERN = /(?:display:\s*none|visibility:\s*hidden|opacity:\s*0)/i;
  const OPTIONS_PANEL_PATTERN = /Opacity[\s\S]*Thresholds[\s\S]*\bK\b/i;
  const SCAN_INTERVAL_MS = 300;

  let titleElement;
  let currentValue = "";

  function isVisibleElement(element) {
    if (!(element instanceof Element)) return false;
    if (element.closest("[hidden], [aria-hidden='true']")) return false;
    if (HIDDEN_STYLE_PATTERN.test(element.getAttribute("style") || "")) return false;

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function textOf(element) {
    return (element && element.innerText ? element.innerText : element.textContent || "").replace(/\s+/g, " ").trim();
  }

  function getWorldviewTitleElement() {
    if (titleElement && isVisibleElement(titleElement)) {
      return titleElement;
    }

    const candidates = Array.from(document.querySelectorAll("h1, h2, div, span, a"))
      .filter((element) => isVisibleElement(element) && textOf(element) === BRAND_TEXT)
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return {
          element,
          rect,
          score: rect.width * rect.height + Number.parseFloat(style.fontSize || "0") * 100
        };
      })
      .filter((candidate) => candidate.rect.top < 180 && candidate.rect.left < 420)
      .sort((a, b) => b.score - a.score);

    titleElement = candidates.length ? candidates[0].element : null;
    return titleElement;
  }

  function setTitleValue(value) {
    const title = getWorldviewTitleElement();
    if (!title) return;

    if (!title.dataset.nasaBtOriginalText) {
      title.dataset.nasaBtOriginalText = title.textContent || BRAND_TEXT;
    }

    const nextText = value || title.dataset.nasaBtOriginalText || BRAND_TEXT;
    if (title.textContent !== nextText) {
      title.textContent = nextText;
    }
  }

  function getOpenBrightnessTemperatureOptionsText() {
    const candidates = Array.from(document.querySelectorAll("aside, section, article, [role='dialog'], div"))
      .filter((element) => isVisibleElement(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        const text = textOf(element);
        return { element, rect, text, area: rect.width * rect.height };
      })
      .filter((candidate) => isBrightnessTemperatureOptionsPanel(candidate.text, candidate.rect));

    candidates.sort((a, b) => a.area - b.area);
    return candidates.length ? candidates[0].text : "";
  }

  function isBrightnessTemperatureOptionsPanel(text, rect) {
    if (!LAYER_NAME_PATTERN.test(text) || !OPTIONS_PANEL_PATTERN.test(text)) {
      return false;
    }

    if (rect.width < 220 || rect.height < 180) {
      return false;
    }

    const titleIndex = text.search(LAYER_NAME_PATTERN);
    const opacityIndex = text.search(/Opacity/i);
    const thresholdsIndex = text.search(/Thresholds/i);

    return titleIndex >= 0 && opacityIndex > titleIndex && thresholdsIndex > opacityIndex;
  }

  function extractKelvinMinimum(text) {
    const thresholdMatch = text.match(/Thresholds\s+.*?(-?\d+(?:\.\d+)?)\s*[-\u2013\u2014]\s*-?\d+(?:\.\d+)?\s*K\b/i);
    if (thresholdMatch) {
      return Number(thresholdMatch[1]);
    }

    const genericMatch = text.match(KELVIN_MIN_PATTERN);
    return genericMatch ? Number(genericMatch[1]) : null;
  }

  function formatCelsius(kelvin) {
    const celsius = (Math.round(kelvin * 100) - 27315) / 100;
    const rounded = Math.sign(celsius) * Math.round(Math.abs(celsius) * 10 + Number.EPSILON) / 10;
    return `${rounded.toFixed(1)}\u00b0C`;
  }

  function scan() {
    const panelText = getOpenBrightnessTemperatureOptionsText();
    const kelvin = panelText ? extractKelvinMinimum(panelText) : null;
    const nextValue = Number.isFinite(kelvin) ? formatCelsius(kelvin) : "";

    if (!nextValue) {
      return;
    }

    if (nextValue === currentValue) {
      setTitleValue(currentValue);
      return;
    }
    currentValue = nextValue;
    setTitleValue(currentValue);
  }

  const observer = new MutationObserver(scan);

  function start() {
    observer.observe(document.documentElement, {
      attributes: true,
      childList: true,
      characterData: true,
      subtree: true
    });
    scan();
    window.setInterval(scan, SCAN_INTERVAL_MS);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
