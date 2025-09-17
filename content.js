function getHtmlOfSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const div = document.createElement("div");
    div.appendChild(range.cloneContents());
    return div.innerHTML;
  }
  return null;
}

function highlightHtml(html) {
  console.log("GlowMarkr: Attempting to highlight:", html);
  const originalHTML = document.body.innerHTML;
  const highlightedHtml = `<span style="background-color: yellow;">${html}</span>`;
  const newHTML = originalHTML.replace(html, highlightedHtml);

  if (originalHTML === newHTML) {
    console.log("GlowMarkr: No matches found for the html. Highlighting failed.");
  } else {
    console.log("GlowMarkr: Match found! Applying highlight.");
    document.body.innerHTML = newHTML;
  }
}

window.addEventListener('load', () => {
  console.log("GlowMarkr: Page loaded. Checking for saved highlights.");
  const url = window.location.href;
  chrome.storage.local.get([url], (result) => {
    const highlights = result[url] || [];
    console.log(`GlowMarkr: Found ${highlights.length} highlights for this page.`);
    for (const html of highlights) {
      highlightHtml(html);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("GlowMarkr: Received message from background script:", request);
  if (request.action === "highlight-selection") {
    const selectedHtml = getHtmlOfSelection();
    if (selectedHtml) {
      const url = window.location.href;
      chrome.storage.local.get([url], (result) => {
        const highlights = result[url] || [];
        highlights.push(selectedHtml);
        chrome.storage.local.set({ [url]: highlights }, () => {
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = document.createElement("span");
            span.style.backgroundColor = "yellow";
            span.appendChild(range.extractContents());
            range.insertNode(span);
          }
        });
      });
    }
  }
  return true;
});
