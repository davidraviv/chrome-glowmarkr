# GlowMarkr.com Chrome Extension Specification: 

## Goal

A Chrome extension that lets the user highlight selected text on any webpage, keep those highlights in persistent storage, and reapply them automatically when the user revisits the same page.

---

## Core Features (Full Version)

1. **Highlight text selection**

   * User selects text on a webpage.
   * Via a **context menu option** (“Highlight text”), the extension wraps the selection in a `<span>` with a background color.
   * User can choose a highlight color (from a small predefined palette, e.g., yellow, green, pink).

2. **Persistence**

   * Each highlight is stored in `chrome.storage.local`.
   * Data structure includes:

     ```json
     {
       "url": "https://example.com/page",
       "highlights": [
         {
           "text": "selected string",
           "color": "#ffeb3b",
           "context": "some nearby text for better matching"
         }
       ]
     }
     ```
   * On revisiting the page, highlights are re-applied automatically.

3. **Reapplication**

   * A content script runs on page load.
   * It retrieves highlights for the current URL and searches for matching text in the DOM.
   * Matches are wrapped again in `<span>` tags with the stored color.

4. **User controls**

   * **Popup UI**:

     * List of all highlights for the current page.
     * Option to delete highlights individually or clear all highlights on the page.
   * **Settings**:

     * Choose available highlight colors.
     * Toggle persistence on/off.

---

## First Partial Stage (MVP)

**Focus: simplest working version**

* Single highlight color (yellow).
* Save **only the exact selected text** (no context, no multiple colors).
* Only one context menu action: “Highlight text”.
* On revisit, the extension finds the first occurrence of each saved string on the page and wraps it.
* No popup UI yet, no deletion controls.

**Data structure in storage (MVP):**

```json
{
  "https://example.com/page": [
    "selected string 1",
    "selected string 2"
  ]
}
```

---

## Technical Notes

* **Manifest**: Use `manifest_version: 3`.
* **Permissions**:

  * `"storage"`
  * `"contextMenus"`
  * `"scripting"`
* **Files**:

  * `manifest.json`
  * `background.js` (register context menu, handle highlight save)
  * `content.js` (apply highlights on page load)
  * `popup.html`, `popup.js` (later stages only)

---

👉 Suggestion: Start with the **MVP** (single color, exact text persistence). Once it works reliably, extend to multiple colors, popup management, and smarter reapplication.


