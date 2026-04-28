import { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
import * as THREE from 'three';
import { useSensing } from '@/stores/sensingStore';
import { HouseScene } from './HouseScene';
import { AvatarLayer } from './AvatarLayer';
import { TrailLayer } from './TrailLayer';
import { SensorMarkers } from './SensorMarkers';
import { CoverageField } from './CoverageField';
import { HeatmapLayer } from './HeatmapLayer';
import { GridFloor } from './GridFloor';
import { CameraController } from './CameraController';
import { SceneScaffolding } from './SceneScaffolding';

interface SceneProps {
  embedded?: boolean;
}

/**
 * Main 3D viewport. Renders the house shell, rooms, avatars,
 * trails, signal overlays, and ambient scaffolding.
 */
export function Scene({ embedded }: SceneProps) {
  const house = useSensing((s) => s.house);
  const overlays = useSensing((s) => s.overlays);
  const reducedMotion = useSensing((s) => s.reducedMotion);
  const floor = house.floors[0];

  // Center the house at origin for easier camera math.
  const centeredOffset = useMemo(() => {
    const { bounds } = floor;
    return new THREE.Vector3(-bounds.w / 2, 0, -bounds.h / 2);
  }, [floor]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div className="absolute inset-0">
      <Canvas
        ref={canvasRef as any}
        shadows={!embedded}
        dpr={[1, 2]}
        camera={{ position: [14, 14, 14], fov: 38, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
        frameloop={reducedMotion ? 'demand' : 'always'}
      >
        <color attach="background" args={['#05070B']} />
        <fog attach="fog" args={['#05070B', 24, 60]} />

        <AdaptiveDpr pixelated />
        <AdaptiveEvents />

        <Suspense fallback={null}>
          {/* Ambient lighting */}
          <ambientLight intensity={0.35} color="#8EB1D6" />
          <hemisphereLight args={['#5B8FB9', '#0A0D14', 0.45]} />
          <directionalLight
            position={[10, 18, 8]}
            intensity={0.55}
            color="#A9C9E8"
            castShadow={!embedded}
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
          />
          <pointLight position={[0, 4, 0]} intensity={0.35} color="#38E3FF" distance={10} decay={2} />

          <Environment preset="night" />

          <group position={centeredOffset}>
            {/* Under-floor scaffolding: grid / vignette / frame */}
            <SceneScaffolding floor={floor} />
            {overlays.grid && <GridFloor floor={floor} />}

            {/* Structural layer */}
            <HouseScene house={house} />

            {/* Overlays */}
            {overlays.coverage && <CoverageField house={house} />}
            {overlays.motionHeatmap && <HeatmapLayer house={house} />}

            {/* Sensors */}
            <SensorMarkers house={house} />

            {/* Trails + avatars are topmost layers */}
            {overlays.trails && <TrailLayer />}
            <AvatarLayer />
          </group>

          {!embedded && (
            <ContactShadows
              position={[0, 0.001, 0]}
              opacity={0.35}
              scale={40}
              blur={2.2}
              far={4}
              color="#000000"
            />
          )}
        </Suspense>

        <CameraController floor={floor} />

        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={0.05}
          maxPolarAngle={Math.PI / 2 - 0.02}
          minDistance={5}
          maxDistance={34}
          target={[0, 1.2, 0]}
        />
      </Canvas>
    </div>
  );
}
