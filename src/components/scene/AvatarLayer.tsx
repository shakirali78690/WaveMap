import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import type { AvatarState, ConfidenceBand, JointId } from '@/data/types';
import { useSensing } from '@/stores/sensingStore';

// ----------------------------------------------------------------
// Confidence palette
// ----------------------------------------------------------------

const BAND_COLOR: Record<ConfidenceBand, THREE.Color> = {
  high:   new THREE.Color('#32D8A0'),
  medium: new THREE.Color('#FFB547'),
  low:    new THREE.Color('#FF5D7A'),
  lost:   new THREE.Color('#6F84A6'),
};

// Skeleton bone connections.
const BONES: Array<[JointId, JointId]> = [
  ['head', 'neck'], ['neck', 'spine'], ['spine', 'pelvis'],
  ['neck', 'shoulderL'], ['shoulderL', 'elbowL'], ['elbowL', 'wristL'],
  ['neck', 'shoulderR'], ['shoulderR', 'elbowR'], ['elbowR', 'wristR'],
  ['pelvis', 'hipL'], ['hipL', 'kneeL'], ['kneeL', 'ankleL'],
  ['pelvis', 'hipR'], ['hipR', 'kneeR'], ['kneeR', 'ankleR'],
];

export function AvatarLayer() {
  const avatars = useSensing((s) => s.avatars);
  const selectedId = useSensing((s) => s.selectedTrackId);
  const selectTrack = useSensing((s) => s.selectTrack);
  const showUncertainty = useSensing((s) => s.overlays.uncertainty);

  return (
    <group>
      {avatars.map((a) => (
        <Avatar
          key={a.trackId}
          state={a}
          selected={selectedId === a.trackId}
          showUncertainty={showUncertainty}
          onSelect={() => selectTrack(selectedId === a.trackId ? undefined : a.trackId)}
        />
      ))}
    </group>
  );
}

// ----------------------------------------------------------------
// Smoothed avatar — interpolates target position each frame to
// prevent jitter under noisy input.
// ----------------------------------------------------------------

interface AvatarProps {
  state: AvatarState;
  selected: boolean;
  showUncertainty: boolean;
  onSelect: () => void;
}

function Avatar({ state, selected, showUncertainty, onSelect }: AvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  // Memoize the initial position so React doesn't overwrite our lerped position on every render
  const initialPos = useMemo(() => new THREE.Vector3(state.position.x, 0, state.position.z), []);
  const initialYaw = useMemo(() => -state.heading, []);

  const targetPos = useRef(new THREE.Vector3(state.position.x, 0, state.position.z));
  const targetYaw = useRef(-state.heading);

  useFrame((_, dt) => {
    if (!groupRef.current) return;
    targetPos.current.set(state.position.x, 0, state.position.z);
    targetYaw.current = -state.heading;
    const g = groupRef.current;
    g.position.lerp(targetPos.current, Math.min(1, dt * 8));
    
    // Shortest path angle interpolation to prevent 360-degree spins
    let diff = targetYaw.current - g.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    g.rotation.y += diff * Math.min(1, dt * 6);
  });

  const color = BAND_COLOR[state.band];

  return (
    <group ref={groupRef} position={initialPos} rotation={[0, initialYaw, 0]} onClick={(e) => { e.stopPropagation(); onSelect(); }}>
      {/* Ground disc */}
      <GroundDisc color={color} selected={selected} />

      {/* Uncertainty cloud */}
      {showUncertainty && state.band !== 'high' && (
        <UncertaintyHalo radius={0.3 + (1 - state.confidence) * 0.7} color={color} />
      )}

      {/* Render style */}
      {state.style === 'articulated' && state.pose && (
        <ArticulatedAvatar pose={state.pose} color={color} confidence={state.confidence} />
      )}
      {state.style === 'skeleton' && state.pose && (
        <SkeletonAvatar pose={state.pose} color={color} />
      )}
      {state.style === 'capsule' && (
        <CapsuleAvatar color={color} confidence={state.confidence} />
      )}
      {state.style === 'ghost' && (
        <GhostAvatar color={color} confidence={state.confidence} />
      )}
      {state.style === 'afterimage' && (
        <AfterimageAvatar color={color} />
      )}

      {/* Direction vector for moving entities */}
      {(state.state === 'walking' || state.state === 'turning') && (
        <DirectionArrow color={color} />
      )}

      {/* Selection ring */}
      {selected && <SelectionRing color={color} />}
    </group>
  );
}

// ----------------------------------------------------------------
// Sub-render: ground disc (position marker, always visible)
// ----------------------------------------------------------------

function GroundDisc({ color, selected }: { color: THREE.Color; selected: boolean }) {
  return (
    <group position={[0, 0.02, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.32, 32]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 0.9 : 0.6} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.08, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function SelectionRing({ color }: { color: THREE.Color }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.z += dt * 0.6;
  });
  return (
    <mesh ref={ref} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.46, 0.5, 48, 1, 0, Math.PI * 1.5]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} />
    </mesh>
  );
}

function UncertaintyHalo({ radius, color }: { radius: number; color: THREE.Color }) {
  return (
    <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={0.08} />
    </mesh>
  );
}

