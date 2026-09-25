# Developer Onboarding & Contribution Guide
# Sanctuary — AI-Powered Church Presentation & Broadcast System

**Document Version:** 1.0.0  
**Target Environment:** Windows 11 (Primary), macOS, Linux  
**Primary Language:** TypeScript 5.4+ (Strict Mode)  
**Package Manager:** `pnpm` (Fast, disk space efficient)  

---

## 1. Prerequisites & Tooling Requirements

Before contributing to Sanctuary, ensure your workstation has the following tools installed:

1. **Node.js:** Version `20.x LTS` (Recommended via `nvm` or `fnm`).
2. **Package Manager:** `pnpm` version `9.x` (`npm install -g pnpm`).
3. **Version Control:** `Git` (2.40+).
4. **C++ Native Build Tools (Required for `better-sqlite3`, `vosk`, `grandiose`):**
   - **Windows:** Visual Studio 2022 Community with *Desktop development with C++* workload OR `npm install --global --production windows-build-tools`.
   - **macOS:** Xcode Command Line Tools (`xcode-select --install`) and Python 3.
   - **Linux:** `sudo apt-get install build-essential libasound2-dev libavahi-compat-libdnssd-dev`.
5. **NewTek NDI 5/6 Runtime:** (Optional for local NDI testing; install *NDI Tools* from [ndi.video](https://ndi.video)).

---

## 2. Quickstart & Local Setup

```bash
# 1. Clone the repository
git clone https://github.com/sanctuary-app/sanctuary.git
cd sanctuary

# 2. Install dependencies with frozen lockfile
pnpm install

# 3. Rebuild native C++ addons for the exact Electron ABI
pnpm rebuild:electron

# 4. Download default offline Vosk speech model & seed database
pnpm db:seed

# 5. Launch the Electron development environment (Vite HMR + Electron Main)
pnpm dev
```

---

## 3. Project Directory Architecture

```
sanctuary/
├── docs/                       # Architectural and governance specifications
├── resources/                  # Static application icons, default models, seed Bibles
│   ├── bibles/                 # Seed SQLite databases (KJV, WEB)
│   ├── models/                 # Vosk offline acoustic models
│   └── icons/                  # Windows/Mac app icons
├── src/
│   ├── main/                   # Electron Main Process (Node.js 20 LTS)
│   │   ├── index.ts            # Main process entry point
│   │   ├── windows/            # Window lifecycle controllers (Operator, Output, NDI)
│   │   ├── ipc/                # Strongly-typed IPC handlers & Zod validation
│   │   ├── database/           # better-sqlite3 connection, migrations & repositories
│   │   ├── broadcast/          # NDI (grandiose) and OBS (obs-websocket-js) drivers
│   │   └── services/           # DisplayManager, PowerManager, HotkeyManager
│   │
│   ├── ai/                     # Dedicated AI Subsystem (Worker Process)
│   │   ├── worker.ts           # Speech worker entry point
│   │   ├── vad/                # WebRTC VAD audio filters
│   │   ├── vosk/               # Vosk speech recognizer wrapper
│   │   ├── parser/             # Scripture NLP reference extraction
│   │   └── commands/           # Voice navigation commands
│   │
│   ├── preload/                # Secure ContextBridge APIs
│   │   └── index.ts            # Exposes window.sanctuaryAPI
│   │
│   ├── renderer/               # Frontend React Application (Vite bundle)
│   │   ├── src/
│   │   │   ├── components/     # UI Design System components (Button, Modal, Card)
│   │   │   ├── features/       # Feature modules (Bible, Lyrics, Service, Media, AI)
│   │   │   ├── stores/         # State management stores (Zustand)
│   │   │   ├── routes/         # View routes (/operator, /output/projector, /output/stage)
│   │   │   └── hooks/          # Custom React hooks (useAudioCapture, useIPC)
│   │   └── index.html          # HTML Root
│   │
│   └── shared/                 # Shared TypeScript Definitions
│       ├── types/              # Domain entities (Song, Scripture, ServiceItem)
│       ├── ipc-channels.ts     # Type-safe IPC channels & event contracts
│       └── constants/          # Application constants & hotkey mappings
│
├── tests/                      # Automated test suites (Unit, Integration, E2E)
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.json5
```

---

## 4. How to Implement a New Feature (Standard Workflow)

To maintain clean separation of concerns, all new features follow this 5-step flow:

```
[1. Define Types in shared/] 
       │
       ▼
[2. Implement Database Schema & Repository in src/main/database/]
       │
       ▼
[3. Create Type-Safe IPC Handler with Zod in src/main/ipc/]
       │
       ▼
[4. Expose Method in src/preload/ & Connect Zustand Store in src/renderer/stores/]
       │
       ▼
[5. Build UI Components in src/renderer/features/]
```

### Step-by-Step Example: Adding a "Song Tags" Feature
1. **Define Contract (`src/shared/types/song.ts`):**
   ```typescript
   export interface SongTag {
     id: string;
     name: string;
     color: string;
   }
   ```
2. **Add IPC Channel (`src/shared/ipc-channels.ts`):**
   ```typescript
   export const IPC_SONGS_GET_TAGS = 'songs:get-tags' as const;
   ```
3. **Implement IPC Handler (`src/main/ipc/song-ipc.ts`):**
   ```typescript
   ipcMain.handle(IPC_SONGS_GET_TAGS, async () => {
     return songRepository.getAllTags();
   });
   ```
4. **Bind to Frontend Store (`src/renderer/stores/useSongStore.ts`):**
   ```typescript
   export const useSongStore = create<SongState>((set) => ({
     tags: [],
     fetchTags: async () => {
       const tags = await window.sanctuaryAPI.getSongTags();
       set({ tags });
     }
   }));
   ```
5. **Render in UI (`src/renderer/features/lyrics/SongTagPicker.tsx`):**
   Consume `useSongStore` and apply design system components.

---

## 5. Coding Standards & Style Guide

- **Strict TypeScript:** No `any` types permitted. Use explicit return types on all exported functions and API boundaries.
- **Pure Functions for Business Logic:** Keep NLP parsers, text normalizers, and formatting math 100% free of DOM or Electron dependencies so they can be unit-tested in isolation.
- **Component Design:** Use functional React components with hooks. Prefer composition over inheritance.
- **Class Naming:** Use Tailwind utility classes following the Design System tokens (`bg-surface-900`, `text-slate-100`, `border-border-subtle`).
- **Error Handling:** Always wrap IPC handlers and database transactions in structured try/catch blocks that return typed error results rather than unhandled promise rejections.

---

## 6. Git Workflow & Conventional Commits

We follow the [Conventional Commits](https://www.conventionalcommits.org/) standard. All commit messages must follow this structure:

```
<type>(<optional scope>): <description>

[optional body]
[optional footer(s)]
```

### 6.1 Allowed Commit Types
- `feat`: A new user-facing feature (e.g., `feat(bible): add multi-verse splitting engine`)
- `fix`: A bug fix (e.g., `fix(ndi): resolve 32-bit alpha channel tearing on OBS`)
- `docs`: Documentation changes only (e.g., `docs(arch): update NDI frame flow diagram`)
- `perf`: A code change that improves performance (e.g., `perf(fts5): optimize verse query index`)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build scripts, dependencies, or tooling configuration

### 6.2 Branching Strategy
- `main`: Production-ready, release-tagged branch.
- `develop`: Integration branch for upcoming minor/major releases.
- `feat/feature-name`: Feature branches created off `develop`.
- `fix/bug-name`: Bugfix branches.
