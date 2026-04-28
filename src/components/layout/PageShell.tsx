import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PageShellProps {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function PageShell({ children, className, padded = true }: PageShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'absolute inset-0 overflow-y-auto',
        padded && 'px-5 py-4',
        className
      )}
    >
      {children}
    </motion.div>
  );
}
