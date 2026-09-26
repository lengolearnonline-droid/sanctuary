// ============================================================
// Sanctuary — Songs Page
// ============================================================

import React, { useEffect, useState, useCallback } from 'react';
import { useSongStore, useServiceStore, usePresentationStore } from '../../stores/index';
import type { Song } from '../../../shared/types';
import { ArrangementEditor } from './ArrangementEditor';

declare global {
  interface Window {
    sanctuary: {
      song: {
        create: (data: string) => Promise<Song>;
        load: (id: string) => Promise<Song | null>;
        update: (id: string, updates: string) => Promise<Song>;
        delete: (id: string) => Promise<boolean>;
        list: (limit?: number) => Promise<Song[]>;
        search: (query: string, limit?: number) => Promise<Song[]>;
      };
      [key: string]: any;
    };
  }
}

export function SongsPage() {
  const { songs, selectedSong, searchQuery, setSongs, setSelectedSong, setSearchQuery } = useSongStore();
  const { activeService, addItemToService } = useServiceStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [newSongTitle, setNewSongTitle] = useState('');
  const [editingArrangement, setEditingArrangement] = useState(false);

  // Load songs on mount
  useEffect(() => {
    loadSongs();
    
    const handleAiLyrics = (e: any) => {
      setSearchQuery(e.detail);
    };
    window.addEventListener('ai:show_lyrics', handleAiLyrics);
    return () => window.removeEventListener('ai:show_lyrics', handleAiLyrics);
  }, []);

  const loadSongs = async () => {
    try {
      const result = await window.sanctuary.song.list(50);
      setSongs(result);
    } catch (err) {
      console.error('Failed to load songs:', err);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      if (query.trim()) {
        const results = await window.sanctuary.song.search(query);
        setSongs(results);
      } else {
        await loadSongs();
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleCreateSong = async () => {
    if (!newSongTitle.trim()) return;
    try {
      const song = await window.sanctuary.song.create(
        JSON.stringify({
          title: newSongTitle.trim(),
          artist: '',
          author: '',
          copyright: '',
          ccliNumber: '',
          key: '',
          language: 'en',
          tags: [],
          arrangement: [],
          sections: [],
        })
      );
      setNewSongTitle('');
      setIsCreating(false);
      await loadSongs();
      setSelectedSong(song);
    } catch (err) {
      console.error('Failed to create song:', err);
    }
  };

  const handleAutoFetch = async () => {
    if (!newSongTitle.trim()) return;
    setIsFetching(true);
    try {
      const data = await window.sanctuary.song.fetchLyrics(newSongTitle.trim());
      if (!data) {
        alert("Couldn't find lyrics for that song. Try adding the artist name.");
        setIsFetching(false);
        return;
      }

      const song = await window.sanctuary.song.create(
        JSON.stringify({
          title: data.title,
          artist: data.artist,
          author: '',
          copyright: '',
          ccliNumber: '',
          key: '',
          language: 'en',
          tags: [],
          arrangement: data.sections.map((s: any) => s.id),
          sections: data.sections,
        })
      );
      setNewSongTitle('');
      setIsCreating(false);
      await loadSongs();
      setSelectedSong(song);
    } catch (err) {
      console.error('Failed to auto-fetch:', err);
      alert("Error fetching lyrics.");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImportSongs = async () => {
    try {
      const result = await window.sanctuary.song.import();
      if (result && result.success) {
        alert(result.message);
        await loadSongs();
      } else if (result && result.message !== 'Canceled') {
        alert(result.message);
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
  };

  const handleDeleteSong = async (id: string) => {
    try {
      await window.sanctuary.song.delete(id);
      if (selectedSong?.id === id) setSelectedSong(null);
      await loadSongs();
    } catch (err) {
      console.error('Failed to delete song:', err);
    }
  };

  const handleSelectSong = async (song: Song) => {
    try {
      const full = await window.sanctuary.song.load(song.id);
      if (full) setSelectedSong(full);
    } catch (err) {
      console.error('Failed to load song:', err);
    }
  };

  // ---- Keyboard Shortcuts ----
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N: New song
      if (e.ctrlKey && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        setIsCreating(true);
      }
      // Escape: Close create form or deselect
      if (e.key === 'Escape') {
        if (isCreating) {
          setIsCreating(false);
        } else if (editingArrangement) {
          setEditingArrangement(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreating, editingArrangement]);

  return (
    <div className="songs-page" style={{ display: 'flex', height: '100%', gap: '1px' }}>
      {/* Left: Song List */}
      <div className="songs-list-panel" style={{
        width: '320px',
        minWidth: '280px',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface, #1a1a2e)',
        borderRight: '1px solid var(--border-color, #2a2a3e)',
      }}>
        {/* Search bar */}
        <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color, #2a2a3e)' }}>
          <input
            type="text"
            placeholder="Search songs... (title, artist)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'var(--bg-input, #0f0f1a)',
              border: '1px solid var(--border-color, #2a2a3e)',
              borderRadius: '6px',
              color: 'var(--text-primary, #e0e0e0)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        {/* New song button or form */}
        <div style={{ padding: '8px 12px' }}>
          {isCreating ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input
                autoFocus
                type="text"
                placeholder="Song title (e.g. 'Way Maker - Sinach')"
                value={newSongTitle}
                onChange={(e) => setNewSongTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isFetching && handleAutoFetch()}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: 'var(--bg-input, #0f0f1a)',
                  border: '1px solid var(--accent, #6366f1)',
                  borderRadius: '4px',
                  color: 'var(--text-primary, #e0e0e0)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={handleAutoFetch} disabled={isFetching} style={{...btnStyle, flex: 1, background: '#10b981', borderColor: '#059669'}}>
                  {isFetching ? 'Fetching...' : '✨ Auto-Fetch'}
                </button>
                <button onClick={handleCreateSong} disabled={isFetching} style={{...btnStyle, flex: 1}}>Blank</button>
                <button onClick={() => setIsCreating(false)} disabled={isFetching} style={btnStyleMuted}>Cancel</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setIsCreating(true)}
                style={{ ...btnStyle, flex: 1 }}
              >
                + New Song
              </button>
              <button
                onClick={handleImportSongs}
                style={{ ...btnStyleMuted, flex: 1 }}
              >
                📥 Import
              </button>
            </div>
          )}
        </div>

        {/* Song list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
          {songs.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted, #666)', fontSize: '13px' }}>
              {searchQuery ? 'No songs found.' : 'No songs yet. Create one!'}
            </div>
          )}
          {songs.map((song) => (
              <div
                key={song.id}
                onClick={() => handleSelectSong(song)}
                style={{
                  padding: '10px 16px',
                  cursor: 'pointer',
                  background: selectedSong?.id === song.id ? 'var(--bg-active, #2a2a4e)' : 'transparent',
                  borderLeft: selectedSong?.id === song.id ? '3px solid var(--accent, #6366f1)' : '3px solid transparent',
                  transition: 'all 0.15s',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary, #e0e0e0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {song.title}
                  </div>
                  {song.artist && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted, #888)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.artist}
                    </div>
                  )}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted, #666)', marginTop: '3px' }}>
                    {song.sections?.length || 0} sections • {song.key || 'No key'}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete "' + song.title + '"?')) {
                      handleDeleteSong(song.id);
                    }
                  }}
                  title="Delete Song"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted, #888)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted, #888)')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Right: Song Detail / Arrangement */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-main, #12121e)' }}>
        {selectedSong ? (
          editingArrangement ? (
            <ArrangementEditor
              song={selectedSong}
              onClose={() => setEditingArrangement(false)}
              onSave={async (updatedSong) => {
                await window.sanctuary.song.update(updatedSong.id, JSON.stringify({
                  arrangement: updatedSong.arrangement,
                  sections: updatedSong.sections,
                }));
                setSelectedSong(updatedSong);
                setEditingArrangement(false);
                await loadSongs();
              }}
            />
          ) : (
            <SongDetail
              song={selectedSong}
              onEditArrangement={() => setEditingArrangement(true)}
              onDelete={() => handleDeleteSong(selectedSong.id)}
              onUpdate={async (updates) => {
                const updated = await window.sanctuary.song.update(
                  selectedSong.id,
                  JSON.stringify(updates)
                );
                setSelectedSong(updated);
                await loadSongs();
              }}
            />
          )
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted, #666)',
            fontSize: '15px',
          }}>
            Select a song or create a new one
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Song Detail Component ----

function SongDetail({ song, onEditArrangement, onDelete, onUpdate }: {
  song: Song;
  onEditArrangement: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Song>) => void;
}) {
  const { activeService } = useServiceStore();
  
  const handlePresentSection = (sectionId: string) => {
    const sec = song.sections?.find((s) => s.id === sectionId);
    if (!sec) return;
    
    const slide = {
      id: sectionId,
      type: 'song',
      content: {
        title: song.title,
        body: sec.lines.join('\n'),
        subtitle: song.artist || '',
        reference: sec.label,
        mediaPath: null,
        html: null
      }
    };
    
    usePresentationStore.getState().sendToProgram(slide as any);
  };
  
  return (
    <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary, #e0e0e0)', fontSize: '22px' }}>
            {song.title}
          </h2>
          {song.artist && (
            <div style={{ color: 'var(--text-muted, #888)', fontSize: '14px', marginTop: '4px' }}>
              {song.artist}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {activeService && (
            <button 
              onClick={async () => {
                const state = useServiceStore.getState();
                state.addItemToService({
                  id: `item-${Date.now()}`,
                  type: 'song',
                  title: song.title,
                  content: { songId: song.id },
                  order: state.activeService!.items.length,
                });
                if (window.sanctuary) {
                  const toSave = { ...state.activeService };
                  toSave.items = toSave.items.map((it, idx) => ({ ...it, order: idx }));
                  await window.sanctuary.service.save(JSON.stringify(toSave));
                }
              }} 
              style={{ ...btnStyleAccent, background: 'var(--success, #10b981)' }}
            >
              + Add to Service
            </button>
          )}
          <button onClick={onEditArrangement} style={btnStyleAccent}>
            📝 Edit Arrangement
          </button>
          <button onClick={onDelete} style={btnStyleDanger}>
            Delete
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '12px',
        marginBottom: '24px',
        padding: '16px',
        background: 'var(--bg-surface, #1a1a2e)',
        borderRadius: '8px',
      }}>
        <MetaField label="Key" value={song.key || '—'} />
        <MetaField label="CCLI #" value={song.ccliNumber || '—'} />
        <MetaField label="Author" value={song.author || '—'} />
        <MetaField label="Copyright" value={song.copyright || '—'} />
        <MetaField label="Language" value={song.language} />
        <MetaField label="Tags" value={song.tags?.join(', ') || '—'} />
      </div>

      {/* Arrangement order */}
      {song.arrangement && song.arrangement.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: 'var(--text-secondary, #b0b0b0)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
            Arrangement
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {song.arrangement.map((sectionId, i) => {
              const section = song.sections?.find((s) => s.id === sectionId);
              return (
                <span key={`${sectionId}-${i}`} style={{
                  padding: '4px 10px',
                  background: getSectionColor(section?.type || 'verse'),
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#fff',
                }}>
                  {section?.label || sectionId}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Sections */}
      <h3 style={{ color: 'var(--text-secondary, #b0b0b0)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
        Sections ({song.sections?.length || 0})
      </h3>
      {(!song.sections || song.sections.length === 0) && (
        <div style={{ color: 'var(--text-muted, #666)', fontSize: '13px', fontStyle: 'italic' }}>
          No sections yet. Click "Edit Arrangement" to add verse, chorus, and bridge sections.
        </div>
      )}
      {song.sections?.map((section) => (
        <div key={section.id} style={{
          marginBottom: '16px',
          padding: '16px',
          background: 'var(--bg-surface, #1a1a2e)',
          borderRadius: '8px',
          borderLeft: `4px solid ${getSectionColor(section.type)}`,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                padding: '2px 8px',
                background: getSectionColor(section.type),
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#fff',
                textTransform: 'uppercase',
              }}>
                {section.type}
              </span>
              <span style={{ color: 'var(--text-primary, #e0e0e0)', fontWeight: 500, fontSize: '14px' }}>
                {section.label}
              </span>
            </div>
            
            <button
              onClick={() => handlePresentSection(section.id)}
              style={{
                padding: '4px 12px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                border: '1px solid #10b981',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ▶ Present Live
            </button>
          </div>
          <div style={{
            color: 'var(--text-secondary, #b0b0b0)',
            fontSize: '14px',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            fontFamily: '"Georgia", serif',
          }}>
            {section.lines.join('\n')}
          </div>
        </div>
      ))}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted, #666)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', color: 'var(--text-primary, #e0e0e0)' }}>
        {value}
      </div>
    </div>
  );
}

// ---- Helpers ----

function getSectionColor(type: string): string {
  switch (type) {
    case 'verse':     return '#3b82f6';
    case 'chorus':    return '#f59e0b';
    case 'bridge':    return '#8b5cf6';
    case 'pre-chorus': return '#ec4899';
    case 'tag':       return '#10b981';
    case 'intro':     return '#6366f1';
    case 'outro':     return '#ef4444';
    case 'interlude': return '#14b8a6';
    default:          return '#6b7280';
  }
}

const btnStyle: React.CSSProperties = {
  padding: '6px 14px',
  background: 'var(--accent, #6366f1)',
  border: 'none',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '13px',
  cursor: 'pointer',
  fontWeight: 500,
};

const btnStyleMuted: React.CSSProperties = {
  ...btnStyle,
  background: 'var(--bg-hover, #2a2a3e)',
  color: 'var(--text-muted, #888)',
};

const btnStyleAccent: React.CSSProperties = {
  ...btnStyle,
  background: 'var(--accent, #6366f1)',
};

const btnStyleDanger: React.CSSProperties = {
  ...btnStyle,
  background: '#ef4444',
};

export default SongsPage;



