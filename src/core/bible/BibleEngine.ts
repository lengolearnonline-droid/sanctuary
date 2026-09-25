// ============================================================
// Sanctuary — Bible Provider Interface & Implementation
// ============================================================

import type {
  BibleTranslation,
  BibleBook,
  BibleChapter,
  BibleVerse,
  BiblePassage,
  BibleSearchResult,
} from '../../shared/types';

/**
 * Abstract Bible provider interface.
 * All Bible data access goes through this interface,
 * enabling multiple translation backends (SQLite, API, file-based).
 */
export interface BibleProvider {
  /** Get provider identifier */
  getId(): string;

  /** Get translation metadata */
  getTranslation(): BibleTranslation;

  /** Get all books */
  getBooks(): BibleBook[];

  /** Get chapter count for a book */
  getChapterCount(bookName: string): number;

  /** Get all verses in a chapter */
  getVerses(bookName: string, chapter: number): BibleVerse[];

  /** Get a specific verse */
  getVerse(bookName: string, chapter: number, verse: number): BibleVerse | null;

  /** Get a passage (range of verses) */
  getPassage(
    bookName: string,
    chapter: number,
    verseStart: number,
    verseEnd: number
  ): BiblePassage;

  /** Search across all text */
  search(query: string, limit?: number): BibleSearchResult[];

  /** Get verse count for a chapter */
  getVerseCount(bookName: string, chapter: number): number;
}

/**
 * Bible Engine — manages multiple translations and provides
 * a unified API for Bible data access.
 */
export class BibleEngine {
  private providers: Map<string, BibleProvider> = new Map();
  private activeTranslationId: string | null = null;

  /**
   * Register a Bible translation provider
   */
  registerProvider(provider: BibleProvider): void {
    this.providers.set(provider.getId(), provider);
    if (!this.activeTranslationId) {
      this.activeTranslationId = provider.getId();
    }
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(id: string): void {
    this.providers.delete(id);
    if (this.activeTranslationId === id) {
      const first = this.providers.keys().next().value;
      this.activeTranslationId = first ?? null;
    }
  }

  /**
   * Get all available translations
   */
  getTranslations(): BibleTranslation[] {
    return Array.from(this.providers.values()).map((p) => p.getTranslation());
  }

  /**
   * Set the active translation
   */
  setActiveTranslation(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Bible translation '${id}' not found`);
    }
    this.activeTranslationId = id;
  }

  /**
   * Get the active translation ID
   */
  getActiveTranslationId(): string | null {
    return this.activeTranslationId;
  }

  /**
   * Get the active provider (throws if none active)
   */
  private getActiveProvider(): BibleProvider {
    if (!this.activeTranslationId) {
      throw new Error('No active Bible translation');
    }
    const provider = this.providers.get(this.activeTranslationId);
    if (!provider) {
      throw new Error(`Provider '${this.activeTranslationId}' not found`);
    }
    return provider;
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(id: string): BibleProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Get all books from the active translation
   */
  getBooks(): BibleBook[] {
    return this.getActiveProvider().getBooks();
  }

  /**
   * Get chapter count for a book
   */
  getChapterCount(bookName: string): number {
    return this.getActiveProvider().getChapterCount(bookName);
  }

  /**
   * Get verses for a chapter
   */
  getVerses(bookName: string, chapter: number): BibleVerse[] {
    return this.getActiveProvider().getVerses(bookName, chapter);
  }

  /**
   * Get a specific verse
   */
  getVerse(bookName: string, chapter: number, verse: number): BibleVerse | null {
    return this.getActiveProvider().getVerse(bookName, chapter, verse);
  }

  /**
   * Get a passage
   */
  getPassage(
    bookName: string,
    chapter: number,
    verseStart: number,
    verseEnd: number
  ): BiblePassage {
    return this.getActiveProvider().getPassage(bookName, chapter, verseStart, verseEnd);
  }

  /**
   * Search the active translation
   */
  search(query: string, limit: number = 50): BibleSearchResult[] {
    return this.getActiveProvider().search(query, limit);
  }

  /**
   * Get verse count for a chapter
   */
  getVerseCount(bookName: string, chapter: number): number {
    return this.getActiveProvider().getVerseCount(bookName, chapter);
  }

  /**
   * Check if any translation is loaded
   */
  hasTranslations(): boolean {
    return this.providers.size > 0;
  }
}
