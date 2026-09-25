// ============================================================
// Sanctuary — Arrangement Editor (Drag & Drop Section Sequencer)
// ============================================================

import React, { useState, useCallback, useRef } from 'react';
import type { Song, SongSection, SongSectionType } from '../../../shared/types';
import { usePresentationStore } from '../../stores';

interface ArrangementEditorProps {
  song: Song;
  onClose: () => void;
  onSave: (updatedSong: Song) => void;
}

export function ArrangementEditor({ song, onClose, onSave }: ArrangementEditorProps) {
  const [sections, setSections] = useState<SongSection[]>([...song.sections]);
  const [arrangement, setArrangement] = useState<string[]>([...(song.arrangement || [])]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [addingSectionType, setAddingSectionType] = useState<SongSectionType | null>(null);
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newSectionLines, setNewSectionLines] = useState('');
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // ---- Drag & Drop for arrangement ----
  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDrop = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const from = dragItem.current;
    const to = dragOverItem.current;

    const newArr = [...arrangement];
    const [moved] = newArr.splice(from, 1);
    newArr.splice(to, 0, moved);
    setArrangement(newArr);

    dragItem.current = null;
    dragOverItem.current = null;
  };

  // ---- Live Presentation ----
  const handlePresentSection = (sectionId: string) => {
    const sec = sections.find(s => s.id === sectionId);
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

  // ---- Section management ----
  const addSection = () => {
    if (!addingSectionType || !newSectionLabel.trim()) return;

    const id = `section-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newSection: SongSection = {
      id,
      songId: song.id,
      type: addingSectionType,
      label: newSectionLabel.trim(),
      lines: newSectionLines.split('\n').filter((l) => l.trim()),
      order: sections.length,
    };

    setSections([...sections, newSection]);
    setArrangement([...arrangement, id]);
    setAddingSectionType(null);
    setNewSectionLabel('');
    setNewSectionLines('');
  };

  const updateSectionLines = (sectionId: string, lines: string[]) => {
    setSections(sections.map((s) => (s.id === sectionId ? { ...s, lines } : s)));
  };

  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
    setArrangement(arrangement.filter((id) => id !== sectionId));
  };

  const addToArrangement = (sectionId: string) => {
    setArrangement([...arrangement, sectionId]);
  };

  const removeFromArrangement = (index: number) => {
    const newArr = [...arrangement];
    newArr.splice(index, 1);
    setArrangement(newArr);
  };

  const duplicateInArrangement = (index: number) => {
    const newArr = [...arrangement];
    newArr.splice(index + 1, 0, arrangement[index]);
    setArrangement(newArr);
  };

  const handleSave = () => {
    onSave({
      ...song,
      sections,
      arrangement,
      updatedAt: new Date().toISOString(),
    });
  };

  // ---- Keyboard shortcuts ----
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', outline: 'none' }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-color, #2a2a3e)',
        background: 'var(--bg-surface, #1a1a2e)',
      }}>
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary, #e0e0e0)', fontSize: '18px' }}>
            Arrangement Editor — {song.title}
          </h2>
          <div style={{ color: 'var(--text-muted, #888)', fontSize: '12px', marginTop: '4px' }}>
            Drag sections to reorder • Click + to repeat a section
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onClose} style={btnMuted}>Cancel</button>
          <button onClick={handleSave} style={btnAccent}>Save Arrangement (Ctrl+S)</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: Available Sections */}
        <div style={{
          width: '320px',
          borderRight: '1px solid var(--border-color, #2a2a3e)',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface, #1a1a2e)',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color, #2a2a3e)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-secondary, #b0b0b0)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Sections ({sections.length})
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {sections.map((section) => (
              <div
                key={section.id}
                style={{
                  padding: '10px 12px',
                  marginBottom: '6px',
                  background: editingSection === section.id ? 'var(--bg-hover, #2a2a4e)' : 'var(--bg-main, #12121e)',
                  borderRadius: '6px',
                  borderLeft: `4px solid ${getSectionColor(section.type)}`,
                  cursor: 'pointer',
                }}
                onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      padding: '1px 6px',
                      background: getSectionColor(section.type),
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 700,
                      color: '#fff',
                      textTransform: 'uppercase',
                    }}>
                      {section.type}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary, #e0e0e0)' }}>
                      {section.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePresentSection(section.id); }}
                      title="Present Section Live"
                      style={{ ...iconBtn, color: '#10b981', fontWeight: 900, background: 'rgba(16, 185, 129, 0.1)' }}
                    >
                      ▶ Live
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToArrangement(section.id); }}
                      title="Add to arrangement"
                      style={iconBtn}
                    >
                      +
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                      title="Delete section"
                      style={{ ...iconBtn, color: '#ef4444' }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Inline editor */}
                {editingSection === section.id && (
                  <div style={{ marginTop: '8px' }}>
                    <textarea
                      value={section.lines.join('\n')}
                      onChange={(e) => updateSectionLines(section.id, e.target.value.split('\n'))}
                      rows={Math.max(3, section.lines.length)}
                      style={{
                        width: '100%',
                        background: 'var(--bg-input, #0f0f1a)',
                        border: '1px solid var(--border-color, #2a2a3e)',
                        borderRadius: '4px',
                        color: 'var(--text-primary, #e0e0e0)',
                        padding: '8px',
                        fontSize: '13px',
                        fontFamily: '"Georgia", serif',
                        lineHeight: 1.6,
                        resize: 'vertical',
                        outline: 'none',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Add new section */}
            {addingSectionType ? (
              <div style={{
                padding: '12px',
                background: 'var(--bg-main, #12121e)',
                borderRadius: '6px',
                border: '1px dashed var(--accent, #6366f1)',
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    padding: '2px 8px',
                    background: getSectionColor(addingSectionType),
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fff',
                    textTransform: 'uppercase',
                  }}>
                    {addingSectionType}
                  </span>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Label (e.g., Verse 1)"
                    value={newSectionLabel}
                    onChange={(e) => setNewSectionLabel(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <textarea
                  placeholder="Lyrics (one line per row)..."
                  value={newSectionLines}
                  onChange={(e) => setNewSectionLines(e.target.value)}
                  rows={4}
                  style={{
                    ...inputStyle,
                    width: '100%',
                    resize: 'vertical',
                    fontFamily: '"Georgia", serif',
                    lineHeight: 1.6,
                  }}
                />
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button onClick={addSection} style={btnAccent}>Add</button>
                  <button onClick={() => setAddingSectionType(null)} style={btnMuted}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {(['verse', 'chorus', 'bridge', 'pre-chorus', 'tag', 'intro', 'outro', 'interlude'] as SongSectionType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setAddingSectionType(type);
                      setNewSectionLabel(getDefaultLabel(type, sections));
                    }}
                    style={{
                      padding: '4px 10px',
                      background: getSectionColor(type),
                      border: 'none',
                      borderRadius: '4px',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                    }}
                  >
                    + {type}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Arrangement (drag-and-drop timeline) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-color, #2a2a3e)',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--text-secondary, #b0b0b0)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Arrangement Order ({arrangement.length} items)
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
            {arrangement.length === 0 && (
              <div style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: 'var(--text-muted, #666)',
                fontSize: '14px',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>📋</div>
                Click "+" on a section to add it here, then drag to reorder.
              </div>
            )}
            {arrangement.map((sectionId, index) => {
              const section = sections.find((s) => s.id === sectionId);
              if (!section) return null;

              return (
                <div
                  key={`${sectionId}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={handleDrop}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    marginBottom: '4px',
                    background: 'var(--bg-surface, #1a1a2e)',
                    borderRadius: '6px',
                    cursor: 'grab',
                    borderLeft: `4px solid ${getSectionColor(section.type)}`,
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  {/* Drag handle */}
                  <span style={{ color: 'var(--text-muted, #666)', fontSize: '16px', cursor: 'grab' }}>⠿</span>

                  {/* Order number */}
                  <span style={{
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-main, #12121e)',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted, #888)',
                  }}>
                    {index + 1}
                  </span>

                  {/* Section badge */}
                  <span style={{
                    padding: '2px 8px',
                    background: getSectionColor(section.type),
                    borderRadius: '3px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#fff',
                    textTransform: 'uppercase',
                    minWidth: '50px',
                    textAlign: 'center',
                  }}>
                    {section.type}
                  </span>

                  {/* Label */}
                  <span style={{ flex: 1, color: 'var(--text-primary, #e0e0e0)', fontSize: '14px' }}>
                    {section.label}
                  </span>

                  {/* Preview of first line */}
                  <span style={{
                    flex: 2,
                    color: 'var(--text-muted, #666)',
                    fontSize: '12px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontStyle: 'italic',
                  }}>
                    {section.lines[0] || '(empty)'}
                  </span>

                  {/* Actions */}
                  <button
                    onClick={() => duplicateInArrangement(index)}
                    title="Repeat this section"
                    style={iconBtn}
                  >
                    ⧉
                  </button>
                  <button
                    onClick={() => removeFromArrangement(index)}
                    title="Remove from arrangement"
                    style={{ ...iconBtn, color: '#ef4444' }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* Compact arrangement label */}
          {arrangement.length > 0 && (
            <div style={{
              padding: '10px 24px',
              borderTop: '1px solid var(--border-color, #2a2a3e)',
              fontSize: '12px',
              color: 'var(--text-muted, #888)',
              background: 'var(--bg-surface, #1a1a2e)',
            }}>
              <strong>Flow:</strong>{' '}
              {arrangement.map((id, i) => {
                const s = sections.find((sec) => sec.id === id);
                return s ? shortLabel(s) : '?';
              }).join(' → ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---- Helpers ----

function getSectionColor(type: string): string {
  switch (type) {
    case 'verse':      return '#3b82f6';
    case 'chorus':     return '#f59e0b';
    case 'bridge':     return '#8b5cf6';
    case 'pre-chorus': return '#ec4899';
    case 'tag':        return '#10b981';
    case 'intro':      return '#6366f1';
    case 'outro':      return '#ef4444';
    case 'interlude':  return '#14b8a6';
    default:           return '#6b7280';
  }
}

function shortLabel(section: SongSection): string {
  switch (section.type) {
    case 'verse':      return section.label.replace('Verse ', 'V');
    case 'chorus':     return 'C';
    case 'bridge':     return 'Br';
    case 'pre-chorus': return 'PC';
    case 'tag':        return 'Tag';
    case 'intro':      return 'Intro';
    case 'outro':      return 'Outro';
    case 'interlude':  return 'Int';
    default:           return section.label.substring(0, 3);
  }
}

function getDefaultLabel(type: SongSectionType, existing: SongSection[]): string {
  const count = existing.filter((s) => s.type === type).length;
  switch (type) {
    case 'verse':      return `Verse ${count + 1}`;
    case 'chorus':     return count === 0 ? 'Chorus' : `Chorus ${count + 1}`;
    case 'bridge':     return count === 0 ? 'Bridge' : `Bridge ${count + 1}`;
    case 'pre-chorus': return count === 0 ? 'Pre-Chorus' : `Pre-Chorus ${count + 1}`;
    case 'tag':        return count === 0 ? 'Tag' : `Tag ${count + 1}`;
    case 'intro':      return 'Intro';
    case 'outro':      return 'Outro';
    case 'interlude':  return count === 0 ? 'Interlude' : `Interlude ${count + 1}`;
    default:           return type;
  }
}

// ---- Inline styles ----

const btnAccent: React.CSSProperties = {
  padding: '6px 16px',
  background: 'var(--accent, #6366f1)',
  border: 'none',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
};

const btnMuted: React.CSSProperties = {
  ...btnAccent,
  background: 'var(--bg-hover, #2a2a3e)',
  color: 'var(--text-muted, #888)',
};

const iconBtn: React.CSSProperties = {
  padding: '4px 8px',
  background: 'transparent',
  border: 'none',
  borderRadius: '4px',
  color: 'var(--text-muted, #888)',
  fontSize: '14px',
  cursor: 'pointer',
};

const inputStyle: React.CSSProperties = {
  padding: '6px 10px',
  background: 'var(--bg-input, #0f0f1a)',
  border: '1px solid var(--border-color, #2a2a3e)',
  borderRadius: '4px',
  color: 'var(--text-primary, #e0e0e0)',
  fontSize: '13px',
  outline: 'none',
};
