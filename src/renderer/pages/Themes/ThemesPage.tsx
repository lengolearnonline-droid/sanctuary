import { usePresentationStore } from '../../stores';
import React, { useState, useEffect } from 'react';
import { Theme, Slide, SlideContent } from '../../../shared/types';
import { SlideRenderer } from '../../components/presentation/SlideRenderer';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Copy, Trash2, Save, Layout, Type, Image as ImageIcon } from 'lucide-react';

// Example content to show in the preview
const PREVIEW_SLIDE: Slide = {
  id: 'preview',
  type: 'song',
  content: {
    title: 'Amazing Grace',
    body: 'Amazing grace how sweet the sound\nThat saved a wretch like me\nI once was lost, but now I am found\nWas blind, but now I see',
    subtitle: '',
    reference: 'Verse 1',
    mediaPath: null,
    html: null
  },
  theme: {} as Theme,
  notes: ''
};

export function ThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [activeTheme, setActiveTheme] = useState<Theme | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [systemFonts, setSystemFonts] = useState<string[]>([]);

  useEffect(() => {
    loadThemes();
  }, []);

  // Live Global Preview Effect
  React.useEffect(() => {
    if (activeTheme) {
      const store = usePresentationStore.getState();
      if (store.previewSlide) {
        store.setPreviewSlide({ ...store.previewSlide, theme: activeTheme });
      }
    }
  }, [activeTheme]);

  const loadThemes = async () => {
    try {
      const data = await window.sanctuary.theme.list();
      setThemes(data);
      if (data.length > 0 && !activeTheme) {
        const themeStore = useThemeStore.getState();
        const defaultBibleThemeId = themeStore.defaultBibleTheme?.id;
        
        let targetTheme = data[0];
        if (defaultBibleThemeId) {
            const found = data.find(t => t.id === defaultBibleThemeId);
            if (found) targetTheme = found;
        }
        
        setActiveTheme(targetTheme);
      }
    } catch (e) {
      console.error('Failed to load themes', e);
    }
  };

  const createTheme = async () => {
    const newTheme: Theme = {
      id: uuidv4(),
      name: 'New Custom Theme',
      category: 'Custom',
      isBuiltIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      typography: { fontFamily: 'sans-serif', fontSize: 5, fontWeight: 700, lineHeight: 1.4, letterSpacing: 0, textTransform: 'uppercase', textShadow: '2px 2px 4px rgba(0,0,0,0.8)', verseNumberStyle: 'superscript', referenceSize: 0.6 },
      colors: { textPrimary: '#FFFFFF', textSecondary: '#E0E0E0', accent: '#3B82F6', verseNumber: '#9CA3AF', reference: '#9CA3AF', overlayBackground: 'rgba(0,0,0,0.4)' },
      background: { type: 'solid', color: '#000000', gradientStart: '', gradientEnd: '', gradientAngle: 0, imagePath: null, videoPath: null, imageOpacity: 1, blur: 0, brightness: 1 },
      layout: { textAlign: 'center', verticalAlign: 'center', marginTop: 10, marginBottom: 10, marginLeft: 10, marginRight: 10, maxWidth: 90 },
      animation: { transitionType: 'fade', transitionDuration: 300, textAnimation: 'none', textAnimationDuration: 0 }
    };
    
    await window.sanctuary.theme.create(JSON.stringify(newTheme));
    await loadThemes();
    setActiveTheme(newTheme);
    setIsEditing(true);
  };

  const duplicateTheme = async (theme: Theme) => {
    const newTheme = { ...theme, id: uuidv4(), name: `${theme.name} (Copy)`, isBuiltIn: false };
    await window.sanctuary.theme.create(JSON.stringify(newTheme));
    await loadThemes();
    setActiveTheme(newTheme);
    setIsEditing(true);
  };

  const deleteTheme = async (id: string) => {
    if (confirm('Are you sure you want to delete this theme?')) {
      await window.sanctuary.theme.delete(id);
      if (activeTheme?.id === id) setActiveTheme(null);
      await loadThemes();
    }
  };

  const saveTheme = async () => {
    if (activeTheme && !activeTheme.isBuiltIn) {
      await window.sanctuary.theme.update(activeTheme.id, JSON.stringify(activeTheme));
      await loadThemes();
    }
  };

  return (
    <div className="themes-page" style={{ display: 'flex', height: '100%', gap: 'var(--space-4)', padding: 'var(--space-4)' }}>
      {/* LEFT PANEL: Themes List */}
      <div className="themes-list panel" style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--color-surface-border)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>Theme Library</h2>
          <button className="btn-icon" onClick={createTheme} title="Create New Theme"><Plus size={18} /></button>
        </div>
        
        <div className="themes-scroll" style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
          {themes.map(theme => (
            <div 
              key={theme.id}
              className={`theme-card ${activeTheme?.id === theme.id ? 'active' : ''}`}
              onClick={() => setActiveTheme(theme)}
              style={{
                padding: 'var(--space-3)',
                margin: 'var(--space-2) 0',
                borderRadius: 'var(--radius-md)',
                background: activeTheme?.id === theme.id ? 'var(--color-bg-active)' : 'transparent',
                border: `1px solid ${activeTheme?.id === theme.id ? 'var(--color-accent)' : 'transparent'}`,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{theme.name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  {theme.category} {theme.isBuiltIn && '• Built-in'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Editor & Preview */}
      <div className="theme-editor-area" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        
        {/* BIG PREVIEW */}
        <div className="theme-preview-container panel" style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e1e1e' }}>
          <div style={{ padding: 'var(--space-2) var(--space-4)', background: '#2d2d2d', borderBottom: '1px solid #3d3d3d', fontSize: '12px', color: '#aaa' }}>
            Live Broadcast Preview
          </div>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {activeTheme && (
              <SlideRenderer 
                slide={{ ...PREVIEW_SLIDE, theme: activeTheme }} 
                isPreview={true} 
              />
            )}
          </div>
        </div>

        {/* EDITOR CONTROLS */}
        {activeTheme && (
          <div className="theme-controls panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid var(--color-surface-border)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={activeTheme.name}
                  onChange={(e) => setActiveTheme({...activeTheme, name: e.target.value})}
                  
                  className="input-field"
                  style={{ fontWeight: 'bold', fontSize: 'var(--font-size-md)' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button 
                  className="btn-primary" 
                  style={{ background: 'var(--color-accent)' }}
                  onClick={async () => {
                    const store = (await import('../../stores')).usePresentationStore.getState();
                    if (store.state.currentSlide) {
                      store.sendToProgram({ ...store.state.currentSlide, theme: activeTheme });
                    }
                  }}
                >
                  <Layout size={16} /> Apply to Live Slide
                </button>
                <button 
                  className="btn-secondary"
                  onClick={async () => {
                    if (window.sanctuary) {
                      await window.sanctuary.settings.set('bible.defaultThemeId', activeTheme.id);
                      const store = (await import('../../stores')).useThemeStore.getState();
                      store.setDefaultBibleTheme(activeTheme);
                      alert('Set as Default Bible Theme!');
                    }
                  }}
                >
                  Set Default (Bible)
                </button>
                <button 
                  className="btn-secondary"
                  onClick={async () => {
                    if (window.sanctuary) {
                      await window.sanctuary.settings.set('lyrics.defaultThemeId', activeTheme.id);
                      const store = (await import('../../stores')).useThemeStore.getState();
                      store.setDefaultSongTheme(activeTheme);
                      alert('Set as Default Lyrics Theme!');
                    }
                  }}
                >
                  Set Default (Songs)
                </button>
                <button className="btn-secondary" onClick={() => duplicateTheme(activeTheme)}><Copy size={16} /> Duplicate</button>
                {!activeTheme.isBuiltIn && <button className="btn-danger" onClick={() => deleteTheme(activeTheme.id)}><Trash2 size={16} /></button>}
                {!activeTheme.isBuiltIn && <button className="btn-primary" onClick={saveTheme}><Save size={16} /> Save</button>}
              </div>
            </div>

            <div className="controls-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-4)', padding: 'var(--space-4)', overflowY: 'auto' }}>
              
              {/* Typography */}
              <div className="control-group">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}><Type size={16} /> Typography</h3>
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Font Family</label>
                  <div className="flex flex-col gap-2">
                      <select 
                        className="input-field" 
                        value={activeTheme.typography.fontFamily}
                        onChange={(e) => setActiveTheme({...activeTheme, typography: {...activeTheme.typography, fontFamily: e.target.value}})}
                      >
                        <optgroup label="App Fonts">
                          <option value="sans-serif">Sans-Serif</option>
                          <option value="Inter, sans-serif">Inter</option>
                          <option value="Poppins, sans-serif">Poppins</option>
                          <option value="Montserrat, sans-serif">Montserrat</option>
                          <option value="Roboto, sans-serif">Roboto</option>
                          <option value="Oswald, sans-serif">Oswald</option>
                          <option value="Crimson Pro, serif">Crimson Pro</option>
                          <option value="Playfair Display, serif">Playfair Display</option>
                          <option value="Lora, serif">Lora</option>
                          <option value="Cinzel, serif">Cinzel</option>
                          <option value="Bebas Neue, sans-serif">Bebas Neue</option>
                          <option value="Tahoma, sans-serif">Tahoma</option>
                          <option value="Georgia, serif">Georgia</option>
                          <option value="monospace">Monospace</option>
                        </optgroup>
                        {systemFonts.length > 0 && (
                          <optgroup label="System Fonts">
                            {systemFonts.map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                      {systemFonts.length === 0 && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={async () => {
                            try {
                              if ('queryLocalFonts' in window) {
                                const fonts = await (window as any).queryLocalFonts();
                                const uniqueFonts = Array.from(new Set(fonts.map((f: any) => f.family))) as string[];
                                setSystemFonts(uniqueFonts.sort());
                              } else {
                                alert('System fonts API not supported in this environment.');
                              }
                            } catch (e) {
                              console.error(e);
                              alert('Permission to access system fonts was denied or failed.');
                            }
                          }}
                        >
                          Load System Fonts
                        </button>
                      )}
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Font Size (cqw)</label>
                  <input 
                    type="range" min="2" max="12" step="0.5" 
                    value={activeTheme.typography.fontSize}
                    onChange={(e) => setActiveTheme({...activeTheme, typography: {...activeTheme.typography, fontSize: parseFloat(e.target.value)}})}
                    
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Font Weight</label>
                  <select 
                    className="input-field" 
                    value={activeTheme.typography.fontWeight}
                    onChange={(e) => setActiveTheme({...activeTheme, typography: {...activeTheme.typography, fontWeight: parseInt(e.target.value)}})}
                    
                  >
                    <option value="300">Light</option>
                    <option value="400">Regular</option>
                    <option value="700">Bold</option>
                    <option value="900">Black</option>
                  </select>
                </div>
              </div>

              {/* Layout & Lower Thirds */}
              <div className="control-group">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}><Layout size={16} /> Layout (Lower Thirds)</h3>
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Vertical Alignment</label>
                  <select 
                    className="input-field" 
                    value={activeTheme.layout.verticalAlign}
                    onChange={(e) => setActiveTheme({...activeTheme, layout: {...activeTheme.layout, verticalAlign: e.target.value as any}})}
                    
                  >
                    <option value="top">Top</option>
                    <option value="center">Center</option>
                    <option value="bottom">Bottom (Lower Third)</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Text Alignment</label>
                  <select 
                    className="input-field" 
                    value={activeTheme.layout.textAlign}
                    onChange={(e) => setActiveTheme({...activeTheme, layout: {...activeTheme.layout, textAlign: e.target.value as any}})}
                    
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Max Width (%)</label>
                    <input 
                      type="range" min="50" max="100" step="1" 
                      value={activeTheme.layout.maxWidth}
                      onChange={(e) => setActiveTheme({...activeTheme, layout: {...activeTheme.layout, maxWidth: parseInt(e.target.value)}})}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Side Margins (%)</label>
                    <input 
                      type="range" min="0" max="50" step="1" 
                      value={activeTheme.layout.marginLeft}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setActiveTheme({...activeTheme, layout: {...activeTheme.layout, marginLeft: val, marginRight: val}});
                      }}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Bottom Margin (%)</label>
                  <input 
                    type="range" min="0" max="50" step="1" 
                    value={activeTheme.layout.marginBottom}
                    onChange={(e) => setActiveTheme({...activeTheme, layout: {...activeTheme.layout, marginBottom: parseInt(e.target.value)}})}
                    
                  />
                </div>
              </div>

              {/* Colors & Backgrounds */}
              <div className="control-group">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}><ImageIcon size={16} /> Appearance</h3>
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Background Type</label>
                  <select
                    value={activeTheme.background.type}
                    onChange={(e) => setActiveTheme({...activeTheme, background: {...activeTheme.background, type: e.target.value as any}})}
                    
                    className="input-field"
                    style={{ padding: '8px' }}
                  >
                    <option value="solid">Solid Color</option>
                      <option value="transparent">Transparent</option>
                    <option value="image">Image Background</option>
                    <option value="gradient">Gradient Background</option>
                  </select>
                </div>

                {activeTheme.background.type === 'solid' && (
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Solid Background Color</label>
                    <input 
                      type="color" 
                      value={activeTheme.background.color}
                      onChange={(e) => setActiveTheme({...activeTheme, background: {...activeTheme.background, color: e.target.value}})}
                      
                      className="input-field"
                    />
                  </div>
                )}

                {activeTheme.background.type === 'image' && (
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Image File Path or URL</label>
                    <input 
                      type="text" 
                      value={activeTheme.background.imagePath || ''}
                      onChange={(e) => setActiveTheme({...activeTheme, background: {...activeTheme.background, imagePath: e.target.value}})}
                      
                      className="input-field"
                      placeholder="e.g. C:/Images/bg.jpg or https://..."
                    />
                  </div>
                )}

                {activeTheme.background.type === 'gradient' && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Gradient Start</label>
                      <input 
                        type="color" 
                        value={activeTheme.background.gradientStart}
                        onChange={(e) => setActiveTheme({...activeTheme, background: {...activeTheme.background, gradientStart: e.target.value}})}
                        
                        className="input-field"
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Gradient End</label>
                      <input 
                        type="color" 
                        value={activeTheme.background.gradientEnd}
                        onChange={(e) => setActiveTheme({...activeTheme, background: {...activeTheme.background, gradientEnd: e.target.value}})}
                        
                        className="input-field"
                      />
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <label>Text Color</label>
                  <input 
                    type="color" 
                    value={activeTheme.colors.textPrimary}
                    onChange={(e) => setActiveTheme({...activeTheme, colors: {...activeTheme.colors, textPrimary: e.target.value}})}
                    
                    className="input-field"
                  />
                </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Full Screen Dimming (RGBA)</label>
                    <input 
                      type="text" 
                      value={activeTheme.colors.overlayBackground || ''}
                      onChange={(e) => setActiveTheme({...activeTheme, colors: {...activeTheme.colors, overlayBackground: e.target.value}})}
                      
                      className="input-field"
                      placeholder="rgba(0,0,0,0.5)"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Reference Pill Background</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={activeTheme.colors.referenceBackground?.startsWith('#') ? activeTheme.colors.referenceBackground.substring(0,7) : '#000000'}
                          onChange={(e) => setActiveTheme({...activeTheme, colors: {...activeTheme.colors, referenceBackground: e.target.value}})}
                          className="input-field w-16 p-0 h-10"
                        />
                        <button className="btn btn-secondary" onClick={() => setActiveTheme({...activeTheme, colors: {...activeTheme.colors, referenceBackground: 'transparent'}})}>Clear</button>
                      </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Reference Text Color</label>
                    <input 
                      type="color" 
                      value={activeTheme.colors.referenceText || activeTheme.colors.reference || '#9CA3AF'}
                      onChange={(e) => setActiveTheme({...activeTheme, colors: {...activeTheme.colors, referenceText: e.target.value}})}
                      className="input-field"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label>Text Box Background</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={activeTheme.colors.textBoxBackground?.startsWith('#') ? activeTheme.colors.textBoxBackground.substring(0,7) : '#000000'}
                          onChange={(e) => setActiveTheme({...activeTheme, colors: {...activeTheme.colors, textBoxBackground: e.target.value}})}
                          className="input-field w-16 p-0 h-10"
                        />
                        <button className="btn btn-secondary" onClick={() => setActiveTheme({...activeTheme, colors: {...activeTheme.colors, textBoxBackground: 'transparent'}})}>Clear</button>
                      </div>
                  </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
