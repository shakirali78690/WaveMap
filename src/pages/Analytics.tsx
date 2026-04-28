import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import { useSensing } from '@/stores/sensingStore';
import { ROOM_PALETTE } from '@/data/sampleHouse';
import {
  AreaChart, Area, BarChart, Bar, Tooltip, ResponsiveContainer,
  XAxis, YAxis, CartesianGrid, LineChart, Line,
} from 'recharts';

const AXIS_STYLE = {
  fontSize: 10,
  fill: '#6F84A6',
  fontFamily: 'JetBrains Mono',
} as const;

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(17,22,36,0.95)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 6,
  fontSize: 11,
  color: '#E6ECF4',
  padding: '8px 10px',
};

export function AnalyticsPage() {
  const house = useSensing((s) => s.house);
  const tracks = useSensing((s) => s.tracks);
  const health = useSensing((s) => s.health);
  const events = useSensing((s) => s.events);
  const avatars = useSensing((s) => s.avatars);

  // ---- Time-series ----
  const [series, setSeries] = useState<Array<{ t: number; fps: number; sqi: number; conf: number; packets: number }>>([]);
  useEffect(() => {
    const id = setInterval(() => {
      const avgConf = tracks.length > 0
        ? tracks.reduce((s, t) => s + (t.latest?.confidence ?? 0), 0) / tracks.length
        : 0;
      setSeries((prev) => [
        ...prev.slice(-119),
        { t: Date.now(), fps: health.fps, sqi: health.sqi * 100, conf: avgConf * 100, packets: health.packetRate },
      ]);
    }, 1000);
    return () => clearInterval(id);
  }, [health.fps, health.sqi, health.packetRate, tracks]);

  // ---- Occupancy by room ----
  const roomOccData = useMemo(
    () => house.floors[0].rooms.map((r) => ({
      name: r.name,
      count: avatars.filter((a) => a.roomId === r.id).length,
      color: ROOM_PALETTE[r.kind].accent,
    })),
    [house, avatars]
  );

  // ---- Room transitions (from events) ----
  const transitions = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of events) {
      if (e.kind === 'room-enter' && e.roomId) map.set(e.roomId, (map.get(e.roomId) ?? 0) + 1);
    }
    return house.floors[0].rooms.map((r) => ({
      name: r.name,
      count: map.get(r.id) ?? 0,
      color: ROOM_PALETTE[r.kind].accent,
    }));
  }, [house, events]);

  // ---- Hourly occupancy heatmap (synthetic: last 24 slots scaled to minutes) ----
  const hourly = useMemo(() => {
    return Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      value: Math.max(
        0,
        Math.sin((h / 24) * Math.PI * 2 + 0.5) * 0.5 + 0.5 - 0.15 +
          (h === new Date().getHours() ? avatars.length * 0.2 : 0)
      ),
    }));
  }, [avatars.length]);

  return (
    <PageShell>
      <div className="grid grid-cols-12 gap-4">
        {/* Overview chart: SQI + conf */}
        <Panel padding="none" className="col-span-12 lg:col-span-8">
          <PanelHeader
            className="px-4 pt-3"
            title="Signal Quality & Confidence"
            eyebrow="Rolling 2-minute window"
            trailing={
              <div className="flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1.5 text-frost-300">
                  <span className="w-3 h-0.5 bg-accent-cyan" /> SQI
                </span>
                <span className="flex items-center gap-1.5 text-frost-300">
                  <span className="w-3 h-0.5 bg-accent-emerald" /> Avg Conf
                </span>
              </div>
            }
          />
          <div className="h-[220px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="gSqi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38E3FF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#38E3FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gConf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#32D8A0" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#32D8A0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(t) => new Date(t).toLocaleTimeString(undefined, { hour12: false, minute: '2-digit', second: '2-digit' })} tick={AXIS_STYLE as any} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={AXIS_STYLE as any} stroke="rgba(255,255,255,0.1)" domain={[0, 100]} width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelFormatter={(t) => new Date(t).toLocaleTimeString(undefined, { hour12: false })} />
                <Area type="monotone" dataKey="sqi" stroke="#38E3FF" fill="url(#gSqi)" strokeWidth={1.5} />
                <Area type="monotone" dataKey="conf" stroke="#32D8A0" fill="url(#gConf)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Occupancy by room */}
        <Panel padding="none" className="col-span-12 lg:col-span-4">
          <PanelHeader className="px-4 pt-3" title="Current Occupancy" eyebrow="By Room" trailing={<Chip tone="muted">{avatars.length}</Chip>} />
          <div className="h-[220px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roomOccData} layout="vertical" barSize={12}>
                <CartesianGrid stroke="rgba(255,255,255,0.03)" horizontal={false} />
                <XAxis type="number" tick={AXIS_STYLE as any} stroke="rgba(255,255,255,0.1)" />
                <YAxis type="category" dataKey="name" tick={AXIS_STYLE as any} stroke="rgba(255,255,255,0.1)" width={72} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {roomOccData.map((d, i) => (
                    <rect key={i} fill={d.color} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* FPS / Packet rate */}
        <Panel padding="none" className="col-span-12 lg:col-span-6">
          <PanelHeader className="px-4 pt-3" title="Pipeline Throughput" eyebrow="FPS & Packets" />
          <div className="h-[200px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={() => ''} tick={AXIS_STYLE as any} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={AXIS_STYLE as any} stroke="rgba(255,255,255,0.1)" width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="fps" stroke="#38E3FF" strokeWidth={1.3} dot={false} />
                <Line type="monotone" dataKey="packets" stroke="#A78BFA" strokeWidth={1.3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Transitions */}
        <Panel padding="none" className="col-span-12 lg:col-span-6">
          <PanelHeader className="px-4 pt-3" title="Room Entries" eyebrow="Session total" />
          <div className="h-[200px] px-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={transitions} barSize={18}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={AXIS_STYLE as any} stroke="rgba(255,255,255,0.1)" />
                <YAxis tick={AXIS_STYLE as any} stroke="rgba(255,255,255,0.1)" width={28} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#38E3FF" opacity={0.8} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Hourly heatmap */}
        <Panel padding="md" className="col-span-12">
          <PanelHeader title="Hourly Occupancy" eyebrow="24h heatmap" />
          <div className="flex gap-[3px] h-12 items-stretch">
            {hourly.map((h) => (
              <div key={h.hour} className="flex-1 relative group">
                <div
                  className="h-full rounded-sm"
                  style={{
                    background: `linear-gradient(180deg, rgba(56,227,255,${Math.min(0.8, 0.1 + h.value)}), rgba(56,227,255,${Math.min(0.4, 0.05 + h.value * 0.5)}))`,
                  }}
                />
                <div className="absolute inset-x-0 -bottom-5 text-center text-[9px] font-mono text-frost-500">
                  {String(h.hour).padStart(2, '0')}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -top-7 opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded bg-ink-800 border border-white/10 text-[10px] font-mono text-frost-100 pointer-events-none">
                  {(h.value * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </PageShell>
  );
}
