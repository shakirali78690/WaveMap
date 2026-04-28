import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { House } from '@/data/types';
import { useSensing } from '@/stores/sensingStore';

const GRID_W = 48;
const GRID_H = 32;
const DECAY = 0.985;

/**
 * Accumulated motion heatmap — rasterizes avatar positions into
 * a grid, applies exponential decay, and renders on the floor.
 */
export function HeatmapLayer({ house }: { house: House }) {
  const floor = house.floors[0];
  const avatars = useSensing((s) => s.avatars);
  const bufferRef = useRef<Float32Array>(new Float32Array(GRID_W * GRID_H));
  const textureRef = useRef<THREE.DataTexture | null>(null);

  const texture = useMemo(() => {
    const tex = new THREE.DataTexture(
      new Uint8Array(GRID_W * GRID_H * 4),
      GRID_W,
      GRID_H,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    textureRef.current = tex;
    return tex;
  }, []);

  useEffect(() => {
    const buf = bufferRef.current;
    // Decay
    for (let i = 0; i < buf.length; i++) buf[i] = Math.max(0, buf[i] * DECAY);
    // Splat avatars
    for (const a of avatars) {
      if (a.band === 'lost') continue;
      const gx = Math.floor((a.position.x / floor.bounds.w) * GRID_W);
      const gy = Math.floor((a.position.z / floor.bounds.h) * GRID_H);
      const splatR = 2;
      for (let dy = -splatR; dy <= splatR; dy++) {
        for (let dx = -splatR; dx <= splatR; dx++) {
          const x = gx + dx, y = gy + dy;
          if (x < 0 || y < 0 || x >= GRID_W || y >= GRID_H) continue;
          const d = Math.sqrt(dx * dx + dy * dy);
          const v = Math.max(0, 1 - d / splatR) * 0.25 * a.confidence;
          buf[y * GRID_W + x] = Math.min(1, buf[y * GRID_W + x] + v);
        }
      }
    }
    // Convert to color + push to texture
    const tex = textureRef.current;
    if (!tex) return;
    const data = tex.image.data as Uint8Array;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i];
      const r = Math.min(255, Math.floor(v * 340));
      const g = Math.min(255, Math.floor(v * 240));
      const b = Math.min(255, Math.floor(50 + v * 40));
      const a = Math.floor(Math.min(255, v * 210));
      const o = i * 4;
      data[o + 0] = r;
      data[o + 1] = g;
      data[o + 2] = b;
      data[o + 3] = a;
    }
    tex.needsUpdate = true;
  }, [avatars, floor.bounds.w, floor.bounds.h]);

  return (
    <mesh
      position={[floor.bounds.w / 2, 0.015, floor.bounds.h / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[floor.bounds.w, floor.bounds.h]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}
