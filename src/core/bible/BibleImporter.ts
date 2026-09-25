import fs from 'fs';
import { DatabaseService } from '../database/DatabaseService';
import { Logger } from '../services/Logger';

const logger = new Logger('BibleImporter');

interface JsonVerse {
  verse: number;
  text: string;
}

interface JsonChapter {
  number: number;
  verses: JsonVerse[];
}

interface JsonBook {
  name: string;
  chapters: JsonChapter[];
}

interface JsonBibleData {
  name: string;
  abbreviation: string;
  books: JsonBook[];
}

export class BibleImporter {
  private db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  async importFromJsonFile(
    translationId: string,
    filePath: string,
    language: string = 'en',
    copyright: string = '',
    isPublicDomain: boolean = true
  ): Promise<void> {
    logger.info(`Starting import of translation ${translationId} from ${filePath}`);
    
    // Check if translation already exists
    const existing = this.db.queryOne('SELECT id FROM bible_translations WHERE id = ?', [translationId]);
    if (existing) {
      logger.info(`Translation ${translationId} already exists. Skipping import.`);
      return;
    }

    try {
      const rawData = await fs.promises.readFile(filePath, 'utf8');
      const data: JsonBibleData = JSON.parse(rawData);

      this.db.transaction(() => {
        // 1. Insert Translation metadata
        this.db.execute(
          `INSERT INTO bible_translations (id, name, abbreviation, language, copyright, is_public_domain) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [translationId, data.name, data.abbreviation || translationId.toUpperCase(), language, copyright, isPublicDomain ? 1 : 0]
        );

        // 2. Prepare statement for bulk inserts
        const insertVerse = this.db.getDatabase().prepare(
          `INSERT INTO verses (translation_id, book_name, book_number, chapter, verse, text) 
           VALUES (?, ?, ?, ?, ?, ?)`
        );

        let bookNumber = 1;
        let verseCount = 0;

        for (const book of data.books) {
          for (const chapter of book.chapters) {
            for (const verse of chapter.verses) {
              insertVerse.run(
                translationId,
                book.name,
                bookNumber,
                chapter.number,
                verse.verse,
                verse.text
              );
              verseCount++;
            }
          }
          bookNumber++;
        }

        logger.info(`Successfully imported ${verseCount} verses for ${translationId}`);
      });
    } catch (error) {
      logger.error(`Failed to import translation ${translationId}`, { error: String(error) });
      throw error;
    }
  }
}
