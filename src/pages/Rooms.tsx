import { useMemo } from 'react';
import { PageShell } from '@/components/layout/PageShell';
import { Panel, PanelHeader } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import { Scene } from '@/components/scene/Scene';
import { useSensing } from '@/stores/sensingStore';
import { ROOM_PALETTE } from '@/data/sampleHouse';
import type { Room } from '@/data/types';
import { DoorOpen, Users, Clock, ArrowRightLeft } from 'lucide-react';
import { cn } from '@/lib/cn';

function polygonArea(poly: { x: number; y: number }[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];
    a += p1.x * p2.y - p2.x * p1.y;
  }
  return Math.abs(a) / 2;
}

export function RoomsPage() {
  const house = useSensing((s) => s.house);
  const selectedRoomId = useSensing((s) => s.selectedRoomId);
  const selectRoom = useSensing((s) => s.selectRoom);
  const avatars = useSensing((s) => s.avatars);
  const events = useSensing((s) => s.events);

  const selected = useMemo(
    () => house.floors[0].rooms.find((r) => r.id === selectedRoomId) ?? house.floors[0].rooms[0],
    [house, selectedRoomId]
  );

  return (
    <PageShell>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4 space-y-3">
          <Panel padding="none">
            <PanelHeader className="px-4 pt-3" title="Rooms" eyebrow="Spatial" />
            <div className="divide-y divide-white/[0.03]">
              {house.floors[0].rooms.map((room) => (
                <RoomListItem
                  key={room.id}
                  room={room}
                  active={selected?.id === room.id}
                  occ={avatars.filter((a) => a.roomId === room.id).length}
                  onSelect={() => selectRoom(room.id)}
                />
              ))}
            </div>
          </Panel>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-3">
          <Panel padding="none" className="h-[340px] relative overflow-hidden">
            <Scene embedded />
            <div className="absolute top-3 left-4 pointer-events-none">
              <div className="section-title">Viewport</div>
              <div className="text-[13px] font-semibold text-frost-50">{selected?.name}</div>
            </div>
          </Panel>

          {selected && <RoomDetail room={selected} />}

          <Panel padding="none">
            <PanelHeader
              className="px-4 pt-3"
              title="Room Events"
              eyebrow="Activity"
              trailing={<Chip tone="muted">{events.filter((e) => e.roomId === selected?.id).length}</Chip>}
            />
            <div className="divide-y divide-white/[0.03]">
              {events.filter((e) => e.roomId === selected?.id).slice(0, 10).map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2">
                  <span className="text-[11.5px] text-frost-100 flex-1 truncate">{e.message}</span>
                  <span className="text-[10px] font-mono text-frost-500">{new Date(e.ts).toLocaleTimeString(undefined, { hour12: false })}</span>
                </div>
              ))}
              {events.filter((e) => e.roomId === selected?.id).length === 0 && (
                <div className="px-4 py-6 text-center text-[11px] text-frost-500">No room-scoped events.</div>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}

function RoomListItem({ room, active, occ, onSelect }: { room: Room; active: boolean; occ: number; onSelect: () => void }) {
  const p = ROOM_PALETTE[room.kind];
  const area = polygonArea(room.polygon);
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
        active ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
      )}
    >
      <span
        className="w-2.5 h-2.5 rounded-sm flex-shrink-0 shadow-[0_0_8px_currentColor]"
        style={{ backgroundColor: p.accent, color: p.accent }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-frost-100 truncate">{room.name}</span>
          <span className="text-[9.5px] font-mono text-frost-500 uppercase tracking-wider">{p.label}</span>
        </div>
        <div className="text-[10.5px] text-frost-500 mt-0.5">{area.toFixed(1)}m² · {room.tag ?? '—'}</div>
      </div>
      <span
        className={cn(
          'flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[10px] font-mono',
          occ > 0 ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-white/[0.03] text-frost-500'
        )}
      >
        {occ}
      </span>
    </button>
  );
}

function RoomDetail({ room }: { room: Room }) {
  const avatars = useSensing((s) => s.avatars);
  const events = useSensing((s) => s.events);
  const occupants = avatars.filter((a) => a.roomId === room.id);
  const transitions = events.filter((e) => e.roomId === room.id && (e.kind === 'room-enter' || e.kind === 'room-leave')).length;

  const lastEnter = events.find((e) => e.kind === 'room-enter' && e.roomId === room.id);
  const p = ROOM_PALETTE[room.kind];

  return (
    <Panel padding="none">
      <div className="px-4 pt-3 pb-3 border-b border-white/[0.04] flex items-center gap-3">
        <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ backgroundColor: `${p.accent}18`, border: `1px solid ${p.accent}40` }}>
          <DoorOpen className="w-4 h-4" style={{ color: p.accent }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-frost-50">{room.name}</h3>
            <Chip tone="muted" mono>{room.id}</Chip>
          </div>
          <div className="text-[10.5px] text-frost-400">{room.tag ?? p.label}</div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 px-4 py-4">
        <RoomMetric icon={<Users className="w-3 h-3" />} label="Occupancy" value={`${occupants.length}`} />
        <RoomMetric icon={<ArrowRightLeft className="w-3 h-3" />} label="Transitions" value={`${transitions}`} />
        <RoomMetric icon={<Clock className="w-3 h-3" />} label="Last entry" value={lastEnter ? new Date(lastEnter.ts).toLocaleTimeString(undefined, { hour12: false }) : '—'} />
        <RoomMetric icon={<DoorOpen className="w-3 h-3" />} label="Kind" value={p.label} />
      </div>
    </Panel>
  );
}

function RoomMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1 text-frost-500">
        {icon}<span className="section-title">{label}</span>
      </div>
      <div className="metric-value text-lg text-frost-50">{value}</div>
    </div>
  );
}
