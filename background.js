const COLORS = {
  yellow: "🟡 Yellow",
  green: "🟢 Green",
  pink: "🌸 Pink",
  cyan: "🔵 Cyan",
};

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    for (const [key, value] of Object.entries(COLORS)) {
      const id = `mark-${key}`;
      chrome.contextMenus.create({
        id: id,
        title: value,
        contexts: ["selection"],
        visible: true,
      });
    }

    chrome.contextMenus.create({
      id: "unmark",
      title: "Unmark",
      contexts: ["selection"],
      visible: false,
    });

    chrome.contextMenus.create({
      id: "comment",
      title: "Comment 📝",
      contexts: ["selection"],
      visible: false,
    });
  });
}

function updateContextMenu(isHighlighted) {
  for (const key of Object.keys(COLORS)) {
    chrome.contextMenus.update(`mark-${key}`, { visible: !isHighlighted });
  }
  chrome.contextMenus.update("unmark", { visible: isHighlighted });
  chrome.contextMenus.update("comment", { visible: isHighlighted });
}

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateContextMenu") {
    updateContextMenu(message.isHighlighted);
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
  } else if (info.menuItemId === "comment") {
    chrome.tabs.sendMessage(tab.id, { action: "comment" })
      .catch(handleSendMessageError);
  }
});