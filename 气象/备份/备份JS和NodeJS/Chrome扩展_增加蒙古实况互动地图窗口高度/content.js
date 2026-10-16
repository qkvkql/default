(() => {
  const PANEL_ID = "weather-map-height-panel";
  const MAP_SELECTOR = ".obsWater.leaflet-container";
  const BANNER_SELECTOR = "div.shadow-xl.sticky.top-0.z-50.select-none";
  const BANNER_COLLAPSED_CLASS = "weather-map-height-banner-collapsed";
  const PANEL_HIDDEN_CLASS = "weather-map-height-panel-hidden";
  const INCREASE_FACTOR = 2;
  let resizeObserver;

  function notifyMapSizeChanged() {
    // Leaflet listens for window resize and recalculates its visible tile area.
    window.dispatchEvent(new Event("resize"));
  }

  function findMap() {
    return document.querySelector(MAP_SELECTOR);
  }

  function rememberStyle(element, key) {
    const dataKey = `mapHeightOriginal${key[0].toUpperCase()}${key.slice(1)}`;
    if (element.dataset[dataKey] === undefined) {
      element.dataset[dataKey] = element.style[key];
    }
    return dataKey;
  }

  function toggleMapHeight(button) {
    const map = findMap();
    if (!map) {
      button.textContent = "尚未找到互动地图";
      return;
    }

    const expanded = map.dataset.heightExpanded === "true";
    const parent = map.parentElement;
    if (!expanded) {
      const banner = document.querySelector(BANNER_SELECTOR);
      if (banner) banner.classList.add(BANNER_COLLAPSED_CLASS);

      const mapHeight = map.getBoundingClientRect().height;
      if (!mapHeight) {
        if (banner) banner.classList.remove(BANNER_COLLAPSED_CLASS);
        return;
      }

      const mapHeightKey = rememberStyle(map, "height");
      map.dataset.heightOriginalPx = String(mapHeight);
      map.style.setProperty("height", `${Math.round(mapHeight * INCREASE_FACTOR)}px`, "important");

      // The map is absolutely positioned on this site. Grow its immediate
      // wrapper too when that wrapper defines the same clipped viewport.
      if (parent && parent !== document.body && parent !== document.documentElement) {
        const parentHeight = parent.getBoundingClientRect().height;
        const parentStyleKey = rememberStyle(parent, "height");
        if (parentHeight > 0 && Math.abs(parentHeight - mapHeight) < 8) {
          parent.dataset.mapHeightWrapper = "true";
          parent.dataset.mapHeightOriginalPx = String(parentHeight);
          parent.style.setProperty("height", `${Math.round(parentHeight * INCREASE_FACTOR)}px`, "important");
          map.dataset.heightParentStyleKey = parentStyleKey;
        }
      }
      map.dataset.heightMapStyleKey = mapHeightKey;
      map.dataset.heightExpanded = "true";
      button.textContent = "恢复地图和页眉";
      button.setAttribute("aria-pressed", "true");
    } else {
      const mapKey = map.dataset.heightMapStyleKey || "mapHeightOriginalHeight";
      map.style.setProperty("height", map.dataset[mapKey] || "", "important");
      delete map.dataset.heightExpanded;

      if (parent?.dataset.mapHeightWrapper === "true") {
        const parentKey = map.dataset.heightParentStyleKey || "mapHeightOriginalHeight";
        parent.style.setProperty("height", parent.dataset[parentKey] || "", "important");
        delete parent.dataset.mapHeightWrapper;
        delete parent.dataset.mapHeightOriginalPx;
      }
      document.querySelectorAll(`.${BANNER_COLLAPSED_CLASS}`).forEach((banner) => {
        banner.classList.remove(BANNER_COLLAPSED_CLASS);
      });
      button.textContent = "加高地图并收起页眉";
      button.setAttribute("aria-pressed", "false");
    }

    window.setTimeout(notifyMapSizeChanged, 100);
  }

  function addPanel() {
    if (!document.body || document.getElementById(PANEL_ID)) return;

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.classList.add(PANEL_HIDDEN_CLASS);
    panel.setAttribute("aria-label", "互动地图高度设置");

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "weather-map-height-close";
    closeButton.textContent = "×";
    closeButton.title = "关闭面板（刷新页面可重新打开）";
    closeButton.setAttribute("aria-label", "关闭地图高度面板");
    closeButton.addEventListener("click", () => panel.remove());

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "地图高度增加 100% 并收起页眉";
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => toggleMapHeight(button));

    const status = document.createElement("span");
    status.className = "weather-map-height-status";
    status.textContent = "适用于实况互动地图";

    panel.append(closeButton, button, status);
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    panel.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button")) return;
      const rect = panel.getBoundingClientRect();
      dragOffsetX = event.clientX - rect.left;
      dragOffsetY = event.clientY - rect.top;
      panel.classList.add("is-dragging");
      panel.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    panel.addEventListener("pointermove", (event) => {
      if (!panel.hasPointerCapture(event.pointerId)) return;
      const maxLeft = Math.max(0, window.innerWidth - panel.offsetWidth);
      const maxTop = Math.max(0, window.innerHeight - panel.offsetHeight);
      panel.style.left = `${Math.min(maxLeft, Math.max(0, event.clientX - dragOffsetX))}px`;
      panel.style.top = `${Math.min(maxTop, Math.max(0, event.clientY - dragOffsetY))}px`;
    });

    const finishDragging = (event) => {
      if (panel.hasPointerCapture(event.pointerId)) panel.releasePointerCapture(event.pointerId);
      panel.classList.remove("is-dragging");
    };
    panel.addEventListener("pointerup", finishDragging);
    panel.addEventListener("pointercancel", finishDragging);

    document.body.append(panel);
  }

  function togglePanel() {
    let panel = document.getElementById(PANEL_ID);
    if (!panel) {
      addPanel();
      panel = document.getElementById(PANEL_ID);
    }
    if (panel) panel.classList.toggle(PANEL_HIDDEN_CLASS);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "toggle-weather-map-panel") togglePanel();
  });

  function start() {
    addPanel();
    if (!document.querySelector(MAP_SELECTOR) && !resizeObserver) {
      resizeObserver = new MutationObserver(() => {
        if (document.querySelector(MAP_SELECTOR)) {
          addPanel();
          resizeObserver.disconnect();
          resizeObserver = undefined;
        }
      });
      resizeObserver.observe(document.documentElement, { childList: true, subtree: true });
    }
  }

  start();
  // Some pages create the map after their initial content scripts run.
  if (!document.body) document.addEventListener("DOMContentLoaded", start, { once: true });
})();
