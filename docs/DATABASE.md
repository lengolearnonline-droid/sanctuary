# Database Architecture & Schema Specification
# Sanctuary — AI-Powered Church Presentation & Broadcast System

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Database Engine:** SQLite 3 (via `better-sqlite3`)  
**Storage Architecture:** Embedded Local Single-File Database with Write-Ahead Logging (WAL)  

---

## 1. Storage Configuration & PRAGMA Optimizations

To ensure sub-millisecond query latency, zero UI thread blocking, and crash resistance during live worship services, Sanctuary applies the following database connection pragmas immediately upon initialization:

```sql
-- 1. Enable Write-Ahead Logging for high-concurrency read/write throughput
PRAGMA journal_mode = WAL;

-- 2. Synchronous NORMAL balances maximum durability with sub-millisecond writes in WAL mode
PRAGMA synchronous = NORMAL;

-- 3. Enforce relational foreign key constraints
PRAGMA foreign_keys = ON;

-- 4. Set 64MB memory cache for instant query responses (negative value = KiB)
PRAGMA cache_size = -64000;

-- 5. Store temporary tables and indexes in RAM
PRAGMA temp_store = MEMORY;

-- 6. Set busy timeout to 5000ms to prevent lock contention errors
PRAGMA busy_timeout = 5000;
```

---

## 2. Complete Relational Schema (DDL)

