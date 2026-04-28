export interface Vec2 { x: number; y: number; }
export interface Vec3 { x: number; y: number; z: number; }

export interface House {
  id: string;
  name: string;
  floors: Floor[];
  metadata: { createdAt: number; updatedAt: number; units: 'meters' | 'feet'; };
}

export interface Floor {
  id: string;
  level: number;
  name: string;
  rooms: Room[];
  walls: Wall[];
  dimensions: { width: number; height: number; };
}

export type RoomType = 'living' | 'kitchen' | 'bedroom' | 'bathroom' | 'office' | 'hallway' | 'garage' | 'dining' | 'utility' | 'other';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  polygon: Vec2[];
  color: string;
  borderColor: string;
  floorId: string;
  elevation: number;
  ceilingHeight: number;
  area: number;
  center: Vec2;
}

export interface Wall {
  id: string;
  start: Vec2;
  end: Vec2;
  height: number;
  thickness: number;
  hasDoor: boolean;
  hasWindow: boolean;
  doorPosition?: number;
  doorWidth?: number;
  windowPosition?: number;
  windowWidth?: number;
  windowHeight?: number;
  attenuation: number;
}

export interface Door {
  id: string;
  wallId: string;
  position: number;
  width: number;
  isOpen: boolean;
}

export const ROOM_COLORS: Record<RoomType, { fill: string; border: string; hex: number }> = {
  living:   { fill: 'rgba(56,189,248,0.08)',   border: 'rgba(56,189,248,0.25)',   hex: 0x38bdf8 },
  kitchen:  { fill: 'rgba(251,191,36,0.08)',   border: 'rgba(251,191,36,0.25)',   hex: 0xfbbf24 },
  bedroom:  { fill: 'rgba(167,139,250,0.08)',  border: 'rgba(167,139,250,0.25)',  hex: 0xa78bfa },
  bathroom: { fill: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.25)',   hex: 0x34d399 },
  office:   { fill: 'rgba(96,165,250,0.08)',   border: 'rgba(96,165,250,0.25)',   hex: 0x60a5fa },
  hallway:  { fill: 'rgba(148,163,184,0.06)',  border: 'rgba(148,163,184,0.2)',   hex: 0x94a3b8 },
  garage:   { fill: 'rgba(156,163,175,0.06)',  border: 'rgba(156,163,175,0.2)',   hex: 0x9ca3af },
  dining:   { fill: 'rgba(251,146,60,0.08)',   border: 'rgba(251,146,60,0.25)',   hex: 0xfb923c },
  utility:  { fill: 'rgba(148,163,184,0.06)',  border: 'rgba(148,163,184,0.15)',  hex: 0x94a3b8 },
  other:    { fill: 'rgba(148,163,184,0.05)',  border: 'rgba(148,163,184,0.15)',  hex: 0x94a3b8 },
};
