chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "highlight",
    title: "GlowMarkr",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "highlight") {
    chrome.tabs.sendMessage(tab.id, { action: "highlight-selection" })
      .catch(error => {
        // This error is expected if the content script is not on the page
        if (error.message.includes("Could not establish connection")) {
          console.log("GlowMarkr: Content script not available on this page.");
        } else {
          console.error(error);
        }
      });
  }
});
