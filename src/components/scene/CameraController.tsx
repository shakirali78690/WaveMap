import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Floor } from '@/data/types';
import { useSensing } from '@/stores/sensingStore';

interface Props { floor: Floor; }

/**
 * Reacts to camera preset changes in the store, smoothly sliding
 * the camera to a canonical pose for each view.
 */
export function CameraController({ floor }: Props) {
  const { camera, controls } = useThree();
  const preset = useSensing((s) => s.camera);

  useEffect(() => {
    const target = new THREE.Vector3(0, 0.8, 0);
    let pos: THREE.Vector3;
    const diag = Math.max(floor.bounds.w, floor.bounds.h);

    switch (preset) {
      case 'top':         pos = new THREE.Vector3(0, diag * 1.4, 0.001); break;
      case 'orbit':       pos = new THREE.Vector3(diag * 0.9, diag * 0.7, diag * 0.9); break;
      case 'isometric':   pos = new THREE.Vector3(diag * 0.8, diag * 0.9, diag * 0.8); break;
      case 'first-person': pos = new THREE.Vector3(0, 1.6, diag * 0.4); break;
      case 'cinematic':   pos = new THREE.Vector3(diag * 1.1, diag * 0.5, -diag * 0.8); break;
      default:            pos = new THREE.Vector3(diag * 0.8, diag * 0.9, diag * 0.8);
    }

    // Animate: simple manual tween
    const start = camera.position.clone();
    const tStart = performance.now();
    const dur = 650;

    const animate = () => {
      const now = performance.now();
      const k = Math.min(1, (now - tStart) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(start, pos, e);
      camera.lookAt(target);
      if (controls && 'target' in (controls as any)) (controls as any).target.copy(target);
      if (controls && 'update' in (controls as any)) (controls as any).update();
      if (k < 1) requestAnimationFrame(animate);
    };
    animate();
  }, [preset, camera, controls, floor.bounds.w, floor.bounds.h]);

  return null;
}
