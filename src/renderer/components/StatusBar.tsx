import React, { useEffect, useState } from 'react';
import { Database, Monitor, AlertCircle, Mic } from 'lucide-react';
import { useUIStore } from '../stores';

export function StatusBar() {
  const { statusBarVisible } = useUIStore();
  const [version, setVersion] = useState<string>('0.1.0');
  const [dbStatus] = useState<'connected' | 'error'>('connected');
  const [outputStatus] = useState<'live' | 'preview' | 'disconnected'>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [obsHealth, setObsHealth] = useState<any>(null);
  const [vmixHealth, setVmixHealth] = useState<any>(null);

  useEffect(() => {
    if (window.sanctuary) {
      window.sanctuary.app.getVersion().then(setVersion).catch(console.error);
    }

    const handleVAD = (e: any) => {
      setIsSpeaking(e.detail.isSpeaking);
    };
    window.addEventListener('sanctuary:vad', handleVAD);

    let unsubPartial: (() => void) | undefined;
    let unsubResult: (() => void) | undefined;
    let unsubObs: (() => void) | undefined;
    let unsubVmix: (() => void) | undefined;

    if (window.sanctuary) {
      unsubPartial = window.sanctuary.ai.onTranscriptPartial((text: string) => {
        if (text.trim().length > 0) setTranscript(text);
      });
      unsubResult = window.sanctuary.ai.onTranscriptResult((text: string) => {
        if (text.trim().length > 0) setTranscript(text);
      });
      
      unsubObs = window.sanctuary.obs?.onStateChange((state: any) => {
        setObsHealth(state);
      });
      window.sanctuary.obs?.getHealth().then(setObsHealth).catch(() => {});

      unsubVmix = window.sanctuary.vmix?.onStateChange((state: any) => {
        setVmixHealth(state);
      });
      window.sanctuary.vmix?.getHealth().then(setVmixHealth).catch(() => {});
    }

    return () => {
      window.removeEventListener('sanctuary:vad', handleVAD);
      unsubPartial?.();
      unsubResult?.();
      unsubObs?.();
      unsubVmix?.();
    };
  }, []);

  if (!statusBarVisible) return null;

  return (
    <footer className="statusbar">
      <div className="flex items-center gap-2 px-4">
        <span className="text-xs font-semibold">SANCTUARY</span>
        <span className="text-xs text-secondary">v{version}</span>
      </div>
      
      <div className="flex-1 flex justify-center px-4 overflow-hidden">
        {transcript && (
          <div className="text-xs text-tertiary truncate max-w-lg" style={{ fontStyle: 'italic' }}>
            "{transcript}"
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-4">
        <div className="flex items-center gap-2">
          <span className={`status-dot status-dot-${dbStatus}`}></span>
          <span className="text-xs">Database</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot status-dot-disconnected"></span>
          <span className="text-xs">NDI</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${obsHealth?.status === 'CONNECTED' ? 'status-dot-connected' : 'status-dot-disconnected'}`}></span>
          <span className="text-xs" style={{ color: obsHealth?.status === 'CONNECTED' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>OBS {obsHealth?.streaming ? '(LIVE)' : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`status-dot ${vmixHealth?.status === 'CONNECTED' ? 'status-dot-connected' : 'status-dot-disconnected'}`}></span>
          <span className="text-xs" style={{ color: vmixHealth?.status === 'CONNECTED' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>vMix {vmixHealth?.streaming ? '(LIVE)' : ''}</span>
        </div>
        <div className="flex items-center gap-2" style={{ color: isSpeaking ? 'var(--color-success)' : 'var(--color-text-tertiary)' }}>
          <Mic size={14} />
          <span className="text-xs">{isSpeaking ? 'Listening' : 'Silent'}</span>
        </div>
      </div>
    </footer>
  );
}
