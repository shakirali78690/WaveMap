import { useSensing } from '@/stores/sensingStore';
import { Panel } from '@/components/ui/Panel';
import { Chip } from '@/components/ui/Chip';
import { Sparkline } from '@/components/ui/Sparkline';
import { useEffect, useRef, useState } from 'react';

export function SystemStatusPanel() {
  const health = useSensing((s) => s.health);
  const currentFrame = useSensing((s) => s.currentFrame);

  const [fpsSeries, setFpsSeries] = useState<number[]>([]);
  const [pktSeries, setPktSeries] = useState<number[]>([]);
  const [latSeries, setLatSeries] = useState<number[]>([]);
  const [sqiSeries, setSqiSeries] = useState<number[]>([]);
  const last = useRef(0);

  useEffect(() => {
    if (!currentFrame) return;
    const now = currentFrame.ts;
    if (now - last.current < 200) return;
    last.current = now;
    setFpsSeries((p) => [...p.slice(-59), health.fps]);
    setPktSeries((p) => [...p.slice(-59), health.packetRate]);
    setLatSeries((p) => [...p.slice(-59), health.inferenceMs]);
    setSqiSeries((p) => [...p.slice(-59), health.sqi * 100]);
  }, [currentFrame, health]);

  const rows: Array<{
    label: string;
    value: string;
    sub: string;
    series: number[];
    tone: 'cyan' | 'emerald' | 'amber' | 'violet';
  }> = [
    { label: 'Render FPS',    value: health.fps.toFixed(1),         sub: 'rolling 60-frame avg',  series: fpsSeries, tone: 'cyan' },
    { label: 'Packets / s',   value: health.packetRate.toFixed(1),  sub: 'from sensing pipeline', series: pktSeries, tone: 'emerald' },
    { label: 'Inference Lat', value: `${health.inferenceMs.toFixed(0)}ms`, sub: 'end-to-end', series: latSeries, tone: 'amber' },
    { label: 'Signal Quality', value: `${(health.sqi * 100).toFixed(0)}`, sub: 'SQI index',    series: sqiSeries, tone: 'violet' },
  ];

  return (
    <Panel padding="none">
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/[0.04]">
        <div>
          <div className="section-title">Pipeline</div>
          <div className="text-[13px] font-semibold text-frost-50">System Status</div>
        </div>
        <Chip tone={health.streamState === 'open' ? 'emerald' : 'amber'} dot>
          {health.streamState}
        </Chip>
      </div>
      <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="metric-label">{r.label}</span>
              <span className="metric-value text-xs">{r.value}</span>
            </div>
            <div
              className={
                r.tone === 'cyan' ? 'text-accent-cyan' :
                r.tone === 'emerald' ? 'text-accent-emerald' :
                r.tone === 'amber' ? 'text-accent-amber' :
                'text-accent-violet'
              }
            >
              <Sparkline values={r.series} height={22} width={130} />
            </div>
            <div className="text-[10px] text-frost-500">{r.sub}</div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10.5px] text-frost-400">
        <div className="flex items-center gap-2">
          <span>Adapter</span>
          <span className="font-mono text-frost-200">{health.adapter}</span>
        </div>
        <div>
          <span className="font-mono">↑{formatUptime(health.uptime)}</span>
        </div>
      </div>
    </Panel>
  );
}

function formatUptime(s: number) {
  const mins = Math.floor(s / 60);
  const hours = Math.floor(mins / 60);
  if (hours > 0) return `${hours}h ${mins % 60}m`;
  if (mins > 0) return `${mins}m ${Math.floor(s % 60)}s`;
  return `${Math.floor(s)}s`;
}
