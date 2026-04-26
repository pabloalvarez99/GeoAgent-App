'use client';

import { cn } from '@/lib/utils';

type StatusVariant = 'success' | 'progress' | 'warning' | 'danger' | 'neutral';

const VARIANT_STYLES: Record<StatusVariant, { dot: string; text: string; bg: string; ring: string }> = {
  success:  { dot: 'bg-green-500',  text: 'text-green-400',  bg: 'bg-green-500/10',  ring: 'ring-green-500/20'  },
  progress: { dot: 'bg-blue-500',   text: 'text-blue-400',   bg: 'bg-blue-500/10',   ring: 'ring-blue-500/20'   },
  warning:  { dot: 'bg-yellow-500', text: 'text-yellow-400', bg: 'bg-yellow-500/10', ring: 'ring-yellow-500/20' },
  danger:   { dot: 'bg-red-500',    text: 'text-red-400',    bg: 'bg-red-500/10',    ring: 'ring-red-500/20'    },
  neutral:  { dot: 'bg-zinc-500',   text: 'text-zinc-400',   bg: 'bg-zinc-500/10',   ring: 'ring-zinc-500/20'   },
};

interface StatusBadgeProps {
  variant: StatusVariant;
  label: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ variant, label, pulse = false, size = 'sm', className }: StatusBadgeProps) {
  const styles = VARIANT_STYLES[variant];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full ring-1 font-medium whitespace-nowrap',
        size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1',
        styles.bg, styles.text, styles.ring,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', styles.dot, pulse && 'animate-pulse')} />
      {label}
    </span>
  );
}

// Mapping helper for drillhole statuses
export function getDrillStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'Completado':  return 'success';
    case 'En Progreso': return 'progress';
    case 'Suspendido':  return 'warning';
    case 'Abandonado':  return 'danger';
    default:            return 'neutral';
  }
}
