// ============================================================
// Sanctuary — AI Scripture Reference Parser
// ============================================================
//
// This is one of the most important features of the application.
// It takes natural language text (from speech-to-text or typed input)
// and extracts Bible references with confidence scoring.
//
// Supports:
// - "John 3:16"
// - "John chapter 3 verse 16"
// - "John chapter three verse sixteen"
// - "John three sixteen"
// - "First Corinthians thirteen"
// - "Romans chapter eight verses twenty-eight through thirty"
// - "Psalm twenty-three"
// - Contextual continuation: "verse 5" (uses current book/chapter)
// - Abbreviated book names
// - Ordinal book prefixes ("First", "Second", "Third")
//

import type { ScriptureReference, AIConfidenceLevel } from '../../shared/types';
import { BOOK_ALIASES, WORD_TO_NUMBER, ORDINAL_TO_NUMBER, BIBLE_BOOKS } from '../../shared/constants';

// ---- Internal Types ----

interface ParseContext {
  currentBook: string | null;
  currentChapter: number | null;
}

interface ParseResult {
  reference: ScriptureReference | null;
  updatedContext: ParseContext;
}

// ---- Number Word Parsing ----

/**
 * Convert a spoken number word or phrase to a numeric value.
 * Handles: "one", "twenty-three", "one hundred and forty-three", etc.
 */
export function parseSpokenNumber(text: string): number | null {
  const trimmed = text.trim().toLowerCase();

  // Direct numeric
  const direct = parseInt(trimmed, 10);
  if (!isNaN(direct)) return direct;

  // Direct lookup
  if (WORD_TO_NUMBER[trimmed] !== undefined) return WORD_TO_NUMBER[trimmed];
  if (ORDINAL_TO_NUMBER[trimmed] !== undefined) return ORDINAL_TO_NUMBER[trimmed];

  // Compound number parsing: "one hundred and forty three"
  const words = trimmed.replace(/\band\b/g, '').split(/\s+/).filter(Boolean);

  let result = 0;
  let current = 0;

  for (const word of words) {
    const val = WORD_TO_NUMBER[word] ?? ORDINAL_TO_NUMBER[word];
    if (val === undefined) return null;

    if (val === 100) {
      current = (current === 0 ? 1 : current) * 100;
    } else if (val >= 1000) {
      current = (current === 0 ? 1 : current) * val;
      result += current;
      current = 0;
    } else {
      current += val;
    }
  }

  result += current;
  return result > 0 ? result : null;
}

// ---- Book Name Resolution ----

/**
 * All valid book names (canonical + aliases), pre-computed for performance
 */
const CANONICAL_BOOKS: string[] = BIBLE_BOOKS.map((b) => b.name);

/**
 * Resolve a book name from text input. Handles aliases, abbreviations,
 * case-insensitive matching, and ordinal prefixes.
 */
export function resolveBookName(input: string): string | null {
  const normalized = input.trim().toLowerCase();

  // Direct match against canonical names
  for (const book of CANONICAL_BOOKS) {
    if (book.toLowerCase() === normalized) return book;
  }

  // Alias lookup
  if (BOOK_ALIASES[normalized]) return BOOK_ALIASES[normalized];

  // Handle "the book of X" / "the gospel of X" / "the gospel according to X"
  const bookOfMatch = normalized.match(
    /^(?:the\s+)?(?:book\s+of|gospel\s+of|gospel\s+according\s+to|epistle\s+(?:of|to))\s+(.+)$/
  );
  if (bookOfMatch) {
    return resolveBookName(bookOfMatch[1]);
  }

  // Handle ordinal prefix: "first corinthians" -> "1 Corinthians"
  for (const [ordinal, num] of Object.entries(ORDINAL_TO_NUMBER)) {
    if (num <= 3 && normalized.startsWith(ordinal + ' ')) {
      const rest = normalized.slice(ordinal.length + 1);
      const candidate = `${num} ${rest.charAt(0).toUpperCase()}${rest.slice(1)}`;
      const resolved = resolveBookName(candidate);
      if (resolved) return resolved;
    }
  }

  // Fuzzy: try prefix matching against canonical names
  const prefixMatches = CANONICAL_BOOKS.filter((b) =>
    b.toLowerCase().startsWith(normalized)
  );
  if (prefixMatches.length === 1) return prefixMatches[0];

  return null;
}

