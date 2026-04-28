import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { House } from '@/data/types';
import { Router, Anchor } from 'lucide-react';

export function SensorMarkers({ house }: { house: House }) {
  const floor = house.floors[0];
  const sensors = house.sensors.filter((s) => s.floorId === floor.id);

  return (
    <group>
      {sensors.map((s) => (
        <group key={s.id} position={[s.position.x, 0, s.position.z]}>
          {/* Pedestal pole */}
          <mesh position={[0, s.position.y / 2, 0]}>
            <cylinderGeometry args={[0.025, 0.025, s.position.y, 8]} />
            <meshStandardMaterial color="#2A3348" metalness={0.3} roughness={0.5} />
          </mesh>
          {/* Node */}
          <mesh position={[0, s.position.y, 0]}>
            <octahedronGeometry args={[0.14, 0]} />
            <meshStandardMaterial color="#38E3FF" emissive="#38E3FF" emissiveIntensity={0.8} metalness={0.4} roughness={0.3} />
          </mesh>
          {/* Pulse */}
          <PulseRing y={s.position.y} />
          {/* Label */}
          <Html position={[0, s.position.y + 0.55, 0]} center distanceFactor={10}>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-white/[0.1] bg-ink-900/80 backdrop-blur-md shadow-[0_4px_12px_-4px_rgba(0,0,0,0.6)]">
              {s.kind === 'router' ? (
                <Router className="w-2.5 h-2.5 text-accent-cyan" />
              ) : (
                <Anchor className="w-2.5 h-2.5 text-accent-cyan" />
              )}
              <span className="text-[8.5px] font-medium tracking-wide text-frost-100 whitespace-nowrap">{s.label}</span>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function PulseRing({ y }: { y: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() % 2.2) / 2.2;
    ref.current.scale.set(1 + t * 4, 1 + t * 4, 1);
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.45 * (1 - t);
  });
  return (
    <mesh ref={ref} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.2, 0.24, 32]} />
      <meshBasicMaterial color="#38E3FF" transparent opacity={0.45} depthWrite={false} />
    </mesh>
  );
}
