import { cn } from '@/lib/cn';

interface StatusDotProps {
  tone?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'muted';
  size?: 'xs' | 'sm' | 'md';
  pulsing?: boolean;
  className?: string;
}

const toneMap = {
  emerald: 'bg-accent-emerald shadow-[0_0_8px_theme(colors.accent.emerald)]',
  amber: 'bg-accent-amber shadow-[0_0_8px_theme(colors.accent.amber)]',
  rose: 'bg-accent-rose shadow-[0_0_8px_theme(colors.accent.rose)]',
  cyan: 'bg-accent-cyan shadow-[0_0_8px_theme(colors.accent.cyan)]',
  muted: 'bg-frost-400',
};

const sizeMap = { xs: 'w-1 h-1', sm: 'w-1.5 h-1.5', md: 'w-2 h-2' };

export function StatusDot({ tone = 'emerald', size = 'sm', pulsing, className }: StatusDotProps) {
  return (
    <span className={cn('relative inline-flex items-center justify-center', className)}>
      {pulsing && (
        <span
          className={cn(
            'absolute inset-0 rounded-full opacity-60 animate-pulse-dot',
            toneMap[tone].split(' ')[0]
          )}
        />
      )}
      <span className={cn('rounded-full relative', sizeMap[size], toneMap[tone])} />
    </span>
  );
}
