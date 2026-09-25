import React, { useEffect } from 'react';
import { usePresentationStore, useServiceStore } from '../stores';
import { SlidePreview } from './SlidePreview';
import { Panel, Button, Badge } from './ui';
import { Play, XSquare, MonitorX, MonitorPlay, MonitorUp } from 'lucide-react';
import { audioCapture } from '../core/ai/AudioCaptureService';
import { webSpeech } from '../core/ai/WebSpeechService';

export function WorkspaceHeader() {
  const [isMicActive, setIsMicActive] = React.useState(false);
  const { activeService } = useServiceStore();
  const { state, previewSlide, sendToProgram, clearProgram, setBlackout } = usePresentationStore();
  
  const currentSlide = state.currentSlide;
  const isLive = state.isLive;
  const isBlackout = state.isBlackout;

  // Keyboard shortcut listener for dashboard-specific actions (like Space to go live)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space' && previewSlide && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        sendToProgram(previewSlide);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // AI Voice Action listener
    const cleanupAction = window.sanctuary?.ai.onAction((action: string) => {
      if (action === 'NEXT_SLIDE') {
        if (previewSlide) {
          sendToProgram(previewSlide);
        }
      }
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (cleanupAction) cleanupAction();
    };
  }, [previewSlide, sendToProgram]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 'var(--space-4)', gap: 'var(--space-4)', height: '100%', background: 'var(--color-bg-base)' }}>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>Operator Workspace</h1>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: '2px' }}>
            {activeService ? `Active Service: ${activeService.name}` : 'No active service'}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button 
            variant={isMicActive ? "primary" : "ghost"} 
            size="sm"
            onClick={async () => {
              if (!isMicActive) {
                try {
                  // Wire up the audio pipeline to the Electron Main IPC
                  
                  audioCapture.onData((buffer: ArrayBuffer) => {
                      if (window.sanctuary) {
                        window.sanctuary.ai.sendAudio(buffer);
                      }
                    });
                    await audioCapture.start();
                  setIsMicActive(true);
                } catch (e: any) {
                  console.error("Failed to start mic", e);
                  alert(`Failed to start microphone: ${e.message || e}`);
                }
              } else {
                await audioCapture.stop();
                setIsMicActive(false);
              }
            }}
            title={isMicActive ? "Stop AI Mic" : "Start AI Mic"}
          >
            {isMicActive ? '🎙️ Mic Active' : '🎙️ Start Mic'}
          </Button>

          
          
          <Button 
            variant="secondary" 
            size="sm"
            icon={MonitorUp}
            onClick={() => {
              if (window.sanctuary) {
                window.sanctuary.display.openOutput();
              }
            }}
          >
            Launch Projector
          </Button>
        </div>
      </div>

      {/* Dual Monitor Workspace */}
      <div style={{ display: 'flex', gap: 'var(--space-4)', flex: 1, minHeight: 0 }}>
        
        {/* Left: PREVIEW */}
        <Panel 
          title={<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Badge variant="preview">PREVIEW</Badge></span>}
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-4)' }}>
            <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SlidePreview 
                slide={previewSlide} 
                variant="preview" 
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
              <Button 
                variant="primary" 
                size="md" 
                icon={Play}
                onClick={() => previewSlide && sendToProgram(previewSlide)}
                disabled={!previewSlide}
                style={{ width: '100%' }}
                title="Send to Program (Space)"
              >
                GO LIVE
              </Button>
            </div>
          </div>
        </Panel>

        {/* Right: PROGRAM / LIVE */}
        <Panel 
          title={
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant={isLive ? 'live' : 'default'}>PROGRAM</Badge> 
              {isBlackout && <Badge variant="warning">BLACKOUT</Badge>}
            </span>
          }
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 'var(--space-4)' }}>
            <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SlidePreview 
                slide={currentSlide} 
                variant={isLive ? 'live' : 'preview'} 
                style={{ 
                  opacity: isBlackout ? 0.2 : 1,
                  transition: 'opacity 0.2s ease'
                }}
              />
              {isBlackout && (
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--color-warning)',
                  fontSize: 'var(--font-size-2xl)',
                  fontWeight: 'bold',
                  letterSpacing: '2px',
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                  pointerEvents: 'none'
                }}>
                  BLACKOUT
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'auto' }}>
              <Button 
                variant="danger" 
                size="md"
                icon={XSquare}
                onClick={() => clearProgram()}
                disabled={!isLive || !currentSlide}
                style={{ flex: 1 }}
                title="Clear Output (Esc)"
              >
                Clear
              </Button>
              <Button 
                variant={isBlackout ? 'primary' : 'secondary'} 
                size="md"
                icon={MonitorX}
                onClick={() => setBlackout(!isBlackout)}
                style={{ flex: 1 }}
                title="Toggle Blackout (B)"
              >
                {isBlackout ? 'Un-Blackout' : 'Blackout'}
              </Button>
            </div>
          </div>
        </Panel>

      </div>
    </div>
  );
}

