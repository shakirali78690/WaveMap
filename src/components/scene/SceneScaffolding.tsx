import type { Floor } from '@/data/types';

/**
 * Decorative underlay — a dark slab beneath the floor plus
 * a thin glowing perimeter that reinforces the house footprint.
 */
export function SceneScaffolding({ floor }: { floor: Floor }) {
  const w = floor.bounds.w;
  const h = floor.bounds.h;

  return (
    <group>
      {/* Wide deck */}
      <mesh position={[w / 2, -0.12, h / 2]} receiveShadow>
        <boxGeometry args={[w + 10, 0.2, h + 10]} />
        <meshStandardMaterial color="#07090E" metalness={0.3} roughness={0.95} />
      </mesh>

      {/* Glow ring at perimeter */}
      <mesh position={[w / 2, 0.002, h / 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[Math.hypot(w, h) / 2 - 0.05, Math.hypot(w, h) / 2, 64]} />
        <meshBasicMaterial color="#1FA4BB" transparent opacity={0.15} depthWrite={false} />
      </mesh>

      {/* Corner ticks */}
      {[
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ].map(([x, z], i) => (
        <group key={i} position={[x, 0.01, z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.18, 0.2, 32]} />
            <meshBasicMaterial color="#38E3FF" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
