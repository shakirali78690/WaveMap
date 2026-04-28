import { Vec3 } from './house';

export interface Joint {
  id: string;
  name: string;
  position: Vec3;
  confidence: number;
}

export interface PoseEstimate {
  joints: Joint[];
  confidence: number;
  state: AnimationState;
  heading: number; // radians
}

export enum RenderMode {
  Full = 'full',
  Reduced = 'reduced',
  Capsule = 'capsule',
  Ghost = 'ghost',
  FadingTrail = 'fadingTrail',
}

export enum AnimationState {
  Idle = 'idle',
  Moving = 'moving',
  Turning = 'turning',
  Entering = 'entering',
  Leaving = 'leaving',
  Occluded = 'occluded',
  Uncertain = 'uncertain',
  Reacquired = 'reacquired',
}

export interface EntityTrack {
  id: string;
  label: string;
  position: Vec3;
  prevPosition: Vec3;
  velocity: Vec3;
  speed: number;
  direction: number; // radians
  confidence: number;
  currentRoom: string | null;
  previousRoom: string | null;
  dwellTime: number; // seconds in current room
  lastSeen: number; // timestamp
  firstSeen: number;
  history: Vec3[];
  historyTimestamps: number[];
  poseEstimate: PoseEstimate | null;
  renderMode: RenderMode;
  animationState: AnimationState;
  isStale: boolean;
}

export interface AvatarState {
  entityId: string;
  renderMode: RenderMode;
  animationState: AnimationState;
  opacity: number;
  confidenceColor: string;
  targetPosition: Vec3;
  smoothedPosition: Vec3;
  smoothedHeading: number;
}

export const SKELETON_JOINTS = [
  'head', 'neck', 'spine_top', 'spine_mid', 'spine_base',
  'shoulder_l', 'elbow_l', 'wrist_l',
  'shoulder_r', 'elbow_r', 'wrist_r',
  'hip_l', 'knee_l', 'ankle_l',
  'hip_r', 'knee_r', 'ankle_r',
] as const;

export const SKELETON_BONES: [string, string][] = [
  ['head', 'neck'], ['neck', 'spine_top'], ['spine_top', 'spine_mid'], ['spine_mid', 'spine_base'],
  ['spine_top', 'shoulder_l'], ['shoulder_l', 'elbow_l'], ['elbow_l', 'wrist_l'],
  ['spine_top', 'shoulder_r'], ['shoulder_r', 'elbow_r'], ['elbow_r', 'wrist_r'],
  ['spine_base', 'hip_l'], ['hip_l', 'knee_l'], ['knee_l', 'ankle_l'],
  ['spine_base', 'hip_r'], ['hip_r', 'knee_r'], ['knee_r', 'ankle_r'],
];
