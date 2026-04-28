import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useEntityStore } from '../../store/entityStore';
import { useSensingStore } from '../../store/sensingStore';

function Trail({ history, color }: { history: { x: number; y: number; z: number }[]; color: string }) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    if (history.length < 2) return null;
    const points = history.map(p => new THREE.Vector3(p.x, 0.03, p.z));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [history]);

  if (!geometry) return null;

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.4} linewidth={1} />
    </line>
  );
}

export function PathTrailRenderer() {
  const entities = useEntityStore(s => s.getEntitiesArray());
  const showTrails = useSensingStore(s => s.overlays.pathTrails);

  if (!showTrails) return null;

  return (
    <group>
      {entities.map(entity => {
        if (entity.history.length < 2) return null;
        const color = entity.confidence > 0.8 ? '#34d399' :
          entity.confidence > 0.5 ? '#fbbf24' : '#f87171';
        return <Trail key={entity.id} history={entity.history} color={color} />;
      })}
    </group>
  );
}
