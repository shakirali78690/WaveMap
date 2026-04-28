import { cn } from '@/lib/cn';

interface SegmentedProps<T extends string> {
  value: T;
  options: Array<{ value: T; label: string; icon?: React.ReactNode; disabled?: boolean }>;
  onChange: (v: T) => void;
  size?: 'xs' | 'sm';
  className?: string;
}

export function Segmented<T extends string>({ value, options, onChange, size = 'sm', className }: SegmentedProps<T>) {
  const h = size === 'xs' ? 'h-6' : 'h-7';
  const txt = size === 'xs' ? 'text-2xs' : 'text-xs';
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 p-0.5 rounded-md border border-white/[0.06] bg-ink-800',
        className
      )}
      role="tablist"
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 rounded-[5px] font-medium',
              'transition-colors duration-150',
              h,
              txt,
              active
                ? 'bg-white/[0.06] text-frost-50 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]'
                : 'text-frost-300 hover:text-frost-100 hover:bg-white/[0.025]',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
          >
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
