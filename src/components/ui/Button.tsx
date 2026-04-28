import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'xs' | 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

const sizeMap: Record<Size, string> = {
  xs: 'h-6 px-2 text-2xs gap-1 rounded-[5px]',
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-8 px-3 text-[12.5px] gap-2 rounded-md',
};

const variantMap: Record<Variant, string> = {
  primary:
    'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 hover:bg-accent-cyan/15 hover:border-accent-cyan/45 active:bg-accent-cyan/20 shadow-[0_0_0_1px_rgba(56,227,255,0.08)_inset]',
  secondary:
    'bg-ink-800 text-frost-100 border border-white/[0.06] hover:bg-ink-750 hover:border-white/[0.1] active:bg-ink-700',
  ghost:
    'text-frost-200 hover:text-frost-50 hover:bg-white/[0.04] border border-transparent',
  danger:
    'bg-accent-rose/10 text-accent-rose border border-accent-rose/30 hover:bg-accent-rose/15',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'sm', className, children, iconLeft, iconRight, loading, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium select-none',
        'transition-[background,border-color,color] duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan/60',
        sizeMap[size],
        variantMap[variant],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-3 w-3 rounded-full border border-current border-t-transparent animate-spin" />
      ) : iconLeft}
      <span className="truncate">{children}</span>
      {iconRight}
    </button>
  );
});
