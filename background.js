const COLORS = {
  yellow: "🟡 Yellow",
  green: "🟢 Green",
  pink: "🌸 Pink",
  cyan: "🔵 Cyan",
};

function createOrUpdateMenus(isHighlighted = false) {
  chrome.contextMenus.removeAll(() => {
    for (const [key, value] of Object.entries(COLORS)) {
      const id = `mark-${key}`;
      chrome.contextMenus.create({
        id: id,
        title: value,
        contexts: ["selection"],
        visible: !isHighlighted,
      });
    }

    chrome.contextMenus.create({
      id: "unmark",
      title: "Unmark",
      contexts: ["selection"],
      visible: isHighlighted,
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createOrUpdateMenus();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateContextMenu") {
    createOrUpdateMenus(message.isHighlighted);
  }
});

function handleSendMessageError(error) {
  if (error.message.includes("Could not establish connection")) {
    console.log("GlowMarkr: Content script not available on this page.");
  } else {
    console.error(error);
  }
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const [action, color] = info.menuItemId.split("-");

  if (action === "mark") {
    chrome.tabs.sendMessage(tab.id, { action: "mark", color: color })
      .catch(handleSendMessageError);
  } else if (info.menuItemId === "unmark") {
    chrome.tabs.sendMessage(tab.id, { action: "unmark" })
      .catch(handleSendMessageError);
  }
});