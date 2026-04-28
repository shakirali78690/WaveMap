import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  raised?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children?: ReactNode;
}

export function Panel({ raised, padding = 'md', className, children, ...rest }: PanelProps) {
  const pad = padding === 'none' ? '' : padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-5' : 'p-4';
  return (
    <div
      className={cn(
        raised ? 'panel-raised' : 'panel',
        'relative overflow-hidden',
        pad,
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  eyebrow?: string;
  trailing?: ReactNode;
}

export function PanelHeader({ title, eyebrow, trailing, className, ...rest }: PanelHeaderProps) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3 mb-3', className)}
      {...rest}
    >
      <div className="min-w-0">
        {eyebrow && <div className="section-title mb-0.5">{eyebrow}</div>}
        <h3 className="text-[13px] font-semibold text-frost-100 truncate">{title}</h3>
      </div>
      {trailing}
    </div>
  );
}

interface PanelTitleProps {
  children: ReactNode;
  eyebrow?: string;
}

export function PanelTitle({ children, eyebrow }: PanelTitleProps) {
  return (
    <div className="mb-2">
      {eyebrow && <div className="section-title mb-0.5">{eyebrow}</div>}
      <h3 className="text-[13px] font-semibold text-frost-100">{children}</h3>
    </div>
  );
}
