'use client';

import { useState, useRef, useCallback } from 'react';
import { Download } from 'lucide-react';
import type { GeoDrillInterval } from '@geoagent/geo-shared/types';

// Rock group → hue for SVG fill
// Keys must match ROCK_GROUPS in geo-shared/constants.ts exactly (no accents)
const ROCK_GROUP_COLORS: Record<string, string> = {
  'Ignea':       '#f97316',  // orange
  'Sedimentaria':'#eab308',  // yellow
  'Metamorfica': '#a855f7',  // purple
  // Fallback variants (accented/gendered) in case older data has them
  'Ígnea':       '#f97316',
  'Ígneo':       '#f97316',
  'Sedimentario':'#eab308',
  'Metamórfica': '#a855f7',
  'Metamórfico': '#a855f7',
};

function colorForInterval(interval: GeoDrillInterval): string {
  if (interval.rockGroup && ROCK_GROUP_COLORS[interval.rockGroup]) {
    return ROCK_GROUP_COLORS[interval.rockGroup];
  }
  // Deterministic color from rock type string
  let hash = 0;
  for (let i = 0; i < interval.rockType.length; i++) {
    hash = interval.rockType.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

interface StratigraphicColumnProps {
  intervals: GeoDrillInterval[];
  totalDepth: number;
  holeId?: string;
}

export function StratigraphicColumn({ intervals, totalDepth, holeId }: StratigraphicColumnProps) {
  const [tooltip, setTooltip] = useState<{ interval: GeoDrillInterval; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const downloadSvg = useCallback(() => {
    if (!svgRef.current) return;
    const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgRef.current.outerHTML;
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `columna_${holeId ?? 'sondaje'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }, [holeId]);

  if (intervals.length === 0 || totalDepth <= 0) return null;

  const sorted = [...intervals].sort((a, b) => a.fromDepth - b.fromDepth);
  const colW = 60;
  const rqdW = 18;
  const recW = 18;
  const labelW = 120;
  const depthLabelW = 36;
  const svgH = 480;
  const paddingTop = 16;
  const paddingBottom = 16;
  const drawH = svgH - paddingTop - paddingBottom;

  function yOf(depth: number): number {
    return paddingTop + (depth / totalDepth) * drawH;
  }

  // Depth tick marks every 10m (or every 5m if totalDepth ≤ 50)
  const tickStep = totalDepth <= 50 ? 5 : 10;
  const ticks: number[] = [];
  for (let d = 0; d <= totalDepth; d += tickStep) ticks.push(d);

  const svgW = depthLabelW + colW + rqdW + recW + labelW + 12;

  return (
    <div className="overflow-x-auto relative">
      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-4 flex-wrap">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#f97316' }} /> Ignea
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#eab308' }} /> Sedimentaria
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#a855f7' }} /> Metamorfica
        </span>
        <button
          onClick={downloadSvg}
          className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded border border-border hover:bg-muted transition-colors"
        >
          <Download className="h-3 w-3" />
          SVG
        </button>
      </div>
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        className="font-mono select-none"
        style={{ fontSize: 10 }}
        aria-label="Columna estratigráfica"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Column header */}
        <text x={depthLabelW + colW / 2} y={10} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>Litología</text>
        <text x={depthLabelW + colW + rqdW / 2} y={10} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>RQD</text>
        <text x={depthLabelW + colW + rqdW + recW / 2} y={10} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 9 }}>Rec</text>

        {/* Background column */}
        <rect x={depthLabelW} y={paddingTop} width={colW} height={drawH} fill="none" stroke="#3f3f46" strokeWidth={1} />

        {/* Depth tick lines */}
        {ticks.map((d) => {
          const y = yOf(d);
          return (
            <g key={d}>
              <line x1={depthLabelW - 4} y1={y} x2={depthLabelW + colW + rqdW + recW} y2={y} stroke="#3f3f46" strokeWidth={0.5} strokeDasharray="2,2" />
              <text x={depthLabelW - 6} y={y + 3} textAnchor="end" fill="#71717a" style={{ fontSize: 9 }}>{d}</text>
            </g>
          );
        })}

        {/* Interval rectangles */}
        {sorted.map((interval) => {
          const y1 = yOf(interval.fromDepth);
          const y2 = yOf(interval.toDepth);
          const h = Math.max(y2 - y1, 1);
          const color = colorForInterval(interval);
          const midY = (y1 + y2) / 2;

          return (
            <g
              key={interval.id}
              onMouseEnter={(e) => {
                const svgRect = (e.currentTarget.closest('svg') as SVGSVGElement).getBoundingClientRect();
                const containerRect = (e.currentTarget.closest('.overflow-x-auto') as HTMLElement).getBoundingClientRect();
                setTooltip({ interval, x: e.clientX - containerRect.left + 8, y: e.clientY - containerRect.top - 8 });
              }}
              onMouseMove={(e) => {
                const containerRect = (e.currentTarget.closest('.overflow-x-auto') as HTMLElement).getBoundingClientRect();
                setTooltip((t) => t ? { ...t, x: e.clientX - containerRect.left + 8, y: e.clientY - containerRect.top - 8 } : null);
              }}
              style={{ cursor: 'pointer' }}
            >
              {/* Rock type fill */}
              <rect x={depthLabelW} y={y1} width={colW} height={h} fill={color} fillOpacity={0.7} stroke="#18181b" strokeWidth={0.5} />

              {/* RQD bar */}
              {interval.rqd != null && (
                <rect
                  x={depthLabelW + colW}
                  y={y1}
                  width={rqdW * (interval.rqd / 100)}
                  height={h}
                  fill="#60a5fa"
                  fillOpacity={0.6}
                  stroke="#18181b"
                  strokeWidth={0.3}
                />
              )}
              <rect x={depthLabelW + colW} y={y1} width={rqdW} height={h} fill="none" stroke="#3f3f46" strokeWidth={0.5} />

              {/* Recovery bar */}
              {interval.recovery != null && (
                <rect
                  x={depthLabelW + colW + rqdW}
                  y={y1}
                  width={recW * (interval.recovery / 100)}
                  height={h}
                  fill="#4ade80"
                  fillOpacity={0.6}
                  stroke="#18181b"
                  strokeWidth={0.3}
                />
              )}
              <rect x={depthLabelW + colW + rqdW} y={y1} width={recW} height={h} fill="none" stroke="#3f3f46" strokeWidth={0.5} />

              {/* Rock type label (only if interval tall enough) */}
              {h > 14 && (
                <text
                  x={depthLabelW + colW + rqdW + recW + 6}
                  y={midY + 3}
                  fill="#e4e4e7"
                  style={{ fontSize: 9 }}
                >
                  {interval.rockType.length > 18 ? interval.rockType.slice(0, 17) + '…' : interval.rockType}
                </text>
              )}
            </g>
          );
        })}

        {/* Bottom cap */}
        <rect x={depthLabelW} y={yOf(totalDepth) - 1} width={colW} height={2} fill="#71717a" />

        {/* Depth label at bottom */}
        <text x={depthLabelW - 6} y={yOf(totalDepth) + 3} textAnchor="end" fill="#71717a" style={{ fontSize: 9 }}>{totalDepth}</text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none rounded-md border border-border bg-popover shadow-lg px-3 py-2 text-xs max-w-[200px]"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <p className="font-semibold text-foreground">{tooltip.interval.fromDepth.toFixed(1)}–{tooltip.interval.toDepth.toFixed(1)} m</p>
          <p className="text-muted-foreground mt-0.5">{tooltip.interval.rockType}</p>
          <p className="text-muted-foreground">{tooltip.interval.color} · {tooltip.interval.texture}</p>
          {tooltip.interval.alteration && <p className="text-muted-foreground">{tooltip.interval.alteration}</p>}
          {tooltip.interval.rqd != null && (
            <p className="text-blue-400 font-mono mt-1">RQD: {tooltip.interval.rqd}%</p>
          )}
          {tooltip.interval.recovery != null && (
            <p className="text-green-400 font-mono">Rec: {tooltip.interval.recovery}%</p>
          )}
        </div>
      )}
    </div>
  );
}
