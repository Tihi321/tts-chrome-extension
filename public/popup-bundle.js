// Connection state
let websocket = null;
let isConnected = false;
let isReaderConnected = false;

// DOM Elements
let portInput;
let connectButton;
let connectionStatus;
let readerStatus; 
let sendLocalButton;
let sendEdgeButton;

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Get DOM elements
  portInput = document.getElementById("port");
  connectButton = document.getElementById("connect-btn");
  connectionStatus = document.getElementById("connection-status");
  readerStatus = document.getElementById("reader-status");
  sendLocalButton = document.getElementById("send-local");
  sendEdgeButton = document.getElementById("send-edge");

  // Load saved port
  chrome.storage.sync.get(["wsPort"], (result) => {
    if (result.wsPort) {
      portInput.value = result.wsPort;
    }
  });

  // Load connection status from background script
  chrome.runtime.sendMessage({ action: "getConnectionState" }, (response) => {
    if (response) {
      isConnected = !!response.isConnected;
      isReaderConnected = !!response.isReaderConnected;
      updateConnectionStatus();
      updateReaderStatus();
    }
  });

  // Initialize event listeners
  initializeEventListeners();
});

// Initialize event listeners
function initializeEventListeners() {
  // Connect button click handler
  connectButton.addEventListener("click", async () => {
    const port = portInput.value;

    // Save port to storage
    chrome.storage.sync.set({ wsPort: port });

    if (isConnected) {
      // Disconnect if already connected
      chrome.runtime.sendMessage({ action: "disconnectEdge" });
      isConnected = false;
      isReaderConnected = false;
      updateConnectionStatus();
      updateReaderStatus();
      return;
    }

    // Connect using background script
    chrome.runtime.sendMessage({
      action: "connectEdge",
      port: port
    });

    // Check connection status after a delay
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: "getConnectionState" }, (response) => {
        if (response) {
          isConnected = !!response.isConnected;
          isReaderConnected = !!response.isReaderConnected;
          updateConnectionStatus();
          updateReaderStatus();
          
          if (!isConnected) {
            alert(`Failed to connect to WebSocket server at localhost:${port}`);
          }
        }
      });
    }, 1000);
  });

  // Send to Local TTS button click handler
  sendLocalButton.addEventListener("click", async () => {
    const selectedText = await getSelectedText();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: "sendToLocalTTS",
        text: selectedText
      });
    } else {
      alert("Please select some text first.");
    }
  });

  // Send to Edge TTS button click handler
  sendEdgeButton.addEventListener("click", async () => {
    if (!isConnected) {
      alert("Not connected to WebSocket server.");
      return;
    }

    if (!isReaderConnected) {
      alert("Reader service is not connected. Cannot send text to Edge TTS.");
      return;
    }

    const selectedText = await getSelectedText();
    if (selectedText) {
      chrome.runtime.sendMessage({
        action: "sendToEdgeTTS",
        text: selectedText
      });
    } else {
      alert("Please select some text first.");
    }
  });
}

// Function to get selected text from active tab
async function getSelectedText() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.id) return null;

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString().trim() || ""
    });

    if (results && results[0] && results[0].result) {
      return results[0].result;
    }
  } catch (error) {
    console.error("Error getting selected text:", error);
  }

  return null;
}

// Function to update connection status UI
function updateConnectionStatus() {
  if (isConnected) {
    connectionStatus.textContent = "Connected";
    connectionStatus.classList.remove("disconnected");
    connectionStatus.classList.add("connected");
    connectButton.textContent = "Disconnect";
  } else {
    connectionStatus.textContent = "Disconnected";
    connectionStatus.classList.remove("connected");
    connectionStatus.classList.add("disconnected");
    connectButton.textContent = "Connect";
  }
  
  updateSendButtonsState();
}

// Function to update reader status UI
function updateReaderStatus() {
  if (isReaderConnected) {
    readerStatus.textContent = "Connected";
    readerStatus.classList.remove("disconnected");
    readerStatus.classList.add("connected");
  } else {
    readerStatus.textContent = "Not connected";
    readerStatus.classList.remove("connected");
    readerStatus.classList.add("disconnected");
  }
  
  updateSendButtonsState();
}

// Function to update send buttons state
function updateSendButtonsState() {
  // Local TTS is always available
  sendLocalButton.disabled = false;
  
  // Edge TTS requires both websocket and reader to be connected
  sendEdgeButton.disabled = !(isConnected && isReaderConnected);
} 