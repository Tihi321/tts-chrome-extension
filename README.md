# TTS Chrome Extension

A Chrome extension that sends selected text to both local TTS server and Edge TTS server using TypeScript.

## Features

- Send selected text to local TTS server via toolbar popup or right-click context menu
- Connect to Edge TTS WebSocket server with configurable port
- Send selected text to Edge TTS server via toolbar popup or right-click context menu
- WebSocket connection status indicator
- Reader service status indicator

## Development

### Prerequisites

- Node.js
- Yarn package manager

### Setup

1. Clone this repository
2. Run `yarn` to install dependencies

### Build

Run `yarn build` to compile TypeScript and build the extension to the `dist` folder.

### Development Mode

Run `yarn dev` to start the TypeScript compiler in watch mode.

## Installation

1. Build the extension using `yarn build`
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the `dist` folder containing the built extension
5. The extension should now be installed and ready to use

## Usage

### Using the Toolbar Popup

1. Click the TTS extension icon in the toolbar to open the popup
2. Configure the WebSocket port (default: 7123) and click "Connect" to connect to Edge TTS server
3. The connection status and reader service status will be displayed
4. Select text on any webpage
5. Click "Send to Local TTS" to send to local TTS server
6. Click "Send to Edge TTS" to send to Edge TTS server (requires connection and reader service)

### Using the Context Menu

1. Select text on any webpage
2. Right-click on the selected text
3. Choose "Text-to-Speech" > "Send to Local TTS" to send to local TTS
4. Choose "Text-to-Speech" > "Send to Edge TTS" to send to Edge TTS (requires connection and reader service)

## Requirements

- The local TTS server should be running at http://127.0.0.1:7891/tts
- The server should accept POST requests with JSON payload in the format: `{"text": "Selected text"}`
- The Edge TTS WebSocket server should be running locally
- It should accept WebSocket connections on the configured port (default: 7123)
- It should accept messages in the format: `{"type": "read", "value": "Selected text"}`

## Project Structure

- `src/` - TypeScript source files
  - `background.ts` - Background script for handling context menu and WebSocket connection
- `public/` - Static assets
  - `popup.html` - HTML for the toolbar popup
  - `popup.css` - Styles for the popup
  - `popup-bundle.js` - JavaScript for the popup UI
  - `icons/` - Extension icons
- `dist/` - Built extension (created after running build)
