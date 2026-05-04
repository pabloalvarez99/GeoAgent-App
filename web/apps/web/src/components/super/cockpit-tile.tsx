'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CockpitTileProps {
  title: string;
  kpi: string;
  status?: 'ok' | 'warning' | 'critical' | 'unknown';
  subtitle?: string;
  href: string;
  icon?: ReactNode;
  sparkline?: ReactNode;
}

const STATUS_BG: Record<string, string> = {
  ok: 'bg-emerald-500/10 border-emerald-500/30',
  warning: 'bg-amber-500/10 border-amber-500/30',
  critical: 'bg-red-500/10 border-red-500/30',
  unknown: 'bg-muted/30 border-muted',
};

export function CockpitTile({ title, kpi, status = 'unknown', subtitle, href, icon, sparkline }: CockpitTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        'block rounded-xl border p-4 transition hover:scale-[1.01]',
        STATUS_BG[status],
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{kpi}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      {sparkline && <div className="mt-3 h-12">{sparkline}</div>}
    </Link>
  );
}
