chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;

  chrome.tabs.sendMessage(tab.id, { type: "toggle-weather-map-panel" }).catch(() => {
    // The active tab may not match this extension's supported pages.
  });
});
