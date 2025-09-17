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

function getContext(range) {
  const preSelectionRange = document.createRange();
  preSelectionRange.setStart(document.body, 0);
  preSelectionRange.setEnd(range.startContainer, range.startOffset);

  const postSelectionRange = document.createRange();
  postSelectionRange.setStart(range.endContainer, range.endOffset);
  postSelectionRange.setEnd(document.body, document.body.childNodes.length);

  const contextBefore = preSelectionRange.toString().trim().split(/\s+/).slice(-5).join(' ');
  const contextAfter = postSelectionRange.toString().trim().split(/\s+/).slice(0, 5).join(' ');

  return { contextBefore, contextAfter };
}

function highlightHtml(html, text, contextBefore, contextAfter) {
  console.log("GlowMarkr: Attempting to highlight:", text);

  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let currentNode;
  while (currentNode = treeWalker.nextNode()) {
    if (currentNode.parentElement.tagName !== 'SCRIPT' && currentNode.parentElement.tagName !== 'STYLE') {
        textNodes.push(currentNode);
    }
  }

  const fullText = textNodes.map(n => n.nodeValue).join('');
  let startIndex = 0;
  let index;

  while ((index = fullText.indexOf(text, startIndex)) > -1) {
    const textBefore = fullText.substring(0, index).trim().split(/\s+/).slice(-5).join(' ');
    const textAfter = fullText.substring(index + text.length).trim().split(/\s+/).slice(0, 5).join(' ');

    if (textBefore.endsWith(contextBefore) && textAfter.startsWith(contextAfter)) {
      let runningLength = 0;
      let startNodeInfo, endNodeInfo;

      for (let i = 0; i < textNodes.length; i++) {
          const node = textNodes[i];
          const nodeLength = node.nodeValue.length;
          const nodeStart = runningLength;
          const nodeEnd = runningLength + nodeLength;

          if (!startNodeInfo && index >= nodeStart && index < nodeEnd) {
              startNodeInfo = { node: node, offset: index - nodeStart };
          }

          if (!endNodeInfo && (index + text.length -1) >= nodeStart && (index + text.length -1) < nodeEnd) {
              endNodeInfo = { node: node, offset: (index + text.length) - nodeStart };
          }
          
          runningLength += nodeLength;
          if(startNodeInfo && endNodeInfo) break;
      }

      if (startNodeInfo && endNodeInfo) {
        const range = document.createRange();
        range.setStart(startNodeInfo.node, startNodeInfo.offset);
        range.setEnd(endNodeInfo.node, endNodeInfo.offset);

        const span = document.createElement("span");
        span.style.backgroundColor = "yellow";
        span.innerHTML = html;
        range.deleteContents();
        range.insertNode(span);

        console.log("GlowMarkr: Match found and highlight applied!");
        return; 
      }
    }
    startIndex = index + 1; 
  }

  console.log("GlowMarkr: No matches found for the highlight.");
}

function runHighlighting() {
  console.log("GlowMarkr: Running highlight check.");
  const url = window.location.href;
  chrome.storage.local.get([url], (result) => {
    const highlights = result[url] || [];
    console.log(`GlowMarkr: Found ${highlights.length} highlights for this page.`);
    for (const highlight of highlights) {
      highlightHtml(highlight.html, highlight.text, highlight.contextBefore, highlight.contextAfter);
    }
  });
}

window.addEventListener('load', () => {
  console.log("GlowMarkr: Page loaded. Scheduling highlight check.");
  if ('requestIdleCallback' in window) {
    requestIdleCallback(runHighlighting);
  } else {
    setTimeout(runHighlighting, 100);
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("GlowMarkr: Received message from background script:", request);
  if (request.action === "highlight-selection") {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedHtml = getHtmlOfSelection();
      const selectedText = selection.toString();

      if (selectedHtml && selectedText) {
        const { contextBefore, contextAfter } = getContext(range);
        const url = window.location.href;

        const newHighlight = {
          html: selectedHtml,
          text: selectedText,
          contextBefore,
          contextAfter,
        };

        chrome.storage.local.get([url], (result) => {
          const highlights = result[url] || [];
          highlights.push(newHighlight);
          chrome.storage.local.set({ [url]: highlights }, () => {
            const span = document.createElement("span");
            span.style.backgroundColor = "yellow";
            span.appendChild(range.extractContents());
            range.insertNode(span);
          });
        });
      }
    }
  }
  return true;
});