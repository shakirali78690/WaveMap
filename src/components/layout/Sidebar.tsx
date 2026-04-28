import { NavLink } from 'react-router-dom';
import {
  Gauge,
  Radio,
  PlayCircle,
  Users,
  DoorOpen,
  BarChart3,
  Target,
  Router,
  Settings,
  ChevronsLeft,
  ChevronsRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSensing } from '@/stores/sensingStore';

const NAV = [
  { to: '/overview',  label: 'Overview',   Icon: Gauge },
  { to: '/live',      label: 'Live Map',   Icon: Radio },
  { to: '/playback',  label: 'Playback',   Icon: PlayCircle },
  { to: '/entities',  label: 'Entities',   Icon: Users },
  { to: '/rooms',     label: 'Rooms',      Icon: DoorOpen },
  { to: '/analytics', label: 'Analytics',  Icon: BarChart3 },
  { to: '/calibrate', label: 'Calibrate',  Icon: Target },
  { to: '/device',    label: 'Device',     Icon: Router },
  { to: '/settings',  label: 'Settings',   Icon: Settings },
] as const;

export function Sidebar() {
  const collapsed = useSensing((s) => s.sidebarCollapsed);
  const toggleSidebar = useSensing((s) => s.toggleSidebar);
  const health = useSensing((s) => s.health);

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full border-r border-white/[0.04] bg-ink-900/80 backdrop-blur-xl',
        'transition-[width] duration-200 ease-out',
        collapsed ? 'w-sidebar-collapsed' : 'w-sidebar'
      )}
    >
      {/* Brand */}
      <div className="h-topbar flex items-center gap-2.5 px-3 border-b border-white/[0.04]">
        <div className="relative w-7 h-7 rounded-md overflow-hidden flex items-center justify-center bg-gradient-to-br from-ink-700 to-ink-850 border border-white/[0.06]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,227,255,0.5),transparent_60%)]" />
          <div className="absolute w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse-dot" />
          <svg className="absolute inset-0" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="11" fill="none" stroke="rgba(56,227,255,0.35)" strokeWidth="0.8" />
            <circle cx="14" cy="14" r="7"  fill="none" stroke="rgba(56,227,255,0.55)" strokeWidth="0.8" />
          </svg>
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0 leading-tight">
            <div className="text-[13px] font-semibold text-frost-50 tracking-tight">WaveMap</div>
            <div className="text-[9.5px] font-medium text-frost-400 uppercase tracking-[0.16em]">Spatial RF Intel</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 flex flex-col gap-0.5 overflow-y-auto">
        {NAV.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-2.5 h-8 rounded-md px-2',
                'text-[12px] font-medium transition-colors duration-150',
                isActive
                  ? 'text-frost-50 bg-white/[0.05]'
                  : 'text-frost-300 hover:text-frost-50 hover:bg-white/[0.03]'
              )
            }
            title={collapsed ? label : undefined}
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r transition-opacity',
                    isActive ? 'bg-accent-cyan opacity-100' : 'opacity-0'
                  )}
                />
                <Icon className={cn('w-[15px] h-[15px] flex-shrink-0', isActive ? 'text-accent-cyan' : 'text-frost-400 group-hover:text-frost-200')} />
                {!collapsed && <span className="truncate">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Live footer */}
      <div className="mx-2 mb-2 p-2.5 rounded-md border border-white/[0.05] bg-white/[0.015]">
        <div className="flex items-center gap-2 mb-1.5">
          <Activity className="w-3.5 h-3.5 text-accent-cyan" />
          {!collapsed && <span className="text-[10px] font-semibold text-frost-200 tracking-[0.12em] uppercase">Pipeline</span>}
        </div>
        {!collapsed ? (
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <div className="text-[9px] uppercase tracking-wider text-frost-500">FPS</div>
              <div className="font-mono tabular-nums text-[11px] text-frost-100">{health.fps.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-frost-500">Pkt/s</div>
              <div className="font-mono tabular-nums text-[11px] text-frost-100">{health.packetRate.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-frost-500">Lat</div>
              <div className="font-mono tabular-nums text-[11px] text-frost-100">{health.inferenceMs.toFixed(0)}ms</div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-wider text-frost-500">SQI</div>
              <div className="font-mono tabular-nums text-[11px] text-frost-100">{(health.sqi * 100).toFixed(0)}</div>
            </div>
          </div>
        ) : (
          <div className="text-[9px] font-mono text-frost-300 text-center">{health.fps.toFixed(0)}</div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        type="button"
        onClick={toggleSidebar}
        className="absolute -right-3 top-1/2 w-6 h-6 rounded-full flex items-center justify-center border border-white/[0.08] bg-ink-800 text-frost-400 hover:text-frost-100 hover:bg-ink-750 transition-colors"
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronsRight className="w-3 h-3" /> : <ChevronsLeft className="w-3 h-3" />}
      </button>
    </aside>
  );
}
