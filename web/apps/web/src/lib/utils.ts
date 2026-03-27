import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatCoord(value: number | null | undefined, decimals = 6): string {
  if (value == null) return '—';
  return value.toFixed(decimals);
}

export function formatDepth(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)} m`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value.toFixed(1)}%`;
}
