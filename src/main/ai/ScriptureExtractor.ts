// ============================================================
// Sanctuary — Scripture NLP & Reference Extractor
// ============================================================
//
// Extracts Bible references from raw speech transcripts using
// colloquial normalization and regex-based DFA parsing.
//

export interface ExtractedReference {
  book: string;
  chapter: number;
  verse?: number;
  endVerse?: number;
  confidence: number; // 0.0 to 1.0
  rawText: string;
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  first: 1, second: 2, third: 3, fourth: 4, fifth: 5,
  "1st": 1, "2nd": 2, "3rd": 3, "4th": 4, "5th": 5, "sencond": 2, "thrid": 3,
};

const BIBLE_BOOKS = [
  "genesis", "exodus", "leviticus", "numbers", "deuteronomy", "joshua", "judges", "ruth", "1 samuel", "2 samuel",
  "1 kings", "2 kings", "1 chronicles", "2 chronicles", "ezra", "nehemiah", "esther", "job", "psalms", "psalm", "proverbs",
  "ecclesiastes", "song of solomon", "isaiah", "jeremiah", "lamentations", "ezekiel", "daniel", "hosea", "joel",
  "amos", "obadiah", "jonah", "micah", "nahum", "habakkuk", "zephaniah", "haggai", "zechariah", "malachi",
  "matthew", "mark", "luke", "john", "acts", "romans", "1 corinthians", "2 corinthians", "galatians", "ephesians",
  "philippians", "colossians", "1 thessalonians", "2 thessalonians", "1 timothy", "2 timothy", "titus", "philemon",
  "hebrews", "james", "1 peter", "2 peter", "1 john", "2 john", "3 john", "jude", "revelation"
];

// Map spoken variations to standard names
const BOOK_ALIASES: Record<string, string> = {
  "first samuel": "1 samuel", "1st samuel": "1 samuel",
  "second samuel": "2 samuel", "2nd samuel": "2 samuel", "sencond samuel": "2 samuel",
  "first kings": "1 kings", "1st kings": "1 kings",
  "second kings": "2 kings", "2nd kings": "2 kings", "sencond kings": "2 kings",
  "first chronicles": "1 chronicles", "1st chronicles": "1 chronicles",
  "second chronicles": "2 chronicles", "2nd chronicles": "2 chronicles", "sencond chronicles": "2 chronicles",
  "first corinthians": "1 corinthians", "1st corinthians": "1 corinthians",
  "second corinthians": "2 corinthians", "2nd corinthians": "2 corinthians", "sencond corinthians": "2 corinthians",
  "first thessalonians": "1 thessalonians", "1st thessalonians": "1 thessalonians",
  "second thessalonians": "2 thessalonians", "2nd thessalonians": "2 thessalonians", "sencond thessalonians": "2 thessalonians",
  "first timothy": "1 timothy", "1st timothy": "1 timothy",
  "second timothy": "2 timothy", "2nd timothy": "2 timothy", "sencond timothy": "2 timothy",
  "first peter": "1 peter", "1st peter": "1 peter",
  "second peter": "2 peter", "2nd peter": "2 peter", "sencond peter": "2 peter",
  "first john": "1 john", "1st john": "1 john",
  "second john": "2 john", "2nd john": "2 john", "sencond john": "2 john",
  "third john": "3 john", "3rd john": "3 john", "thrid john": "3 john",
  "psalm": "psalms",
  "song of songs": "song of solomon", "songs of solomon": "song of solomon",
  "revelations": "revelation",
  "mathew": "matthew",
  "philipians": "philippians",
  "colosians": "colossians",
  "eccleciastes": "ecclesiastes",
  "eclesiastes": "ecclesiastes",
};

export class ScriptureExtractor {
  
