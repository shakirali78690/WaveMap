// ============================================================
// Sensing Store
//
// Global, Zustand-backed store for the live sensing state.
// Separates concerns:
//   - house topology (constant after calibration)
//   - current tracks (from tracker)
//   - recent frames (for FPS / charts)
//   - events (ring buffer)
//   - system health
//   - UI overlay flags / camera preset / selected entity/room
// ============================================================

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

import type {
  AvatarState,
  CameraPreset,
  DetectionFrame,
  EntityTrack,
  House,
  OccupancyEvent,
  OverlayFlags,
  SystemHealth,
} from '../data/types';
import { SAMPLE_HOUSE } from '../data/sampleHouse';
import { SCENARIOS, type ScenarioId, WifiSensingSimulator } from '../data/simulator';
import { EntityTracker } from '../engine/tracker';
import { deriveAvatarState } from '../engine/avatarDerive';

const MAX_EVENTS = 200;
const FPS_WINDOW = 60;

export type AdapterKind = 'mock' | 'websocket' | 'recorded';

interface SensingState {
  house: House;

  adapter: AdapterKind;
  scenario: ScenarioId;
  connecting: boolean;
  connected: boolean;

  health: SystemHealth;
  tracks: EntityTrack[];
  avatars: AvatarState[];
  events: OccupancyEvent[];

  recentFrames: number[];              // ts ring for FPS calc
  currentFrame?: DetectionFrame;

  // UI
  overlays: OverlayFlags;
  camera: CameraPreset;
  selectedTrackId?: string;
  selectedRoomId?: string;
  fadeWalls: boolean;
  theme: 'dark' | 'light';
  reducedMotion: boolean;
  fullscreen: boolean;
  sidebarCollapsed: boolean;
  drawerOpen: boolean;

  // Settings
  smoothing: number;
  trailSeconds: number;
  thresholds: { high: number; medium: number; low: number };

  // Actions
  startMock: () => void;
  stop: () => void;
  setScenario: (id: ScenarioId) => void;
  setAdapter: (a: AdapterKind) => void;
  setOverlay: <K extends keyof OverlayFlags>(k: K, v: boolean) => void;
  setCamera: (c: CameraPreset) => void;
  selectTrack: (id: string | undefined) => void;
  selectRoom: (id: string | undefined) => void;
  setFadeWalls: (v: boolean) => void;
  setSmoothing: (v: number) => void;
  setTrailSeconds: (v: number) => void;
  setThresholds: (t: { high: number; medium: number; low: number }) => void;
  toggleFullscreen: () => void;
  toggleSidebar: () => void;
  setDrawerOpen: (v: boolean) => void;
  toggleTheme: () => void;
  clearEvents: () => void;
}

const DEFAULT_HEALTH: SystemHealth = {
  routerConnected: false,
  adapter: 'mock-simulator',
  adapterReady: false,
  streamState: 'closed',
  fps: 0,
  packetRate: 0,
  inferenceMs: 0,
  tracks: 0,
  sqi: 0,
  calibration: 'unknown',
  uptime: 0,
};

const DEFAULT_OVERLAYS: OverlayFlags = {
  signalField: false,
  coverage: true,
  motionHeatmap: false,
  occupancyDensity: false,
  trails: true,
  wallAttenuation: false,
  uncertainty: true,
  eventPulses: true,
  roomLabels: true,
  grid: true,
};

let simulator: WifiSensingSimulator | null = null;
let teardown: (() => void) | null = null;
const tracker = new EntityTracker({ smoothing: 0.72 });

export const useSensing = create<SensingState>()(
  subscribeWithSelector((set, get) => ({
    house: SAMPLE_HOUSE,

    adapter: 'mock',
    scenario: 'single-walker',
    connecting: false,
    connected: false,

    health: DEFAULT_HEALTH,
    tracks: [],
    avatars: [],
    events: [],
    recentFrames: [],
    overlays: DEFAULT_OVERLAYS,
    camera: 'isometric',
    fadeWalls: true,
    theme: 'dark',
    reducedMotion: false,
    fullscreen: false,
    sidebarCollapsed: false,
    drawerOpen: true,

    smoothing: 0.72,
    trailSeconds: 6,
    thresholds: { high: 0.7, medium: 0.45, low: 0.2 },

    startMock: () => {
      if (get().connected) return;
      const scenario = get().scenario;
      simulator = new WifiSensingSimulator({ scenario, rateHz: 15 });
      set({ connecting: true, adapter: 'mock' });
      tracker.reset();

      simulator
        .connect({
          onFrame: (frame) => {
            const { tracks, events } = tracker.ingest(frame);
            const avatars = tracks.map((t) => deriveAvatarState(t, get().trailSeconds));
            set((s) => {
              const ts = frame.ts;
              const window = s.recentFrames.concat(ts).slice(-FPS_WINDOW);
              const spanMs = window.length > 1 ? window[window.length - 1] - window[0] : 0;
              const fps = spanMs > 0 ? ((window.length - 1) * 1000) / spanMs : 0;
              return {
                tracks,
                avatars,
                currentFrame: frame,
                recentFrames: window,
                events: events.length
                  ? [...events.reverse(), ...s.events].slice(0, MAX_EVENTS)
                  : s.events,
                health: { ...s.health, fps, tracks: tracks.length },
              };
            });
          },
          onHealth: (patch) => set((s) => ({ health: { ...s.health, ...patch } })),
          onEvent: (ev) => set((s) => ({ events: [ev, ...s.events].slice(0, MAX_EVENTS) })),
        })
        .then((t) => {
          teardown = t;
          set({ connecting: false, connected: true });
        });
    },

    stop: () => {
      teardown?.();
      teardown = null;
      simulator = null;
      set({ connected: false, connecting: false, tracks: [], avatars: [], recentFrames: [] });
      tracker.reset();
    },

    setScenario: (id) => {
      set({ scenario: id });
      if (simulator) {
        simulator.setScenario(id);
        tracker.reset();
        set({ tracks: [], avatars: [], events: [] });
      }
    },

    setAdapter: (a) => set({ adapter: a }),
    setOverlay: (k, v) => set((s) => ({ overlays: { ...s.overlays, [k]: v } })),
    setCamera: (c) => set({ camera: c }),
    selectTrack: (id) => set({ selectedTrackId: id }),
    selectRoom: (id) => set({ selectedRoomId: id }),
    setFadeWalls: (v) => set({ fadeWalls: v }),
    setSmoothing: (v) => {
      set({ smoothing: v });
      tracker.setSmoothing(v);
    },
    setTrailSeconds: (v) => set({ trailSeconds: v }),
    setThresholds: (t) => {
      set({ thresholds: t });
      tracker.setThresholds(t);
    },
    toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    setDrawerOpen: (v) => set({ drawerOpen: v }),
    toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    clearEvents: () => set({ events: [] }),
  }))
);

export { SCENARIOS };
