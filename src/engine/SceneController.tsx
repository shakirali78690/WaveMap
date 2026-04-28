import React, { Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, OrthographicCamera, PerspectiveCamera, Environment, Grid } from '@react-three/drei';
import { useUIStore } from '../store/uiStore';
import { useSensingStore } from '../store/sensingStore';
import { FloorRenderer } from './FloorRenderer';
import { WallRenderer } from './WallRenderer';
import { AvatarSystem } from './AvatarSystem';
import { SpatialLabels } from './SpatialLabels';
import { PathTrailRenderer } from './avatar/PathTrail';
import * as THREE from 'three';

function SceneLoading() {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg)', color: 'var(--color-text-tertiary)', fontSize: 'var(--text-sm)',
      fontFamily: 'var(--font-mono)', zIndex: 5,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="skeleton" style={{ width: 120, height: 8, margin: '0 auto 12px' }} />
        <span>Initializing spatial engine...</span>
      </div>
    </div>
  );
}

function SceneContent() {
  const cameraMode = useUIStore(s => s.cameraMode);
  const showGrid = useSensingStore(s => s.overlays.grid);

  return (
    <>
      {cameraMode === 'tactical' ? (
        <OrthographicCamera makeDefault position={[5, 20, 5]} zoom={50} near={0.1} far={100} />
      ) : cameraMode === 'isometric' ? (
        <PerspectiveCamera makeDefault position={[18, 14, 18]} fov={35} near={0.1} far={200} />
      ) : (
        <PerspectiveCamera makeDefault position={[5, 12, 16]} fov={45} near={0.1} far={200} />
      )}

      <OrbitControls
        target={[5, 0, 5]}
        enableDamping
        dampingFactor={0.08}
        minDistance={3}
        maxDistance={40}
        maxPolarAngle={cameraMode === 'tactical' ? 0.1 : Math.PI / 2.1}
        enablePan
      />

      {/* Lighting */}
      <ambientLight intensity={0.35} color="#a0b0d0" />
      <directionalLight position={[8, 15, 10]} intensity={0.6} color="#d4e0f0" castShadow
        shadow-mapSize-width={1024} shadow-mapSize-height={1024}
        shadow-camera-far={50} shadow-camera-left={-15} shadow-camera-right={15}
        shadow-camera-top={15} shadow-camera-bottom={-15}
      />
      <directionalLight position={[-5, 8, -8]} intensity={0.15} color="#6080b0" />
      <hemisphereLight groundColor="#0a0d14" intensity={0.2} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5, -0.01, 5]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#080b10" roughness={0.95} />
      </mesh>

      {showGrid && (
        <Grid
          args={[30, 30]}
          position={[5, 0.005, 5]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1a2030"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#242b3a"
          fadeDistance={25}
          infiniteGrid={false}
        />
      )}

      {/* House rendering */}
      <FloorRenderer />
      <WallRenderer />
      <AvatarSystem />
      <PathTrailRenderer />
      <SpatialLabels />
    </>
  );
}

export function SceneController() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Suspense fallback={<SceneLoading />}>
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.1,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
          style={{ background: '#06080c' }}
        >
          <SceneContent />
        </Canvas>
      </Suspense>
    </div>
  );
}
