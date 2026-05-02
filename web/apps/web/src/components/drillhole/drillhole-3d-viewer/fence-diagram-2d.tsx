'use client';

import { useCallback, useMemo } from 'react';
import { saveFile } from '@/lib/electron';
import type { FlatInstance } from './types';
import type { SectionRibbon } from './section-plane';
import { buildSection, type SectionData } from './utils-section';

interface PanelData extends SectionData {
  ribbon: SectionRibbon;
}

interface Props {
  flat: FlatInstance[];
  ribbons: SectionRibbon[];
  thickness: number;
  onClose: () => void;
  projectId?: string;
}

const PANEL_W = 540;
const PANEL_H = 600;
const PANEL_M = 50;
const GAP = 16;
const HEADER_H = 64;

export function FenceDiagram2D({ flat, ribbons, thickness, onClose, projectId }: Props) {
  const panels = useMemo<PanelData[]>(
    () => ribbons.map((rb) => ({ ribbon: rb, ...buildSection(flat, rb.axis, rb.depth, thickness) })),
    [flat, ribbons, thickness],
  );

  // shared vertical scale across panels (uniform vertical exaggeration)
  const sharedScale = useMemo(() => {
    let maxVRange = 1;
    let maxURange = 1;
    panels.forEach((p) => {
      maxVRange = Math.max(maxVRange, p.bounds.vmax - p.bounds.vmin);
      maxURange = Math.max(maxURange, p.bounds.umax - p.bounds.umin);
    });
    const sxScale = (PANEL_W - 2 * PANEL_M) / maxURange;
    const syScale = (PANEL_H - 2 * PANEL_M) / maxVRange;
    return Math.min(sxScale, syScale);
  }, [panels]);

  const totalW = panels.length === 0 ? PANEL_W : panels.length * PANEL_W + (panels.length - 1) * GAP;
  const totalH = PANEL_H + HEADER_H;

  const onExportSvg = useCallback(async () => {
    const svg = document.getElementById('fence-svg') as SVGSVGElement | null;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `geoagent-fence-${projectId ?? 'scene'}-${ts}.svg`;
    try { await saveFile(filename, blob); } catch {}
  }, [projectId]);

  const onExportPng = useCallback(async () => {
    const svg = document.getElementById('fence-svg') as SVGSVGElement | null;
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
      canvas.width = totalW * 2;
      canvas.height = totalH * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      await new Promise<void>((resolve) => {
        canvas.toBlob(async (pngBlob) => {
          if (!pngBlob) return resolve();
          const ts = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `geoagent-fence-${projectId ?? 'scene'}-${ts}.png`;
          try { await saveFile(filename, pngBlob); } catch {}
          resolve();
        }, 'image/png');
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [projectId, totalW, totalH]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4">
      <div className="bg-[#0b1220] border border-cyan-700/40 rounded-lg shadow-2xl w-full h-full sm:w-auto sm:h-auto sm:max-w-[97vw] sm:max-h-[97vh] flex flex-col overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-2 sm:p-3 border-b border-cyan-700/30 shrink-0">
          <div className="min-w-0">
            <h3 className="text-cyan-200 text-xs sm:text-sm font-medium font-mono truncate">
              Fence diagram · {panels.length} cortes
              {thickness > 0 ? ` · slab ±${(thickness / 2).toFixed(1)} m` : ''}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
              Escala compartida entre paneles
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
            id="fence-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${totalW} ${totalH}`}
            preserveAspectRatio="xMidYMid meet"
            style={{ background: '#0b1220', display: 'block', maxWidth: '100%', maxHeight: '100%' }}
          >
            {panels.map((p, idx) => {
              const xOff = idx * (PANEL_W + GAP);
              const uRange = p.bounds.umax - p.bounds.umin || 1;
              const vRange = p.bounds.vmax - p.bounds.vmin || 1;
              const offU = (PANEL_W - 2 * PANEL_M - uRange * sharedScale) / 2;
              const offV = (PANEL_H - 2 * PANEL_M - vRange * sharedScale) / 2;
              const toX = (u: number) => xOff + PANEL_M + offU + (u - p.bounds.umin) * sharedScale;
              const toY = (v: number) =>
                p.vIsElev
                  ? HEADER_H + PANEL_H - PANEL_M - offV - (v - p.bounds.vmin) * sharedScale
                  : HEADER_H + PANEL_M + offV + (v - p.bounds.vmin) * sharedScale;
              const axisLabel =
                p.ribbon.axis === 'ns' ? 'N-S' : p.ribbon.axis === 'ew' ? 'E-W' : 'H';
              return (
                <g key={p.ribbon.id}>
                  {/* panel header */}
                  <rect
                    x={xOff + PANEL_M / 2}
                    y={4}
                    width={PANEL_W - PANEL_M}
                    height={HEADER_H - 8}
                    fill="none"
                    stroke={p.ribbon.color}
                    strokeWidth={1.5}
                    rx={4}
                  />
                  <text
                    x={xOff + PANEL_W / 2}
                    y={26}
                    fill={p.ribbon.color}
                    fontSize="13"
                    fontFamily="monospace"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    #{idx + 1} · {axisLabel} @ {p.ribbon.depth.toFixed(0)} m
                  </text>
                  <text
                    x={xOff + PANEL_W / 2}
                    y={46}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {p.segments.filter((s) => s.inSlab).length} / {p.segments.length} intervalos · {p.collars.length} sondajes
                  </text>

                  {/* panel border */}
                  <rect
                    x={xOff + PANEL_M / 2}
                    y={HEADER_H + 4}
                    width={PANEL_W - PANEL_M}
                    height={PANEL_H - 8}
                    fill="#0b1220"
                    stroke="#1e293b"
                    strokeWidth={0.8}
                  />

                  {/* axes */}
                  <g stroke="#475569" strokeWidth="1" fill="none">
                    <line x1={xOff + PANEL_M} y1={HEADER_H + PANEL_H - PANEL_M} x2={xOff + PANEL_W - PANEL_M} y2={HEADER_H + PANEL_H - PANEL_M} />
                    <line x1={xOff + PANEL_M} y1={HEADER_H + PANEL_M} x2={xOff + PANEL_M} y2={HEADER_H + PANEL_H - PANEL_M} />
                  </g>

                  {/* ticks */}
                  <g fill="#94a3b8" fontSize="9" fontFamily="monospace">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const u = p.bounds.umin + (i / 4) * uRange;
                      const x = toX(u);
                      return (
                        <text key={`tx${i}`} x={x} y={HEADER_H + PANEL_H - PANEL_M + 14} textAnchor="middle">
                          {u.toFixed(0)}
                        </text>
                      );
                    })}
                    {Array.from({ length: 5 }).map((_, i) => {
                      const v = p.bounds.vmin + (i / 4) * vRange;
                      const y = toY(v);
                      return (
                        <text key={`ty${i}`} x={xOff + PANEL_M - 6} y={y + 3} textAnchor="end">
                          {v.toFixed(0)}
                        </text>
                      );
                    })}
                  </g>

                  {/* segments */}
                  {p.segments.map((s, i) => (
                    <line
                      key={i}
                      x1={toX(s.u1)}
                      y1={toY(s.v1)}
                      x2={toX(s.u2)}
                      y2={toY(s.v2)}
                      stroke={s.color}
                      strokeWidth={s.inSlab ? 3.5 : 1}
                      strokeOpacity={s.inSlab ? 1 : 0.18}
                      strokeLinecap="round"
                    >
                      <title>{`${s.holeLabel} · ${s.rockType ?? ''} · ${s.fromDepth.toFixed(1)}–${s.toDepth.toFixed(1)} m`}</title>
                    </line>
                  ))}

                  {/* collars */}
                  {p.collars.map((c, i) => (
                    <g key={i}>
                      <circle cx={toX(c.u)} cy={toY(c.v)} r={3.5} fill="#10b981" stroke="#0b1220" strokeWidth={1} />
                      <text
                        x={toX(c.u) + 6}
                        y={toY(c.v) - 5}
                        fill="#a7f3d0"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {c.label}
                      </text>
                    </g>
                  ))}
                </g>
              );
            })}

            {/* shared scale bar bottom-left */}
            {panels.length > 0 && sharedScale > 0 && (() => {
              const targetPx = 100;
              const meters = targetPx / sharedScale;
              const tiers = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000];
              let best = tiers[0];
              for (const t of tiers) if (t <= meters) best = t;
              const px = best * sharedScale;
              return (
                <g transform={`translate(${PANEL_M / 2 + 8}, ${totalH - 12})`}>
                  <line x1={0} y1={0} x2={px} y2={0} stroke="#cbd5e1" strokeWidth={2} />
                  <line x1={0} y1={-4} x2={0} y2={4} stroke="#cbd5e1" strokeWidth={2} />
                  <line x1={px} y1={-4} x2={px} y2={4} stroke="#cbd5e1" strokeWidth={2} />
                  <text x={px / 2} y={-6} fill="#cbd5e1" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {best} m (escala compartida)
                  </text>
                </g>
              );
            })()}
          </svg>
        </div>
      </div>
    </div>
  );
}
