import { DetectionFrame } from './sensing';
import { OccupancyEvent } from './events';
import { SystemHealth, ConnectionState } from './sensing';

export interface DataAdapter {
  readonly type: 'simulation' | 'websocket' | 'playback';
  readonly status: ConnectionState;
  connect(): Promise<void>;
  disconnect(): void;
  onFrame(callback: (frame: DetectionFrame) => void): void;
  onEvent(callback: (event: OccupancyEvent) => void): void;
  onHealthUpdate(callback: (health: Partial<SystemHealth>) => void): void;
  setFrameRate?(fps: number): void;
}
