import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { House } from '@/data/types';

/**
 * Elegant, subtle signal coverage rings around each sensor.
 * Uses additive-blended shader planes rather than heavy volumes.
 */
export function CoverageField({ house }: { house: House }) {
  return (
    <group>
      {house.sensors.map((s) => (
        <CoverageRing
          key={s.id}
          x={s.position.x}
          z={s.position.z}
          radius={s.coverage}
        />
      ))}
    </group>
  );
}

function CoverageRing({ x, z, radius }: { x: number; z: number; radius: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const mat = ref.current.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = t;
  });

  return (
    <mesh ref={ref} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[radius, 96]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        uniforms={{
          uTime: { value: 0 },
          uRadius: { value: radius },
          uColor: { value: new THREE.Color('#38E3FF') },
        }}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPos;
          void main() {
            vUv = uv;
            vPos = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          varying vec3 vPos;
          uniform float uTime;
          uniform float uRadius;
          uniform vec3 uColor;
          void main() {
            float d = length(vPos.xy) / uRadius;
            float falloff = smoothstep(1.0, 0.0, d);
            float rings = sin(d * 16.0 - uTime * 1.5) * 0.5 + 0.5;
            float ringEdge = smoothstep(0.6, 1.0, rings) * 0.15;
            float sweep = smoothstep(0.96, 1.0, fract(d - uTime * 0.08)) * 0.4;
            float a = (falloff * 0.08) + ringEdge * falloff + sweep * falloff;
            gl_FragColor = vec4(uColor, a);
          }
        `}
      />
    </mesh>
  );
}
