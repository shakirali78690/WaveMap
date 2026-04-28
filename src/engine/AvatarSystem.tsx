import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEntityStore } from '../store/entityStore';
import { EntityTrack, RenderMode, SKELETON_BONES } from '../types/entity';

function confidenceColor(c: number): THREE.Color {
  if (c > 0.8) return new THREE.Color(0x34d399);
  if (c > 0.5) return new THREE.Color(0xfbbf24);
  if (c > 0.2) return new THREE.Color(0xf87171);
  return new THREE.Color(0x5a6178);
}

/** Full skeletal rig for high confidence */
function SkeletalAvatar({ entity }: { entity: EntityTrack }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = useMemo(() => confidenceColor(entity.confidence), [entity.confidence]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(
      new THREE.Vector3(entity.position.x, entity.position.y, entity.position.z), 0.2
    );
    const targetRot = entity.direction + Math.PI / 2;
    groupRef.current.rotation.y += (targetRot - groupRef.current.rotation.y) * 0.1;
  });

  const joints = entity.poseEstimate?.joints || [];
  const jointMap = useMemo(() => {
    const m = new Map<string, { x: number; y: number; z: number }>();
    joints.forEach(j => m.set(j.name, j.position));
    return m;
  }, [joints]);

  return (
    <group ref={groupRef} position={[entity.position.x, 0, entity.position.z]}>
      {/* Joint spheres */}
      {joints.map(joint => (
        <mesh key={joint.id} position={[0, joint.position.y, 0]}>
          <sphereGeometry args={[joint.name === 'head' ? 0.12 : 0.04, 8, 8]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.3}
            transparent
            opacity={Math.max(0.4, joint.confidence)}
          />
        </mesh>
      ))}

      {/* Bone connectors */}
      {SKELETON_BONES.map(([from, to]) => {
        const a = jointMap.get(from);
        const b = jointMap.get(to);
        if (!a || !b) return null;
        const mid = { x: 0, y: (a.y + b.y) / 2, z: 0 };
        const len = Math.abs(b.y - a.y) || 0.1;
        return (
          <mesh key={`${from}-${to}`} position={[0, mid.y, 0]}>
            <cylinderGeometry args={[0.015, 0.015, len, 4]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={0.7} />
          </mesh>
        );
      })}

      {/* Torso volume */}
      <mesh position={[0, 1.1, 0]}>
        <capsuleGeometry args={[0.12, 0.35, 4, 8]} />
        <meshStandardMaterial color={color} transparent opacity={0.15} emissive={color} emissiveIntensity={0.1} />
      </mesh>

      {/* Direction indicator */}
      <mesh position={[0, 0.9, 0.25]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.05, 0.15, 4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.6} />
      </mesh>

      {/* Ground confidence ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <ringGeometry args={[0.3, 0.35, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Capsule body for low-medium confidence */
function CapsuleAvatar({ entity }: { entity: EntityTrack }) {
  const groupRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => confidenceColor(entity.confidence), [entity.confidence]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(
      new THREE.Vector3(entity.position.x, 0, entity.position.z), 0.2
    );
    if (haloRef.current) {
      const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1;
      haloRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group ref={groupRef} position={[entity.position.x, 0, entity.position.z]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <capsuleGeometry args={[0.18, 0.9, 8, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.5} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.6} />
      </mesh>
      {/* Uncertainty halo */}
      <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.5, 0.7, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Ghost silhouette for very low confidence */
function GhostAvatar({ entity }: { entity: EntityTrack }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = useMemo(() => confidenceColor(entity.confidence), [entity.confidence]);

  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.position.lerp(
      new THREE.Vector3(entity.position.x, 0, entity.position.z), 0.15
    );
    // Pulsing opacity
    const mat = groupRef.current.children[0]?.children?.[0] as THREE.Mesh | undefined;
    if (mat && mat.material) {
      (mat.material as THREE.MeshStandardMaterial).opacity = 0.15 + Math.sin(Date.now() * 0.005) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[entity.position.x, 0, entity.position.z]}>
      <group>
        <mesh position={[0, 0.8, 0]}>
          <capsuleGeometry args={[0.22, 0.8, 4, 8]} />
          <meshStandardMaterial color={color} transparent opacity={0.2} emissive={color} emissiveIntensity={0.15} wireframe />
        </mesh>
      </group>
      {/* Uncertainty cloud */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[0.8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function EntityAvatar({ entity }: { entity: EntityTrack }) {
  switch (entity.renderMode) {
    case RenderMode.Full:
    case RenderMode.Reduced:
      return <SkeletalAvatar entity={entity} />;
    case RenderMode.Capsule:
      return <CapsuleAvatar entity={entity} />;
    case RenderMode.Ghost:
    case RenderMode.FadingTrail:
      return <GhostAvatar entity={entity} />;
    default:
      return <CapsuleAvatar entity={entity} />;
  }
}

export function AvatarSystem() {
  const entities = useEntityStore(s => s.getEntitiesArray());
  return (
    <group>
      {entities.map(entity => (
        <EntityAvatar key={entity.id} entity={entity} />
      ))}
    </group>
  );
}
