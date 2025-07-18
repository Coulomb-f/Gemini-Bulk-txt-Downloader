// File 4: content_script.js
// This version removes the automatic side-panel scrolling from the bulk downloader,
// allowing the user to manually scroll and then download the visible chats.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "startBulkDownload") {
        console.log("Received command: startBulkDownload");
        runBulkDownload();
        sendResponse({ status: "started" });
    } else if (request.action === "startSingleDownload") {
        console.log("Received command: startSingleDownload");
        runSingleDownload();
        sendResponse({ status: "started" });
    }
    return true; // Keep the message channel open
});

// --- CORE HELPER FUNCTIONS (SHARED) ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function downloadSingleChat(chatTitle) {
    console.log(`Processing: "${chatTitle}"`);
    const chatContainer = document.querySelector('[data-test-id="chat-history-container"]');
    if (chatContainer) {
        let lastHeight = -1;
        while (chatContainer.scrollTop > 0 || lastHeight !== chatContainer.scrollHeight) {
            lastHeight = chatContainer.scrollHeight;
            chatContainer.scrollTop = 0;
            await sleep(1000);
            if (chatContainer.scrollHeight === lastHeight) break;
        }
    }
    const expandButtons = document.querySelectorAll('button[mattooltip="Expand text"]');
    expandButtons.forEach(button => button.click());
    await sleep(500);

    const conversationTurns = document.querySelectorAll('.conversation-container');
    const plainText = Array.from(conversationTurns).map(turn => {
        const userQueryEl = turn.querySelector('user-query .query-text');
        const modelResponseEl = turn.querySelector('model-response .markdown');
        const userText = userQueryEl ? userQueryEl.innerText.trim() : '[User query not found]';
        const modelText = modelResponseEl ? modelResponseEl.innerText.trim() : '[Model response not found]';
        return `🧑 You:\n${userText}\n\n🤖 Model:\n${modelText}`;
    }).join('\n\n========================================\n\n');

    const safeFilename = 'Gemini_Chats/' + chatTitle.replace(/[^a-z0-9_ \-]/gi, '_').substring(0, 100) + '.txt';

    chrome.runtime.sendMessage({ action: "downloadTXT", data: { filename: safeFilename, content: plainText } });
    console.log(`  ✅ Sent request to download: "${safeFilename}"`);

    chrome.runtime.sendMessage({ action: "chatDownloaded", data: { title: chatTitle } });
}


// --- SINGLE DOWNLOAD WORKFLOW ---
async function runSingleDownload() {
    if (window.isGeminiExporterRunning) {
        console.log("Exporter is already running.");
        return;
    }
    window.isGeminiExporterRunning = true;

    console.log("🚀 STARTING SINGLE CHAT DOWNLOAD 🚀");

    let activeChatLink =
        document.querySelector('div[data-test-id="conversation"][aria-current="true"]') ||
        document.querySelector('a.active[data-test-id="conversation-link"]') ||
        document.querySelector('div[data-test-id="conversation"].selected');

    const chatTitle = activeChatLink ? activeChatLink.innerText.trim() : `Current-Chat-${Date.now()}`;

    if (!activeChatLink) {
        console.warn("Could not find the active chat title in the side panel. Using a generic filename.");
    }

    await downloadSingleChat(chatTitle);

    console.log("\n🎉 SINGLE DOWNLOAD COMPLETE! 🎉");
    window.isGeminiExporterRunning = false;
}


// --- BULK DOWNLOAD WORKFLOW (MANUAL SCROLL) ---
async function runBulkDownload() {
    if (window.isGeminiExporterRunning) {
        console.log("Exporter is already running.");
        return;
    }
    window.isGeminiExporterRunning = true;

    const getHistory = () => new Promise(resolve => {
        chrome.storage.local.get(['downloadedChats'], (result) => {
            resolve(result.downloadedChats || []);
        });
    });

    const downloadedChats = await getHistory();
    console.log("🚀 STARTING BULK CHAT DOWNLOADER (MANUAL SCROLL MODE) 🚀");
    console.log("Previously downloaded chats:", downloadedChats);
    
    // --- AUTOMATIC SCROLLING LOGIC REMOVED ---
    // The script will now only see the chats that are currently visible in the DOM.
    console.log("Scanning for visible chats in the side panel...");

    const chatLinks = Array.from(document.querySelectorAll('div[data-test-id="conversation"]')).reverse();
    console.log(`Found ${chatLinks.length} visible chats to process.`);

    for (const chatLink of chatLinks) {
        const chatTitle = chatLink.innerText.trim() || "Untitled-Chat";

        if (downloadedChats.includes(chatTitle)) {
            console.log(`Skipping already downloaded chat: "${chatTitle}"`);
            continue;
        }

        console.log(`\nProcessing new chat: "${chatTitle}"`);
        const currentFirstMessage = document.querySelector('.conversation-container');
        const previousChatId = currentFirstMessage ? currentFirstMessage.id : null;

        chatLink.click();

        let chatLoaded = false;
        for (let i = 0; i < 40; i++) { // Timeout after 20 seconds
            const newFirstMessage = document.querySelector('.conversation-container');
            if (newFirstMessage && newFirstMessage.id !== previousChatId) {
                chatLoaded = true;
                break;
            }
            await sleep(500);
        }

        if (chatLoaded) {
            await sleep(1500);
            await downloadSingleChat(chatTitle);
        } else {
            console.error(`  ❌ Timed out waiting for "${chatTitle}" to load. Skipping.`);
        }
        await sleep(2000);
    }

    console.log("\n🎉🎉🎉 BULK DOWNLOAD COMPLETE! �🎉🎉");
    window.isGeminiExporterRunning = false;
}