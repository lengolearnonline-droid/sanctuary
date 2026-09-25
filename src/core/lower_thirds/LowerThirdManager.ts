import { DatabaseService } from '../database/DatabaseService';
import { LowerThird, LowerThirdColors, LowerThirdTypography, LowerThirdAnimation } from '../../shared/types';
import { generateId } from '../../shared/utils';

export class LowerThirdManager {
  constructor(private db: DatabaseService) {}

  public getAll(): LowerThird[] {
    const rows = this.db.query('SELECT * FROM lower_thirds ORDER BY created_at DESC');
    return rows.map((row: any) => this.rowToLowerThird(row));
  }

  public get(id: string): LowerThird | null {
    const row = this.db.query('SELECT * FROM lower_thirds WHERE id = ?', [id])[0];
    return row ? this.rowToLowerThird(row) : null;
  }

  public create(lt: Partial<LowerThird>): LowerThird {
    const id = generateId();
    const now = new Date().toISOString();
    
    // Default values
    const newLt: LowerThird = {
      id,
      name: lt.name || 'New Lower Third',
      template: lt.template || 'classic',
      personName: lt.personName || '',
      title: lt.title || '',
      organization: lt.organization || '',
      logoPath: lt.logoPath || null,
      colors: lt.colors || this.getDefaultColors(),
      typography: lt.typography || this.getDefaultTypography(),
      animation: lt.animation || this.getDefaultAnimation(),
      duration: lt.duration || 0,
      createdAt: now,
      updatedAt: now,
    };

    const data = JSON.stringify({
      colors: newLt.colors,
      typography: newLt.typography,
      animation: newLt.animation,
      duration: newLt.duration,
    });

    this.db.execute(`
      INSERT INTO lower_thirds (id, name, template, person_name, title, organization, logo_path, data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      newLt.id,
      newLt.name,
      newLt.template,
      newLt.personName,
      newLt.title,
      newLt.organization,
      newLt.logoPath,
      data
    ]);

    return newLt;
  }

  public update(id: string, updates: Partial<LowerThird>): void {
    const existing = this.get(id);
    if (!existing) throw new Error('Lower Third not found');

    const updated = { ...existing, ...updates };

    const data = JSON.stringify({
      colors: updated.colors,
      typography: updated.typography,
      animation: updated.animation,
      duration: updated.duration,
    });

    this.db.execute(`
      UPDATE lower_thirds 
      SET name = ?, template = ?, person_name = ?, title = ?, organization = ?, logo_path = ?, data = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      updated.name,
      updated.template,
      updated.personName,
      updated.title,
      updated.organization,
      updated.logoPath,
      data,
      id
    ]);
  }

  public delete(id: string): void {
    this.db.execute('DELETE FROM lower_thirds WHERE id = ?', [id]);
  }

  private rowToLowerThird(row: any): LowerThird {
    const data = JSON.parse(row.data || '{}');
    return {
      id: row.id,
      name: row.name,
      template: row.template,
      personName: row.person_name,
      title: row.title,
      organization: row.organization,
      logoPath: row.logo_path,
      colors: data.colors || this.getDefaultColors(),
      typography: data.typography || this.getDefaultTypography(),
      animation: data.animation || this.getDefaultAnimation(),
      duration: data.duration || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private getDefaultColors(): LowerThirdColors {
    return {
      background: '#0F172A',
      nameColor: '#FFFFFF',
      titleColor: '#9CA3AF',
      accentColor: '#3B82F6',
      borderColor: 'transparent'
    };
  }

  private getDefaultTypography(): LowerThirdTypography {
    return {
      nameFont: 'Inter, sans-serif',
      nameSize: 4.0,
      nameWeight: 700,
      titleFont: 'Inter, sans-serif',
      titleSize: 2.5,
      titleWeight: 400
    };
  }

  private getDefaultAnimation(): LowerThirdAnimation {
    return {
      enterType: 'slide-left',
      exitType: 'slide-left',
      enterDuration: 500,
      exitDuration: 500
    };
  }
}
