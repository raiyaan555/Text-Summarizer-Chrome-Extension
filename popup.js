document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get("summary", (data) => {
        document.getElementById("summary").textContent = data.summary || "No summary available.";
    });
});
