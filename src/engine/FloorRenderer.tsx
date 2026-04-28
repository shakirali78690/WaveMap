import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useHouseStore } from '../store/houseStore';
import { ROOM_COLORS, RoomType } from '../types/house';

function RoomMesh({ room }: { room: { id: string; type: RoomType; polygon: { x: number; y: number }[]; center: { x: number; y: number } } }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedRoomId = useHouseStore(s => s.selectedRoomId);
  const hoveredRoomId = useHouseStore(s => s.hoveredRoomId);
  const selectRoom = useHouseStore(s => s.selectRoom);
  const hoverRoom = useHouseStore(s => s.hoverRoom);

  const isSelected = selectedRoomId === room.id;
  const isHovered = hoveredRoomId === room.id;

  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const pts = room.polygon;
    s.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i].x, pts[i].y);
    s.closePath();
    return s;
  }, [room.polygon]);

  const roomColor = ROOM_COLORS[room.type] || ROOM_COLORS.other;

  // Animate opacity for hover/select
  useFrame(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    const targetOpacity = isSelected ? 0.35 : isHovered ? 0.2 : 0.1;
    mat.opacity += (targetOpacity - mat.opacity) * 0.15;
    const targetEmissive = isSelected ? 0.15 : isHovered ? 0.08 : 0;
    mat.emissiveIntensity += (targetEmissive - mat.emissiveIntensity) * 0.15;
  });

  return (
    <group>
      {/* Room floor surface */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
        onClick={(e) => { e.stopPropagation(); selectRoom(room.id); }}
        onPointerOver={(e) => { e.stopPropagation(); hoverRoom(room.id); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { hoverRoom(null); document.body.style.cursor = 'default'; }}
      >
        <shapeGeometry args={[shape]} />
        <meshStandardMaterial
          color={roomColor.hex}
          transparent
          opacity={0.1}
          roughness={0.8}
          emissive={roomColor.hex}
          emissiveIntensity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Room border line */}
      <RoomBorder polygon={room.polygon} color={roomColor.hex} isSelected={isSelected} isHovered={isHovered} />
    </group>
  );
}

function RoomBorder({ polygon, color, isSelected, isHovered }: {
  polygon: { x: number; y: number }[];
  color: number;
  isSelected: boolean;
  isHovered: boolean;
}) {
  const lineRef = useRef<THREE.LineLoop>(null);

  const points = useMemo(() => {
    return polygon.map(p => new THREE.Vector3(p.x, 0.02, p.y));
  }, [polygon]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints([...points, points[0]]);
    return geo;
  }, [points]);

  useFrame(() => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    const targetOpacity = isSelected ? 0.9 : isHovered ? 0.6 : 0.3;
    mat.opacity += (targetOpacity - mat.opacity) * 0.15;
  });

  return (
    <lineLoop ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.3} linewidth={1} />
    </lineLoop>
  );
}

export function FloorRenderer() {
  const activeFloorId = useHouseStore(s => s.activeFloorId);
  const house = useHouseStore(s => s.house);

  const floor = house.floors.find(f => f.id === activeFloorId);
  if (!floor) return null;

  return (
    <group>
      {floor.rooms.map(room => (
        <RoomMesh key={room.id} room={room} />
      ))}
    </group>
  );
}
