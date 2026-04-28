import { useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import { Sparkline } from '@/components/ui/Sparkline';
import { useSensing } from '@/stores/sensingStore';
import { roomById } from '@/data/sampleHouse';
import type { ConfidenceBand, EntityTrack } from '@/data/types';
import { User, Activity, Clock, Compass, MapPin } from 'lucide-react';
import { cn } from '@/lib/cn';

const BAND_TONE: Record<ConfidenceBand, 'emerald' | 'amber' | 'rose' | 'muted'> = {
  high: 'emerald', medium: 'amber', low: 'rose', lost: 'muted',
};

export function EntitiesPage() {
  const tracks = useSensing((s) => s.tracks);
  const selected = useSensing((s) => s.selectedTrackId);
  const selectTrack = useSensing((s) => s.selectTrack);

  const active = useMemo(() => tracks.find((t) => t.id === selected) ?? tracks[0], [tracks, selected]);

  return (
    <PageShell>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-5">
          <Panel padding="none">
            <PanelHeader
              className="px-4 pt-3"
              title="All Tracks"
              eyebrow="Entities"
              trailing={<Chip tone="muted">{tracks.length} total</Chip>}
            />
            <div className="divide-y divide-white/[0.03]">
              {tracks.length === 0 && <div className="px-4 py-8 text-center text-[11px] text-frost-500">No active tracks.</div>}
              {tracks.map((t) => <TrackRow key={t.id} track={t} active={active?.id === t.id} onSelect={() => selectTrack(t.id)} />)}
            </div>
          </Panel>
        </div>

        <div className="col-span-12 lg:col-span-7">
          {active ? <TrackDetail track={active} /> : (
            <Panel padding="lg">
              <div className="text-[12px] text-frost-400">No track selected.</div>
            </Panel>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function TrackRow({ track, active, onSelect }: { track: EntityTrack; active: boolean; onSelect: () => void }) {
  const house = useSensing((s) => s.house);
  const room = roomById(house, track.roomId);
  const conf = track.latest?.confidence ?? 0;
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
        active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
      )}
    >
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-cyan/15 to-ink-700 border border-white/[0.06] flex items-center justify-center">
        <User className="w-3 h-3 text-accent-cyan" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-frost-50 font-mono">{track.id}</span>
          <Chip tone={BAND_TONE[track.band]} dot>{track.band}</Chip>
        </div>
        <div className="text-[10.5px] text-frost-500 mt-0.5">
          {room?.name ?? 'transit'} · {(conf * 100).toFixed(0)}% conf · {track.history.length} samples
        </div>
      </div>
      <div className="text-accent-cyan">
        <Sparkline values={track.history.map((h) => h.confidence * 100)} width={68} height={22} min={0} max={100} />
      </div>
    </button>
  );
}

function TrackDetail({ track }: { track: EntityTrack }) {
  const house = useSensing((s) => s.house);
  const room = roomById(house, track.roomId);
  const speed = track.latest ? Math.hypot(track.latest.velocity.x, track.latest.velocity.z) : 0;
  const heading = track.latest?.heading ?? 0;

  // Room transitions from history
  const transitions = useMemo(() => {
    const out: Array<{ ts: number; roomId?: string }> = [];
    let prev: string | undefined;
    for (const h of track.history) {
      if (h.roomId !== prev) out.push({ ts: h.ts, roomId: h.roomId });
      prev = h.roomId;
    }
    return out.slice(-8);
  }, [track.history]);

  return (
    <Panel padding="none">
      <div className="px-4 pt-3 pb-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent-cyan/10 border border-accent-cyan/25 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-accent-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-[14px] font-semibold text-frost-50">Entity · {track.id}</h2>
              <Chip tone={BAND_TONE[track.band]} dot>{track.band}</Chip>
            </div>
            <div className="text-[10.5px] text-frost-400">
              First seen {new Date(track.firstSeen).toLocaleTimeString(undefined, { hour12: false })} · {track.history.length} samples
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 px-4 py-4 border-b border-white/[0.04]">
        <Kpi icon={<Activity className="w-3 h-3" />} label="Confidence" value={`${((track.latest?.confidence ?? 0) * 100).toFixed(0)}%`} />
        <Kpi icon={<MapPin className="w-3 h-3" />} label="Room" value={room?.name ?? '—'} />
        <Kpi icon={<Compass className="w-3 h-3" />} label="Heading" value={`${((heading * 180) / Math.PI).toFixed(0)}°`} />
        <Kpi icon={<Clock className="w-3 h-3" />} label="Dwell" value={`${Math.floor(track.dwellMs / 1000)}s`} />
      </div>

      <div className="px-4 py-4 border-b border-white/[0.04]">
        <div className="flex items-center justify-between mb-2">
          <div className="section-title">Confidence · rolling 8s</div>
          <div className="text-[10px] font-mono text-frost-500">{speed.toFixed(2)} m/s current</div>
        </div>
        <div className="text-accent-cyan">
          <Sparkline values={track.history.map((h) => h.confidence * 100)} width={600} height={70} min={0} max={100} />
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="section-title mb-2">Recent Room Transitions</div>
        <div className="space-y-1">
          {transitions.length === 0 && <div className="text-[11px] text-frost-500">No transitions yet.</div>}
          {transitions.map((t, i) => (
            <div key={i} className="flex items-center gap-2 text-[11.5px]">
              <span className="font-mono text-frost-500 w-20">{new Date(t.ts).toLocaleTimeString(undefined, { hour12: false })}</span>
              <MapPin className="w-3 h-3 text-frost-500" />
              <span className="text-frost-100">{t.roomId ? (roomById(house, t.roomId)?.name ?? t.roomId) : 'transit'}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

function Kpi({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-frost-500">{icon}</span>
        <span className="section-title">{label}</span>
      </div>
      <div className="metric-value text-lg text-frost-50">{value}</div>
    </div>
  );
}
