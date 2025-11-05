// Add styles for the highlights
const COLORS = {
  yellow: '#fffb87',
  green: '#a1ffb3',
  pink: '#ffb3f5',
  cyan: '#abfffb',
};

const style = document.createElement('style');
style.textContent = `
/* --- GlowMarkr Styles --- */

/* Main highlight styles */
.glowmarkr-highlight {
  padding: 2px 0;
  border-radius: 3px;
  position: relative;
}
.glowmarkr-yellow { background-color: #fffb87; }
.glowmarkr-green { background-color: #a1ffb3; }
.glowmarkr-pink { background-color: #ffb3f5; }
.glowmarkr-cyan { background-color: #abfffb; }

.glowmarkr-comment-icon {
  cursor: pointer;
  margin-left: 5px;
  font-style: normal;
}

/* --- Comment Popup --- */

/* Full-screen overlay container */
.glowmarkr-popup-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.4);
}

/* View-only comment popup container */
.glowmarkr-view-popup-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: transparent;
  pointer-events: none; /* Allow clicks to pass through the container */
}

.glowmarkr-view-popup-container .glowmarkr-popup {
  pointer-events: auto; /* But not through the popup itself */
}

.glowmarkr-popup-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #888;
}

.glowmarkr-popup-close:hover {
  color: #000;
}

.glowmarkr-popup-comment-display {
  white-space: pre-wrap; /* Respects newlines and spaces */
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 15px; /* For scrollbar */
}

/* The popup dialog itself */
.glowmarkr-popup {
  width: 320px;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  transition: background-color 0.3s, color 0.3s;
  cursor: grab;
}

/* Text area for the comment */
.glowmarkr-popup textarea {
  width: 100%;
  height: 120px;
  margin-bottom: 16px;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  box-sizing: border-box; /* Ensures padding doesn't affect width */
  transition: border-color 0.3s, background-color 0.3s, color 0.3s;
}

.glowmarkr-popup textarea:focus {
  outline: none;
  border-width: 2px;
  padding: 9px; /* Adjust padding to keep size consistent */
}

/* Container for the buttons */
.glowmarkr-popup-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* General button styles */
.glowmarkr-popup button {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.glowmarkr-popup button:active {
  transform: scale(0.97);
}

/* --- Light Theme (Default) --- */
.glowmarkr-popup {
  background-color: #ffffff;
  color: #222222;
  border: 1px solid #e0e0e0;
}
.glowmarkr-popup textarea {
  background-color: #f9f9f9;
  color: #222222;
  border: 1px solid #dcdcdc;
}
.glowmarkr-popup textarea:focus {
  border-color: #007aff;
}
.glowmarkr-popup-save {
  background-color: #007aff;
  color: white;
}
.glowmarkr-popup-save:hover {
  background-color: #0056b3;
}
.glowmarkr-popup-cancel {
  background-color: #e9e9e9;
  color: #333333;
}
.glowmarkr-popup-cancel:hover {
  background-color: #dcdcdc;
}

/* --- Dark Theme --- */
@media (prefers-color-scheme: dark) {
  .glowmarkr-popup {
    background-color: #2d2d2d;
    color: #f0f0f0;
    border: 1px solid #444444;
  }
  .glowmarkr-popup textarea {
    background-color: #3a3a3a;
    color: #f0f0f0;
    border: 1px solid #555555;
  }
  .glowmarkr-popup textarea:focus {
    border-color: #0a84ff;
  }
  .glowmarkr-popup-save {
    background-color: #0a84ff;
    color: white;
  }
  .glowmarkr-popup-save:hover {
    background-color: #0060df;
  }
  .glowmarkr-popup-cancel {
    background-color: #555555;
    color: #f0f0f0;
  }
  .glowmarkr-popup-cancel:hover {
    background-color: #6a6a6a;
  }
}
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

function highlightHtml(id, html, text, contextBefore, contextAfter, color = 'yellow', comment) {
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
  
  // Escape special characters for regex, and replace whitespace with \s+
  const escapedText = text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const textAsRegex = new RegExp(escapedText.replace(/\s+/g, '\\s+'), 'g');

  let match;
  while ((match = textAsRegex.exec(fullText)) !== null) {
    const index = match.index;
    const matchedText = match[0];

    const textBefore = fullText.substring(0, index).trim().split(/\s+/).slice(-5).join(' ');
    const textAfter = fullText.substring(index + matchedText.length).trim().split(/\s+/).slice(0, 5).join(' ');

    if (textBefore.endsWith(contextBefore) && textAfter.startsWith(contextAfter)) {
      const { startNodeInfo, endNodeInfo } = findSelectionNodes(textNodes, matchedText, index);

      if (startNodeInfo && endNodeInfo) {
        const range = document.createRange();
        range.setStart(startNodeInfo.node, startNodeInfo.offset);
        range.setEnd(endNodeInfo.node, endNodeInfo.offset);

        let parent = range.commonAncestorContainer;
        if (parent.nodeType !== Node.ELEMENT_NODE) {
          parent = parent.parentElement;
        }
        if (parent.closest('.glowmarkr-highlight')) {
          continue;
        }

        const span = createHighlightSpan(id, color, parent);
        span.innerHTML = html;

        range.deleteContents();
        range.insertNode(span);

        if (comment) {
          addCommentIcon(span, comment);
        }

        console.log("GlowMarkr: Match found and highlight applied!");
        return;
      }
    }
  }

  console.log(`GlowMarkr: No matches found for the highlight. id=${id}`);
}

function runHighlighting() {
  // Disconnect the observer while we modify the DOM to avoid a feedback loop.
  observer.disconnect();

  console.log("GlowMarkr: Running highlight check.");
  const url = window.location.href;
  chrome.storage.local.get([url], (result) => {
    const highlights = result[url] || [];
    console.log(`GlowMarkr: Found ${highlights.length} highlights for this page.`);
    for (const highlight of highlights) {
      if (document.querySelector(`.glowmarkr-highlight[data-glowmarkr-id="${highlight.id}"]`)) {
        continue;
      }
      highlightHtml(highlight.id, highlight.html, highlight.text, highlight.contextBefore, highlight.contextAfter, highlight.color, highlight.comment);
    }

    // After we're done, start observing again.
    observer.observe(document.body, { childList: true, subtree: true });
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
        comment: "",
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
          const commentIcon = parent.querySelector(`.glowmarkr-comment-icon[data-glowmarkr-id="${highlightId}"]`);
          if (commentIcon) {
            commentIcon.remove();
          }
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

function addCommentIcon(highlightSpan, comment) {
  const highlightId = highlightSpan.dataset.glowmarkrId;
  let icon = document.querySelector(`.glowmarkr-comment-icon[data-glowmarkr-id="${highlightId}"]`);
  if (!icon) {
    icon = document.createElement("span");
    icon.className = "glowmarkr-comment-icon";
    icon.dataset.glowmarkrId = highlightId;
    icon.textContent = "📝";
    highlightSpan.insertAdjacentElement("afterend", icon);
  }
  
  // Remove the old title-based hover effect
  icon.title = '';

  // Add a click listener to show the popup
  icon.onclick = (e) => {
    e.stopPropagation();
    showViewCommentPopup(comment);
  };
}

function showCommentPopup(highlightSpan) {
  const highlightId = highlightSpan.dataset.glowmarkrId;
  const url = window.location.href;

  chrome.storage.local.get([url], (result) => {
    const highlights = result[url] || [];
    const highlight = highlights.find(h => h.id === highlightId);
    const currentComment = highlight ? highlight.comment : "";

    const container = document.createElement("div");
    container.className = "glowmarkr-popup-container";

    const popup = document.createElement("div");
    popup.className = "glowmarkr-popup";
    popup.style.position = 'absolute'; // Allow positioning with top/left

    const textarea = document.createElement("textarea");
    textarea.maxLength = 500;
    textarea.value = currentComment;
    textarea.placeholder = "Enter your comment (max 500 chars)";

    const saveButton = document.createElement("button");
    saveButton.textContent = "Save";
    saveButton.className = "glowmarkr-popup-save";
    saveButton.onclick = () => {
      saveComment(highlightId, textarea.value);
      container.remove();
    };

    const cancelButton = document.createElement("button");
    cancelButton.textContent = "Cancel";
    cancelButton.className = "glowmarkr-popup-cancel";
    cancelButton.onclick = () => container.remove();

    const actions = document.createElement("div");
    actions.className = "glowmarkr-popup-actions";
    actions.appendChild(cancelButton);
    actions.appendChild(saveButton);

    popup.appendChild(textarea);
    popup.appendChild(actions);
    container.appendChild(popup);
    document.body.appendChild(container);

    // Make the popup draggable
    let isDragging = false;
    let offsetX, offsetY;

    popup.addEventListener('mousedown', (e) => {
      if (e.target === textarea || e.target === saveButton || e.target === cancelButton) {
        return; // Don't drag if clicking on textarea or buttons
      }
      isDragging = true;
      offsetX = e.clientX - popup.getBoundingClientRect().left;
      offsetY = e.clientY - popup.getBoundingClientRect().top;
      popup.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      popup.style.left = (e.clientX - offsetX) + 'px';
      popup.style.top = (e.clientY - offsetY) + 'px';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      popup.style.cursor = 'grab';
    });
  });
}

function showViewCommentPopup(comment) {
  // Create a container for the popup
  const container = document.createElement("div");
  container.className = "glowmarkr-view-popup-container";

  // Create the popup itself
  const popup = document.createElement("div");
  popup.className = "glowmarkr-popup";
  popup.style.position = 'absolute'; // Needed for dragging

  // Create a close button
  const closeButton = document.createElement("button");
  closeButton.className = "glowmarkr-popup-close";
  closeButton.innerHTML = "&times;";
  closeButton.onclick = () => container.remove();

  // Create the comment display area
  const commentDisplay = document.createElement("p");
  commentDisplay.className = "glowmarkr-popup-comment-display";
  commentDisplay.textContent = comment;

  // Assemble the popup
  popup.appendChild(closeButton);
  popup.appendChild(commentDisplay);
  container.appendChild(popup);
  document.body.appendChild(container);

  // Close popup on Escape key
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      container.remove();
      document.removeEventListener('keydown', handleKeyDown);
    }
  };
  document.addEventListener('keydown', handleKeyDown);

  // Make the popup draggable
  let isDragging = false;
  let offsetX, offsetY;

  popup.addEventListener('mousedown', (e) => {
    // Prevent dragging when clicking on the close button or scrollbar
    if (e.target === closeButton || e.target === commentDisplay && commentDisplay.scrollHeight > commentDisplay.clientHeight) {
      return;
    }
    isDragging = true;
    const rect = popup.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    popup.style.cursor = 'grabbing';
    // Set a fixed position when dragging starts
    popup.style.left = rect.left + 'px';
    popup.style.top = rect.top + 'px';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent text selection while dragging
    popup.style.left = (e.clientX - offsetX) + 'px';
    popup.style.top = (e.clientY - offsetY) + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      popup.style.cursor = 'grab';
    }
  });
}

function saveComment(highlightId, comment) {
  const url = window.location.href;
  chrome.storage.local.get([url], (result) => {
    const highlights = result[url] || [];
    const highlightIndex = highlights.findIndex(h => h.id === highlightId);
    if (highlightIndex > -1) {
      highlights[highlightIndex].comment = comment;
      chrome.storage.local.set({ [url]: highlights }, () => {
        const highlightSpan = document.querySelector(`.glowmarkr-highlight[data-glowmarkr-id="${highlightId}"]`);
        if (highlightSpan) {
          addCommentIcon(highlightSpan, comment);
        }
        console.log("GlowMarkr: Comment saved.");
      });
    }
  });
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
  } else if (request.action === "comment") {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      let container = selection.getRangeAt(0).commonAncestorContainer;
      if (container.nodeType !== Node.ELEMENT_NODE) {
        container = container.parentElement;
      }
      const highlightSpan = container.closest('.glowmarkr-highlight');
      if (highlightSpan) {
        showCommentPopup(highlightSpan);
      }
    }
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
