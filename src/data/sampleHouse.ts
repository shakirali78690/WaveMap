// ============================================================
// Sample house — a realistic single-floor residence used for
// simulation, calibration previews, and the default Live Map
// scene. Coordinates are in meters. Origin at floor min corner.
// ============================================================

import type { House, Room, Wall, RoomKind, Vec2 } from './types';

// House footprint: 14m x 10m single floor.
const FLOOR_W = 14;
const FLOOR_H = 10;
const CEIL = 2.6;

// Helper to make rectangle polygons counter-clockwise.
const rect = (x: number, y: number, w: number, h: number): Vec2[] => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
];

// L-shaped living room: built from two rectangles merged.
const livingPoly: Vec2[] = [
  { x: 0, y: 0 },
  { x: 6.5, y: 0 },
  { x: 6.5, y: 4 },
  { x: 8.5, y: 4 },
  { x: 8.5, y: 6.5 },
  { x: 0, y: 6.5 },
];

const rooms: Room[] = [
  {
    id: 'r-living',
    name: 'Living Room',
    kind: 'living',
    floorId: 'f1',
    polygon: livingPoly,
    height: CEIL,
    tag: 'Primary social zone',
  },
  {
    id: 'r-kitchen',
    name: 'Kitchen',
    kind: 'kitchen',
    floorId: 'f1',
    polygon: rect(0, 6.5, 5, 3.5),
    height: CEIL,
    tag: 'Appliances + range',
  },
  {
    id: 'r-dining',
    name: 'Dining',
    kind: 'dining',
    floorId: 'f1',
    polygon: rect(5, 6.5, 3.5, 3.5),
    height: CEIL,
    tag: 'Table of 6',
  },
  {
    id: 'r-hall',
    name: 'Hall',
    kind: 'hall',
    floorId: 'f1',
    polygon: rect(6.5, 0, 2, 4),
    height: CEIL,
    tag: 'Central corridor',
  },
  {
    id: 'r-bedroom',
    name: 'Bedroom',
    kind: 'bedroom',
    floorId: 'f1',
    polygon: rect(8.5, 0, 5.5, 4),
    height: CEIL,
    tag: 'Primary suite',
  },
  {
    id: 'r-office',
    name: 'Office',
    kind: 'office',
    floorId: 'f1',
    polygon: rect(8.5, 4, 3.5, 2.5),
    height: CEIL,
    tag: 'R&D workstation',
  },
  {
    id: 'r-bath',
    name: 'Bathroom',
    kind: 'bathroom',
    floorId: 'f1',
    polygon: rect(12, 4, 2, 2.5),
    height: CEIL,
    tag: 'Privacy masked',
  },
  {
    id: 'r-util',
    name: 'Utility',
    kind: 'utility',
    floorId: 'f1',
    polygon: rect(8.5, 6.5, 5.5, 3.5),
    height: CEIL,
    tag: 'Storage + laundry',
  },
];

// Exterior shell — perimeter walls.
const exterior: Wall[] = [
  // Outer rectangle
  { id: 'w-ex-n', floorId: 'f1', a: { x: 0, y: 0 }, b: { x: FLOOR_W, y: 0 }, kind: 'exterior', attenuation: 0.85, thickness: 0.22 },
  { id: 'w-ex-e', floorId: 'f1', a: { x: FLOOR_W, y: 0 }, b: { x: FLOOR_W, y: FLOOR_H }, kind: 'exterior', attenuation: 0.85, thickness: 0.22 },
  { id: 'w-ex-s', floorId: 'f1', a: { x: FLOOR_W, y: FLOOR_H }, b: { x: 0, y: FLOOR_H }, kind: 'exterior', attenuation: 0.85, thickness: 0.22 },
  { id: 'w-ex-w', floorId: 'f1', a: { x: 0, y: FLOOR_H }, b: { x: 0, y: 0 }, kind: 'exterior', attenuation: 0.85, thickness: 0.22 },
];

