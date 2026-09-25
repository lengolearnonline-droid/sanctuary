# Product Requirements Document (PRD)
# Sanctuary — AI-Powered Church Presentation & Broadcast System

**Document Version:** 1.0.0  
**Status:** Approved for Architecture & Implementation  
**Target Platform:** Windows 11 (Primary), macOS / Linux (Future Roadmap)  
**Author:** Sanctuary Core Engineering & Product Team  

---

## 1. Executive Summary & Vision

### 1.1 Vision Statement
**Sanctuary** is an open, modern, offline-first church presentation and broadcast application engineered to alleviate the cognitive load on volunteer audio/video (AV) operators while delivering broadcast-grade media presentation. By combining high-performance local rendering (Electron + React + TypeScript) with embedded offline speech recognition and natural language scripture detection (Vosk), Sanctuary empowers worship leaders, solo pastors, and technical production teams to deliver seamless worship experiences with zero cloud dependency.

### 1.2 Core Value Propositions
1. **Intelligent Automation (Offline AI):** Automatically transcribes spoken sermons, identifies spoken Scripture references (e.g., *"Let's turn to Romans 8 verse 28"*), and queues or projects the exact verse in real time without operator panic.
2. **True Volunteer Simplicity:** One-click execution, intuitive dual-monitor preview/program workflows, and keyboard-driven navigation that enables a first-time volunteer to run a full Sunday service within 5 minutes of training.
3. **Broadcast-Grade Output Integration:** Direct integration with live streaming pipelines via NewTek NDI® (with full alpha-channel transparency for lower thirds) and OBS Studio WebSocket synchronization.
4. **Resilient Offline Architecture:** 100% functional without an active internet connection. All Bible databases (WEB, KJV), song libraries, media files, and AI models execute strictly on the local machine.
5. **No Subscription Lock-In:** Free, open-core architecture supporting open data formats (OpenLP, CCLI text, USFM/OSIS Bible standards).

---

## 2. Target Audience & User Personas

### 2.1 User Personas

#### Persona A: "Solo Pastor David" (Small / Plant Church)
- **Profile:** Pastor of a 60-member congregation with no dedicated AV tech. Operates slides from the pulpit or via a wireless clicker / voice detection.
- **Pain Points:** Distracted by having to stop speaking to advance slides or search for scripture verses that come up spontaneously during preaching.
- **Needs:** Hands-free voice commands (*"Next slide"*, *"Clear screen"*) and automated Scripture display when speaking verses naturally.

#### Persona B: "Volunteer Sarah" (Mid-sized Church Volunteer)
- **Profile:** High school or retiree volunteer operating the presentation laptop once every 4 weeks.
- **Pain Points:** Overwhelmed by complex, cluttered legacy presentation software (e.g., ProPresenter) with thousands of nested menus and high risk of projecting the wrong slide to the live congregation.
- **Needs:** Clear visual distinction between "Preview" (what's coming) and "Program" (what's live), foolproof search, and single-button cue transitions.

#### Persona C: "Technical Director Marcus" (Large / Multi-Screen Church)
- **Profile:** Experienced AV director managing multi-screen sanctuary projectors, stage confidence monitors for worship teams, and an NDI video feed to OBS/vMix for live streaming.
- **Pain Points:** Software crashes mid-service, high GPU latency, desynchronized lower thirds, and complex multi-display setups.
- **Needs:** Rock-solid stability, sub-16ms render loop, stage foldback with chords and timers, alpha-keyed NDI lower thirds, and OBS scene switching.

---

## 3. Detailed Feature Requirements

### 3.1 Bible Presentation Engine
- **Multi-Translation Management:**
  - Bundled offline public-domain translations: World English Bible (WEB), King James Version (KJV).
  - Extensible SQLite database schema supporting rapid import of OSIS, USFM, and Zefania XML Bible formats.
- **Instant Verse Lookup:**
  - Fast search bar supporting standard shorthand: `Jn 3:16`, `1 Cor 13 4-8`, `Ps 23`.
  - Full-Text Search (FTS5) for phrase matching (e.g., *"for God so loved"* returns John 3:16 immediately).
