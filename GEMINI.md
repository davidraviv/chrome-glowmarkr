# GlowMarkr Chrome Extension

## Project Overview

This project is a Chrome extension called **GlowMarkr**. It allows users to highlight text on any webpage and have those highlights persist. When the user revisits a page, the extension automatically re-applies the saved highlights.

The extension is built with plain JavaScript and utilizes Chrome's extension APIs. The core functionality is split between two main scripts:

*   `background.js`: This script runs in the background and creates the "GlowMarkr" context menu item. When the user clicks this item, it sends a message to the content script of the active tab to initiate the highlighting process.
*   `content.js`: This script is injected into every webpage the user visits. It has two primary responsibilities:
    1.  When it receives a message from `background.js`, it gets the HTML of the user's selection, saves it to `chrome.storage.local`, and then wraps the selection in a `<span>` element with a yellow background to highlight it. This approach is robust and handles selections with special formatting and hyperlinks.
    2.  When a page is loaded, it checks `chrome.storage.local` for any saved highlight HTML for the current URL. If any are found, it re-applies them to the page.

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
