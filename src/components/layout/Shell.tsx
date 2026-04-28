import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { useSensing } from '@/stores/sensingStore';
import { cn } from '@/lib/cn';

interface ShellProps { children: ReactNode; }

export function Shell({ children }: ShellProps) {
  const fullscreen = useSensing((s) => s.fullscreen);

  return (
    <div className="fixed inset-0 flex bg-ink-950 text-frost-100 overflow-hidden">
      {!fullscreen && <Sidebar />}
      <div className="flex-1 flex flex-col min-w-0">
        {!fullscreen && <TopBar />}
        <main className={cn('flex-1 min-h-0 relative', !fullscreen && 'bg-noise')}>
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}
