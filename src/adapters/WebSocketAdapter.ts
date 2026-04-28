import { DataAdapter } from '../types/adapters';
import { ConnectionState, DetectionFrame, SystemHealth } from '../types/sensing';
import { OccupancyEvent } from '../types/events';

export class WebSocketAdapter implements DataAdapter {
  readonly type = 'websocket' as const;
  private _status: ConnectionState = 'disconnected';
  private ws: WebSocket | null = null;
  private frameCallbacks: ((frame: DetectionFrame) => void)[] = [];
  private eventCallbacks: ((event: OccupancyEvent) => void)[] = [];
  private healthCallbacks: ((health: Partial<SystemHealth>) => void)[] = [];
  private url: string;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnects = 10;

  constructor(url: string = 'ws://localhost:8765') {
    this.url = url;
  }

  get status() { return this._status; }

  async connect(): Promise<void> {
    this._status = 'connecting';
    this.healthCallbacks.forEach(cb => cb({ connectionState: 'connecting', adapterType: 'websocket' }));

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
          this._status = 'connected';
          this.reconnectAttempts = 0;
          this.healthCallbacks.forEach(cb => cb({ connectionState: 'connected' }));
          resolve();
        };
        this.ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.type === 'frame') this.frameCallbacks.forEach(cb => cb(data.payload));
            else if (data.type === 'event') this.eventCallbacks.forEach(cb => cb(data.payload));
            else if (data.type === 'health') this.healthCallbacks.forEach(cb => cb(data.payload));
          } catch { /* malformed message */ }
        };
        this.ws.onclose = () => { this.handleDisconnect(); };
        this.ws.onerror = () => { this._status = 'error'; reject(new Error('WebSocket connection failed')); };
      } catch (e) { reject(e); }
    });
  }

  private handleDisconnect() {
    this._status = 'reconnecting';
    this.healthCallbacks.forEach(cb => cb({ connectionState: 'reconnecting' }));
    if (this.reconnectAttempts < this.maxReconnects) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    } else {
      this._status = 'error';
      this.healthCallbacks.forEach(cb => cb({ connectionState: 'error' }));
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) { this.ws.close(); this.ws = null; }
    this._status = 'disconnected';
    this.healthCallbacks.forEach(cb => cb({ connectionState: 'disconnected' }));
  }

  onFrame(callback: (frame: DetectionFrame) => void): void { this.frameCallbacks.push(callback); }
  onEvent(callback: (event: OccupancyEvent) => void): void { this.eventCallbacks.push(callback); }
  onHealthUpdate(callback: (health: Partial<SystemHealth>) => void): void { this.healthCallbacks.push(callback); }
}
