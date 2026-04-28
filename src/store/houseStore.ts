import { create } from 'zustand';
import { House, Floor, Room } from '../types/house';
import { demoHouse } from '../data/demoHouse';

interface HouseState {
  house: House;
  activeFloorId: string;
  selectedRoomId: string | null;
  hoveredRoomId: string | null;
  setHouse: (house: House) => void;
  setActiveFloor: (floorId: string) => void;
  selectRoom: (roomId: string | null) => void;
  hoverRoom: (roomId: string | null) => void;
  getActiveFloor: () => Floor | undefined;
  getRoom: (roomId: string) => Room | undefined;
  getRoomsByFloor: (floorId: string) => Room[];
}

export const useHouseStore = create<HouseState>((set, get) => ({
  house: demoHouse,
  activeFloorId: demoHouse.floors[0]?.id || '',
  selectedRoomId: null,
  hoveredRoomId: null,
  setHouse: (house) => set({ house, activeFloorId: house.floors[0]?.id || '' }),
  setActiveFloor: (floorId) => set({ activeFloorId: floorId }),
  selectRoom: (roomId) => set({ selectedRoomId: roomId }),
  hoverRoom: (roomId) => set({ hoveredRoomId: roomId }),
  getActiveFloor: () => {
    const { house, activeFloorId } = get();
    return house.floors.find(f => f.id === activeFloorId);
  },
  getRoom: (roomId) => {
    const { house } = get();
    for (const floor of house.floors) {
      const room = floor.rooms.find(r => r.id === roomId);
      if (room) return room;
    }
    return undefined;
  },
  getRoomsByFloor: (floorId) => {
    const { house } = get();
    return house.floors.find(f => f.id === floorId)?.rooms || [];
  },
}));
