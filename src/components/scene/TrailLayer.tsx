import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { ConfidenceBand } from '@/data/types';
import { useSensing } from '@/stores/sensingStore';

const BAND_HEX: Record<ConfidenceBand, string> = {
  high: '#32D8A0',
  medium: '#FFB547',
  low: '#FF5D7A',
  lost: '#6F84A6',
};

export function TrailLayer() {
  const avatars = useSensing((s) => s.avatars);

  return (
    <group>
      {avatars.map((a) => {
        if (a.tail.length < 2) return null;
        const points = a.tail.map((t) => new THREE.Vector3(t.pos.x, 0.05, t.pos.z));
        const colors = a.tail.map((t) => {
          const c = new THREE.Color(BAND_HEX[a.band]);
          return c.multiplyScalar(0.3 + t.alpha * 0.9);
        });
        return (
          <Line
            key={a.trackId}
            points={points}
            vertexColors={colors as any}
            lineWidth={1.8}
            transparent
            opacity={0.85}
          />
        );
      })}
    </group>
  );
}
