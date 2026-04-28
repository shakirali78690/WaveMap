import { useState, useRef, useEffect } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import { Scene } from '@/components/scene/Scene';
import { Segmented } from '@/components/ui/Segmented';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';
import { useSensing } from '@/stores/sensingStore';
import { cn } from '@/lib/cn';

type Speed = '0.25x' | '0.5x' | '1x' | '2x' | '4x';

/**
 * Playback uses the live mock pipeline as a simulated "recording"
 * since real recordings come from the backend. The scrubber shows
 * a timeline of recent frames.
 */
export function PlaybackPage() {
  const [speed, setSpeed] = useState<Speed>('1x');
  const [playing, setPlaying] = useState(true);
  const [position, setPosition] = useState(1); // 0..1 along the recent window
  const events = useSensing((s) => s.events).slice(0, 40);
  const tracks = useSensing((s) => s.tracks);
  const currentFrame = useSensing((s) => s.currentFrame);
  const scrubberRef = useRef<HTMLDivElement>(null);

  // Auto-advance when playing
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setPosition(1), 400);
    return () => clearInterval(id);
  }, [playing]);

  const startTs = currentFrame ? currentFrame.ts - 60_000 : Date.now() - 60_000;
  const windowMs = 60_000;

  const handleScrub = (clientX: number) => {
    if (!scrubberRef.current) return;
    const r = scrubberRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(r.width, clientX - r.left));
    setPosition(x / r.width);
    setPlaying(false);
  };

  return (
    <PageShell padded={false}>
      <div className="absolute inset-0 flex flex-col">
        {/* Viewport */}
        <div className="flex-1 relative min-h-0">
          <Scene />
          <div className="absolute top-4 left-4 pointer-events-none">
            <div className="section-title">Forensics</div>
            <div className="flex items-center gap-2">
              <h2 className="text-[14px] font-semibold text-frost-50">Playback</h2>
              <Chip tone={playing ? 'emerald' : 'muted'} dot={playing}>
                {playing ? 'Playing' : 'Paused'}
              </Chip>
              <Chip tone="muted" mono>{speed}</Chip>
            </div>
          </div>
        </div>

        {/* Timeline bar */}
        <div className="flex-shrink-0 border-t border-white/[0.04] bg-ink-900/80 backdrop-blur-xl px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            {/* Transport */}
            <div className="flex items-center gap-1">
              <TransportBtn onClick={() => setPosition(0)} aria="Seek start"><SkipBack className="w-3.5 h-3.5" /></TransportBtn>
              <TransportBtn onClick={() => setPosition(Math.max(0, position - 0.1))} aria="Back 10%"><Rewind className="w-3.5 h-3.5" /></TransportBtn>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="w-9 h-8 flex items-center justify-center rounded-md bg-accent-cyan text-ink-950 hover:bg-accent-cyan/90 transition-colors"
                aria-label="Play/Pause"
              >
                {playing ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
              <TransportBtn onClick={() => setPosition(Math.min(1, position + 0.1))} aria="Forward 10%"><FastForward className="w-3.5 h-3.5" /></TransportBtn>
              <TransportBtn onClick={() => setPosition(1)} aria="Seek end"><SkipForward className="w-3.5 h-3.5" /></TransportBtn>
            </div>

            <div className="h-6 w-px bg-white/10" />

            <Segmented
              size="xs"
              value={speed}
              onChange={setSpeed}
              options={[
                { value: '0.25x', label: '0.25×' },
                { value: '0.5x',  label: '0.5×'  },
                { value: '1x',    label: '1×'    },
                { value: '2x',    label: '2×'    },
                { value: '4x',    label: '4×'    },
              ]}
            />

            <div className="flex-1" />

            <div className="flex items-center gap-3 text-[10.5px] font-mono text-frost-400">
              <span>{formatTs(startTs + position * windowMs)}</span>
              <span className="text-frost-600">/</span>
              <span>{formatTs(startTs + windowMs)}</span>
            </div>
          </div>

          {/* Scrub bar */}
          <div
            ref={scrubberRef}
            className="relative h-12 rounded-md bg-black/30 border border-white/[0.04] overflow-hidden cursor-pointer"
            onMouseDown={(e) => handleScrub(e.clientX)}
            onMouseMove={(e) => e.buttons === 1 && handleScrub(e.clientX)}
          >
            {/* Track waveform — substitute: confidence histogram per track */}
            <div className="absolute inset-y-2 inset-x-0 flex items-end gap-[2px] px-1">
              {tracks[0]?.history.slice(-80).map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-accent-cyan/30 rounded-sm"
                  style={{ height: `${Math.max(6, h.confidence * 100)}%` }}
                />
              ))}
            </div>

            {/* Event markers */}
            {events.map((e) => {
              const rel = (e.ts - startTs) / windowMs;
              if (rel < 0 || rel > 1) return null;
              return (
                <div
                  key={e.id}
                  className={cn(
                    'absolute top-0 bottom-0 w-px',
                    e.severity === 'warn' ? 'bg-accent-amber/80'
                    : e.severity === 'critical' ? 'bg-accent-rose/80'
                    : 'bg-accent-cyan/60'
                  )}
                  style={{ left: `${rel * 100}%` }}
                  title={e.message}
                />
              );
            })}

            {/* Playhead */}
            <div className="absolute inset-y-0 flex flex-col items-center" style={{ left: `calc(${position * 100}% - 1px)` }}>
              <div className="w-0.5 h-full bg-accent-cyan shadow-[0_0_8px_rgba(56,227,255,0.7)]" />
              <div className="absolute -top-1 w-2.5 h-2.5 rounded-full bg-accent-cyan border border-white/30" />
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] text-frost-500">
            <span>Session · mock simulator · {events.length} events</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-1 bg-accent-cyan/60" />info</span>
              <span className="flex items-center gap-1"><span className="w-2 h-1 bg-accent-amber/80" />warn</span>
              <span className="flex items-center gap-1"><span className="w-2 h-1 bg-accent-rose/80" />critical</span>
            </span>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function TransportBtn({ children, onClick, aria }: { children: React.ReactNode; onClick: () => void; aria: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      className="w-8 h-8 flex items-center justify-center rounded-md bg-white/[0.03] border border-white/[0.06] text-frost-300 hover:text-frost-50 hover:border-white/[0.12]"
    >
      {children}
    </button>
  );
}

function formatTs(ms: number) {
  return new Date(ms).toLocaleTimeString(undefined, { hour12: false });
}
