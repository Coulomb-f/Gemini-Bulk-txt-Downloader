# Gemini Chat Exporter

A simple Chrome extension to download your conversations from Google Gemini. You can download the current chat or bulk download all new chats from your history.

## ✨ Features

-   **Single Chat Download:** Download the currently active Gemini conversation to a `.txt` file.
-   **Bulk Download:** Download all *new* conversations visible in your chat history panel.
-   **Smart History:** The extension remembers which chats you've already downloaded to prevent duplicates.
-   **Clear History:** Easily reset the download history to start fresh.
-   **Manual Scroll Mode:** For bulk downloads, simply scroll through your chat history panel to load the conversations you want to download, then click the button. No complex automation, just simple user control.

## 🚀 Installation (Local)

Since this extension is not on the Chrome Web Store, you can load it locally:

1.  Clone or download this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable **Developer mode** using the toggle switch in the top-right corner.
4.  Click the **Load unpacked** button.
5.  Select the directory where you cloned/unzipped this repository (`gemini_bulk_downloader`).
6.  The "Gemini Exporter" icon should now appear in your Chrome toolbar. You may need to pin it.

## 📖 How to Use

1.  Navigate to `https://gemini.google.com/`.
2.  Click on the **Gemini Exporter** icon in your toolbar to open the popup.

### Download Current Chat
-   With a conversation open, click the **Download Current Chat** button in the extension popup.
-   The current chat will be saved as a `.txt` file in your browser's default download location, inside a `Gemini_Chats` folder.

### Download All New Chats (Bulk)
1.  On the Gemini page, scroll through your chat history panel on the left side. The extension can only "see" the chats that have been rendered in the list.
2.  Click the **Download All New Chats** button in the extension popup.
3.  The extension will iterate through the visible chats, skip any that have been previously downloaded, and save the new ones as `.txt` files.

### Clear Download History
-   If you want the extension to forget which chats it has downloaded (e.g., to re-download everything), click the **Clear Download History** button.

## 🛠️ How It Works

-   **Popup (`popup.js`, `popup.html`):** Provides the user interface for initiating downloads and clearing history.
-   **Content Script (`content_script.js`):** Injected into the Gemini page. It's responsible for:
    -   Finding and clicking chat links in the history panel.
    -   Waiting for chats to load.
    -   Scraping the user prompts and model responses from the page.
    -   Sending the scraped content to the background script.
-   **Background Script (`background.js`):** Acts as the extension's core. It:
    -   Listens for messages from the popup and content scripts.
    -   Uses the `chrome.downloads` API to save the `.txt` files.
    -   Manages the list of downloaded chat titles using `chrome.storage.local` to prevent duplicates.