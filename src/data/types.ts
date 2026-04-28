// ============================================================
// WaveMap — Data Contracts
//
// Strongly-typed interfaces that describe every entity flowing
// through the system. Designed to be backend-agnostic so that
// simulated data, recorded sessions, websocket streams, or a
// future CSI / RF inference pipeline can all feed the same
// visualization and analytics layers.
// ============================================================

// ----------------------------------------------------------------
// Geometry primitives
// ----------------------------------------------------------------

/** Point in 2D floor coordinates (meters). Origin = house bounding-box min. */
export interface Vec2 { x: number; y: number; }

/** Point in 3D world coordinates (meters). y is vertical. */
export interface Vec3 { x: number; y: number; z: number; }

/** Axis-aligned rectangle in floor coordinates. */
export interface Rect2 { x: number; y: number; w: number; h: number; }

// ----------------------------------------------------------------
// Structural model: House → Floor → Room → Wall
// ----------------------------------------------------------------

export type RoomKind =
  | 'living'
  | 'kitchen'
  | 'bedroom'
  | 'bathroom'
  | 'office'
  | 'hall'
  | 'dining'
  | 'utility'
  | 'garage'
  | 'outdoor';

export interface Room {
  id: string;
  name: string;
  kind: RoomKind;
  floorId: string;
  /** Closed polygon in floor coordinates (CCW). */
  polygon: Vec2[];
  /** Ceiling height in meters. */
  height: number;
  /** Display color override (HSL or hex). Resolved from kind if absent. */
  color?: string;
  /** Short semantic hint used in labels / legend. */
  tag?: string;
}

export type WallKind = 'exterior' | 'interior' | 'opening' | 'door' | 'window';

export interface Wall {
  id: string;
  floorId: string;
  a: Vec2;
  b: Vec2;
  kind: WallKind;
  /** 0..1 estimated RF attenuation (0 = transparent, 1 = opaque). */
  attenuation: number;
  /** Wall thickness in meters (for rendering). */
  thickness: number;
}

export interface Floor {
  id: string;
  name: string;
  index: number;
  /** Floor bounding box (used for camera framing). */
  bounds: Rect2;
  rooms: Room[];
  walls: Wall[];
}

export interface House {
  id: string;
  name: string;
  address?: string;
  floors: Floor[];
  sensors: SensorNode[];
  /** Nominal coordinate origin offset (rarely used). */
  origin?: Vec3;
}

// ----------------------------------------------------------------
// Sensing topology
// ----------------------------------------------------------------

export type SensorKind = 'router' | 'anchor' | 'repeater';

export interface SensorNode {
  id: string;
  kind: SensorKind;
  label: string;
  floorId: string;
  position: Vec3;
  /** Nominal coverage radius in meters. */
  coverage: number;
  /** Transmit power index or channel metadata, free-form. */
  meta?: Record<string, string | number>;
}

/** A coarse signal-strength heatmap sampled on a grid in floor coordinates. */
export interface SignalField {
  floorId: string;
  /** Inclusive bounds the grid covers. */
  bounds: Rect2;
  /** Grid resolution (cells per axis). */
  cols: number;
  rows: number;
  /** Row-major, values 0..1. */
  values: Float32Array;
  /** Generation timestamp (ms since epoch). */
  ts: number;
}

// ----------------------------------------------------------------
// Detection pipeline
// ----------------------------------------------------------------

export type ConfidenceBand = 'high' | 'medium' | 'low' | 'lost';

export interface DetectionFrame {
  /** Monotonic sequence number. */
  seq: number;
  /** Milliseconds since epoch. */
  ts: number;
  /** Frame-wide signal quality index 0..1. */
  sqi: number;
  entities: EntityObservation[];
  /** Optional sparse events attached to this frame. */
  events?: OccupancyEvent[];
}

export interface EntityObservation {
  id: string;
  floorId: string;
  /** Best-estimate position at this frame (floor coords + elevation). */
  position: Vec3;
  /** Instantaneous velocity (m/s). */
  velocity: Vec3;
  /** Heading in radians (yaw around vertical). */
  heading: number;
  /** 0..1 confidence score from the inference stack. */
  confidence: number;
  /** Room id the entity is currently in, if resolvable. */
  roomId?: string;
  /** Optional pose estimate. Absent when pose is unavailable. */
  pose?: PoseEstimate;
  /** Optional per-entity uncertainty radius (meters). */
  uncertainty?: number;
}

/** Simplified skeletal rig; joint positions are in world coordinates. */
export interface PoseEstimate {
  /** Timestamp of pose solve. */
  ts: number;
  joints: Partial<Record<JointId, Vec3>>;
  /** Per-joint confidence 0..1; missing joints are treated as unknown. */
  jointConfidence: Partial<Record<JointId, number>>;
  /** Coarse body state classification. */
  state: BodyState;
}

export type JointId =
  | 'head'
  | 'neck'
  | 'spine'
  | 'pelvis'
  | 'shoulderL' | 'shoulderR'
  | 'elbowL' | 'elbowR'
  | 'wristL' | 'wristR'
  | 'hipL' | 'hipR'
  | 'kneeL' | 'kneeR'
  | 'ankleL' | 'ankleR';

export type BodyState =
  | 'idle'
  | 'walking'
  | 'turning'
  | 'entering'
  | 'leaving'
  | 'occluded'
  | 'uncertain'
  | 'reacquired';

// ----------------------------------------------------------------
// Track (aggregated over time)
// ----------------------------------------------------------------

