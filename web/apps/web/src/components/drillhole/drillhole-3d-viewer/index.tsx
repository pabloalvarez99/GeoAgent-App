'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { CameraRigHandle } from './camera-rig';
import { Hud } from './hud';
import { Scene } from './scene';
import { CrossSection2D } from './cross-section-2d';
import { FenceDiagram2D } from './fence-diagram-2d';
import type { SectionRibbon } from './section-plane';
import type { DrillHole3DViewerProps, FlatInstance, HoverInfo } from './types';
import type { GeoStation } from '@geoagent/geo-shared/types';

function instanceKey(it: FlatInstance) {
  return `${it.hole.id}-${it.interval.id}`;
}
import { azimuthInclinationToVector, localCoords, rampColor, rockColor } from './utils';
import { useSceneBounds } from './hooks';
import { saveFile } from '@/lib/electron';

export default function DrillHole3DViewer({
  drillHoles,
  highlightId,
  fillParent,
  stations,
  projectId,
}: DrillHole3DViewerProps) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [hiddenGroups, setHiddenGroups] = useState<Set<string>>(new Set());
  const [sectionEnabled, setSectionEnabled] = useState(false);
  const [sectionDepth, setSectionDepth] = useState(0);
  const [sectionThickness, setSectionThickness] = useState(0);
  const [sectionAxis, setSectionAxis] = useState<'horizontal' | 'ns' | 'ew'>('horizontal');
  const [showStations, setShowStations] = useState(false);
  const [basemap, setBasemap] = useState<'grid' | 'satellite' | 'topo'>('grid');
  const [terrainOpacity, setTerrainOpacity] = useState(0.65);
  const [vScale, setVScale] = useState(1);
  const [colorBy, setColorBy] = useState<'lithology' | 'rqd' | 'recovery' | 'depth'>('lithology');
  const [pinned, setPinned] = useState<FlatInstance | null>(null);
  const [pinnedStation, setPinnedStation] = useState<GeoStation | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [internalFocusId, setInternalFocusId] = useState<string | null>(highlightId ?? null);
  const [demSampler, setDemSampler] = useState<((lat: number, lng: number) => number) | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.45);
  const [heatmapMinRqd, setHeatmapMinRqd] = useState(0);
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  const [measureHover, setMeasureHover] = useState<THREE.Vector3 | null>(null);
  const [showSection2D, setShowSection2D] = useState(false);
  const [showFence, setShowFence] = useState(false);
  const [ribbons, setRibbons] = useState<SectionRibbon[]>([]);
  const ribbonPalette = ['#06b6d4', '#a78bfa', '#f59e0b', '#ec4899', '#10b981', '#f43f5e', '#84cc16'];
  const addRibbon = useCallback(() => {
    const raw = typeof window !== 'undefined'
      ? window.prompt('Nombre del corte (opcional)', '')
      : null;
    const name = raw?.trim() || undefined;
    setRibbons((prev) => {
      const id = `rb-${Date.now().toString(36)}-${prev.length}`;
      const color = ribbonPalette[prev.length % ribbonPalette.length];
      return [...prev, { id, axis: sectionAxis, depth: sectionDepth, color, name, thickness: sectionThickness }];
    });
  }, [sectionAxis, sectionDepth, sectionThickness]);
  const setRibbonThickness = useCallback((id: string, value: number) => {
    setRibbons((prev) => prev.map((r) => (r.id === id ? { ...r, thickness: value } : r)));
  }, []);
  const removeRibbon = useCallback((id: string) => {
    setRibbons((prev) => prev.filter((r) => r.id !== id));
  }, []);
  const renameRibbon = useCallback((id: string) => {
    setRibbons((prev) => {
      const rb = prev.find((r) => r.id === id);
      if (!rb) return prev;
      const raw = typeof window !== 'undefined'
        ? window.prompt('Nombre del corte', rb.name ?? '')
        : null;
      if (raw === null) return prev;
      const name = raw.trim() || undefined;
      return prev.map((r) => (r.id === id ? { ...r, name } : r));
    });
  }, []);
  const clearRibbons = useCallback(() => setRibbons([]), []);
  const activateRibbon = useCallback((rb: SectionRibbon) => {
    setSectionAxis(rb.axis);
    setSectionDepth(rb.depth);
    if (typeof rb.thickness === 'number') setSectionThickness(rb.thickness);
    setSectionEnabled(true);
  }, []);
  useEffect(() => {
    setInternalFocusId(highlightId ?? null);
  }, [highlightId]);
  const rigRef = useRef<CameraRigHandle>(null);
  const glRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'm') {
        e.preventDefault();
        setMeasureMode((on) => {
          if (on) {
            setMeasurePoints([]);
            setMeasureHover(null);
          }
          return !on;
        });
      } else if (e.key === 'Escape' && measureMode) {
        setMeasureMode(false);
        setMeasurePoints([]);
        setMeasureHover(null);
      } else if ((k === 'c' || k === 'delete' || e.key === 'Backspace') && measureMode && measurePoints.length > 0) {
        e.preventDefault();
        setMeasurePoints((prev) => prev.slice(0, -1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [measureMode, measurePoints.length]);

  const { origin, scenes } = useMemo(() => {
    if (drillHoles.length === 0) {
      return { origin: { lat: 0, lng: 0 }, scenes: [] };
    }
    const origin = {
      lat: drillHoles[0].drillHole.latitude,
      lng: drillHoles[0].drillHole.longitude,
    };
    const useDem = basemap === 'topo' && demSampler !== null;
    const scenes = drillHoles.map(({ drillHole, intervals }) => {
      const collar = localCoords(drillHole, origin);
      if (useDem) {
        const elev = demSampler(drillHole.latitude, drillHole.longitude);
        if (Number.isFinite(elev)) collar.y = elev;
      }
      return {
        dh: drillHole,
        collar,
        direction: azimuthInclinationToVector(drillHole.azimuth, drillHole.inclination),
        intervals,
      };
    });
    return { origin, scenes };
  }, [drillHoles, basemap, demSampler]);

  const { center, radius } = useSceneBounds(scenes);

  const effectiveFocusId = focusMode ? internalFocusId : null;

  const flat = useMemo<FlatInstance[]>(() => {
    const out: FlatInstance[] = [];
    const hiRadius = Math.max(radius * 0.018, 1.5);
    const loRadius = hiRadius * 0.6;
    let yMin = Infinity;
    let yMax = -Infinity;
    if (colorBy === 'depth') {
      scenes.forEach((s) => {
        const dirEff = new THREE.Vector3(s.direction.x, s.direction.y * vScale, s.direction.z);
        s.intervals.forEach((iv) => {
          const mid = (iv.fromDepth + iv.toDepth) / 2;
          const midY = s.collar.y + dirEff.y * mid;
          if (midY < yMin) yMin = midY;
          if (midY > yMax) yMax = midY;
        });
      });
    }
    const ySpan = yMax - yMin || 1;
    scenes.forEach((s) => {
      const isHi = !effectiveFocusId || s.dh.id === effectiveFocusId;
      const baseRadius = isHi ? hiRadius : loRadius;
      const dirEff = new THREE.Vector3(s.direction.x, s.direction.y * vScale, s.direction.z);
      s.intervals.forEach((iv) => {
        let color = rockColor(iv.rockGroup);
        if (colorBy === 'rqd') color = rampColor(iv.rqd ?? null);
        else if (colorBy === 'recovery') color = rampColor(iv.recovery ?? null);
        else if (colorBy === 'depth') {
          const mid = (iv.fromDepth + iv.toDepth) / 2;
          const midY = s.collar.y + dirEff.y * mid;
          // shallow = green (100), deep = red (0)
          const norm = ((midY - yMin) / ySpan) * 100;
          color = rampColor(Math.max(0, Math.min(100, norm)));
        }
        out.push({
          hole: s.dh,
          interval: iv,
          collar: s.collar,
          direction: dirEff,
          fromDepth: iv.fromDepth,
          toDepth: iv.toDepth,
          radius: baseRadius,
          color,
          group: iv.rockGroup || 'Otro',
        });
      });
    });
    return out;
  }, [scenes, effectiveFocusId, radius, vScale, colorBy]);

  const focusIndex = useMemo(() => {
    if (!internalFocusId) return -1;
    return scenes.findIndex((s) => s.dh.id === internalFocusId);
  }, [scenes, internalFocusId]);

  const selectFocus = useCallback(
    (id: string | null) => {
      if (!id) {
        setInternalFocusId(null);
        return;
      }
      const target = scenes.find((s) => s.dh.id === id);
      if (!target) return;
      setInternalFocusId(id);
      rigRef.current?.flyTo(target.collar);
    },
    [scenes],
  );

  const cycleFocus = useCallback(
    (dir: 1 | -1) => {
      if (scenes.length === 0) return;
      const cur = focusIndex >= 0 ? focusIndex : 0;
      const next = (cur + dir + scenes.length) % scenes.length;
      const target = scenes[next];
      setInternalFocusId(target.dh.id);
      rigRef.current?.flyTo(target.collar);
    },
    [scenes, focusIndex],
  );

  const sectionRange = useMemo(() => {
    if (flat.length === 0) return { min: -100, max: 100 };
    let min = Infinity;
    let max = -Infinity;
    flat.forEach((f) => {
      const a = f.collar.clone();
      const b = f.collar.clone().addScaledVector(f.direction, f.toDepth);
      const aVal = sectionAxis === 'ns' ? a.x : sectionAxis === 'ew' ? a.z : a.y;
      const bVal = sectionAxis === 'ns' ? b.x : sectionAxis === 'ew' ? b.z : b.y;
      min = Math.min(min, aVal, bVal);
      max = Math.max(max, aVal, bVal);
    });
    return { min: Math.floor(min) - 10, max: Math.ceil(max) + 10 };
  }, [flat, sectionAxis]);

  useEffect(() => {
    setSectionDepth((sectionRange.min + sectionRange.max) / 2);
  }, [sectionAxis, sectionRange.min, sectionRange.max]);

  const toggleGroup = useCallback((g: string) => {
    setHiddenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });
  }, []);

  const onExportGlb = useCallback(async () => {
    const scene = sceneRef.current;
    if (!scene) return;
    try {
      const mod = await import('three/examples/jsm/exporters/GLTFExporter.js');
      const Exporter = mod.GLTFExporter;
      const exporter = new Exporter();

      const exportRoot = new THREE.Group();
      exportRoot.name = 'GeoAgentExport';

      const collectMeshes = (src: THREE.Object3D) => {
        src.traverse((obj) => {
          const o = obj as THREE.Object3D & { isInstancedMesh?: boolean; isMesh?: boolean; isLine?: boolean; isLineSegments?: boolean };
          if (!(o.isMesh || o.isInstancedMesh || o.isLine || o.isLineSegments)) return;
          const mesh = obj as THREE.Mesh | THREE.InstancedMesh | THREE.Line;
          // skip ground / contactshadow / environment helpers
          const name = obj.name || '';
          if (/contactshadow|environment|gizmo|helper/i.test(name)) return;
          // skip if material is ShaderMaterial (postprocess / effects)
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          if (mats.some((m) => m && (m as THREE.Material).type === 'ShaderMaterial' && (m as THREE.Material).type !== 'MeshStandardMaterial')) {
            return;
          }
          const cloned = mesh.clone() as THREE.Mesh | THREE.InstancedMesh | THREE.Line;
          // strip textures: replace material with plain copy w/o maps
          const sanitize = (m: THREE.Material): THREE.Material => {
            const std = new THREE.MeshStandardMaterial();
            const src = m as THREE.MeshStandardMaterial;
            if (src.color) std.color.copy(src.color);
            if (typeof src.metalness === 'number') std.metalness = src.metalness;
            if (typeof src.roughness === 'number') std.roughness = src.roughness;
            if (src.emissive) std.emissive.copy(src.emissive);
            if (typeof src.emissiveIntensity === 'number') std.emissiveIntensity = src.emissiveIntensity;
            std.transparent = src.transparent;
            std.opacity = src.opacity;
            std.side = src.side;
            return std;
          };
          const newMats = mats.map((m) => (m ? sanitize(m as THREE.Material) : new THREE.MeshStandardMaterial()));
          (cloned as THREE.Mesh).material = Array.isArray(mesh.material) ? newMats : newMats[0];
          // bake world transform
          mesh.updateWorldMatrix(true, false);
          cloned.matrix.copy(mesh.matrixWorld);
          cloned.matrix.decompose(cloned.position, cloned.quaternion, cloned.scale);
          exportRoot.add(cloned);
        });
      };
      collectMeshes(scene);

      if (exportRoot.children.length === 0) {
        console.warn('[3d-viewer] GLB export: no exportable geometry');
        return;
      }

      const result = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(
          exportRoot,
          (gltf) => resolve(gltf as ArrayBuffer),
          (err) => reject(err),
          { binary: true, onlyVisible: true, embedImages: false },
        );
      });
      const blob = new Blob([result], { type: 'model/gltf-binary' });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `geoagent-3d-${projectId ?? 'scene'}-${ts}.glb`;
      await saveFile(filename, blob);
    } catch (err) {
      console.error('[3d-viewer] GLB export failed:', err);
    }
  }, [projectId]);

  const onScreenshot = useCallback(() => {
    const gl = glRef.current;
    if (!gl) return;
    gl.domElement.toBlob(async (blob) => {
      if (!blob) return;
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `geoagent-3d-${projectId ?? 'scene'}-${ts}.png`;
      try {
        await saveFile(filename, blob);
      } catch {
        // noop
      }
    }, 'image/png');
  }, [projectId]);

  const onCollarClick = useCallback((target: THREE.Vector3) => {
    rigRef.current?.flyTo(target);
  }, []);

  const handleDemReady = useCallback(
    (s: ((lat: number, lng: number) => number) | null) => {
      setDemSampler(() => s);
      if (s) {
        requestAnimationFrame(() => {
          rigRef.current?.applyPreset('fit');
        });
      }
    },
    [],
  );

  if (drillHoles.length === 0) {
    return (
      <div
        className={
          fillParent
            ? 'flex items-center justify-center h-full bg-card text-sm text-muted-foreground'
            : 'flex items-center justify-center h-[420px] rounded-lg border border-border bg-card text-sm text-muted-foreground'
        }
      >
        Sin sondajes para visualizar
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'relative h-screen w-screen bg-[#0b1220] overflow-hidden'
          : fillParent
          ? 'relative h-full w-full bg-gradient-to-b from-[#0b1220] via-[#0b1220] to-[#0b1220] overflow-hidden'
          : 'relative rounded-lg border border-border bg-gradient-to-b from-[#0b1220] via-[#0b1220] to-[#0b1220] overflow-hidden'
      }
    >
      <div className={isFullscreen || fillParent ? 'h-full w-full' : 'h-[480px] w-full'}>
        <Scene
          scenes={scenes}
          flat={flat}
          highlightId={effectiveFocusId ?? undefined}
          hiddenGroups={hiddenGroups}
          sectionEnabled={sectionEnabled}
          sectionDepth={sectionDepth}
          sectionThickness={sectionThickness}
          showStations={showStations}
          stations={stations}
          selectedStationId={pinnedStation?.id ?? null}
          onSelectStation={setPinnedStation}
          basemap={basemap}
          terrainOpacity={terrainOpacity}
          vScale={vScale}
          sectionAxis={sectionAxis}
          onSelectInterval={setPinned}
          selectedKey={pinned ? instanceKey(pinned) : null}
          origin={origin}
          center={center}
          radius={radius}
          rigRef={rigRef}
          onHover={setHover}
          onCollarClick={onCollarClick}
          onGl={(gl) => (glRef.current = gl)}
          onScene={(s) => (sceneRef.current = s)}
          onDemReady={handleDemReady}
          measureMode={measureMode}
          measurePoints={measurePoints}
          measureHover={measureHover}
          onMeasureClick={(p) => setMeasurePoints((prev) => [...prev, p])}
          onMeasureHover={setMeasureHover}
          showLabels={showLabels}
          heatmapEnabled={heatmapEnabled}
          heatmapOpacity={heatmapOpacity}
          heatmapMinRqd={heatmapMinRqd}
          ribbons={ribbons}
        />
      </div>

      <Hud
        rigRef={rigRef}
        scenes={scenes}
        flat={flat}
        hover={hover}
        hiddenGroups={hiddenGroups}
        toggleGroup={toggleGroup}
        sectionEnabled={sectionEnabled}
        setSectionEnabled={setSectionEnabled}
        sectionDepth={sectionDepth}
        setSectionDepth={setSectionDepth}
        sectionThickness={sectionThickness}
        setSectionThickness={setSectionThickness}
        sectionRange={sectionRange}
        sectionAxis={sectionAxis}
        setSectionAxis={setSectionAxis}
        showStations={showStations}
        setShowStations={setShowStations}
        hasStations={!!stations && stations.length > 0}
        onScreenshot={onScreenshot}
        onExportGlb={onExportGlb}
        basemap={basemap}
        setBasemap={setBasemap}
        terrainOpacity={terrainOpacity}
        setTerrainOpacity={setTerrainOpacity}
        vScale={vScale}
        setVScale={setVScale}
        colorBy={colorBy}
        setColorBy={setColorBy}
        pinned={pinned}
        clearPinned={() => setPinned(null)}
        pinnedStation={pinnedStation}
        clearPinnedStation={() => setPinnedStation(null)}
        origin={origin}
        demSampler={demSampler}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        focusMode={focusMode}
        setFocusMode={setFocusMode}
        focusedHoleId={internalFocusId}
        focusedHoleLabel={focusIndex >= 0 ? scenes[focusIndex].dh.holeId : null}
        focusIndex={focusIndex}
        holeCount={scenes.length}
        onCycleFocus={cycleFocus}
        onSelectFocus={selectFocus}
        measureMode={measureMode}
        toggleMeasure={() => {
          setMeasureMode((on) => {
            if (on) {
              setMeasurePoints([]);
              setMeasureHover(null);
            }
            return !on;
          });
        }}
        measureCount={measurePoints.length}
        clearMeasure={() => {
          setMeasurePoints([]);
          setMeasureHover(null);
        }}
        projectId={projectId}
        showLabels={showLabels}
        setShowLabels={setShowLabels}
        heatmapEnabled={heatmapEnabled}
        setHeatmapEnabled={setHeatmapEnabled}
        heatmapOpacity={heatmapOpacity}
        setHeatmapOpacity={setHeatmapOpacity}
        heatmapMinRqd={heatmapMinRqd}
        setHeatmapMinRqd={setHeatmapMinRqd}
        onOpenSection2D={() => setShowSection2D(true)}
        ribbons={ribbons}
        addRibbon={addRibbon}
        removeRibbon={removeRibbon}
        renameRibbon={renameRibbon}
        clearRibbons={clearRibbons}
        activateRibbon={activateRibbon}
        setRibbonThickness={setRibbonThickness}
        sectionRangeSpan={sectionRange.max - sectionRange.min}
        onOpenFence={() => setShowFence(true)}
      />

      {showSection2D && (
        <CrossSection2D
          flat={flat}
          axis={sectionAxis}
          depth={sectionDepth}
          thickness={sectionThickness}
          onClose={() => setShowSection2D(false)}
          projectId={projectId}
        />
      )}

      {showFence && ribbons.length >= 2 && (
        <FenceDiagram2D
          flat={flat}
          ribbons={ribbons}
          fallbackThickness={sectionThickness}
          onClose={() => setShowFence(false)}
          projectId={projectId}
        />
      )}
    </div>
  );
}
