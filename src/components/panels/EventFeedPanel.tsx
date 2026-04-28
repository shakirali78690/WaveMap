import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  DoorOpen,
  Eye,
  EyeOff,
  Radio,
  Users,
  Zap,
} from 'lucide-react';
import { useSensing } from '@/stores/sensingStore';
import { Panel } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import { cn } from '@/lib/cn';
import type { OccupancyEvent, OccupancyEventKind } from '@/data/types';
import { roomById } from '@/data/sampleHouse';

const KIND_META: Record<OccupancyEventKind, { label: string; Icon: any; tone: 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'muted' }> = {
  'motion-start':      { label: 'Motion',           Icon: Zap,          tone: 'cyan' },
  'motion-stop':       { label: 'Motion stopped',   Icon: EyeOff,       tone: 'muted' },
  'room-enter':        { label: 'Entered room',     Icon: DoorOpen,     tone: 'cyan' },
  'room-leave':        { label: 'Left room',        Icon: ArrowRight,   tone: 'muted' },
  'dwell':             { label: 'Dwelling',         Icon: Eye,          tone: 'violet' },
  'appeared':          { label: 'Acquired',         Icon: Eye,          tone: 'emerald' },
  'lost':              { label: 'Lost tracking',    Icon: AlertTriangle, tone: 'rose' },
  'reacquired':        { label: 'Reacquired',       Icon: Eye,          tone: 'emerald' },
  'multi-occupancy':   { label: 'Multi-occupancy',  Icon: Users,        tone: 'violet' },
  'unusual-path':      { label: 'Unusual path',     Icon: AlertTriangle, tone: 'amber' },
  'signal-drop':       { label: 'Signal drop',      Icon: Radio,        tone: 'amber' },
  'confidence-spike':  { label: 'Confidence spike', Icon: Zap,          tone: 'emerald' },
  'sensor-degraded':   { label: 'Sensor degraded',  Icon: AlertTriangle, tone: 'rose' },
};

export function EventFeedPanel({ max = 10 }: { max?: number }) {
  const events = useSensing((s) => s.events);
  const house = useSensing((s) => s.house);
  const clear = useSensing((s) => s.clearEvents);

  const items = events.slice(0, max);

  return (
    <Panel padding="none" className="flex flex-col">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/[0.04]">
        <div>
          <div className="section-title">Events</div>
          <div className="text-[13px] font-semibold text-frost-50">Recent Activity</div>
        </div>
        <button
          className="text-[10.5px] text-frost-400 hover:text-frost-100 transition-colors"
          onClick={clear}
        >
          Clear
        </button>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        {items.length === 0 && (
          <div className="px-4 py-10 text-center text-[11px] text-frost-500">
            Awaiting activity from sensing pipeline…
          </div>
        )}
        <AnimatePresence initial={false}>
          {items.map((ev) => (
            <EventRow key={ev.id} event={ev} roomName={roomById(house, ev.roomId)?.name} />
          ))}
        </AnimatePresence>
      </div>
    </Panel>
  );
}

function EventRow({ event, roomName }: { event: OccupancyEvent; roomName?: string }) {
  const meta = KIND_META[event.kind];
  const Icon = meta.Icon;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'flex items-start gap-2.5 px-4 py-2 border-b border-white/[0.03] last:border-b-0',
        'hover:bg-white/[0.015]'
      )}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          meta.tone === 'cyan' && 'bg-accent-cyan/10 text-accent-cyan',
          meta.tone === 'emerald' && 'bg-accent-emerald/10 text-accent-emerald',
          meta.tone === 'amber' && 'bg-accent-amber/10 text-accent-amber',
          meta.tone === 'rose' && 'bg-accent-rose/10 text-accent-rose',
          meta.tone === 'violet' && 'bg-accent-violet/10 text-accent-violet',
          meta.tone === 'muted' && 'bg-white/[0.04] text-frost-400',
        )}
      >
        <Icon className="w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-frost-100">{meta.label}</span>
          {event.trackId && <Chip tone="muted" mono>{event.trackId}</Chip>}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10.5px] text-frost-400">
          {roomName && <><span>{roomName}</span><span>·</span></>}
          <span className="font-mono">{new Date(event.ts).toLocaleTimeString(undefined, { hour12: false })}</span>
        </div>
      </div>
    </motion.div>
  );
}
