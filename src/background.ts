/// <reference types="chrome"/>

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "tts-selection",
    title: "Send to TTS",
    contexts: ["selection"],
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener(
  (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (info.menuItemId === "tts-selection" && info.selectionText) {
      sendToTTS(info.selectionText);
    }
  }
);

// Handle toolbar icon click
chrome.action.onClicked.addListener((tab: chrome.tabs.Tab) => {
  if (tab.id) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: getSelectedTextAndSendToTTS,
    });
  }
});

// Function to get selected text and send to TTS
function getSelectedTextAndSendToTTS(): void {
  const selectedText = window.getSelection()?.toString().trim() || "";
  if (selectedText) {
    chrome.runtime.sendMessage({ action: "sendToTTS", text: selectedText });
  } else {
    alert("Please select some text first.");
  }
}

// Function to send text to TTS server
function sendToTTS(text: string): void {
  fetch("http://127.0.0.1:7891/tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: text }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
    })
    .catch((error) => {
      console.error("Error sending text to TTS server:", error);
    });
}

// Define message interface
interface TTSMessage {
  action: string;
  text?: string;
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message: TTSMessage) => {
  if (message.action === "sendToTTS" && message.text) {
    sendToTTS(message.text);
  }
});
