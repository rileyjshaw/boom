(function () {
  // Update the action icon to reflect `isActive` status.
  function setIcon (isActive) {
    var file = 'icon38' + (isActive ? '-active' : '') + '.png';
    chrome.browserAction.setIcon({path: chrome.extension.getURL(file)});
  }

  // State.
  var activeTabId;

  // Get the active tabId, save it, and initialize the extension.
  chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    // Set the current active tab.
    activeTabId = tabs[0] && tabs[0].id;

    // Attach event listeners.
    // Dispatch browser actions to the active tab.
    chrome.browserAction.onClicked.addListener(function () {
      chrome.tabs.sendMessage(activeTabId, false);
    });
    // When the active tab switches, disable extension for the previous tab.
    chrome.tabs.onActivated.addListener(function (newTab) {
      if (typeof activeTabId === 'number') {
        chrome.tabs.sendMessage(activeTabId, true);
      }
      activeTabId = newTab.tabId;
    });
    // Listen for messages from the current tab to update the action icon.
    chrome.runtime.onMessage.addListener(function (isActive, sender, _b) {
      if (sender.tab) setIcon(isActive);
    });
  });
})();
