// ============================================================
// WebSocket adapter
//
// Drop-in adapter for a real backend. Assumes the backend
// emits JSON-encoded DetectionFrame objects on a websocket.
// Replace the protocol decode if your backend differs.
// ============================================================

import type {
  AdapterCapabilities,
  AdapterConnectOptions,
  DataSourceAdapter,
  DetectionFrame,
  OccupancyEvent,
  SystemHealth,
} from '../types';

export interface WebSocketAdapterOptions {
  url: string;
  /** Optional auth token appended to query string. */
  token?: string;
  /** Reconnect backoff in milliseconds (capped). */
  reconnectMs?: number;
}

export class WebSocketAdapter implements DataSourceAdapter {
  id = 'websocket';
  label = 'WebSocket Stream';
  capabilities: AdapterCapabilities = {
    supportsLive: true,
    supportsPlayback: false,
    supportsPose: true,
    supportsSignalField: true,
    nominalRate: 15,
  };

  private ws: WebSocket | null = null;
  private opts: WebSocketAdapterOptions;
  private closed = false;
  private attempts = 0;

  constructor(opts: WebSocketAdapterOptions) {
    this.opts = opts;
  }

  async connect(args: AdapterConnectOptions): Promise<() => void> {
    const open = () => {
      const url = new URL(this.opts.url);
      if (this.opts.token) url.searchParams.set('token', this.opts.token);
      this.ws = new WebSocket(url.toString());

      const health: Partial<SystemHealth> = { streamState: 'connecting', adapter: this.id };
      args.onHealth(health);

      this.ws.onopen = () => {
        this.attempts = 0;
        args.onHealth({ streamState: 'open', adapterReady: true });
      };

      this.ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === 'frame') {
            args.onFrame(msg.data as DetectionFrame);
          } else if (msg.type === 'event') {
            args.onEvent?.(msg.data as OccupancyEvent);
          } else if (msg.type === 'health') {
            args.onHealth(msg.data as Partial<SystemHealth>);
          }
        } catch {
          // Malformed payloads are silently dropped; upstream stays live.
        }
      };

      this.ws.onerror = () => args.onHealth({ streamState: 'error' });

      this.ws.onclose = () => {
        args.onHealth({ streamState: 'closed', adapterReady: false });
        if (this.closed) return;
        const delay = Math.min(15000, 500 * Math.pow(1.8, this.attempts++));
        setTimeout(open, delay);
      };
    };

    open();
    args.signal?.addEventListener('abort', () => this.close());

    return () => this.close();
  }

  async command(cmd: import('../types').AdapterCommand): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'command', data: cmd }));
    }
  }

  private close() {
    this.closed = true;
    try { this.ws?.close(); } catch { /* ignore */ }
  }
}
