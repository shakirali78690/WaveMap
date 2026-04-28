import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/layout/PageShell';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Metric } from '@/components/ui/Metric';
import { Chip } from '@/components/ui/Chip';
import { Sparkline } from '@/components/ui/Sparkline';
import { Scene } from '@/components/scene/Scene';
import { SystemStatusPanel } from '@/components/panels/SystemStatusPanel';
import { EventFeedPanel } from '@/components/panels/EventFeedPanel';
import { useSensing } from '@/stores/sensingStore';
import { ROOM_PALETTE } from '@/data/sampleHouse';
import { ArrowRight, Radio, Users, Activity, Gauge, DoorOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OverviewPage() {
  const house = useSensing((s) => s.house);
  const health = useSensing((s) => s.health);
  const tracks = useSensing((s) => s.tracks);
  const avatars = useSensing((s) => s.avatars);
  const events = useSensing((s) => s.events);

  // Mini SQI trend
  const [sqiSeries, setSqiSeries] = useState<number[]>([]);
  useEffect(() => {
    const id = setInterval(() => {
      setSqiSeries((p) => [...p.slice(-79), health.sqi * 100]);
    }, 500);
    return () => clearInterval(id);
  }, [health.sqi]);

  const activeRooms = useMemo(() => {
    const set = new Set<string>();
    for (const a of avatars) if (a.roomId) set.add(a.roomId);
    return set.size;
  }, [avatars]);

  const liveTracks = tracks.filter((t) => t.band !== 'lost').length;

  return (
    <PageShell>
      <div className="grid grid-cols-12 gap-4">
        {/* KPI row */}
        <div className="col-span-12 grid grid-cols-4 gap-3">
          <KPI
            icon={<Users className="w-3.5 h-3.5" />}
            label="Active Bodies"
            value={liveTracks}
            sub={`${tracks.length - liveTracks} ghosted`}
            tone="cyan"
          />
          <KPI
            icon={<DoorOpen className="w-3.5 h-3.5" />}
            label="Occupied Rooms"
            value={activeRooms}
            sub={`of ${house.floors[0].rooms.length}`}
            tone="violet"
          />
          <KPI
            icon={<Gauge className="w-3.5 h-3.5" />}
            label="Signal Quality"
            value={`${(health.sqi * 100).toFixed(0)}`}
            sub="SQI index"
            tone={health.sqi > 0.6 ? 'emerald' : health.sqi > 0.35 ? 'amber' : 'rose'}
            trend={sqiSeries}
          />
          <KPI
            icon={<Radio className="w-3.5 h-3.5" />}
            label="Pipeline"
            value={`${health.fps.toFixed(0)}`}
            sub={`fps · ${health.inferenceMs.toFixed(0)}ms`}
            tone="emerald"
          />
        </div>

        {/* 3D preview */}
        <Panel padding="none" className="col-span-12 lg:col-span-8 row-span-2 h-[460px] relative">
          <div className="absolute top-3 left-4 z-10 pointer-events-none">
            <div className="section-title">Realtime</div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-frost-50">Spatial Snapshot</h2>
              <Chip tone="emerald" dot>Live</Chip>
            </div>
          </div>
          <Link
            to="/live"
            className="absolute top-3 right-4 z-10 inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-accent-cyan bg-accent-cyan/5 border border-accent-cyan/30 rounded-md hover:bg-accent-cyan/10"
          >
            Enter Live Map <ArrowRight className="w-3 h-3" />
          </Link>
          <div className="absolute inset-0 rounded-[10px] overflow-hidden">
            <Scene embedded />
          </div>
        </Panel>

        {/* Right column: rooms + events */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <Panel padding="none">
            <div className="px-4 pt-3 pb-2 border-b border-white/[0.04]">
              <div className="section-title">Spatial Activity</div>
              <div className="text-[13px] font-semibold text-frost-50">Room Occupancy</div>
            </div>
            <div className="px-2 py-2">
              {house.floors[0].rooms.map((room) => {
                const p = ROOM_PALETTE[room.kind];
                const occ = avatars.filter((a) => a.roomId === room.id).length;
                return (
                  <div key={room.id} className="flex items-center gap-2 h-7 px-2 rounded">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.accent, boxShadow: `0 0 5px ${p.accent}` }} />
                    <span className="text-[11.5px] text-frost-200 flex-1 truncate">{room.name}</span>
                    <div className="flex-1 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ width: `${Math.min(100, occ * 60)}%`, background: p.accent, boxShadow: `0 0 6px ${p.accent}80` }}
                      />
                    </div>
                    <span className="text-[10.5px] font-mono text-frost-400 w-5 text-right">{occ}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* System status */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <SystemStatusPanel />
        </div>

        {/* Event feed */}
        <div className="col-span-12 lg:col-span-8">
          <Panel padding="none">
            <PanelHeader
              className="px-4 pt-3"
              title="Event Stream"
              eyebrow="Activity"
              trailing={<Chip tone="muted">{events.length} total</Chip>}
            />
            <EventFeedMini />
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

function KPI({
  icon, label, value, sub, tone, trend,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
  tone: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet';
  trend?: number[];
}) {
  const toneClass = {
    cyan: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25',
    emerald: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/25',
    amber: 'text-accent-amber bg-accent-amber/10 border-accent-amber/25',
    rose: 'text-accent-rose bg-accent-rose/10 border-accent-rose/25',
    violet: 'text-accent-violet bg-accent-violet/10 border-accent-violet/25',
  }[tone];

  return (
    <Panel padding="md">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded border flex items-center justify-center ${toneClass}`}>{icon}</div>
            <span className="section-title">{label}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="metric-value text-2xl leading-none text-frost-50">{value}</span>
            {sub && <span className="text-[10.5px] text-frost-400">{sub}</span>}
          </div>
        </div>
        {trend && (
          <div className={`${toneClass.split(' ')[0]} -mt-1`}>
            <Sparkline values={trend} width={80} height={28} />
          </div>
        )}
      </div>
    </Panel>
  );
}

function EventFeedMini() {
  const events = useSensing((s) => s.events).slice(0, 6);
  if (!events.length)
    return (
      <div className="px-4 py-10 text-center text-[11px] text-frost-500">
        No recent events.
      </div>
    );
  return (
    <div>
      {events.map((e) => (
        <div key={e.id} className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.03] last:border-b-0">
          <Activity className="w-3 h-3 text-accent-cyan flex-shrink-0" />
          <span className="text-[11.5px] text-frost-200 flex-1 truncate">{e.message}</span>
          <span className="text-[10px] font-mono text-frost-500">{new Date(e.ts).toLocaleTimeString(undefined, { hour12: false })}</span>
        </div>
      ))}
    </div>
  );
}
