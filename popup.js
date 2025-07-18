// File 3: popup.js
// Now handles both download buttons, sending a different action for each.

document.addEventListener('DOMContentLoaded', () => {
    const downloadCurrentBtn = document.getElementById('downloadCurrentBtn');
    const downloadAllBtn = document.getElementById('downloadAllBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const statusDiv = document.getElementById('status');

    // Update status with the number of previously downloaded chats
    chrome.storage.local.get(['downloadedChats'], (result) => {
        const count = result.downloadedChats ? result.downloadedChats.length : 0;
        statusDiv.textContent = `${count} chats in download history.`;
    });

    // --- Event Listener for SINGLE Download ---
    downloadCurrentBtn.addEventListener('click', () => {
        statusDiv.textContent = "Downloading current chat...";
        sendMessageToContentScript({ action: "startSingleDownload" });
    });

    // --- Event Listener for BULK Download ---
    downloadAllBtn.addEventListener('click', () => {
        statusDiv.textContent = "Starting bulk download...";
        sendMessageToContentScript({ action: "startBulkDownload" });
    });

    // --- Event Listener for CLEAR HISTORY ---
    clearHistoryBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "clearHistory" }, (response) => {
            if (response && response.status === "success") {
                statusDiv.textContent = "History cleared!";
            }
        });
    });

    // Helper function to send messages and close the popup
    function sendMessageToContentScript(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url.startsWith("https://gemini.google.com/")) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['content_script.js']
                }, () => {
                    chrome.tabs.sendMessage(tabs[0].id, message, (response) => {
                        if (chrome.runtime.lastError) {
                            statusDiv.textContent = "Error: Reload Gemini page.";
                            console.error(chrome.runtime.lastError.message);
                        } else {
                            window.close();
                        }
                    });
                });
            } else {
                statusDiv.textContent = "Error: Not a Gemini page.";
            }
        });
    }
});
