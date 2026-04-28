import { useLocation } from 'react-router-dom';
import { Moon, Sun, Command, Maximize2, Minimize2, Wifi, WifiOff, Signal } from 'lucide-react';
import { useSensing } from '@/stores/sensingStore';
import { StatusDot } from '@/components/ui/StatusDot';
import { cn } from '@/lib/cn';

const ROUTE_LABELS: Record<string, { eyebrow: string; title: string; subtitle: string }> = {
  '/overview':  { eyebrow: 'Situation', title: 'Overview',            subtitle: 'Executive snapshot of indoor motion intelligence.' },
  '/live':      { eyebrow: 'Realtime',  title: 'Live Map',            subtitle: 'Streaming detections, tracked bodies, and motion.' },
  '/playback':  { eyebrow: 'Forensics', title: 'Playback',            subtitle: 'Scrub recorded sessions with frame-accurate events.' },
  '/entities':  { eyebrow: 'Tracks',    title: 'Entities',            subtitle: 'Per-track motion histories and confidence profiles.' },
  '/rooms':     { eyebrow: 'Spatial',   title: 'Rooms',               subtitle: 'Occupancy, dwell, and transition analysis per room.' },
  '/analytics': { eyebrow: 'Analysis',  title: 'Analytics',           subtitle: 'Long-horizon trends, quality, and occupancy charts.' },
  '/calibrate': { eyebrow: 'Setup',     title: 'Calibration',         subtitle: 'Define house geometry, sensors, and detection zones.' },
  '/device':    { eyebrow: 'Hardware',  title: 'Device & Router',     subtitle: 'Backend adapter, signal source, and stream config.' },
  '/settings':  { eyebrow: 'Preferences', title: 'Settings',          subtitle: 'Quality, thresholds, privacy, theme, and exports.' },
};

export function TopBar() {
  const location = useLocation();
  const meta = ROUTE_LABELS[location.pathname] ?? ROUTE_LABELS['/overview'];
  const health = useSensing((s) => s.health);
  const connected = useSensing((s) => s.connected);
  const theme = useSensing((s) => s.theme);
  const toggleTheme = useSensing((s) => s.toggleTheme);
  const fullscreen = useSensing((s) => s.fullscreen);
  const toggleFullscreen = useSensing((s) => s.toggleFullscreen);

  const streamTone =
    health.streamState === 'open' ? 'emerald'
    : health.streamState === 'connecting' ? 'amber'
    : health.streamState === 'error' ? 'rose'
    : 'muted';

  return (
    <header className="h-topbar flex items-center gap-4 px-5 border-b border-white/[0.04] bg-ink-900/60 backdrop-blur-xl relative z-20">
      {/* Title */}
      <div className="flex flex-col leading-tight min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[9.5px] font-semibold tracking-[0.18em] text-frost-500 uppercase">{meta.eyebrow}</span>
          <span className="w-1 h-1 rounded-full bg-frost-500/50" />
          <span className="text-[10px] font-mono text-frost-400">
            {new Date().toLocaleTimeString(undefined, { hour12: false })}
          </span>
        </div>
        <h1 className="text-sm font-semibold text-frost-50 truncate">{meta.title}</h1>
      </div>

      <div className="hidden lg:block text-[11px] text-frost-400 max-w-md truncate">{meta.subtitle}</div>

      <div className="flex-1" />

      {/* Stream status */}
      <div className="flex items-center gap-3 pr-4 border-r border-white/[0.04]">
        <div className="flex items-center gap-2">
          <StatusDot tone={streamTone} pulsing={health.streamState === 'open'} />
          <span className="text-[10.5px] uppercase tracking-wider text-frost-300 font-medium">
            {health.streamState}
          </span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[10.5px] text-frost-400">
          <Signal className="w-3 h-3" />
          <span className="font-mono tabular-nums text-frost-200">SQI {(health.sqi * 100).toFixed(0)}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-[10.5px] text-frost-400">
          {connected ? <Wifi className="w-3 h-3 text-accent-cyan" /> : <WifiOff className="w-3 h-3 text-accent-rose" />}
          <span className="font-mono tabular-nums text-frost-200">{health.tracks} tracks</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 h-7 px-2.5 rounded-md border border-white/[0.06] bg-ink-800',
            'text-[11px] text-frost-300 hover:text-frost-50 hover:border-white/[0.12] transition-colors'
          )}
          title="Command Palette"
        >
          <Command className="w-3 h-3" />
          <span>Command</span>
          <span className="kbd">⌘K</span>
        </button>
        <button
          onClick={toggleTheme}
          className="w-7 h-7 rounded-md border border-white/[0.06] bg-ink-800 text-frost-300 hover:text-frost-50 hover:border-white/[0.12] flex items-center justify-center transition-colors"
          title={`Theme: ${theme}`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="w-7 h-7 rounded-md border border-white/[0.06] bg-ink-800 text-frost-300 hover:text-frost-50 hover:border-white/[0.12] flex items-center justify-center transition-colors"
          aria-label="Toggle fullscreen"
        >
          {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>
    </header>
  );
}
