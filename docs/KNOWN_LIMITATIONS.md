# Known Technical Limitations & Hardware Boundaries
# Sanctuary — AI-Powered Church Presentation & Broadcast System

**Document Version:** 1.0.0  
**Target Release:** v1.0.0 Minimum Viable Product (MVP)  
**Status:** Approved Reference  

---

## 1. Executive Summary

This document establishes transparency regarding the intentional technical trade-offs, hardware performance boundaries, and scope constraints present in the Sanctuary v1.0.0 release. Understanding these constraints enables church technical directors to plan hardware configurations and workflows effectively.

---

## 2. Hardware & Graphics Processing Limitations

### 2.1 Integrated GPU vs. 4K High-Framerate Playback
- **Limitation:** Workstations utilizing legacy or lower-tier integrated graphics (e.g., Intel HD Graphics 520 / 620 / 630) may experience frame drops or elevated GPU temperatures when rendering 4K (3840x2160) motion video loops while simultaneously outputting multiple 60 FPS NDI network streams.
- **Recommended Configuration:**
  - **Integrated GPU (Intel UHD / Iris Xe / AMD Vega):** Recommended output resolution is **1080p60** or **1080p30** with a maximum of two concurrent NDI channels (e.g., Program + Lower Thirds).
  - **Discrete GPU (NVIDIA GTX 1650 / RTX 3050+, Apple Silicon M1/M2/M3):** Required for smooth 4K projection and 3+ simultaneous 60 FPS NDI video feeds.
- **Mitigation in Software:** Sanctuary provides an *Eco-Rendering Mode* in settings that throttles offscreen NDI render loops during static slides and caps display refresh rate at 30 FPS.

---

## 3. Scripture Translations & Copyright Governance

### 3.1 Bundled Public-Domain Bibles Only
- **Limitation:** Sanctuary bundles only unencumbered public-domain Bible translations:
  - **World English Bible (WEB)**
  - **King James Version (KJV - 1769 Blayney Edition)**
- **Copyrighted Translations (NIV, ESV, NLT, NKJV, NASB):** Modern copyrighted translations cannot be legally distributed inside the open-source application installer due to publisher copyright restrictions.
- **User Workaround:** Sanctuary includes a Universal Bible Importer supporting OSIS XML, USFM, and Zefania XML formats. Churches owning local digital scripture files can import their licensed translations into their local SQLite database in under 30 seconds.

---

## 4. Offline AI Speech Recognition & Acoustic Constraints

### 4.1 Acoustic Environment Sensitivity
- **Limitation:** Vosk offline speech recognition runs on local CPU using acoustic statistical models (`vosk-model-small-en-us-0.15`). In environments with high acoustic reverb, excessive microphone distance, or heavy choir/band bleed, transcription accuracy drops from ~94% to ~70-75%.
- **Optimal Setup:** For best results, use a direct microphone feed (podium gooseneck or preacher headworn lapel microphone) routed into the presentation PC via a dedicated USB audio interface (e.g., Focusrite Scarlett, Behringer U-Phoria).
- **Mitigation:** Sanctuary's 3-tier confidence scoring engine ensures that low-confidence transcriptions (<0.70) are silently logged to history and never trigger false slide projections.

### 4.2 Primary Language Support
- **Limitation:** The MVP installer bundles the English acoustic model. Other languages (Spanish, Portuguese, French, Korean, Tagalog) require downloading corresponding Vosk language packs via the Settings menu.

---

## 5. Broadcast & Network Protocol Dependencies

### 5.1 NDI Runtime Requirement
- **Limitation:** To enable NDI broadcast output, the host operating system must have the NewTek NDI Core runtime installed (available free via the official *NDI Tools* package for Windows and macOS).
- **Graceful Degradation:** If the NDI runtime is not present, Sanctuary disables the NDI tab and operates normally for in-house HDMI/DisplayPort projectors without crashing.

### 5.2 OBS Studio & vMix Network Availability
- **Limitation:** Automated scene switching and title injection require OBS Studio 28+ (WebSocket v5) or vMix to be running and reachable over the local network.
- **Graceful Degradation:** If OBS or vMix is unreachable or crashes during a service, Sanctuary's connection pool logs a non-blocking warning and continues driving in-house projectors without interruption.

---

## 6. Data Synchronization & Multi-Workstation Workflows

### 6.1 Single-Workstation Local-First Architecture (MVP)
- **Limitation:** In version 1.0.0, the SQLite database is local to the presentation machine (`%APPDATA%/Sanctuary/sanctuary.sqlite`). There is no real-time cloud sync or simultaneous multi-user database editing.
- **Workaround:** Service plans, song sets, and custom themes can be exported to portable `.sanctuary` archive bundles via USB or church network shares.
- **Roadmap Resolution:** Real-time peer-to-peer and cloud database synchronization is scheduled for the **Version 2.0** milestone.

---

## 7. Summary Boundary Matrix

| Dimension | MVP Boundary (v1.0.0) | Planned Resolution (v2.0+) |
| :--- | :--- | :--- |
| **Max Recommended Output Res (iGPU)**| 1080p @ 60 FPS | Hardware-accelerated Vulkan canvas backend |
| **Bundled Bible Translations** | Public Domain (WEB, KJV) | Publisher API Licensing Integration (ESV API) |
| **Speech-to-Text Processing** | English Vosk Small Model | Whisper.cpp local GPU acceleration + Multi-language |
| **Database Synchronization** | Local Single SQLite File | Encrypted P2P / Cloud Collaboration Sync |
| **Remote Control Surface** | Keyboard / Mouse on host | Mobile Web Remote (iOS / Android / PWA) |
