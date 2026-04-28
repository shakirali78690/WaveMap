import { DataAdapter } from '../types/adapters';
import { SimulationAdapter } from './SimulationAdapter';
import { WebSocketAdapter } from './WebSocketAdapter';

export type AdapterType = 'simulation' | 'websocket';

let currentAdapter: DataAdapter | null = null;

export function createAdapter(type: AdapterType, config?: { wsUrl?: string }): DataAdapter {
  if (currentAdapter) currentAdapter.disconnect();
  
  switch (type) {
    case 'websocket':
      currentAdapter = new WebSocketAdapter(config?.wsUrl);
      break;
    case 'simulation':
    default:
      currentAdapter = new SimulationAdapter();
      break;
  }
  return currentAdapter;
}

export function getAdapter(): DataAdapter | null { return currentAdapter; }
export function disconnectAdapter(): void {
  if (currentAdapter) { currentAdapter.disconnect(); currentAdapter = null; }
}
