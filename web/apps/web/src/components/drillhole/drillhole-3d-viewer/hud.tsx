import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Bookmark, BookmarkCheck, Box, Camera, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Compass, Crosshair, Drill, Eye, EyeOff, Flame, Layers, Maximize2, Minimize2, Mountain, Pin, Ruler, Satellite, Scissors, Grid3x3, X } from 'lucide-react';
import type { CameraRigHandle } from './camera-rig';
import type { SectionRibbon } from './section-plane';
import type { FlatInstance, HoverInfo, Preset, SceneItem } from './types';
import type { GeoStation } from '@geoagent/geo-shared/types';
import { localCoords, rampColor, rockColor } from './utils';
import { useHudCameraSync, useIsMobile } from './hooks';
import { DrillholeThumbnail } from './drillhole-thumbnail';

const FOV_DEG = 50;
const NICE_TIERS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];

function pickNice(meters: number): number {
  for (const t of NICE_TIERS) if (t >= meters) return t;
  return NICE_TIERS[NICE_TIERS.length - 1];
}

interface Props {
  rigRef: React.RefObject<CameraRigHandle | null>;
  scenes: SceneItem[];
  flat: FlatInstance[];
  hover: HoverInfo | null;
  hiddenGroups: Set<string>;
  toggleGroup: (g: string) => void;
  sectionEnabled: boolean;
  setSectionEnabled: (v: boolean) => void;
  sectionDepth: number;
  setSectionDepth: (v: number) => void;
  sectionThickness: number;
  setSectionThickness: (v: number) => void;
  sectionRange: { min: number; max: number };
  sectionAxis: 'horizontal' | 'ns' | 'ew';
  setSectionAxis: (v: 'horizontal' | 'ns' | 'ew') => void;
  showStations: boolean;
  setShowStations: (v: boolean) => void;
  hasStations: boolean;
  onScreenshot: () => void;
  onExportGlb: () => void;
  basemap: 'grid' | 'satellite' | 'topo';
  setBasemap: (v: 'grid' | 'satellite' | 'topo') => void;
  terrainOpacity: number;
  setTerrainOpacity: (v: number) => void;
  vScale: number;
  setVScale: (v: number) => void;
  colorBy: 'lithology' | 'rqd' | 'recovery' | 'depth';
  setColorBy: (v: 'lithology' | 'rqd' | 'recovery' | 'depth') => void;
  pinned: FlatInstance | null;
  clearPinned: () => void;
  pinnedStation: GeoStation | null;
  clearPinnedStation: () => void;
  origin: { lat: number; lng: number };
  demSampler: ((lat: number, lng: number) => number) | null;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
  focusedHoleId: string | null;
  focusedHoleLabel: string | null;
  focusIndex: number;
  holeCount: number;
  onCycleFocus: (dir: 1 | -1) => void;
  onSelectFocus: (id: string | null) => void;
  measureMode: boolean;
  toggleMeasure: () => void;
  measureCount: number;
  clearMeasure: () => void;
  projectId?: string;
  showLabels: boolean;
  setShowLabels: (v: boolean) => void;
  heatmapEnabled: boolean;
  setHeatmapEnabled: (v: boolean) => void;
  heatmapOpacity: number;
  setHeatmapOpacity: (v: number) => void;
  heatmapMinRqd: number;
  setHeatmapMinRqd: (v: number) => void;
  onOpenSection2D: () => void;
  ribbons: SectionRibbon[];
  addRibbon: () => void;
  removeRibbon: (id: string) => void;
  clearRibbons: () => void;
  activateRibbon: (rb: SectionRibbon) => void;
}

