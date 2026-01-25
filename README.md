# pip-chrome-extension

Simple PiP Helper (MVP)

This is a minimal Chrome Manifest V3 extension that:
- Injects a small PiP button over HTML5 `<video>` elements.
- Provides an extension popup button and a keyboard command (Ctrl+Shift+P) to request Picture-in-Picture for the first detected video.

Limitations
- Designed for non-DRM HTML5 video. DRM-protected streams (Widevine/EME) usually cannot be mirrored or requested for PiP and are not supported.
- Some sites may block `requestPictureInPicture()` or prevent scripts from accessing the real `<video>` element.

Install locally
1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this repository folder (`pip-chrome-extension`)

Files
- `manifest.json` - MV3 manifest
- `content.js` - content script that finds `<video>` and injects a PiP button
- `service_worker.js` - background service worker to handle commands
- `popup.html` / `popup.js` - popup UI to trigger PiP

Notes
- For production, restrict `host_permissions` to the domains you intend to support, add icons, and follow Chrome Web Store policies.
