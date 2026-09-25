import { BibleProvider } from './BibleEngine';
import { BibleTranslation, BibleBook, BibleVerse, BibleSearchResult, BiblePassage } from '../../shared/types';
import { DatabaseService } from '../database/DatabaseService';
import { Logger } from '../services/Logger';
import { BOOK_ALIASES } from '../../shared/constants';

const logger = new Logger('SQLiteBibleProvider');

export class SQLiteBibleProvider implements BibleProvider {
  private db: DatabaseService;
  private translationId: string;
  private metadata: BibleTranslation | null = null;
  private cachedBooks: BibleBook[] | null = null;

  constructor(db: DatabaseService, translationId: string) {
    this.db = db;
    this.translationId = translationId;
  }

  getId(): string {
    return this.translationId;
  }

  getTranslation(): BibleTranslation {
    if (!this.metadata) {
      const row = this.db.queryOne<{
        id: string;
        name: string;
        abbreviation: string;
        language: string;
        copyright: string;
        is_public_domain: number;
      }>('SELECT * FROM bible_translations WHERE id = ?', [this.translationId]);

      if (!row) {
        throw new Error(`Translation ${this.translationId} not found in database`);
      }

      this.metadata = {
        id: row.id,
        name: row.name,
        abbreviation: row.abbreviation,
        language: row.language,
        copyright: row.copyright,
        isPublicDomain: row.is_public_domain === 1
      };
    }
    return this.metadata;
  }

  getBooks(): BibleBook[] {
    if (!this.cachedBooks) {
      const rows = this.db.query<{
        book_number: number;
        book_name: string;
        chapters: number;
      }>(
        `SELECT book_number, book_name, MAX(chapter) as chapters
         FROM verses 
         WHERE translation_id = ?
         GROUP BY book_number, book_name
         ORDER BY book_number`,
        [this.translationId]
      );

      this.cachedBooks = rows.map((row) => ({
        id: row.book_number,
        name: row.book_name,
        abbreviation: row.book_name.substring(0, 3), // Simplified, ideally we'd store abbreviations
        testament: row.book_number <= 39 ? 'OT' : 'NT',
        chapters: row.chapters
      }));
    }
    return this.cachedBooks;
  }

  getChapterCount(bookName: string): number {
    const canonicalName = this.normalizeBookName(bookName);
    const book = this.getBooks().find((b) => b.name === canonicalName);
    return book ? book.chapters : 0;
  }

  getVerses(bookName: string, chapter: number): BibleVerse[] {
    const canonicalName = this.normalizeBookName(bookName);
    const rows = this.db.query<{
      verse: number;
      text: string;
    }>(
      `SELECT verse, text 
       FROM verses 
       WHERE translation_id = ? AND book_name = ? AND chapter = ?
       ORDER BY verse`,
      [this.translationId, canonicalName, chapter]
    );

    return rows.map((row) => ({
      book: canonicalName,
      chapter,
      verse: row.verse,
      text: row.text
    }));
  }

  getVerse(bookName: string, chapter: number, verse: number): BibleVerse | null {
    const canonicalName = this.normalizeBookName(bookName);
    const row = this.db.queryOne<{ text: string }>(
      `SELECT text 
       FROM verses 
       WHERE translation_id = ? AND book_name = ? AND chapter = ? AND verse = ?`,
      [this.translationId, canonicalName, chapter, verse]
    );

    if (!row) return null;

    return {
      book: canonicalName,
      chapter,
      verse,
      text: row.text
    };
  }

  getPassage(bookName: string, chapter: number, verseStart: number, verseEnd: number): BiblePassage {
    const canonicalName = this.normalizeBookName(bookName);
    const rows = this.db.query<{
      verse: number;
      text: string;
    }>(
      `SELECT verse, text 
       FROM verses 
       WHERE translation_id = ? AND book_name = ? AND chapter = ? AND verse >= ? AND verse <= ?
       ORDER BY verse`,
      [this.translationId, canonicalName, chapter, verseStart, verseEnd]
    );

    const verses = rows.map((row) => ({
      book: canonicalName,
      chapter,
      verse: row.verse,
      text: row.text
    }));

    return {
      translationId: this.translationId,
      book: canonicalName,
      chapter,
      verseStart,
      verseEnd,
      reference: `${canonicalName} ${chapter}:${verseStart}${verseStart !== verseEnd ? '-' + verseEnd : ''}`,
      verses
    };
  }

