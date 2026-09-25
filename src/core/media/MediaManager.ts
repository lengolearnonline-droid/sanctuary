import { dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService } from '../database/DatabaseService';

export class MediaManager {
  constructor(private db: DatabaseService) {}

  public async importMedia(): Promise<{ success: boolean; message: string; count?: number }> {
    const result = await dialog.showOpenDialog({
      title: 'Import Media Files',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Media', extensions: ['mp4', 'mov', 'webm', 'jpg', 'jpeg', 'png', 'gif', 'mp3', 'wav', 'aac'] },
        { name: 'Videos', extensions: ['mp4', 'mov', 'webm'] },
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
        { name: 'Audio', extensions: ['mp3', 'wav', 'aac'] }
      ]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, message: 'Canceled' };
    }

    let successCount = 0;

    this.db.transaction(() => {
      for (const filePath of result.filePaths) {
        try {
          const stats = fs.statSync(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const name = path.basename(filePath, ext);
          
          let type = 'image';
          let mime = 'image/jpeg';
          
          if (['.mp4', '.mov', '.webm'].includes(ext)) {
            type = 'video';
            mime = `video/${ext.substring(1)}`;
          } else if (['.mp3', '.wav', '.aac'].includes(ext)) {
            type = 'audio';
            mime = `audio/${ext.substring(1)}`;
          } else if (ext === '.png') {
            mime = 'image/png';
          } else if (ext === '.gif') {
            mime = 'image/gif';
          }

          // Convert to file:// format for web rendering
          const localUrl = `file:///${filePath.replace(/\\/g, '/')}`;

          const id = `media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
          
          const changes = this.db.execute(`
            INSERT INTO media (id, name, type, path, size, mime_type, tags, category)
            VALUES (?, ?, ?, ?, ?, ?, '[]', 'Uncategorized')
            ON CONFLICT(path) DO NOTHING
          `, [id, name, type, localUrl, stats.size, mime]);
          
          if (changes.changes > 0) {
            successCount++;
          }
        } catch (e) {
          console.error(`Failed to import ${filePath}:`, e);
        }
      }
    });

    return { 
      success: successCount > 0, 
      message: `Successfully imported ${successCount} media files.`, 
      count: successCount 
    };
  }

  public listMedia(): any[] {
    return this.db.query('SELECT * FROM media ORDER BY created_at DESC').map((row: any) => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
    }));
  }

  public deleteMedia(id: string): void {
    this.db.execute('DELETE FROM media WHERE id = ?', [id]);
  }
}
