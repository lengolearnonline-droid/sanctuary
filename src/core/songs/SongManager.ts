import { DatabaseService } from '../database/DatabaseService';
import { Song, SongSection } from '../../shared/types';
import { Logger } from '../services/Logger';
import { randomUUID } from 'crypto';

const logger = new Logger('SongManager');

export class SongManager {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  /**
   * Create a new song with its sections
   */
  createSong(song: Omit<Song, 'id' | 'createdAt' | 'updatedAt' | 'sections'> & { 
    sections?: (Omit<SongSection, 'songId'> & { id?: string })[] 
  }): Song {
    const id = randomUUID();
    const now = new Date().toISOString();

    const newSong: Song = {
      ...song,
      id,
      sections: [], // Populated later if needed
      createdAt: now,
      updatedAt: now,
    };

    try {
      this.db.transaction(() => {
        // Insert main song record
        this.db.execute(
          `INSERT INTO songs (id, title, artist, author, copyright, ccli_number, song_key, language, arrangement, tags, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            song.title,
            song.artist || '',
            song.author || '',
            song.copyright || '',
            song.ccliNumber || '',
            song.key || '',
            song.language || 'en',
            JSON.stringify(song.arrangement || []),
            JSON.stringify(song.tags || []),
            now,
            now,
          ]
        );

        // Insert song sections
        if (song.sections && song.sections.length > 0) {
          const insertSection = this.db.getDatabase().prepare(
            `INSERT INTO song_sections (id, song_id, type, label, lines, section_order)
             VALUES (?, ?, ?, ?, ?, ?)`
          );

          song.sections.forEach((section, index) => {
            const sectionId = section.id || randomUUID();
            insertSection.run(
              sectionId,
              id,
              section.type,
              section.label,
              JSON.stringify(section.lines),
              section.order ?? index
            );
          });
        }
      });

      logger.info('Song created successfully', { id, title: song.title });
      return newSong;
    } catch (error) {
      logger.error('Failed to create song', { title: song.title, error: String(error) });
      throw error;
    }
  }

  /**
   * Retrieve a song by ID, including its sections
   */
  getSong(id: string): Song | null {
    const row = this.db.queryOne<{
      id: string;
      title: string;
      artist: string;
      author: string;
      copyright: string;
      ccli_number: string;
      song_key: string;
      language: string;
      arrangement: string;
      tags: string;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM songs WHERE id = ?', [id]);

    if (!row) return null;

    const sections = this.getSongSections(id);

    return {
      id: row.id,
      title: row.title,
      artist: row.artist,
      author: row.author,
      copyright: row.copyright,
      ccliNumber: row.ccli_number,
      key: row.song_key,
      language: row.language,
      arrangement: JSON.parse(row.arrangement),
      tags: JSON.parse(row.tags),
      sections,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Retrieve sections for a song
   */
  private getSongSections(songId: string): SongSection[] {
    const rows = this.db.query<{
      id: string;
      type: string;
      label: string;
      lines: string;
      section_order: number;
    }>(
      'SELECT * FROM song_sections WHERE song_id = ? ORDER BY section_order ASC',
      [songId]
    );

    return rows.map((row) => ({
      id: row.id,
      songId,
      type: row.type as SongSection['type'],
      label: row.label,
      lines: JSON.parse(row.lines),
      order: row.section_order,
    }));
  }

  /**
   * Update an existing song
   */
  updateSong(id: string, updates: Partial<Omit<Song, 'id' | 'createdAt'>>): Song {
    const existing = this.getSong(id);
    if (!existing) {
      throw new Error(`Song ${id} not found`);
    }

    const now = new Date().toISOString();
    const updated: Song = { ...existing, ...updates, updatedAt: now };

    try {
      this.db.transaction(() => {
        // Update main record
        this.db.execute(
          `UPDATE songs SET 
            title = ?, artist = ?, author = ?, copyright = ?, 
            ccli_number = ?, song_key = ?, language = ?, 
            arrangement = ?, tags = ?, updated_at = ?
           WHERE id = ?`,
          [
            updated.title,
            updated.artist,
            updated.author,
            updated.copyright,
            updated.ccliNumber,
            updated.key,
            updated.language,
            JSON.stringify(updated.arrangement),
            JSON.stringify(updated.tags),
            now,
            id,
          ]
        );

        // Update sections (simplest approach: delete and re-insert)
        if (updates.sections) {
          this.db.execute('DELETE FROM song_sections WHERE song_id = ?', [id]);
          
          const insertSection = this.db.getDatabase().prepare(
            `INSERT INTO song_sections (id, song_id, type, label, lines, section_order)
             VALUES (?, ?, ?, ?, ?, ?)`
          );

          updates.sections.forEach((section, index) => {
            const sectionId = section.id || randomUUID();
            insertSection.run(
              sectionId,
              id,
              section.type,
              section.label,
              JSON.stringify(section.lines),
              section.order ?? index
            );
          });
        }
      });

      logger.info('Song updated successfully', { id });
      return updated;
    } catch (error) {
      logger.error('Failed to update song', { id, error: String(error) });
      throw error;
    }
  }

  /**
   * Delete a song
   */
  deleteSong(id: string): void {
    try {
      // Cascades to song_sections due to FOREIGN KEY constraints
      this.db.execute('DELETE FROM songs WHERE id = ?', [id]);
      logger.info('Song deleted', { id });
    } catch (error) {
      logger.error('Failed to delete song', { id, error: String(error) });
      throw error;
    }
  }

  /**
   * Search songs with FTS5 or basic metadata search
   */
  searchSongs(query: string, limit: number = 20): Song[] {
    const safeQuery = query.replace(/["']/g, '');
    if (!safeQuery) {
      return this.listSongs(limit);
    }

    try {
      // Basic FTS matching on title and artist
      const ftsQuery = safeQuery.includes(' ') ? `"${safeQuery}"*` : `${safeQuery}*`;
      
      const rows = this.db.query<{ rowid: string }>(
        `SELECT rowid FROM songs_fts WHERE songs_fts MATCH ? ORDER BY rank LIMIT ?`,
        [ftsQuery, limit]
      );

      const songs: Song[] = [];
      for (const row of rows) {
        const song = this.getSong(row.rowid);
        if (song) songs.push(song);
      }

      return songs;
    } catch (error) {
      // Fallback to LIKE if FTS fails
      logger.warn('FTS5 search failed, falling back to LIKE query', { error: String(error) });
      const likeQuery = `%${safeQuery}%`;
      const rows = this.db.query<{ id: string }>(
        `SELECT id FROM songs WHERE title LIKE ? OR artist LIKE ? OR tags LIKE ? LIMIT ?`,
        [likeQuery, likeQuery, likeQuery, limit]
      );
      
      return rows.map((r) => this.getSong(r.id)!).filter(Boolean);
    }
  }

  /**
   * List recent songs
   */
  listSongs(limit: number = 20): Song[] {
    const rows = this.db.query<{ id: string }>(
      'SELECT id FROM songs ORDER BY updated_at DESC LIMIT ?',
      [limit]
    );
    return rows.map((r) => this.getSong(r.id)!).filter(Boolean);
  }
}