export interface EntityTrack {
  id: string;
  /** First-seen timestamp. */
  firstSeen: number;
  /** Last-seen timestamp. */
  lastSeen: number;
  /** Most recent observation, if live. */
  latest?: EntityObservation;
  /** Ring buffer of recent positions (oldest first). */
  history: Array<{ ts: number; pos: Vec3; confidence: number; roomId?: string }>;
  /** Derived: current room id. */
  roomId?: string;
  /** Dwell time in the current room (ms). */
  dwellMs: number;
  /** Smoothed confidence band. */
  band: ConfidenceBand;
}

// ----------------------------------------------------------------
// Avatar rendering state (consumed by the 3D layer)
// ----------------------------------------------------------------

export interface AvatarState {
  trackId: string;
  position: Vec3;
  heading: number;
  confidence: number;
  band: ConfidenceBand;
  /** Chosen render style; derived from band and pose availability. */
  style: 'articulated' | 'skeleton' | 'capsule' | 'ghost' | 'afterimage';
  pose?: PoseEstimate;
  state: BodyState;
  roomId?: string;
  /** Short history of positions for tail rendering. */
  tail: Array<{ pos: Vec3; alpha: number }>;
}

// ----------------------------------------------------------------
// Events & system health
// ----------------------------------------------------------------

export type OccupancyEventKind =
  | 'motion-start'
  | 'motion-stop'
  | 'room-enter'
  | 'room-leave'
  | 'dwell'
  | 'appeared'
  | 'lost'
  | 'reacquired'
  | 'multi-occupancy'
  | 'unusual-path'
  | 'signal-drop'
  | 'confidence-spike'
  | 'sensor-degraded';

export interface OccupancyEvent {
  id: string;
  ts: number;
  kind: OccupancyEventKind;
  severity: 'info' | 'notice' | 'warn' | 'critical';
  message: string;
  trackId?: string;
  roomId?: string;
  meta?: Record<string, string | number>;
}

export interface SystemHealth {
  /** Router / data source connection. */
  routerConnected: boolean;
  routerSsid?: string;
  routerIp?: string;
  /** Backend adapter label, e.g. "mock-simulator" or "csi-bridge". */
  adapter: string;
  adapterReady: boolean;
  /** WebSocket readyState-like indicator. */
  streamState: 'connecting' | 'open' | 'closed' | 'error';
  /** Render FPS (smoothed). */
  fps: number;
  /** Raw packet rate from sensing pipeline (Hz). */
  packetRate: number;
  /** End-to-end inference latency (ms). */
  inferenceMs: number;
  /** Count of active tracks. */
  tracks: number;
  /** Global signal quality index 0..1. */
  sqi: number;
  /** Calibration status label. */
  calibration: 'unknown' | 'auto' | 'manual' | 'stale';
  /** Seconds of uptime. */
  uptime: number;
}

// ----------------------------------------------------------------
// Playback
// ----------------------------------------------------------------

export interface PlaybackSession {
  id: string;
  label: string;
  startedAt: number;
  endedAt: number;
  frames: DetectionFrame[];
  events: OccupancyEvent[];
  summary?: string;
}

export interface PlaybackFrame extends DetectionFrame {
  /** Playback index in its parent session. */
  index: number;
}

// ----------------------------------------------------------------
// Calibration
// ----------------------------------------------------------------

export interface CalibrationProfile {
  id: string;
  label: string;
  createdAt: number;
  updatedAt: number;
  /** Meters-per-unit scale for imported plans. */
  scale: number;
  /** Grid origin offset. */
  origin: Vec2;
  /** Restricted / privacy-masked regions (floor coords). */
  masks: Rect2[];
  /** Confidence thresholds per band. */
  thresholds: { high: number; medium: number; low: number };
  /** Smoothing factor 0..1 for entity trails. */
  smoothing: number;
  /** Maximum visible dwell history per track (seconds). */
  trailSeconds: number;
  notes?: string;
}

// ----------------------------------------------------------------
// Adapter contract (real hardware goes here)
// ----------------------------------------------------------------

export interface DataSourceAdapter {
  /** Machine-readable id; used for "Device / Router" screen labels. */
  id: string;
  /** Short human label shown in status bar. */
  label: string;
  /** Begin producing frames on the callback. Returns a teardown fn. */
  connect(opts: AdapterConnectOptions): Promise<() => void>;
  /** Optional out-of-band command channel. */
  command?: (cmd: AdapterCommand) => Promise<void>;
  /** Static capabilities reported by this adapter. */
  capabilities: AdapterCapabilities;
}

export interface AdapterConnectOptions {
  onFrame: (frame: DetectionFrame) => void;
  onHealth: (patch: Partial<SystemHealth>) => void;
  onEvent?: (event: OccupancyEvent) => void;
  signal?: AbortSignal;
}

export interface AdapterCapabilities {
  supportsLive: boolean;
  supportsPlayback: boolean;
  supportsPose: boolean;
  supportsSignalField: boolean;
  /** Nominal frame rate (Hz). */
  nominalRate: number;
}

export type AdapterCommand =
  | { type: 'set-rate'; hz: number }
  | { type: 'request-calibration' }
  | { type: 'restart' };

// ----------------------------------------------------------------
// Display / overlay toggles (UI state)
// ----------------------------------------------------------------

export interface OverlayFlags {
  signalField: boolean;
  coverage: boolean;
  motionHeatmap: boolean;
  occupancyDensity: boolean;
  trails: boolean;
  wallAttenuation: boolean;
  uncertainty: boolean;
  eventPulses: boolean;
  roomLabels: boolean;
  grid: boolean;
}

export type CameraPreset =
  | 'isometric'
  | 'top'
  | 'orbit'
  | 'first-person'
  | 'cinematic';
