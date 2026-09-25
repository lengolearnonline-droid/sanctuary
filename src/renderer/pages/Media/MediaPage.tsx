import React, { useState, useEffect, useCallback } from 'react';
import { Panel, Button, Badge, Slider } from '../../components/ui';
import { Play, Pause, Square, Volume2, VolumeX, Image as ImageIcon, Video, Music, Trash2, MonitorPlay } from 'lucide-react';
import { useMediaStore, usePresentationStore } from '../../stores';
import type { MediaItem } from '../../../shared/types';

export function MediaPage() {
  const { 
    activeAudio, 
    globalVolume, 
    isMuted, 
    playAudio, 
    pauseAudio, 
    resumeAudio, 
    stopAudio,
    setVolume,
    setGlobalVolume,
    toggleMute
  } = useMediaStore();

  const [media, setMedia] = useState<MediaItem[]>([]);

  const loadMedia = useCallback(async () => {
    try {
      const list = await window.sanctuary.media.list();
      setMedia(list);
    } catch (e) {
      console.error('Failed to load media:', e);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  const handleImport = async () => {
    try {
      const result = await window.sanctuary.media.import();
      if (result.success) {
        loadMedia();
      }
    } catch (e) {
      console.error('Failed to import media:', e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this media item?')) {
      try {
        await window.sanctuary.media.delete(id);
        loadMedia();
      } catch (e) {
        console.error('Failed to delete media:', e);
      }
    }
  };

  const handlePreviewMedia = (item: MediaItem) => {
    const slide = {
      id: item.id,
      type: 'media',
      content: {
        title: item.name,
        body: '',
        subtitle: '',
        reference: '',
        mediaPath: item.path,
        html: null
      }
    };
    usePresentationStore.getState().setPreviewSlide(slide as any);
  };

  const handlePresentMedia = (item: MediaItem) => {
    const slide = {
      id: item.id,
      type: 'media',
      content: {
        title: item.name,
        body: '',
        subtitle: '',
        reference: '',
        mediaPath: item.path,
        html: null
      }
    };
    usePresentationStore.getState().sendToProgram(slide as any);
  };

  const handlePlayAudio = (item: MediaItem) => {
    if (activeAudio?.id === item.id) {
      if (activeAudio.isPlaying) {
        pauseAudio();
      } else {
        resumeAudio();
      }
    } else {
      playAudio({
        id: item.id,
        title: item.name,
        path: item.path,
        volume: 1.0,
        loop: false,
      });
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video size={24} />;
      case 'image': return <ImageIcon size={24} />;
      case 'audio': return <Music size={24} />;
      default: return <ImageIcon size={24} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'var(--space-4)', gap: 'var(--space-4)' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>Media Library</h1>
        <Button variant="primary" onClick={handleImport}>Import Media</Button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', flex: 1, minHeight: 0 }}>
        
        {/* Main Media Grid */}
        <Panel style={{ flex: 2, overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            
            {media.map((item) => (
              <div 
                key={item.id} 
                onClick={() => handlePreviewMedia(item)}
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-surface-border)',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer'
                }}
              >
                {/* Thumbnail Area */}
                <div style={{
                  height: '120px',
                  background: 'var(--color-bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-tertiary)',
                  position: 'relative'
                }}>
                  {item.type === 'image' ? (
                    <img src={item.path} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                  ) : item.type === 'video' ? (
                    <video src={item.path} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                  ) : (
                    getMediaIcon(item.type)
                  )}
                  
                  {/* Delete Button overlay */}
                  <Button 
                    size="sm" 
                    variant="danger" 
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                    style={{ position: 'absolute', top: 8, right: 8, padding: 4, opacity: 0.8 }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                {/* Details Area */}
                <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge>{item.type}</Badge>
                    
                    {item.type === 'audio' ? (
                      <Button 
                        size="sm" 
                        variant={activeAudio?.id === item.id && activeAudio.isPlaying ? 'primary' : 'secondary'}
                        onClick={(e) => { e.stopPropagation(); handlePlayAudio(item); }}
                        icon={activeAudio?.id === item.id && activeAudio.isPlaying ? Pause : Play}
                      >
                        {activeAudio?.id === item.id && activeAudio.isPlaying ? 'Pause' : 'Play'}
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="primary"
                        onClick={(e) => { e.stopPropagation(); handlePresentMedia(item); }}
                        icon={MonitorPlay}
                      >
                        Live
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {media.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-tertiary)' }}>
                No media found. Click "Import Media" to add files.
              </div>
            )}
          </div>
        </Panel>

        {/* Media Engine Sidebar */}
        <Panel title="Media Engine" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '350px' }}>
          
          {/* Live Video Controls */}
          <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Live Video Controls</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button size="sm" variant="secondary" onClick={() => window.sanctuary?.presentation?.mediaCommand?.(JSON.stringify({action: 'pause'}))} icon={Pause}>Pause</Button>
                <Button size="sm" variant="secondary" onClick={() => window.sanctuary?.presentation?.mediaCommand?.(JSON.stringify({action: 'play'}))} icon={Play}>Play</Button>
              </div>
            </div>
          </div>

          {/* Master Volume */}
          <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Master Volume</span>
              <Button size="icon" variant="ghost" onClick={toggleMute}>
                {isMuted || globalVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
            </div>
            <Slider 
              min={0} max={1} step={0.01} 
              value={isMuted ? 0 : globalVolume} 
              onChange={setGlobalVolume} 
              showValue={false} 
            />
          </div>

          {/* Active Track */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Now Playing
            </h3>
            
            {activeAudio ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>{activeAudio.title}</div>
                
                {/* Progress Bar */}
                <Slider 
                  min={0} 
                  max={activeAudio.duration || 100} 
                  value={activeAudio.currentTime} 
                  onChange={() => {}} // Read-only for now, would need seek implementation
                  showValue={false}
                />
                
                {/* Time Display */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                  <span>{formatTime(activeAudio.currentTime)}</span>
                  <span>{formatTime(activeAudio.duration)}</span>
                </div>

                {/* Transport Controls */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                  <Button size="lg" variant={activeAudio.isPlaying ? 'primary' : 'secondary'} onClick={activeAudio.isPlaying ? pauseAudio : resumeAudio}>
                    {activeAudio.isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </Button>
                  <Button size="lg" variant="danger" onClick={stopAudio}>
                    <Square size={24} />
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)' }}>
                No audio playing
              </div>
            )}
          </div>
        </Panel>

      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
