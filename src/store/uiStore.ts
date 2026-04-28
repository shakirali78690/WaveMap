import { create } from 'zustand';

export type AppPage = 'overview' | 'live-map' | 'playback' | 'entities' | 'rooms' | 'analytics' | 'calibration' | 'device' | 'settings';
export type CameraMode = 'orbit' | 'tactical' | 'isometric' | 'firstPerson';
export type ThemeMode = 'dark' | 'light' | 'system';

interface UIState {
  activePage: AppPage;
  sidebarCollapsed: boolean;
  drawerOpen: boolean;
  drawerContent: 'entity' | 'room' | 'system' | null;
  timelineExpanded: boolean;
  cameraMode: CameraMode;
  theme: ThemeMode;
  fullscreen: boolean;
  wallCutaway: boolean;
  commandPaletteOpen: boolean;
  renderQuality: 'low' | 'medium' | 'high' | 'ultra';
  motionSmoothing: number;
  confidenceThreshold: number;
  setPage: (page: AppPage) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  openDrawer: (content: 'entity' | 'room' | 'system') => void;
  closeDrawer: () => void;
  toggleTimeline: () => void;
  setCameraMode: (mode: CameraMode) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleFullscreen: () => void;
  toggleWallCutaway: () => void;
  toggleCommandPalette: () => void;
  setRenderQuality: (q: 'low' | 'medium' | 'high' | 'ultra') => void;
  setMotionSmoothing: (v: number) => void;
  setConfidenceThreshold: (v: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activePage: 'live-map',
  sidebarCollapsed: false,
  drawerOpen: false,
  drawerContent: null,
  timelineExpanded: false,
  cameraMode: 'orbit',
  theme: 'dark',
  fullscreen: false,
  wallCutaway: true,
  commandPaletteOpen: false,
  renderQuality: 'high',
  motionSmoothing: 0.3,
  confidenceThreshold: 0.15,
  setPage: (page) => set({ activePage: page }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  openDrawer: (content) => set({ drawerOpen: true, drawerContent: content }),
  closeDrawer: () => set({ drawerOpen: false, drawerContent: null }),
  toggleTimeline: () => set((s) => ({ timelineExpanded: !s.timelineExpanded })),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setTheme: (theme) => set({ theme }),
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
  toggleWallCutaway: () => set((s) => ({ wallCutaway: !s.wallCutaway })),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setRenderQuality: (q) => set({ renderQuality: q }),
  setMotionSmoothing: (v) => set({ motionSmoothing: v }),
  setConfidenceThreshold: (v) => set({ confidenceThreshold: v }),
}));
