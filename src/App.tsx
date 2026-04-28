import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Shell } from './components/layout/Shell';
import { OverviewPage } from './pages/Overview';
import { LiveMapPage } from './pages/LiveMap';
import { PlaybackPage } from './pages/Playback';
import { EntitiesPage } from './pages/Entities';
import { RoomsPage } from './pages/Rooms';
import { AnalyticsPage } from './pages/Analytics';
import { CalibratePage } from './pages/Calibrate';
import { DevicePage } from './pages/Device';
import { SettingsPage } from './pages/Settings';
import { useSensing } from './stores/sensingStore';

export default function App() {
  const startMock = useSensing((s) => s.startMock);
  const stop = useSensing((s) => s.stop);
  const connected = useSensing((s) => s.connected);

  // Auto-start the mock pipeline on mount so the app feels "live" immediately.
  useEffect(() => {
    if (!connected) startMock();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Shell>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<Navigate to="/overview" replace />} />
          <Route path="/overview" element={<OverviewPage />} />
          <Route path="/live" element={<LiveMapPage />} />
          <Route path="/playback" element={<PlaybackPage />} />
          <Route path="/entities" element={<EntitiesPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/calibrate" element={<CalibratePage />} />
          <Route path="/device" element={<DevicePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Routes>
      </AnimatePresence>
    </Shell>
  );
}
