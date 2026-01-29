# pip-chrome-extension

Simple PiP Helper (MVP)

This is a minimal Chrome Manifest V3 extension that:
- On demand (user-triggered), injects a small PiP button overlay on HTML5 `<video>` elements in the active tab.
- Provides an extension popup button and a keyboard command (Ctrl+Shift+P) to request Picture-in-Picture for the first detected video.

Usage
1. Open a page with an HTML5 `<video>`.
2. Click the extension icon and press "Enable PiP (first video)", or use the shortcut Ctrl+Shift+P.
3. After the first run, an in-page PiP button overlay is added on videos (same tab).

Permissions
- `activeTab`: access the active tab only after a user action (popup click / keyboard command).
- `scripting`: inject the content script only on demand.

Limitations
- Designed for non-DRM HTML5 video. DRM-protected streams (Widevine/EME) usually cannot be mirrored or requested for PiP and are not supported.
- Some sites may block `requestPictureInPicture()` or prevent scripts from accessing the real `<video>` element.

Install locally
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this repository folder (`pip-chrome-extension`)

Files
- `manifest.json` - MV3 manifest
- `content.js` - injected on demand; finds `<video>` and adds the PiP overlay + message handler
- `service_worker.js` - injects `content.js` on demand and triggers PiP
- `popup.html` / `popup.js` - popup UI to trigger PiP

Notes
- This project uses on-demand script injection (no persistent `host_permissions` / `content_scripts`), which typically helps with Chrome Web Store permission compliance.
