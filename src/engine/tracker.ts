// ============================================================
// Tracker
//
// Consumes raw DetectionFrames and produces smoothed
// EntityTrack records. Responsible for:
//  - One-euro-style low-pass filtering on position
//  - Confidence band classification (high/medium/low/lost)
//  - Track lifetime tracking (firstSeen, lastSeen)
//  - Room-transition event generation
//  - Dwell time accumulation
//  - Bounded history buffer for trails and analytics
// ============================================================

import type {
  ConfidenceBand,
  DetectionFrame,
  EntityObservation,
  EntityTrack,
  OccupancyEvent,
  Vec3,
} from '../data/types';

const HISTORY_MAX = 120;             // ~8s @ 15Hz
const LOST_TIMEOUT_MS = 2500;        // drop track after this silence
const BAND_HYSTERESIS = 0.05;

export interface TrackerOptions {
  smoothing?: number;     // 0..1, higher = smoother
  thresholds?: { high: number; medium: number; low: number };
}

export interface TrackerEmit {
  tracks: EntityTrack[];
  events: OccupancyEvent[];
}

export class EntityTracker {
  private tracks = new Map<string, EntityTrack>();
  private previousRoom = new Map<string, string | undefined>();
  private smoothing: number;
  private thresholds: { high: number; medium: number; low: number };

  constructor(opts: TrackerOptions = {}) {
    this.smoothing = opts.smoothing ?? 0.7;
    this.thresholds = opts.thresholds ?? { high: 0.7, medium: 0.45, low: 0.2 };
  }

  setSmoothing(s: number) { this.smoothing = Math.max(0, Math.min(1, s)); }
  setThresholds(t: { high: number; medium: number; low: number }) { this.thresholds = t; }

  ingest(frame: DetectionFrame): TrackerEmit {
    const events: OccupancyEvent[] = [];
    const seenIds = new Set<string>();

    for (const obs of frame.entities) {
      seenIds.add(obs.id);
      const existing = this.tracks.get(obs.id);
      const smoothed = this.smoothObservation(existing, obs);
      const band = this.classifyBand(existing?.band, obs.confidence);

      const track: EntityTrack = existing
        ? {
            ...existing,
            lastSeen: frame.ts,
            latest: { ...obs, position: smoothed },
            roomId: obs.roomId,
            band,
            dwellMs:
              this.previousRoom.get(obs.id) === obs.roomId
                ? existing.dwellMs + (frame.ts - existing.lastSeen)
                : 0,
            history: pushBounded(existing.history, {
              ts: frame.ts,
              pos: smoothed,
              confidence: obs.confidence,
              roomId: obs.roomId,
            }, HISTORY_MAX),
          }
        : {
            id: obs.id,
            firstSeen: frame.ts,
            lastSeen: frame.ts,
            latest: { ...obs, position: smoothed },
            history: [{ ts: frame.ts, pos: smoothed, confidence: obs.confidence, roomId: obs.roomId }],
            roomId: obs.roomId,
            dwellMs: 0,
            band,
          };

      // Events: appear / room-change
      if (!existing) {
        events.push({
          id: `evt-${frame.ts}-${obs.id}-appear`,
          ts: frame.ts,
          kind: 'appeared',
          severity: 'info',
          message: `Entity ${obs.id} acquired`,
          trackId: obs.id,
          roomId: obs.roomId,
        });
      } else if (this.previousRoom.get(obs.id) !== obs.roomId && obs.roomId) {
        events.push({
          id: `evt-${frame.ts}-${obs.id}-enter`,
          ts: frame.ts,
          kind: 'room-enter',
          severity: 'info',
          message: `Entity ${obs.id} entered room`,
          trackId: obs.id,
          roomId: obs.roomId,
        });
      }
      // Band transitions
      if (existing && existing.band !== band) {
        if (band === 'lost') {
          events.push({
            id: `evt-${frame.ts}-${obs.id}-lost`,
            ts: frame.ts,
            kind: 'lost',
            severity: 'warn',
            message: `Tracking confidence collapsed for ${obs.id}`,
            trackId: obs.id,
          });
        } else if (existing.band === 'lost') {
          events.push({
            id: `evt-${frame.ts}-${obs.id}-reacq`,
            ts: frame.ts,
            kind: 'reacquired',
            severity: 'info',
            message: `Track reacquired for ${obs.id}`,
            trackId: obs.id,
          });
        }
      }
      this.previousRoom.set(obs.id, obs.roomId);
      this.tracks.set(obs.id, track);
    }

    // Mark unseen tracks as 'lost' after timeout, then drop.
    for (const [id, track] of this.tracks) {
      if (seenIds.has(id)) continue;
      const silence = frame.ts - track.lastSeen;
      if (silence > LOST_TIMEOUT_MS) {
        events.push({
          id: `evt-${frame.ts}-${id}-gone`,
          ts: frame.ts,
          kind: 'lost',
          severity: 'notice',
          message: `Track ${id} lost`,
          trackId: id,
        });
        this.tracks.delete(id);
        this.previousRoom.delete(id);
      } else if (track.band !== 'lost' && silence > 600) {
        this.tracks.set(id, { ...track, band: 'lost' });
      }
    }

    return { tracks: Array.from(this.tracks.values()), events };
  }

  snapshot(): EntityTrack[] {
    return Array.from(this.tracks.values());
  }

  reset() {
    this.tracks.clear();
    this.previousRoom.clear();
  }

  private smoothObservation(prev: EntityTrack | undefined, obs: EntityObservation): Vec3 {
    if (!prev || !prev.latest) return obs.position;
    const a = 1 - this.smoothing;
    return {
      x: prev.latest.position.x + a * (obs.position.x - prev.latest.position.x),
      y: prev.latest.position.y + a * (obs.position.y - prev.latest.position.y),
      z: prev.latest.position.z + a * (obs.position.z - prev.latest.position.z),
    };
  }

  private classifyBand(prev: ConfidenceBand | undefined, c: number): ConfidenceBand {
    const t = this.thresholds;
    const h = (edge: number) => (prev === 'high' ? edge - BAND_HYSTERESIS : edge);
    if (c >= h(t.high)) return 'high';
    if (c >= h(t.medium)) return 'medium';
    if (c >= h(t.low)) return 'low';
    return 'lost';
  }
}

function pushBounded<T>(arr: T[], item: T, max: number): T[] {
  const next = arr.length >= max ? arr.slice(arr.length - max + 1) : arr.slice();
  next.push(item);
  return next;
}
