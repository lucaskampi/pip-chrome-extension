chrome.commands.onCommand.addListener(async (command) => {
  if (command === '_execute_action') {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (tabs && tabs[0] && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'trigger-pip'});
    }
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab && tab.id) {
    chrome.tabs.sendMessage(tab.id, {action: 'trigger-pip'});
  }
});
