// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "tts-selection",
    title: "Send to TTS",
    contexts: ["selection"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "tts-selection" && info.selectionText) {
    sendToTTS(info.selectionText);
  }
});

// Handle toolbar icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: getSelectedTextAndSendToTTS
  });
});

// Function to get selected text and send to TTS
function getSelectedTextAndSendToTTS() {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText) {
    chrome.runtime.sendMessage({ action: "sendToTTS", text: selectedText });
  } else {
    alert("Please select some text first.");
  }
}

// Function to send text to TTS server
function sendToTTS(text) {
  fetch("http://127.0.0.1:7891/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text: text })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log("Success:", data);
  })
  .catch(error => {
    console.error("Error sending text to TTS server:", error);
  });
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "sendToTTS" && message.text) {
    sendToTTS(message.text);
  }
}); 