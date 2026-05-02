import { memo, useMemo } from 'react';
import type { GeoDrillInterval } from '@geoagent/geo-shared/types';
import { rockColor } from './utils';

interface Props {
  intervals: GeoDrillInterval[];
  totalDepth: number;
  width?: number;
  height?: number;
  active?: boolean;
}

function DrillholeThumbnailImpl({ intervals, totalDepth, width = 26, height = 64, active = false }: Props) {
  const segments = useMemo(() => {
    if (totalDepth <= 0) return [];
    return intervals.map((iv) => ({
      y1: (iv.fromDepth / totalDepth) * height,
      y2: (iv.toDepth / totalDepth) * height,
      color: rockColor(iv.rockGroup),
    }));
  }, [intervals, totalDepth, height]);

  const tooltip = useMemo(() => {
    if (intervals.length === 0) return `${totalDepth.toFixed(0)} m · sin intervalos`;
    const rqdVals = intervals.map((i) => i.rqd).filter((v): v is number => v != null);
    const recVals = intervals.map((i) => i.recovery).filter((v): v is number => v != null);
    const meanRqd = rqdVals.length ? rqdVals.reduce((a, b) => a + b, 0) / rqdVals.length : null;
    const meanRec = recVals.length ? recVals.reduce((a, b) => a + b, 0) / recVals.length : null;
    const groupCounts = new Map<string, number>();
    intervals.forEach((iv) => {
      const g = iv.rockGroup || 'Otro';
      groupCounts.set(g, (groupCounts.get(g) ?? 0) + (iv.toDepth - iv.fromDepth));
    });
    const groupPct = [...groupCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([g, m]) => `${g} ${Math.round((m / totalDepth) * 100)}%`)
      .slice(0, 3)
      .join(' · ');
    const lines = [`${totalDepth.toFixed(0)} m · ${intervals.length} intervalos`];
    if (groupPct) lines.push(groupPct);
    if (meanRqd != null) lines.push(`RQD prom ${meanRqd.toFixed(0)}%`);
    if (meanRec != null) lines.push(`Rec prom ${meanRec.toFixed(0)}%`);
    return lines.join('\n');
  }, [intervals, totalDepth]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden
    >
      <title>{tooltip}</title>
      <rect x={0} y={0} width={width} height={height} fill="#0b1220" rx={2} />
      <rect
        x={0.5}
        y={0.5}
        width={width - 1}
        height={height - 1}
        fill="none"
        stroke={active ? '#67e8f9' : '#334155'}
        strokeWidth={active ? 1.2 : 0.8}
        rx={2}
      />
      {segments.map((s, i) => (
        <rect
          key={i}
          x={2}
          y={s.y1}
          width={width - 4}
          height={Math.max(0.6, s.y2 - s.y1)}
          fill={s.color}
        />
      ))}
      {/* collar marker */}
      <rect x={2} y={0} width={width - 4} height={1.5} fill="#10b981" />
      {/* depth ticks every 25% */}
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1={width - 3}
          y1={height * p}
          x2={width}
          y2={height * p}
          stroke="#475569"
          strokeWidth={0.5}
        />
      ))}
    </svg>
  );
}

export const DrillholeThumbnail = memo(DrillholeThumbnailImpl);
