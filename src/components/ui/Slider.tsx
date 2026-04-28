import { cn } from '@/lib/cn';

interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label?: string;
  formatValue?: (v: number) => string;
  className?: string;
}

export function Slider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  label,
  formatValue,
  className,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || formatValue) && (
        <div className="flex items-center justify-between text-2xs">
          {label && <span className="section-title">{label}</span>}
          {formatValue && <span className="font-mono tabular-nums text-frost-200">{formatValue(value)}</span>}
        </div>
      )}
      <div className="relative h-5 flex items-center">
        <div className="absolute inset-x-0 h-1 rounded-full bg-white/[0.04] border border-white/[0.04]" />
        <div
          className="absolute h-1 rounded-full bg-accent-cyan/70 shadow-[0_0_10px_rgba(56,227,255,0.5)]"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          aria-label={label}
        />
        <div
          className="absolute w-3 h-3 rounded-full bg-frost-50 border border-white/30 shadow-[0_0_0_3px_rgba(56,227,255,0.15)] pointer-events-none"
          style={{ left: `calc(${pct}% - 6px)` }}
        />
      </div>
    </div>
  );
}