- **Multi-Verse Splitting & Formatting:**
  - Configurable verse splitting rules (by word count, sentence break, or custom line breaks) to prevent text overflow on projection screens.
  - Template-driven scripture formatting: Book Name, Chapter, Verse numbers, translation tag, font styling, and drop shadows.
- **Quick Reference History:**
  - One-click access to recent verses referenced during the current service.

### 3.2 Worship Lyric Engine
- **Song Repository & Library Management:**
  - Complete CRUD for worship songs (Title, Author, CCLI #, Key, Tempo, Time Signature, Copyright).
  - Structured section tagging: Verse 1..N, Chorus 1..N, Bridge, Pre-Chorus, Tag, Outro, Instrumental.
- **Arrangement Sequencing:**
  - Reusable song arrangements (e.g., *Default*, *Short Version*, *Acoustic*) mapping section order (e.g., `V1 -> C -> V2 -> C -> B -> C -> Tag`).
- **Lyric Import/Export:**
  - Support for OpenLP database import, CCLI SongSelect text/chord files, and plain text auto-tagging.
- **Stage & Chord Display:**
  - Real-time chord transposition and display on the Stage Confidence Monitor without rendering chords on the congregation screens.

### 3.3 Offline AI Speech-to-Text & Scripture Detection
- **Local Audio Pipeline:**
  - Low-latency 16kHz audio capture via Web Audio API from selected microphone input device.
  - Voice Activity Detection (VAD) to filter ambient room noise and music.
- **Embedded Speech Recognition:**
  - Vosk offline speech recognition engine running in an isolated worker thread.
  - Zero telemetry or audio transmission outside the local device.
- **Natural Language Scripture Extraction:**
  - Regex and NLP parser recognizing conversational biblical references:
    - *"Please turn in your Bibles to the book of Genesis chapter one verse one"* -> `Genesis 1:1`
    - *"Second Corinthians chapter five seventeen"* -> `2 Corinthians 5:17`
- **Confidence Scoring & Execution Modes:**
  - **Confidence > 0.90:** Auto-Live mode (if enabled) pushes verse directly to Live Program, or stages it into Next Preview with an active alert.
  - **Confidence 0.70 - 0.90:** Prompts operator with a 1-click suggestion banner (`[Enter] to Project Romans 8:28`).
  - **Confidence < 0.70:** Logged in AI timeline without interrupting the operator.
- **Voice Commands:**
  - Hands-free slide control: *"Next slide"*, *"Previous slide"*, *"Clear text"*, *"Clear background"*, *"Black screen"*.

### 3.4 Multi-Display & Output Routing
- **Independent Display Windows:**
  - **Main Projector / Congregation Display:** Fullscreen borderless window rendering current slide, background media, and lyrics.
  - **Stage Foldback / Confidence Monitor:** Tailored display for singers and preachers featuring current slide, next slide preview, stage messages, clock, and service countdown timers.
  - **Broadcast Lower-Third Window / NDI Output:** Transparent overlay rendering lower-third graphics, verse subtitles, and worship lyrics.
  - **Operator Control Surface:** Dual preview/program workspace, timeline, media picker, and quick controls.
- **Multi-Monitor Auto-Detection:**
  - Electron screen API auto-detects connected monitors, remembers display assignments by hardware EDID, and manages fullscreen state across reconnects.

### 3.5 Broadcast Graphics & NDI / OBS Integration
- **NewTek NDI® Stream Generation:**
  - Native NDI 5/6 output utilizing `grandiose` C++ native addon with 32-bit BGRA alpha channel support.
  - Low CPU overhead offscreen rendering pipeline.
- **OBS Studio WebSocket Bridge:**
  - Direct bi-directional connection using `obs-websocket-js` (v5 protocol).
  - Automated scene switching (e.g., switch OBS to "Sermon Wide" when Scripture is activated; switch to "Worship" during songs).
- **Lower Thirds & Tickers:**
  - Dynamic lower-third templates for speaker names, sermon titles, scripture references, and church announcements.
  - Smooth CSS hardware-accelerated animations (In: Slide-up/Fade, Out: Slide-down/Fade).

### 3.6 Media Playback Engine
- **Supported Formats:**
  - Video: MP4, WebM, MOV with hardware acceleration via Chromium GPU rasterization.
  - Audio: MP3, WAV, AAC, OGG.
  - Images: PNG, JPEG, WebP, SVG.
- **Background Loop Management:**
  - Seamless video loop playback with zero flicker at loop restart points.
  - Global Background layer independent of Text layer (allowing lyrics to advance while motion background loops continuously).

### 3.7 Service Planning & Run-of-Service
- **Timeline & Cue Management:**
  - Drag-and-drop service order (Welcome -> Worship Set -> Announcements -> Sermon -> Altar Call -> Benediction).
  - Custom cue items: Song, Scripture, Video, Image, Timer, Stage Message.
- **Service Timers:**
  - Countdown to service start, sermon elapsed timer, and stage wrap-up warnings.

---

## 4. Competitive Landscape Analysis

| Feature | Sanctuary | ProPresenter 7 | EasyWorship 7 | OpenLP |
| :--- | :--- | :--- | :--- | :--- |
| **Pricing Model** | Open Source / Free Core | $399 + $180/yr sub | $180 - $290/yr sub | Free / Open Source |
| **Speech-to-Text AI** | **Built-in (Offline Vosk)** | None | None | None |
| **Scripture Auto-Detect**| **Yes (Sub-1.5s latency)**| None | None | None |
| **Voice Commands** | **Yes (Offline)** | None | None | None |
| **Native NDI with Alpha** | **Yes (`grandiose`)** | Yes ($999/seat or sub)| Yes (NDI add-on) | Basic / Plugin |
| **OBS Integration** | **Native WebSocket v5** | Third-party MIDI/HTTP | Third-party plugin | Basic |
| **OS Support** | Windows / macOS / Linux | Windows / macOS | Windows only | Cross-platform |
| **Resource Footprint** | Low / GPU Accelerated | High / Heavy | Moderate | Low (Python/Qt) |
| **Offline Privacy** | **100% Offline** | Cloud license check | Cloud license check | 100% Offline |

---

## 5. Non-Functional Requirements & Performance Targets

| Metric / Dimension | Target Specification | Validation Method |
| :--- | :--- | :--- |
| **Live Render Frame Rate** | Constant 60 FPS (<16.6ms per frame) | Chromium Performance Profiler |
| **Slide Transition Latency**| < 30ms from keystroke/click to screen | High-speed camera / IPC benchmark |
| **AI Transcription Latency**| < 800ms from spoken word to text | Vosk timestamp vs audio buffer |
| **Scripture Match Latency** | < 1500ms from utterance to preview cue | End-to-end integration test |
| **Memory Footprint (Idle)** | < 250 MB RAM (Main + Operator + Output)| Task Manager / Process Monitor |
| **Memory Footprint (Live 4K)**| < 750 MB RAM with 4K video playback | GPU & System memory tracking |
| **Cold Start Time** | < 2.5 seconds to full operational state | Benchmark automated test |
| **Crash Rate Target** | < 0.001% live service crash rate | Sentry / Electron crash reporter |

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

1. **Zero Service Interruptions:** 100% crash-free operation across 100+ consecutive 90-minute simulated church services.
2. **AI Reference Detection Accuracy:** ≥ 92% accurate scripture reference detection in typical church acoustic environments with preacher lapel or podium microphones.
3. **Volunteer Proficiency Time:** A novice user can build a 5-item service order and present it in live mode with < 5 minutes of self-guided exploration.
4. **Broadcast Synchronization:** < 1 frame (16.6ms at 60fps) drift between NDI video output and OBS WebSocket state triggers.

---

## 7. Roadmap & Phase Planning

- **Phase 1 (Core Foundation & Governance):** System Architecture, Database Schema, IPC Protocols, Security Sandboxing, UI Design System.
- **Phase 2 (Presentation & Media Engine):** SQLite database integration, Bible search engine, Worship song manager, Multi-window display output, Hardware-accelerated video/slide renderer.
- **Phase 3 (AI & Speech Integration):** Web Audio capture pipeline, Vosk offline speech recognition engine, Scripture NLP parser, Confidence scoring queue.
- **Phase 4 (Broadcast & Connectivity):** NDI output with Alpha channel, OBS Studio WebSocket bridge, Stage confidence display with countdown timers.
- **Phase 5 (Packaging, Testing & Polish):** Windows 11 installer (`electron-builder`), crash resilience, offline automated test suite, user onboarding wizard.
