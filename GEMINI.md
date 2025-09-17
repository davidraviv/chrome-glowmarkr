# GlowMarkr Chrome Extension

## Project Overview

This project is a Chrome extension called **GlowMarkr**. It allows users to highlight text on any webpage and have those highlights persist. When the user revisits a page, the extension automatically re-applies the saved highlights.

The extension is built with plain JavaScript and utilizes Chrome's extension APIs. The core functionality is split between two main scripts:

*   `background.js`: This script runs in the background and creates the "GlowMarkr" context menu item. When the user clicks this item, it sends a message to the content script of the active tab to initiate the highlighting process.
*   `content.js`: This script is injected into every webpage the user visits. It has two primary responsibilities:
    1.  When it receives a message from `background.js`, it captures the selected text's HTML, plain text, and the surrounding context (five words before and after). This data is stored in `chrome.storage.local` to ensure the highlight can be reliably found later. The script then wraps the selection in a `<span>` to apply the highlight.
    2.  When a page is loaded, it checks `chrome.storage.local` for any saved highlights for the current URL. For each highlight, it uses the stored text and context to accurately locate and re-apply the highlight. This method is robust and can handle highlights that span across multiple HTML elements with complex formatting.

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

The process of searching for and re-applying highlights can be resource-intensive, especially on very long pages. To ensure a smooth user experience, the re-highlighting process is deferred using `requestIdleCallback`. This means the highlighting only happens when the browser is idle, preventing any impact on page load times or responsiveness.