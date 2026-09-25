import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseService } from '../src/core/database/DatabaseService';
import { SongManager } from '../src/core/songs/SongManager';
import fs from 'fs';
import path from 'path';

describe('SongManager', () => {
  let db: DatabaseService;
  let songManager: SongManager;
  const testDir = path.join(__dirname, 'test-db');

  beforeEach(async () => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir);
    db = new DatabaseService(testDir);
    await db.initialize();
    songManager = new SongManager(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('creates and retrieves a song', () => {
    const newSong = songManager.createSong({
      title: 'Amazing Grace',
      artist: 'John Newton',
      author: 'John Newton',
      copyright: 'Public Domain',
      ccliNumber: '123456',
      key: 'G',
      language: 'en',
      tags: ['hymn', 'grace'],
      arrangement: ['v1', 'v2'],
      sections: [
        {
          id: 'v1',
          type: 'verse',
          label: 'Verse 1',
          lines: ['Amazing grace how sweet the sound', 'That saved a wretch like me'],
          order: 0,
        },
        {
          id: 'v2',
          type: 'verse',
          label: 'Verse 2',
          lines: ['Twas grace that taught my heart to fear', 'And grace my fears relieved'],
          order: 1,
        },
      ]
    }); // Type cast due to missing songId in section input which is expected

    expect(newSong.id).toBeDefined();
    expect(newSong.title).toBe('Amazing Grace');

    const retrieved = songManager.getSong(newSong.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe('Amazing Grace');
    expect(retrieved?.sections.length).toBe(2);
    expect(retrieved?.sections[0].lines[0]).toBe('Amazing grace how sweet the sound');
  });

  it('updates a song', () => {
    const song = songManager.createSong({
      title: 'Test Song',
      sections: []
    });

    const updated = songManager.updateSong(song.id, {
      title: 'Updated Title',
      tags: ['worship']
    });

    expect(updated.title).toBe('Updated Title');
    expect(updated.tags).toContain('worship');

    const retrieved = songManager.getSong(song.id);
    expect(retrieved?.title).toBe('Updated Title');
  });

  it('deletes a song', () => {
    const song = songManager.createSong({
      title: 'To Be Deleted',
      sections: []
    });

    songManager.deleteSong(song.id);

    const retrieved = songManager.getSong(song.id);
    expect(retrieved).toBeNull();
  });

  it('searches for songs via FTS', () => {
    songManager.createSong({ title: 'How Great Is Our God', artist: 'Chris Tomlin' });
    songManager.createSong({ title: 'How He Loves', artist: 'David Crowder' });
    songManager.createSong({ title: '10000 Reasons', artist: 'Matt Redman' });

    // SQLite FTS triggers are asynchronous or immediately committed
    const results = songManager.searchSongs('Great');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('How Great Is Our God');
  });
});
