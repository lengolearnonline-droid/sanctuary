import { create } from 'zustand';

export interface AudioTrack {
  id: string;
  title: string;
  path: string;
  volume: number; // 0.0 to 1.0
  loop: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}

interface MediaState {
  activeAudio: AudioTrack | null;
  globalVolume: number; // 0.0 to 1.0
  isMuted: boolean;
  
  // Actions
  playAudio: (track: Omit<AudioTrack, 'isPlaying' | 'duration' | 'currentTime'>) => void;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
  setVolume: (volume: number) => void;
  setGlobalVolume: (volume: number) => void;
  toggleMute: () => void;
  setLoop: (loop: boolean) => void;
  seek: (time: number) => void;
  
  // Internal updates from the audio element
  _updateProgress: (currentTime: number, duration: number) => void;
  _onEnded: () => void;
}

export const useMediaStore = create<MediaState>((set, get) => ({
  activeAudio: null,
  globalVolume: 1.0,
  isMuted: false,

  playAudio: (track) => set({ 
    activeAudio: { 
      ...track, 
      isPlaying: true, 
      duration: 0, 
      currentTime: 0 
    } 
  }),
  
  pauseAudio: () => set((state) => ({
    activeAudio: state.activeAudio ? { ...state.activeAudio, isPlaying: false } : null
  })),

  resumeAudio: () => set((state) => ({
    activeAudio: state.activeAudio ? { ...state.activeAudio, isPlaying: true } : null
  })),

  stopAudio: () => set({ activeAudio: null }),

  setVolume: (volume) => set((state) => ({
    activeAudio: state.activeAudio ? { ...state.activeAudio, volume: Math.max(0, Math.min(1, volume)) } : null
  })),

  setGlobalVolume: (volume) => set((state) => {
    const newVol = Math.max(0, Math.min(1, volume));
    if (window.sanctuary?.presentation?.mediaCommand) {
      window.sanctuary.presentation.mediaCommand(JSON.stringify({ action: 'volume', value: newVol })).catch(() => {});
    }
    return { globalVolume: newVol };
  }),

  toggleMute: () => set((state) => {
    const isMuted = !state.isMuted;
    if (window.sanctuary?.presentation?.mediaCommand) {
      window.sanctuary.presentation.mediaCommand(JSON.stringify({ action: 'volume', value: isMuted ? 0 : state.globalVolume })).catch(() => {});
    }
    return { isMuted };
  }),

  setLoop: (loop) => set((state) => ({
    activeAudio: state.activeAudio ? { ...state.activeAudio, loop } : null
  })),

  seek: (time) => set((state) => {
    // The actual seek action requires DOM manipulation, so we just update state and let the AudioPlayer sync
    // In a real app, you might trigger an event or use a ref, but syncing state works for declarative React
    return {
      activeAudio: state.activeAudio ? { ...state.activeAudio, currentTime: time } : null
    };
  }),

  _updateProgress: (currentTime, duration) => set((state) => ({
    activeAudio: state.activeAudio ? { ...state.activeAudio, currentTime, duration } : null
  })),

  _onEnded: () => set((state) => ({
    activeAudio: state.activeAudio && !state.activeAudio.loop 
      ? { ...state.activeAudio, isPlaying: false, currentTime: 0 } 
      : state.activeAudio
  }))
}));
