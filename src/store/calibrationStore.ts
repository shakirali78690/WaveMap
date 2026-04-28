import { create } from 'zustand';

interface CalibrationState {
  step: number;
  totalSteps: number;
  floorWidth: number;
  floorHeight: number;
  roomDrafts: Array<{ id: string; name: string; type: string; polygon: { x: number; y: number }[] }>;
  routerPosition: { x: number; y: number } | null;
  isComplete: boolean;
  setStep: (s: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setFloorDimensions: (w: number, h: number) => void;
  setRouterPosition: (pos: { x: number; y: number }) => void;
  complete: () => void;
  reset: () => void;
}

export const useCalibrationStore = create<CalibrationState>((set, get) => ({
  step: 0,
  totalSteps: 7,
  floorWidth: 10,
  floorHeight: 10,
  roomDrafts: [],
  routerPosition: null,
  isComplete: false,
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, s.totalSteps - 1) })),
  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  setFloorDimensions: (w, h) => set({ floorWidth: w, floorHeight: h }),
  setRouterPosition: (pos) => set({ routerPosition: pos }),
  complete: () => set({ isComplete: true }),
  reset: () => set({ step: 0, isComplete: false, roomDrafts: [], routerPosition: null }),
}));
