# Comprehensive Quality Assurance & Testing Strategy
# Sanctuary — AI-Powered Church Presentation & Broadcast System

**Document Version:** 1.0.0  
**Status:** Approved Quality Assurance Standard  
**Test Runners:** Vitest (Unit/Integration), React Testing Library (Components), Playwright (E2E)  
**Target Coverage:** ≥ 85% Core Logic, ≥ 95% AI Parser & DB Migrations  

---

## 1. Testing Philosophy & Test Pyramid

Sanctuary is a mission-critical live production tool; a crash during a Sunday morning service disrupts the entire congregation. Our QA strategy employs a multi-tiered test pyramid to guarantee zero regressions, deterministic database integrity, and high-precision speech parsing.

```
                   /\
                  /  \
                 / E2E\            Playwright Electron E2E Tests
                /------\           (Operator flows, Display routing, NDI)
               / Integr \          IPC Integration, SQLite Transactions,
              /----------\         better-sqlite3 Migrations
             / Component  \        React Testing Library, DOM Themes,
            /--------------\       Slide Cards, Timers, Dialogs
           /   Unit Tests   \      Vitest Pure Functions, NLP Parsers,
          /------------------\     Scripture Trie, State Stores, Utilities
```

---

## 2. Testing Tiers & Framework Architecture

| Test Level | Tooling | Scope / Target | Execution Speed |
| :--- | :--- | :--- | :--- |
| **Unit Testing** | `Vitest` | Scripture normalizer, NLP parser, state stores, Bible search indexing | < 5ms per test |
| **Component Testing** | `React Testing Library` + `jsdom` | Button states, SlideCard, Preview/Program monitors, Audio VU meters | < 50ms per test |
| **Integration Testing** | `Vitest` + in-memory SQLite | IPC handler validation, database queries, migration rollbacks | < 150ms per test |
| **AI Corpus Testing** | `Vitest` + Audio fixtures | 120+ spoken phrase corpus against NLP parser and Vosk worker | < 2s full suite |
| **E2E Testing** | `Playwright` + Electron | Multi-window launch, slide advance, hotkeys, blackout recovery | ~15s full suite |
| **Performance Benchmarks**| Benchmark suite + Chromium profiler| 60 FPS render timing, DB query response time (<2ms) | Pre-release |

---

## 3. Directory Layout & Test Naming Conventions

All tests are colocated or placed within dedicated `tests/` directories matching their respective layers:

```
src/
├── ai/
│   ├── parser/
│   │   ├── scripture-parser.ts
│   │   └── scripture-parser.spec.ts     # Unit tests for parser
│   └── tests/
│       └── corpus/
│           ├── scripture-corpus.json     # 120+ spoken test cases
│           └── corpus.spec.ts           # Corpus validation runner
├── renderer/
│   └── components/
│       ├── Button.tsx
│       └── Button.test.tsx              # Component tests
└── shared/
    └── utils/
        ├── text-normalizer.ts
        └── text-normalizer.spec.ts      # Unit tests
tests/
├── e2e/                                 # Playwright End-to-End Tests
│   ├── app-launch.e2e.ts
│   ├── presentation-flow.e2e.ts
│   └── multi-display.e2e.ts
├── integration/                         # IPC & Database Integration Tests
│   ├── database-migrations.test.ts
│   └── ipc-contracts.test.ts
└── performance/                         # Benchmark Benchmarks
    └── render-loop.bench.ts
```

---

## 4. AI & Scripture Reference Test Corpus

To ensure high-accuracy scripture detection across varied preaching styles, dialects, and colloquial phrasings, Sanctuary maintains a 120+ sentence golden evaluation corpus:

```json
[
  {
    "input": "please open your bibles to the book of romans chapter eight verse twenty-eight",
    "expected": {
      "book": "Romans",
      "bookNumber": 45,
      "chapter": 8,
      "verseStart": 28,
      "verseEnd": null,
      "minConfidence": 0.90
    }
  },
  {
    "input": "turn with me to first corinthians thirteen verses four through eight",
    "expected": {
      "book": "1 Corinthians",
      "bookNumber": 46,
      "chapter": 13,
      "verseStart": 4,
      "verseEnd": 8,
      "minConfidence": 0.90
    }
  },
  {
    "input": "in psalm twenty three the lord is my shepherd",
    "expected": {
      "book": "Psalms",
      "bookNumber": 19,
      "chapter": 23,
      "verseStart": 1,
      "verseEnd": null,
      "minConfidence": 0.85
    }
  },
  {
    "input": "we are going to have dinner at six thirty tonight",
    "expected": null
  }
]
```

### 4.1 Automated Corpus Test Runner
```typescript
// src/ai/tests/corpus.spec.ts
import { describe, it, expect } from 'vitest';
import { ScriptureParser } from '../parser/scripture-parser';
import corpusData from './corpus/scripture-corpus.json';

describe('Scripture NLP Parser Golden Corpus', () => {
  const parser = new ScriptureParser();

  corpusData.forEach((testCase, idx) => {
    it(`Case #${idx + 1}: "${testCase.input}"`, () => {
      const result = parser.parse(testCase.input);

      if (testCase.expected === null) {
        expect(result).toBeNull();
      } else {
        expect(result).not.toBeNull();
        expect(result?.book).toBe(testCase.expected.book);
        expect(result?.chapter).toBe(testCase.expected.chapter);
        expect(result?.verseStart).toBe(testCase.expected.verseStart);
        if (testCase.expected.verseEnd) {
          expect(result?.verseEnd).toBe(testCase.expected.verseEnd);
        }
        expect(result?.confidence).toBeGreaterThanOrEqual(testCase.expected.minConfidence);
      }
    });
  });
});
```

---

## 5. End-to-End (E2E) Testing with Playwright

Playwright tests launch the packaged or development Electron application to simulate realistic volunteer operator workflows:

```typescript
// tests/e2e/presentation-flow.e2e.ts
import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

let app: ElectronApplication;
let firstWindow: Page;

test.beforeAll(async () => {
  app = await electron.launch({
    args: [path.join(__dirname, '../../dist/main/index.js')]
  });
  firstWindow = await app.firstWindow();
  await firstWindow.waitForLoadState('domcontentloaded');
});

test.afterAll(async () => {
  await app.close();
});

test('Operator can search for a scripture verse and project it live', async () => {
  // 1. Press F1 or click search input
  const searchInput = firstWindow.locator('[data-testid="quick-search-input"]');
  await searchInput.fill('John 3:16');
  await searchInput.press('Enter');

  // 2. Verify verse result card is populated
  const verseCard = firstWindow.locator('[data-testid="verse-result-card"]').first();
  await expect(verseCard).toContainText('For God so loved the world');

  // 3. Click "Take Live" button or press F5
  const liveButton = firstWindow.locator('[data-testid="take-live-btn"]');
  await liveButton.click();

  // 4. Verify Program Monitor reflects live state
  const programMonitor = firstWindow.locator('[data-testid="program-monitor-view"]');
  await expect(programMonitor).toContainText('John 3:16');
});
```

---

## 6. Continuous Integration (CI) Pipeline & Coverage Gates

All pull requests must pass the automated GitHub Actions CI pipeline across Windows and macOS before merging into `main`:

```yaml
name: Sanctuary CI Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: Test & Lint (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ windows-latest, macos-latest ]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js 20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install Dependencies & Native Addons
        run: pnpm install --frozen-lockfile

      - name: Lint Codebase & Typecheck
        run: |
          pnpm lint
          pnpm typecheck

      - name: Run Unit & Integration Tests (Coverage)
        run: pnpm test:coverage

      - name: Enforce Coverage Thresholds
        run: pnpm vitest run --coverage.thresholds.lines=85

      - name: Run Playwright E2E Tests
        run: pnpm test:e2e
```
