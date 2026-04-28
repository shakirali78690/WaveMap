import { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import type { House, Room, Wall } from '@/data/types';
import { ROOM_PALETTE } from '@/data/sampleHouse';
import { useSensing } from '@/stores/sensingStore';
import { cn } from '@/lib/cn';

interface HouseSceneProps { house: House; }

export function HouseScene({ house }: HouseSceneProps) {
  const floor = house.floors[0];
  const fadeWalls = useSensing((s) => s.fadeWalls);
  const showLabels = useSensing((s) => s.overlays.roomLabels);
  const selectedRoomId = useSensing((s) => s.selectedRoomId);
  const selectRoom = useSensing((s) => s.selectRoom);

  return (
    <group>
      {/* Base slab */}
      <mesh position={[floor.bounds.w / 2, -0.01, floor.bounds.h / 2]} receiveShadow>
        <boxGeometry args={[floor.bounds.w + 0.6, 0.02, floor.bounds.h + 0.6]} />
        <meshStandardMaterial color="#0A0D14" metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Room floors */}
      {floor.rooms.map((room) => (
        <RoomFloor
          key={room.id}
          room={room}
          selected={selectedRoomId === room.id}
          dimOthers={!!selectedRoomId && selectedRoomId !== room.id}
          onSelect={() => selectRoom(selectedRoomId === room.id ? undefined : room.id)}
        />
      ))}

      {/* Walls */}
      {floor.walls.map((wall) => (
        <WallSegment key={wall.id} wall={wall} ceiling={floor.rooms[0]?.height ?? 2.6} fade={fadeWalls} />
      ))}

      {/* Room labels */}
      {showLabels && floor.rooms.map((room) => (
        <RoomLabel
          key={room.id}
          room={room}
          selected={selectedRoomId === room.id}
          onClick={() => selectRoom(selectedRoomId === room.id ? undefined : room.id)}
        />
      ))}
    </group>
  );
}

// ----------------------------------------------------------------
// Room floor — extruded polygon, tinted by kind, subtle inner grid.
// ----------------------------------------------------------------

function RoomFloor({ room, selected, dimOthers, onSelect }: {
  room: Room;
  selected: boolean;
  dimOthers: boolean;
  onSelect: () => void;
}) {
  const palette = ROOM_PALETTE[room.kind];

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    room.polygon.forEach((p, i) => {
      if (i === 0) s.moveTo(p.x, p.y);
      else s.lineTo(p.x, p.y);
    });
    s.closePath();
    return s;
  }, [room.polygon]);

  const geometry = useMemo(() => new THREE.ShapeGeometry(shape), [shape]);
  // Outline via edges for a subtle hairline around the room.
  const edgesGeom = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  const color = new THREE.Color(palette.surface);
  const accent = new THREE.Color(palette.accent);

  const opacity = dimOthers ? 0.35 : 1;

  return (
    <group>
      {/* Base tinted floor */}
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.005, 0]}
        receiveShadow
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
      >
        <meshStandardMaterial
          color={color}
          metalness={0.05}
          roughness={0.95}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Selection halo */}
      {selected && (
        <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.009, 0]}>
          <meshBasicMaterial color={accent} transparent opacity={0.08} depthWrite={false} />
        </mesh>
      )}

      {/* Room outline */}
      <lineSegments geometry={edgesGeom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <lineBasicMaterial color={selected ? accent : '#2A3349'} transparent opacity={dimOthers ? 0.25 : selected ? 0.95 : 0.55} />
      </lineSegments>
    </group>
  );
}

// ----------------------------------------------------------------
// Wall — a solid box between two points, with cutaway fade.
// ----------------------------------------------------------------

function WallSegment({ wall, ceiling, fade }: { wall: Wall; ceiling: number; fade: boolean }) {
  const { a, b, thickness, kind } = wall;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len < 0.001) return null;
  const cx = (a.x + b.x) / 2;
  const cy = (a.y + b.y) / 2;
  const angle = Math.atan2(dy, dx);

  const wallHeight = kind === 'opening' ? 0.0 : ceiling;
  if (wallHeight === 0) return null;

  const isExterior = kind === 'exterior';
  const isDoor = kind === 'door';

  // Top alpha: walls fade toward the top to preserve interior visibility.
  const wallColor = isExterior ? '#1B2232' : isDoor ? '#2A2F40' : '#161C2A';
  const opacity = fade ? (isExterior ? 0.55 : 0.38) : 1;

  return (
    <group position={[cx, wallHeight / 2, cy]} rotation={[0, -angle, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[len, wallHeight, thickness]} />
        <meshStandardMaterial
          color={wallColor}
          metalness={0.1}
          roughness={0.92}
          transparent={fade}
          opacity={opacity}
          depthWrite={!fade}
        />
      </mesh>
      {/* Top capline */}
      <mesh position={[0, wallHeight / 2 - 0.001, 0]}>
        <boxGeometry args={[len, 0.012, thickness + 0.002]} />
        <meshBasicMaterial color={isExterior ? '#3C4762' : '#2A3348'} transparent opacity={0.85} />
      </mesh>
      {/* Door glow */}
      {isDoor && (
        <mesh position={[0, -wallHeight / 2 + 0.6, 0]}>
          <boxGeometry args={[len, 1.1, thickness + 0.005]} />
          <meshBasicMaterial color="#FFB547" transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  );
}

// ----------------------------------------------------------------
// Room label — HTML overlay pinned in 3D space.
// ----------------------------------------------------------------

function RoomLabel({ room, selected, onClick }: { room: Room; selected: boolean; onClick: () => void }) {
  const centroid = useMemo(() => {
    let cx = 0, cy = 0, a = 0;
    for (let i = 0; i < room.polygon.length; i++) {
      const p1 = room.polygon[i];
      const p2 = room.polygon[(i + 1) % room.polygon.length];
      const f = p1.x * p2.y - p2.x * p1.y;
      cx += (p1.x + p2.x) * f;
      cy += (p1.y + p2.y) * f;
      a += f;
    }
    a *= 0.5;
    if (Math.abs(a) < 1e-6) {
      const mx = room.polygon.reduce((s, p) => s + p.x, 0) / room.polygon.length;
      const my = room.polygon.reduce((s, p) => s + p.y, 0) / room.polygon.length;
      return { x: mx, y: my };
    }
    return { x: cx / (6 * a), y: cy / (6 * a) };
  }, [room.polygon]);

  const palette = ROOM_PALETTE[room.kind];

  return (
    <Html
      position={[centroid.x, 0.05, centroid.y]}
      center
      distanceFactor={10}
      zIndexRange={[10, 0]}
      transform={false}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className={cn(
          'group flex flex-col items-center select-none pointer-events-auto',
          'px-2 py-1 rounded-md border backdrop-blur-md transition-all duration-200',
          selected
            ? 'bg-ink-900/90 border-white/20 shadow-[0_0_0_1px_rgba(56,227,255,0.25),0_10px_30px_-10px_rgba(0,0,0,0.6)]'
            : 'bg-ink-900/60 border-white/[0.06] hover:bg-ink-850/80 hover:border-white/[0.12]'
        )}
        style={{ transform: 'translate(-50%, -50%)' }}
      >
        <span
          className="text-[10px] font-semibold tracking-[0.14em] uppercase"
          style={{ color: palette.accent }}
        >
          {palette.label}
        </span>
        <span className="text-[9px] text-frost-400 font-medium">{room.name}</span>
      </button>
    </Html>
  );
}
