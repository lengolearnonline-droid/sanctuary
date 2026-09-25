// ============================================================
// Sanctuary — Database Schema & Migrations
// ============================================================

/**
 * All database migration scripts. Run sequentially by version number.
 * Never modify a migration after it's been released — create a new one.
 */
export interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

export const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: `
      -- =============================================
      -- Sanctuary Database Schema v1
      -- =============================================

      -- Enable WAL mode for better concurrency and crash recovery
      PRAGMA journal_mode=WAL;
      PRAGMA foreign_keys=ON;

      -- ---- Settings ----
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- ---- Bible Translations ----
      CREATE TABLE IF NOT EXISTS bible_translations (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        abbreviation TEXT NOT NULL,
        language TEXT NOT NULL DEFAULT 'en',
        copyright TEXT NOT NULL DEFAULT '',
        is_public_domain INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- ---- Bible Verses ----
      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        translation_id TEXT NOT NULL,
        book_name TEXT NOT NULL,
        book_number INTEGER NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text TEXT NOT NULL,
        FOREIGN KEY (translation_id) REFERENCES bible_translations(id) ON DELETE CASCADE,
        UNIQUE(translation_id, book_name, chapter, verse)
      );

      CREATE INDEX IF NOT EXISTS idx_verses_lookup
        ON verses(translation_id, book_name, chapter);
      CREATE INDEX IF NOT EXISTS idx_verses_book
        ON verses(translation_id, book_number);

      -- ---- Full-Text Search for Verses ----
      CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
        text,
        book_name,
        content='verses',
        content_rowid='id',
        tokenize='porter unicode61'
      );

      -- Triggers to keep FTS in sync
      CREATE TRIGGER IF NOT EXISTS verses_ai AFTER INSERT ON verses BEGIN
        INSERT INTO verses_fts(rowid, text, book_name) VALUES (new.id, new.text, new.book_name);
      END;

      CREATE TRIGGER IF NOT EXISTS verses_ad AFTER DELETE ON verses BEGIN
        INSERT INTO verses_fts(verses_fts, rowid, text, book_name) VALUES ('delete', old.id, old.text, old.book_name);
      END;

      CREATE TRIGGER IF NOT EXISTS verses_au AFTER UPDATE ON verses BEGIN
        INSERT INTO verses_fts(verses_fts, rowid, text, book_name) VALUES ('delete', old.id, old.text, old.book_name);
        INSERT INTO verses_fts(rowid, text, book_name) VALUES (new.id, new.text, new.book_name);
      END;

      -- ---- Services ----
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        date TEXT NOT NULL DEFAULT (date('now')),
        is_autosaved INTEGER NOT NULL DEFAULT 0,
        last_autosaved_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_services_date ON services(date);

      -- ---- Service Items ----
      CREATE TABLE IF NOT EXISTS service_items (
        id TEXT PRIMARY KEY NOT NULL,
        service_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        item_order INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL DEFAULT '{}',
        notes TEXT NOT NULL DEFAULT '',
        duration INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_service_items_service
        ON service_items(service_id, item_order);

      -- ---- Songs ----
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        artist TEXT NOT NULL DEFAULT '',
        author TEXT NOT NULL DEFAULT '',
        copyright TEXT NOT NULL DEFAULT '',
        ccli_number TEXT NOT NULL DEFAULT '',
        song_key TEXT NOT NULL DEFAULT '',
        language TEXT NOT NULL DEFAULT 'en',
        arrangement TEXT NOT NULL DEFAULT '[]',
        tags TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);

      -- ---- Song Sections ----
      CREATE TABLE IF NOT EXISTS song_sections (
        id TEXT PRIMARY KEY NOT NULL,
        song_id TEXT NOT NULL,
        type TEXT NOT NULL,
        label TEXT NOT NULL,
        lines TEXT NOT NULL DEFAULT '[]',
        section_order INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_song_sections_song
        ON song_sections(song_id, section_order);

      -- ---- Full-Text Search for Songs ----
      CREATE VIRTUAL TABLE IF NOT EXISTS songs_fts USING fts5(
        title,
        artist,
        content='songs',
        content_rowid='rowid',
        tokenize='porter unicode61'
      );

      -- ---- Media ----
      CREATE TABLE IF NOT EXISTS media (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        size INTEGER NOT NULL DEFAULT 0,
        duration REAL,
        width INTEGER,
        height INTEGER,
        thumbnail_path TEXT,
        mime_type TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL DEFAULT '[]',
        category TEXT NOT NULL DEFAULT 'uncategorized',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
      CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);

      -- ---- Themes ----
      CREATE TABLE IF NOT EXISTS themes (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        is_built_in INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- ---- Lower Thirds ----
      CREATE TABLE IF NOT EXISTS lower_thirds (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        template TEXT NOT NULL DEFAULT 'default',
        person_name TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL DEFAULT '',
        organization TEXT NOT NULL DEFAULT '',
        logo_path TEXT,
        data TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- ---- Output Configurations ----
      CREATE TABLE IF NOT EXISTS output_configs (
        id TEXT PRIMARY KEY NOT NULL,
        display_id TEXT NOT NULL,
        role TEXT NOT NULL,
        enabled INTEGER NOT NULL DEFAULT 1,
        resolution_width INTEGER NOT NULL DEFAULT 1920,
        resolution_height INTEGER NOT NULL DEFAULT 1080,
        fullscreen INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- ---- AI History ----
      CREATE TABLE IF NOT EXISTS ai_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        raw_text TEXT NOT NULL,
        parsed_result TEXT NOT NULL DEFAULT '{}',
        confidence REAL NOT NULL DEFAULT 0,
        action_taken TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_ai_history_date ON ai_history(created_at);

      -- ---- Favorites ----
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        reference TEXT NOT NULL,
        data TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        UNIQUE(type, reference)
      );

      -- ---- Recent Items ----
      CREATE TABLE IF NOT EXISTS recent_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        reference TEXT NOT NULL,
        data TEXT NOT NULL DEFAULT '{}',
        accessed_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_recent_items_accessed
        ON recent_items(accessed_at DESC);

      -- ---- Recovery ----
      CREATE TABLE IF NOT EXISTS recovery (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        service_data TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- ---- Schema Version ----
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `,
    down: `
      DROP TABLE IF EXISTS recovery;
      DROP TABLE IF EXISTS recent_items;
      DROP TABLE IF EXISTS favorites;
      DROP TABLE IF EXISTS ai_history;
      DROP TABLE IF EXISTS output_configs;
      DROP TABLE IF EXISTS lower_thirds;
      DROP TABLE IF EXISTS themes;
      DROP TABLE IF EXISTS media;
      DROP TABLE IF EXISTS songs_fts;
      DROP TABLE IF EXISTS song_sections;
      DROP TABLE IF EXISTS songs;
      DROP TABLE IF EXISTS service_items;
      DROP TABLE IF EXISTS services;
      DROP TRIGGER IF EXISTS verses_au;
      DROP TRIGGER IF EXISTS verses_ad;
      DROP TRIGGER IF EXISTS verses_ai;
      DROP TABLE IF EXISTS verses_fts;
      DROP TABLE IF EXISTS verses;
      DROP TABLE IF EXISTS bible_translations;
      DROP TABLE IF EXISTS settings;
      DROP TABLE IF EXISTS schema_version;
    `,
  },
];

