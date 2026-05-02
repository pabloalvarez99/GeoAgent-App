'use client';

import { useCallback, useMemo, useState } from 'react';
import { saveFile } from '@/lib/electron';
import type { FlatInstance } from './types';
import type { SectionAxis } from './section-plane';
import { buildSection } from './utils-section';

interface Props {
  flat: FlatInstance[];
  axis: SectionAxis;
  depth: number;
  thickness: number;
  onClose: () => void;
  onSelectInterval?: (holeId: string, intervalId: string) => void;
  projectId?: string;
}

const W = 1100;
const H = 720;
const M = 70;

export function CrossSection2D({ flat, axis, depth, thickness, onClose, onSelectInterval, projectId }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const section = useMemo(
    () => buildSection(flat, axis, depth, thickness),
    [flat, axis, depth, thickness],
  );
  const { segments, visible, collars, bounds, vIsElev } = section;

  const uRange = bounds.umax - bounds.umin || 1;
  const vRange = bounds.vmax - bounds.vmin || 1;
  const sxScale = (W - 2 * M) / uRange;
  const syScale = (H - 2 * M) / vRange;
  const scale = Math.min(sxScale, syScale);
  const offU = (W - 2 * M - uRange * scale) / 2;
  const offV = (H - 2 * M - vRange * scale) / 2;
  const toX = (u: number) => M + offU + (u - bounds.umin) * scale;
  const toY = (v: number) =>
    vIsElev
      ? H - M - offV - (v - bounds.vmin) * scale
      : M + offV + (v - bounds.vmin) * scale;

  const uLabel = axis === 'ns' ? 'Z (norte, m)' : axis === 'ew' ? 'X (este, m)' : 'X (este, m)';
  const vLabel = vIsElev ? 'Elevación Y (m)' : 'Z (norte, m)';
  const title =
    axis === 'ns'
      ? `Sección N-S @ X = ${depth.toFixed(1)} m${thickness > 0 ? ` · slab ±${(thickness / 2).toFixed(1)} m` : ''}`
      : axis === 'ew'
      ? `Sección E-W @ Z = ${depth.toFixed(1)} m${thickness > 0 ? ` · slab ±${(thickness / 2).toFixed(1)} m` : ''}`
      : `Plano horizontal @ Y = ${depth.toFixed(1)} m${thickness > 0 ? ` · slab ±${(thickness / 2).toFixed(1)} m` : ''}`;

  const onExportPng = useCallback(async () => {
    const svg = document.getElementById('cross-section-svg') as SVGSVGElement | null;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('img load'));
        img.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = W * 2;
      canvas.height = H * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      await new Promise<void>((resolve) => {
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) return resolve();
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `geoagent-section-${axis}-${projectId ?? 'scene'}-${ts}.png`;
          try { await saveFile(filename, pngBlob); } catch {}
          resolve();
        }, 'image/png');
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [axis, projectId]);

  const onExportSvg = useCallback(async () => {
    const svg = document.getElementById('cross-section-svg') as SVGSVGElement | null;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `geoagent-section-${axis}-${projectId ?? 'scene'}-${ts}.svg`;
    try { await saveFile(filename, blob); } catch {}
  }, [axis, projectId]);

  const scaleBarMeters = useMemo(() => {
    const targetPx = 120;
    const meters = targetPx / scale;
    const tiers = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
    let best = tiers[0];
    for (const t of tiers) if (t <= meters) best = t;
    return best;
  }, [scale]);

  const uTicks = 6;
  const vTicks = 6;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-[#0b1220] border border-cyan-700/40 rounded-lg shadow-2xl w-full h-full sm:w-auto sm:h-auto sm:max-w-[97vw] sm:max-h-[97vh] flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2 sm:p-3 border-b border-cyan-700/30 shrink-0">
          <div className="min-w-0">
            <h3 className="text-cyan-200 text-xs sm:text-sm font-medium font-mono truncate">{title}</h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              {visible.length} de {segments.length} intervalos · {collars.length} sondajes
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onExportSvg}
              className="flex-1 sm:flex-none min-h-[40px] sm:min-h-0 px-3 py-2 sm:py-1.5 text-xs sm:text-[11px] font-mono bg-cyan-700/30 hover:bg-cyan-700/50 active:bg-cyan-700/70 text-cyan-100 rounded border border-cyan-700/40"
            >
              SVG
            </button>
            <button
              onClick={onExportPng}
              className="flex-1 sm:flex-none min-h-[40px] sm:min-h-0 px-3 py-2 sm:py-1.5 text-xs sm:text-[11px] font-mono bg-cyan-700/30 hover:bg-cyan-700/50 active:bg-cyan-700/70 text-cyan-100 rounded border border-cyan-700/40"
            >
              PNG
            </button>
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none min-h-[40px] sm:min-h-0 px-3 py-2 sm:py-1.5 text-xs sm:text-[11px] font-mono bg-red-700/30 hover:bg-red-700/50 active:bg-red-700/70 text-red-100 rounded border border-red-700/40"
            >
              Cerrar
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-auto p-1 sm:p-2 flex items-center justify-center">
        <svg
          id="cross-section-svg"
          xmlns="http://www.w3.org/2000/svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ background: '#0b1220', display: 'block', width: '100%', height: '100%', maxWidth: '100%', maxHeight: '100%' }}
        >
          <g stroke="#1e293b" strokeWidth="0.5">
            {Array.from({ length: uTicks + 1 }).map((_, i) => {
              const u = bounds.umin + (i / uTicks) * uRange;
              const x = toX(u);
              return <line key={`gx${i}`} x1={x} y1={M} x2={x} y2={H - M} />;
            })}
            {Array.from({ length: vTicks + 1 }).map((_, i) => {
              const v = bounds.vmin + (i / vTicks) * vRange;
              const y = toY(v);
              return <line key={`gy${i}`} x1={M} y1={y} x2={W - M} y2={y} />;
            })}
          </g>

          <g stroke="#475569" strokeWidth="1" fill="none">
            <line x1={M} y1={H - M} x2={W - M} y2={H - M} />
            <line x1={M} y1={M} x2={M} y2={H - M} />
          </g>

          <g fill="#94a3b8" fontSize="10" fontFamily="monospace">
            {Array.from({ length: uTicks + 1 }).map((_, i) => {
              const u = bounds.umin + (i / uTicks) * uRange;
              const x = toX(u);
              return (
                <text key={`tx${i}`} x={x} y={H - M + 16} textAnchor="middle">
                  {u.toFixed(0)}
                </text>
              );
            })}
            {Array.from({ length: vTicks + 1 }).map((_, i) => {
              const v = bounds.vmin + (i / vTicks) * vRange;
              const y = toY(v);
              return (
                <text key={`ty${i}`} x={M - 8} y={y + 3} textAnchor="end">
                  {v.toFixed(0)}
                </text>
              );
            })}
          </g>

          <text x={W / 2} y={H - 14} fill="#cbd5e1" fontSize="11" fontFamily="monospace" textAnchor="middle">
            {uLabel}
          </text>
          <text
            x={18}
            y={H / 2}
            fill="#cbd5e1"
            fontSize="11"
            fontFamily="monospace"
            textAnchor="middle"
            transform={`rotate(-90 18 ${H / 2})`}
          >
            {vLabel}
          </text>

          <g>
            {segments.map((s, i) => {
              const isHover = hoverIdx === i;
              const interactive = s.inSlab && !!onSelectInterval;
              return (
                <line
                  key={i}
                  x1={toX(s.u1)}
                  y1={toY(s.v1)}
                  x2={toX(s.u2)}
                  y2={toY(s.v2)}
                  stroke={isHover ? '#fbbf24' : s.color}
                  strokeWidth={isHover ? 7 : s.inSlab ? 4.5 : 1.2}
                  strokeOpacity={isHover ? 1 : s.inSlab ? 1 : 0.18}
                  strokeLinecap="round"
                  onMouseEnter={s.inSlab ? () => setHoverIdx(i) : undefined}
                  onMouseLeave={s.inSlab ? () => setHoverIdx((h) => (h === i ? null : h)) : undefined}
                  onClick={interactive ? () => onSelectInterval(s.holeId, s.intervalId) : undefined}
                  style={{ cursor: interactive ? 'pointer' : 'default' }}
                />
              );
            })}
          </g>

          <g>
            {collars.map((c, i) => (
              <g key={i}>
                <circle cx={toX(c.u)} cy={toY(c.v)} r={4.5} fill="#10b981" stroke="#0b1220" strokeWidth={1.5} />
                <text
                  x={toX(c.u) + 8}
                  y={toY(c.v) - 6}
                  fill="#a7f3d0"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="600"
                >
                  {c.label}
                </text>
              </g>
            ))}
          </g>

          <g transform={`translate(${W - M - 140}, ${H - M - 24})`}>
            <line x1={0} y1={0} x2={scaleBarMeters * scale} y2={0} stroke="#cbd5e1" strokeWidth={2.5} />
            <line x1={0} y1={-5} x2={0} y2={5} stroke="#cbd5e1" strokeWidth={2} />
            <line
              x1={scaleBarMeters * scale}
              y1={-5}
              x2={scaleBarMeters * scale}
              y2={5}
              stroke="#cbd5e1"
              strokeWidth={2}
            />
            <text
              x={(scaleBarMeters * scale) / 2}
              y={-8}
              fill="#cbd5e1"
              fontSize="10"
              fontFamily="monospace"
              textAnchor="middle"
            >
              {scaleBarMeters} m
            </text>
          </g>

          {vIsElev && (
            <g transform={`translate(${W - M - 30}, ${M + 30})`}>
              <line x1={0} y1={0} x2={0} y2={-22} stroke="#cbd5e1" strokeWidth={1.5} markerEnd="url(#arrow)" />
              <text x={0} y={-26} fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="middle">
                +Y
              </text>
            </g>
          )}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#cbd5e1" />
            </marker>
          </defs>

          {hoverIdx != null && segments[hoverIdx] && (() => {
            const s = segments[hoverIdx];
            const mx = (toX(s.u1) + toX(s.u2)) / 2;
            const my = (toY(s.v1) + toY(s.v2)) / 2;
            const lines = [
              s.holeLabel,
              `${s.rockType ?? s.rockGroup ?? '—'}`,
              `${s.fromDepth.toFixed(1)}–${s.toDepth.toFixed(1)} m`,
            ];
            if (s.rqd != null) lines.push(`RQD ${s.rqd}%`);
            if (s.recovery != null) lines.push(`Rec ${s.recovery}%`);
            if (onSelectInterval) lines.push('▸ click para abrir 3D');
            const boxW = 180;
            const lineH = 14;
            const padY = 8;
            const boxH = lines.length * lineH + padY * 2;
            const tx = Math.min(W - boxW - 8, Math.max(8, mx + 14));
            const ty = Math.min(H - boxH - 8, Math.max(8, my - boxH - 10));
            return (
              <g pointerEvents="none">
                <rect x={tx} y={ty} width={boxW} height={boxH} rx={4} fill="#0b1220" stroke={s.color} strokeWidth={1.2} opacity={0.96} />
                {lines.map((ln, j) => (
                  <text
                    key={j}
                    x={tx + 8}
                    y={ty + padY + (j + 1) * lineH - 4}
                    fill={j === 0 ? '#fbbf24' : j === lines.length - 1 && onSelectInterval ? '#67e8f9' : '#e2e8f0'}
                    fontSize={j === 0 ? '11' : '10'}
                    fontFamily="monospace"
                    fontWeight={j === 0 ? '700' : '400'}
                  >
                    {ln}
                  </text>
                ))}
              </g>
            );
          })()}
        </svg>
        </div>
      </div>
    </div>
  );
}
