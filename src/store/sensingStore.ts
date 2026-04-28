import { create } from 'zustand';
import { SystemHealth, ConnectionState } from '../types/sensing';
import { OccupancyEvent } from '../types/events';

interface SensingState {
  health: SystemHealth;
  events: OccupancyEvent[];
  overlays: {
    heatmap: boolean;
    signalField: boolean;
    coverage: boolean;
    pathTrails: boolean;
    uncertainty: boolean;
    eventPulses: boolean;
    grid: boolean;
  };
  updateHealth: (partial: Partial<SystemHealth>) => void;
  addEvent: (event: OccupancyEvent) => void;
  toggleOverlay: (key: keyof SensingState['overlays']) => void;
  setOverlay: (key: keyof SensingState['overlays'], val: boolean) => void;
  clearEvents: () => void;
}

export const useSensingStore = create<SensingState>((set) => ({
  health: {
    connectionState: 'disconnected' as ConnectionState,
    adapterType: 'none' as const,
    fps: 0, packetRate: 0, latency: 0,
    trackedCount: 0, signalQualityIndex: 0,
    calibrationStatus: 'uncalibrated' as const,
    lastFrameTime: 0, droppedFrames: 0, uptime: 0,
  },
  events: [],
  overlays: {
    heatmap: false, signalField: false, coverage: false,
    pathTrails: true, uncertainty: false, eventPulses: true, grid: false,
  },
  updateHealth: (partial) => set((s) => ({ health: { ...s.health, ...partial } })),
  addEvent: (event) => set((s) => ({ events: [event, ...s.events].slice(0, 200) })),
  toggleOverlay: (key) => set((s) => ({ overlays: { ...s.overlays, [key]: !s.overlays[key] } })),
  setOverlay: (key, val) => set((s) => ({ overlays: { ...s.overlays, [key]: val } })),
  clearEvents: () => set({ events: [] }),
}));
