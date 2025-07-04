// File 4: content_script.js
// This version has the correct selectors and saves to the root Downloads folder.

(async () => {
    // Check if the script is already running to prevent double-clicks
    if (window.isGeminiExporterRunning) {
        console.log("Exporter is already running. Please wait.");
        return;
    }
    window.isGeminiExporterRunning = true;

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const waitForChatToLoad = async (oldId) => {
        const timeout = 20000;
        const interval = 500;
        let elapsedTime = 0;
        while (elapsedTime < timeout) {
            const newFirstMessage = document.querySelector('.conversation-container');
            const newId = newFirstMessage ? newFirstMessage.id : null;
            if (newId && newId !== oldId) {
                await sleep(1500);
                return true;
            }
            await sleep(interval);
            elapsedTime += interval;
        }
        return false;
    };

    const downloadSingleChat = async (chatTitle) => {
        const chatContainer = document.querySelector('[data-test-id="chat-history-container"]');
        if (chatContainer) {
            let lastHeight = -1;
            while (chatContainer.scrollTop > 0 || lastHeight !== chatContainer.scrollHeight) {
                lastHeight = chatContainer.scrollHeight;
                chatContainer.scrollTop = 0;
                await sleep(2000);
                if (chatContainer.scrollHeight === lastHeight) break;
            }
        }
        const expandButtons = document.querySelectorAll('button[mattooltip="Expand text"]');
        expandButtons.forEach(button => button.click());
        await sleep(500);

        const conversationTurns = document.querySelectorAll('.conversation-container');
        const chatText = Array.from(conversationTurns).map(turn => {
            const userQueryEl = turn.querySelector('user-query .query-text');
            const modelResponseEl = turn.querySelector('model-response .markdown');
            const userText = userQueryEl ? userQueryEl.innerText.trim() : '[User query not found]';
            const modelText = modelResponseEl ? modelResponseEl.innerText.trim() : '[Model response not found]';
            return `🧑 You:\n${userText}\n\n🤖 Model:\n${modelText}`;
        }).join('\n\n========================================\n\n');

        const safeFilename = chatTitle.replace(/[^a-z0-9_ \-]/gi, '_').substring(0, 100) + '.txt';

        // Use the chrome.runtime API to send a message to the background script
        chrome.runtime.sendMessage({
            action: "download",
            data: {
                filename: safeFilename,
                content: chatText
            }
        });
        console.log(`  ✅ Sent request to download: "${safeFilename}"`);
    };

    console.log("🚀 STARTING BULK CHAT DOWNLOADER 🚀");
    const sidePanelScroller = document.querySelector('.conversation-items-container');
    if (!sidePanelScroller) {
        console.error("Fatal Error: Could not find the side panel scroll container. The Gemini page structure may have changed.");
        window.isGeminiExporterRunning = false;
        return;
    }
    let lastHeight = -1;
    while (lastHeight !== sidePanelScroller.scrollHeight) {
        lastHeight = sidePanelScroller.scrollHeight;
        sidePanelScroller.scrollTop = sidePanelScroller.scrollHeight;
        await sleep(2000);
    }

    const chatLinks = Array.from(document.querySelectorAll('div[data-test-id="conversation"]')).reverse();
    const totalChats = chatLinks.length;
    console.log(`2️⃣ Found ${totalChats} chats to download.`);

    for (let i = 0; i < totalChats; i++) {
        const chatLink = chatLinks[i];
        const chatTitle = chatLink.innerText.trim() || `Untitled-Chat-${i + 1}`;
        console.log(`\nProcessing chat ${i + 1} of ${totalChats}: "${chatTitle}"`);
        const currentFirstMessage = document.querySelector('.conversation-container');
        const previousChatId = currentFirstMessage ? currentFirstMessage.id : null;
        chatLink.click();
        const chatLoaded = await waitForChatToLoad(previousChatId);
        if (chatLoaded) {
            await downloadSingleChat(chatTitle);
        } else {
            console.error(`  ❌ Timed out waiting for "${chatTitle}" to load. Skipping.`);
        }
        await sleep(2000);
    }
    console.log("\n🎉🎉🎉 BULK DOWNLOAD COMPLETE! 🎉🎉🎉");
    window.isGeminiExporterRunning = false;
})();
