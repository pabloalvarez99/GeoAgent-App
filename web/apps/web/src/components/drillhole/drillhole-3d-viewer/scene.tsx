import { Component, Suspense, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment, Grid, GizmoHelper, GizmoViewport, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, SMAA, Vignette, N8AO } from '@react-three/postprocessing';
import { CameraRig, type CameraRigHandle } from './camera-rig';
import { CollarMarker } from './collar';
import { PlannedTrace } from './planned-trace';
import { SatelliteGround } from './satellite-ground';
import { TerrainGround } from './terrain-ground';
import { InstancedIntervals } from './intervals';
import { SectionPlaneVisual, type SectionRibbon } from './section-plane';
import { MeasureTool } from './measure-tool';
import { RqdHeatmap } from './rqd-heatmap';
import type { FlatInstance, HoverInfo, SceneItem } from './types';
import type { GeoStation } from '@geoagent/geo-shared/types';
import { localCoords } from './utils';
import { Html } from '@react-three/drei';

interface Props {
  scenes: SceneItem[];
  flat: FlatInstance[];
  highlightId?: string;
  hiddenGroups: Set<string>;
  sectionEnabled: boolean;
  sectionDepth: number;
  sectionThickness: number;
  showStations: boolean;
  stations?: GeoStation[];
  selectedStationId: string | null;
  onSelectStation: (s: GeoStation | null) => void;
  basemap: 'grid' | 'satellite' | 'topo';
  terrainOpacity: number;
  vScale: number;
  sectionAxis: import('./section-plane').SectionAxis;
  onSelectInterval: (item: import('./types').FlatInstance | null) => void;
  selectedKey: string | null;
  origin: { lat: number; lng: number };
  center: THREE.Vector3;
  radius: number;
  rigRef: React.RefObject<CameraRigHandle | null>;
  onHover: (h: HoverInfo | null) => void;
  onCollarClick: (target: THREE.Vector3) => void;
  onGl: (gl: THREE.WebGLRenderer) => void;
  onScene?: (scene: THREE.Scene) => void;
  onDemReady?: (sampler: ((lat: number, lng: number) => number) | null) => void;
  measureMode: boolean;
  measurePoints: THREE.Vector3[];
  measureHover: THREE.Vector3 | null;
  onMeasureClick: (p: THREE.Vector3) => void;
  onMeasureHover: (p: THREE.Vector3 | null) => void;
  showLabels: boolean;
  heatmapEnabled: boolean;
  heatmapOpacity: number;
  heatmapMinRqd: number;
  ribbons: SectionRibbon[];
}

class HdrBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn('[3d-viewer] HDR Environment load failed, degrading to ambient-only:', err);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function Scene(props: Props) {
  const {
    scenes,
    flat,
    hiddenGroups,
    sectionEnabled,
    sectionDepth,
    sectionThickness,
    showStations,
    stations,
    selectedStationId,
    onSelectStation,
    basemap,
    terrainOpacity,
    vScale,
    sectionAxis,
    onSelectInterval,
    selectedKey,
    origin,
    center,
    radius,
    rigRef,
    onHover,
    onCollarClick,
    onGl,
    onScene,
    onDemReady,
    measureMode,
    measurePoints,
    measureHover,
    onMeasureClick,
    onMeasureHover,
    showLabels,
    heatmapEnabled,
    heatmapOpacity,
    heatmapMinRqd,
    ribbons,
  } = props;

  const groundY = useMemo(() => {
    if (scenes.length === 0) return 0;
    return scenes.reduce((s, sc) => s + sc.collar.y, 0) / scenes.length;
  }, [scenes]);

