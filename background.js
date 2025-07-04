// File 5: background.js
// This version uses a more robust download function and simplified listener
// to prevent API availability errors.

console.log("Background service worker started.");

// Use a separate, named function for the listener for clarity.
async function handleDownloadRequest(request, sender) {
  // Check if the message is our specific "download" action.
  if (request.action === "download") {
    console.log("Background: Received download request for:", request.data.filename);

    const { filename, content } = request.data;

    // Manually construct a `data:` URL. This is the most reliable method.
    const dataUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(content);

    console.log(`Background: Created data URL. Attempting download...`);

    try {
      // The chrome.downloads.download function is an alias for .create() and can be more stable.
      const downloadId = await chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
      });

      if (downloadId) {
        console.log(`Background: Download successfully started for "${filename}" with ID: ${downloadId}`);
      } else {
        console.warn(`Background: Download for "${filename}" was initiated but did not return an ID. Check browser download settings.`);
      }
    } catch (error) {
      // This will catch the "chrome.downloads.download is not a function" error if it happens again.
      console.error(`Background: CRITICAL ERROR during download for "${filename}". Error:`, error);
    }
  }
}

// Add the listener.
chrome.runtime.onMessage.addListener(handleDownloadRequest);