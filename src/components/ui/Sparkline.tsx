import { useMemo } from 'react';
import { cn } from '@/lib/cn';

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
  showArea?: boolean;
  min?: number;
  max?: number;
}

/**
 * A minimal, dependency-free sparkline. Used inside metric panels
 * for FPS, packet rate, SQI, and inference latency trends.
 */
export function Sparkline({
  values,
  width = 120,
  height = 32,
  stroke = 'currentColor',
  fill,
  showArea = true,
  min,
  max,
  className,
}: SparklineProps) {
  const path = useMemo(() => {
    if (!values.length) return { line: '', area: '' };
    const lo = min ?? Math.min(...values);
    const hi = max ?? Math.max(...values);
    const span = hi - lo || 1;
    const step = values.length > 1 ? width / (values.length - 1) : 0;
    const pts = values.map((v, i) => {
      const x = i * step;
      const y = height - ((v - lo) / span) * (height - 2) - 1;
      return [x, y] as const;
    });
    const line = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ');
    const area =
      line +
      ` L${width},${height} L0,${height} Z`;
    return { line, area };
  }, [values, width, height, min, max]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('block', className)}
      aria-hidden
    >
      {showArea && (
        <path d={path.area} fill={fill ?? 'currentColor'} opacity={0.12} />
      )}
      <path d={path.line} fill="none" stroke={stroke} strokeWidth={1.25} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