// ---- Reference Pattern Matching ----

// Precompiled book name pattern (sorted by length desc to match longest first)
const allBookNames = [
  ...CANONICAL_BOOKS.map((b) => b.toLowerCase()),
  ...Object.keys(BOOK_ALIASES),
].sort((a, b) => b.length - a.length);

const bookPattern = allBookNames.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

// Number words pattern
const numberWords = Object.keys(WORD_TO_NUMBER)
  .sort((a, b) => b.length - a.length)
  .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const ordinalWords = Object.keys(ORDINAL_TO_NUMBER)
  .sort((a, b) => b.length - a.length)
  .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

// Number matching: digits or word numbers
const numPattern = `(?:\\d+|${numberWords}|${ordinalWords})`;

/**
 * Build all regex patterns for scripture reference detection.
 * Patterns ordered by specificity (most specific first) for better matching.
 */
function buildPatterns(): RegExp[] {
  // Pattern 1: "Book C:V-V" — e.g., "John 3:16-18"
  const p1 = new RegExp(
    `(${bookPattern})\\s+(${numPattern})\\s*[:\\.]\\s*(${numPattern})(?:\\s*[-–—]\\s*(${numPattern}))?`,
    'i'
  );

  // Pattern 2: "Book chapter C verse(s) V (through/to V)"
  const p2 = new RegExp(
    `(${bookPattern})\\s+chapter\\s+(${numPattern})\\s+verses?\\s+(${numPattern})(?:\\s+(?:through|to|thru|-)\\s+(${numPattern}))?`,
    'i'
  );

  // Pattern 3: "Book chapter C" (whole chapter)
  const p3 = new RegExp(
    `(${bookPattern})\\s+chapter\\s+(${numPattern})`,
    'i'
  );

  // Pattern 4: "Book C V" — e.g., "John three sixteen"
  // Only when numbers are word-numbers (to avoid false "John 3 16" from intent)
  const p4 = new RegExp(
    `(${bookPattern})\\s+(${numPattern})\\s+(${numPattern})(?:\\s+(?:through|to|thru|-)\\s+(${numPattern}))?`,
    'i'
  );

  // Pattern 5: "Book C" — e.g., "Psalm twenty-three" (single chapter book or chapter ref)
  const p5 = new RegExp(
    `(${bookPattern})\\s+(${numPattern})`,
    'i'
  );

  // Pattern 6: Contextual — "verse(s) V (through V)"
  const p6 = new RegExp(
    `(?:^|\\s)verses?\\s+(${numPattern})(?:\\s+(?:through|to|thru|-)\\s+(${numPattern}))?`,
    'i'
  );

  // Pattern 7: Contextual — "chapter C verse V"
  const p7 = new RegExp(
    `chapter\\s+(${numPattern})\\s+verses?\\s+(${numPattern})(?:\\s+(?:through|to|thru|-)\\s+(${numPattern}))?`,
    'i'
  );

  return [p1, p2, p3, p4, p5, p6, p7];
}

const PATTERNS = buildPatterns();

// ---- Preprocessing ----

/**
 * Normalize text for parsing. Remove filler words, normalize spacing,
 * handle common speech-to-text artifacts.
 */