export function Hud(props: Props) {
  const {
    rigRef,
    scenes,
    flat,
    hover,
    hiddenGroups,
    toggleGroup,
    sectionEnabled,
    setSectionEnabled,
    sectionDepth,
    setSectionDepth,
    sectionThickness,
    setSectionThickness,
    sectionRange,
    sectionAxis,
    setSectionAxis,
    showStations,
    setShowStations,
    hasStations,
    onScreenshot,
    onExportGlb,
    basemap,
    setBasemap,
    terrainOpacity,
    setTerrainOpacity,
    vScale,
    setVScale,
    colorBy,
    setColorBy,
    pinned,
    clearPinned,
    pinnedStation,
    clearPinnedStation,
    origin,
    demSampler,
    isFullscreen,
    toggleFullscreen,
    focusMode,
    setFocusMode,
    focusedHoleLabel,
    focusedHoleId,
    focusIndex,
    holeCount,
    onCycleFocus,
    onSelectFocus,
    measureMode,
    toggleMeasure,
    measureCount,
    clearMeasure,
    projectId,
    showLabels,
    setShowLabels,
    heatmapEnabled,
    setHeatmapEnabled,
    heatmapOpacity,
    setHeatmapOpacity,
    heatmapMinRqd,
    setHeatmapMinRqd,
    onOpenSection2D,
    ribbons,
    addRibbon,
    removeRibbon,
    clearRibbons,
    activateRibbon,
  } = props;

  const isMobile = useIsMobile();
  const [statsOpen, setStatsOpen] = useState(false);
  const [holeListOpen, setHoleListOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const bookmarkKey = `geoagent-3d-bookmark-${projectId ?? 'default'}`;
  const [hasBookmark, setHasBookmark] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setHasBookmark(!!window.localStorage.getItem(bookmarkKey));
  }, [bookmarkKey]);

  const saveBookmark = () => {
    const cc = rigRef.current?.controls;
    if (!cc) return;
    const pos = new THREE.Vector3();
    const tgt = new THREE.Vector3();
    cc.getPosition(pos);
    cc.getTarget(tgt);
    const payload = {
      pos: [pos.x, pos.y, pos.z],
      target: [tgt.x, tgt.y, tgt.z],
      savedAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(bookmarkKey, JSON.stringify(payload));
      setHasBookmark(true);
    } catch (err) {
      console.warn('[3d-viewer] bookmark save failed:', err);
    }
  };
  const restoreBookmark = () => {
    const cc = rigRef.current?.controls;
    if (!cc) return;
    try {
      const raw = window.localStorage.getItem(bookmarkKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { pos: number[]; target: number[] };
      const [px, py, pz] = parsed.pos;
      const [tx, ty, tz] = parsed.target;
      cc.setLookAt(px, py, pz, tx, ty, tz, true);
    } catch (err) {
      console.warn('[3d-viewer] bookmark restore failed:', err);
    }
  };
  const clearBookmark = () => {
    try {
      window.localStorage.removeItem(bookmarkKey);
      setHasBookmark(false);
    } catch {
      /* noop */
    }
  };
  const controlsRef = useMemo(
    () => ({ get current() { return rigRef.current?.controls ?? null; } }),
    [rigRef],
  ) as React.RefObject<import('@react-three/drei').CameraControls | null>;
  const { azimuth: compassAz, distance: camDist } = useHudCameraSync(controlsRef);
  const [vpHeight, setVpHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 720,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (holeCount > 1) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          onCycleFocus(-1);
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          onCycleFocus(1);
          return;
        }
      }
      if (sectionEnabled && (e.key === '[' || e.key === ']')) {
        e.preventDefault();
        const span = sectionRange.max - sectionRange.min;
        const step = Math.max(1, span * 0.02);
        const next = e.key === '[' ? sectionDepth - step : sectionDepth + step;
        setSectionDepth(Math.max(sectionRange.min, Math.min(sectionRange.max, next)));
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 's') {
        e.preventDefault();
        setSectionEnabled(!sectionEnabled);
        return;
      }
      if (k === 'b') {
        e.preventDefault();
        const next = basemap === 'grid' ? 'satellite' : basemap === 'satellite' ? 'topo' : 'grid';
        setBasemap(next);
        return;
      }
      if (k === 'p') {
        e.preventDefault();
        onScreenshot();
        return;
      }
      const map: Record<string, Preset> = { q: 'top', w: 'north', e: 'east', r: 'persp', f: 'fit' };
      const p = map[k];
      if (p) {
        e.preventDefault();
        rigRef.current?.applyPreset(p);
      }
    };
    const onResize = () => setVpHeight(window.innerHeight);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }, [rigRef, onCycleFocus, holeCount, sectionEnabled, setSectionEnabled, basemap, setBasemap, onScreenshot, sectionDepth, sectionRange.min, sectionRange.max, setSectionDepth]);

  const scaleBar = useMemo(() => {
    const mpp = (2 * camDist * Math.tan((FOV_DEG * Math.PI) / 360)) / Math.max(vpHeight, 1);
    const targetPx = 120;
    const targetMeters = targetPx * mpp;
    const niceMeters = pickNice(targetMeters);
    const widthPx = Math.max(20, Math.min(240, niceMeters / mpp));
    const label = niceMeters >= 1000 ? `${(niceMeters / 1000).toFixed(niceMeters % 1000 === 0 ? 0 : 1)} km` : `${niceMeters} m`;
    return { widthPx, label };
  }, [camDist, vpHeight]);

  const stats = useMemo(() => {
    const holeCount = scenes.length;
    const depths = scenes.map((s) => s.dh.actualDepth ?? s.dh.plannedDepth);
    const totalM = depths.reduce((a, b) => a + b, 0);
    const maxM = depths.length ? Math.max(...depths) : 0;
    const mean = depths.length ? totalM / depths.length : 0;
    const variance = depths.length
      ? depths.reduce((a, b) => a + (b - mean) ** 2, 0) / depths.length
      : 0;
    const sigma = Math.sqrt(variance);
    const groups: Record<string, number> = {};
    flat.forEach((f) => {
      groups[f.group] = (groups[f.group] ?? 0) + (f.toDepth - f.fromDepth);
    });
    const totalIntervalM = Object.values(groups).reduce((a, b) => a + b, 0) || 1;
    const groupPct = Object.entries(groups).map(([g, m]) => ({
      g,
      pct: Math.round((m / totalIntervalM) * 100),
      count: flat.filter((f) => f.group === g).length,
    }));
    return { holeCount, totalM, maxM, sigma, intervalCount: flat.length, groupPct };
  }, [scenes, flat]);

  const focusedScene = useMemo(
    () => (focusIndex >= 0 ? scenes[focusIndex] : null),
    [scenes, focusIndex],
  );

  const focusedStats = useMemo(() => {
    if (!focusedScene) return null;
    const dh = focusedScene.dh;
    const ivs = focusedScene.intervals;
    const rqdVals = ivs.map((i) => i.rqd).filter((v): v is number => v != null);
    const recVals = ivs.map((i) => i.recovery).filter((v): v is number => v != null);
    const meanRqd = rqdVals.length ? rqdVals.reduce((a, b) => a + b, 0) / rqdVals.length : null;
    const meanRec = recVals.length ? recVals.reduce((a, b) => a + b, 0) / recVals.length : null;
    return {
      dh,
      ivCount: ivs.length,
      meanRqd,
      meanRec,
    };
  }, [focusedScene]);

  const presetBtn = (p: Preset, label: string, key: string) => (
    <button
      onClick={() => rigRef.current?.applyPreset(p)}
      className="px-2 py-1 text-[10px] font-mono rounded bg-popover/90 border border-border hover:bg-accent text-foreground"
      title={`${label} (${key.toUpperCase()})`}
    >
      {label}
    </button>
  );

  return (
    <>
      {/* Top-left: stats */}
      <div className="absolute top-3 left-3 rounded-md border border-border bg-popover/95 text-[11px] shadow-lg overflow-hidden">
        <button
          onClick={() => setStatsOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-accent w-full"
        >
          <Mountain className="h-3 w-3 text-foreground/70" />
          <span className="font-mono text-foreground">
            {stats.holeCount} {stats.holeCount === 1 ? 'sondaje' : 'sondajes'} · {stats.totalM.toFixed(0)} m
          </span>
          {hiddenGroups.size > 0 && (
            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/20 text-amber-200">
              filtros
            </span>
          )}
          {statsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
        {statsOpen && (
          <div className="px-2.5 py-2 border-t border-border space-y-1.5 font-mono text-foreground/90">
            <div>max {stats.maxM.toFixed(0)} m · σ {stats.sigma.toFixed(1)} m</div>
            <div>{stats.intervalCount} intervalos</div>
            {stats.groupPct.map((g) => (
              <div key={g.g} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: rockColor(g.g) }} />
                <span>{g.g} {g.pct}% ({g.count})</span>
              </div>
            ))}
            {focusedStats && (
              <div className="mt-2 pt-2 border-t border-border space-y-0.5">
                <div className="flex items-center gap-1 text-amber-200/90 uppercase tracking-wide text-[9px]">
                  <Crosshair className="h-2.5 w-2.5" /> Sondaje activo
                </div>
                <div className="font-semibold text-foreground">{focusedStats.dh.holeId}</div>
                <div className="text-foreground/80">{focusedStats.dh.type} · {focusedStats.dh.status}</div>
                <div>Az {focusedStats.dh.azimuth}° · Inc {focusedStats.dh.inclination}°</div>
                <div>
                  Prof {(focusedStats.dh.actualDepth ?? focusedStats.dh.plannedDepth).toFixed(0)} m
                  {' · '}{focusedStats.ivCount} int
                </div>
                {focusedStats.meanRqd != null && (
                  <div>RQD prom {focusedStats.meanRqd.toFixed(0)}%</div>
                )}
                {focusedStats.meanRec != null && (
                  <div>Rec prom {focusedStats.meanRec.toFixed(0)}%</div>
                )}
                {focusedStats.dh.geologist && (
                  <div className="text-foreground/70">{focusedStats.dh.geologist}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Left side: drillhole list panel */}
      {scenes.length > 1 && (
        <div
          className={
            isMobile
              ? 'absolute top-14 left-3 flex flex-col gap-1 max-h-[calc(100%-4rem)] z-10 [&_button]:min-h-[40px]'
              : 'absolute top-3 left-[calc(0.75rem+min(24rem,30vw))] flex flex-col gap-1 max-h-[calc(100%-1.5rem)]'
          }
        >
          <button
            onClick={() => setHoleListOpen((v) => !v)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border ${holeListOpen ? 'bg-cyan-600/30 border-cyan-500/60 text-cyan-100' : 'bg-popover/90 border-border text-foreground'} hover:bg-accent shrink-0 self-start`}
            title="Lista sondajes"
          >
            <Drill className="h-3 w-3" /> Sondajes
            <span className="text-[9px] opacity-70">({scenes.length})</span>
          </button>
          {holeListOpen && (
            <div className="rounded-md border border-border bg-popover/95 shadow-lg overflow-y-auto max-h-[60vh] min-w-[210px] max-w-[280px]">
              <ul className="divide-y divide-border">
                {scenes.map((s) => {
                  const ivCount = s.intervals.length;
                  const depth = s.dh.actualDepth ?? s.dh.plannedDepth ?? 0;
                  const active = focusedHoleId === s.dh.id;
                  return (
                    <li key={s.dh.id}>
                      <button
                        onClick={() => onSelectFocus(s.dh.id)}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-accent ${active ? 'bg-cyan-500/15' : ''}`}
                      >
                        <DrillholeThumbnail
                          intervals={s.intervals}
                          totalDepth={depth}
                          active={active}
                        />
                        <div className="min-w-0 flex-1">
                          <div className={`text-[11px] font-mono truncate ${active ? 'text-cyan-200' : 'text-foreground'}`}>
                            {s.dh.holeId}
                          </div>
                          <div className="text-[9px] font-mono text-muted-foreground truncate">
                            {depth.toFixed(0)} m · {ivCount} iv
                          </div>
                        </div>
                        {active && <Crosshair className="h-3 w-3 text-cyan-300 shrink-0" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {focusedHoleId && (
                <button
                  onClick={() => onSelectFocus(null)}
                  className="w-full px-2 py-1.5 text-[9px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent border-t border-border"
                >
                  Limpiar focus
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mobile menu toggle */}
      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="absolute top-3 right-3 z-30 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-md bg-popover/95 border border-border shadow-md text-foreground active:bg-accent"
          title={mobileMenuOpen ? 'Cerrar menú' : 'Menú herramientas'}
          aria-label="Menú herramientas"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Layers className="h-5 w-5" />}
        </button>
      )}

      {/* Top-right: presets + actions */}
      <div
        className={
          isMobile
            ? `${mobileMenuOpen ? 'flex' : 'hidden'} absolute top-[4.25rem] right-3 z-20 flex-col gap-2 items-stretch w-[min(88vw,22rem)] max-h-[calc(100vh-5.5rem)] overflow-y-auto p-2 rounded-md bg-popover/95 border border-border shadow-xl [&_button]:min-h-[42px] [&_button]:text-xs [&_input[type=range]]:h-3`
            : 'absolute top-3 right-3 flex flex-col gap-2 items-end'
        }
      >
        <div className={isMobile ? 'flex flex-wrap gap-1.5 justify-stretch' : 'flex gap-1'}>
          {presetBtn('top', 'Top', 'q')}
          {presetBtn('north', 'N', 'w')}
          {presetBtn('east', 'E', 'e')}
          {presetBtn('persp', '3D', 'r')}
          {presetBtn('fit', 'Fit', 'f')}
        </div>
        <div className={isMobile ? 'flex flex-wrap gap-1.5' : 'flex gap-1 flex-wrap justify-end max-w-[calc(100vw-1.5rem)]'}>
          <button
            onClick={onScreenshot}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded bg-popover/90 border border-border hover:bg-accent text-foreground"
            title="Screenshot PNG"
          >
            <Camera className="h-3 w-3" /> PNG
          </button>
          <button
            onClick={onExportGlb}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded bg-popover/90 border border-border hover:bg-accent text-foreground"
            title="Exportar escena GLB (Blender/Vulcan)"
          >
            <Box className="h-3 w-3" /> GLB
          </button>
          <button
            onClick={() => setBasemap(basemap === 'grid' ? 'satellite' : basemap === 'satellite' ? 'topo' : 'grid')}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border ${basemap === 'satellite' ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-100' : basemap === 'topo' ? 'bg-amber-600/30 border-amber-500/60 text-amber-100' : 'bg-popover/90 border-border text-foreground'} hover:bg-accent`}
            title={basemap === 'grid' ? 'Cambiar a satélite' : basemap === 'satellite' ? 'Cambiar a terreno DEM' : 'Cambiar a grid'}
          >
            {basemap === 'satellite' ? (
              <><Satellite className="h-3 w-3" /> Sat</>
            ) : basemap === 'topo' ? (
              <><Mountain className="h-3 w-3" /> Topo</>
            ) : (
              <><Grid3x3 className="h-3 w-3" /> Grid</>
            )}
          </button>
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded bg-popover/90 border border-border hover:bg-accent text-foreground"
            title={isFullscreen ? 'Salir pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            {isFullscreen ? 'Salir' : 'Full'}
          </button>
          <button
            onClick={saveBookmark}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded bg-popover/90 border border-border hover:bg-accent text-foreground"
            title="Guardar vista actual"
          >
            <Bookmark className="h-3 w-3" /> Save
          </button>
          <button
            onClick={restoreBookmark}
            disabled={!hasBookmark}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border ${hasBookmark ? 'bg-popover/90 border-border text-foreground hover:bg-accent' : 'bg-popover/40 border-border/40 text-muted-foreground cursor-not-allowed'}`}
            title="Restaurar vista guardada (persistente)"
          >
            <BookmarkCheck className="h-3 w-3" /> Recall
          </button>
          {hasBookmark && (
            <button
              onClick={clearBookmark}
              className="flex items-center gap-0.5 px-1.5 py-1 text-[10px] font-mono rounded border bg-popover/90 border-border text-muted-foreground hover:bg-rose-500/20 hover:text-rose-200"
              title="Borrar vista guardada"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={() => setSectionEnabled(!sectionEnabled)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border ${sectionEnabled ? 'bg-cyan-600/30 border-cyan-500/60 text-cyan-100' : 'bg-popover/90 border-border text-foreground'} hover:bg-accent`}
            title="Sección horizontal"
          >
            <Scissors className="h-3 w-3" /> Section
          </button>
          {sectionEnabled && (
            <button
              onClick={onOpenSection2D}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border bg-cyan-700/40 border-cyan-500/60 text-cyan-100 hover:bg-cyan-700/60"
              title="Abrir vista 2D de sección (proyección plana)"
            >
              <Grid3x3 className="h-3 w-3" /> 2D
            </button>
          )}
          <button
            onClick={toggleMeasure}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border ${measureMode ? 'bg-amber-500/30 border-amber-400/70 text-amber-100' : 'bg-popover/90 border-border text-foreground'} hover:bg-accent`}
            title="Medir distancia 3D — click para colocar puntos · Esc/M cancelar · Backspace deshacer"
          >
            <Ruler className="h-3 w-3" /> Measure{measureCount > 0 ? ` (${measureCount})` : ''}
          </button>
          {measureMode && measureCount > 0 && (
            <button
              onClick={clearMeasure}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border bg-popover/90 border-border text-foreground hover:bg-accent"
              title="Limpiar mediciones"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          {hasStations && (
            <button
              onClick={() => setShowStations(!showStations)}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border ${showStations ? 'bg-cyan-600/30 border-cyan-500/60 text-cyan-100' : 'bg-popover/90 border-border text-foreground'} hover:bg-accent`}
            >
              {showStations ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} Stations
            </button>
          )}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border ${showLabels ? 'bg-popover/90 border-border text-foreground' : 'bg-slate-800/80 border-slate-600/50 text-muted-foreground'} hover:bg-accent`}
            title={showLabels ? 'Ocultar IDs sondajes' : 'Mostrar IDs sondajes'}
          >
            {showLabels ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />} IDs
          </button>
          <button
            onClick={() => setHeatmapEnabled(!heatmapEnabled)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border ${heatmapEnabled ? 'bg-orange-500/30 border-orange-400/70 text-orange-100' : 'bg-popover/90 border-border text-foreground'} hover:bg-accent`}
            title="Heatmap RQD volumétrico (IDW interpolación 3D)"
          >
            <Flame className="h-3 w-3" /> Heatmap RQD
          </button>
        </div>

        {heatmapEnabled && (
          <div className="rounded-md border border-orange-500/40 bg-popover/95 backdrop-blur shadow-sm px-3 py-2 space-y-1.5 w-60">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-orange-200">
              <Flame className="h-3 w-3" /> Heatmap RQD (IDW)
            </div>
            <label className="flex items-center gap-2 text-[10px] font-mono text-foreground">
              <span className="w-12 text-muted-foreground">Opacity</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={heatmapOpacity}
                onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))}
                className="flex-1 accent-orange-500"
              />
              <span className="w-7 text-right tabular-nums">{Math.round(heatmapOpacity * 100)}%</span>
            </label>
            <label className="flex items-center gap-2 text-[10px] font-mono text-foreground">
              <span className="w-12 text-muted-foreground">Min RQD</span>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={heatmapMinRqd}
                onChange={(e) => setHeatmapMinRqd(parseFloat(e.target.value))}
                className="flex-1 accent-orange-500"
              />
              <span className="w-7 text-right tabular-nums">{heatmapMinRqd}%</span>
            </label>
            <p className="text-[9px] text-muted-foreground">Voxels coloreados por RQD interpolado desde puntos medios de intervalos.</p>
          </div>
        )}

        {holeCount > 1 && (
          <div className="flex items-center gap-0 rounded border border-border bg-popover/95 shadow-sm overflow-hidden">
            <button
              onClick={() => onCycleFocus(-1)}
              className="px-1.5 py-1 hover:bg-accent text-foreground"
              title="Sondaje anterior (←)"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono border-x border-border ${focusMode ? 'bg-amber-500/20 text-amber-100' : 'text-foreground hover:bg-accent'}`}
              title={focusMode ? 'Foco ON — otros atenuados' : 'Foco OFF — todos iguales'}
            >
              <Crosshair className="h-3 w-3" />
              {focusedHoleLabel ? (
                <span>
                  {focusedHoleLabel}
                  <span className="ml-1 text-muted-foreground">
                    {focusIndex + 1}/{holeCount}
                  </span>
                </span>
              ) : (
                <span>{holeCount} sondajes</span>
              )}
            </button>
            <button
              onClick={() => onCycleFocus(1)}
              className="px-1.5 py-1 hover:bg-accent text-foreground"
              title="Sondaje siguiente (→)"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-0 rounded border border-border bg-popover/95 shadow-sm overflow-hidden">
          <span className="px-2 py-1 text-[10px] font-mono text-muted-foreground border-r border-border">V×</span>
          {[1, 2, 3, 5].map((v) => (
            <button
              key={v}
              onClick={() => setVScale(v)}
              className={`px-2 py-1 text-[10px] font-mono ${vScale === v ? 'bg-violet-500/25 text-violet-100' : 'text-foreground hover:bg-accent'}`}
              title={`Exageración vertical ${v}×`}
            >
              {v}×
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0 rounded border border-border bg-popover/95 shadow-sm overflow-hidden">
          <span className="px-2 py-1 text-[10px] font-mono text-muted-foreground border-r border-border">Color</span>
          {([
            ['lithology', 'Lito'],
            ['rqd', 'RQD'],
            ['recovery', 'Rec'],
            ['depth', 'Prof'],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setColorBy(k)}
              className={`px-2 py-1 text-[10px] font-mono ${colorBy === k ? 'bg-fuchsia-500/25 text-fuchsia-100' : 'text-foreground hover:bg-accent'}`}
              title={`Colorear por ${label}`}
            >
              {label}
            </button>
          ))}
        </div>

        {(basemap === 'satellite' || basemap === 'topo') && (
          <div className="rounded-md border border-border bg-popover/95 px-2.5 py-2 shadow-sm w-44">
            <div className="flex items-center justify-between text-[10px] font-mono text-foreground mb-1">
              <span className="flex items-center gap-1">
                {basemap === 'topo' ? <Mountain className="h-3 w-3" /> : <Satellite className="h-3 w-3" />}
                Opacidad terreno
              </span>
              <span>{Math.round(terrainOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.15}
              max={1}
              step={0.05}
              value={terrainOpacity}
              onChange={(e) => setTerrainOpacity(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        )}

        {!isMobile && (
          <div className="px-2 py-1 text-[10px] font-mono text-muted-foreground bg-popover/80 border border-border rounded leading-tight">
            Q/W/E/R/F · S sec · B base · M med · P PNG{holeCount > 1 ? ' · ←/→' : ''}
          </div>
        )}
      </div>

      {/* Section slider */}
      {sectionEnabled && (
        <div
          className={
            isMobile
              ? 'absolute bottom-3 left-3 right-3 rounded-md border border-cyan-500/60 bg-popover/95 px-3 py-2.5 shadow-lg [&_input[type=range]]:h-3 [&_button]:min-h-[36px]'
              : 'absolute bottom-20 left-3 w-64 rounded-md border border-cyan-500/60 bg-popover/95 px-2.5 py-2 shadow-lg'
          }
        >
          <div className="flex items-center justify-between text-[10px] font-mono text-foreground mb-1.5">
            <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> Corte</span>
            <div className="flex items-center gap-0 rounded border border-border overflow-hidden">
              {([
                ['horizontal', 'H'],
                ['ns', 'N-S'],
                ['ew', 'E-W'],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setSectionAxis(k)}
                  className={`px-1.5 py-0.5 text-[9px] font-mono ${sectionAxis === k ? 'bg-cyan-500/30 text-cyan-100' : 'text-foreground hover:bg-accent'}`}
                  title={k === 'horizontal' ? 'Sección horizontal (profundidad)' : k === 'ns' ? 'Sección N-S (vertical)' : 'Sección E-W (vertical)'}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-foreground mb-1">
            <span className="text-muted-foreground">
              {sectionAxis === 'horizontal' ? 'Profundidad' : sectionAxis === 'ns' ? 'Posición E-W' : 'Posición N-S'}
            </span>
            <span>{sectionDepth.toFixed(0)} m</span>
          </div>
          <input
            type="range"
            min={sectionRange.min}
            max={sectionRange.max}
            step={1}
            value={sectionDepth}
            onChange={(e) => setSectionDepth(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <button
            onClick={() => setSectionDepth((sectionRange.min + sectionRange.max) / 2)}
            className="mt-1 text-[9px] font-mono text-muted-foreground hover:text-foreground"
          >
            Reset al centro
          </button>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-foreground mb-1">
            <span className="text-muted-foreground">Slab grosor</span>
            <span>{sectionThickness === 0 ? 'corte único' : `${sectionThickness.toFixed(0)} m`}</span>
          </div>
          <input
            type="range"
            min={0}
            max={Math.max(50, Math.round((sectionRange.max - sectionRange.min) / 4))}
            step={1}
            value={sectionThickness}
            onChange={(e) => setSectionThickness(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />

          <div className="mt-2 pt-2 border-t border-border space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-muted-foreground uppercase tracking-wide">Ribbons</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={addRibbon}
                  className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-100 border border-cyan-500/40"
                  title="Guardar corte actual como ribbon"
                >
                  + Add
                </button>
                {ribbons.length > 0 && (
                  <button
                    onClick={clearRibbons}
                    className="px-1.5 py-0.5 text-[10px] font-mono rounded text-muted-foreground hover:text-rose-200 hover:bg-rose-500/15"
                    title="Borrar todos los ribbons"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {ribbons.length === 0 ? (
              <p className="text-[9px] font-mono text-muted-foreground italic">Sin ribbons. Configura corte y pulsa +Add para fijarlo.</p>
            ) : (
              <ul className="space-y-1 max-h-32 overflow-y-auto">
                {ribbons.map((rb, i) => (
                  <li key={rb.id} className="flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: rb.color }} />
                    <button
                      onClick={() => activateRibbon(rb)}
                      className="flex-1 text-left text-foreground hover:text-cyan-200 truncate"
                      title="Activar este corte como sección actual"
                    >
                      <span className="text-muted-foreground">#{i + 1}</span> {rb.axis === 'horizontal' ? 'H' : rb.axis === 'ns' ? 'N-S' : 'E-W'} @ {rb.depth.toFixed(0)} m
                    </button>
                    <button
                      onClick={() => {
                        activateRibbon(rb);
                        onOpenSection2D();
                      }}
                      className="px-1.5 py-0.5 text-[9px] font-mono rounded text-cyan-200 hover:bg-cyan-700/30 shrink-0"
                      title="Ver este ribbon en vista 2D"
                    >
                      2D
                    </button>
                    <button
                      onClick={() => removeRibbon(rb.id)}
                      className="text-muted-foreground hover:text-rose-300 shrink-0"
                      title="Quitar ribbon"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Bottom-left: legend + filters */}
      <div
        className={
          isMobile && (sectionEnabled || pinned || pinnedStation)
            ? 'hidden'
            : isMobile
            ? 'absolute bottom-3 left-3 right-3 rounded-md border border-border bg-popover/90 px-2.5 py-2 [&_button]:min-h-[36px]'
            : 'absolute bottom-3 left-3 rounded-md border border-border bg-popover/90 px-2.5 py-1.5 max-w-md'
        }
      >
        {colorBy === 'lithology' ? (
          <div className="flex flex-wrap gap-2">
            {['Ignea', 'Sedimentaria', 'Metamorfica', 'Otro'].map((g) => {
              const hidden = hiddenGroups.has(g);
              const count = flat.filter((f) => f.group === g || (g === 'Otro' && !['Ignea', 'Sedimentaria', 'Metamorfica'].includes(f.group))).length;
              return (
                <button
                  key={g}
                  onClick={() => toggleGroup(g)}
                  className={`flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded font-mono ${hidden ? 'opacity-40 line-through' : ''} hover:bg-accent`}
                  title={hidden ? 'Mostrar' : 'Ocultar'}
                >
                  <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: rockColor(g) }} />
                  {g} <span className="text-muted-foreground">({count})</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 min-w-[260px]">
            <span className="text-[10px] font-mono text-foreground uppercase tracking-wide">
              {colorBy === 'rqd' ? 'RQD' : 'Recuperación'}
            </span>
            <div className="relative flex-1 h-3 rounded-sm overflow-hidden border border-border">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(to right, rgb(239,68,68) 0%, rgb(239,135,68) 25%, rgb(245,158,11) 50%, rgb(132,180,80) 75%, rgb(34,197,94) 100%)',
                }}
              />
            </div>
            <div className="flex items-center gap-2 text-[9px] font-mono text-muted-foreground">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom-right: compass */}
      <div
        className={
          isMobile
            ? 'hidden'
            : 'absolute bottom-3 right-24 w-14 h-14 rounded-full border border-border bg-popover/90 flex items-center justify-center shadow-md'
        }
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${-compassAz * (180 / Math.PI)}deg)` }}
        >
          <span className="absolute top-0.5 text-[9px] font-mono font-bold text-rose-400">N</span>
          <span className="absolute bottom-0.5 text-[8px] font-mono text-muted-foreground">S</span>
          <span className="absolute left-1 text-[8px] font-mono text-muted-foreground">W</span>
          <span className="absolute right-1 text-[8px] font-mono text-muted-foreground">E</span>
          <Compass className="h-5 w-5 text-foreground/80" />
        </div>
      </div>

      {/* Bottom-center: scale bar */}
      <div
        className={
          isMobile
            ? 'hidden'
            : 'absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-2 py-1 rounded bg-popover/80 border border-border'
        }
      >
        <Maximize2 className="h-3 w-3 text-muted-foreground" />
        <div className="flex items-center gap-1">
          <span
            className="block h-1.5 bg-foreground/70 rounded-sm transition-all duration-150"
            style={{ width: `${scaleBar.widthPx}px` }}
          />
          <span className="text-[10px] font-mono text-foreground/80 tabular-nums">{scaleBar.label}</span>
        </div>
        {vScale !== 1 && (
          <span
            className="text-[9px] font-mono px-1 py-0.5 rounded bg-violet-500/25 text-violet-100"
            title="Exageración vertical activa"
          >
            V×{vScale}
          </span>
        )}
      </div>

      {/* Pinned interval panel */}
      {pinned && (
        <div
          className={
            isMobile
              ? 'absolute bottom-3 left-3 right-3 rounded-md border border-amber-500/50 bg-popover/95 backdrop-blur shadow-xl overflow-hidden max-h-[55vh] overflow-y-auto'
              : 'absolute top-3 left-1/2 -translate-x-1/2 w-80 rounded-md border border-amber-500/50 bg-popover/95 backdrop-blur shadow-xl overflow-hidden'
          }
        >
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-amber-500/10">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-amber-200">
              <Pin className="h-3 w-3" /> Intervalo fijado
            </div>
            <button
              onClick={clearPinned}
              className="text-muted-foreground hover:text-foreground"
              title="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-3 space-y-2 text-xs">
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-semibold text-foreground">{pinned.hole.holeId}</span>
              <span className="font-mono text-muted-foreground">
                {pinned.fromDepth.toFixed(1)}–{pinned.toDepth.toFixed(1)} m
              </span>
            </div>
            <div>
              <p className="font-medium text-foreground">{pinned.interval.rockType}</p>
              <p className="text-muted-foreground text-[11px]">
                {pinned.group} · {pinned.interval.color} · {pinned.interval.texture}
              </p>
            </div>
            {(pinned.interval.alteration || pinned.interval.mineralization) && (
              <div className="space-y-0.5 text-[11px] text-muted-foreground">
                {pinned.interval.alteration && (
                  <div>
                    <span className="text-foreground/70">Alteración:</span> {pinned.interval.alteration}
                    {pinned.interval.alterationIntensity ? ` (${pinned.interval.alterationIntensity})` : ''}
                  </div>
                )}
                {pinned.interval.mineralization && (
                  <div>
                    <span className="text-foreground/70">Mineraliz.:</span> {pinned.interval.mineralization}
                    {pinned.interval.mineralizationPercent != null
                      ? ` · ${pinned.interval.mineralizationPercent}%`
                      : ''}
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {pinned.interval.rqd != null && <RampBar label="RQD" value={pinned.interval.rqd} />}
              {pinned.interval.recovery != null && <RampBar label="Rec" value={pinned.interval.recovery} />}
            </div>
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => {
                  const midDepth = (pinned.fromDepth + pinned.toDepth) / 2;
                  const target = pinned.collar.clone().addScaledVector(pinned.direction, midDepth);
                  rigRef.current?.flyTo(target);
                }}
                className="text-[10px] font-mono px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 border border-amber-500/40"
                title="Centrar cámara en el intervalo"
              >
                Fly to
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pinned station panel */}
      {pinnedStation && (
        <div
          className={
            isMobile
              ? 'absolute bottom-3 left-3 right-3 rounded-md border border-cyan-500/50 bg-popover/95 backdrop-blur shadow-xl overflow-hidden max-h-[55vh] overflow-y-auto'
              : 'absolute top-3 left-3 w-72 rounded-md border border-cyan-500/50 bg-popover/95 backdrop-blur shadow-xl overflow-hidden'
          }
        >
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-cyan-500/10">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wide text-cyan-200">
              <Pin className="h-3 w-3" /> Estación
            </div>
            <button
              onClick={clearPinnedStation}
              className="text-muted-foreground hover:text-foreground"
              title="Cerrar"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-3 space-y-2 text-xs">
            <div className="flex items-baseline justify-between">
              <span className="font-mono font-semibold text-foreground">{pinnedStation.code}</span>
              <span className="font-mono text-muted-foreground">
                {new Date(pinnedStation.date).toLocaleDateString('es-CL')}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground space-y-0.5">
              <div>
                <span className="text-foreground/70">Geólogo:</span> {pinnedStation.geologist}
              </div>
              <div className="font-mono">
                {pinnedStation.latitude.toFixed(6)}, {pinnedStation.longitude.toFixed(6)}
              </div>
              {pinnedStation.altitude != null && (
                <div className="font-mono">
                  <span className="text-foreground/70">Alt:</span> {pinnedStation.altitude.toFixed(1)} m
                </div>
              )}
              {pinnedStation.weatherConditions && (
                <div>
                  <span className="text-foreground/70">Clima:</span> {pinnedStation.weatherConditions}
                </div>
              )}
            </div>
            {pinnedStation.description && (
              <p className="text-[11px] text-foreground/90 line-clamp-3">{pinnedStation.description}</p>
            )}
            <div className="pt-1 flex justify-end">
              <button
                onClick={() => {
                  const p = localCoords(pinnedStation, origin);
                  if (demSampler) {
                    const elev = demSampler(pinnedStation.latitude, pinnedStation.longitude);
                    if (Number.isFinite(elev)) p.y = elev;
                  }
                  rigRef.current?.flyTo(p);
                }}
                className="text-[10px] font-mono px-2 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-100 border border-cyan-500/40"
                title="Centrar cámara en la estación"
              >
                Fly to
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hover tooltip following cursor */}
      {hover && (
        <div
          className="pointer-events-none absolute rounded-md border border-border bg-popover/95 p-2 text-xs shadow-lg space-y-0.5 max-w-xs z-10"
          style={{
            left: Math.min(hover.screenX + 14, (typeof window !== 'undefined' ? window.innerWidth - 240 : 0)),
            top: Math.max(hover.screenY - 60, 10),
          }}
        >
          <p className="font-mono font-semibold text-foreground">{hover.holeId}</p>
          <p className="text-foreground">
            {hover.rockType}{' '}
            <span className="text-muted-foreground">({hover.rockGroup})</span>
          </p>
          <p className="text-muted-foreground font-mono">
            {hover.fromDepth.toFixed(1)}–{hover.toDepth.toFixed(1)} m
          </p>
          {hover.rqd != null && <RampBar label="RQD" value={hover.rqd} />}
          {hover.recovery != null && <RampBar label="Rec" value={hover.recovery} />}
        </div>
      )}
    </>
  );
}

function RampBar({ label, value }: { label: string; value: number }) {
  const color = rampColor(value);
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10px]">
      <span className="text-muted-foreground w-7">{label}</span>
      <span className="relative block h-1.5 w-20 rounded bg-foreground/10 overflow-hidden">
        <span
          className="absolute inset-y-0 left-0"
          style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }}
        />
      </span>
      <span className="text-foreground/80">{value}%</span>
    </div>
  );
}
