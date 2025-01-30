console.log("content script loaded on:", window.location.hostname);
document.addEventListener("visibilitychange", () => {
    chrome.runtime.sendMessage({ visible: !document.hidden });
});