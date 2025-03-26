# TTS Chrome Extension

A Chrome extension that sends selected text to a local TTS server.

## Features

- Send selected text to TTS server via toolbar button
- Send selected text to TTS server via right-click context menu
- Simple integration with local TTS server

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the folder containing this extension
5. The extension should now be installed and ready to use

## Usage

### Using the Toolbar Button

1. Select text on any webpage
2. Click the TTS extension icon in the toolbar
3. The selected text will be sent to the TTS server

### Using the Context Menu

1. Select text on any webpage
2. Right-click on the selected text
3. Choose "Send to TTS" from the context menu
4. The selected text will be sent to the TTS server

## Requirements

- The local TTS server should be running at http://127.0.0.1:7891/tts
- The server should accept POST requests with JSON payload in the format: `{"text": "Selected text"}`
