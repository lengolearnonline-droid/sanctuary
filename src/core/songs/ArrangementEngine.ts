// ============================================================
// Sanctuary — Song Arrangement Engine
// ============================================================
//
// Manages reusable song arrangements. An arrangement is an
// ordered sequence of section IDs that determines the playback
// order of a song's sections during a live presentation.
//
// For example, "Amazing Grace" might have sections:
//   V1, V2, V3, V4, Chorus
// And an arrangement of:
//   [V1, Chorus, V2, Chorus, V3, Chorus, V4, Chorus]
//
// Multiple named arrangements can be saved per song.

import type { Song, SongSection, Slide, SlideContent, Theme } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

// ---- Types ----

export interface SongArrangement {
  id: string;
  songId: string;
  name: string;            // "Default", "Sunday Morning", "Acoustic Set"
  sectionOrder: string[];  // Ordered array of section IDs
  createdAt: string;
  updatedAt: string;
}

export interface ArrangementSlide {
  id: string;
  sectionId: string;
  sectionType: string;
  sectionLabel: string;
  lines: string[];
  pageIndex: number;       // Which page within this section (for long sections)
  totalPages: number;      // Total pages in this section
  isFirst: boolean;
  isLast: boolean;
}

// ---- Arrangement Engine ----

export class ArrangementEngine {
  /**
   * Create a default arrangement from a song's sections in natural order.
   */
  static createDefaultArrangement(song: Song): SongArrangement {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      songId: song.id,
      name: 'Default',
      sectionOrder: song.sections.map((s) => s.id),
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Create an arrangement from an explicit section ID order.
   */
  static createArrangement(
    songId: string,
    name: string,
    sectionOrder: string[]
  ): SongArrangement {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      songId,
      name,
      sectionOrder,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Reorder sections within an arrangement using drag-and-drop indices.
   * Moves the item at `fromIndex` to `toIndex`.
   */
  static reorderSection(
    arrangement: SongArrangement,
    fromIndex: number,
    toIndex: number
  ): SongArrangement {
    const order = [...arrangement.sectionOrder];
    const [moved] = order.splice(fromIndex, 1);
    order.splice(toIndex, 0, moved);

    return {
      ...arrangement,
      sectionOrder: order,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Add a section (possibly a repeat) at a specific position.
   */
  static insertSection(
    arrangement: SongArrangement,
    sectionId: string,
    atIndex: number
  ): SongArrangement {
    const order = [...arrangement.sectionOrder];
    order.splice(atIndex, 0, sectionId);

    return {
      ...arrangement,
      sectionOrder: order,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Remove a section at a specific position in the arrangement.
   * (Does NOT delete the section from the song itself.)
   */
  static removeFromArrangement(
    arrangement: SongArrangement,
    atIndex: number
  ): SongArrangement {
    const order = [...arrangement.sectionOrder];
    order.splice(atIndex, 1);

    return {
      ...arrangement,
      sectionOrder: order,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Duplicate a section entry in the arrangement (for repeats).
   */
  static duplicateInArrangement(
    arrangement: SongArrangement,
    atIndex: number
  ): SongArrangement {
    const order = [...arrangement.sectionOrder];
    const sectionId = order[atIndex];
    if (sectionId) {
      order.splice(atIndex + 1, 0, sectionId);
    }

    return {
      ...arrangement,
      sectionOrder: order,
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Resolve an arrangement into an ordered list of sections.
   * This expands the section ID list into full SongSection objects,
   * handling repeats (same section ID appearing multiple times).
   */
  static resolveArrangement(
    song: Song,
    arrangement: SongArrangement
  ): SongSection[] {
    const sectionMap = new Map(song.sections.map((s) => [s.id, s]));
    const resolved: SongSection[] = [];

    for (const sectionId of arrangement.sectionOrder) {
      const section = sectionMap.get(sectionId);
      if (section) {
        resolved.push(section);
      }
    }

    return resolved;
  }

  /**
   * Generate presentation slides from a resolved arrangement.
   * Splits long sections across multiple slides based on maxLinesPerSlide.
   */
  static generateSlides(
    resolvedSections: SongSection[],
    maxLinesPerSlide: number = 4
  ): ArrangementSlide[] {
    const slides: ArrangementSlide[] = [];

    for (const section of resolvedSections) {
      const pages = ArrangementEngine.paginateLines(section.lines, maxLinesPerSlide);

      pages.forEach((pageLines, pageIndex) => {
        slides.push({
          id: uuidv4(),
          sectionId: section.id,
          sectionType: section.type,
          sectionLabel: section.label,
          lines: pageLines,
          pageIndex,
          totalPages: pages.length,
          isFirst: pageIndex === 0,
          isLast: pageIndex === pages.length - 1,
        });
      });
    }

    return slides;
  }

  /**
   * Split lines into pages of maxLines each.
   */
  static paginateLines(lines: string[], maxLines: number): string[][] {
    if (lines.length <= maxLines) return [lines];

    const pages: string[][] = [];
    for (let i = 0; i < lines.length; i += maxLines) {
      pages.push(lines.slice(i, i + maxLines));
    }
    return pages;
  }

  /**
   * Convert arrangement slides into full Slide objects for the presentation engine.
   */
  static toPresenterSlides(
    song: Song,
    arrangementSlides: ArrangementSlide[],
    theme: Theme
  ): Slide[] {
    return arrangementSlides.map((as) => ({
      id: as.id,
      type: 'song' as const,
      content: {
        title: song.title,
        body: as.lines.join('\n'),
        subtitle: as.sectionLabel,
        reference: song.artist || song.author || '',
        mediaPath: null,
        html: null,
      },
      theme,
      notes: `${as.sectionLabel} (${as.pageIndex + 1}/${as.totalPages})`,
    }));
  }

  /**
   * Quick-jump: find the slide index for a specific section type.
   * Useful for keyboard shortcuts like "jump to chorus".
   */
  static findSectionIndex(
    slides: ArrangementSlide[],
    sectionType: string,
    occurrence: number = 1
  ): number {
    let count = 0;
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].sectionType === sectionType && slides[i].isFirst) {
        count++;
        if (count === occurrence) return i;
      }
    }
    return -1;
  }

  /**
   * Quick-jump: find all unique section boundaries for navigation.
   * Returns indices of the first slide of each section in the arrangement.
   */
  static getSectionBoundaries(slides: ArrangementSlide[]): Array<{
    index: number;
    label: string;
    type: string;
  }> {
    const boundaries: Array<{ index: number; label: string; type: string }> = [];
    let lastSectionId = '';
    let lastIndex = -1;

    for (let i = 0; i < slides.length; i++) {
      // A new section boundary occurs when:
      // 1. It's the first slide, OR
      // 2. The section ID changes from the previous slide
      if (i === 0 || slides[i].sectionId !== slides[i - 1].sectionId) {
        boundaries.push({
          index: i,
          label: slides[i].sectionLabel,
          type: slides[i].sectionType,
        });
      }
    }

    return boundaries;
  }

  /**
   * Get a compact arrangement label string for display.
   * E.g., "V1 → C → V2 → C → V3 → C → Bridge → C"
   */
  static getArrangementLabel(
    song: Song,
    arrangement: SongArrangement
  ): string {
    const sectionMap = new Map(song.sections.map((s) => [s.id, s]));
    const labels = arrangement.sectionOrder
      .map((id) => {
        const section = sectionMap.get(id);
        return section ? ArrangementEngine.shortLabel(section) : '?';
      });

    return labels.join(' → ');
  }

  /**
   * Generate a short display label for a section.
   */
  static shortLabel(section: SongSection): string {
    switch (section.type) {
      case 'verse':     return section.label.replace('Verse ', 'V');
      case 'chorus':    return 'C';
      case 'bridge':    return 'Br';
      case 'pre-chorus': return 'PC';
      case 'tag':       return 'Tag';
      case 'intro':     return 'Intro';
      case 'outro':     return 'Outro';
      case 'interlude': return 'Int';
      default:          return section.label.substring(0, 3);
    }
  }
}
