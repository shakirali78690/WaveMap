import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'violet' | 'muted';

interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  mono?: boolean;
}

const toneMap: Record<Tone, string> = {
  neutral: 'text-frost-200 bg-white/[0.035] border-white/[0.06]',
  cyan: 'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/25',
  emerald: 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/25',
  amber: 'text-accent-amber bg-accent-amber/10 border-accent-amber/25',
  rose: 'text-accent-rose bg-accent-rose/10 border-accent-rose/25',
  violet: 'text-accent-violet bg-accent-violet/10 border-accent-violet/25',
  muted: 'text-frost-400 bg-white/[0.02] border-white/[0.04]',
};

const dotMap: Record<Tone, string> = {
  neutral: 'bg-frost-300',
  cyan: 'bg-accent-cyan',
  emerald: 'bg-accent-emerald',
  amber: 'bg-accent-amber',
  rose: 'bg-accent-rose',
  violet: 'bg-accent-violet',
  muted: 'bg-frost-400',
};

export function Chip({ tone = 'neutral', dot, icon, mono, className, children, ...rest }: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 h-5 rounded-full border text-[10.5px] font-medium whitespace-nowrap',
        mono && 'font-mono tabular-nums',
        toneMap[tone],
        className
      )}
      {...rest}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotMap[tone], tone !== 'muted' && 'shadow-[0_0_6px_currentColor]')} />}
      {icon}
      {children}
    </span>
  );
}
