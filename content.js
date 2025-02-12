chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "extract_text") {
        console.log("📩 Content script received extract_text request.");

        // Show a loading indicator
        let loader = document.createElement("div");
        loader.id = "summaryLoader";
        loader.style.position = "fixed";
        loader.style.bottom = "10px";
        loader.style.right = "10px";
        loader.style.width = "300px";
        loader.style.background = "white";
        loader.style.border = "1px solid black";
        loader.style.padding = "10px";
        loader.style.zIndex = "10000";
        loader.style.fontFamily = "Arial, sans-serif";
        loader.innerHTML = "⏳ Extracting text, please wait...";
        document.body.appendChild(loader);

        setTimeout(() => {
            let articleText = document.body.innerText;

            // Limit text to max allowed by Gemini (~30,000 characters)
            let maxTextLength = 30000;
            if (articleText.length > maxTextLength) {
                articleText = articleText.substring(0, maxTextLength);
                console.warn("⚠️ Text truncated to fit API limit.");
            }

            console.log("✅ Extracted text after delay:", articleText.length, "characters");

            // Send extracted text to background.js
            chrome.runtime.sendMessage({ action: "summarize", text: articleText }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("❌ Error sending message:", chrome.runtime.lastError);
                    return;
                }

                if (response && response.summary) {
                    console.log("✅ Summary received from background script:", response.summary);
                    displaySummary(response.summary);
                } else {
                    console.error("❌ No summary received.");
                }

                // Remove loader after receiving response
                if (document.getElementById("summaryLoader")) {
                    document.getElementById("summaryLoader").remove();
                }
            });

        }, 5000); // Wait 5 seconds before extracting text

        return true; // Required for async message handling
    }
});

// Function to display summary
function displaySummary(summary) {
    console.log("📄 Displaying summary:", summary);

    let existingBox = document.getElementById("summaryBox");
    if (!existingBox) {
        let summaryBox = document.createElement("div");
        summaryBox.id = "summaryBox";
        summaryBox.style.position = "fixed";
        summaryBox.style.bottom = "10px";
        summaryBox.style.right = "10px";
        summaryBox.style.width = "300px";
        summaryBox.style.background = "white";
        summaryBox.style.border = "1px solid black";
        summaryBox.style.padding = "10px";
        summaryBox.style.zIndex = "10000";
        summaryBox.style.fontFamily = "Arial, sans-serif";

        summaryBox.innerHTML = `<b>🔹 Summary:</b> <br>${summary}`;
        document.body.appendChild(summaryBox);
    } else {
        existingBox.innerHTML = `<b>🔹 Summary:</b> <br>${summary}`;
    }
}
