import React, { useEffect, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import type { Slide } from '../shared/types';
import { Clock } from 'lucide-react';

function StageApp() {
  const [slide, setSlide] = useState<Slide | null>(null);
  const [isBlackout, setIsBlackout] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const unsubUpdate = window.sanctuary?.presentation.onUpdate((data: string) => {
      setSlide(JSON.parse(data));
    });

    const unsubClear = window.sanctuary?.presentation.onClear(() => {
      setSlide(null);
    });

    const unsubBlackout = window.sanctuary?.presentation.onBlackout((isBlack: boolean) => {
      setIsBlackout(isBlack);
    });

    return () => {
      unsubUpdate?.();
      unsubClear?.();
      unsubBlackout?.();
    };
  }, []);

  // Clock interval
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = useMemo(() => {
    return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [currentTime]);

  const dateString = useMemo(() => {
    return currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }, [currentTime]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      padding: '4vh 4vw',
      boxSizing: 'border-box',
      backgroundColor: '#0a0a0a',
    }}>
      
      {/* Header Info (Clock, Alerts) */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '2vh',
        borderBottom: '2px solid #333',
        marginBottom: '4vh'
      }}>
        <div style={{ color: '#888', fontSize: '3vh', fontWeight: 600 }}>
          {isBlackout ? <span style={{ color: '#ff3333' }}>BLACKOUT ACTIVE</span> : 'STAGE DISPLAY'}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '2vw' }}>
          {/* Mock Countdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1vw', color: '#ff9900', fontSize: '4vh', fontWeight: 800 }}>
            <span>05:00</span>
          </div>

          {/* Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1vw', color: '#ccc', fontSize: '4vh', fontWeight: 600 }}>
            <Clock size="3.5vh" />
            <span>{timeString}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4vh' }}>
        
        {/* CURRENT SLIDE */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: '3vh', background: '#1a1a1a', borderRadius: '2vh', borderLeft: '1vh solid #33cc33' }}>
          <h2 style={{ margin: 0, fontSize: '3vh', color: '#888', textTransform: 'uppercase', marginBottom: '2vh' }}>Current</h2>
          <div style={{ flex: 1, fontSize: '8vh', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: 1.2 }}>
            {slide ? slide.content.body : ''}
          </div>
        </div>

        {/* NEXT SLIDE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '3vh', background: '#111', borderRadius: '2vh', borderLeft: '1vh solid #666' }}>
          <h2 style={{ margin: 0, fontSize: '2.5vh', color: '#666', textTransform: 'uppercase', marginBottom: '1vh' }}>Next</h2>
          <div style={{ flex: 1, fontSize: '5vh', fontWeight: 600, color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', whiteSpace: 'pre-wrap', lineHeight: 1.3 }}>
            {/* TODO: In Phase 12, we need to send the Next slide data via IPC too. For now, mock it or leave blank. */}
            (Next Slide Data)
          </div>
        </div>

      </div>

    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<StageApp />);
