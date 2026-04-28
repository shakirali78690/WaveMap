import { Vec3 } from '../types/house';
import { EntityTrack, AnimationState, RenderMode, PoseEstimate, Joint, SKELETON_JOINTS } from '../types/entity';
import { WAYPOINTS, ROOM_PATHS } from './demoHouse';

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function generatePose(pos: Vec3, heading: number, confidence: number, state: AnimationState): PoseEstimate {
  const joints: Joint[] = SKELETON_JOINTS.map((name, i) => {
    const baseY = name.startsWith('ankle') ? 0.05 : name.startsWith('knee') ? 0.45 :
      name.startsWith('hip') ? 0.85 : name === 'spine_base' ? 0.9 :
      name === 'spine_mid' ? 1.1 : name === 'spine_top' ? 1.3 :
      name.startsWith('shoulder') ? 1.35 : name.startsWith('elbow') ? 1.05 :
      name.startsWith('wrist') ? 0.75 : name === 'neck' ? 1.45 : 1.65;
    
    const side = name.endsWith('_l') ? -0.2 : name.endsWith('_r') ? 0.2 : 0;
    const jitter = (Math.random() - 0.5) * (1 - confidence) * 0.1;
    
    return {
      id: name,
      name,
      position: { x: pos.x + side * Math.cos(heading) + jitter, y: baseY, z: pos.z + side * Math.sin(heading) + jitter },
      confidence: Math.max(0, confidence + (Math.random() - 0.5) * 0.2),
    };
  });
  return { joints, confidence, state, heading };
}

interface SimEntity {
  id: string;
  label: string;
  pathKey: string;
  waypointIndex: number;
  progress: number;
  speed: number;
  position: { x: number; y: number };
  pauseTimer: number;
  confidence: number;
}

function findRoom(x: number, y: number): string | null {
  // Simple point-in-rect check for our rectangular rooms
  const rooms: { id: string; x1: number; y1: number; x2: number; y2: number }[] = [
    { id: 'living', x1: 0, y1: 0, x2: 6, y2: 5 },
    { id: 'kitchen', x1: 6, y1: 0, x2: 10, y2: 4 },
    { id: 'dining', x1: 6, y1: 4, x2: 10, y2: 5 },
    { id: 'hallway', x1: 0, y1: 5, x2: 10, y2: 6.2 },
    { id: 'master-bed', x1: 0, y1: 6.2, x2: 5, y2: 10 },
    { id: 'office', x1: 5, y1: 6.2, x2: 8, y2: 8.5 },
    { id: 'bathroom', x1: 8, y1: 6.2, x2: 10, y2: 8.5 },
    { id: 'bedroom2', x1: 5, y1: 8.5, x2: 10, y2: 10 },
  ];
  for (const r of rooms) {
    if (x >= r.x1 && x <= r.x2 && y >= r.y1 && y <= r.y2) return r.id;
  }
  return null;
}

export function createDemoScenarios() {
  const entities: SimEntity[] = [
    {
      id: 'entity-1', label: 'Person A', pathKey: 'walkthrough',
      waypointIndex: 0, progress: 0, speed: 1.2,
      position: { ...WAYPOINTS['front-door'] }, pauseTimer: 0, confidence: 0.9,
    },
    {
      id: 'entity-2', label: 'Person B', pathKey: 'kitchen-loop',
      waypointIndex: 0, progress: 0, speed: 0.8,
      position: { ...WAYPOINTS['kitchen-center'] }, pauseTimer: 2, confidence: 0.85,
    },
  ];

  let frameId = 0;

  function tick(deltaSeconds: number): EntityTrack[] {
    frameId++;
    const now = Date.now();
    
    return entities.map(ent => {
      const path = ROOM_PATHS[ent.pathKey];
      if (!path || path.length < 2) return null;

      // Handle pause at waypoints
      if (ent.pauseTimer > 0) {
        ent.pauseTimer -= deltaSeconds;
        // Add micro-movement while paused
        ent.position.x += (Math.random() - 0.5) * 0.01;
        ent.position.y += (Math.random() - 0.5) * 0.01;
      } else {
        const fromKey = path[ent.waypointIndex];
        const toKey = path[(ent.waypointIndex + 1) % path.length];
        const from = WAYPOINTS[fromKey];
        const to = WAYPOINTS[toKey];
        
        if (from && to) {
          const d = dist(from, to);
          const step = d > 0 ? (ent.speed * deltaSeconds) / d : 1;
          ent.progress += step;
          
          if (ent.progress >= 1) {
            ent.progress = 0;
            ent.waypointIndex = (ent.waypointIndex + 1) % path.length;
            ent.pauseTimer = 0.5 + Math.random() * 2;
            ent.position = { ...WAYPOINTS[toKey] };
          } else {
            ent.position.x = lerp(from.x, to.x, ent.progress);
            ent.position.y = lerp(from.y, to.y, ent.progress);
          }
        }
      }

      // Simulate confidence fluctuations
      const room = findRoom(ent.position.x, ent.position.y);
      let conf = ent.confidence + (Math.random() - 0.5) * 0.06;
      // Lower confidence near walls / through walls
      if (room === 'bathroom' || room === 'bedroom2') conf -= 0.1;
      conf = Math.max(0.15, Math.min(0.98, conf));
      ent.confidence = conf;

      const prevPos = { x: ent.position.x - 0.01, y: 0, z: ent.position.y - 0.01 };
      const pos: Vec3 = { x: ent.position.x, y: 0, z: ent.position.y };
      const vx = pos.x - prevPos.x;
      const vz = pos.z - prevPos.z;
      const speed = Math.sqrt(vx * vx + vz * vz) / Math.max(deltaSeconds, 0.016);
      const heading = Math.atan2(vz, vx);
      const animState = ent.pauseTimer > 0 ? AnimationState.Idle :
        speed > 0.3 ? AnimationState.Moving : AnimationState.Idle;

      const track: EntityTrack = {
        id: ent.id,
        label: ent.label,
        position: pos,
        prevPosition: prevPos,
        velocity: { x: vx, y: 0, z: vz },
        speed,
        direction: heading,
        confidence: conf,
        currentRoom: room,
        previousRoom: room,
        dwellTime: ent.pauseTimer > 0 ? ent.pauseTimer : 0,
        lastSeen: now,
        firstSeen: now - 60000,
        history: [],
        historyTimestamps: [],
        poseEstimate: generatePose(pos, heading, conf, animState),
        renderMode: conf > 0.8 ? RenderMode.Full : conf > 0.5 ? RenderMode.Reduced :
          conf > 0.2 ? RenderMode.Capsule : RenderMode.Ghost,
        animationState: animState,
        isStale: false,
      };
      return track;
    }).filter(Boolean) as EntityTrack[];
  }

  return { tick, getFrameId: () => frameId };
}
