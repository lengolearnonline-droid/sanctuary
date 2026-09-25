import { DatabaseService } from '../database/DatabaseService';
import { Theme, ThemeTypography, ThemeColors, ThemeBackground, ThemeLayout, ThemeAnimation } from '../../shared/types';
import { generateId } from '../../shared/utils';

export class ThemeManager {
  constructor(private db: DatabaseService) {
    this.seedDefaultThemes();
  }

  private seedDefaultThemes(): void {
    const defaultThemes: Theme[] = [
      {
        id: generateId(),
        name: 'Cinematic Starry Night',
        category: 'General',
        isBuiltIn: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        typography: { fontFamily: 'Inter, sans-serif', fontSize: 3.5, fontWeight: 700, lineHeight: 1.5, letterSpacing: 0, textTransform: 'none', textShadow: '2px 2px 10px rgba(0,0,0,0.9)', verseNumberStyle: 'superscript', referenceSize: 0.6 },
        colors: { textPrimary: '#FFFFFF', textSecondary: '#E0E0E0', accent: '#3B82F6', verseNumber: '#93C5FD', reference: '#93C5FD', overlayBackground: 'rgba(0, 0, 0, 0.4)', textBoxBackground: '' },
        background: { type: 'image', color: '#000000', gradientStart: '', gradientEnd: '', gradientAngle: 0, imagePath: './backgrounds/worship_stars_bokeh.jpg', videoPath: null, imageOpacity: 1, blur: 0, brightness: 1 },
        layout: { textAlign: 'center', verticalAlign: 'center', marginTop: 10, marginBottom: 10, marginLeft: 10, marginRight: 10, maxWidth: 90, referenceAlign: 'right' },
        animation: { transitionType: 'fade', transitionDuration: 500, textAnimation: 'fade-in', textAnimationDuration: 800 }
      },
      {
        id: generateId(),
        name: 'Golden Hour Sunset',
        category: 'General',
        isBuiltIn: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        typography: { fontFamily: 'Georgia, serif', fontSize: 3.5, fontWeight: 700, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none', textShadow: '3px 3px 12px rgba(0,0,0,1)', verseNumberStyle: 'superscript', referenceSize: 0.5 },
        colors: { textPrimary: '#FFFFFF', textSecondary: '#FDE68A', accent: '#F59E0B', verseNumber: '#FDE68A', reference: '#FCD34D', overlayBackground: 'rgba(0, 0, 0, 0.3)', textBoxBackground: '' },
        background: { type: 'image', color: '#000000', gradientStart: '', gradientEnd: '', gradientAngle: 0, imagePath: './backgrounds/worship_sunset_mountains.jpg', videoPath: null, imageOpacity: 1, blur: 0, brightness: 1 },
        layout: { textAlign: 'center', verticalAlign: 'center', marginTop: 10, marginBottom: 10, marginLeft: 10, marginRight: 10, maxWidth: 90, referenceAlign: 'right' },
        animation: { transitionType: 'fade', transitionDuration: 500, textAnimation: 'fade-in', textAnimationDuration: 800 }
      },
      {
        id: generateId(),
        name: 'Abstract Particle Bokeh',
        category: 'General',
        isBuiltIn: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        typography: { fontFamily: 'Inter, sans-serif', fontSize: 3.5, fontWeight: 600, lineHeight: 1.5, letterSpacing: 0, textTransform: 'none', textShadow: '2px 2px 8px rgba(0,0,0,0.9)', verseNumberStyle: 'superscript', referenceSize: 0.6 },
        colors: { textPrimary: '#FFFFFF', textSecondary: '#E0E0E0', accent: '#3B82F6', verseNumber: '#9CA3AF', reference: '#9CA3AF', overlayBackground: 'rgba(0, 0, 0, 0.4)', textBoxBackground: '' },
        background: { type: 'image', color: '#000000', gradientStart: '', gradientEnd: '', gradientAngle: 0, imagePath: './backgrounds/worship_abstract_bokeh.jpg', videoPath: null, imageOpacity: 1, blur: 0, brightness: 1 },
        layout: { textAlign: 'center', verticalAlign: 'center', marginTop: 10, marginBottom: 10, marginLeft: 10, marginRight: 10, maxWidth: 90, referenceAlign: 'right' },
        animation: { transitionType: 'fade', transitionDuration: 400, textAnimation: 'none', textAnimationDuration: 0 }
      },
      {
        id: generateId(),
        name: 'Spiritual Night Sky',
        category: 'Spiritual',
        isBuiltIn: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        typography: { fontFamily: 'Inter, sans-serif', fontSize: 3.5, fontWeight: 700, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none', textShadow: '3px 3px 6px rgba(0,0,0,0.9)', verseNumberStyle: 'superscript', referenceSize: 0.6 },
        colors: { textPrimary: '#FFFFFF', textSecondary: '#E0E0E0', accent: '#60A5FA', verseNumber: '#93C5FD', reference: '#60A5FA', overlayBackground: 'rgba(0,0,0,0.3)', textBoxBackground: '' },
        background: { type: 'gradient', color: '#0F172A', gradientStart: '#0F172A', gradientEnd: '#1E3A8A', gradientAngle: 180, imagePath: null, videoPath: null, imageOpacity: 1, blur: 0, brightness: 1 },
        layout: { textAlign: 'center', verticalAlign: 'center', marginTop: 10, marginBottom: 10, marginLeft: 15, marginRight: 15, maxWidth: 90, referenceAlign: 'right' },
        animation: { transitionType: 'fade', transitionDuration: 500, textAnimation: 'fade-in', textAnimationDuration: 400 }
      },
      {
        id: generateId(),
        name: 'Holy Light Morning',
        category: 'Spiritual',
        isBuiltIn: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        typography: { fontFamily: 'Georgia, serif', fontSize: 3.5, fontWeight: 400, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', verseNumberStyle: 'inline', referenceSize: 0.7 },
        colors: { textPrimary: '#FFFFFF', textSecondary: '#F3F4F6', accent: '#FBBF24', verseNumber: '#FCD34D', reference: '#FBBF24', overlayBackground: 'rgba(0, 0, 0, 0.4)', textBoxBackground: '' },
        background: { type: 'gradient', color: '#000000', gradientStart: '#78350F', gradientEnd: '#D97706', gradientAngle: 135, imagePath: null, videoPath: null, imageOpacity: 1, blur: 0, brightness: 1 },
        layout: { textAlign: 'center', verticalAlign: 'center', marginTop: 12, marginBottom: 12, marginLeft: 12, marginRight: 12, maxWidth: 85, referenceAlign: 'right' },
        animation: { transitionType: 'fade', transitionDuration: 300, textAnimation: 'fade-in', textAnimationDuration: 300 }
      },
      {
        id: generateId(),
        name: 'Majestic Mountains',
        category: 'Spiritual',
        isBuiltIn: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        typography: { fontFamily: 'Inter, sans-serif', fontSize: 3.5, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0, textTransform: 'none', textShadow: '2px 2px 8px rgba(0,0,0,0.7)', verseNumberStyle: 'superscript', referenceSize: 0.7 },
        colors: { textPrimary: '#FFFFFF', textSecondary: '#D1D5DB', accent: '#34D399', verseNumber: '#6EE7B7', reference: '#34D399', overlayBackground: 'rgba(0, 0, 0, 0.5)', textBoxBackground: '' },
        background: { type: 'gradient', color: '#000000', gradientStart: '#064E3B', gradientEnd: '#0F766E', gradientAngle: 45, imagePath: null, videoPath: null, imageOpacity: 1, blur: 0, brightness: 1 },
        layout: { textAlign: 'center', verticalAlign: 'center', marginTop: 15, marginBottom: 15, marginLeft: 10, marginRight: 10, maxWidth: 80, referenceAlign: 'right' },
        animation: { transitionType: 'fade', transitionDuration: 400, textAnimation: 'none', textAnimationDuration: 0 }
      },
      {
        id: generateId(),
        name: 'Solid Dark (Full Screen)',
        category: 'General',
        isBuiltIn: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        typography: { fontFamily: 'Inter, sans-serif', fontSize: 3.5, fontWeight: 600, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none', textShadow: 'none', verseNumberStyle: 'inline', referenceSize: 0.6 },
        colors: { textPrimary: '#FFFFFF', textSecondary: '#E0E0E0', accent: '#3B82F6', verseNumber: '#9CA3AF', reference: '#9CA3AF', overlayBackground: 'transparent', textBoxBackground: '' },
        background: { type: 'solid', color: '#0F172A', gradientStart: '', gradientEnd: '', gradientAngle: 0, imagePath: null, videoPath: null, imageOpacity: 1, blur: 0, brightness: 1 },
        layout: { textAlign: 'center', verticalAlign: 'center', marginTop: 15, marginBottom: 15, marginLeft: 10, marginRight: 10, maxWidth: 90, referenceAlign: 'right' },
        animation: { transitionType: 'fade', transitionDuration: 300, textAnimation: 'none', textAnimationDuration: 0 }
      },
      {
        id: generateId(),
        name: 'Chroma Key (Left Aligned)',
        category: 'Lower Thirds',
        isBuiltIn: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        typography: { fontFamily: 'Inter, sans-serif', fontSize: 3.5, fontWeight: 700, lineHeight: 1.4, letterSpacing: 0, textTransform: 'none', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', verseNumberStyle: 'inline', referenceSize: 0.6 },
        colors: { textPrimary: '#FFFFFF', textSecondary: '#E0E0E0', accent: '#3B82F6', verseNumber: '#9CA3AF', reference: '#9CA3AF', overlayBackground: 'transparent', textBoxBackground: '' },
        background: { type: 'solid', color: '#00FF00', gradientStart: '', gradientEnd: '', gradientAngle: 0, imagePath: null, videoPath: null, imageOpacity: 1, blur: 0, brightness: 1 },
        layout: { textAlign: 'left', verticalAlign: 'bottom', marginTop: 10, marginBottom: 10, marginLeft: 5, marginRight: 5, maxWidth: 90, referenceAlign: 'right' },
        animation: { transitionType: 'fade', transitionDuration: 300, textAnimation: 'none', textAnimationDuration: 0 }
      }
    ];

    for (const theme of defaultThemes) {
      const existing = this.db.query('SELECT id FROM themes WHERE name = ?', [theme.name]);
      if (existing.length === 0) {
        this.createTheme(theme);
      }
    }
  }

  public getThemes(): Theme[] {
    const rows = this.db.query('SELECT * FROM themes ORDER BY is_built_in DESC, name ASC');
    return rows.map((row: any) => this.rowToTheme(row));
  }

  public getTheme(id: string): Theme | null {
    const row = this.db.query('SELECT * FROM themes WHERE id = ?', [id])[0];
    return row ? this.rowToTheme(row) : null;
  }

  public createTheme(theme: Theme): void {
    if (!theme.id) theme.id = generateId();
    this.db.execute(`
      INSERT INTO themes (id, name, category, is_built_in, data)
      VALUES (?, ?, ?, ?, ?)
    `, [
      theme.id,
      theme.name,
      theme.category,
      theme.isBuiltIn ? 1 : 0,
      JSON.stringify(theme)
    ]);
  }

  public updateTheme(id: string, theme: Theme): void {
    this.db.execute(`
      UPDATE themes 
      SET name = ?, category = ?, data = ?, updated_at = datetime('now')
      WHERE id = ? AND is_built_in = 0
    `, [
      theme.name,
      theme.category,
      JSON.stringify(theme),
      id
    ]);
  }

  public deleteTheme(id: string): void {
    this.db.execute('DELETE FROM themes WHERE id = ? AND is_built_in = 0', [id]);
  }

  private rowToTheme(row: any): Theme {
    const parsed = JSON.parse(row.data);
    return {
      ...parsed,
      id: row.id,
      name: row.name,
      category: row.category,
      isBuiltIn: row.is_built_in === 1
    };
  }
}
