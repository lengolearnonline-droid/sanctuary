# Product & Engineering Roadmap
# Sanctuary — AI-Powered Church Presentation & Broadcast System

**Document Version:** 1.0.0  
**Status:** Baseline Execution Roadmap  
**Total Phases:** 26 Phases (Phase 0 to Phase 25) + V2/V3 Vision  
**Target Release:** v1.0.0 Stable (Windows 11 Primary)  

---

## 1. V1.0.0 Execution Matrix (Phase 0 to Phase 25)

| Phase | Module / Focus Area | Description & Core Deliverables | Target Status |
| :--- | :--- | :--- | :--- |
| **Phase 0** | **Environment & Project Baseline** | Repository initialization, TypeScript strict config, Vite + Electron Forge build setup, ESLint/Prettier, CI pipeline. | `DONE` |
| **Phase 1** | **Core IPC & Window Architecture** | Typed IPC channels, Electron window managers (Operator, Projector, Stage, NDI Offscreen), power-save blockers. | `IN PROGRESS` |
| **Phase 2** | **Database Schema & SQLite Engine** | Embedded `better-sqlite3` integration, WAL mode, migrations runner, repository abstraction layer. | `NOT STARTED` |
| **Phase 3** | **Bible Translation Engine (WEB/KJV)** | Bundled offline SQLite database for World English Bible & King James Version, fast chapter/verse indexers. | `NOT STARTED` |
| **Phase 4** | **FTS5 Search & Rapid Verse Lookup** | Full-text search virtual tables, shorthand scripture queries (`Jn 3:16`), multi-verse range parser. | `NOT STARTED` |
| **Phase 5** | **Worship Lyrics & Song Repository** | Song database CRUD, CCLI metadata, structured section tags (Verse, Chorus, Bridge, Tag), OpenLP import. | `NOT STARTED` |
| **Phase 6** | **Arrangements & Section Sequencing** | Reusable song arrangement builder, interactive section order editor, quick-jump keybindings. | `DONE` |
| **Phase 7** | **UI Design System & Core Components**| Dark-theme tokens, Button, Card, Panel, Modal, Toast, Input, Badge, Slider, Lucide icons. | `DONE` |
| **Phase 8** | **Dual Preview/Program Workspace** | Operator control surface, unmissable Red Live vs Amber Preview monitors, dual preview canvas. | `DONE` |
| **Phase 9** | **GPU Slide Renderer & Transitions** | Hardware-accelerated presentation renderer, smooth CSS/WebGL transitions (Cut, Fade, Slide, Zoom). | `DONE` |
| **Phase 10**| **Media Playback & Motion Loops** | Video loop player (MP4/WebM), independent text/background layer separation, audio playback engine. | `DONE` |
| **Phase 11**| **Multi-Display & EDID Manager** | Automatic monitor detection, persistent screen assignment by EDID, secondary screen borderless launch. | `DONE` |
| **Phase 12**| **Stage Foldback & Confidence Monitor**| Stage display window, speaker clock, countdown timer, next slide preview, stage alert overlay. | `DONE` |
| **Phase 13**| **Audio Capture & VAD Preprocessor** | Web Audio API capture, AudioWorklet 16kHz downsampling, WebRTC VAD filter for silence/music rejection. | `DONE` |
| **Phase 14**| **Vosk Offline Speech Recognizer** | Isolated Node.js child process / worker, Vosk small English model integration, streaming transcript tokens. | `DONE` |
| **Phase 15**| **Scripture NLP & Reference Extractor**| NLP rule engine and DFA parser recognizing spoken books/chapters/verses with colloquial normalization. | `DONE` |
| **Phase 16**| **Voice Command Interpreter** | Spoken hands-free commands (*"Next slide"*, *"Clear text"*, *"Blackout"*, *"Show chorus"*). | `DONE` |
| **Phase 17**| **AI Suggestion Queue & Auto-Live** | 3-tier confidence scoring (>0.90, 0.70-0.90, <0.70), 1-click suggestion toasts, operator override guards. | `DONE` |
| **Phase 18**| **NDI Output Engine (`grandiose`)** | NewTek NDI® 5/6 native output, offscreen Chromium frame capture, 32-bit BGRA with Alpha channel. | `DONE` |
| **Phase 19**| **OBS Studio WebSocket v5 Bridge** | Bi-directional OBS WebSocket client, automated scene switching, lower-third toggle, stream status bar. | `DONE` |
| **Phase 20**| **vMix Production Integration** | vMix TCP/HTTP API integration, dynamic XAML title population, tally feedback listener. | `DONE` |
| **Phase 21**| **Service Planning & Run-of-Service** | Drag-and-drop service order timeline, cue item durations, rehearsal timers, service notes. | `DONE` |
| **Phase 22**| **Data Import/Export Engine** | OpenLP database importer, CCLI SongSelect text importer, USFM/OSIS Bible parser, backup/restore ZIP. | `DONE` |
| **Phase 23**| **Security Hardening & Zod Guards** | Context isolation audit, Zod IPC payload validation, path traversal guards, SQL parameterization check. | `DONE` |
| **Phase 24**| **Packaging, NSIS & Auto-Updater** | `electron-builder` Windows 11 NSIS installer, code signing configuration, `electron-updater` pipeline. | `NOT STARTED` |
| **Phase 25**| **Final QA, Benchmarks & v1.0 Polish** | 100+ run stress test, memory leak profiling, crash recovery simulation, volunteer onboarding wizard. | `NOT STARTED` |

