import React, { useEffect, useRef } from 'react';
import { useMediaStore } from '../../stores';

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const { activeAudio, globalVolume, isMuted, _updateProgress, _onEnded } = useMediaStore();

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (activeAudio) {
      // If the path changed, load the new audio
      if (audio.src !== (activeAudio.path.startsWith('http') ? activeAudio.path : `file://${activeAudio.path}`)) {
        audio.src = activeAudio.path.startsWith('http') ? activeAudio.path : `file://${activeAudio.path}`;
        audio.load();
      }

      // Handle Play/Pause
      if (activeAudio.isPlaying) {
        audio.play().catch(e => console.error("Audio playback failed:", e));
      } else {
        audio.pause();
      }

      // Handle Volume
      audio.volume = activeAudio.volume * globalVolume;
      audio.muted = isMuted;

      // Handle Loop
      audio.loop = activeAudio.loop;

      // Handle seeking (only if difference is significant to avoid stuttering during normal timeupdate)
      if (Math.abs(audio.currentTime - activeAudio.currentTime) > 1) {
        audio.currentTime = activeAudio.currentTime;
      }
    } else {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
  }, [activeAudio, globalVolume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      // Only dispatch updates every ~500ms or so to prevent React re-render thrashing,
      // or we can dispatch every time. We'll dispatch every time for now.
      _updateProgress(audio.currentTime, audio.duration || 0);
    };

    const handleEnded = () => {
      _onEnded();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [_updateProgress, _onEnded]);

  // AudioEngine has no UI. It just manages the invisible <audio> element.
  return (
    <audio ref={audioRef} style={{ display: 'none' }} />
  );
}
