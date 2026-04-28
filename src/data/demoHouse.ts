import { House, Vec2 } from '../types/house';

function calcArea(poly: Vec2[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const j = (i + 1) % poly.length;
    a += poly[i].x * poly[j].y - poly[j].x * poly[i].y;
  }
  return Math.abs(a / 2);
}

function center(poly: Vec2[]): Vec2 {
  const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
  return { x: cx, y: cy };
}

// Realistic ~1200 sq ft single-story house. All units in meters.
// Origin at bottom-left. Total footprint roughly 14m x 10m.
const rooms = [
  {
    id: 'living', name: 'Living Room', type: 'living' as const,
    polygon: [{ x: 0, y: 0 }, { x: 6, y: 0 }, { x: 6, y: 5 }, { x: 0, y: 5 }],
    color: 'rgba(56,189,248,0.08)', borderColor: 'rgba(56,189,248,0.25)',
  },
  {
    id: 'kitchen', name: 'Kitchen', type: 'kitchen' as const,
    polygon: [{ x: 6, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 4 }, { x: 6, y: 4 }],
    color: 'rgba(251,191,36,0.08)', borderColor: 'rgba(251,191,36,0.25)',
  },
  {
    id: 'dining', name: 'Dining Area', type: 'dining' as const,
    polygon: [{ x: 6, y: 4 }, { x: 10, y: 4 }, { x: 10, y: 5 }, { x: 6, y: 5 }],
    color: 'rgba(251,146,60,0.08)', borderColor: 'rgba(251,146,60,0.25)',
  },
  {
    id: 'hallway', name: 'Hallway', type: 'hallway' as const,
    polygon: [{ x: 0, y: 5 }, { x: 10, y: 5 }, { x: 10, y: 6.2 }, { x: 0, y: 6.2 }],
    color: 'rgba(148,163,184,0.06)', borderColor: 'rgba(148,163,184,0.2)',
  },
  {
    id: 'master-bed', name: 'Master Bedroom', type: 'bedroom' as const,
    polygon: [{ x: 0, y: 6.2 }, { x: 5, y: 6.2 }, { x: 5, y: 10 }, { x: 0, y: 10 }],
    color: 'rgba(167,139,250,0.08)', borderColor: 'rgba(167,139,250,0.25)',
  },
  {
    id: 'office', name: 'Office', type: 'office' as const,
    polygon: [{ x: 5, y: 6.2 }, { x: 8, y: 6.2 }, { x: 8, y: 8.5 }, { x: 5, y: 8.5 }],
    color: 'rgba(96,165,250,0.08)', borderColor: 'rgba(96,165,250,0.25)',
  },
  {
    id: 'bathroom', name: 'Bathroom', type: 'bathroom' as const,
    polygon: [{ x: 8, y: 6.2 }, { x: 10, y: 6.2 }, { x: 10, y: 8.5 }, { x: 8, y: 8.5 }],
    color: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.25)',
  },
  {
    id: 'bedroom2', name: 'Guest Bedroom', type: 'bedroom' as const,
    polygon: [{ x: 5, y: 8.5 }, { x: 10, y: 8.5 }, { x: 10, y: 10 }, { x: 5, y: 10 }],
    color: 'rgba(167,139,250,0.06)', borderColor: 'rgba(167,139,250,0.2)',
  },
].map(r => ({
  ...r,
  floorId: 'floor-1',
  elevation: 0,
  ceilingHeight: 2.7,
  area: calcArea(r.polygon),
  center: center(r.polygon),
}));

