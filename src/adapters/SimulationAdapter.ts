import { DataAdapter } from '../types/adapters';
import { ConnectionState, DetectionFrame, SystemHealth } from '../types/sensing';
import { OccupancyEvent } from '../types/events';
import { createDemoScenarios } from '../data/demoScenarios';

export class SimulationAdapter implements DataAdapter {
  readonly type = 'simulation' as const;
  private _status: ConnectionState = 'disconnected';
  private frameCallbacks: ((frame: DetectionFrame) => void)[] = [];
  private eventCallbacks: ((event: OccupancyEvent) => void)[] = [];
  private healthCallbacks: ((health: Partial<SystemHealth>) => void)[] = [];
  private interval: ReturnType<typeof setInterval> | null = null;
  private scenario = createDemoScenarios();
  private fps = 20;
  private startTime = 0;
  private lastRoomMap = new Map<string, string | null>();

  get status() { return this._status; }

  async connect(): Promise<void> {
    this._status = 'connecting';
    this.healthCallbacks.forEach(cb => cb({ connectionState: 'connecting', adapterType: 'simulation' }));
    
    await new Promise(r => setTimeout(r, 800));
    
    this._status = 'connected';
    this.startTime = Date.now();
    this.healthCallbacks.forEach(cb => cb({ connectionState: 'connected', adapterType: 'simulation' }));

    this.interval = setInterval(() => {
      const delta = 1 / this.fps;
      const entities = this.scenario.tick(delta);
      const now = Date.now();

      const frame: DetectionFrame = {
        timestamp: now,
        frameId: this.scenario.getFrameId(),
        entities,
        signalQuality: 0.7 + Math.random() * 0.25,
        sensorHealth: { 'router-main': 0.85 + Math.random() * 0.15 },
      };

      this.frameCallbacks.forEach(cb => cb(frame));

      // Generate room transition events
      for (const ent of entities) {
        const prevRoom = this.lastRoomMap.get(ent.id);
        if (prevRoom !== ent.currentRoom) {
          if (prevRoom) {
            this.eventCallbacks.forEach(cb => cb({
              id: `evt-${now}-exit-${ent.id}`,
              timestamp: now, type: 'room_exit', severity: 'info',
              entityId: ent.id, roomId: prevRoom, confidence: ent.confidence,
              message: `${ent.label} left ${prevRoom}`, details: {},
            }));
          }
          if (ent.currentRoom) {
            this.eventCallbacks.forEach(cb => cb({
              id: `evt-${now}-enter-${ent.id}`,
              timestamp: now, type: 'room_enter', severity: 'info',
              entityId: ent.id, roomId: ent.currentRoom, confidence: ent.confidence,
              message: `${ent.label} entered ${ent.currentRoom}`, details: {},
            }));
          }
          this.lastRoomMap.set(ent.id, ent.currentRoom);
        }
      }

      // Periodic health updates
      this.healthCallbacks.forEach(cb => cb({
        fps: this.fps,
        packetRate: this.fps,
        latency: 5 + Math.random() * 15,
        trackedCount: entities.length,
        signalQualityIndex: frame.signalQuality,
        uptime: (now - this.startTime) / 1000,
        lastFrameTime: now,
        droppedFrames: 0,
      }));
    }, 1000 / this.fps);
  }

  disconnect(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
    this._status = 'disconnected';
    this.healthCallbacks.forEach(cb => cb({ connectionState: 'disconnected' }));
  }

  onFrame(callback: (frame: DetectionFrame) => void): void {
    this.frameCallbacks.push(callback);
  }

  onEvent(callback: (event: OccupancyEvent) => void): void {
    this.eventCallbacks.push(callback);
  }

  onHealthUpdate(callback: (health: Partial<SystemHealth>) => void): void {
    this.healthCallbacks.push(callback);
  }

  setFrameRate(fps: number): void {
    this.fps = fps;
    if (this.interval) {
      this.disconnect();
      this.connect();
    }
  }
}
