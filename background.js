chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        console.log("🌍 Page Loaded:", tab.url);

        // Ignore restricted URLs
        if (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:")) {
            console.log("🚫 Skipping restricted URL:", tab.url);
            return;
        }

        // Check if the tab is active before injecting script
        chrome.tabs.get(tabId, (tabInfo) => {
            if (chrome.runtime.lastError || !tabInfo || !tabInfo.active || tabInfo.discarded) {
                console.warn("⚠️ Skipping script injection. Tab inactive or discarded.");
                return;
            }

            // Inject content script dynamically
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ["content.js"]
            }).then(() => {
                console.log("✅ Content script injected");
                chrome.tabs.sendMessage(tabId, { action: "extract_text" });
            }).catch(err => console.error("❌ Error injecting content script:", err));
        });
    }
});

// Handle message passing safely
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "summarize") {
        console.log("📄 Received extracted text:", request.text.length, "characters");

        fetch("http://localhost:10000/summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: request.text })
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.summary) {
                console.log("✅ Summary Received:", data.summary);

                // Store summary in chrome storage
                chrome.storage.local.set({ summary: data.summary }, () => {
                    console.log("💾 Summary saved to storage.");
                });

                // Ensure the tab is still active before sending response
                if (sender.tab) {
                    chrome.tabs.get(sender.tab.id, (tabInfo) => {
                        if (!chrome.runtime.lastError && tabInfo && !tabInfo.discarded) {
                            chrome.tabs.sendMessage(sender.tab.id, { action: "display_summary", summary: data.summary });
                        } else {
                            console.log("🚫 Tab was closed or discarded before response could be sent.");
                        }
                    });
                }

                sendResponse({ summary: data.summary });
            } else {
                console.error("❌ Invalid response format:", data);
                sendResponse({ error: "Invalid response format" });
            }
        })
        .catch(error => {
            console.error("❌ Error summarizing:", error);
            sendResponse({ error: "Summarization failed" });
        });

        return true; // Required for async response
    }
});
