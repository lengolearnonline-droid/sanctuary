import React, { useState, useEffect } from 'react';
import { LowerThird, Slide } from '../../../shared/types';
import { Plus, Trash2, Save, Play, Captions } from 'lucide-react';
import { usePresentationStore } from '../../stores';

export function LowerThirdsPage() {
  const [lowerThirds, setLowerThirds] = useState<LowerThird[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    loadLowerThirds();
  }, []);

  const loadLowerThirds = async () => {
    if (window.sanctuary) {
      const lts = await window.sanctuary.lowerThirds.list();
      setLowerThirds(lts);
      if (lts.length > 0 && !activeId) {
        setActiveId(lts[0].id);
      }
    }
  };

  const handleCreate = async () => {
    if (window.sanctuary) {
      const newLt = await window.sanctuary.lowerThirds.create(JSON.stringify({
        name: 'New Lower Third',
        personName: 'Name Here',
        title: 'Title Here'
      }));
      setLowerThirds([newLt, ...lowerThirds]);
      setActiveId(newLt.id);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.sanctuary) {
      await window.sanctuary.lowerThirds.delete(id);
      await loadLowerThirds();
      if (activeId === id) setActiveId(null);
    }
  };

  const handleSave = async () => {
    if (window.sanctuary && activeLt) {
      await window.sanctuary.lowerThirds.update(activeLt.id, JSON.stringify(activeLt));
      alert('Saved!');
    }
  };

  const handleSendToLive = () => {
    if (activeLt) {
      const slide: Slide = {
        id: `lt-${activeLt.id}`,
        type: 'lower-third',
        content: {
          title: activeLt.personName,
          subtitle: `${activeLt.title}${activeLt.organization ? ` | ${activeLt.organization}` : ''}`,
          body: '',
          reference: ''
        },
        theme: null as any, // We will handle lower-third rendering separately in SlideRenderer
        notes: ''
      };
      // Attach the specific lower-third data to the slide so SlideRenderer can use it
      (slide as any).lowerThirdData = activeLt;
      
      usePresentationStore.getState().sendToProgram(slide);
    }
  };

  const updateActive = (updates: Partial<LowerThird>) => {
    setLowerThirds(prev => prev.map(lt => lt.id === activeId ? { ...lt, ...updates } : lt));
  };

  const activeLt = lowerThirds.find(lt => lt.id === activeId);

  useEffect(() => {
    if (activeLt) {
      usePresentationStore.getState().setPreviewSlide({
        id: `lt_${activeLt.id}_preview`,
        type: 'lower-third',
        content: { title: activeLt.name, body: '', reference: '' },
        lowerThirdData: activeLt
      } as any);
    } else {
      usePresentationStore.getState().setPreviewSlide(null);
    }
    return () => {
      usePresentationStore.getState().setPreviewSlide(null);
    };
  }, [activeLt]);

  return (
    <div style={{ display: 'flex', height: '100%', gap: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-bg-primary)' }}>
      {/* Sidebar List */}
      <div className="panel" style={{ width: '300px', display: 'flex', flexDirection: 'column' }}>
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--color-surface-border)' }}>
          <h2 style={{ margin: 0, fontSize: 'var(--font-size-md)' }}>Lower Thirds</h2>
          <button className="btn-icon" onClick={handleCreate} title="Create New"><Plus size={18} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-2)' }}>
          {lowerThirds.map(lt => (
            <div
              key={lt.id}
              onClick={() => setActiveId(lt.id)}
              style={{
                padding: 'var(--space-3)',
                marginBottom: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                background: activeId === lt.id ? 'var(--color-accent)' : 'transparent',
                color: activeId === lt.id ? 'white' : 'var(--color-text-secondary)'
              }}
            >
              <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{lt.name}</div>
              <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lt.personName}</div>
            </div>
          ))}
          {lowerThirds.length === 0 && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)' }}>
              No lower thirds created yet.
            </div>
          )}
        </div>
      </div>

      {/* Editor Main Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', overflow: 'hidden' }}>
        {activeLt ? (
          <>
            {/* Header controls */}
            <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-4)' }}>
              <input 
                type="text"
                className="input-field"
                style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', border: 'none', background: 'transparent', flex: 1 }}
                value={activeLt.name}
                onChange={e => updateActive({ name: e.target.value })}
                placeholder="Lower Third Name"
              />
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button className="btn-danger" style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={() => handleDelete(activeLt.id)}>
                  <Trash2 size={16} /> Delete
                </button>
                <button className="btn-secondary" style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={handleSave}>
                  <Save size={16} /> Save
                </button>
                <button className="btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--color-accent)' }} onClick={handleSendToLive}>
                  <Play size={16} fill="currentColor" /> Send to Live
                </button>
              </div>
            </div>

            {/* Scrollable Form */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', paddingRight: 'var(--space-2)' }}>
              
              {/* Appearance Section */}
              <div className="panel" style={{ padding: 'var(--space-5)' }}>
                <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>Appearance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Template Style</label>
                  <select 
                    className="input-field"
                    style={{ padding: 'var(--space-3)' }}
                    value={activeLt.template}
                    onChange={e => updateActive({ template: e.target.value })}
                  >
                    <option value="classic">Classic Broadcast (Solid Box)</option>
                    <option value="modern">Modern Minimal (Transparent Accent)</option>
                    <option value="glassy">Pro Glassy (Elegant Frosted Glass)</option>
                    <option value="sermon_topic">Sermon Topic (Book Ribbon)</option>
                    <option value="song_ministration">Song Ministration (Music Note)</option>
                    <option value="testimony">Testimony (Quote Badge)</option>
                  </select>
                </div>
              </div>

                            {/* Content Section */}
              <div className="panel" style={{ padding: 'var(--space-5)' }}>
                <h3 style={{ margin: '0 0 var(--space-4) 0', fontSize: 'var(--font-size-md)', color: 'var(--color-text-primary)' }}>Content</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  
                  {(() => {
                    const t = activeLt.template;
                    
                    let mainLabel = "Person Name / Main Text";
                    let mainPlaceholder = "e.g. Pastor John Doe";
                    let subLabel = "Title / Subtext";
                    let subPlaceholder = "e.g. Senior Pastor";
                    let extraLabel = "Organization (Optional)";
                    let extraPlaceholder = "e.g. Grace Community Church";

                    if (t === 'sermon_topic') {
                      mainLabel = "Preacher's Name";
                      mainPlaceholder = "e.g. Rev. Michael Smith";
                      subLabel = "Sermon Title";
                      subPlaceholder = "e.g. The Power of Faith";
                      extraLabel = "Top Banner Text (Optional)";
                      extraPlaceholder = "e.g. SERMON TOPIC";
                    } else if (t === 'song_ministration') {
                      mainLabel = "Artist / Minister Name";
                      mainPlaceholder = "e.g. The Worship Team";
                      subLabel = "Song Title";
                      subPlaceholder = "e.g. Oceans";
                      extraLabel = "Choir / Group (Optional)";
                      extraPlaceholder = "e.g. Youth Choir";
                    } else if (t === 'testimony') {
                      mainLabel = "Testifier's Name";
                      mainPlaceholder = "e.g. Jane Doe";
                      subLabel = "Testimony Subject";
                      subPlaceholder = "e.g. Healing and Deliverance";
                      extraLabel = "Location / Branch (Optional)";
                      extraPlaceholder = "e.g. North Campus";
                    }

                    return (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                          <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{mainLabel}</label>
                          <input 
                            type="text" 
                            className="input-field"
                            style={{ padding: 'var(--space-3)' }}
                            value={activeLt.personName}
                            onChange={e => updateActive({ personName: e.target.value })}
                            placeholder={mainPlaceholder}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                          <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{subLabel}</label>
                          <input 
                            type="text" 
                            className="input-field"
                            style={{ padding: 'var(--space-3)' }}
                            value={activeLt.title}
                            onChange={e => updateActive({ title: e.target.value })}
                            placeholder={subPlaceholder}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                          <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>{extraLabel}</label>
                          <input 
                            type="text" 
                            className="input-field"
                            style={{ padding: 'var(--space-3)' }}
                            value={activeLt.organization}
                            onChange={e => updateActive({ organization: e.target.value })}
                            placeholder={extraPlaceholder}
                          />
                        </div>
                      </>
                    );
                  })()}

                </div>
              </div>

            </div>
          </>
        ) : (
          <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            <Captions size={48} style={{ opacity: 0.2, marginBottom: 'var(--space-4)' }} />
            <p style={{ fontSize: 'var(--font-size-lg)' }}>Select or create a lower third to edit</p>
          </div>
        )}
      </div>
    </div>
  );
}
