import { create } from 'zustand';
import { EntityTrack, RenderMode, AnimationState } from '../types/entity';
import { Vec3 } from '../types/house';

interface EntityState {
  entities: Map<string, EntityTrack>;
  selectedEntityId: string | null;
  updateEntities: (tracks: EntityTrack[]) => void;
  selectEntity: (id: string | null) => void;
  getEntity: (id: string) => EntityTrack | undefined;
  getEntitiesArray: () => EntityTrack[];
  getEntitiesInRoom: (roomId: string) => EntityTrack[];
  clear: () => void;
}

function getRenderMode(confidence: number): RenderMode {
  if (confidence > 0.8) return RenderMode.Full;
  if (confidence > 0.5) return RenderMode.Reduced;
  if (confidence > 0.2) return RenderMode.Capsule;
  if (confidence > 0.05) return RenderMode.Ghost;
  return RenderMode.FadingTrail;
}

function smoothPosition(current: Vec3, target: Vec3, alpha: number): Vec3 {
  return {
    x: current.x + (target.x - current.x) * alpha,
    y: current.y + (target.y - current.y) * alpha,
    z: current.z + (target.z - current.z) * alpha,
  };
}

export const useEntityStore = create<EntityState>((set, get) => ({
  entities: new Map(),
  selectedEntityId: null,

  updateEntities: (tracks) => {
    set((state) => {
      const newMap = new Map(state.entities);
      const now = Date.now();
      const seenIds = new Set<string>();

      for (const track of tracks) {
        seenIds.add(track.id);
        const existing = newMap.get(track.id);
        if (existing) {
          const smoothed = smoothPosition(existing.position, track.position, 0.3);
          newMap.set(track.id, {
            ...track,
            prevPosition: existing.position,
            position: smoothed,
            renderMode: getRenderMode(track.confidence),
            history: [...existing.history.slice(-99), smoothed],
            historyTimestamps: [...existing.historyTimestamps.slice(-99), now],
            isStale: false,
          });
        } else {
          newMap.set(track.id, {
            ...track,
            renderMode: getRenderMode(track.confidence),
            isStale: false,
          });
        }
      }

      // Mark unseen entities as stale
      for (const [id, entity] of newMap) {
        if (!seenIds.has(id)) {
          if (now - entity.lastSeen > 5000) {
            newMap.delete(id);
          } else {
            newMap.set(id, {
              ...entity,
              isStale: true,
              confidence: Math.max(0, entity.confidence - 0.02),
              renderMode: getRenderMode(Math.max(0, entity.confidence - 0.02)),
              animationState: AnimationState.Occluded,
            });
          }
        }
      }

      return { entities: newMap };
    });
  },

  selectEntity: (id) => set({ selectedEntityId: id }),
  getEntity: (id) => get().entities.get(id),
  getEntitiesArray: () => Array.from(get().entities.values()),
  getEntitiesInRoom: (roomId) => Array.from(get().entities.values()).filter(e => e.currentRoom === roomId),
  clear: () => set({ entities: new Map(), selectedEntityId: null }),
}));
