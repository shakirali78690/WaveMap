import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Command, Search, ArrowRight } from 'lucide-react';
import { useSensing, SCENARIOS } from '@/stores/sensingStore';
import type { CameraPreset } from '@/data/types';
import { cn } from '@/lib/cn';

interface Action {
  id: string;
  group: string;
  label: string;
  hint?: string;
  run: () => void;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const setScenario = useSensing((s) => s.setScenario);
  const setCamera = useSensing((s) => s.setCamera);
  const toggleTheme = useSensing((s) => s.toggleTheme);
  const toggleFullscreen = useSensing((s) => s.toggleFullscreen);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const actions = useMemo<Action[]>(() => {
    const nav = [
      ['/overview', 'Overview'],
      ['/live', 'Live Map'],
      ['/playback', 'Playback'],
      ['/entities', 'Entities'],
      ['/rooms', 'Rooms'],
      ['/analytics', 'Analytics'],
      ['/calibrate', 'Calibrate'],
      ['/device', 'Device'],
      ['/settings', 'Settings'],
    ] as const;

    const cams: CameraPreset[] = ['isometric', 'top', 'orbit', 'first-person', 'cinematic'];

    return [
      ...nav.map(([path, label]) => ({
        id: `nav:${path}`,
        group: 'Go to',
        label,
        hint: path,
        run: () => navigate(path),
      })),
      ...SCENARIOS.map((s) => ({
        id: `scenario:${s.id}`,
        group: 'Scenario',
        label: s.label,
        hint: s.description,
        run: () => setScenario(s.id),
      })),
      ...cams.map((c) => ({
        id: `cam:${c}`,
        group: 'Camera',
        label: `Camera · ${c}`,
        run: () => setCamera(c),
      })),
      { id: 'cmd:theme', group: 'Appearance', label: 'Toggle theme', run: toggleTheme },
      { id: 'cmd:fullscreen', group: 'Appearance', label: 'Toggle fullscreen', run: toggleFullscreen },
    ];
  }, [navigate, setScenario, setCamera, toggleTheme, toggleFullscreen]);

  const filtered = useMemo(() => {
    if (!query) return actions;
    const q = query.toLowerCase();
    return actions.filter((a) =>
      a.label.toLowerCase().includes(q) ||
      a.group.toLowerCase().includes(q) ||
      a.hint?.toLowerCase().includes(q)
    );
  }, [actions, query]);

  const grouped = useMemo(() => {
    const m = new Map<string, Action[]>();
    for (const a of filtered) {
      const arr = m.get(a.group) ?? [];
      arr.push(a);
      m.set(a.group, arr);
    }
    return Array.from(m.entries());
  }, [filtered]);

  const run = (a: Action) => { a.run(); setOpen(false); setQuery(''); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="w-[540px] max-w-[94vw] panel-raised shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden"
            initial={{ y: -14, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 h-11 px-3 border-b border-white/[0.05]">
              <Search className="w-4 h-4 text-frost-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, scenarios, views…"
                className="flex-1 bg-transparent outline-none text-[13px] text-frost-50 placeholder:text-frost-500"
              />
              <span className="kbd">ESC</span>
            </div>
            <div className="max-h-[52vh] overflow-y-auto py-2">
              {grouped.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-frost-500">No matches</div>
              )}
              {grouped.map(([group, items]) => (
                <div key={group} className="py-1">
                  <div className="px-3 py-1 text-[9.5px] font-semibold uppercase tracking-[0.12em] text-frost-500">
                    {group}
                  </div>
                  {items.map((a) => (
                    <button
                      key={a.id}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-1.5 text-left',
                        'text-[12.5px] text-frost-100 hover:bg-white/[0.04] hover:text-frost-50'
                      )}
                      onClick={() => run(a)}
                    >
                      <Command className="w-3.5 h-3.5 text-frost-500 flex-shrink-0" />
                      <span className="flex-1 truncate">{a.label}</span>
                      {a.hint && <span className="text-[10.5px] text-frost-500 truncate">{a.hint}</span>}
                      <ArrowRight className="w-3.5 h-3.5 text-frost-500" />
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="h-8 px-3 flex items-center justify-between border-t border-white/[0.05] text-[10.5px] text-frost-500">
              <span>WaveMap · Command Palette</span>
              <span className="flex items-center gap-1">
                <span className="kbd">↑</span><span className="kbd">↓</span> navigate · <span className="kbd">↵</span> run
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
