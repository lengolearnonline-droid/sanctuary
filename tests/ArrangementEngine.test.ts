import { describe, it, expect } from 'vitest';
import { ArrangementEngine } from '../src/core/songs/ArrangementEngine';
import type { Song, SongSection } from '../src/shared/types';

// ---- Test Data ----

function createTestSong(): Song {
  const sections: SongSection[] = [
    { id: 'v1', songId: 'song-1', type: 'verse', label: 'Verse 1', lines: ['Amazing grace how sweet the sound', 'That saved a wretch like me'], order: 0 },
    { id: 'v2', songId: 'song-1', type: 'verse', label: 'Verse 2', lines: ['Twas grace that taught my heart to fear', 'And grace my fears relieved'], order: 1 },
    { id: 'c1', songId: 'song-1', type: 'chorus', label: 'Chorus', lines: ['How precious did that grace appear', 'The hour I first believed'], order: 2 },
    { id: 'br1', songId: 'song-1', type: 'bridge', label: 'Bridge', lines: ['Through many dangers toils and snares', 'I have already come', 'Tis grace hath brought me safe thus far', 'And grace will lead me home'], order: 3 },
  ];

  return {
    id: 'song-1',
    title: 'Amazing Grace',
    artist: 'John Newton',
    author: 'John Newton',
    copyright: 'Public Domain',
    ccliNumber: '12345',
    key: 'G',
    language: 'en',
    sections,
    arrangement: ['v1', 'c1', 'v2', 'c1', 'br1', 'c1'],
    tags: ['hymn'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

// ---- Tests ----

describe('ArrangementEngine', () => {
  describe('createDefaultArrangement', () => {
    it('creates an arrangement with all sections in order', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createDefaultArrangement(song);

      expect(arr.songId).toBe('song-1');
      expect(arr.name).toBe('Default');
      expect(arr.sectionOrder).toEqual(['v1', 'v2', 'c1', 'br1']);
    });
  });

  describe('reorderSection', () => {
    it('moves a section from one position to another', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createDefaultArrangement(song);

      // Move chorus (index 2) to position 0
      const reordered = ArrangementEngine.reorderSection(arr, 2, 0);
      expect(reordered.sectionOrder).toEqual(['c1', 'v1', 'v2', 'br1']);
    });
  });

  describe('insertSection', () => {
    it('inserts a section at a specific position', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createDefaultArrangement(song);

      const inserted = ArrangementEngine.insertSection(arr, 'c1', 1);
      expect(inserted.sectionOrder).toEqual(['v1', 'c1', 'v2', 'c1', 'br1']);
    });
  });

  describe('removeFromArrangement', () => {
    it('removes a section at a specific index without affecting others', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['v1', 'c1', 'v2', 'c1']);

      const removed = ArrangementEngine.removeFromArrangement(arr, 1);
      expect(removed.sectionOrder).toEqual(['v1', 'v2', 'c1']);
    });
  });

  describe('duplicateInArrangement', () => {
    it('duplicates a section entry for repeats', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['v1', 'c1']);

      const duplicated = ArrangementEngine.duplicateInArrangement(arr, 1);
      expect(duplicated.sectionOrder).toEqual(['v1', 'c1', 'c1']);
    });
  });

  describe('resolveArrangement', () => {
    it('expands section IDs into full section objects', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['v1', 'c1', 'v2', 'c1']);

      const resolved = ArrangementEngine.resolveArrangement(song, arr);
      expect(resolved.length).toBe(4);
      expect(resolved[0].label).toBe('Verse 1');
      expect(resolved[1].label).toBe('Chorus');
      expect(resolved[2].label).toBe('Verse 2');
      expect(resolved[3].label).toBe('Chorus'); // Repeat
    });

    it('skips missing section IDs gracefully', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['v1', 'nonexistent', 'c1']);

      const resolved = ArrangementEngine.resolveArrangement(song, arr);
      expect(resolved.length).toBe(2);
    });
  });

  describe('generateSlides', () => {
    it('creates one slide per section when lines fit', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['v1', 'c1']);
      const resolved = ArrangementEngine.resolveArrangement(song, arr);

      const slides = ArrangementEngine.generateSlides(resolved, 4);
      expect(slides.length).toBe(2);
      expect(slides[0].sectionLabel).toBe('Verse 1');
      expect(slides[0].isFirst).toBe(true);
      expect(slides[0].isLast).toBe(true);
      expect(slides[1].sectionLabel).toBe('Chorus');
    });

    it('paginates long sections across multiple slides', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['br1']);
      const resolved = ArrangementEngine.resolveArrangement(song, arr);

      // Bridge has 4 lines, paginate at 2 lines per slide
      const slides = ArrangementEngine.generateSlides(resolved, 2);
      expect(slides.length).toBe(2);
      expect(slides[0].pageIndex).toBe(0);
      expect(slides[0].totalPages).toBe(2);
      expect(slides[0].isFirst).toBe(true);
      expect(slides[0].isLast).toBe(false);
      expect(slides[1].pageIndex).toBe(1);
      expect(slides[1].isFirst).toBe(false);
      expect(slides[1].isLast).toBe(true);
    });
  });

  describe('findSectionIndex (quick-jump)', () => {
    it('finds the first occurrence of a section type', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['v1', 'c1', 'v2', 'c1', 'br1']);
      const resolved = ArrangementEngine.resolveArrangement(song, arr);
      const slides = ArrangementEngine.generateSlides(resolved, 4);

      const chorusIndex = ArrangementEngine.findSectionIndex(slides, 'chorus');
      expect(chorusIndex).toBe(1); // Second slide (after Verse 1)

      const bridgeIndex = ArrangementEngine.findSectionIndex(slides, 'bridge');
      expect(bridgeIndex).toBe(4); // Fifth slide
    });

    it('finds the Nth occurrence of a section type', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['v1', 'c1', 'v2', 'c1']);
      const resolved = ArrangementEngine.resolveArrangement(song, arr);
      const slides = ArrangementEngine.generateSlides(resolved, 4);

      const secondChorus = ArrangementEngine.findSectionIndex(slides, 'chorus', 2);
      expect(secondChorus).toBe(3);
    });

    it('returns -1 for non-existent section type', () => {
      const slides = ArrangementEngine.generateSlides([], 4);
      expect(ArrangementEngine.findSectionIndex(slides, 'interlude')).toBe(-1);
    });
  });

  describe('getSectionBoundaries', () => {
    it('returns boundaries for section navigation', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['v1', 'c1', 'v2', 'c1']);
      const resolved = ArrangementEngine.resolveArrangement(song, arr);
      const slides = ArrangementEngine.generateSlides(resolved, 4);

      const boundaries = ArrangementEngine.getSectionBoundaries(slides);
      expect(boundaries.length).toBe(4);
      expect(boundaries[0]).toEqual({ index: 0, label: 'Verse 1', type: 'verse' });
      expect(boundaries[1]).toEqual({ index: 1, label: 'Chorus', type: 'chorus' });
      expect(boundaries[2]).toEqual({ index: 2, label: 'Verse 2', type: 'verse' });
      expect(boundaries[3]).toEqual({ index: 3, label: 'Chorus', type: 'chorus' });
    });
  });

  describe('getArrangementLabel', () => {
    it('returns a compact flow string', () => {
      const song = createTestSong();
      const arr = ArrangementEngine.createArrangement('song-1', 'Test', ['v1', 'c1', 'v2', 'c1', 'br1', 'c1']);

      const label = ArrangementEngine.getArrangementLabel(song, arr);
      expect(label).toBe('V1 → C → V2 → C → Br → C');
    });
  });

  describe('paginateLines', () => {
    it('returns single page when lines fit', () => {
      const pages = ArrangementEngine.paginateLines(['line1', 'line2'], 4);
      expect(pages).toEqual([['line1', 'line2']]);
    });

    it('splits into multiple pages', () => {
      const pages = ArrangementEngine.paginateLines(['a', 'b', 'c', 'd', 'e'], 2);
      expect(pages).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    });
  });
});
