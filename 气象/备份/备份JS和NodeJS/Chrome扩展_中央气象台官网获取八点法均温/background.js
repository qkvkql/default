// Background service worker for NMC 8-Point Average Temperature Extension

chrome.action.onClicked.addListener(async () => {
  await openOrFocusConsole();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "OPEN_CONSOLE") {
    openOrFocusConsole().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === "NMC_CLOSE_TAB") {
    const tabId = sender.tab ? sender.tab.id : message.tabId;
    if (tabId) {
      chrome.tabs.remove(tabId).catch(() => {});
    }
    sendResponse({ success: true });
    return true;
  }
});

async function openOrFocusConsole() {
  const consoleUrl = chrome.runtime.getURL("console.html");
  try {
    const tabs = await chrome.tabs.query({});
    const existingTab = tabs.find((t) => t.url && t.url.startsWith(consoleUrl));
    if (existingTab && existingTab.id) {
      await chrome.tabs.update(existingTab.id, { active: true });
      if (existingTab.windowId) {
        await chrome.windows.update(existingTab.windowId, { focused: true });
      }
    } else {
      await chrome.tabs.create({ url: consoleUrl });
    }
  } catch (error) {
    console.error("Error opening console page:", error);
    await chrome.tabs.create({ url: consoleUrl });
  }
}
