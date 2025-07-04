// File 5: background.js
// This script runs in the background, listening for messages from our content script.

console.log("Background service worker started.");

// Listen for any messages sent from other parts of the extension.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the message is our specific "download" action.
  if (request.action === "download") {
    console.log("Received download request:", request.data);

    const { filename, content } = request.data;

    // Convert the text content into a Blob, which is like a file in memory.
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

    // Create a temporary URL for this in-memory file.
    const url = URL.createObjectURL(blob);

    // Use the powerful chrome.downloads API to start the download.
    chrome.downloads.create({
      url: url,
      filename: filename, // This includes the "chats/" subdirectory
      saveAs: false // Set to true if you want the "Save As" dialog to appear
    }, (downloadId) => {
      // After the download has started, we clean up the temporary URL.
      console.log(`Download started with ID: ${downloadId}`);
      URL.revokeObjectURL(url);
    });

    // Let the sender know we've received the message.
    sendResponse({ status: "success", message: "Download initiated." });
  }

  // Return true to indicate that we will send a response asynchronously.
  return true;
});