  const planes = useMemo(() => {
    if (!sectionEnabled) return [] as THREE.Plane[];
    const half = sectionThickness / 2;
    const ribbon = sectionThickness > 0;
    if (sectionAxis === 'ns') {
      const hi = sectionDepth + half;
      const lo = sectionDepth - half;
      const top = new THREE.Plane(new THREE.Vector3(-1, 0, 0), hi);
      if (!ribbon) return [top];
      return [top, new THREE.Plane(new THREE.Vector3(1, 0, 0), -lo)];
    }
    if (sectionAxis === 'ew') {
      const hi = sectionDepth + half;
      const lo = sectionDepth - half;
      const top = new THREE.Plane(new THREE.Vector3(0, 0, -1), hi);
      if (!ribbon) return [top];
      return [top, new THREE.Plane(new THREE.Vector3(0, 0, 1), -lo)];
    }
    const hi = (sectionDepth + half) * vScale;
    const lo = (sectionDepth - half) * vScale;
    const top = new THREE.Plane(new THREE.Vector3(0, -1, 0), hi);
    if (!ribbon) return [top];
    return [top, new THREE.Plane(new THREE.Vector3(0, 1, 0), -lo)];
  }, [sectionEnabled, sectionDepth, sectionThickness, vScale, sectionAxis]);

  const initialPos = useMemo<[number, number, number]>(
    () => [center.x + radius * 4, center.y + radius * 3, center.z + radius * 4],
    [center, radius],
  );