/**
 * Default settings to insert after initial migration
 */
export const DEFAULT_SETTINGS: Record<string, { value: string; category: string }> = {
  'general.language': { value: 'en', category: 'general' },
  'general.autoSaveInterval': { value: '30', category: 'general' },
  'general.crashRecovery': { value: 'true', category: 'general' },
  'general.startMaximized': { value: 'true', category: 'general' },
  'general.confirmOnExit': { value: 'true', category: 'general' },
  'appearance.theme': { value: 'dark', category: 'appearance' },
  'appearance.accentColor': { value: '#6366f1', category: 'appearance' },
  'appearance.fontSize': { value: '14', category: 'appearance' },
  'bible.defaultTranslation': { value: 'web', category: 'bible' },
  'bible.showVerseNumbers': { value: 'true', category: 'bible' },
  'bible.paragraphMode': { value: 'false', category: 'bible' },
  'ai.enabled': { value: 'true', category: 'ai' },
  'ai.autoDisplayHighConfidence': { value: 'true', category: 'ai' },
  'ai.confidenceThreshold.auto': { value: '0.90', category: 'ai' },
  'ai.confidenceThreshold.suggest': { value: '0.70', category: 'ai' },
  'ai.voiceCommandsEnabled': { value: 'false', category: 'ai' },
  'ndi.enabled': { value: 'false', category: 'ndi' },
  'broadcast.obs.enabled': { value: 'false', category: 'broadcast' },
  'broadcast.obs.host': { value: 'localhost', category: 'broadcast' },
  'broadcast.obs.port': { value: '4455', category: 'broadcast' },
  'broadcast.vmix.enabled': { value: 'false', category: 'broadcast' },
  'updates.autoCheck': { value: 'true', category: 'updates' },
  'updates.channel': { value: 'stable', category: 'updates' },
};
