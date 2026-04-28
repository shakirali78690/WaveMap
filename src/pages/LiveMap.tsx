import { motion } from 'framer-motion';
import { Scene } from '@/components/scene/Scene';
import { SceneHUD } from '@/components/scene/SceneHUD';
import { SystemStatusPanel } from '@/components/panels/SystemStatusPanel';
import { EventFeedPanel } from '@/components/panels/EventFeedPanel';
import { EntityDetailsPanel } from '@/components/panels/EntityDetailsPanel';
import { RoomLegendPanel } from '@/components/panels/RoomLegendPanel';
import { ScenarioSwitcher } from '@/components/panels/ScenarioSwitcher';
import { useSensing } from '@/stores/sensingStore';
import { cn } from '@/lib/cn';

export function LiveMapPage() {
  const drawerOpen = useSensing((s) => s.drawerOpen);
  const fullscreen = useSensing((s) => s.fullscreen);

  return (
    <div className="absolute inset-0 flex">
      {/* Viewport */}
      <div className="relative flex-1 min-w-0">
        <Scene />
        <SceneHUD />
      </div>

      {/* Drawer */}
      {!fullscreen && drawerOpen && (
        <motion.aside
          initial={{ x: 12, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 12, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'w-drawer flex-shrink-0 overflow-y-auto border-l border-white/[0.04]',
            'bg-ink-900/60 backdrop-blur-xl p-3 space-y-3'
          )}
        >
          <ScenarioSwitcher />
          <EntityDetailsPanel />
          <RoomLegendPanel />
          <SystemStatusPanel />
          <EventFeedPanel max={8} />
        </motion.aside>
      )}
    </div>
  );
}
