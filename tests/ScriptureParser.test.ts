import { describe, it, expect } from 'vitest';
import { parseScriptureReference, parseSpokenNumber, normalizeText, resolveBookName } from '../src/core/ai/ScriptureParser';

describe('ScriptureParser', () => {
  describe('parseSpokenNumber', () => {
    it('parses direct digits', () => {
      expect(parseSpokenNumber('42')).toBe(42);
    });
    
    it('parses single words', () => {
      expect(parseSpokenNumber('three')).toBe(3);
      expect(parseSpokenNumber('sixteen')).toBe(16);
      expect(parseSpokenNumber('first')).toBe(1);
    });

    it('parses compound numbers', () => {
      expect(parseSpokenNumber('twenty-three')).toBe(23);
      expect(parseSpokenNumber('one hundred and forty-three')).toBe(143);
      expect(parseSpokenNumber('one hundred forty three')).toBe(143);
    });
  });

  describe('resolveBookName', () => {
    it('resolves canonical names', () => {
      expect(resolveBookName('Genesis')).toBe('Genesis');
      expect(resolveBookName('matthew')).toBe('Matthew');
    });

    it('resolves aliases', () => {
      expect(resolveBookName('Gen')).toBe('Genesis');
      expect(resolveBookName('1jn')).toBe('1 John');
      expect(resolveBookName('1st john')).toBe('1 John');
    });

    it('handles ordinals', () => {
      expect(resolveBookName('first corinthians')).toBe('1 Corinthians');
      expect(resolveBookName('second timothy')).toBe('2 Timothy');
    });

    it('handles prefixes', () => {
      expect(resolveBookName('the book of Revelation')).toBe('Revelation');
      expect(resolveBookName('the gospel according to Luke')).toBe('Luke');
    });
  });

  describe('parseScriptureReference', () => {
    it('parses standard notation', () => {
      const result = parseScriptureReference('John 3:16');
      expect(result.reference).toMatchObject({
        book: 'John',
        chapter: 3,
        verses: [16]
      });
    });

    it('parses range notation', () => {
      const result = parseScriptureReference('Rom 8:28-30');
      expect(result.reference).toMatchObject({
        book: 'Romans',
        chapter: 8,
        verses: [28, 29, 30]
      });
    });

    it('parses spoken phrases', () => {
      const result = parseScriptureReference('John chapter three verse sixteen');
      expect(result.reference).toMatchObject({
        book: 'John',
        chapter: 3,
        verses: [16]
      });
      expect(result.reference?.confidence).toBeGreaterThan(0.8);
    });

    it('parses shorthand spoken', () => {
      const result = parseScriptureReference('John three sixteen');
      expect(result.reference).toMatchObject({
        book: 'John',
        chapter: 3,
        verses: [16]
      });
    });

    it('parses ordinal prefixes', () => {
      const result = parseScriptureReference('First Corinthians chapter 13');
      expect(result.reference).toMatchObject({
        book: '1 Corinthians',
        chapter: 13,
        verses: []
      });
    });

    it('handles context continuations', () => {
      // First sentence establishes context
      const result1 = parseScriptureReference('let us turn to John chapter 3');
      expect(result1.reference?.book).toBe('John');
      expect(result1.updatedContext.currentBook).toBe('John');

      // Second sentence uses context
      const result2 = parseScriptureReference('verse sixteen', result1.updatedContext);
      expect(result2.reference).toMatchObject({
        book: 'John',
        chapter: 3,
        verses: [16]
      });
    });

    it('filters out filler words', () => {
      const result = parseScriptureReference('please turn your bibles to Mark chapter 1 verse 15');
      expect(result.reference).toMatchObject({
        book: 'Mark',
        chapter: 1,
        verses: [15]
      });
    });
  });
});
