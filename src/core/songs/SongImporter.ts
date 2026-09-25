import { DatabaseService } from '../database/DatabaseService';
import { SongManager } from './SongManager';
import { Logger } from '../services/Logger';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const logger = new Logger('SongImporter');

export class SongImporter {
  private db: DatabaseService;
  private songManager: SongManager;

  constructor(db: DatabaseService, songManager: SongManager) {
    this.db = db;
    this.songManager = songManager;
  }

  async importFile(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath, 'utf-8');

    if (ext === '.xml') {
      return this.importOpenSongXml(content, path.parse(filePath).name);
    } else if (ext === '.txt') {
      return this.importPlainText(content, path.parse(filePath).name);
    } else {
      throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  private async importOpenSongXml(xmlContent: string, fallbackTitle: string): Promise<string> {
    const { XMLParser } = require('fast-xml-parser');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });
    const jObj = parser.parse(xmlContent);

    if (!jObj.song) {
      throw new Error('Not a valid OpenSong XML file');
    }

    const title = jObj.song.title || fallbackTitle;
    const author = jObj.song.author || '';
    const copyright = jObj.song.copyright || '';
    const ccli = jObj.song.ccli || '';
    const lyricsRaw = jObj.song.lyrics || '';

    // OpenSong uses special markers like [V1], [C], [B]
    const sections = this.parseOpenSongLyrics(lyricsRaw);

    const song = this.songManager.createSong({
      title,
      artist: author, // mapping author to artist for simplicity
      author,
      copyright,
      ccliNumber: ccli,
      key: '',
      language: 'en',
      tags: [],
      arrangement: sections.map(s => s.id),
      sections
    });

    return `Successfully imported: ${song.title}`;
  }

  private async importPlainText(content: string, title: string): Promise<string> {
    const lines = content.split('\n').map(l => l.trim());
    const sections: any[] = [];
    let currentSectionLines: string[] = [];
    let currentSectionLabel = 'Verse 1';
    let currentSectionType = 'verse';

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
        if (currentSectionLines.length > 0) {
          commitSection();
          if (currentSectionType === 'verse') {
            currentSectionType = 'chorus';
            currentSectionLabel = 'Chorus';
          }
        }
        continue;
      }

      const tagMatch = line.match(/^\[?(Verse|Chorus|Bridge|Tag|Pre-Chorus|Intro|Outro)[\s\d]*\]?:?$/i);
      if (tagMatch) {
        commitSection();
        const typeStr = tagMatch[1].toLowerCase();
        currentSectionType = typeStr.includes('verse') ? 'verse' : typeStr.includes('chorus') ? 'chorus' : typeStr.includes('bridge') ? 'bridge' : 'other';
        currentSectionLabel = line.replace(/[[\]:]/g, '').trim();
        continue;
      }
      currentSectionLines.push(line);
    }
    commitSection();

    if (sections.length === 0 && currentSectionLines.length > 0) {
      sections.push({ id: randomUUID(), label: 'Verse 1', type: 'verse', lines: currentSectionLines });
    }

    const song = this.songManager.createSong({
      title,
      artist: '',
      author: '',
      copyright: '',
      ccliNumber: '',
      key: '',
      language: 'en',
      tags: [],
      arrangement: sections.map(s => s.id),
      sections
    });

    return `Successfully imported: ${song.title}`;
  }

  private parseOpenSongLyrics(lyricsStr: string): any[] {
    const lines = lyricsStr.split('\n');
    const sections: any[] = [];
    let currentLines: string[] = [];
    let currentLabel = 'Verse 1';
    let currentType = 'verse';

    const commit = () => {
      if (currentLines.length > 0) {
        sections.push({
          id: randomUUID(),
          label: currentLabel,
          type: currentType,
          lines: [...currentLines]
        });
        currentLines = [];
      }
    };

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // OpenSong uses [V1], [C], [B], etc.
      if (line.startsWith('[') && line.endsWith(']')) {
        commit();
        const tag = line.substring(1, line.length - 1).toUpperCase();
        if (tag.startsWith('V')) {
          currentType = 'verse';
          currentLabel = `Verse ${tag.replace('V', '')}`;
        } else if (tag.startsWith('C')) {
          currentType = 'chorus';
          currentLabel = `Chorus ${tag.replace('C', '')}`;
        } else if (tag.startsWith('B')) {
          currentType = 'bridge';
          currentLabel = `Bridge ${tag.replace('B', '')}`;
        } else if (tag.startsWith('P')) {
          currentType = 'chorus'; // Pre-chorus
          currentLabel = `Pre-Chorus ${tag.replace('P', '')}`;
        } else {
          currentType = 'other';
          currentLabel = tag;
        }
        continue;
      }
      currentLines.push(line);
    }
    commit();
    return sections;
  }
}
