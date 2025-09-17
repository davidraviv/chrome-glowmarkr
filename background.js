chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "highlight",
    title: "GlowMarkr",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "highlight") {
    const url = tab.url;
    chrome.storage.local.get([url], (result) => {
      const highlights = result[url] || [];
      highlights.push(info.selectionText);
      chrome.storage.local.set({ [url]: highlights }, () => {
        chrome.tabs.sendMessage(tab.id, {
          action: "highlight",
          text: info.selectionText,
        });
      });
    });
  }
});