const walls = [
  // Outer walls
  { id: 'w-s', start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, hasDoor: true, doorPosition: 0.45, doorWidth: 1.0 },
  { id: 'w-e', start: { x: 10, y: 0 }, end: { x: 10, y: 10 }, hasDoor: false },
  { id: 'w-n', start: { x: 10, y: 10 }, end: { x: 0, y: 10 }, hasDoor: false },
  { id: 'w-w', start: { x: 0, y: 10 }, end: { x: 0, y: 0 }, hasDoor: false },
  // Living-Kitchen divider
  { id: 'w-lk', start: { x: 6, y: 0 }, end: { x: 6, y: 4 }, hasDoor: true, doorPosition: 0.5, doorWidth: 0.9 },
  // Kitchen-Dining
  { id: 'w-kd', start: { x: 6, y: 4 }, end: { x: 10, y: 4 }, hasDoor: false },
  // South hallway wall
  { id: 'w-h-s1', start: { x: 0, y: 5 }, end: { x: 6, y: 5 }, hasDoor: true, doorPosition: 0.75, doorWidth: 0.85 },
  { id: 'w-h-s2', start: { x: 6, y: 5 }, end: { x: 10, y: 5 }, hasDoor: true, doorPosition: 0.3, doorWidth: 0.85 },
  // North hallway wall
  { id: 'w-h-n1', start: { x: 0, y: 6.2 }, end: { x: 5, y: 6.2 }, hasDoor: true, doorPosition: 0.7, doorWidth: 0.85 },
  { id: 'w-h-n2', start: { x: 5, y: 6.2 }, end: { x: 8, y: 6.2 }, hasDoor: true, doorPosition: 0.5, doorWidth: 0.8 },
  { id: 'w-h-n3', start: { x: 8, y: 6.2 }, end: { x: 10, y: 6.2 }, hasDoor: true, doorPosition: 0.5, doorWidth: 0.7 },
  // Office-Bathroom divider
  { id: 'w-ob', start: { x: 8, y: 6.2 }, end: { x: 8, y: 8.5 }, hasDoor: false },
  // Master-Office divider
  { id: 'w-mo', start: { x: 5, y: 6.2 }, end: { x: 5, y: 8.5 }, hasDoor: false },
  // Second bedroom wall
  { id: 'w-sb', start: { x: 5, y: 8.5 }, end: { x: 10, y: 8.5 }, hasDoor: true, doorPosition: 0.3, doorWidth: 0.8 },
  // Master-Bedroom2 divider
  { id: 'w-mb', start: { x: 5, y: 8.5 }, end: { x: 5, y: 10 }, hasDoor: false },
].map(w => ({
  ...w,
  height: 2.7,
  thickness: 0.12,
  hasWindow: false,
  attenuation: 0.6,
}));

export const demoHouse: House = {
  id: 'demo-house',
  name: 'Research House Alpha',
  metadata: { createdAt: Date.now(), updatedAt: Date.now(), units: 'meters' },
  floors: [{
    id: 'floor-1',
    level: 0,
    name: 'Ground Floor',
    rooms,
    walls,
    dimensions: { width: 10, height: 10 },
  }],
};

// Waypoints for simulation paths (room centers and door transitions)
export const WAYPOINTS: Record<string, { x: number; y: number }> = {
  'living-center': { x: 3, y: 2.5 },
  'kitchen-center': { x: 8, y: 2 },
  'dining-center': { x: 8, y: 4.5 },
  'hallway-left': { x: 2, y: 5.6 },
  'hallway-mid': { x: 5, y: 5.6 },
  'hallway-right': { x: 8, y: 5.6 },
  'master-center': { x: 2.5, y: 8.1 },
  'office-center': { x: 6.5, y: 7.35 },
  'bathroom-center': { x: 9, y: 7.35 },
  'bedroom2-center': { x: 7.5, y: 9.25 },
  'front-door': { x: 4.5, y: 0.3 },
};

export const ROOM_PATHS: Record<string, string[]> = {
  'walkthrough': [
    'front-door', 'living-center', 'living-center', 'hallway-left', 'hallway-mid',
    'master-center', 'master-center', 'hallway-mid', 'hallway-right',
    'office-center', 'office-center', 'hallway-right', 'kitchen-center',
    'dining-center', 'hallway-mid', 'bathroom-center', 'hallway-right',
    'bedroom2-center', 'bedroom2-center', 'hallway-mid', 'living-center', 'front-door',
  ],
  'kitchen-loop': [
    'kitchen-center', 'dining-center', 'hallway-right', 'hallway-mid',
    'living-center', 'hallway-left', 'hallway-mid', 'kitchen-center',
  ],
};
