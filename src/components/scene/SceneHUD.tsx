import {
  Box, Layers, LayoutGrid, Eye, EyeOff, Ruler, Radar, Flame, Route, Focus, ZapOff, User, Map as MapIcon,
} from 'lucide-react';
import { useSensing } from '@/stores/sensingStore';
import { Segmented } from '@/components/ui/Segmented';
import { Toggle } from '@/components/ui/Toggle';
import { Panel } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import type { CameraPreset, OverlayFlags } from '@/data/types';

const CAMERAS: Array<{ value: CameraPreset; label: string; icon: React.ReactNode }> = [
  { value: 'isometric',    label: 'ISO',       icon: <Box className="w-3 h-3" /> },
  { value: 'top',          label: 'Top',       icon: <MapIcon className="w-3 h-3" /> },
  { value: 'orbit',        label: 'Orbit',     icon: <Focus className="w-3 h-3" /> },
  { value: 'first-person', label: 'FPV',       icon: <User className="w-3 h-3" /> },
  { value: 'cinematic',    label: 'Cine',      icon: <LayoutGrid className="w-3 h-3" /> },
];

const OVERLAYS: Array<{ key: keyof OverlayFlags; label: string; icon: React.ReactNode; sub?: string }> = [
  { key: 'coverage',        label: 'Coverage',       icon: <Radar className="w-3 h-3" /> },
  { key: 'motionHeatmap',   label: 'Heatmap',        icon: <Flame className="w-3 h-3" /> },
  { key: 'trails',          label: 'Trails',         icon: <Route className="w-3 h-3" /> },
  { key: 'uncertainty',     label: 'Uncertainty',    icon: <ZapOff className="w-3 h-3" /> },
  { key: 'roomLabels',      label: 'Labels',         icon: <Layers className="w-3 h-3" /> },
  { key: 'grid',            label: 'Grid',           icon: <Ruler className="w-3 h-3" /> },
];

export function SceneHUD() {
  const camera = useSensing((s) => s.camera);
  const setCamera = useSensing((s) => s.setCamera);
  const overlays = useSensing((s) => s.overlays);
  const setOverlay = useSensing((s) => s.setOverlay);
  const fadeWalls = useSensing((s) => s.fadeWalls);
  const setFadeWalls = useSensing((s) => s.setFadeWalls);
  const health = useSensing((s) => s.health);

  return (
    <>
      {/* Top-left: camera presets */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-auto">
        <Segmented value={camera} onChange={setCamera} options={CAMERAS} />
        <button
          onClick={() => setFadeWalls(!fadeWalls)}
          className="inline-flex items-center gap-2 h-7 px-2.5 rounded-md text-xs font-medium bg-ink-800/80 backdrop-blur-md border border-white/[0.06] text-frost-200 hover:text-frost-50 hover:border-white/[0.12] transition-colors"
        >
          {fadeWalls ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>Walls: {fadeWalls ? 'faded' : 'solid'}</span>
        </button>
      </div>

      {/* Top-right: frame meta */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2 pointer-events-auto">
        <Panel padding="none" className="px-3 py-2">
          <div className="flex items-center gap-3 text-[10.5px] font-mono text-frost-300">
            <div className="flex items-center gap-1">
              <span className="text-frost-500">FPS</span>
              <span className="text-frost-50">{health.fps.toFixed(0)}</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1">
              <span className="text-frost-500">SQI</span>
              <span className="text-frost-50">{(health.sqi * 100).toFixed(0)}</span>
            </div>
            <div className="h-3 w-px bg-white/10" />
            <div className="flex items-center gap-1">
              <span className="text-frost-500">Tracks</span>
              <span className="text-frost-50">{health.tracks}</span>
            </div>
          </div>
        </Panel>
        <Chip tone={health.streamState === 'open' ? 'emerald' : 'amber'} dot>
          {health.streamState === 'open' ? 'Live · Mock Simulator' : health.streamState}
        </Chip>
      </div>

      {/* Bottom-left: overlays */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
        <Panel padding="sm">
          <div className="section-title mb-2 px-0.5">Layers</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {OVERLAYS.map((o) => (
              <Toggle
                key={o.key}
                checked={overlays[o.key]}
                onChange={(v) => setOverlay(o.key, v)}
                label={<span className="inline-flex items-center gap-1.5">{o.icon}{o.label}</span>}
              />
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
