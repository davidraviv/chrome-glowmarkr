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

function highlightHtml(id, html, text, contextBefore, contextAfter) {
  console.log("GlowMarkr: Attempting to highlight:", text);

  const treeWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  let currentNode;
  while (currentNode = treeWalker.nextNode()) {
    if (currentNode.parentElement.tagName !== 'SCRIPT' && currentNode.parentElement.tagName !== 'STYLE' && currentNode.parentElement.tagName !== 'HEAD' && currentNode.parentElement.tagName !== 'TITLE' && currentNode.parentElement.tagName !== 'META') {
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

        // Check if this content is already highlighted by checking for a parent highlight span
        let parent = range.commonAncestorContainer;
        if (parent.nodeType !== Node.ELEMENT_NODE) {
            parent = parent.parentElement;
        }
        if (parent.closest('.glowmarkr-highlight')) {
            startIndex = index + 1;
            continue; // Already highlighted, skip to next match
        }

        const span = document.createElement("span");
        span.style.backgroundColor = "yellow";
        span.className = "glowmarkr-highlight";
        span.dataset.glowmarkrId = id;
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
      highlightHtml(highlight.id, highlight.html, highlight.text, highlight.contextBefore, highlight.contextAfter);
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

      let container = range.commonAncestorContainer;
      if (container.nodeType !== Node.ELEMENT_NODE) {
        container = container.parentElement;
      }
      const highlightSpan = container.closest('.glowmarkr-highlight');

      if (highlightSpan) {
        // This is an unmark action
        const highlightId = highlightSpan.dataset.glowmarkrId;
        const url = window.location.href;

        chrome.storage.local.get([url], (result) => {
          let highlights = result[url] || [];
          highlights = highlights.filter(h => h.id !== highlightId);

          if (highlights.length === 0) {
            chrome.storage.local.remove(url, () => {
              const parent = highlightSpan.parentNode;
              parent.replaceChild(document.createRange().createContextualFragment(highlightSpan.innerHTML), highlightSpan);
              parent.normalize();
              console.log("GlowMarkr: Last highlight removed, cleaning up storage for this URL.");
            });
          } else {
            chrome.storage.local.set({ [url]: highlights }, () => {
              const parent = highlightSpan.parentNode;
              parent.replaceChild(document.createRange().createContextualFragment(highlightSpan.innerHTML), highlightSpan);
              parent.normalize();
              console.log("GlowMarkr: Highlight removed.");
            });
          }
        });

      } else if (selectedHtml && selectedText) {
        // This is a mark action
        const { contextBefore, contextAfter } = getContext(range);
        const url = window.location.href;
        const highlightId = Date.now().toString();

        const newHighlight = {
          id: highlightId,
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
            span.className = "glowmarkr-highlight";
            span.dataset.glowmarkrId = highlightId;
            span.appendChild(range.extractContents());
            range.insertNode(span);
            console.log("GlowMarkr: Highlight added.");
          });
        });
      }
    }
  }
  return true;
});