  /**
   * Normalizes spoken word numbers into string digits (e.g., "twenty three" -> "23", "one one" -> "1 1")
   */
  static normalizeNumbers(text: string): string {
    const words = text.toLowerCase().replace(/[.,!?]/g, '').split(/\s+/);
    let result: string[] = [];
    
    let currentNumber = 0;
    let isBuildingNumber = false;

    for (const word of words) {
      if (NUMBER_WORDS[word] !== undefined) {
        const val = NUMBER_WORDS[word];
        
        if (isBuildingNumber) {
          // If we see two single digits in a row (e.g. "one one"), they should be separate
          // Unless we are building a tens/hundreds (e.g. "twenty" + "three")
          if (val < 10 && currentNumber > 0 && currentNumber < 20) {
            result.push(currentNumber.toString());
            currentNumber = val;
          } else if (val === 100) {
            currentNumber = currentNumber === 0 ? 100 : currentNumber * 100;
          } else {
            currentNumber += val;
          }
        } else {
          isBuildingNumber = true;
          currentNumber = val;
        }
      } else {
        // If we were building a number and hit a non-number word, push the resolved number
        if (isBuildingNumber) {
          result.push(currentNumber.toString());
          currentNumber = 0;
          isBuildingNumber = false;
        }
        
        // Handle hyphenated numbers like "twenty-three" if they slipped through
        if (word.includes('-')) {
          const parts = word.split('-');
          if (parts.every(p => NUMBER_WORDS[p] !== undefined)) {
            const sum = parts.reduce((acc, p) => acc + NUMBER_WORDS[p], 0);
            result.push(sum.toString());
            continue;
          }
        }

        // Just a normal word
        result.push(word);
      }
    }

    // Flush any remaining number
    if (isBuildingNumber) {
      result.push(currentNumber.toString());
    }

    return result.join(' ');
  }

  /**
   * Normalize spoken book aliases (e.g. "first john" -> "1 john")
   */
  static normalizeBooks(text: string): string {
    let normalized = text;
    for (const [alias, standard] of Object.entries(BOOK_ALIASES)) {
      // Use regex with word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${alias}\\b`, 'gi');
      normalized = normalized.replace(regex, standard);
    }
    return normalized;
  }

  /**
   * Main NLP extraction pipeline.
   * Matches patterns like: [Book] [Chapter] (verse)? [Verse] (through|to|-)? [EndVerse]?
   */
  static extract(transcript: string): ExtractedReference[] {
    const results: ExtractedReference[] = [];
    
    // 1. Normalize the transcript
    let normalized = this.normalizeNumbers(transcript);
    normalized = this.normalizeBooks(normalized);
    
    // Build a mega-regex of all book names
    const booksPattern = BIBLE_BOOKS.join('|');
    
    // Regex explanation:
    // (Book name)
    // Optional filler: "chapter"
    // (Chapter number)
    // Optional filler: "verse" or ":" or "and"
    // (Verse number)
    // Optional range: "through", "to", "-"
    // (End Verse number)
    const regex = new RegExp(
      `\\b(${booksPattern})\\b\\s*(?:chapter)?\\s*(\\d+)\\s*(?:verse|:)?\\s*(\\d+)?\\s*(?:through|to|-)?\\s*(\\d+)?`, 
      'gi'
    );

    let match;
    while ((match = regex.exec(normalized)) !== null) {
      const book = match[1].toLowerCase();
      const chapter = parseInt(match[2], 10);
      const verse = match[3] ? parseInt(match[3], 10) : undefined;
      const endVerse = match[4] ? parseInt(match[4], 10) : undefined;

      // Calculate confidence based on explicit markers
      // If they said "chapter X verse Y", confidence is higher than just "John 3 16"
      const rawMatch = match[0];
      let confidence = 0.7; // Base confidence for finding a book and chapter
      
      if (rawMatch.includes('chapter')) confidence += 0.1;
      if (rawMatch.includes('verse')) confidence += 0.1;
      if (verse !== undefined) confidence += 0.1; // Specifying a verse increases confidence that it's a citation

      confidence = Math.round(confidence * 100) / 100; // Fix float precision

      results.push({
        book: book === 'psalm' ? 'psalms' : book,
        chapter,
        verse,
        endVerse,
        confidence: Math.min(confidence, 1.0),
        rawText: rawMatch
      });
    }

    return results;
  }
}
