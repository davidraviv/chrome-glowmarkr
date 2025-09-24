// Add styles for the highlights
const COLORS = {
  yellow: '#fffb87',
  green: '#a1ffb3',
  pink: '#ffb3f5',
  cyan: '#abfffb',
};

const style = document.createElement('style');
const colorStyles = Object.entries(COLORS)
  .map(([name, color]) => `.glowmarkr-${name} { background-color: ${color}; }`)
  .join('\n');

style.textContent = `
  .glowmarkr-highlight {
    padding: 2px 0;
    border-radius: 3px;
  }
  ${colorStyles}
`;
document.head.appendChild(style);


function getBrightness(color) {
  if (!color || color === 'transparent') return 'light';
  const rgb = color.match(/\d+/g);
  if (!rgb) return 'light';
  // Formula to determine perceived brightness
  const yiq = ((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) + (parseInt(rgb[2]) * 114)) / 1000;
  return (yiq >= 128) ? 'light' : 'dark';
}

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

function createHighlightSpan(id, color, parentElement) {
  const computedStyle = window.getComputedStyle(parentElement);
  const backgroundColor = computedStyle.backgroundColor;
  const brightness = getBrightness(backgroundColor);

  const span = document.createElement("span");
  span.className = `glowmarkr-highlight glowmarkr-${color}`;
  span.dataset.glowmarkrId = id;

  if (brightness === 'dark') {
    span.style.color = "black";
  }

  return span;
}

function findSelectionNodes(textNodes, text, startIndex) {
  let runningLength = 0;
  let startNodeInfo, endNodeInfo;

  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];
    const nodeLength = node.nodeValue.length;
    const nodeStart = runningLength;
    const nodeEnd = runningLength + nodeLength;

    if (!startNodeInfo && startIndex >= nodeStart && startIndex < nodeEnd) {
      startNodeInfo = { node: node, offset: startIndex - nodeStart };
    }

    if (!endNodeInfo && (startIndex + text.length - 1) >= nodeStart && (startIndex + text.length - 1) < nodeEnd) {
      endNodeInfo = { node: node, offset: (startIndex + text.length) - nodeStart };
    }

    runningLength += nodeLength;
    if (startNodeInfo && endNodeInfo) break;
  }
  return { startNodeInfo, endNodeInfo };
}

function highlightHtml(id, html, text, contextBefore, contextAfter, color = 'yellow') {
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
      const { startNodeInfo, endNodeInfo } = findSelectionNodes(textNodes, text, index);

      if (startNodeInfo && endNodeInfo) {
        const range = document.createRange();
        range.setStart(startNodeInfo.node, startNodeInfo.offset);
        range.setEnd(endNodeInfo.node, endNodeInfo.offset);

        let parent = range.commonAncestorContainer;
        if (parent.nodeType !== Node.ELEMENT_NODE) {
          parent = parent.parentElement;
        }
        if (parent.closest('.glowmarkr-highlight')) {
          startIndex = index + 1;
          continue;
        }

        const span = createHighlightSpan(id, color, parent);
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
      highlightHtml(highlight.id, highlight.html, highlight.text, highlight.contextBefore, highlight.contextAfter, highlight.color);
    }
  });
}

function markSelection(color) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const selectedHtml = getHtmlOfSelection();
    const selectedText = selection.toString();

    if (selectedHtml && selectedText) {
      const { contextBefore, contextAfter } = getContext(range);
      const url = window.location.href;
      const highlightId = Date.now().toString();

      const newHighlight = {
        id: highlightId,
        html: selectedHtml,
        text: selectedText,
        contextBefore,
        contextAfter,
        color: color,
      };

      chrome.storage.local.get([url], (result) => {
        const highlights = result[url] || [];
        highlights.push(newHighlight);
        chrome.storage.local.set({ [url]: highlights }, () => {
          let parentElement = range.commonAncestorContainer;
          if (parentElement.nodeType !== Node.ELEMENT_NODE) {
            parentElement = parentElement.parentElement;
          }

          const span = createHighlightSpan(highlightId, color, parentElement);

          span.appendChild(range.extractContents());
          range.insertNode(span);
          console.log("GlowMarkr: Highlight added.");
        });
      });
    }
  }
}

function unmarkSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    let container = range.commonAncestorContainer;
    if (container.nodeType !== Node.ELEMENT_NODE) {
      container = container.parentElement;
    }
    const highlightSpan = container.closest('.glowmarkr-highlight');

    if (highlightSpan) {
      const highlightId = highlightSpan.dataset.glowmarkrId;
      const url = window.location.href;

      chrome.storage.local.get([url], (result) => {
        let highlights = result[url] || [];
        highlights = highlights.filter(h => h.id !== highlightId);

        const callback = () => {
          const parent = highlightSpan.parentNode;
          parent.replaceChild(document.createRange().createContextualFragment(highlightSpan.innerHTML), highlightSpan);
          parent.normalize();
          console.log("GlowMarkr: Highlight removed.");
        };

        if (highlights.length === 0) {
          chrome.storage.local.remove(url, callback);
        } else {
          chrome.storage.local.set({ [url]: highlights }, callback);
        }
      });
    }
  }
}

document.addEventListener('contextmenu', (event) => {
  const target = event.target;
  const isHighlighted = target.matches('.glowmarkr-highlight') || target.closest('.glowmarkr-highlight');

  chrome.runtime.sendMessage({
    type: 'updateContextMenu',
    isHighlighted: !!isHighlighted
  });
}, true);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("GlowMarkr: Received message from background script:", request);
  if (request.action === "mark") {
    markSelection(request.color);
  } else if (request.action === "unmark") {
    unmarkSelection();
  }
});

let debounceTimer;
function debouncedRunHighlighting() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runHighlighting();
  }, 500);
}

const observer = new MutationObserver(() => {
  debouncedRunHighlighting();
});

function startObserver() {
  observer.observe(document.body, { childList: true, subtree: true });
  debouncedRunHighlighting(); // Initial run
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startObserver);
} else {
  startObserver();
}
