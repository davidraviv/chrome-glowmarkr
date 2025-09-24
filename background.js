const COLORS = {
  yellow: "🟡 Yellow",
  green: "🟢 Green",
  pink: "🌸 Pink",
  cyan: "🔵 Cyan",
};

const MENU_ITEMS = {
  ...Object.fromEntries(
    Object.entries(COLORS).map(([key]) => [`mark-${key}`, { visible: true }])
  ),
  unmark: { visible: false },
};

function createOrUpdateMenus() {
  chrome.contextMenus.removeAll(() => {
    for (const [key, value] of Object.entries(COLORS)) {
      const id = `mark-${key}`;
      chrome.contextMenus.create({
        id: id,
        title: value,
        contexts: ["selection"],
        visible: MENU_ITEMS[id].visible,
      });
    }

    chrome.contextMenus.create({
      id: "unmark",
      title: "Unmark",
      contexts: ["selection"],
      visible: MENU_ITEMS.unmark.visible,
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createOrUpdateMenus();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "updateContextMenu") {
    const isHighlighted = message.isHighlighted;
    for (const key in COLORS) {
      MENU_ITEMS[`mark-${key}`].visible = !isHighlighted;
    }
    MENU_ITEMS.unmark.visible = isHighlighted;
    createOrUpdateMenus();
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const [action, color] = info.menuItemId.split("-");

  if (action === "mark") {
    chrome.tabs.sendMessage(tab.id, { action: "mark", color: color })
      .catch(error => {
        if (error.message.includes("Could not establish connection")) {
          console.log("GlowMarkr: Content script not available on this page.");
        } else {
          console.error(error);
        }
      });
  } else if (info.menuItemId === "unmark") {
    chrome.tabs.sendMessage(tab.id, { action: "unmark" })
      .catch(error => {
        if (error.message.includes("Could not establish connection")) {
          console.log("GlowMarkr: Content script not available on this page.");
        } else {
          console.error(error);
        }
      });
  }
});