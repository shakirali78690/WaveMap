import { Vec3 } from './house';
import { EntityTrack } from './entity';

export interface SensorNode {
  id: string;
  position: Vec3;
  type: 'router' | 'anchor' | 'repeater';
  status: 'active' | 'degraded' | 'offline';
  signalStrength: number;
  label: string;
}

export interface SignalField {
  nodeId: string;
  coverage: Vec3[];
  attenuation: number;
  timestamp: number;
}

export interface DetectionFrame {
  timestamp: number;
  frameId: number;
  entities: EntityTrack[];
  signalQuality: number;
  sensorHealth: Record<string, number>;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

export interface SystemHealth {
  connectionState: ConnectionState;
  adapterType: 'simulation' | 'websocket' | 'playback' | 'none';
  fps: number;
  packetRate: number;
  latency: number;
  trackedCount: number;
  signalQualityIndex: number;
  calibrationStatus: 'uncalibrated' | 'calibrating' | 'calibrated' | 'stale';
  lastFrameTime: number;
  droppedFrames: number;
  uptime: number;
}