```sql
-- ============================================================================
-- 1. SERVICES & SERVICE PLANNING
-- ============================================================================

CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,                       -- UUID v4
    title TEXT NOT NULL,                      -- e.g., 'Sunday Morning Worship'
    service_date TEXT NOT NULL,               -- ISO 8601 string: 'YYYY-MM-DD'
    notes TEXT,                               -- Service-level notes or pastoral instructions
    is_archived INTEGER NOT NULL DEFAULT 0,   -- 0 = active, 1 = archived
    created_at TEXT NOT NULL,                 -- ISO 8601 timestamp
    updated_at TEXT NOT NULL                  -- ISO 8601 timestamp
);

CREATE TABLE IF NOT EXISTS service_items (
    id TEXT PRIMARY KEY,                       -- UUID v4
    service_id TEXT NOT NULL,                 -- Foreign key to services(id)
    item_type TEXT NOT NULL,                  -- 'song' | 'scripture' | 'media' | 'lower_third' | 'timer' | 'header'
    title TEXT NOT NULL,                      -- Display title in timeline
    sequence_order INTEGER NOT NULL,          -- 0-indexed position in service order
    data_json TEXT NOT NULL,                  -- Serialized payload (Song ID, Verse range, Media path, etc.)
    duration_seconds INTEGER DEFAULT 0,       -- Planned duration in seconds
    notes TEXT,                               -- Operator cue notes (e.g., "Fade music before video")
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_service_items_service_seq 
ON service_items (service_id, sequence_order);


-- ============================================================================
-- 2. BIBLE TRANSLATIONS, BOOKS, CHAPTERS & VERSES
-- ============================================================================

CREATE TABLE IF NOT EXISTS bible_translations (
    id TEXT PRIMARY KEY,                       -- e.g., 'WEB', 'KJV', 'ESV'
    code TEXT NOT NULL UNIQUE,                -- Standard abbreviation
    name TEXT NOT NULL,                       -- 'World English Bible'
    language TEXT NOT NULL DEFAULT 'en',      -- ISO 639-1 language code
    publisher TEXT,                           -- Publisher name
    copyright TEXT,                           -- Copyright notice or 'Public Domain'
    is_default INTEGER NOT NULL DEFAULT 0,    -- 1 = default translation
    is_installed INTEGER NOT NULL DEFAULT 1,  -- 1 = ready for offline use
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS books (
    id TEXT PRIMARY KEY,                       -- e.g., 'WEB_GEN'
    translation_id TEXT NOT NULL,             -- Foreign key to bible_translations(id)
    book_number INTEGER NOT NULL,             -- Canonical index: 1 (Gen) to 66 (Rev)
    name TEXT NOT NULL,                       -- 'Genesis'
    short_name TEXT NOT NULL,                 -- 'Gen'
    testament TEXT NOT NULL,                  -- 'OT' | 'NT' | 'AP'
    chapter_count INTEGER NOT NULL,           -- Total chapters in book
    FOREIGN KEY (translation_id) REFERENCES bible_translations(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_books_translation_number 
ON books (translation_id, book_number);

CREATE TABLE IF NOT EXISTS chapters (
    id TEXT PRIMARY KEY,                       -- e.g., 'WEB_GEN_1'
    book_id TEXT NOT NULL,                    -- Foreign key to books(id)
    chapter_number INTEGER NOT NULL,          -- Chapter number: 1..N
    verse_count INTEGER NOT NULL,             -- Total verses in chapter
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chapters_book_number 
ON chapters (book_id, chapter_number);

CREATE TABLE IF NOT EXISTS verses (
    id TEXT PRIMARY KEY,                       -- e.g., 'WEB_GEN_1_1'
    chapter_id TEXT NOT NULL,                 -- Foreign key to chapters(id)
    verse_number INTEGER NOT NULL,            -- Verse number: 1..N
    text TEXT NOT NULL,                       -- Exact scripture text
    text_normalized TEXT NOT NULL,            -- Lowercased, stripped punctuation for rapid NLP matching
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_verses_chapter_verse 
ON verses (chapter_id, verse_number);


-- ============================================================================
-- 3. WORSHIP SONGS & ARRANGEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS songs (
    id TEXT PRIMARY KEY,                       -- UUID v4
    title TEXT NOT NULL,                      -- 'Way Maker'
    artist TEXT,                              -- 'Sinach / Leeland'
    author TEXT,                              -- Songwriter name(s)
    copyright TEXT,                           -- Copyright string
    ccli_number TEXT,                         -- CCLI Song ID
    key_signature TEXT DEFAULT 'C',           -- 'C', 'G', 'D', 'Eb', etc.
    tempo INTEGER DEFAULT 72,                 -- BPM
    time_signature TEXT DEFAULT '4/4',        -- '4/4', '3/4', '6/8'
    default_arrangement TEXT,                 -- Comma-separated section IDs (e.g., 'V1,C,V2,C,B,C')
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_songs_title ON songs (title COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS song_sections (
    id TEXT PRIMARY KEY,                       -- UUID v4
    song_id TEXT NOT NULL,                    -- Foreign key to songs(id)
    section_type TEXT NOT NULL,               -- 'verse' | 'chorus' | 'bridge' | 'pre_chorus' | 'tag' | 'outro'
    section_label TEXT NOT NULL,              -- 'Verse 1', 'Chorus 1', 'Bridge'
    sequence_order INTEGER NOT NULL,          -- Default physical order in editor
    content TEXT NOT NULL,                    -- Raw lyrics text with line breaks
    chords TEXT,                              -- ChordPro formatted text or chord overlay JSON
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_song_sections_song_seq 
ON song_sections (song_id, sequence_order);


-- ============================================================================
-- 4. MEDIA ASSETS & PRESENTATION THEMES
-- ============================================================================

CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,                       -- UUID v4
    filename TEXT NOT NULL,                   -- 'ocean_motion_loop.mp4'
    filepath TEXT NOT NULL UNIQUE,            -- Absolute local filesystem path
    file_type TEXT NOT NULL,                  -- 'video' | 'image' | 'audio'
    mime_type TEXT NOT NULL,                  -- 'video/mp4', 'image/png'
    file_size_bytes INTEGER NOT NULL,         -- File size
    duration_seconds REAL DEFAULT 0.0,        -- Video/Audio length in seconds
    thumbnail_path TEXT,                      -- Path to generated low-res preview image
    metadata_json TEXT,                       -- JSON with resolution, bitrate, audio channels
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS themes (
    id TEXT PRIMARY KEY,                       -- UUID v4
    name TEXT NOT NULL UNIQUE,                -- 'Modern Dark Worship', 'Scripture Gold'
    is_default INTEGER NOT NULL DEFAULT 0,
    background_type TEXT NOT NULL,            -- 'color' | 'gradient' | 'media'
    background_media_id TEXT,                 -- Optional FK to media(id)
    background_color TEXT DEFAULT '#090A0F',  -- Hex or RGBA
    font_family TEXT DEFAULT 'Inter',         -- Font family name
    font_size_pt INTEGER DEFAULT 48,          -- Point size for main screen
    font_color TEXT DEFAULT '#FFFFFF',        -- Font hex
    text_align TEXT DEFAULT 'center',         -- 'left' | 'center' | 'right'
    text_shadow TEXT DEFAULT '0 4px 12px rgba(0,0,0,0.8)',
    lower_third_layout_json TEXT,             -- Broadcast lower-third coordinate mapping
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (background_media_id) REFERENCES media(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS lower_thirds (
    id TEXT PRIMARY KEY,                       -- UUID v4
    theme_id TEXT NOT NULL,                   -- Foreign key to themes(id)
    template_name TEXT NOT NULL,              -- 'Speaker Name & Title', 'Scripture Subtitle'
    title_template TEXT NOT NULL,             -- 'Pastor {{name}}'
    subtitle_template TEXT,                   -- '{{title}} | {{series}}'
    animation_in TEXT DEFAULT 'fade-slide-up',-- 'fade' | 'slide-left' | 'fade-slide-up'
    animation_out TEXT DEFAULT 'fade-slide-down',
    position_y REAL DEFAULT 0.85,             -- Vertical position (0.0 top to 1.0 bottom)
    config_json TEXT NOT NULL,                -- Custom colors, badge icons, border styles
    FOREIGN KEY (theme_id) REFERENCES themes(id) ON DELETE CASCADE
);


-- ============================================================================
-- 5. SYSTEM SETTINGS & OUTPUT HARDWARE CONFIGURATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,                     -- 'app.theme', 'ai.auto_live_threshold'
    value TEXT NOT NULL,                      -- Stringified scalar or JSON
    data_type TEXT NOT NULL,                  -- 'string' | 'number' | 'boolean' | 'json'
    category TEXT NOT NULL,                   -- 'general' | 'ai' | 'broadcast' | 'display'
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS output_configs (
    id TEXT PRIMARY KEY,                       -- UUID v4
    name TEXT NOT NULL,                       -- 'Sanctuary Main Projector', 'Stage Foldback'
    display_target TEXT NOT NULL,             -- 'projector' | 'stage' | 'ndi'
    screen_id TEXT,                           -- Electron display ID or EDID string
    resolution_width INTEGER NOT NULL,        -- 1920
    resolution_height INTEGER NOT NULL,       -- 1080
    is_enabled INTEGER NOT NULL DEFAULT 1,
    ndi_source_name TEXT,                     -- 'SANCTUARY-PROGRAM', 'SANCTUARY-LOWER-THIRDS'
    ndi_alpha INTEGER NOT NULL DEFAULT 1,     -- 1 = 32-bit Alpha enabled
    config_json TEXT NOT NULL                 -- Output margins, overscan, color profile
);


-- ============================================================================
-- 6. AI LOGS, RECENT ITEMS & FAVORITES
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_history (
    id TEXT PRIMARY KEY,                       -- UUID v4
    timestamp TEXT NOT NULL,                  -- ISO 8601 timestamp
    transcript_raw TEXT NOT NULL,             -- Raw recognized speech text
    detected_intent TEXT NOT NULL,            -- 'SCRIPTURE_REFERENCE' | 'VOICE_COMMAND' | 'NONE'
    detected_reference TEXT,                  -- 'John 3:16'
    confidence_score REAL NOT NULL,           -- 0.000 to 1.000
    action_taken TEXT NOT NULL,               -- 'AUTO_LIVE' | 'SUGGESTION_SHOWN' | 'IGNORED'
    execution_status TEXT NOT NULL            -- 'SUCCESS' | 'DISMISSED' | 'FAILED'
);

CREATE INDEX IF NOT EXISTS idx_ai_history_timestamp 
ON ai_history (timestamp DESC);

CREATE TABLE IF NOT EXISTS favorites (
    id TEXT PRIMARY KEY,                       -- UUID v4
    item_type TEXT NOT NULL,                  -- 'song' | 'verse' | 'theme' | 'media'
    item_id TEXT NOT NULL,                    -- ID of favorite item
    label TEXT NOT NULL,                      -- Friendly display name
    created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_type_item 
ON favorites (item_type, item_id);

CREATE TABLE IF NOT EXISTS recent_items (
    id TEXT PRIMARY KEY,                       -- UUID v4
    item_type TEXT NOT NULL,                  -- 'song' | 'verse' | 'media'
    item_id TEXT NOT NULL,
    last_accessed_at TEXT NOT NULL,
    access_count INTEGER NOT NULL DEFAULT 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_recent_type_item 
ON recent_items (item_type, item_id);
```

