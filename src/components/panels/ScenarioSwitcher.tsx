import { useSensing, SCENARIOS } from '@/stores/sensingStore';
import { Panel } from '@/components/ui/Panel';
import { cn } from '@/lib/cn';
import { Play, RefreshCw } from 'lucide-react';

export function ScenarioSwitcher() {
  const scenario = useSensing((s) => s.scenario);
  const setScenario = useSensing((s) => s.setScenario);
  const connected = useSensing((s) => s.connected);
  const startMock = useSensing((s) => s.startMock);
  const stop = useSensing((s) => s.stop);

  return (
    <Panel padding="none">
      <div className="px-4 pt-3 pb-2 border-b border-white/[0.04] flex items-center justify-between">
        <div>
          <div className="section-title">Session</div>
          <div className="text-[13px] font-semibold text-frost-50">Scenario</div>
        </div>
        <button
          onClick={() => { stop(); setTimeout(startMock, 60); }}
          className="inline-flex items-center gap-1.5 h-6 px-2 rounded-[5px] text-[10.5px] text-frost-300 hover:text-frost-50 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12]"
          title="Restart session"
        >
          <RefreshCw className="w-3 h-3" />
          Restart
        </button>
      </div>
      <div className="px-2 py-2">
        {SCENARIOS.map((s) => {
          const active = scenario === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setScenario(s.id)}
              className={cn(
                'w-full text-left flex items-start gap-2.5 px-2.5 py-2 rounded-md transition-colors',
                active
                  ? 'bg-accent-cyan/[0.07] border border-accent-cyan/30'
                  : 'border border-transparent hover:bg-white/[0.02]'
              )}
            >
              <span className={cn(
                'mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center',
                active
                  ? 'bg-accent-cyan/15 text-accent-cyan'
                  : 'bg-white/[0.03] text-frost-500'
              )}>
                {active ? <Play className="w-2 h-2 fill-current" /> : <span className="w-1 h-1 rounded-full bg-frost-500" />}
              </span>
              <div className="flex-1 min-w-0">
                <div className={cn('text-[12px] font-medium', active ? 'text-frost-50' : 'text-frost-200')}>{s.label}</div>
                <div className="text-[10.5px] text-frost-500 leading-snug mt-0.5">{s.description}</div>
              </div>
              <span className="text-[9.5px] font-mono text-frost-500 mt-1">{s.occupants}p</span>
            </button>
          );
        })}
      </div>
      {!connected && (
        <div className="px-4 pb-3 text-[10.5px] text-frost-500">
          Pipeline paused. <button className="text-accent-cyan hover:underline" onClick={startMock}>Start</button>
        </div>
      )}
    </Panel>
  );
}
