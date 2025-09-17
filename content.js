function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\\]/g, '\$&'); // $& means the whole matched string
}

function highlightText(text) {
  console.log("GlowMarkr: Attempting to highlight:", text);
  const originalHTML = document.body.innerHTML;
  const regex = new RegExp(escapeRegExp(text), 'g');
  const newHTML = originalHTML.replace(
    regex,
    (match) => `<span style="background-color: yellow;">${match}</span>`
  );

  if (originalHTML === newHTML) {
    console.log("GlowMarkr: No matches found for the text. Highlighting failed.");
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
    for (const text of highlights) {
      highlightText(text);
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("GlowMarkr: Received message from background script:", request);
  if (request.action === "highlight") {
    highlightText(request.text);
  }
  return true;
});