---

## 3. Full-Text Search (FTS5) Virtual Tables

To enable sub-millisecond phrase search for songs and scripture across millions of words, Sanctuary implements SQLite FTS5 virtual tables with content synchronization triggers:

```sql
-- Full Text Search for Bible Verses
CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
    verse_id UNINDEXED,
    translation_code UNINDEXED,
    book_name,
    chapter_number UNINDEXED,
    verse_number UNINDEXED,
    text,
    tokenize = 'porter unicode61'
);

-- Full Text Search for Songs
CREATE VIRTUAL TABLE IF NOT EXISTS songs_fts USING fts5(
    song_id UNINDEXED,
    title,
    artist,
    content,
    tokenize = 'porter unicode61'
);

-- Automatic FTS Triggers for Verses
CREATE TRIGGER IF NOT EXISTS trg_verses_ai AFTER INSERT ON verses BEGIN
    INSERT INTO verses_fts(verse_id, translation_code, book_name, chapter_number, verse_number, text)
    SELECT new.id, t.code, b.name, c.chapter_number, new.verse_number, new.text
    FROM chapters c
    JOIN books b ON c.book_id = b.id
    JOIN bible_translations t ON b.translation_id = t.id
    WHERE c.id = new.chapter_id;
END;

CREATE TRIGGER IF NOT EXISTS trg_verses_ad AFTER DELETE ON verses BEGIN
    DELETE FROM verses_fts WHERE verse_id = old.id;
END;
```