  const onCreatedRan = useRef(false);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: initialPos, fov: 50, near: 0.1, far: 100000 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl, scene }) => {
        if (onCreatedRan.current) return;
        onCreatedRan.current = true;
        gl.localClippingEnabled = true;
        onGl(gl);
        onScene?.(scene);
      }}
    >
      <color attach="background" args={['#0b1220']} />
      <fog attach="fog" args={['#0b1220', radius * 6, radius * 18]} />
      <ambientLight intensity={0.28} />
      <directionalLight
        position={[radius * 1.5, radius * 2.5, radius * 1.2]}
        intensity={0.85}
        color="#fef3c7"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-radius * 1.2, radius * 0.9, -radius]} intensity={0.22} color="#93c5fd" />

      <Suspense fallback={null}>
        <HdrBoundary>
          <Suspense fallback={null}>
            <Environment files="/hdri/dawn.hdr" background={false} />
          </Suspense>
        </HdrBoundary>

        {basemap === 'topo' ? (
          <TerrainGround
            origin={origin}
            center={new THREE.Vector3(center.x, groundY, center.z)}
            radius={radius}
            opacity={terrainOpacity}
            onDemReady={onDemReady}
          />
        ) : basemap === 'satellite' ? (
          <SatelliteGround
            origin={origin}
            center={new THREE.Vector3(center.x, groundY, center.z)}
            radius={radius}
            opacity={terrainOpacity}
          />
        ) : (
          <Grid
            args={[Math.max(radius * 6, 200), Math.max(radius * 6, 200)]}
            position={[center.x, groundY, center.z]}
            cellSize={Math.max(radius * 0.05, 5)}
            cellColor="#1e293b"
            cellThickness={0.6}
            sectionSize={Math.max(radius * 0.25, 25)}
            sectionColor="#475569"
            sectionThickness={1}
            fadeDistance={Math.max(radius * 5, 250)}
            fadeStrength={1.5}
            followCamera={false}
            infiniteGrid
          />
        )}
        <ContactShadows
          position={[center.x, groundY + 0.05, center.z]}
          opacity={0.45}
          scale={Math.max(radius * 4, 120)}
          blur={2.4}
          far={radius * 2}
          color="#000000"
        />

        <InstancedIntervals
          flat={flat}
          hiddenGroups={hiddenGroups}
          clippingPlanes={planes}
          onHover={onHover}
          onSelect={onSelectInterval}
          selectedKey={selectedKey}
        />

        {scenes.map(({ dh, collar, direction }) => (
          <group key={dh.id}>
            <CollarMarker
              collar={collar}
              label={dh.holeId}
              onClick={() => onCollarClick(collar)}
              scale={Math.max(radius * 0.025, 2)}
              showLabel={showLabels}
            />
            <PlannedTrace
              collar={collar}
              direction={direction}
              totalDepth={dh.plannedDepth}
              scale={Math.max(radius * 0.025, 2)}
              vScale={vScale}
            />
          </group>
        ))}

        {heatmapEnabled && (
          <RqdHeatmap
            flat={flat}
            opacity={heatmapOpacity}
            minRqd={heatmapMinRqd}
            voxelSize="auto"
            searchRadius="auto"
          />
        )}

        {showStations && stations?.map((s) => {
          const p = localCoords(s, origin);
          return (
            <StationCone
              key={s.id}
              station={s}
              position={p}
              selected={selectedStationId === s.id}
              onSelect={onSelectStation}
            />
          );
        })}

        {sectionEnabled && (() => {
          const half = sectionThickness / 2;
          const scaleH = sectionAxis === 'horizontal' ? vScale : 1;
          const baseDepth = sectionDepth * scaleH;
          if (sectionThickness > 0) {
            return (
              <>
                <SectionPlaneVisual center={center} size={radius} depth={baseDepth + half * scaleH} axis={sectionAxis} />
                <SectionPlaneVisual center={center} size={radius} depth={baseDepth - half * scaleH} axis={sectionAxis} />
              </>
            );
          }
          return <SectionPlaneVisual center={center} size={radius} depth={baseDepth} axis={sectionAxis} />;
        })()}

        {ribbons.map((rb) => {
          const scaleH = rb.axis === 'horizontal' ? vScale : 1;
          return (
            <SectionPlaneVisual
              key={rb.id}
              center={center}
              size={radius}
              depth={rb.depth * scaleH}
              axis={rb.axis}
              color={rb.color}
              opacity={0.18}
            />
          );
        })}

        <MeasureTool points={measurePoints} hover={measureHover} active={measureMode} />

        {measureMode && (
          <mesh
            position={[center.x, groundY, center.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerMove={(e) => {
              e.stopPropagation();
              onMeasureHover(e.point.clone());
            }}
            onPointerOut={() => onMeasureHover(null)}
            onClick={(e) => {
              e.stopPropagation();
              onMeasureClick(e.point.clone());
            }}
          >
            <planeGeometry args={[Math.max(radius * 12, 1000), Math.max(radius * 12, 1000)]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        )}
      </Suspense>

      <CameraRig ref={rigRef} center={center} radius={radius} />

      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
      </GizmoHelper>

      <EffectComposer multisampling={0}>
        {flat.length < 800 ? (
          <N8AO aoRadius={Math.max(radius * 0.04, 3)} intensity={1.2} distanceFalloff={0.8} />
        ) : (
          <></>
        )}
        {flat.length < 1500 ? (
          <Bloom intensity={0.18} luminanceThreshold={0.92} luminanceSmoothing={0.2} mipmapBlur />
        ) : (
          <Bloom intensity={0.1} luminanceThreshold={0.95} luminanceSmoothing={0.15} />
        )}
        <SMAA />
        <Vignette eskil={false} offset={0.2} darkness={0.55} />
      </EffectComposer>
    </Canvas>
  );
}

function StationCone({
  station,
  position,
  selected,
  onSelect,
}: {
  station: GeoStation;
  position: THREE.Vector3;
  selected: boolean;
  onSelect: (s: GeoStation | null) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const scale = selected ? 1.6 : hovered ? 1.35 : 1;
  const color = selected ? '#fbbf24' : '#06b6d4';
  const emissiveIntensity = selected ? 0.85 : hovered ? 0.65 : 0.4;
  return (
    <group position={position}>
      <mesh
        rotation={[Math.PI, 0, 0]}
        scale={scale}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = '';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(selected ? null : station);
        }}
      >
        <coneGeometry args={[1.2, 3, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} />
      </mesh>
      <Html distanceFactor={100} position={[0, 3.5 * scale, 0]} center>
        <div
          className={`px-1 py-0.5 text-[9px] font-mono rounded whitespace-nowrap pointer-events-none border ${
            selected
              ? 'bg-amber-500/30 border-amber-400/70 text-amber-100'
              : 'bg-popover/80 border-border text-foreground'
          }`}
        >
          {station.code}
        </div>
      </Html>
    </group>
  );
}
