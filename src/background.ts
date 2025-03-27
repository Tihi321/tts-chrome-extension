/// <reference types="chrome"/>

// Make this file a module by adding an export
export {};

// WebSocket connection state
let websocket: WebSocket | null = null;
let isConnected = false;
let isReaderConnected = false;
let apiPort = "7891"; // Default API port

// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  // Create parent menu item
  chrome.contextMenus.create({
    id: "tts-parent",
    title: "Text-to-Speech",
    contexts: ["all"],
  });

  // Create submenu items
  chrome.contextMenus.create({
    id: "tts-local",
    parentId: "tts-parent",
    title: "Send to Local TTS",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "tts-stop-local",
    parentId: "tts-parent",
    title: "Stop Local TTS",
    contexts: ["all"],
  });

  chrome.contextMenus.create({
    id: "tts-edge",
    parentId: "tts-parent",
    title: "Send to Edge TTS",
    contexts: ["selection"],
  });

  // Initialize connection state and ports
  chrome.storage.sync.get(["wsPort", "apiPort"], (result) => {
    // Set API port from storage or use default
    if (result.apiPort) {
      apiPort = result.apiPort;
    }

    // Try to connect with saved WebSocket port
    if (result.wsPort) {
      connectToWebSocket(result.wsPort);
    }
  });
});

// Connect to WebSocket server
function connectToWebSocket(port: string): void {
  try {
    // Close existing connection if any
    if (websocket) {
      websocket.close();
    }

    const portNumber = parseInt(port, 10);
    if (isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      console.error(`Invalid port number: ${port}`);
      return;
    }

    const url = `ws://localhost:${portNumber}`;
    console.log(`Connecting to WebSocket server at ${url}`);

    websocket = new WebSocket(url);

    websocket.onopen = function () {
      console.log("WebSocket connected!");
      isConnected = true;

      // Send identify message
      const identifyMessage = {
        type: "identify",
        value: "extension",
      };

      websocket?.send(JSON.stringify(identifyMessage));

      // Send status request
      const statusMessage = {
        type: "status",
      };

      websocket?.send(JSON.stringify(statusMessage));
    };

    websocket.onclose = function () {
      console.log("WebSocket connection closed");
      isConnected = false;
      isReaderConnected = false;
      websocket = null;
    };

    websocket.onerror = function (error) {
      console.error("WebSocket error:", error);
      isConnected = false;
      isReaderConnected = false;
      websocket = null;
    };

    websocket.onmessage = function (event) {
      console.log("Message from server:", event.data);

      try {
        const message = JSON.parse(event.data);

        if (message.type === "reader") {
          isReaderConnected = message.value === "connected";
          console.log(`Reader is ${isReaderConnected ? "connected" : "disconnected"}`);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };
  } catch (error) {
    console.error("Error connecting to WebSocket:", error);
    isConnected = false;
    isReaderConnected = false;
    websocket = null;
  }
}

// Send text to local TTS using the configured API port
function sendToLocalTTS(text: string): void {
  const url = `http://127.0.0.1:${apiPort}/tts`;
  console.log(`Sending text to local TTS at ${url}`);

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Local TTS response:", data);
    })
    .catch((error) => {
      console.error(`Error sending to local TTS at ${url}:`, error);
    });
}

// Stop local TTS playback
function stopLocalTTS(): void {
  const url = `http://127.0.0.1:${apiPort}/stop`;
  console.log(`Stopping local TTS at ${url}`);

  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Local TTS stop response:", data);
    })
    .catch((error) => {
      console.error(`Error stopping local TTS at ${url}:`, error);
    });
}

// Send text to Edge TTS
function sendToEdgeTTS(text: string): void {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    console.error("WebSocket not connected");
    return;
  }

  try {
    const message = {
      type: "read",
      value: text,
    };

    websocket.send(JSON.stringify(message));
    console.log("Sent to Edge TTS:", message);
  } catch (error) {
    console.error("Error sending to Edge TTS:", error);
  }
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Handle stop function regardless of text selection
  if (info.menuItemId === "tts-stop-local") {
    stopLocalTTS();
    return;
  }

  // For sending text, we need selected text
  if (!info.selectionText) {
    if (info.menuItemId === "tts-local" || info.menuItemId === "tts-edge") {
      alert("Please select some text first.");
    }
    return;
  }

  if (info.menuItemId === "tts-local") {
    sendToLocalTTS(info.selectionText);
  } else if (info.menuItemId === "tts-edge") {
    if (isConnected && isReaderConnected) {
      sendToEdgeTTS(info.selectionText);
    } else {
      if (!isConnected) {
        alert("Not connected to Edge TTS server. Please connect from the extension popup.");
      } else {
        alert("Reader service is not connected. Cannot send text to Edge TTS.");
      }
    }
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  if (message.action === "connectEdge" && message.port) {
    connectToWebSocket(message.port);

    // Save port to storage
    chrome.storage.sync.set({ wsPort: message.port });

    sendResponse({ success: true });
  } else if (message.action === "setApiPort" && message.port) {
    // Save API port to storage and update local variable
    apiPort = message.port;
    chrome.storage.sync.set({ apiPort: message.port });

    sendResponse({ success: true });
  } else if (message.action === "disconnectEdge") {
    if (websocket) {
      websocket.close();
      isConnected = false;
      isReaderConnected = false;
      websocket = null;
    }

    sendResponse({ success: true });
  } else if (message.action === "getConnectionState") {
    sendResponse({
      isConnected,
      isReaderConnected,
      apiPort,
    });

    return true; // Keep message channel open for async response
  } else if (message.action === "sendToLocalTTS" && message.text) {
    sendToLocalTTS(message.text);
    sendResponse({ success: true });
  } else if (message.action === "stopLocalTTS") {
    stopLocalTTS();
    sendResponse({ success: true });
  } else if (message.action === "sendToEdgeTTS" && message.text) {
    if (isConnected && isReaderConnected) {
      sendToEdgeTTS(message.text);
      sendResponse({ success: true });
    } else {
      sendResponse({
        success: false,
        error: !isConnected ? "Not connected to server" : "Reader not connected",
      });
    }
  }
});
