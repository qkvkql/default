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
});

