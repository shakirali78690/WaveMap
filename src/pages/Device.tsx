import { PageShell } from '@/components/layout/PageShell';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusDot } from '@/components/ui/StatusDot';
import { useSensing, type AdapterKind } from '@/stores/sensingStore';
import { Router, Wifi, Shield, Power, RefreshCw, Terminal, Cable } from 'lucide-react';

export function DevicePage() {
  const health = useSensing((s) => s.health);
  const adapter = useSensing((s) => s.adapter);
  const setAdapter = useSensing((s) => s.setAdapter);
  const connected = useSensing((s) => s.connected);
  const startMock = useSensing((s) => s.startMock);
  const stop = useSensing((s) => s.stop);
  const house = useSensing((s) => s.house);
  const router = house.sensors.find((s) => s.kind === 'router');

  return (
    <PageShell>
      <div className="grid grid-cols-12 gap-4">
        {/* Router hero */}
        <Panel padding="none" className="col-span-12 lg:col-span-7">
          <div className="px-5 pt-4 pb-4 flex items-start gap-4 border-b border-white/[0.04]">
            <div className="w-12 h-12 rounded-md bg-gradient-to-br from-accent-cyan/20 to-ink-700 border border-white/[0.08] flex items-center justify-center">
              <Router className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-semibold text-frost-50">{router?.label ?? 'Primary Router'}</h2>
                <Chip tone={health.routerConnected ? 'emerald' : 'rose'} dot={health.routerConnected}>
                  {health.routerConnected ? 'Connected' : 'Offline'}
                </Chip>
              </div>
              <div className="mt-1 text-[11.5px] text-frost-400 font-mono">
                {health.routerSsid ?? '—'} · {health.routerIp ?? '—'} · ch {router?.meta?.channel ?? '—'} · {router?.meta?.band ?? '—'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-0 divide-x divide-white/[0.04]">
            <RouterStat label="TX Power"      value={String(router?.meta?.power ?? '—')} />
            <RouterStat label="Coverage"      value={`${router?.coverage ?? '—'} m`} />
            <RouterStat label="Anchors"       value={String(house.sensors.filter((s) => s.kind === 'anchor').length)} />
            <RouterStat label="Uptime"        value={`${Math.floor(health.uptime / 60)}m`} />
          </div>

          <div className="px-5 py-4 flex items-center gap-2 border-t border-white/[0.04]">
            <Button iconLeft={<RefreshCw className="w-3 h-3" />} onClick={() => { stop(); setTimeout(startMock, 80); }}>Restart stream</Button>
            <Button variant="secondary" iconLeft={<Terminal className="w-3 h-3" />}>Open shell</Button>
            <div className="flex-1" />
            <Button
              variant={connected ? 'danger' : 'primary'}
              iconLeft={<Power className="w-3 h-3" />}
              onClick={connected ? stop : startMock}
            >
              {connected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </Panel>

        {/* Adapter selection */}
        <Panel padding="none" className="col-span-12 lg:col-span-5">
          <PanelHeader className="px-5 pt-4" title="Backend Adapter" eyebrow="Data Source" />
          <div className="px-5 pb-4 space-y-3">
            <Select<AdapterKind>
              label="Adapter"
              value={adapter}
              onChange={setAdapter}
              options={[
                { value: 'mock',      label: 'Mock Simulator (default)' },
                { value: 'websocket', label: 'WebSocket Stream' },
                { value: 'recorded',  label: 'Recorded Session' },
              ]}
            />
            {adapter === 'mock' && (
              <div className="text-[11px] text-frost-400 leading-relaxed">
                Running the built-in simulator. Flip to <span className="text-frost-100">WebSocket</span> to attach a real backend endpoint.
              </div>
            )}
            {adapter === 'websocket' && (
              <div className="space-y-2">
                <Field label="Endpoint"     placeholder="ws://10.42.0.1:8765/stream" />
                <Field label="Auth token"   placeholder="wavemap_…" mono />
                <div className="text-[10.5px] text-frost-500 leading-relaxed">
                  Expected payload: <span className="font-mono text-frost-300">{`{type: 'frame', data: DetectionFrame}`}</span>
                </div>
              </div>
            )}
            {adapter === 'recorded' && (
              <div className="space-y-2">
                <Field label="Session file" placeholder="sessions/morning-01.wavemap" />
              </div>
            )}
            <div className="pt-2 flex items-center gap-2 text-[10.5px] text-frost-400">
              <Wifi className="w-3 h-3" />
              <span>Capabilities: live · pose · signal-field · playback</span>
            </div>
          </div>
        </Panel>

        {/* Anchors list */}
        <Panel padding="none" className="col-span-12 lg:col-span-7">
          <PanelHeader className="px-5 pt-4" title="Anchor Nodes" eyebrow="Mesh topology" />
          <div className="divide-y divide-white/[0.04]">
            {house.sensors.filter((s) => s.kind !== 'router').map((s) => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3">
                <StatusDot tone="emerald" pulsing />
                <div className="w-7 h-7 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <Cable className="w-3 h-3 text-frost-300" />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-medium text-frost-100">{s.label}</div>
                  <div className="text-[10.5px] font-mono text-frost-500">
                    ({s.position.x.toFixed(2)}, {s.position.z.toFixed(2)}) · {s.coverage}m radius
                  </div>
                </div>
                <Chip tone="muted" mono>{s.kind}</Chip>
              </div>
            ))}
          </div>
        </Panel>

        {/* Privacy */}
        <Panel padding="md" className="col-span-12 lg:col-span-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-md bg-accent-emerald/10 border border-accent-emerald/25 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-accent-emerald" />
            </div>
            <div>
              <div className="section-title">Privacy</div>
              <div className="text-[13px] font-semibold text-frost-50">Handling</div>
            </div>
          </div>
          <ul className="text-[11.5px] text-frost-300 space-y-2 leading-relaxed">
            <li>• Raw CSI / RF data is not persisted by default.</li>
            <li>• Masked rooms are excluded from analytics aggregation.</li>
            <li>• Body visualizations are silhouette-only; no biometric identifiers.</li>
            <li>• Event feed retains last 200 items per session.</li>
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}

function RouterStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <div className="section-title mb-1">{label}</div>
      <div className="metric-value text-frost-50">{value}</div>
    </div>
  );
}

function Field({ label, placeholder, mono }: { label: string; placeholder: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="section-title">{label}</span>
      <input
        placeholder={placeholder}
        className={`h-8 px-3 bg-ink-800 border border-white/[0.06] rounded-md text-[12px] text-frost-100 placeholder:text-frost-500 focus:outline-none focus:border-accent-cyan/60 ${mono ? 'font-mono' : ''}`}
      />
    </div>
  );
}