export function normalizeText(input: string): string {
  let text = input.toLowerCase().trim();

  // Remove common filler words/phrases
  const fillers = [
    'please turn to',
    'let us turn to',
    "let's turn to",
    'let us go to',
    "let's go to",
    'turn with me to',
    'open your bibles to',
    'please open',
    'if you would turn to',
    'we find in',
    'it says in',
    'we read in',
    'as we see in',
    'the bible says in',
    'as it is written in',
    'the scripture says',
    'please turn your bibles to',
  ];

  for (const filler of fillers) {
    text = text.replace(new RegExp(filler, 'gi'), '');
  }

  // Normalize "st" "nd" "rd" "th" suffixes on numbers
  text = text.replace(/(\d+)(?:st|nd|rd|th)\b/g, '$1');

  // Normalize spacing
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

// ---- Core Parser ----

/**
 * Parse a scripture reference from natural language text.
 *
 * @param input - Raw text input (from STT or typed)
 * @param context - Current context (active book/chapter for continuation)
 * @returns ParseResult with extracted reference and updated context
 */
export function parseScriptureReference(
  input: string,
  context: ParseContext = { currentBook: null, currentChapter: null }
): ParseResult {
  const normalized = normalizeText(input);

  if (!normalized) {
    return { reference: null, updatedContext: context };
  }

  // Try each pattern in order of specificity
  // Pattern 1: "Book C:V-V"
  let match = PATTERNS[0].exec(normalized);
  if (match) {
    const book = resolveBookName(match[1]);
    const chapter = parseSpokenNumber(match[2]);
    const verseStart = parseSpokenNumber(match[3]);
    const verseEnd = match[4] ? parseSpokenNumber(match[4]) : null;

    if (book && chapter && verseStart) {
      const verses = buildVerseRange(verseStart, verseEnd);
      const confidence = calculateConfidence(book, chapter, verses, normalized);
      return {
        reference: {
          book,
          chapter,
          verses,
          confidence,
          rawText: input,
        },
        updatedContext: { currentBook: book, currentChapter: chapter },
      };
    }
  }

  // Pattern 2: "Book chapter C verse(s) V (through V)"
  match = PATTERNS[1].exec(normalized);
  if (match) {
    const book = resolveBookName(match[1]);
    const chapter = parseSpokenNumber(match[2]);
    const verseStart = parseSpokenNumber(match[3]);
    const verseEnd = match[4] ? parseSpokenNumber(match[4]) : null;

    if (book && chapter && verseStart) {
      const verses = buildVerseRange(verseStart, verseEnd);
      const confidence = calculateConfidence(book, chapter, verses, normalized, true);
      return {
        reference: {
          book,
          chapter,
          verses,
          confidence,
          rawText: input,
        },
        updatedContext: { currentBook: book, currentChapter: chapter },
      };
    }
  }

  // Pattern 7: "chapter C verse V" (contextual with book from context)
  match = PATTERNS[6].exec(normalized);
  if (match && context.currentBook) {
    const chapter = parseSpokenNumber(match[1]);
    const verseStart = parseSpokenNumber(match[2]);
    const verseEnd = match[3] ? parseSpokenNumber(match[3]) : null;

    if (chapter && verseStart) {
      const verses = buildVerseRange(verseStart, verseEnd);
      const confidence = calculateConfidence(
        context.currentBook, chapter, verses, normalized, true
      ) * 0.9; // Slight reduction for contextual
      return {
        reference: {
          book: context.currentBook,
          chapter,
          verses,
          confidence,
          rawText: input,
        },
        updatedContext: { currentBook: context.currentBook, currentChapter: chapter },
      };
    }
  }

  // Pattern 3: "Book chapter C" (whole chapter)
  match = PATTERNS[2].exec(normalized);
  if (match) {
    const book = resolveBookName(match[1]);
    const chapter = parseSpokenNumber(match[2]);

    if (book && chapter) {
      const confidence = calculateConfidence(book, chapter, [1], normalized, true) * 0.95;
      return {
        reference: {
          book,
          chapter,
          verses: [], // Empty = whole chapter
          confidence,
          rawText: input,
        },
        updatedContext: { currentBook: book, currentChapter: chapter },
      };
    }
  }

  // Pattern 4: "Book C V(-V)" — e.g., "John three sixteen"
  match = PATTERNS[3].exec(normalized);
  if (match) {
    const book = resolveBookName(match[1]);
    const chapter = parseSpokenNumber(match[2]);
    const verseStart = parseSpokenNumber(match[3]);
    const verseEnd = match[4] ? parseSpokenNumber(match[4]) : null;

    if (book && chapter && verseStart) {
      const verses = buildVerseRange(verseStart, verseEnd);
      // Lower confidence because "Book num num" is more ambiguous
      const confidence = calculateConfidence(book, chapter, verses, normalized) * 0.85;
      return {
        reference: {
          book,
          chapter,
          verses,
          confidence,
          rawText: input,
        },
        updatedContext: { currentBook: book, currentChapter: chapter },
      };
    }
  }

  // Pattern 5: "Book C" — could be chapter only or single-chapter book verse
  match = PATTERNS[4].exec(normalized);
  if (match) {
    const book = resolveBookName(match[1]);
    const num = parseSpokenNumber(match[2]);

    if (book && num) {
      // Check if single-chapter book (Obadiah, Philemon, 2 John, 3 John, Jude)
      const bookInfo = BIBLE_BOOKS.find(
        (b) => b.name === book
      );
      if (bookInfo && bookInfo.chapters === 1) {
        // Single-chapter book: number is a verse reference
        return {
          reference: {
            book,
            chapter: 1,
            verses: [num],
            confidence: calculateConfidence(book, 1, [num], normalized) * 0.9,
            rawText: input,
          },
          updatedContext: { currentBook: book, currentChapter: 1 },
        };
      }

      // Multi-chapter book: number is chapter
      const confidence = calculateConfidence(book, num, [], normalized) * 0.8;
      return {
        reference: {
          book,
          chapter: num,
          verses: [], // Whole chapter
          confidence,
          rawText: input,
        },
        updatedContext: { currentBook: book, currentChapter: num },
      };
    }
  }

  // Pattern 6: Contextual — "verse(s) V (through V)"
  match = PATTERNS[5].exec(normalized);
  if (match && context.currentBook && context.currentChapter) {
    const verseStart = parseSpokenNumber(match[1]);
    const verseEnd = match[2] ? parseSpokenNumber(match[2]) : null;

    if (verseStart) {
      const verses = buildVerseRange(verseStart, verseEnd);
      return {
        reference: {
          book: context.currentBook,
          chapter: context.currentChapter,
          verses,
          confidence: 0.75, // Lower confidence for purely contextual
          rawText: input,
        },
        updatedContext: context,
      };
    }
  }

  // No match found
  return { reference: null, updatedContext: context };
}

// ---- Confidence Scoring ----

/**
 * Calculate confidence score for a detected reference.
 * Factors:
 * - Is the book name unambiguous?
 * - Are chapter/verse numbers within valid ranges?
 * - Was explicit structure used ("chapter", "verse" keywords)?
 * - How much noise was in the original text?
 */
function calculateConfidence(
  book: string,
  chapter: number,
  verses: number[],
  normalizedText: string,
  hasExplicitKeywords: boolean = false
): number {
  let confidence = 0.7; // Base confidence

  // Book resolution confidence
  const bookInfo = BIBLE_BOOKS.find((b) => b.name === book);
  if (!bookInfo) return 0.3;

  // Valid chapter range
  if (chapter >= 1 && chapter <= bookInfo.chapters) {
    confidence += 0.1;
  } else {
    confidence -= 0.3; // Invalid chapter is a strong negative signal
  }

  // Explicit keywords boost
  if (hasExplicitKeywords) {
    confidence += 0.1;
  }

  // Having verse numbers is a positive signal
  if (verses.length > 0) {
    confidence += 0.05;
    // Verse range should be reasonable (1-180ish for Psalm 119)
    if (verses.every((v) => v >= 1 && v <= 180)) {
      confidence += 0.05;
    } else {
      confidence -= 0.2;
    }
  }

  // Text length: very short or very long text is less reliable
  const textLength = normalizedText.length;
  if (textLength < 5) confidence -= 0.1;
  if (textLength > 200) confidence -= 0.05;

  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, confidence));
}

