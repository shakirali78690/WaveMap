// ============================================================
// Wi-Fi Sensing Simulator
//
// Generates DetectionFrames at a nominal rate (~15 Hz) for any
// number of virtual occupants. Produces:
//   - plausible 2D walking paths with room-aware waypoints
//   - smoothed velocity / heading
//   - confidence driven by wall attenuation + sensor distance
//   - pose estimates synthesized from a walking gait
//   - sparse events (room transitions, signal drops, etc.)
//
// This adapter is deliberately "honest" about the limits of
// Wi-Fi sensing: confidence degrades near walls, intermittent
// loss through thick partitions, brief reacquisitions, and
// graceful fallback to capsule/ghost rendering downstream.
// ============================================================

import type {
  AdapterCapabilities,
  AdapterConnectOptions,
  BodyState,
  DataSourceAdapter,
  DetectionFrame,
  EntityObservation,
  JointId,
  OccupancyEvent,
  PoseEstimate,
  Room,
  SystemHealth,
  Vec2,
  Vec3,
} from './types';
import { SAMPLE_HOUSE } from './sampleHouse';

// ----------------------------------------------------------------
// Geometry helpers
// ----------------------------------------------------------------

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function dist2(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function dist3(a: Vec3, b: Vec3): number {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/** Point-in-polygon test (ray casting). */
function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect =
      (yi > p.y) !== (yj > p.y) &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonCentroid(poly: Vec2[]): Vec2 {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    const f = p1.x * p2.y - p2.x * p1.y;
    cx += (p1.x + p2.x) * f;
    cy += (p1.y + p2.y) * f;
    a += f;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-6) {
    // Fallback to arithmetic mean
    const mx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
    const my = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    return { x: mx, y: my };
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

function whichRoom(pt: Vec2, rooms: Room[]): Room | undefined {
  for (const r of rooms) if (pointInPolygon(pt, r.polygon)) return r;
  return undefined;
}

function angleTo(a: Vec2, b: Vec2): number {
  return Math.atan2(b.y - a.y, b.x - a.x);
}

function shortestAngleDelta(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Deterministic PRNG (mulberry32) — reproducible simulations.
function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ----------------------------------------------------------------
// Scenarios
// ----------------------------------------------------------------

export type ScenarioId =
  | 'single-walker'
  | 'two-crossing'
  | 'stationary'
  | 'intermittent-loss'
  | 'noisy-signal';

export const SCENARIOS: Array<{ id: ScenarioId; label: string; description: string; occupants: number }> = [
  { id: 'single-walker',     label: 'Single Walker',       description: 'One occupant moves steadily through rooms.',                 occupants: 1 },
  { id: 'two-crossing',      label: 'Two Crossing Paths',  description: 'Two occupants pass near each other and cross rooms.',        occupants: 2 },
  { id: 'stationary',        label: 'Stationary Subject',  description: 'A single subject dwells, with micro-motion only.',           occupants: 1 },
  { id: 'intermittent-loss', label: 'Intermittent Loss',   description: 'Subject walks through walls; brief tracking loss segments.', occupants: 1 },
  { id: 'noisy-signal',      label: 'Noisy Signal',        description: 'Elevated RF noise floor; low-confidence tracking.',          occupants: 1 },
  { id: 'fall-detection',    label: 'Fall Detection',      description: 'Subject walks normally, then suddenly falls to the floor.',  occupants: 1 },
];

// ----------------------------------------------------------------
// Occupant model — internal sim state per virtual person.
// ----------------------------------------------------------------

interface Occupant {
  id: string;
  pos: Vec2;
  vel: Vec2;
  heading: number;
  targetHeading: number;
  waypoint: Vec2;
  waypointQueue: Vec2[];
  speed: number;              // nominal m/s
  phase: number;              // gait phase 0..1
  dwellUntil: number;         // ms absolute
  state: BodyState;
  currentRoomId?: string;
  seed: number;
  /** Optional static "loiter" center (for stationary scenarios). */
  loiterCenter?: Vec2;
  /** Scenario specific trigger flag */
  hasFallen?: boolean;
}

// ----------------------------------------------------------------
// Confidence model — drops through interior walls + with distance.
// ----------------------------------------------------------------

function wallPenalty(pos: Vec2, router: Vec2, walls: typeof SAMPLE_HOUSE.floors[0]['walls']): number {
  // Count how many interior walls a segment (router->pos) crosses. Each
  // interior wall adds an attenuation loss proportional to its material.
  let penalty = 0;
  for (const w of walls) {
    if (w.kind === 'opening' || w.kind === 'door') continue;
    if (segmentsIntersect(router, pos, w.a, w.b)) {
      penalty += w.attenuation * (w.kind === 'exterior' ? 0.9 : 0.55);
    }
  }
  return penalty;
}

function segmentsIntersect(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean {
  const d = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x);
  if (Math.abs(d) < 1e-9) return false;
  const u = ((p3.x - p1.x) * (p4.y - p3.y) - (p3.y - p1.y) * (p4.x - p3.x)) / d;
  const v = ((p3.x - p1.x) * (p2.y - p1.y) - (p3.y - p1.y) * (p2.x - p1.x)) / d;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1;
}

function computeConfidence(
  pos: Vec2,
  sensorXY: Vec2,
  noiseFloor: number,
  walls: typeof SAMPLE_HOUSE.floors[0]['walls'],
  jitter: number
): number {
  const d = dist2(pos, sensorXY);
  // Range attenuation — rough log-distance path loss, normalized.
  const range = clamp(1 - d / 12, 0.1, 1);
  const wp = wallPenalty(pos, sensorXY, walls);
  const walls01 = clamp(1 - wp * 0.55, 0, 1);
  const base = range * 0.55 + walls01 * 0.45;
  const conf = clamp(base - noiseFloor + jitter, 0, 1);
  return conf;
}

// ----------------------------------------------------------------
// Pose synthesis
// ----------------------------------------------------------------

function synthesizePose(occ: Occupant, ts: number): PoseEstimate {
  // Height in meters, anatomical reference scale.
  const H = 1.75;
  const p: Vec3 = { x: 0, y: 0, z: 0 }; // Strictly local coords
  const yaw = 0; // Strictly local orientation

  // Gait cycle
  const phase = occ.phase;
  const isSitting = occ.state === 'sitting';
  const isLying = occ.state === 'lying';
  const isFalling = occ.state === 'falling';
  
  // Normal gait components
  const stride = (isSitting || isLying || isFalling) ? 0 : Math.sin(phase * Math.PI * 2) * 0.22;
  const swing = (isSitting || isLying || isFalling) ? 0 : Math.sin(phase * Math.PI * 2 + Math.PI / 2) * 0.2;
  const bob = (isSitting || isLying || isFalling) ? 0 : Math.abs(Math.sin(phase * Math.PI * 2)) * 0.03;

  const fwdX = Math.cos(yaw);
  const fwdZ = Math.sin(yaw);
  const rightX = Math.cos(yaw - Math.PI / 2);
  const rightZ = Math.sin(yaw - Math.PI / 2);

  let joints: Partial<Record<JointId, Vec3>>;

  if (isLying) {
    // Flat on the floor
    joints = {
      pelvis:    { x: 0, y: 0.1, z: 0 },
      spine:     { x: 0, y: 0.1, z: -0.3 },
      neck:      { x: 0, y: 0.1, z: -0.6 },
      head:      { x: 0, y: 0.1, z: -0.8 },
      shoulderL: { x: 0.2, y: 0.1, z: -0.5 },
      shoulderR: { x: -0.2, y: 0.1, z: -0.5 },
      elbowL:    { x: 0.35, y: 0.1, z: -0.4 },
      elbowR:    { x: -0.35, y: 0.1, z: -0.4 },
      wristL:    { x: 0.45, y: 0.1, z: -0.2 },
      wristR:    { x: -0.45, y: 0.1, z: -0.2 },
      hipL:      { x: 0.12, y: 0.1, z: 0 },
      hipR:      { x: -0.12, y: 0.1, z: 0 },
      kneeL:     { x: 0.15, y: 0.1, z: 0.4 },
      kneeR:     { x: -0.15, y: 0.1, z: 0.4 },
      ankleL:    { x: 0.18, y: 0.1, z: 0.8 },
      ankleR:    { x: -0.18, y: 0.1, z: 0.8 },
    };
  } else if (isFalling) {
    // Bracing for impact, midway to ground
    joints = {
      pelvis:    { x: 0, y: 0.4, z: 0 },
      spine:     { x: 0, y: 0.5, z: -0.2 },
      neck:      { x: 0, y: 0.4, z: -0.4 },
      head:      { x: 0, y: 0.3, z: -0.5 },
      shoulderL: { x: 0.2, y: 0.4, z: -0.3 },
      shoulderR: { x: -0.2, y: 0.4, z: -0.3 },
      elbowL:    { x: 0.25, y: 0.2, z: -0.4 },
      elbowR:    { x: -0.25, y: 0.2, z: -0.4 },
      wristL:    { x: 0.2, y: 0.05, z: -0.5 },
      wristR:    { x: -0.2, y: 0.05, z: -0.5 },
      hipL:      { x: 0.12, y: 0.4, z: 0 },
      hipR:      { x: -0.12, y: 0.4, z: 0 },
      kneeL:     { x: 0.1, y: 0.05, z: 0.2 },
      kneeR:     { x: -0.1, y: 0.05, z: 0.2 },
      ankleL:    { x: 0.1, y: 0.1, z: 0.4 },
      ankleR:    { x: -0.1, y: 0.1, z: 0.4 },
    };
  } else {
    // Normal / Sitting
    const sitOffset = isSitting ? 0.35 : 0;
    const kneeY = isSitting ? H * 0.28 : H * 0.28;
    const ankleZ = isSitting ? 0.3 : 0;
    
    joints = {
      pelvis:    { x: p.x, y: H * 0.53 + bob - sitOffset, z: p.z },
      spine:     { x: p.x, y: H * 0.63 + bob - sitOffset, z: p.z },
      neck:      { x: p.x, y: H * 0.88 + bob - sitOffset, z: p.z },
      head:      { x: p.x, y: H * 0.98 + bob - sitOffset, z: p.z },
      shoulderL: { x: p.x + rightX * 0.18, y: H * 0.82 + bob - sitOffset, z: p.z + rightZ * 0.18 },
      shoulderR: { x: p.x - rightX * 0.18, y: H * 0.82 + bob - sitOffset, z: p.z - rightZ * 0.18 },
      elbowL:    { x: p.x + rightX * 0.22 - fwdX * swing, y: H * 0.62 + bob - sitOffset, z: p.z + rightZ * 0.22 - fwdZ * swing + (isSitting ? 0.1 : 0) },
      elbowR:    { x: p.x - rightX * 0.22 + fwdX * swing, y: H * 0.62 + bob - sitOffset, z: p.z - rightZ * 0.22 + fwdZ * swing + (isSitting ? 0.1 : 0) },
      wristL:    { x: p.x + rightX * 0.24 - fwdX * swing * 1.8, y: H * 0.44 + bob - sitOffset + (isSitting ? 0.1 : 0), z: p.z + rightZ * 0.24 - fwdZ * swing * 1.8 + (isSitting ? 0.25 : 0) },
      wristR:    { x: p.x - rightX * 0.24 + fwdX * swing * 1.8, y: H * 0.44 + bob - sitOffset + (isSitting ? 0.1 : 0), z: p.z - rightZ * 0.24 + fwdZ * swing * 1.8 + (isSitting ? 0.25 : 0) },
      hipL:      { x: p.x + rightX * 0.1, y: H * 0.5 + bob - sitOffset, z: p.z + rightZ * 0.1 },
      hipR:      { x: p.x - rightX * 0.1, y: H * 0.5 + bob - sitOffset, z: p.z - rightZ * 0.1 },
      kneeL:     { x: p.x + rightX * 0.1 + fwdX * stride, y: kneeY, z: p.z + rightZ * 0.1 + fwdZ * stride + (isSitting ? 0.2 : 0) },
      kneeR:     { x: p.x - rightX * 0.1 - fwdX * stride, y: kneeY, z: p.z - rightZ * 0.1 - fwdZ * stride + (isSitting ? 0.2 : 0) },
      ankleL:    { x: p.x + rightX * 0.1 + fwdX * stride * 1.6, y: 0.06, z: p.z + rightZ * 0.1 + fwdZ * stride * 1.6 + ankleZ },
      ankleR:    { x: p.x - rightX * 0.1 - fwdX * stride * 1.6, y: 0.06, z: p.z - rightZ * 0.1 - fwdZ * stride * 1.6 + ankleZ },
    };
  }

  // Joint confidence decays outward from torso — Wi-Fi sensing typically
  // solves the torso best and wrists/ankles worst.
  const jc: Partial<Record<JointId, number>> = {
    pelvis: 0.92, spine: 0.9, neck: 0.82, head: 0.74,
    shoulderL: 0.78, shoulderR: 0.78,
    elbowL: 0.6, elbowR: 0.6,
    wristL: 0.38, wristR: 0.38,
    hipL: 0.78, hipR: 0.78,
    kneeL: 0.55, kneeR: 0.55,
    ankleL: 0.32, ankleR: 0.32,
  };

  return { ts, joints, jointConfidence: jc, state: occ.state };
}

// ----------------------------------------------------------------
// Waypoint planner — picks targets inside connected rooms.
// ----------------------------------------------------------------

function pickRoomWaypoint(rnd: () => number, room: Room, jitter = 0.9): Vec2 {
  const c = polygonCentroid(room.polygon);
  return { x: c.x + (rnd() - 0.5) * jitter, y: c.y + (rnd() - 0.5) * jitter };
}

// Connectivity graph — which rooms are adjacent (share a long boundary or door)
const ROOM_GRAPH: Record<string, string[]> = {
  'r-living':  ['r-hall', 'r-kitchen', 'r-dining'],
  'r-kitchen': ['r-living', 'r-dining'],
  'r-dining':  ['r-living', 'r-kitchen', 'r-util'],
  'r-hall':    ['r-living', 'r-bedroom', 'r-office'],
  'r-bedroom': ['r-hall'],
  'r-office':  ['r-hall', 'r-bath', 'r-util'],
  'r-bath':    ['r-office'],
  'r-util':    ['r-office', 'r-dining'],
};

// ----------------------------------------------------------------
// Simulator core
// ----------------------------------------------------------------

export interface SimulatorOptions {
  scenario: ScenarioId;
  rateHz?: number;
  seed?: number;
}

export class WifiSensingSimulator implements DataSourceAdapter {
  id = 'mock-simulator';
  label = 'Mock Simulator';
  capabilities: AdapterCapabilities = {
    supportsLive: true,
    supportsPlayback: true,
    supportsPose: true,
    supportsSignalField: true,
    nominalRate: 15,
  };

  private house = SAMPLE_HOUSE;
  private scenario: ScenarioId;
  private rateHz: number;
  private rnd: () => number;
  private seed: number;
  private occupants: Occupant[] = [];
  private frameSeq = 0;
  private startedAt = 0;
  private noiseFloor = 0.0;
  private running = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(opts: SimulatorOptions) {
    this.scenario = opts.scenario;
    this.rateHz = opts.rateHz ?? 15;
    this.seed = opts.seed ?? 0x9E3779B9;
    this.rnd = prng(this.seed);
    this.noiseFloor = this.scenario === 'noisy-signal' ? 0.28 : 0.04;
    this.spawnOccupants();
  }

  private spawnOccupants() {
    const rooms = this.house.floors[0].rooms;
    const livingCenter = polygonCentroid(rooms.find((r) => r.id === 'r-living')!.polygon);
    const bedCenter = polygonCentroid(rooms.find((r) => r.id === 'r-bedroom')!.polygon);
    const kitchenCenter = polygonCentroid(rooms.find((r) => r.id === 'r-kitchen')!.polygon);

    const mkOccupant = (id: string, pos: Vec2, seedOffset: number): Occupant => ({
      id,
      pos: { ...pos },
      vel: { x: 0, y: 0 },
      heading: 0,
      targetHeading: 0,
      waypoint: { ...pos },
      waypointQueue: [],
      speed: 0.9 + this.rnd() * 0.4,
      phase: 0,
      dwellUntil: 0,
      state: 'idle',
      seed: this.seed ^ seedOffset,
      currentRoomId: whichRoom(pos, rooms)?.id,
    });

    switch (this.scenario) {
      case 'single-walker':
        this.occupants = [mkOccupant('e-1', livingCenter, 1)];
        break;
      case 'two-crossing':
        this.occupants = [
          mkOccupant('e-1', livingCenter, 1),
          mkOccupant('e-2', bedCenter, 2),
        ];
        break;
      case 'stationary': {
        const occ = mkOccupant('e-1', kitchenCenter, 3);
        occ.loiterCenter = kitchenCenter;
        occ.speed = 0.05;
        occ.state = 'idle';
        this.occupants = [occ];
        break;
      }
      case 'intermittent-loss':
        this.occupants = [mkOccupant('e-1', livingCenter, 4)];
        break;
      case 'noisy-signal':
        this.occupants = [mkOccupant('e-1', livingCenter, 5)];
        break;
      case 'fall-detection':
        this.occupants = [mkOccupant('e-1', livingCenter, 6)];
        break;
    }
  }

  private planNextWaypoint(occ: Occupant) {
    const rooms = this.house.floors[0].rooms;
    if (occ.loiterCenter) {
      // micro-motion
      occ.waypoint = {
        x: occ.loiterCenter.x + (this.rnd() - 0.5) * 0.4,
        y: occ.loiterCenter.y + (this.rnd() - 0.5) * 0.4,
      };
      return;
    }
    const current = whichRoom(occ.pos, rooms);
    const currentId = current?.id ?? 'r-living';
    const neighbors = ROOM_GRAPH[currentId] ?? [];
    const pool = this.rnd() < 0.35 ? [currentId] : neighbors.length ? neighbors : [currentId];
    const nextId = pool[Math.floor(this.rnd() * pool.length)];
    const room = rooms.find((r) => r.id === nextId)!;

    if (nextId !== currentId) {
      // Insert an intermediate doorway waypoint — approximated by the midpoint
      // of shared edges; here we take the midpoint of the two centroids.
      const hereC = polygonCentroid(current!.polygon);
      const thereC = polygonCentroid(room.polygon);
      const gate = { x: (hereC.x + thereC.x) / 2, y: (hereC.y + thereC.y) / 2 };
      occ.waypointQueue = [gate, pickRoomWaypoint(this.rnd, room)];
      occ.waypoint = occ.waypointQueue.shift()!;
    } else {
      occ.waypoint = pickRoomWaypoint(this.rnd, room);
    }
  }

  private step(dtMs: number) {
    const dt = dtMs / 1000;
    const rooms = this.house.floors[0].rooms;
    for (const occ of this.occupants) {
      // Waypoint navigation
      const d = dist2(occ.pos, occ.waypoint);
      if (d < 0.25) {
        if (occ.waypointQueue.length > 0) {
          occ.waypoint = occ.waypointQueue.shift()!;
        } else {
          this.planNextWaypoint(occ);
        }
      }

      occ.targetHeading = angleTo(occ.pos, occ.waypoint);
      const dh = shortestAngleDelta(occ.heading, occ.targetHeading);
      occ.heading += clamp(dh, -3 * dt, 3 * dt);

      // Speed profile
      const wantSpeed = occ.loiterCenter ? occ.speed * 0.3 : occ.speed;
      const vx = Math.cos(occ.heading) * wantSpeed;
      const vy = Math.sin(occ.heading) * wantSpeed;
      occ.vel = { x: lerp(occ.vel.x, vx, clamp(dt * 4, 0, 1)), y: lerp(occ.vel.y, vy, clamp(dt * 4, 0, 1)) };

      occ.pos = { x: occ.pos.x + occ.vel.x * dt, y: occ.pos.y + occ.vel.y * dt };
      occ.pos.x = clamp(occ.pos.x, 0.2, this.house.floors[0].bounds.w - 0.2);
      occ.pos.y = clamp(occ.pos.y, 0.2, this.house.floors[0].bounds.h - 0.2);

      const speed = Math.hypot(occ.vel.x, occ.vel.y);
      occ.phase = (occ.phase + dt * (0.8 + speed * 1.1)) % 1;

      // State classification
      const prevRoom = occ.currentRoomId;
      const room = whichRoom(occ.pos, rooms);
      occ.currentRoomId = room?.id;
      
      // Fall Detection Scenario Logic
      if (this.scenario === 'fall-detection') {
        // Trigger a fall at a specific phase of the simulation
        const sec = (Date.now() - this.startedAt) / 1000;
        const fallCycle = sec % 15; // 15 second cycle
        if (fallCycle > 5 && fallCycle < 6) {
          occ.state = 'falling';
          occ.speed = 0;
          occ.hasFallen = true;
        } else if (fallCycle >= 6 && fallCycle < 12) {
          occ.state = 'lying';
          occ.speed = 0;
        } else if (fallCycle >= 12) {
          occ.hasFallen = false;
          occ.speed = 1.0;
        }
      }

      // Normal Classification
      if (occ.state !== 'falling' && occ.state !== 'lying') {
        if (speed < 0.1) {
          occ.state = occ.loiterCenter && (occ.seed % 2 === 0) ? 'sitting' : 'idle';
        }
        else if (Math.abs(dh) > 0.6) occ.state = 'turning';
        else occ.state = 'walking';
        if (prevRoom && room && prevRoom !== room.id) occ.state = 'entering';
      }
    }
  }

  private toFrame(): { frame: DetectionFrame; events: OccupancyEvent[] } {
    const floor = this.house.floors[0];
    const sensor = this.house.sensors[0];
    const sensorXY: Vec2 = { x: sensor.position.x, y: sensor.position.z };
    const ts = Date.now();
    const events: OccupancyEvent[] = [];
    const entities: EntityObservation[] = [];

    // For scenario 'intermittent-loss', periodically suppress the entity.
    const suppressed = this.scenario === 'intermittent-loss' &&
      Math.floor(ts / 4200) % 3 === 2;

    this.occupants.forEach((occ, i) => {
      const jitter = (this.rnd() - 0.5) * 0.06;
      const confidence = suppressed && i === 0
        ? clamp(0.08 + jitter, 0, 0.15)
        : computeConfidence(occ.pos, sensorXY, this.noiseFloor, floor.walls, jitter);

      // Add positional noise inversely proportional to confidence.
      const noiseScale = (1 - confidence) * 0.18;
      const noisyPos: Vec3 = {
        x: occ.pos.x + (this.rnd() - 0.5) * noiseScale,
        y: 0,
        z: occ.pos.y + (this.rnd() - 0.5) * noiseScale,
      };

      const obs: EntityObservation = {
        id: occ.id,
        floorId: floor.id,
        position: noisyPos,
        velocity: { x: occ.vel.x, y: 0, z: occ.vel.y },
        heading: occ.heading,
        confidence,
        roomId: occ.currentRoomId,
        uncertainty: 0.15 + (1 - confidence) * 0.45,
        pose: confidence > 0.35 ? synthesizePose(occ, ts) : undefined,
      };
      entities.push(obs);
    });

    // Rarely emit a signal-drop event when confidence is globally low.
    if (this.scenario !== 'stationary' && this.rnd() < 0.005) {
      events.push({
        id: `evt-${ts}-drop`,
        ts,
        kind: 'signal-drop',
        severity: 'warn',
        message: 'Signal drop detected on sensor ' + sensor.id,
        meta: { sensor: sensor.id },
      });
    }

    const sqi = clamp(
      entities.reduce((s, e) => s + e.confidence, 0) / Math.max(1, entities.length) - this.noiseFloor,
      0,
      1
    );

    const frame: DetectionFrame = {
      seq: this.frameSeq++,
      ts,
      sqi,
      entities,
      events,
    };

    return { frame, events };
  }

  // ---- DataSourceAdapter impl ----

  async connect(opts: AdapterConnectOptions): Promise<() => void> {
    this.running = true;
    this.startedAt = Date.now();

    const frameIntervalMs = 1000 / this.rateHz;
    let lastTick = performance.now();

    const tick = () => {
      if (!this.running) return;
      const now = performance.now();
      const dt = now - lastTick;
      lastTick = now;

      this.step(dt);
      const { frame, events } = this.toFrame();
      opts.onFrame(frame);
      for (const e of events) opts.onEvent?.(e);

      const health: Partial<SystemHealth> = {
        routerConnected: true,
        routerSsid: 'WaveMap-Core',
        routerIp: '10.42.0.1',
        adapter: this.id,
        adapterReady: true,
        streamState: 'open',
        packetRate: this.rateHz * (0.9 + (this.rnd() * 0.2)),
        inferenceMs: 22 + (this.rnd() * 14),
        tracks: this.occupants.length,
        sqi: frame.sqi,
        calibration: 'auto',
        uptime: (Date.now() - this.startedAt) / 1000,
      };
      opts.onHealth(health);

      this.timer = setTimeout(tick, frameIntervalMs);
    };

    this.timer = setTimeout(tick, frameIntervalMs);

    opts.signal?.addEventListener('abort', () => this.teardown());
    return () => this.teardown();
  }

  async command(cmd: import('./types').AdapterCommand): Promise<void> {
    if (cmd.type === 'set-rate') this.rateHz = clamp(cmd.hz, 1, 60);
    if (cmd.type === 'restart') {
      this.frameSeq = 0;
      this.spawnOccupants();
    }
  }

  setScenario(id: ScenarioId) {
    this.scenario = id;
    this.noiseFloor = id === 'noisy-signal' ? 0.28 : 0.04;
    this.spawnOccupants();
  }

  private teardown() {
    this.running = false;
    if (this.timer != null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
