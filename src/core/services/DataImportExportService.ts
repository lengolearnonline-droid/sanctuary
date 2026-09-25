// ============================================================
// Sanctuary — Data Import/Export Engine
// ============================================================
//
// Handles importing from OpenLP, CCLI SongSelect text, USFM Bibles,
// and creating/restoring backups.
//

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';
import { DatabaseService } from '../database/DatabaseService';
import { Logger } from './Logger';
import { app } from 'electron';
import { generateId } from '../../shared/utils';

const logger = new Logger('DataImportExport');

export class DataImportExportService {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Import songs from an OpenLP v2/v3 SQLite database
   * OpenLP stores songs in a `songs` table with title, lyrics (XML or plain), etc.
   */
  public async importFromOpenLP(sqliteFilePath: string): Promise<number> {
    logger.info(`Starting OpenLP import from ${sqliteFilePath}`);
    let importedCount = 0;
    let openlpDb: any = null;

    try {
      openlpDb = new Database(sqliteFilePath, { readonly: true });
      
      // Check if it's a valid OpenLP db by checking for songs table
      const tableCheck = openlpDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='songs'").get();
      if (!tableCheck) {
        throw new Error('Not a valid OpenLP database (missing songs table)');
      }

      const songs = openlpDb.prepare('SELECT title, lyrics, search_title, alternate_title FROM songs').all();
      
      this.db.transaction(() => {
        for (const song of songs as any[]) {
          let extractedLyrics = song.lyrics || '';
          
          if (extractedLyrics.includes('<?xml')) {
            const matches = [...extractedLyrics.matchAll(/<!\[CDATA\[(.*?)\]\]>/gs)];
            if (matches.length > 0) {
              extractedLyrics = matches.map(m => m[1]).join('\n\n');
            } else {
              extractedLyrics = extractedLyrics.replace(/<[^>]*>?/gm, '\n').replace(/\n\s*\n/g, '\n\n').trim();
            }
          }

          const id = generateId();
          this.db.execute(
            `INSERT INTO songs (id, title, lyrics, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
            [id, song.title || 'Untitled', extractedLyrics, new Date().toISOString(), new Date().toISOString()]
          );
          importedCount++;
        }
      });

      logger.info(`Successfully imported ${importedCount} songs from OpenLP`);
      return importedCount;
    } catch (e: any) {
      logger.error('Failed to import from OpenLP', { error: e.message });
      throw e;
    } finally {
      if (openlpDb) openlpDb.close();
    }
  }

  /**
   * Import a song from a CCLI SongSelect text file.
   */
  public async importFromCCLI(txtFilePath: string): Promise<boolean> {
    try {
      const content = fs.readFileSync(txtFilePath, 'utf8');
      const lines = content.split(/\r?\n/);
      
      let title = 'Imported CCLI Song';
      let lyrics = '';
      
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() !== '') {
          title = lines[i].trim();
          lyrics = lines.slice(i + 1).join('\n').trim();
          break;
        }
      }

      this.db.execute(
        `INSERT INTO songs (id, title, lyrics, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [generateId(), title, lyrics, new Date().toISOString(), new Date().toISOString()]
      );

      return true;
    } catch (e: any) {
      logger.error('Failed to import CCLI txt', { error: e.message });
      throw e;
    }
  }

  /**
   * Import USFM Bible file (.usfm or .txt)
   */
  public async importUSFMBible(usfmFilePath: string, translationId: string, translationName: string): Promise<boolean> {
    try {
      const content = fs.readFileSync(usfmFilePath, 'utf8');
      
      this.db.execute(
        `INSERT OR IGNORE INTO bible_translations (id, name) VALUES (?, ?)`,
        [translationId, translationName]
      );

      const lines = content.split(/\r?\n/);
      let currentBook = '';
      let currentChapter = 1;

      this.db.transaction(() => {
        for (const line of lines) {
          if (line.startsWith('\\id ')) {
            currentBook = line.substring(4).split(' ')[0].trim();
            this.db.execute(
              `INSERT OR IGNORE INTO books (id, name, translation_id) VALUES (?, ?, ?)`,
              [currentBook, currentBook, translationId]
            );
          } else if (line.startsWith('\\c ')) {
            currentChapter = parseInt(line.substring(3).trim(), 10) || currentChapter;
          } else if (line.startsWith('\\v ')) {
            const verseMatch = line.match(/\\v\s+(\d+)\s+(.*)/);
            if (verseMatch && currentBook) {
              const verseNum = parseInt(verseMatch[1], 10);
              const text = verseMatch[2].replace(/\\p|\\q|\\m/g, '').trim();
              
              this.db.execute(
                `INSERT INTO verses (id, book_id, chapter, verse, text, translation_id)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [`${translationId}-${currentBook}-${currentChapter}-${verseNum}`, currentBook, currentChapter, verseNum, text, translationId]
              );
            }
          }
        }
      });

      return true;
    } catch (e: any) {
      logger.error('Failed to parse USFM', { error: e.message });
      throw e;
    }
  }

  /**
   * Create a full database backup copy
   */
  public async createBackup(targetDir: string): Promise<string> {
    try {
      const backupPath = await this.db.backup(targetDir);
      logger.info(`Backup created successfully at ${backupPath}`);
      return backupPath;
    } catch (e: any) {
      logger.error('Backup failed', { error: e.message });
      throw e;
    }
  }

  /**
   * Restore database from backup.
   * Requires app restart afterwards.
   */
  public async restoreBackup(backupFilePath: string): Promise<boolean> {
    try {
      const dbPath = path.join(app.getPath('userData'), 'sanctuary.db');
      
      this.db.close();
      fs.copyFileSync(backupFilePath, dbPath);
      
      logger.info('Database restored successfully from backup. App restart required.');
      return true;
    } catch (e: any) {
      logger.error('Restore failed', { error: e.message });
      throw e;
    }
  }
}
