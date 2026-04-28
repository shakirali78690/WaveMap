import React from 'react';
import { Html } from '@react-three/drei';
import { useHouseStore } from '../store/houseStore';
import { useEntityStore } from '../store/entityStore';

export function SpatialLabels() {
  const house = useHouseStore(s => s.house);
  const activeFloorId = useHouseStore(s => s.activeFloorId);
  const selectedRoomId = useHouseStore(s => s.selectedRoomId);
  const getEntitiesInRoom = useEntityStore(s => s.getEntitiesInRoom);

  const floor = house.floors.find(f => f.id === activeFloorId);
  if (!floor) return null;

  return (
    <group>
      {floor.rooms.map(room => {
        const entityCount = getEntitiesInRoom(room.id).length;
        const isSelected = selectedRoomId === room.id;
        return (
          <Html
            key={room.id}
            position={[room.center.x, 0.1, room.center.y]}
            center
            distanceFactor={12}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
              padding: '4px 10px', borderRadius: '6px',
              background: isSelected ? 'rgba(56,189,248,0.15)' : 'rgba(10,13,20,0.75)',
              border: `1px solid ${isSelected ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.08)'}`,
              backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
            }}>
              <span style={{
                fontSize: '10px', fontWeight: 600, color: isSelected ? '#7dd3fc' : '#8b92a5',
                fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {room.name}
              </span>
              {entityCount > 0 && (
                <span style={{
                  fontSize: '9px', color: '#34d399', fontFamily: 'JetBrains Mono, monospace',
                  display: 'flex', alignItems: 'center', gap: '3px',
                }}>
                  <span style={{
                    width: '5px', height: '5px', borderRadius: '50%', background: '#34d399',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }} />
                  {entityCount} {entityCount === 1 ? 'person' : 'people'}
                </span>
              )}
            </div>
          </Html>
        );
      })}
    </group>
  );
}