  search(query: string, limit: number = 50): BibleSearchResult[] {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    // 1. Try to parse as a Bible reference (Highly robust)
    // Matches: "John 3:16", "1 John 3 16", "Song of Solomon 3v16-18", "1jn 3.16", "John 3"
    const refMatch = cleanQuery.match(/^(\d?\s*[a-zA-Z]+(?:\s+[a-zA-Z]+)*)\s+(\d+)(?:[:.v\s]+(\d+)(?:\s*-\s*(\d+))?)?\s*$/);
    if (refMatch) {
      const bookName = refMatch[1].trim();
      const chapter = parseInt(refMatch[2]);
      const verseStart = refMatch[3] ? parseInt(refMatch[3]) : null;
      const verseEnd = refMatch[4] ? parseInt(refMatch[4]) : verseStart;

      // Get correct book name from verses directly
      let bookRow = this.db.query<{ book_name: string }>(
        'SELECT DISTINCT book_name FROM verses WHERE translation_id = ? AND book_name COLLATE NOCASE = ? LIMIT 1', 
        [this.translationId, bookName]
      )[0];
      
      if (!bookRow) {
        bookRow = this.db.query<{ book_name: string }>(
          'SELECT DISTINCT book_name FROM verses WHERE translation_id = ? AND book_name LIKE ? LIMIT 1', 
          [this.translationId, bookName + '%']
        )[0];
      }
      
      if (bookRow) {
        let sql = `SELECT book_name, chapter, verse, text FROM verses WHERE translation_id = ? AND book_name = ? AND chapter = ?`;
        let params: any[] = [this.translationId, bookRow.book_name, chapter];
        
        if (verseStart) {
          sql += ` AND verse >= ? AND verse <= ?`;
          params.push(verseStart, verseEnd || verseStart);
        }
        
        const refRows = this.db.query<{
          book_name: string; chapter: number; verse: number; text: string;
        }>(sql, params);
        
        if (refRows.length > 0) {
          return refRows.map(row => ({
            verse: {
              book: row.book_name,
              chapter: row.chapter,
              verse: row.verse,
              text: row.text
            },
            relevance: 100, // Top relevance for exact reference matches
            translationId: this.translationId
          }));
        }
      }
    }

    // 2. Fall back to Full-Text Search (FTS5) for keywords
    // Remove special FTS chars to prevent column filter crashes
    const safeQuery = cleanQuery.replace(/["'()*^:]/g, '').trim();
    // Join words with AND and append * for prefix matching so "Jesus wept" -> "Jesus* AND wept*"
    const ftsQuery = safeQuery.split(/\s+/).filter(w => w.length > 0).map(w => w + '*').join(' AND ');

    if (!ftsQuery) return [];

    try {
      const rows = this.db.query<{
        book_name: string;
        chapter: number;
        verse: number;
        text: string;
        snippet: string;
        rank: number;
      }>(
        `SELECT v.book_name, v.chapter, v.verse, v.text, 
                snippet(verses_fts, -1, '<b>', '</b>', '...', 10) as snippet,
                f.rank
         FROM verses_fts f
         JOIN verses v ON f.rowid = v.id
         WHERE verses_fts MATCH ? AND v.translation_id = ?
         ORDER BY f.rank
         LIMIT ?`,
        [ftsQuery, this.translationId, limit]
      );

      return rows.map((row) => ({
        verse: {
          book: row.book_name,
          chapter: row.chapter,
          verse: row.verse,
          text: row.text
        },
        relevance: row.rank,
        translationId: this.translationId
      }));
    } catch (error) {
      logger.error('Search failed', { query, error: String(error) });
      return [];
    }
  }

  getVerseCount(bookName: string, chapter: number): number {
    const canonicalName = this.normalizeBookName(bookName);
    const row = this.db.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM verses 
       WHERE translation_id = ? AND book_name = ? AND chapter = ?`,
      [this.translationId, canonicalName, chapter]
    );
    return row?.count || 0;
  }

  /**
   * Helper to resolve aliases like '1 John' -> '1 John'
   * We use BOOK_ALIASES from constants.
   */
  private normalizeBookName(input: string): string {
    const lowerInput = input.trim().toLowerCase();
    
    // Exact match first
    const book = this.getBooks().find(b => b.name.toLowerCase() === lowerInput);
    if (book) return book.name;

    // Alias match
    const canonical = BOOK_ALIASES[lowerInput];
    if (canonical) {
      const aliasedBook = this.getBooks().find(b => b.name === canonical);
      if (aliasedBook) return aliasedBook.name;
    }

    // Fallback to original input if not found (might fail later, but safe)
    return input;
  }
}
