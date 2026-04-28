import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: ReactNode;
  sub?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, label, sub, disabled, className }: ToggleProps) {
  return (
    <label
      className={cn(
        'flex items-start gap-3 cursor-pointer select-none group',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative flex-shrink-0 mt-0.5 w-8 h-4 rounded-full border transition-colors duration-200',
          checked
            ? 'bg-accent-cyan/15 border-accent-cyan/50'
            : 'bg-white/[0.03] border-white/[0.1]'
        )}
      >
        <span
          className={cn(
            'absolute top-[1px] w-3 h-3 rounded-full transition-[left,background] duration-200',
            checked
              ? 'left-[15px] bg-accent-cyan shadow-[0_0_8px_rgba(56,227,255,0.6)]'
              : 'left-[1px] bg-frost-300'
          )}
        />
      </button>
      {(label || sub) && (
        <div className="flex flex-col gap-0.5 min-w-0">
          {label && <span className="text-xs font-medium text-frost-100 group-hover:text-frost-50">{label}</span>}
          {sub && <span className="text-[10.5px] text-frost-400 leading-snug">{sub}</span>}
        </div>
      )}
    </label>
  );
}
