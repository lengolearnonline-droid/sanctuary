import { Database } from 'better-sqlite3';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import path from 'path';

const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra", "Nehemiah",
  "Esther", "Job", "Psalms", "Proverbs", "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah",
  "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos", "Obadiah", "Jonah", "Micah",
  "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation"
];

export class BibleImporter {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async importXml(filePath: string): Promise<string> {
    const xmlData = fs.readFileSync(filePath, 'utf-8');
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });
    
    const jObj = parser.parse(xmlData);
    if (!jObj || !jObj.bible) {
      throw new Error("Invalid Bible XML format. Missing <bible> tag.");
    }

    const rawTranslationName = jObj.bible['@_translation'] || path.parse(filePath).name;
    const translationId = rawTranslationName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check if it already exists to skip massive loops on startup
    const existing = this.db.prepare('SELECT id FROM bible_translations WHERE id = ?').get(translationId);
    if (existing) {
      return `Translation '${rawTranslationName}' is already imported.`;
    }

    // Smart Abbreviation logic
    let abbr = rawTranslationName.replace(/English|Bible/ig, '').trim();
    if (abbr.length === 0) abbr = rawTranslationName;
    if (abbr.toUpperCase() !== abbr) {
      const words = abbr.split(/[\s-_]+/);
      if (words.length > 1) {
        abbr = words.map((w: string) => w[0]?.toUpperCase()).join('').substring(0, 5);
      } else {
        abbr = abbr.substring(0, 4).toUpperCase();
      }
    } else {
      abbr = abbr.substring(0, 5);
    }

    // Create translation record
    const insertTranslation = this.db.prepare(`
      INSERT OR REPLACE INTO bible_translations (id, name, abbreviation, language)
      VALUES (?, ?, ?, 'en')
    `);
    
    const insertVerse = this.db.prepare(`
      INSERT OR IGNORE INTO verses (translation_id, book_name, book_number, chapter, verse, text)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Run in a transaction for extreme speed
    const importTransaction = this.db.transaction(() => {
      insertTranslation.run(translationId, rawTranslationName, abbr);

      const testaments = Array.isArray(jObj.bible.testament) ? jObj.bible.testament : [jObj.bible.testament];
      
      let insertedCount = 0;

      for (const test of testaments) {
        if (!test) continue;
        const books = Array.isArray(test.book) ? test.book : [test.book];
        
        for (const b of books) {
          if (!b) continue;
          
          let bookNumberStr = b['@_number'];
          let bookNumber = parseInt(bookNumberStr, 10);
          
          // Old Testament is 1-39, New Testament is 40-66 (or sometimes numbered 1-27).
          if (test['@_name'] === 'New' && bookNumber < 40) {
            bookNumber += 39; 
          }
          
          let bookName = b['@_name'];
          if (!bookName && BIBLE_BOOKS[bookNumber - 1]) {
            bookName = BIBLE_BOOKS[bookNumber - 1];
          }

          if (!bookName) continue;

          const chapters = Array.isArray(b.chapter) ? b.chapter : [b.chapter];
          for (const c of chapters) {
            if (!c) continue;
            const chapterNum = parseInt(c['@_number'], 10);
            
            const verses = Array.isArray(c.verse) ? c.verse : [c.verse];
            for (const v of verses) {
              if (!v) continue;
              const verseNum = parseInt(v['@_number'], 10);
              let text = v['#text'];
              if (typeof text !== 'string') {
                 text = v['#text'] || String(v) || "";
              }
              
              if (text && text !== '[object Object]') {
                insertVerse.run(translationId, bookName, bookNumber, chapterNum, verseNum, text);
                insertedCount++;
              }
            }
          }
        }
      }
      return insertedCount;
    });

    const totalVerses = importTransaction();
    return `Imported ${totalVerses} verses into '${rawTranslationName}'.`;
  }
}