function DirectionArrow({ color }: { color: THREE.Color }) {
  return (
    <group position={[0.6, 0.04, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <coneGeometry args={[0.12, 0.3, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------
// Style A: Articulated avatar — torso volume + skeleton + head sphere.
// ----------------------------------------------------------------

function ArticulatedAvatar({ pose, color, confidence }: { pose: import('@/data/types').PoseEstimate; color: THREE.Color; confidence: number }) {
  const j = pose.joints;
  const lines = useMemo(() => {
    const out: Array<[[number, number, number], [number, number, number], number]> = [];
    for (const [a, b] of BONES) {
      const pa = j[a], pb = j[b];
      if (!pa || !pb) continue;
      const jc = Math.min(pose.jointConfidence[a] ?? 1, pose.jointConfidence[b] ?? 1);
      out.push([[pa.x, pa.y, pa.z], [pb.x, pb.y, pb.z], jc]);
    }
    return out;
  }, [j, pose.jointConfidence]);

  const pelvis = j.pelvis ?? { x: 0, y: 0.9, z: 0 };
  const neck = j.neck ?? { x: 0, y: 1.55, z: 0 };
  const torsoY = (pelvis.y + neck.y) / 2;
  const torsoH = Math.max(0.3, neck.y - pelvis.y);

  return (
    <group>
      {/* Bones */}
      {lines.map(([a, b, jc], i) => (
        <Line
          key={i}
          points={[a, b]}
          color={color}
          lineWidth={2.0}
          transparent
          opacity={0.55 + jc * 0.35}
        />
      ))}

      {/* Torso volume — thin rounded box centered pelvis→neck */}
      <mesh position={[pelvis.x, torsoY, pelvis.z]}>
        <capsuleGeometry args={[0.12, torsoH * 0.6, 4, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.35}
          transparent
          opacity={0.25 + confidence * 0.15}
          metalness={0.1}
          roughness={0.3}
        />
      </mesh>

      {/* Head sphere */}
      {j.head && (
        <mesh position={[j.head.x, j.head.y, j.head.z]}>
          <sphereGeometry args={[0.1, 24, 18]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.5}
            transparent
            opacity={0.7}
            metalness={0.2}
            roughness={0.2}
          />
        </mesh>
      )}

      {/* Joint dots */}
      {(Object.keys(j) as JointId[]).map((id) => {
        const p = j[id];
        if (!p) return null;
        const jc = pose.jointConfidence[id] ?? 1;
        return (
          <mesh key={id} position={[p.x, p.y, p.z]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.6 + jc * 0.4} />
          </mesh>
        );
      })}
    </group>
  );
}

// ----------------------------------------------------------------
// Style B: Skeleton only — bones + head, no torso volume.
// ----------------------------------------------------------------

function SkeletonAvatar({ pose, color }: { pose: import('@/data/types').PoseEstimate; color: THREE.Color }) {
  const j = pose.joints;
  return (
    <group>
      {BONES.map(([a, b], i) => {
        const pa = j[a], pb = j[b];
        if (!pa || !pb) return null;
        return (
          <Line
            key={i}
            points={[[pa.x, pa.y, pa.z], [pb.x, pb.y, pb.z]]}
            color={color}
            lineWidth={1.5}
            transparent
            opacity={0.55}
          />
        );
      })}
      {j.head && (
        <mesh position={[j.head.x, j.head.y, j.head.z]}>
          <sphereGeometry args={[0.08, 16, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

// ----------------------------------------------------------------
// Style C: Capsule — body volume without articulation.
// ----------------------------------------------------------------

function CapsuleAvatar({ color, confidence }: { color: THREE.Color; confidence: number }) {
  return (
    <group>
      <mesh position={[0, 0.85, 0]}>
        <capsuleGeometry args={[0.2, 1.1, 6, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          transparent
          opacity={0.3 + confidence * 0.3}
          metalness={0.15}
          roughness={0.4}
        />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <sphereGeometry args={[0.13, 24, 18]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          transparent
          opacity={0.6}
          metalness={0.2}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// ----------------------------------------------------------------
// Style D: Ghost — low-confidence silhouette.
// ----------------------------------------------------------------

function GhostAvatar({ color, confidence }: { color: THREE.Color; confidence: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const s = 1 + Math.sin(t * 1.2) * 0.04;
    ref.current.scale.set(s, 1 + Math.sin(t * 1.1) * 0.02, s);
  });
  return (
    <Billboard position={[0, 0.85, 0]}>
      <mesh ref={ref}>
        <planeGeometry args={[0.7, 1.7]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={Math.max(0.18, 0.25 + confidence * 0.2)}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </Billboard>
  );
}

// ----------------------------------------------------------------
// Style E: Afterimage — lost-tracking fading trace.
// ----------------------------------------------------------------

function AfterimageAvatar({ color }: { color: THREE.Color }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(t * 2) * 0.05;
  });
  return (
    <Billboard position={[0, 0.85, 0]}>
      <mesh ref={ref}>
        <planeGeometry args={[0.6, 1.5]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </Billboard>
  );
}