// Interior walls — clean orthogonal partitions.
const interior: Wall[] = [
  // Living/Hall/Bedroom vertical divide (with doorways gaps)
  { id: 'w-in-1', floorId: 'f1', a: { x: 6.5, y: 0 }, b: { x: 6.5, y: 1.3 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },
  { id: 'w-in-1d', floorId: 'f1', a: { x: 6.5, y: 1.3 }, b: { x: 6.5, y: 2.3 }, kind: 'door', attenuation: 0.15, thickness: 0.12 },
  { id: 'w-in-2', floorId: 'f1', a: { x: 6.5, y: 2.3 }, b: { x: 6.5, y: 4 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },

  { id: 'w-in-3', floorId: 'f1', a: { x: 8.5, y: 0 }, b: { x: 8.5, y: 4 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },
  { id: 'w-in-4', floorId: 'f1', a: { x: 6.5, y: 4 }, b: { x: 8.5, y: 4 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },

  // Living / Kitchen / Dining horizontal divide
  { id: 'w-in-5', floorId: 'f1', a: { x: 0, y: 6.5 }, b: { x: 2.2, y: 6.5 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },
  { id: 'w-in-5d', floorId: 'f1', a: { x: 2.2, y: 6.5 }, b: { x: 3.2, y: 6.5 }, kind: 'opening', attenuation: 0.05, thickness: 0.12 },
  { id: 'w-in-6', floorId: 'f1', a: { x: 3.2, y: 6.5 }, b: { x: 8.5, y: 6.5 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },

  // Kitchen / Dining divide
  { id: 'w-in-7', floorId: 'f1', a: { x: 5, y: 6.5 }, b: { x: 5, y: 10 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },

  // Office / Bath / Bedroom partitions
  { id: 'w-in-8', floorId: 'f1', a: { x: 8.5, y: 4 }, b: { x: 12, y: 4 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },
  { id: 'w-in-9', floorId: 'f1', a: { x: 12, y: 4 }, b: { x: 14, y: 4 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },
  { id: 'w-in-10', floorId: 'f1', a: { x: 12, y: 4 }, b: { x: 12, y: 6.5 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },

  // Office / Utility divide
  { id: 'w-in-11', floorId: 'f1', a: { x: 8.5, y: 6.5 }, b: { x: 12, y: 6.5 }, kind: 'interior', attenuation: 0.55, thickness: 0.12 },
];

const walls: Wall[] = [...exterior, ...interior];

export const SAMPLE_HOUSE: House = {
  id: 'house-01',
  name: 'Primary Residence',
  address: 'R&D Site · Floor 1',
  floors: [
    {
      id: 'f1',
      name: 'Ground Floor',
      index: 0,
      bounds: { x: 0, y: 0, w: FLOOR_W, h: FLOOR_H },
      rooms,
      walls,
    },
  ],
  sensors: [
    {
      id: 's-router',
      kind: 'router',
      label: 'Primary Router',
      floorId: 'f1',
      position: { x: 7.5, y: 1.4, z: 2.0 },
      coverage: 9,
      meta: { ssid: 'WaveMap-Core', channel: 149, band: '5GHz', power: '24dBm' },
    },
    {
      id: 's-anchor-1',
      kind: 'anchor',
      label: 'Anchor · Kitchen',
      floorId: 'f1',
      position: { x: 2.5, y: 1.2, z: 8.2 },
      coverage: 6,
    },
    {
      id: 's-anchor-2',
      kind: 'anchor',
      label: 'Anchor · Bedroom',
      floorId: 'f1',
      position: { x: 11, y: 1.2, z: 1.8 },
      coverage: 6,
    },
  ],
};

// ----------------------------------------------------------------
// Room palette — tasteful, distinct, readable in low light.
// ----------------------------------------------------------------

export const ROOM_PALETTE: Record<RoomKind, { surface: string; accent: string; label: string }> = {
  living:   { surface: '#1A2A3A', accent: '#38E3FF', label: 'Living' },
  kitchen:  { surface: '#2A2030', accent: '#FFB547', label: 'Kitchen' },
  dining:   { surface: '#23282F', accent: '#E8D5A3', label: 'Dining' },
  bedroom:  { surface: '#1E2340', accent: '#A78BFA', label: 'Bedroom' },
  bathroom: { surface: '#1A2F33', accent: '#32D8A0', label: 'Bathroom' },
  office:   { surface: '#252436', accent: '#9DAFCA', label: 'Office' },
  hall:     { surface: '#171C26', accent: '#6F84A6', label: 'Hall' },
  utility:  { surface: '#1E1F26', accent: '#7D8BA1', label: 'Utility' },
  garage:   { surface: '#1A1B1F', accent: '#5A6578', label: 'Garage' },
  outdoor:  { surface: '#0F1620', accent: '#4A5D7F', label: 'Outdoor' },
};

export function roomById(house: House, id: string | undefined): Room | undefined {
  if (!id) return undefined;
  for (const f of house.floors) {
    const r = f.rooms.find((x) => x.id === id);
    if (r) return r;
  }
  return undefined;
}

export function floorOfRoom(house: House, roomId: string) {
  return house.floors.find((f) => f.rooms.some((r) => r.id === roomId));
}
