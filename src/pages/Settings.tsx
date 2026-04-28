import { PageShell } from '@/components/layout/PageShell';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Slider } from '@/components/ui/Slider';
import { Toggle } from '@/components/ui/Toggle';
import { Segmented } from '@/components/ui/Segmented';
import { Button } from '@/components/ui/Button';
import { useSensing } from '@/stores/sensingStore';
import { Download } from 'lucide-react';

export function SettingsPage() {
  const smoothing = useSensing((s) => s.smoothing);
  const setSmoothing = useSensing((s) => s.setSmoothing);
  const trailSeconds = useSensing((s) => s.trailSeconds);
  const setTrailSeconds = useSensing((s) => s.setTrailSeconds);
  const thresholds = useSensing((s) => s.thresholds);
  const setThresholds = useSensing((s) => s.setThresholds);
  const overlays = useSensing((s) => s.overlays);
  const setOverlay = useSensing((s) => s.setOverlay);
  const theme = useSensing((s) => s.theme);
  const toggleTheme = useSensing((s) => s.toggleTheme);
  const reducedMotion = useSensing((s) => s.reducedMotion);
  const events = useSensing((s) => s.events);
  const tracks = useSensing((s) => s.tracks);

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ tracks, events, thresholds, smoothing, trailSeconds }, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wavemap-session-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageShell>
      <div className="grid grid-cols-12 gap-4">
        {/* Appearance */}
        <Panel padding="none" className="col-span-12 lg:col-span-6">
          <PanelHeader className="px-4 pt-3" title="Appearance" eyebrow="Theme & motion" />
          <div className="px-4 pb-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[12px] font-medium text-frost-100">Theme</div>
                <div className="text-[10.5px] text-frost-500">Dark mode is strongly recommended for the 3D viewport.</div>
              </div>
              <Segmented
                value={theme}
                onChange={() => toggleTheme()}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                ]}
              />
            </div>
            <Toggle
              checked={reducedMotion}
              onChange={() => { /* reducedMotion is currently auto-detected */ }}
              label="Respect reduced motion"
              sub="Honors the OS-level prefers-reduced-motion media query."
              disabled
            />
          </div>
        </Panel>

        {/* Tracking */}
        <Panel padding="none" className="col-span-12 lg:col-span-6">
          <PanelHeader className="px-4 pt-3" title="Tracking" eyebrow="Filtering & trails" />
          <div className="px-4 pb-4 space-y-4">
            <Slider
              label="Smoothing"
              value={smoothing}
              min={0} max={0.95} step={0.01}
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
        </Panel>

        {/* Confidence bands */}
        <Panel padding="none" className="col-span-12 lg:col-span-6">
          <PanelHeader className="px-4 pt-3" title="Confidence Bands" eyebrow="Classification thresholds" />
          <div className="px-4 pb-4 space-y-4">
            <Slider
              label="High ≥"
              value={thresholds.high} min={0.3} max={1}
              onChange={(v) => setThresholds({ ...thresholds, high: v })}
              formatValue={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <Slider
              label="Medium ≥"
              value={thresholds.medium} min={0.1} max={Math.max(0.1, thresholds.high - 0.05)}
              onChange={(v) => setThresholds({ ...thresholds, medium: v })}
              formatValue={(v) => `${(v * 100).toFixed(0)}%`}
            />
            <Slider
              label="Low ≥"
              value={thresholds.low} min={0.05} max={Math.max(0.05, thresholds.medium - 0.05)}
              onChange={(v) => setThresholds({ ...thresholds, low: v })}
              formatValue={(v) => `${(v * 100).toFixed(0)}%`}
            />
          </div>
        </Panel>

        {/* Overlays */}
        <Panel padding="none" className="col-span-12 lg:col-span-6">
          <PanelHeader className="px-4 pt-3" title="Default Overlays" eyebrow="Layer visibility" />
          <div className="px-4 pb-4 grid grid-cols-2 gap-3">
            <Toggle checked={overlays.coverage}      onChange={(v) => setOverlay('coverage', v)}      label="Coverage" />
            <Toggle checked={overlays.motionHeatmap} onChange={(v) => setOverlay('motionHeatmap', v)} label="Heatmap" />
            <Toggle checked={overlays.trails}        onChange={(v) => setOverlay('trails', v)}        label="Trails" />
            <Toggle checked={overlays.uncertainty}   onChange={(v) => setOverlay('uncertainty', v)}   label="Uncertainty" />
            <Toggle checked={overlays.roomLabels}    onChange={(v) => setOverlay('roomLabels', v)}    label="Room labels" />
            <Toggle checked={overlays.grid}          onChange={(v) => setOverlay('grid', v)}          label="Grid" />
          </div>
        </Panel>

        {/* Export */}
        <Panel padding="md" className="col-span-12">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="section-title">Session Export</div>
              <div className="text-[12px] text-frost-100">Export current track / event history as JSON.</div>
              <div className="text-[10.5px] text-frost-500 mt-0.5">Includes smoothing, thresholds, and the live event ring buffer.</div>
            </div>
            <Button variant="primary" onClick={exportJson} iconLeft={<Download className="w-3 h-3" />}>Export session.json</Button>
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
