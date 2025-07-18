// File 5: background.js
// This version correctly listens for all actions from the content script and popup.

console.log("Background service worker started.");

// Main listener for all messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
        case "downloadTXT":
            handleDownloadRequest(request.data);
            sendResponse({ status: "success" });
            break;
        // Note: We are not using the PDF feature for now, but the logic would go here.
        case "chatDownloaded":
            addChatToHistory(request.data.title);
            sendResponse({ status: "success" });
            break;
        case "clearHistory":
            clearDownloadHistory();
            sendResponse({ status: "success" });
            break;
    }
    // Return true to keep the message channel open for asynchronous responses if needed.
    return true;
});

function handleDownloadRequest(data) {
    const { filename, content } = data;
    const dataUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(content);

    chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
    }, (downloadId) => {
        if (chrome.runtime.lastError) {
            console.error(`Download failed for "${filename}":`, chrome.runtime.lastError.message);
        } else {
            console.log(`Download started for "${filename}" with ID: ${downloadId}`);
        }
    });
}

function addChatToHistory(title) {
    chrome.storage.local.get(['downloadedChats'], (result) => {
        const history = result.downloadedChats || [];
        if (!history.includes(title)) {
            history.push(title);
            chrome.storage.local.set({ downloadedChats: history }, () => {
                console.log(`'${title}' added to download history.`);
            });
        }
    });
}

function clearDownloadHistory() {
    chrome.storage.local.set({ downloadedChats: [] }, () => {
        console.log("Download history cleared.");
    });
}
