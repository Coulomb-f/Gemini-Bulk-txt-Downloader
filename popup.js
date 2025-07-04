// File 3: popup.js
// This script makes the button in popup.html work.
// This version uses the correct method to run our content script.

document.getElementById('downloadBtn').addEventListener('click', () => {
  console.log("Button clicked. Attempting to execute script...");

  // Find the active Gemini tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    // Check if we found a tab and if it's a gemini.google.com page
    if (tabs[0] && tabs[0].url.startsWith("https://gemini.google.com/")) {
      console.log(`Executing script on tab ID: ${tabs[0].id}`);
      // This is the correct way to inject and run a script that performs an action.
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ['content_script.js']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Script execution failed:", chrome.runtime.lastError.message);
          alert("An error occurred. Check the console for details.");
        } else {
          console.log("Script injected successfully. Closing popup.");
          window.close(); // Close the popup, the script is running on the page now.
        }
      });
    } else {
      console.error("Not on a valid Gemini page.");
      alert("This extension only works on gemini.google.com pages.");
    }
  });
});