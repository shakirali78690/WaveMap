import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface MetricProps {
  label: string;
  value: ReactNode;
  suffix?: string;
  trend?: 'up' | 'down' | 'flat';
  tone?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose';
  sub?: ReactNode;
  className?: string;
}

const toneMap: Record<NonNullable<MetricProps['tone']>, string> = {
  default: 'text-frost-50',
  cyan: 'text-accent-cyan',
  emerald: 'text-accent-emerald',
  amber: 'text-accent-amber',
  rose: 'text-accent-rose',
};

export function Metric({ label, value, suffix, tone = 'default', sub, className }: MetricProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="metric-label">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={cn('metric-value text-lg leading-none', toneMap[tone])}>{value}</span>
        {suffix && <span className="text-[10px] text-frost-400 tracking-wide uppercase">{suffix}</span>}
      </div>
      {sub && <div className="text-[10.5px] text-frost-400">{sub}</div>}
    </div>
  );
}
