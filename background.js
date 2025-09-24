const COLORS = {
  yellow: "Yellow",
  green: "Green",
  pink: "Pink",
  cyan: "Cyan",
};

chrome.runtime.onInstalled.addListener(() => {
  // Parent menu item
  chrome.contextMenus.create({
    id: "glow-markr-parent",
    title: "GlowMarkr",
    contexts: ["selection"],
  });

  // Color options
  for (const [key, value] of Object.entries(COLORS)) {
    chrome.contextMenus.create({
      id: `mark-${key}`,
      parentId: "glow-markr-parent",
      title: value,
      contexts: ["selection"],
    });
  }

  // Separator
  chrome.contextMenus.create({
    id: "separator",
    parentId: "glow-markr-parent",
    type: "separator",
    contexts: ["selection"],
  });

  // Unmark option
  chrome.contextMenus.create({
    id: "unmark",
    parentId: "glow-markr-parent",
    title: "Unmark",
    contexts: ["selection"],
  });
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
