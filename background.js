chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "highlight",
    title: "GlowMarkr",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "highlight") {
    chrome.tabs.sendMessage(tab.id, {
      action: "highlight-selection",
    });
  }
});
