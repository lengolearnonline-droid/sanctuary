import { describe, it, expect } from 'vitest';
import { ScriptureExtractor } from '../../src/main/ai/ScriptureExtractor';

describe('ScriptureExtractor', () => {
  describe('normalizeNumbers', () => {
    it('should convert spoken numbers to digits', () => {
      expect(ScriptureExtractor.normalizeNumbers('one two three')).toBe('1 2 3');
      expect(ScriptureExtractor.normalizeNumbers('twenty three')).toBe('23');
      expect(ScriptureExtractor.normalizeNumbers('chapter twenty four')).toBe('chapter 24');
      expect(ScriptureExtractor.normalizeNumbers('verse sixteen')).toBe('verse 16');
      expect(ScriptureExtractor.normalizeNumbers('first john')).toBe('1 john');
    });
  });

  describe('normalizeBooks', () => {
    it('should convert spoken aliases to standard book names', () => {
      expect(ScriptureExtractor.normalizeBooks('first john 3')).toBe('1 john 3');
      expect(ScriptureExtractor.normalizeBooks('second chronicles chapter 2')).toBe('2 chronicles chapter 2');
      expect(ScriptureExtractor.normalizeBooks('song of songs')).toBe('song of solomon');
      expect(ScriptureExtractor.normalizeBooks('revelations 21')).toBe('revelation 21');
    });
  });

  describe('extract', () => {
    it('should extract standard book chapter verse', () => {
      const results = ScriptureExtractor.extract('turn to john chapter 3 verse 16 please');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        book: 'john',
        chapter: 3,
        verse: 16
      });
      expect(results[0].confidence).toBe(1.0); // Has both chapter and verse markers
    });

    it('should extract references without chapter/verse markers', () => {
      const results = ScriptureExtractor.extract('look at genesis one one');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        book: 'genesis',
        chapter: 1,
        verse: 1
      });
      expect(results[0].confidence).toBe(0.8);
    });

    it('should extract references with spoken numbers', () => {
      const results = ScriptureExtractor.extract('open to first corinthians thirteen verse four');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        book: '1 corinthians',
        chapter: 13,
        verse: 4
      });
    });

    it('should handle ranges', () => {
      const results = ScriptureExtractor.extract('let us read matthew chapter five verse one through twelve');
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        book: 'matthew',
        chapter: 5,
        verse: 1,
        endVerse: 12
      });
    });

    it('should ignore false positives', () => {
      const results = ScriptureExtractor.extract('john walked to the store with mark and luke');
      // "john" is followed by "walked" (not a number), "mark" followed by "and", "luke" at end.
      // So these shouldn't match the \d+ requirement for chapter
      expect(results).toHaveLength(0);
    });
  });
});
