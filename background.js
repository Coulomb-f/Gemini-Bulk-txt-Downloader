// File 5: background.js
// This version uses the modern, correct method for downloading files from a
// background service worker, avoiding the URL.createObjectURL error.

console.log("Background service worker started.");

// Listen for any messages sent from other parts of the extension.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Check if the message is our specific "download" action.
  if (request.action === "download") {
    console.log("Received download request:", request.data);

    const { filename, content } = request.data;

    // Convert the text content into a Blob.
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

    // --- The Correct Method for Service Workers ---
    // Use a FileReader to convert the Blob into a data: URL.
    const reader = new FileReader();
    reader.onload = function() {
      const dataUrl = reader.result;

      // Use the powerful chrome.downloads API with the data: URL.
      chrome.downloads.create({
        url: dataUrl,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("Download failed:", chrome.runtime.lastError.message);
        } else {
          console.log(`Download started with ID: ${downloadId}`);
        }
      });
    };
    reader.readAsDataURL(blob); // Start the conversion

    // Let the sender know we've received the message.
    sendResponse({ status: "success", message: "Download initiated." });
  }

  // Return true to indicate that we will send a response asynchronously.
  return true;
});