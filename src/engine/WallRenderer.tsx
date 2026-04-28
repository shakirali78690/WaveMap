import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useHouseStore } from '../store/houseStore';
import { useUIStore } from '../store/uiStore';

function WallSegment({ wall }: { wall: { start: { x: number; y: number }; end: { x: number; y: number }; height: number; thickness: number; hasDoor: boolean; doorPosition?: number; doorWidth?: number } }) {
  const cutaway = useUIStore(s => s.wallCutaway);

  const segments = useMemo(() => {
    const dx = wall.end.x - wall.start.x;
    const dy = wall.end.y - wall.start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const h = cutaway ? wall.height * 0.4 : wall.height;

    if (wall.hasDoor && wall.doorPosition !== undefined && wall.doorWidth !== undefined) {
      const doorStart = wall.doorPosition - (wall.doorWidth / length) / 2;
      const doorEnd = wall.doorPosition + (wall.doorWidth / length) / 2;
      const segs: { pos: [number, number, number]; size: [number, number, number]; rot: number }[] = [];

      if (doorStart > 0.01) {
        const segLen = length * doorStart;
        const cx = wall.start.x + dx * doorStart / 2;
        const cz = wall.start.y + dy * doorStart / 2;
        segs.push({ pos: [cx, h / 2, cz], size: [segLen, h, wall.thickness], rot: angle });
      }
      if (doorEnd < 0.99) {
        const segLen = length * (1 - doorEnd);
        const cx = wall.start.x + dx * (doorEnd + (1 - doorEnd) / 2);
        const cz = wall.start.y + dy * (doorEnd + (1 - doorEnd) / 2);
        segs.push({ pos: [cx, h / 2, cz], size: [segLen, h, wall.thickness], rot: angle });
      }
      // Door lintel
      const lintelH = h * 0.15;
      const lintelLen = wall.doorWidth;
      const lcx = wall.start.x + dx * wall.doorPosition;
      const lcz = wall.start.y + dy * wall.doorPosition;
      segs.push({ pos: [lcx, h - lintelH / 2, lcz], size: [lintelLen, lintelH, wall.thickness], rot: angle });

      return segs;
    }

    const cx = (wall.start.x + wall.end.x) / 2;
    const cz = (wall.start.y + wall.end.y) / 2;
    return [{ pos: [cx, h / 2, cz] as [number, number, number], size: [length, h, wall.thickness] as [number, number, number], rot: angle }];
  }, [wall, cutaway]);

  return (
    <group>
      {segments.map((seg, i) => (
        <mesh key={i} position={seg.pos} rotation={[0, -seg.rot, 0]} castShadow receiveShadow>
          <boxGeometry args={seg.size} />
          <meshStandardMaterial
            color="#1a2030"
            roughness={0.85}
            metalness={0.05}
            transparent
            opacity={cutaway ? 0.4 : 0.75}
          />
        </mesh>
      ))}
      {/* Wall edge highlight */}
      {segments.map((seg, i) => (
        <mesh key={`edge-${i}`} position={[seg.pos[0], seg.size[1] + 0.005, seg.pos[2]]} rotation={[0, -seg.rot, 0]}>
          <boxGeometry args={[seg.size[0], 0.01, seg.size[2] + 0.01]} />
          <meshBasicMaterial color="#2a3548" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

export function WallRenderer() {
  const activeFloorId = useHouseStore(s => s.activeFloorId);
  const house = useHouseStore(s => s.house);
  const floor = house.floors.find(f => f.id === activeFloorId);

  if (!floor) return null;

  return (
    <group>
      {floor.walls.map(wall => (
        <WallSegment key={wall.id} wall={wall} />
      ))}
    </group>
  );
}
