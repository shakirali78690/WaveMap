import { useSensing } from '@/stores/sensingStore';
import { Panel } from '@/components/ui/Panel';
import { ROOM_PALETTE } from '@/data/sampleHouse';
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

export function RoomLegendPanel() {
  const house = useSensing((s) => s.house);
  const selectedRoomId = useSensing((s) => s.selectedRoomId);
  const selectRoom = useSensing((s) => s.selectRoom);
  const avatars = useSensing((s) => s.avatars);

  return (
    <Panel padding="none">
      <div className="px-4 pt-3 pb-2 border-b border-white/[0.04]">
        <div className="section-title">Spatial</div>
        <div className="text-[13px] font-semibold text-frost-50">Rooms</div>
      </div>
      <div className="px-2 py-2">
        {house.floors[0].rooms.map((room) => {
          const palette = ROOM_PALETTE[room.kind];
          const occ = avatars.filter((a) => a.roomId === room.id).length;
          const area = polygonArea(room.polygon);
          const active = selectedRoomId === room.id;
          return (
            <button
              key={room.id}
              onClick={() => selectRoom(active ? undefined : room.id)}
              className={cn(
                'w-full flex items-center gap-2.5 h-9 px-2 rounded-md transition-colors',
                active
                  ? 'bg-white/[0.05] text-frost-50'
                  : 'text-frost-300 hover:text-frost-50 hover:bg-white/[0.02]'
              )}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: palette.accent, boxShadow: `0 0 6px ${palette.accent}60` }}
              />
              <span className="flex-1 text-left text-[12px] font-medium truncate">{room.name}</span>
              <span className="text-[10.5px] font-mono text-frost-500 flex-shrink-0">{area.toFixed(1)}m²</span>
              <span
                className={cn(
                  'flex-shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-mono',
                  occ > 0 ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-white/[0.03] text-frost-500'
                )}
              >
                {occ}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
