import { create } from 'zustand';

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 4;

interface PlaybackState {
  isPlaying: boolean;
  mode: 'live' | 'playback';
  speed: PlaybackSpeed;
  currentTime: number;
  startTime: number;
  endTime: number;
  sessionId: string | null;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (s: PlaybackSpeed) => void;
  seek: (time: number) => void;
  setMode: (mode: 'live' | 'playback') => void;
  setSession: (id: string, start: number, end: number) => void;
  tick: (delta: number) => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  isPlaying: false,
  mode: 'live',
  speed: 1,
  currentTime: 0,
  startTime: 0,
  endTime: 0,
  sessionId: null,
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setSpeed: (speed) => set({ speed }),
  seek: (time) => set({ currentTime: Math.max(get().startTime, Math.min(time, get().endTime)) }),
  setMode: (mode) => set({ mode, isPlaying: mode === 'live' }),
  setSession: (id, start, end) => set({ sessionId: id, startTime: start, endTime: end, currentTime: start }),
  tick: (delta) => {
    const s = get();
    if (!s.isPlaying || s.mode !== 'playback') return;
    const next = s.currentTime + delta * s.speed * 1000;
    if (next >= s.endTime) {
      set({ currentTime: s.endTime, isPlaying: false });
    } else {
      set({ currentTime: next });
    }
  },
}));
