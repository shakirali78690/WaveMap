// ============================================================
// AvatarDerive
//
// Pure function: EntityTrack -> AvatarState.
// Chooses the most appropriate render style based on
// confidence band and pose availability, and produces a
// decayed tail for trail rendering.
// ============================================================

import type { AvatarState, EntityTrack } from '../data/types';

export function deriveAvatarState(track: EntityTrack, trailSeconds: number): AvatarState {
  const latest = track.latest;
  const now = track.lastSeen;
  const tailMs = trailSeconds * 1000;

  const tail = track.history
    .filter((h) => now - h.ts <= tailMs)
    .map((h) => ({
      pos: h.pos,
      alpha: Math.max(0, 1 - (now - h.ts) / tailMs),
    }));

  const hasPose = !!latest?.pose;
  let style: AvatarState['style'] = 'capsule';
  if (track.band === 'lost') style = 'afterimage';
  else if (track.band === 'low') style = 'ghost';
  else if (track.band === 'medium') style = hasPose ? 'skeleton' : 'capsule';
  else if (track.band === 'high') style = hasPose ? 'articulated' : 'skeleton';

  return {
    trackId: track.id,
    position: latest?.position ?? { x: 0, y: 0, z: 0 },
    heading: latest?.heading ?? 0,
    confidence: latest?.confidence ?? 0,
    band: track.band,
    style,
    pose: latest?.pose,
    state: latest?.pose?.state ?? 'uncertain',
    roomId: track.roomId,
    tail,
  };
}
