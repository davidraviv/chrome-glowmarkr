# GlowMarkr Chrome Extension

## Project Overview

This project is a Chrome extension called **GlowMarkr**. It allows users to highlight text on any webpage and have those highlights persist. When the user revisits a page, the extension automatically re-applies the saved highlights.

The extension is built with plain JavaScript and utilizes Chrome's extension APIs. The core functionality is split between two main scripts:

*   `background.js`: This script runs in the background and creates the "GlowMarkr" context menu item. When the user clicks this item, it sends a message to the content script of the active tab.
*   `content.js`: This script is injected into every webpage the user visits. It has two primary responsibilities:
    1.  It listens for a message from `background.js` which is triggered by the "GlowMarkr" context menu. The script then determines if the user's selection is already highlighted.
        *   **If the selection is not highlighted (Mark):** It captures the selected text's HTML, plain text, and the surrounding context. This data is stored in `chrome.storage.local` with a unique ID. The script then wraps the selection in a `<span>` with a custom class and a data attribute for the ID to apply the highlight.
        *   **If the selection is already highlighted (Unmark):** It removes the highlight from the page and deletes the corresponding highlight data from `chrome.storage.local` using the unique ID.
    2.  It uses a `MutationObserver` to monitor the page for content changes. When changes are detected (e.g., on initial load or when a dynamic web application updates its view), it checks `chrome.storage.local` for any saved highlights for the current URL. For each highlight, it uses the stored text and context to accurately locate and re-apply the highlight. This makes the extension compatible with both static pages and modern, dynamic web applications.

## Building and Running

There is no build process for this extension. To run it, you need to load it as an unpacked extension in Google Chrome:

1.  Open Google Chrome and navigate to `chrome://extensions`.
2.  Enable "Developer mode" in the top right corner.
3.  Click on the "Load unpacked" button.
4.  Select the directory where you have cloned this repository.

The extension should now be installed and active.

## Development Conventions

*   The project is written in plain JavaScript.
*   There are no automated tests, linters, or formatters configured.
*   The `spec.md` file contains the project specification, which outlines the features for the current MVP and future versions.

## Performance Considerations

The process of searching for and re-applying highlights can be resource-intensive. To handle dynamic content from modern web frameworks and to avoid performance issues, the extension uses a `MutationObserver` to trigger re-highlighting when the page DOM changes. This process is "debounced," meaning the highlighting function waits for a brief quiet period before running. This ensures a responsive user experience by preventing the script from running excessively on pages with frequent, minor DOM updates.