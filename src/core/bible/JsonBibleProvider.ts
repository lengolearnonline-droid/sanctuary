import fs from 'fs';
import { BibleProvider } from './BibleEngine';
import { BibleTranslation, BibleBook, BibleVerse, BibleSearchResult } from '../../shared/types';
import { Logger } from '../services/Logger';

const logger = new Logger('JsonBibleProvider');

interface JsonChapter {
  number: number;
  verses: { verse: number; text: string }[];
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

export class JsonBibleProvider implements BibleProvider {
  id: string;
  metadata: BibleTranslation;
  private data: JsonBibleData | null = null;
  private dataPath: string;

  constructor(dataPath: string, metadata: BibleTranslation) {
    this.dataPath = dataPath;
    this.id = metadata.id;
    this.metadata = metadata;
  }

  getId(): string { return this.id; }
  getTranslation(): BibleTranslation { return this.metadata; }

  load(): void {
    if (this.data) return;
    try {
      const raw = fs.readFileSync(this.dataPath, 'utf8');
      this.data = JSON.parse(raw);
    } catch (error) {
      this.data = { name: this.metadata.name, abbreviation: this.metadata.abbreviation, books: [] };
    }
  }

  getBooks(): BibleBook[] {
    this.load();
    let index = 1;
    return (this.data?.books || []).map((b) => ({
      id: index++,
      name: b.name,
      chapters: b.chapters.length,
      testament: 'OT',
      abbreviation: b.name.substring(0, 3)
    }));
  }

  getChapterCount(bookName: string): number {
    this.load();
    const book = this.data?.books.find((b) => b.name.toLowerCase() === bookName.toLowerCase());
    return book ? book.chapters.length : 0;
  }

  getVerses(bookName: string, chapter: number): BibleVerse[] {
    this.load();
    const book = this.data?.books.find((b) => b.name.toLowerCase() === bookName.toLowerCase());
    if (!book) return [];
    const chap = book.chapters.find((c) => c.number === chapter);
    if (!chap) return [];
    return chap.verses.map((v) => ({
      book: book.name,
      chapter,
      verse: v.verse,
      text: v.text
    }));
  }

  getVerse(bookName: string, chapter: number, verse: number): BibleVerse | null {
    const verses = this.getVerses(bookName, chapter);
    return verses.find((v) => v.verse === verse) || null;
  }

  getPassage(bookName: string, chapter: number, verseStart: number, verseEnd: number) {
    const all = this.getVerses(bookName, chapter);
    const filtered = all.filter((v) => v.verse >= verseStart && v.verse <= verseEnd);
    return {
      translationId: this.id,
      book: bookName,
      chapter,
      verseStart,
      verseEnd,
      reference: `${bookName} ${chapter}:${verseStart}-${verseEnd}`,
      verses: filtered
    };
  }

  search(query: string, limit: number = 50): BibleSearchResult[] {
    this.load();
    const results: BibleSearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    if (!this.data) return [];
    for (const book of this.data.books) {
      for (const chapter of book.chapters) {
        for (const verse of chapter.verses) {
          if (verse.text.toLowerCase().includes(lowerQuery)) {
            results.push({
              verse: {
                book: book.name,
                chapter: chapter.number,
                verse: verse.verse,
                text: verse.text
              },
              relevance: 1,
              translationId: this.id
            });
            if (results.length >= limit) return results;
          }
        }
      }
    }
    return results;
  }

  getVerseCount(bookName: string, chapter: number): number {
    return this.getVerses(bookName, chapter).length;
  }
}
