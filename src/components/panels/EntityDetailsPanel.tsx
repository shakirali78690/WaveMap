import { useMemo } from 'react';
import { useSensing } from '@/stores/sensingStore';
import { Panel } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import { Metric } from '@/components/ui/Metric';
import { Sparkline } from '@/components/ui/Sparkline';
import { roomById } from '@/data/sampleHouse';
import type { ConfidenceBand, EntityTrack } from '@/data/types';
import { User, Activity, Target, Clock, Compass, Gauge } from 'lucide-react';

const BAND_TONE: Record<ConfidenceBand, 'emerald' | 'amber' | 'rose' | 'muted'> = {
  high: 'emerald',
  medium: 'amber',
  low: 'rose',
  lost: 'muted',
};

export function EntityDetailsPanel() {
  const selectedId = useSensing((s) => s.selectedTrackId);
  const tracks = useSensing((s) => s.tracks);
  const house = useSensing((s) => s.house);
  const selectTrack = useSensing((s) => s.selectTrack);

  const track = useMemo(() => tracks.find((t) => t.id === selectedId) ?? tracks[0], [tracks, selectedId]);

  if (!track) {
    return (
      <Panel padding="md">
        <div className="section-title mb-2">Entity</div>
        <div className="text-[12px] text-frost-400">
          No tracks currently active. The sensing pipeline will populate this panel as entities are detected.
        </div>
      </Panel>
    );
  }

  const room = roomById(house, track.roomId);
  const conf = track.latest?.confidence ?? 0;
  const speed = track.latest ? Math.hypot(track.latest.velocity.x, track.latest.velocity.z) : 0;
  const heading = track.latest?.heading ?? 0;
  const confSeries = track.history.map((h) => h.confidence * 100);

  return (
    <Panel padding="none" className="flex flex-col">
      <div className="px-4 pt-3 pb-3 border-b border-white/[0.04] flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan/20 to-ink-700 border border-white/[0.08] flex items-center justify-center">
          <User className="w-3.5 h-3.5 text-accent-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[13px] font-semibold text-frost-50">Entity · {track.id}</span>
            <Chip tone={BAND_TONE[track.band]} dot>{track.band}</Chip>
          </div>
          <div className="text-[10.5px] text-frost-400">
            {room ? `${room.name} · ${track.dwellMs > 0 ? `${Math.floor(track.dwellMs / 1000)}s dwell` : 'just arrived'}` : 'Transit zone'}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 grid grid-cols-3 gap-3">
        <Metric
          label="Confidence"
          value={`${(conf * 100).toFixed(0)}`}
          suffix="%"
          tone={conf > 0.7 ? 'emerald' : conf > 0.45 ? 'amber' : 'rose'}
        />
        <Metric label="Speed" value={speed.toFixed(2)} suffix="m/s" />
        <Metric label="Heading" value={`${((heading * 180) / Math.PI).toFixed(0)}°`} />
      </div>

      <div className="px-4 pb-3">
        <div className="section-title mb-2">Confidence · 8s</div>
        <div className="text-accent-cyan">
          <Sparkline values={confSeries} width={280} height={40} min={0} max={100} />
        </div>
      </div>

      <div className="px-4 pb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
        <KV icon={<Target className="w-3 h-3" />} label="Position" value={track.latest ? `${track.latest.position.x.toFixed(2)}, ${track.latest.position.z.toFixed(2)}` : '—'} />
        <KV icon={<Clock className="w-3 h-3" />} label="First seen" value={new Date(track.firstSeen).toLocaleTimeString(undefined, { hour12: false })} />
        <KV icon={<Compass className="w-3 h-3" />} label="Heading" value={`${((heading * 180) / Math.PI).toFixed(1)}°`} />
        <KV icon={<Gauge className="w-3 h-3" />} label="Uncertainty" value={`${((track.latest?.uncertainty ?? 0) * 100).toFixed(0)}cm`} />
        <KV icon={<Activity className="w-3 h-3" />} label="Samples" value={`${track.history.length}`} />
        <KV icon={<User className="w-3 h-3" />} label="Pose data" value={track.latest?.pose ? 'available' : 'unavailable'} />
      </div>

      {tracks.length > 1 && (
        <div className="px-4 pb-3 pt-2 border-t border-white/[0.04]">
          <div className="section-title mb-2">Other tracks</div>
          <div className="flex flex-wrap gap-1.5">
            {tracks.filter((t) => t.id !== track.id).map((t) => (
              <button key={t.id} onClick={() => selectTrack(t.id)}>
                <Chip tone={BAND_TONE[t.band]} dot mono>{t.id}</Chip>
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

function KV({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-frost-500">{icon}</span>
      <span className="text-frost-500 w-20 flex-shrink-0">{label}</span>
      <span className="font-mono tabular-nums text-frost-100 truncate">{value}</span>
    </div>
  );
}
