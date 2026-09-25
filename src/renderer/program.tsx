// ============================================================
// Sanctuary — Program Output React Entry
// ============================================================

import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/design-system.css';
import { SlideRenderer } from './components/presentation/SlideRenderer';
import type { Slide } from '../shared/types';

function ProgramOutput() {
  const [slide, setSlide] = useState<Slide | null>(null);
  const [isBlackout, setIsBlackout] = useState(false);

  const [debugState, setDebugState] = useState<string>('WAITING FOR IPC...');

  useEffect(() => {
    if (!window.sanctuary) {
      setDebugState('ERROR: window.sanctuary IS UNDEFINED!');
      return;
    }

    setDebugState('window.sanctuary is defined. Waiting for onUpdate...');

    // Fetch the current slide instantly on mount to avoid the race condition
    window.sanctuary.presentation.getCurrentSlide().then((data) => {
      if (data) {
        try {
          setSlide(JSON.parse(data));
          setIsBlackout(false);
        } catch (e) {
          console.error('Failed to parse initial slide', e);
        }
      }
    });

    const unsubUpdate = window.sanctuary.presentation.onUpdate((data: string) => {
      setDebugState(`RECEIVED UPDATE:\n${data.substring(0, 100)}...`);
      try {
        setSlide(JSON.parse(data));
        setIsBlackout(false); // Updating slide usually clears blackout
      } catch (e) {
        setDebugState(`JSON PARSE ERROR: ${String(e)}`);
        console.error('Failed to parse slide data', e);
      }
    });

    const unsubClear = window.sanctuary.presentation.onClear(() => {
      setDebugState('RECEIVED CLEAR');
      setSlide(null);
    });

    const unsubBlackout = window.sanctuary.presentation.onBlackout((isBlack: boolean) => {
      setDebugState(`RECEIVED BLACKOUT: ${isBlack}`);
      setIsBlackout(isBlack);
    });

    const unsubMediaCommand = window.sanctuary.presentation.onMediaCommand((data: string) => {
      try {
        const cmd = JSON.parse(data);
        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          if (cmd.action === 'play') video.play().catch(() => {});
          if (cmd.action === 'pause') video.pause();
          if (cmd.action === 'volume') {
            video.volume = cmd.value;
            video.muted = cmd.value <= 0;
          }
        });
      } catch (e) {
        console.error('Failed to parse media command', e);
      }
    });

    return () => {
      unsubUpdate();
      unsubClear();
      unsubBlackout();
      unsubMediaCommand();
    };
  }, []);

  if (!slide && !isBlackout) {
    return (
      <div 
        style={{ backgroundColor: '#00FF00', width: '100vw', height: '100vh', WebkitAppRegion: 'drag' as any }}
        onDoubleClick={() => window.sanctuary?.display.toggleFullscreen?.()}
      />
    );
  }

  return (
    <div 
      className="program-container" 
      style={{ backgroundColor: isBlackout ? '#000' : '#00FF00', WebkitAppRegion: 'drag' as any, width: '100vw', height: '100vh' }}
      onDoubleClick={() => window.sanctuary?.display.toggleFullscreen?.()}
    >
      {!isBlackout && slide && <SlideRenderer slide={slide} />}
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <ProgramOutput />
  </React.StrictMode>
);
