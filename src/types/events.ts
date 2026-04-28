export type EventType =
  | 'motion_detected' | 'body_appeared' | 'body_lost'
  | 'room_enter' | 'room_exit' | 'multiple_occupancy'
  | 'unusual_path' | 'sensor_degradation' | 'signal_drop'
  | 'confidence_spike' | 'stationary_dwell' | 'occlusion'
  | 'motion_start' | 'motion_stop';

export type EventSeverity = 'info' | 'warning' | 'critical';

export interface OccupancyEvent {
  id: string;
  timestamp: number;
  type: EventType;
  severity: EventSeverity;
  entityId: string | null;
  roomId: string | null;
  confidence: number;
  message: string;
  details: Record<string, unknown>;
}

export interface PlaybackSession {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  frameCount: number;
  description: string;
}

export interface PlaybackFrame {
  timestamp: number;
  frameIndex: number;
  entities: import('./entity').EntityTrack[];
  events: OccupancyEvent[];
  signalQuality: number;
}

export interface CalibrationProfile {
  id: string;
  name: string;
  houseId: string;
  sensorPlacements: import('./sensing').SensorNode[];
  confidenceThreshold: number;
  motionSensitivity: number;
  wallAttenuation: number;
  coordinateTransform: { offsetX: number; offsetY: number; scale: number; rotation: number; };
  createdAt: number;
  updatedAt: number;
}
