'use client';

import { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { APIProvider, Map, AdvancedMarker, Pin, Polyline, useMap } from '@vis.gl/react-google-maps';
import {
  ArrowLeft,
  Layers,
  Drill,
  X,
  MapPin,
  User,
  Calendar,
  Compass,
  ArrowDown,
  AlertTriangle,
  Loader2,
  Map as MapIcon,
  List,
  ExternalLink,
  Copy,
  Ruler,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useStations } from '@/lib/hooks/use-stations';
import { useDrillHoles } from '@/lib/hooks/use-drillholes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { GeoStation, GeoDrillHole } from '@geoagent/geo-shared/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type SelectedFeature =
  | { kind: 'station'; data: GeoStation }
  | { kind: 'drillhole'; data: GeoDrillHole };

// ── Constants ─────────────────────────────────────────────────────────────────

const CHILE_CENTER = { lat: -33.45, lng: -70.65 };
const DEFAULT_ZOOM = 12;
const NO_DATA_ZOOM = 5;

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeCenter(
  stations: GeoStation[],
  drillHoles: GeoDrillHole[],
): { lat: number; lng: number } {
  const points: { lat: number; lng: number }[] = [
    ...stations.map((s) => ({ lat: s.latitude, lng: s.longitude })),
    ...drillHoles.map((d) => ({ lat: d.latitude, lng: d.longitude })),
  ];
  if (points.length === 0) return CHILE_CENTER;
  const lat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const lng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  return { lat, lng };
}

function formatCoord(val: number, decimals = 5) {
  return val.toFixed(decimals);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StationPanel({ station, onClose }: { station: GeoStation; onClose: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Estación
            </span>
          </div>
          <h2 className="text-lg font-bold font-mono">{station.code}</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 text-sm overflow-y-auto flex-1 pr-1">
        {/* Description */}
        {station.description && (
          <div className="rounded-md bg-muted/40 px-3 py-2 text-muted-foreground leading-relaxed">
            {station.description}
          </div>
        )}

        {/* Key-value rows */}
        <Row icon={<User className="h-3.5 w-3.5" />} label="Geólogo" value={station.geologist} />
        <Row icon={<Calendar className="h-3.5 w-3.5" />} label="Fecha" value={station.date} />

        {station.weatherConditions && (
          <Row label="Condiciones" value={station.weatherConditions} />
        )}

        {/* Coordinates */}
        <div className="border-t border-border/50 pt-3 mt-3 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            Coordenadas
          </p>
          <div className="grid grid-cols-2 gap-2">
            <CoordChip label="Latitud" value={formatCoord(station.latitude)} />
            <CoordChip label="Longitud" value={formatCoord(station.longitude)} />
            {station.altitude != null && (
              <CoordChip label="Altitud" value={`${station.altitude} m`} />
            )}
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${station.latitude},${station.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir en Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

function DrillHolePanel({ dh, onClose }: { dh: GeoDrillHole; onClose: () => void }) {
  const actualDepth = dh.actualDepth ?? 0;
  const pct =
    dh.plannedDepth > 0 ? Math.min(100, (actualDepth / dh.plannedDepth) * 100) : 0;

  const statusColor =
    dh.status === 'Completado'
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : dh.status === 'En Progreso'
        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
        : dh.status === 'Abandonado'
          ? 'bg-red-500/20 text-red-400 border-red-500/30'
          : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
            <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Sondaje
            </span>
          </div>
          <h2 className="text-lg font-bold font-mono">{dh.holeId}</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3 text-sm overflow-y-auto flex-1 pr-1">
        {/* Status + type */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">{dh.type}</Badge>
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor}`}>
            {dh.status}
          </span>
        </div>

        <Row icon={<User className="h-3.5 w-3.5" />} label="Geólogo" value={dh.geologist} />

        {/* Depth */}
        <div className="rounded-md bg-muted/40 px-3 py-2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-muted-foreground">
              <ArrowDown className="h-3 w-3" />
              Profundidad
            </span>
            <span className="font-mono font-medium">
              {actualDepth} / {dh.plannedDepth} m
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-right">{pct.toFixed(0)}% perforado</p>
        </div>

        {/* Orientation */}
        <div className="border-t border-border/50 pt-3 mt-3 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
            <Compass className="h-3 w-3" />
            Orientación
          </p>
          <div className="grid grid-cols-2 gap-2">
            <CoordChip label="Azimut" value={`${dh.azimuth}°`} />
            <CoordChip label="Inclinación" value={`${dh.inclination}°`} />
          </div>
        </div>

        {/* Coordinates */}
        <div className="border-t border-border/50 pt-3 mt-3 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            Coordenadas
          </p>
          <div className="grid grid-cols-2 gap-2">
            <CoordChip label="Latitud" value={formatCoord(dh.latitude)} />
            <CoordChip label="Longitud" value={formatCoord(dh.longitude)} />
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${dh.latitude},${dh.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-primary hover:underline mt-1"
          >
            <ExternalLink className="h-3 w-3" />
            Abrir en Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {icon && <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>}
      <span className="text-muted-foreground shrink-0 min-w-[72px]">{label}</span>
      <span className="font-medium text-foreground break-words min-w-0">{value}</span>
    </div>
  );
}

function CoordChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-2.5 py-1.5">
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className="text-xs font-mono font-semibold">{value}</p>
    </div>
  );
}

// ── No API Key card ───────────────────────────────────────────────────────────

function NoApiKeyCard() {
  return (
    <div className="flex items-center justify-center h-full">
      <Card className="max-w-md w-full mx-4 border-yellow-500/30 bg-yellow-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-yellow-400 text-base">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            API Key de Google Maps requerida
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-3">
          <p>
            Para visualizar el mapa es necesario configurar una clave de Google Maps API.
          </p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs">
            <li>
              Obtén una clave en{' '}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
              >
                Google Cloud Console
              </a>
            </li>
            <li>Activa la API <strong>Maps JavaScript API</strong></li>
            <li>
              Agrega la variable en <code className="bg-muted px-1 rounded">.env.local</code>:
            </li>
          </ol>
          <pre className="bg-muted rounded-md px-3 py-2 text-xs font-mono overflow-x-auto">
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu_clave_aqui
          </pre>
          <p className="text-xs">Reinicia el servidor de desarrollo después de agregar la variable.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { stations, loading: loadingStations } = useStations(projectId);
  const { drillHoles, loading: loadingDrillHoles } = useDrillHoles(projectId);

  const [selected, setSelected] = useState<SelectedFeature | null>(null);
  const [showList, setShowList] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [mapClick, setMapClick] = useState<{ lat: number; lng: number } | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const loading = loadingStations || loadingDrillHoles;

  const searchParams = useSearchParams();
  const urlLat = searchParams.get('center_lat');
  const urlLng = searchParams.get('center_lng');
  const urlZoom = searchParams.get('center_zoom');

  const center = useMemo(
    () => computeCenter(stations, drillHoles),
    // Only recompute when data finishes loading to avoid map jumping
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading],
  );

  const defaultZoom =
    stations.length === 0 && drillHoles.length === 0 ? NO_DATA_ZOOM : DEFAULT_ZOOM;

  const initialCenter = urlLat && urlLng
    ? { lat: parseFloat(urlLat), lng: parseFloat(urlLng) }
    : center;
  const initialZoom = urlZoom ? parseInt(urlZoom, 10) : defaultZoom;

  const hasNoApiKey = !apiKey;

  return (
    // Negative margin to escape the p-6 padding of the parent <main>, then fill full height
    <div className="-m-6 flex flex-col h-[calc(100vh_-_var(--header-height,56px))]">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-background z-10 shrink-0 flex-wrap gap-y-2">
        {/* Back */}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>

        {/* Title */}
        <div className="flex items-center gap-2 mr-2">
          <MapIcon className="h-4 w-4 text-primary shrink-0" />
          <h1 className="font-semibold text-sm">Mapa del proyecto</h1>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-4 w-px bg-border" />

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500 shrink-0" />
            Estaciones
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
            Sondajes
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-4 w-px bg-border" />

        {/* Counts */}
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="text-xs gap-1.5 font-normal"
          >
            <Layers className="h-3 w-3 text-blue-400" />
            {loading ? '…' : stations.length} estación{stations.length !== 1 ? 'es' : ''}
          </Badge>
          <Badge
            variant="secondary"
            className="text-xs gap-1.5 font-normal"
          >
            <Drill className="h-3 w-3 text-amber-400" />
            {loading ? '…' : drillHoles.length} sondaje{drillHoles.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Split view toggle */}
        <button
          onClick={() => setShowList((v) => !v)}
          className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
            showList
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
          title="Vista dividida (mapa + lista)"
        >
          <List className="h-3.5 w-3.5" />
          Lista
        </button>

        {/* Map type switcher */}
        <div className="flex items-center gap-1">
          {(
            [
              { id: 'roadmap', label: 'Mapa' },
              { id: 'satellite', label: 'Satélite' },
              { id: 'hybrid', label: 'Híbrido' },
              { id: 'terrain', label: 'Terreno' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMapTypeId(id)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                mapTypeId === id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body: map + optional side panel ── */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Cargando datos...</span>
            </div>
          </div>
        )}

        {/* ── List panel (split view) ── */}
        <div
          className={`shrink-0 border-r border-border bg-background overflow-hidden transition-all duration-200 flex flex-col
            ${showList ? 'w-64' : 'w-0'}`}
        >
          {showList && (
            <>
              <div className="px-3 py-2 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                {stations.length + drillHoles.length} elemento{stations.length + drillHoles.length !== 1 ? 's' : ''}
              </div>
              <div className="overflow-y-auto flex-1 py-1">
                {/* Stations */}
                {stations.length > 0 && (
                  <>
                    <p className="px-3 py-1 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Estaciones ({stations.length})
                    </p>
                    {stations.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSelected({ kind: 'station', data: st })}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent transition-colors
                          ${selected?.kind === 'station' && selected.data.id === st.id ? 'bg-accent' : ''}`}
                      >
                        <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="font-mono font-medium truncate">{st.code}</span>
                        <span className="text-muted-foreground ml-auto shrink-0">{st.date?.slice(0, 10) ?? ''}</span>
                      </button>
                    ))}
                  </>
                )}
                {/* Drill holes */}
                {drillHoles.length > 0 && (
                  <>
                    <p className="px-3 py-1 mt-1 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                      Sondajes ({drillHoles.length})
                    </p>
                    {drillHoles.map((dh) => (
                      <button
                        key={dh.id}
                        onClick={() => setSelected({ kind: 'drillhole', data: dh })}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent transition-colors
                          ${selected?.kind === 'drillhole' && selected.data.id === dh.id ? 'bg-accent' : ''}`}
                      >
                        <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="font-mono font-medium truncate">{dh.holeId}</span>
                        <span className="text-muted-foreground ml-auto shrink-0">{dh.plannedDepth}m</span>
                      </button>
                    ))}
                  </>
                )}
                {stations.length === 0 && drillHoles.length === 0 && (
                  <p className="px-3 py-4 text-xs text-muted-foreground text-center">Sin datos</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Map area */}
        <div className="flex-1 min-w-0 relative">
          {hasNoApiKey ? (
            <NoApiKeyCard />
          ) : (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={initialCenter}
                defaultZoom={initialZoom}
                mapTypeId={mapTypeId}
                mapId="geoagent-map"
                disableDefaultUI={false}
                mapTypeControl={false}
                fullscreenControl={false}
                streetViewControl={false}
                zoomControl
                style={{ width: '100%', height: '100%' }}
                onClick={(e) => {
                  setSelected(null);
                  const ll = e.detail?.latLng;
                  if (ll) setMapClick({ lat: ll.lat, lng: ll.lng });
                }}
              >
                {/* Station markers — blue */}
                {stations.map((station) => (
                  <AdvancedMarker
                    key={`st-${station.id}`}
                    position={{ lat: station.latitude, lng: station.longitude }}
                    onClick={(e) => {
                      e.stop();
                      setSelected({ kind: 'station', data: station });
                    }}
                    title={station.code}
                  >
                    <Pin
                      background="#3b82f6"
                      borderColor="#1d4ed8"
                      glyphColor="#ffffff"
                      scale={selected?.kind === 'station' && selected.data.id === station.id ? 1.3 : 1}
                    />
                  </AdvancedMarker>
                ))}

                {/* DrillHole markers — amber */}
                {drillHoles.map((dh) => (
                  <AdvancedMarker
                    key={`dh-${dh.id}`}
                    position={{ lat: dh.latitude, lng: dh.longitude }}
                    onClick={(e) => {
                      e.stop();
                      setSelected({ kind: 'drillhole', data: dh });
                    }}
                    title={dh.holeId}
                  >
                    <Pin
                      background="#f59e0b"
                      borderColor="#b45309"
                      glyphColor="#ffffff"
                      scale={selected?.kind === 'drillhole' && selected.data.id === dh.id ? 1.3 : 1}
                    />
                  </AdvancedMarker>
                ))}
              </Map>
            </APIProvider>
          )}

          {/* Empty state */}
          {!hasNoApiKey && !loading && stations.length === 0 && drillHoles.length === 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
              <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground shadow-lg">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>No hay estaciones ni sondajes con coordenadas registradas</span>
              </div>
            </div>
          )}

          {/* Coordinate click overlay */}
          {mapClick && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-background/95 backdrop-blur-sm border border-border rounded-lg pl-3 pr-1.5 py-1.5 shadow-lg">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="font-mono text-xs text-foreground">
                {mapClick.lat.toFixed(6)}, {mapClick.lng.toFixed(6)}
              </span>
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-muted transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(`${mapClick.lat.toFixed(6)}, ${mapClick.lng.toFixed(6)}`);
                  toast.success('Coordenadas copiadas');
                }}
              >
                <Copy className="h-3 w-3" />
                Copiar
              </button>
              <Link
                href={`/projects/${projectId}/stations/new?lat=${mapClick.lat.toFixed(6)}&lng=${mapClick.lng.toFixed(6)}`}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Crear estación
              </Link>
              <button
                className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted transition-colors"
                onClick={() => setMapClick(null)}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Side panel ── */}
        <div
          className={`
            shrink-0 border-l border-border bg-background/95 backdrop-blur-sm
            transition-all duration-200 overflow-hidden
            ${selected ? 'w-72' : 'w-0'}
          `}
        >
          {selected && (
            <div className="w-72 h-full p-4">
              {selected.kind === 'station' ? (
                <StationPanel
                  station={selected.data}
                  onClose={() => setSelected(null)}
                />
              ) : (
                <DrillHolePanel
                  dh={selected.data}
                  onClose={() => setSelected(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
