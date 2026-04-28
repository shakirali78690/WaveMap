import type { Floor } from '@/data/types';

/**
 * Subtle technical grid under the house. 1m major lines,
 * 0.25m minor lines. Kept intentionally low-contrast.
 */
export function GridFloor({ floor }: { floor: Floor }) {
  const w = floor.bounds.w + 2;
  const h = floor.bounds.h + 2;

  return (
    <group position={[floor.bounds.w / 2, 0, floor.bounds.h / 2]}>
      {/* Major grid */}
      <gridHelper
        args={[Math.max(w, h), Math.max(w, h), '#1A2236', '#121726']}
        position={[0, -0.002, 0]}
      />
    </group>
  );
}
