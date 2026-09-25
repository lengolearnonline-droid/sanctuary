// ============================================================
// Sanctuary — Database Service
// ============================================================
//
// Manages SQLite database lifecycle, migrations, and provides
// typed query methods. Uses better-sqlite3 for synchronous,
// high-performance SQLite access in the Electron main process.
//

import path from 'path';
import fs from 'fs';
import type Database from 'better-sqlite3';
import { MIGRATIONS, DEFAULT_SETTINGS } from './migrations';
import { Logger } from '../services/Logger';

const logger = new Logger('Database');

/**
 * DatabaseService — singleton managing the SQLite database
 */
export class DatabaseService {
  private db: Database.Database | null = null;
  private dbPath: string;
  private isInitialized = false;

  constructor(dataDirectory: string) {
    // Ensure data directory exists
    if (!fs.existsSync(dataDirectory)) {
      fs.mkdirSync(dataDirectory, { recursive: true });
    }
    this.dbPath = path.join(dataDirectory, 'sanctuary.db');
  }

  /**
   * Initialize the database: open connection, run migrations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Dynamic import to avoid bundling issues
      const BetterSqlite3 = require('better-sqlite3');
      this.db = new BetterSqlite3(this.dbPath) as Database.Database;

      // Enable WAL mode for concurrent reads and crash recovery
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('busy_timeout = 5000');

      // Run migrations
      this.runMigrations();

      // Insert default settings if first run
      this.seedDefaults();

      this.isInitialized = true;
      logger.info('Database initialized', { path: this.dbPath });
    } catch (error) {
      logger.error('Failed to initialize database', { error: String(error) });
      throw error;
    }
  }

  /**
   * Run pending migrations
   */
  private runMigrations(): void {
    if (!this.db) throw new Error('Database not open');

    // Ensure schema_version table exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // Get current version
    const row = this.db.prepare(
      'SELECT MAX(version) as version FROM schema_version'
    ).get() as { version: number | null } | undefined;

    const currentVersion = row?.version ?? 0;

    // Apply pending migrations
    const pending = MIGRATIONS.filter((m) => m.version > currentVersion);

    if (pending.length === 0) {
      logger.debug('No pending migrations');
      return;
    }

    for (const migration of pending) {
      logger.info(`Applying migration ${migration.version}: ${migration.name}`);

      const transaction = this.db.transaction(() => {
        // Run the migration SQL
        this.db!.exec(migration.up);

        // Record the migration
        this.db!.prepare(
          'INSERT INTO schema_version (version, name) VALUES (?, ?)'
        ).run(migration.version, migration.name);
      });

      try {
        transaction();
        logger.info(`Migration ${migration.version} applied successfully`);
      } catch (error) {
        logger.error(`Migration ${migration.version} failed`, {
          error: String(error),
        });
        throw error;
      }
    }
  }

  /**
   * Seed default settings (only if settings table is empty)
   */
  private seedDefaults(): void {
    if (!this.db) return;

    const count = this.db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number };
    if (count.count > 0) return;

    const insert = this.db.prepare(
      'INSERT OR IGNORE INTO settings (key, value, category) VALUES (?, ?, ?)'
    );

    const transaction = this.db.transaction(() => {
      for (const [key, { value, category }] of Object.entries(DEFAULT_SETTINGS)) {
        insert.run(key, value, category);
      }
    });

    transaction();
    logger.info('Default settings seeded');
  }

  /**
   * Get the raw database instance (for advanced queries)
   */
  getDatabase(): Database.Database {
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  /**
   * Execute a query that returns rows
   */
  query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.prepare(sql).all(...params) as T[];
  }

  /**
   * Execute a query that returns a single row
   */
  queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.prepare(sql).get(...params) as T | undefined;
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  execute(sql: string, params: unknown[] = []): Database.RunResult {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.prepare(sql).run(...params);
  }

  /**
   * Run multiple statements in a transaction
   */
  transaction<T>(fn: () => T): T {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.transaction(fn)();
  }

  /**
   * Get a setting value
   */
  getSetting(key: string): string | null {
    const row = this.queryOne<{ value: string }>(
      'SELECT value FROM settings WHERE key = ?',
      [key]
    );
    return row?.value ?? null;
  }

  /**
   * Set a setting value
   */
  setSetting(key: string, value: string, category: string = 'general'): void {
    this.execute(
      `INSERT INTO settings (key, value, category, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      [key, value, category]
    );
  }

  /**
   * Create a backup of the database
   */
  async backup(backupDir: string): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `sanctuary-backup-${timestamp}.db`);

    return new Promise((resolve, reject) => {
      try {
        this.db!.backup(backupPath)
          .then(() => {
            logger.info('Database backup created', { path: backupPath });
            resolve(backupPath);
          })
          .catch(reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Save recovery data for crash recovery
   */
  saveRecoveryData(sessionId: string, serviceData: string): void {
    this.execute(
      `INSERT INTO recovery (session_id, service_data) VALUES (?, ?)`,
      [sessionId, serviceData]
    );

    // Keep only the last 5 recovery entries
    this.execute(
      `DELETE FROM recovery WHERE id NOT IN (
        SELECT id FROM recovery ORDER BY created_at DESC LIMIT 5
      )`
    );
  }

  /**
   * Get the latest recovery data
   */
  getLatestRecovery(): { sessionId: string; serviceData: string; createdAt: string } | null {
    const row = this.queryOne<{
      session_id: string;
      service_data: string;
      created_at: string;
    }>('SELECT session_id, service_data, created_at FROM recovery ORDER BY created_at DESC LIMIT 1');

    if (!row) return null;

    return {
      sessionId: row.session_id,
      serviceData: row.service_data,
      createdAt: row.created_at,
    };
  }

  /**
   * Add to recent items
   */
  addRecentItem(type: string, reference: string, data: Record<string, unknown> = {}): void {
    this.execute(
      `INSERT INTO recent_items (type, reference, data, accessed_at)
       VALUES (?, ?, ?, datetime('now'))`,
      [type, reference, JSON.stringify(data)]
    );

    // Keep only last 50 recent items
    this.execute(
      `DELETE FROM recent_items WHERE id NOT IN (
        SELECT id FROM recent_items ORDER BY accessed_at DESC LIMIT 50
      )`
    );
  }

  /**
   * Get recent items
   */
  getRecentItems(type?: string, limit: number = 20): Array<{
    type: string;
    reference: string;
    data: Record<string, unknown>;
    accessedAt: string;
  }> {
    const sql = type
      ? 'SELECT * FROM recent_items WHERE type = ? ORDER BY accessed_at DESC LIMIT ?'
      : 'SELECT * FROM recent_items ORDER BY accessed_at DESC LIMIT ?';

    const params = type ? [type, limit] : [limit];
    const rows = this.query<{
      type: string;
      reference: string;
      data: string;
      accessed_at: string;
    }>(sql, params);

    return rows.map((row) => ({
      type: row.type,
      reference: row.reference,
      data: JSON.parse(row.data),
      accessedAt: row.accessed_at,
    }));
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
      logger.info('Database closed');
    }
  }
}
