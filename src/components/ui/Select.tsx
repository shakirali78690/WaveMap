import { cn } from '@/lib/cn';
import { ChevronDown } from 'lucide-react';

interface SelectProps<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }>;
  label?: string;
  className?: string;
}

export function Select<T extends string>({ value, onChange, options, label, className }: SelectProps<T>) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && <span className="section-title">{label}</span>}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={cn(
            'w-full h-8 pl-3 pr-8 appearance-none',
            'text-xs text-frost-100 font-medium',
            'bg-ink-800 border border-white/[0.06] rounded-md',
            'hover:border-white/[0.12] focus:outline-none focus:border-accent-cyan/60',
            'transition-colors duration-150'
          )}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink-800 text-frost-100">
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-frost-400 pointer-events-none" />
      </div>
    </div>
  );
}
