import { useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/Slider';
import { Scene } from '@/components/scene/Scene';
import { useSensing } from '@/stores/sensingStore';
import { Check, ChevronRight, Router, Ruler, DoorOpen, Shield, Sliders } from 'lucide-react';
import { cn } from '@/lib/cn';

type StepId = 'layout' | 'rooms' | 'sensors' | 'walls' | 'privacy' | 'thresholds' | 'test';

const STEPS: Array<{ id: StepId; label: string; icon: any; description: string }> = [
  { id: 'layout',     label: 'Floor Geometry',   icon: Ruler,   description: 'Dimensions, origin, and scale.' },
  { id: 'rooms',      label: 'Rooms',            icon: DoorOpen, description: 'Name and tag each space.' },
  { id: 'sensors',    label: 'Sensors',          icon: Router,  description: 'Place router and anchors.' },
  { id: 'walls',      label: 'Walls & Openings', icon: Ruler,   description: 'Mark partitions, doors, and attenuation.' },
  { id: 'privacy',    label: 'Privacy Zones',    icon: Shield,  description: 'Mask sensitive rooms from analytics.' },
  { id: 'thresholds', label: 'Thresholds',       icon: Sliders, description: 'Confidence bands and smoothing.' },
  { id: 'test',       label: 'Test Motion',      icon: Check,   description: 'Validate with simulated walk.' },
];

export function CalibratePage() {
  const [step, setStep] = useState<StepId>('layout');
  const thresholds = useSensing((s) => s.thresholds);
  const setThresholds = useSensing((s) => s.setThresholds);
  const smoothing = useSensing((s) => s.smoothing);
  const setSmoothing = useSensing((s) => s.setSmoothing);
  const trailSeconds = useSensing((s) => s.trailSeconds);
  const setTrailSeconds = useSensing((s) => s.setTrailSeconds);
  const house = useSensing((s) => s.house);

  const stepIdx = STEPS.findIndex((s) => s.id === step);
  const progress = ((stepIdx + 1) / STEPS.length) * 100;

  const floor = house.floors[0];
  const fmtArea = useMemo(() => `${floor.bounds.w.toFixed(1)}m × ${floor.bounds.h.toFixed(1)}m · ${(floor.bounds.w * floor.bounds.h).toFixed(0)}m²`, [floor]);

  return (
    <PageShell>
      <div className="grid grid-cols-12 gap-4">
        {/* Sidebar steps */}
        <Panel padding="none" className="col-span-12 lg:col-span-3">
          <div className="px-4 pt-3 pb-3 border-b border-white/[0.04]">
            <div className="section-title">Calibration</div>
            <div className="text-[13px] font-semibold text-frost-50">Guided Setup</div>
            <div className="mt-2 h-1 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full bg-accent-cyan transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] font-mono text-frost-500">
              <span>Step {stepIdx + 1}/{STEPS.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
          <div className="p-2">
            {STEPS.map((s, i) => {
              const done = i < stepIdx;
              const active = i === stepIdx;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setStep(s.id)}
                  className={cn(
                    'w-full flex items-start gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors',
                    active ? 'bg-white/[0.05]' : 'hover:bg-white/[0.02]'
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0',
                    done
                      ? 'bg-accent-emerald/15 text-accent-emerald border border-accent-emerald/30'
                      : active
                        ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30'
                        : 'bg-white/[0.03] text-frost-500 border border-white/[0.06]'
                  )}>
                    {done ? <Check className="w-2.5 h-2.5" /> : <Icon className="w-2.5 h-2.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn('text-[12px] font-medium', active ? 'text-frost-50' : 'text-frost-200')}>{s.label}</div>
                    <div className="text-[10px] text-frost-500 mt-0.5 leading-snug">{s.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Main content */}
        <div className="col-span-12 lg:col-span-9 space-y-3">
          <Panel padding="none">
            <PanelHeader className="px-4 pt-3" title={STEPS[stepIdx].label} eyebrow={`Step ${stepIdx + 1}`} trailing={<Chip tone="cyan">Active</Chip>} />
            <div className="px-4 pb-4">
              {step === 'layout' && (
                <div className="space-y-4">
                  <p className="text-[12px] text-frost-300">
                    Define the bounds of the floor. WaveMap uses these to frame the 3D viewport,
                    calibrate coordinate space, and clamp entity positions.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Width" value={`${floor.bounds.w.toFixed(1)} m`} />
                    <Field label="Depth" value={`${floor.bounds.h.toFixed(1)} m`} />
                    <Field label="Area"  value={fmtArea} />
                  </div>
                  <div className="text-[11px] text-frost-500">
                    In production this step would accept a DXF/GeoJSON/SVG upload or a guided draw tool.
                  </div>
                </div>
              )}

              {step === 'rooms' && (
                <div className="space-y-3">
                  <p className="text-[12px] text-frost-300">Confirm the detected rooms. Relabel or reclassify as needed.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {floor.rooms.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 px-2.5 h-9 rounded border border-white/[0.06] bg-white/[0.015]">
                        <span className="text-[11.5px] font-medium text-frost-100 flex-1 truncate">{r.name}</span>
                        <Chip tone="muted" mono>{r.kind}</Chip>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {step === 'sensors' && (
                <div className="space-y-3">
                  <p className="text-[12px] text-frost-300">Sensor positions and coverage radii.</p>
                  {house.sensors.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-md border border-white/[0.06] bg-white/[0.015]">
                      <div className="w-7 h-7 rounded-full bg-accent-cyan/10 border border-accent-cyan/25 flex items-center justify-center">
                        <Router className="w-3.5 h-3.5 text-accent-cyan" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[12px] font-medium text-frost-50">{s.label}</div>
                        <div className="text-[10.5px] font-mono text-frost-400">
                          ({s.position.x.toFixed(2)}, {s.position.z.toFixed(2)}) · coverage {s.coverage}m
                        </div>
                      </div>
                      <Chip tone="cyan" mono>{s.kind}</Chip>
                    </div>
                  ))}
                </div>
              )}

              {step === 'walls' && (
                <div className="space-y-3">
                  <p className="text-[12px] text-frost-300">
                    {floor.walls.length} wall segments detected. Attenuation values drive the confidence model.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {(['exterior', 'interior', 'door', 'opening', 'window'] as const).map((k) => {
                      const count = floor.walls.filter((w) => w.kind === k).length;
                      return (
                        <div key={k} className="flex items-center gap-2 px-2.5 h-9 rounded border border-white/[0.06]">
                          <span className="capitalize text-frost-200 flex-1">{k}</span>
                          <span className="font-mono text-frost-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {step === 'privacy' && (
                <div className="space-y-3">
                  <p className="text-[12px] text-frost-300">
                    Rooms marked as privacy zones are never stored in analytics history and are blurred in the viewport.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {floor.rooms.filter((r) => r.kind === 'bathroom').map((r) => (
                      <Chip key={r.id} tone="emerald" dot>{r.name} · masked</Chip>
                    ))}
                    {floor.rooms.filter((r) => r.kind !== 'bathroom').map((r) => (
                      <Chip key={r.id} tone="muted">{r.name}</Chip>
                    ))}
                  </div>
                </div>
              )}

              {step === 'thresholds' && (
                <div className="space-y-4">
                  <p className="text-[12px] text-frost-300">
                    Tune the confidence bands that classify tracks as high / medium / low / lost.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <Slider
                      label="High ≥" value={thresholds.high} min={0.3} max={1}
                      onChange={(v) => setThresholds({ ...thresholds, high: v })}
                      formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Slider
                      label="Medium ≥" value={thresholds.medium} min={0.1} max={thresholds.high - 0.05}
                      onChange={(v) => setThresholds({ ...thresholds, medium: v })}
                      formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Slider
                      label="Low ≥" value={thresholds.low} min={0.05} max={thresholds.medium - 0.05}
                      onChange={(v) => setThresholds({ ...thresholds, low: v })}
                      formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Slider
                      label="Smoothing"
                      value={smoothing}
                      min={0} max={0.95}
                      onChange={setSmoothing}
                      formatValue={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Slider
                      label="Trail duration"
                      value={trailSeconds}
                      min={1} max={15} step={0.5}
                      onChange={setTrailSeconds}
                      formatValue={(v) => `${v.toFixed(1)}s`}
                    />
                  </div>
                </div>
              )}

              {step === 'test' && (
                <div className="space-y-3">
                  <p className="text-[12px] text-frost-300">
                    Observe live detections below. If avatars flicker or lose tracking frequently, revisit the thresholds step.
                  </p>
                  <div className="h-[280px] relative rounded-md overflow-hidden border border-white/[0.06]">
                    <Scene embedded />
                  </div>
                </div>
              )}
            </div>
          </Panel>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              disabled={stepIdx === 0}
              onClick={() => setStep(STEPS[Math.max(0, stepIdx - 1)].id)}
            >
              ← Back
            </Button>
            {stepIdx < STEPS.length - 1 ? (
              <Button variant="primary" iconRight={<ChevronRight className="w-3 h-3" />} onClick={() => setStep(STEPS[stepIdx + 1].id)}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" iconRight={<Check className="w-3 h-3" />}>Apply Calibration</Button>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-md border border-white/[0.06] bg-white/[0.015]">
      <span className="section-title">{label}</span>
      <span className="metric-value text-frost-50">{value}</span>
    </div>
  );
}