/**
 * Get the confidence level category
 */
export function getConfidenceLevel(
  score: number,
  autoThreshold: number = 0.90,
  suggestThreshold: number = 0.70
): AIConfidenceLevel {
  if (score >= autoThreshold) return 'high';
  if (score >= suggestThreshold) return 'medium';
  return 'low';
}

// ---- Helpers ----

/**
 * Build an array of verse numbers from a start and optional end
 */
function buildVerseRange(start: number, end: number | null): number[] {
  if (!end || end <= start) return [start];
  const verses: number[] = [];
  for (let v = start; v <= end; v++) {
    verses.push(v);
  }
  return verses;
}

/**
 * Create a fresh parse context
 */
export function createContext(
  book: string | null = null,
  chapter: number | null = null
): ParseContext {
  return { currentBook: book, currentChapter: chapter };
}

/**
 * Batch parse: extract all scripture references from a block of text
 */
export function parseAllReferences(
  text: string,
  context?: ParseContext
): ScriptureReference[] {
  const references: ScriptureReference[] = [];
  let ctx = context || createContext();

  // Split on sentence boundaries
  const sentences = text.split(/[.!?;]+/).filter((s) => s.trim().length > 0);

  for (const sentence of sentences) {
    const result = parseScriptureReference(sentence.trim(), ctx);
    if (result.reference) {
      references.push(result.reference);
      ctx = result.updatedContext;
    }
  }

  return references;
}
