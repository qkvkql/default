/**
 * background.js — Service Worker
 *
 * Receives conversion notifications from content.js and flashes the badge.
 * No offscreen document needed — conversion now happens synchronously in
 * injected.js / content.js before the clipboard is written.
 */

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== 'COORD_CONVERTED') return;

  chrome.action.setBadgeBackgroundColor({ color: '#00BCD4' });
  chrome.action.setBadgeText({ text: '✓' });
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 1500);
});
