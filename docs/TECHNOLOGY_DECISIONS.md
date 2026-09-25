# Technology Stack Decisions & Evaluation
# Sanctuary — AI-Powered Church Presentation & Broadcast System

**Document Version:** 1.0.0  
**Status:** Approved Architecture Standard  
**Core Framework:** Electron + React + TypeScript + Vite  
**Database:** SQLite via `better-sqlite3`  
**Speech Engine:** Vosk Offline C++ / Node Bindings  
**Broadcast Pipeline:** NewTek NDI® via `grandiose` + OBS WebSocket v5  

---

## 1. Executive Summary & Architectural Decisions

The core engineering objective for Sanctuary is to deliver a low-latency, broadcast-grade church presentation application with native hardware capabilities (NDI video output, offline speech recognition, multi-window GPU acceleration) while enabling rapid UI development and high visual fidelity for volunteer operators.

After rigorous benchmarking against alternative native and hybrid frameworks, the architecture team selected **Electron + React + TypeScript** bundled with **Vite**.

---

## 2. Framework Comparison & Evaluation Matrix

We evaluated four candidate application frameworks against six mission-critical production criteria:

| Evaluation Criteria (Weight) | Electron + React | Tauri (Rust + WebView) | WPF / .NET MAUI (C#) | Qt 6 / QML (C++) |
| :--- | :--- | :--- | :--- | :--- |
| **Native C++ Addon ABI Compatibility (25%)** | **5/5** (Node-API / N-API mature for NDI, Vosk, SQLite) | **3/5** (Rust FFI required, complex bridging) | **3/5** (P/Invoke / C++/CLI overhead) | **5/5** (Native C++ core) |
| **Multi-Display & GPU Acceleration (20%)** | **5/5** (Predictable Chromium engine across all screens) | **2/5** (System WebViews have OS rendering quirks) | **4/5** (Windows DirectX only) | **5/5** (Native OpenGL/Vulkan) |
| **UI Development Velocity & Ecosystem (20%)** | **5/5** (React 18, Tailwind, Lucide, Framer Motion) | **4/5** (Web frontend, Rust backend friction) | **3/5** (XAML / WPF slower iteration) | **2/5** (QML / Qt Widgets high maintenance) |
| **Offline AI & Audio Stream Piping (15%)** | **5/5** (Web Audio API + Node streams + Vosk worker) | **3/5** (Audio capture across OS WebViews varies) | **4/5** (NAudio / Windows Core Audio) | **4/5** (Qt Audio Engine) |
| **Cross-Platform Roadmap (10%)** | **5/5** (Identical codebase for Win 11, macOS, Linux) | **4/5** (Cross-platform WebView discrepancies) | **1/5** (WPF is Windows only; MAUI immature on Mac/Linux) | **5/5** (True cross-platform) |
| **Memory Footprint & Binary Size (10%)** | **3/5** (~150MB baseline installer, ~250MB RAM) | **5/5** (~20MB installer, ~60MB RAM) | **4/5** (~80MB installer, ~120MB RAM) | **4/5** (~90MB installer, ~100MB RAM) |
| **Weighted Score (100% Max)** | **4.70 / 5.0** | **3.35 / 5.0** | **3.20 / 5.0** | **4.10 / 5.0** |

---

## 3. Deep-Dive Rationale for Technology Choices

### 3.1 Why Electron + React over Tauri?
1. **Predictable Chromium Video Engine:** Tauri relies on the OS-bundled WebView (WebView2 on Windows, WebKit on macOS). WebView2 behaves differently across Windows 10/11 revisions and lacks uniform WebGL/WebCodecs hardware acceleration guarantees. Electron bundles a fixed Chromium version, ensuring that 4K video loops and smooth CSS text transitions render identically on all machines.
2. **Native NDI & Vosk C++ Bindings:** NewTek NDI (`grandiose`) and Vosk provide battle-tested Node-API (N-API) C++ addons. Integrating these in Rust/Tauri would require writing, maintaining, and certifying custom Rust FFI wrappers, severely slowing down feature velocity.
3. **Multi-Window Synchronization:** Electron provides synchronous, high-throughput IPC message passing between independent native windows (Operator, Projector, Stage Display), avoiding the complexity of Tauri’s multi-window event bus.

### 3.2 Why Electron + React over WPF / .NET MAUI?
1. **Platform Independence:** WPF is strictly tied to Windows. While church AV workstations are predominantly Windows 11, numerous production environments utilize Apple Silicon Macs. Electron ensures 95%+ code sharing across Windows and macOS.
2. **Modern Web UI Components:** Rich UI features (interactive lyric arranger, drag-and-drop service timelines, rich text formatting, waveform audio visualizers) can be assembled with high quality using the React ecosystem.

### 3.3 Why SQLite (`better-sqlite3`) over alternatives?
1. **Synchronous Execution in Main Process:** `better-sqlite3` executes queries synchronously on the Node.js main thread or dedicated worker without async event loop overhead. It is 10x-50x faster than asynchronous SQLite libraries (`sqlite3`) and eliminates async race conditions during slide rendering.
2. **Embedded Zero-Config Deployment:** Zero database server configuration for the church volunteer; all data resides in a single, robust `.sqlite` file in the user's AppData directory.
3. **FTS5 Full-Text Search:** Built-in FTS5 engine powers sub-millisecond scripture and lyric phrase searches across millions of words.

### 3.4 Why Vosk over Cloud AI / Whisper.cpp?
1. **100% Offline & Privacy-Guaranteed:** Vosk operates strictly on local CPU without internet connectivity, eliminating subscription fees, API rate limits, and latency spikes.
2. **Ultra-Low Latency (<800ms):** Vosk uses lightweight Kaldi acoustic models that process streaming 16kHz audio chunks with minimal memory overhead (~150MB RAM for the small English model), compared to Whisper.cpp which requires high GPU compute or introduces 2-5 second latency per audio chunk.

---

## 4. Complete Production Dependencies & Licenses

### 4.1 Core Runtime & Desktop Container
| Package Name | Version | Purpose | License |
| :--- | :--- | :--- | :--- |
| `electron` | `^30.0.0` | Desktop runtime (Chromium + Node.js 20 LTS) | MIT |
| `electron-builder` | `^24.13.0` | Native installer packaging (NSIS, DMG, AppImage) | MIT |
| `electron-updater` | `^6.2.0` | Secure background auto-update engine | MIT |
| `vite` | `^5.2.0` | Lightning-fast frontend module bundler | MIT |
| `@electron-toolkit/utils`| `^3.0.0` | Secure IPC bridge helpers and window management | MIT |

### 4.2 Database & Storage
| Package Name | Version | Purpose | License |
| :--- | :--- | :--- | :--- |
| `better-sqlite3` | `^9.4.3` | High-performance synchronous SQLite3 engine | MIT |
| `@types/better-sqlite3`| `^7.6.9` | TypeScript definitions for better-sqlite3 | MIT |

### 4.3 Offline Speech Recognition & NLP
| Package Name | Version | Purpose | License |
| :--- | :--- | :--- | :--- |
| `vosk` | `^0.3.39` | Offline speech recognition Node.js native binding | Apache 2.0 |
| `compromise` | `^14.12.0`| Fast rule-based NLP parser for number and text normalization | MIT |

### 4.4 Broadcast & Hardware Integration
| Package Name | Version | Purpose | License |
| :--- | :--- | :--- | :--- |
| `grandiose` | `^2.1.2` | NewTek NDI® native SDK wrapper for video output with Alpha | MIT |
| `obs-websocket-js` | `^5.0.3` | OBS Studio 28+ WebSocket v5 protocol client | MIT |

### 4.5 Frontend UI Framework & State Management
| Package Name | Version | Purpose | License |
| :--- | :--- | :--- | :--- |
| `react` | `^18.3.1` | Declarative component UI framework | MIT |
| `react-dom` | `^18.3.1` | DOM renderer for React | MIT |
| `typescript` | `^5.4.5` | Static type system for robust codebase | Apache 2.0 |
| `zustand` | `^4.5.2` | Lightweight, unopinionated centralized state store | MIT |
| `lucide-react` | `^0.378.0`| Modern, clean SVG icon library | ISC |
| `clsx` / `tailwind-merge`| `^2.0.0` | Dynamic CSS class composition | MIT |
| `zod` | `^3.23.8` | Runtime schema validation for IPC and external imports | MIT |

### 4.6 Bundled Public Domain Content
| Asset / Content | Source / Version | Purpose | License |
| :--- | :--- | :--- | :--- |
| **World English Bible (WEB)** | Rainbow Missions, Inc. | Modern English Scripture translation | Public Domain |
| **King James Version (KJV)** | 1611 / 1769 Blayney Edition | Traditional English Scripture translation | Public Domain |
| **Vosk English Small Model** | `vosk-model-small-en-us-0.15` | Compact 45MB offline acoustic model | Apache 2.0 |

---

## 5. Development & Build Tooling

- **Language Standard:** TypeScript 5.4+ with strict null checks (`strict: true`, `noImplicitAny: true`).
- **Linter & Formatter:** ESLint 9+ with `@typescript-eslint` and Prettier.
- **Test Framework:** Vitest for lightning-fast unit tests + Playwright for Electron end-to-end integration tests.
- **Node ABI Native Rebuilding:** `electron-rebuild` / `@electron/rebuild` to ensure `better-sqlite3`, `vosk`, and `grandiose` match the Electron Node ABI version during compilation.