---

## 4. Migration Strategy & Version Management

Sanctuary utilizes SQLite’s native `PRAGMA user_version` to track and apply atomic schema migrations at application startup.

### 4.1 Migration Runner Architecture
```typescript
interface Migration {
  version: number;
  name: string;
  up: (db: Database.Database) => void;
}

export function runMigrations(db: Database.Database, migrations: Migration[]): void {
  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      db.transaction(() => {
        migration.up(db);
        db.pragma(`user_version = ${migration.version}`);
      })();
    }
  }
}
```

---

## 5. Automated Backup & Disaster Recovery Strategy

To ensure churches never lose service data or customized song libraries, Sanctuary executes zero-downtime online backups:

1. **Pre-Service Automatic Snapshot:** Prior to entering Live Presentation mode, Sanctuary calls `better-sqlite3`'s native `.backup()` API to snapshot `sanctuary.sqlite` to `backups/sanctuary-pre-service-YYYYMMDD-HHMM.sqlite`.
2. **Weekly Rotation Policy:** Maintains the last 10 pre-service snapshots, rotating out older archives automatically.
3. **Database Integrity Verification:** On cold boot, Sanctuary runs `PRAGMA integrity_check(1);`. If corruption is detected, it automatically restores the most recent valid backup and alerts the operator.
