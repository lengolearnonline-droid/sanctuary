import { Song, SongSection } from '../../shared/types';
import { Logger } from '../services/Logger';
import { randomUUID } from 'crypto';

const logger = new Logger('LyricsFetcher');

export class LyricsFetcher {
  /**
   * Fetches lyrics from LRCLIB and intelligently parses them into Sanctuary sections
   */
  async fetchAndParse(query: string): Promise<{ title: string, artist: string, sections: any[] } | null> {
    try {
      const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data: any = await response.json();
      if (!data || data.length === 0) {
        return null;
      }

      // Pick the best match (usually the first one)
      const track = data[0];
      if (!track.plainLyrics) {
        return null;
      }

      const sections = this.parseLyricsIntoSections(track.plainLyrics);

      return {
        title: track.trackName || query,
        artist: track.artistName || '',
        sections
      };
    } catch (err) {
      logger.error('Failed to fetch lyrics', { query, error: String(err) });
      return null;
    }
  }

  /**
   * Converts a raw block of text into structured Verse/Chorus sections
   */
  private parseLyricsIntoSections(rawLyrics: string): any[] {
    const lines = rawLyrics.split('\n').map(l => l.trim());
    const sections: any[] = [];
    
    let currentSectionLines: string[] = [];
    let currentSectionLabel = 'Verse 1';
    let currentSectionType = 'verse';
    let verseCount = 1;
    let chorusCount = 1;
    let bridgeCount = 1;

    const commitSection = () => {
      if (currentSectionLines.length > 0) {
        sections.push({
          id: randomUUID(),
          label: currentSectionLabel,
          type: currentSectionType,
          lines: [...currentSectionLines]
        });
        currentSectionLines = [];
      }
    };

    for (const line of lines) {
      if (line === '') {
        // Blank line usually denotes a new section
        if (currentSectionLines.length > 0) {
          commitSection();
          // Automatically guess the next section type
          if (currentSectionType === 'verse') {
            currentSectionType = 'chorus';
            currentSectionLabel = 'Chorus';
          } else if (currentSectionType === 'chorus') {
            verseCount++;
            currentSectionType = 'verse';
            currentSectionLabel = `Verse ${verseCount}`;
          }
        }
        continue;
      }

      // Check if line is an explicit tag like [Verse 1] or Chorus:
      const tagMatch = line.match(/^\[?(Verse|Chorus|Bridge|Tag|Pre-Chorus|Intro|Outro)[\s\d]*\]?:?$/i);
      if (tagMatch) {
        commitSection();
        const typeStr = tagMatch[1].toLowerCase();
        
        if (typeStr.includes('verse')) {
          currentSectionType = 'verse';
          currentSectionLabel = line.replace(/[[\]:]/g, '').trim();
          // Try to extract number to keep count synced
          const numMatch = currentSectionLabel.match(/\d+/);
          if (numMatch) verseCount = parseInt(numMatch[0]);
        } else if (typeStr.includes('chorus') || typeStr.includes('pre-chorus')) {
          currentSectionType = 'chorus';
          currentSectionLabel = line.replace(/[[\]:]/g, '').trim();
        } else if (typeStr.includes('bridge')) {
          currentSectionType = 'bridge';
          currentSectionLabel = line.replace(/[[\]:]/g, '').trim();
        } else {
          currentSectionType = 'other';
          currentSectionLabel = line.replace(/[[\]:]/g, '').trim();
        }
        continue;
      }

      currentSectionLines.push(line);
    }

    commitSection(); // commit the final section

    // If no sections were found (it was just one massive block), create a single verse
    if (sections.length === 0 && currentSectionLines.length > 0) {
      sections.push({
        id: randomUUID(),
        label: 'Verse 1',
        type: 'verse',
        lines: currentSectionLines
      });
    }

    return sections;
  }
}