---

## 2. Detailed Milestone Deliverables (Phase Breakdown)

### Milestone 1: Core Foundation & Data Engines (Phases 0–6)
- **Goal:** Robust, fast local database engine containing Bibles and worship songs with sub-millisecond retrieval.
- **Key Deliverable:** Working local database with KJV + WEB Bibles and song database with FTS5 search.

### Milestone 2: Presentation & Multi-Window Graphics (Phases 7–12)
- **Goal:** Fluid 60fps dual-screen presentation with preview/program controls and stage foldback.
- **Key Deliverable:** Operator screen seamlessly driving a secondary projector and stage TV with zero frame drops.

### Milestone 3: Embedded AI & Speech Recognition (Phases 13–17)
- **Goal:** Offline speech recognition identifying live spoken scriptures and voice commands.
- **Key Deliverable:** Speaking *"Turn to Romans 8:28"* prompts a 1-click cue in < 1.5s.

### Milestone 4: Broadcast Integration & Live Streaming (Phases 18–20)
- **Goal:** Professional NDI streaming with alpha transparency and OBS/vMix automation.
- **Key Deliverable:** Transparent lower thirds broadcast over NDI into OBS Studio with automated scene triggers.

### Milestone 5: Service Management & Release Readiness (Phases 21–25)
- **Goal:** Polished service planning, security verification, automated testing, and installer packaging.
- **Key Deliverable:** Signed Windows 11 `.exe` installer ready for production church services.

---

## 3. Future Roadmap: Version 2.0 & Version 3.0

### 3.1 Version 2.0 (Connected Church & Team Collaboration)
- **Sanctuary Cloud Sync:** Multi-workstation database sync across pastoral planning laptops and AV booth computers using end-to-end encrypted peer sync.
- **Mobile Remote App (iOS / Android / PWA):** Local Wi-Fi remote control allowing pastors to control slides, read sermon notes, and view stage timers from an iPad or phone.
- **ProPresenter & EasyWorship Library Importers:** 1-click migration wizards to import existing ProPresenter 6/7 and EasyWorship databases.
- **Multi-Camera Tally Routing:** Visually display active camera tally (Preview Green / Program Red) directly on the Stage Confidence Monitor.
- **Smart Song Transposition:** Real-time Roman numeral chord charts (Nashville Number System) on stage monitors.

### 3.2 Version 3.0 (Next-Gen AI & Intelligent Church Automation)
- **Real-Time Multi-Lingual Subtitles:** Spoken English sermons automatically translated and broadcast as lower-third subtitles in Spanish, French, Chinese, or Korean.
- **AI Sermon Summary & Bulletin Generator:** Automatically generate sermon notes, key takeaway bullet points, and social media quotes from the live audio transcript.
- **Automated PTZ Camera Auto-Tracking:** Instruct PTZ cameras over VISCA/IP to pan and frame the pastor or worship leader based on stage sound localization.
- **Sanctuary Plugin & Theme Marketplace:** Open developer ecosystem for custom transition shaders, community Bible translations, and broadcast graphics widgets.
