async function getActiveTabId() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tabs && tabs[0] && tabs[0].id;
  return typeof tabId === 'number' ? tabId : null;
}

async function ensureInjected(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content.js'],
  });
}

async function triggerPiPOnTab(tabId) {
  try {
    await ensureInjected(tabId);
  } catch (e) {
    // If injection fails (e.g., Chrome Web Store pages / restricted schemes), surface a useful error.
    throw new Error(e && e.message ? e.message : 'Failed to inject content script');
  }

  // Ask the injected content script to trigger PiP for the first video.
  return await chrome.tabs.sendMessage(tabId, { action: 'trigger-pip' });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.action === 'trigger-pip-active-tab') {
    (async () => {
      try {
        const tabId = await getActiveTabId();
        if (!tabId) {
          sendResponse({ success: false, error: 'no-active-tab' });
          return;
        }
        const resp = await triggerPiPOnTab(tabId);
        sendResponse(resp && typeof resp === 'object' ? resp : { success: true });
      } catch (e) {
        sendResponse({ success: false, error: e && e.message ? e.message : String(e) });
      }
    })();
    return true; // async response
  }
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== '_execute_action') return;
  try {
    const tabId = await getActiveTabId();
    if (!tabId) return;
    await triggerPiPOnTab(tabId);
  } catch (e) {
    // Commands are fire-and-forget; nothing to display here.
  }
});
