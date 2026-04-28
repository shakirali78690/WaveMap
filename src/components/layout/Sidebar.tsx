import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Map, PlayCircle, Users, DoorOpen, BarChart3,
  Crosshair, Router, Settings, ChevronLeft, Radio
} from 'lucide-react';
import { useUIStore, AppPage } from '../../store/uiStore';
import { useSensingStore } from '../../store/sensingStore';
import './Sidebar.css';

const NAV_ITEMS: { id: AppPage; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'live-map', label: 'Live Map', icon: Map },
  { id: 'playback', label: 'Playback', icon: PlayCircle },
  { id: 'entities', label: 'Entities', icon: Users },
  { id: 'rooms', label: 'Rooms', icon: DoorOpen },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'calibration', label: 'Calibrate', icon: Crosshair },
  { id: 'device', label: 'Device', icon: Router },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const activePage = useUIStore(s => s.activePage);
  const collapsed = useUIStore(s => s.sidebarCollapsed);
  const setPage = useUIStore(s => s.setPage);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const connectionState = useSensingStore(s => s.health.connectionState);

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      animate={{ width: collapsed ? 56 : 240 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Radio size={20} />
        </div>
        {!collapsed && (
          <motion.span
            className="sidebar-logo-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            WaveMap
          </motion.span>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => {
          const isActive = activePage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setPage(item.id)}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  className="sidebar-nav-indicator"
                  layoutId="nav-indicator"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Connection status */}
      <div className="sidebar-footer">
        <div className={`sidebar-status ${connectionState}`}>
          <span className="sidebar-status-dot" />
          {!collapsed && (
            <span className="sidebar-status-text">
              {connectionState === 'connected' ? 'Sensing Active' :
               connectionState === 'connecting' ? 'Connecting...' :
               connectionState === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
            </span>
          )}
        </div>
        <button className="sidebar-collapse-btn" onClick={toggleSidebar}>
          <ChevronLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : 'none' }} />
        </button>
      </div>
    </motion.aside>
  );
}
