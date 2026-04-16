import { saveFile } from '@/lib/electron';
import type {
  GeoStation,
  GeoDrillHole,
  GeoLithology,
  GeoStructural,
  GeoSample,
  GeoDrillInterval,
} from '@geoagent/geo-shared/types';

export interface GeoExportData {
  projectName: string;
  projectDescription?: string;
  stations: GeoStation[];
  drillHoles: GeoDrillHole[];
  lithologies?: GeoLithology[];
  structural?: GeoStructural[];
  samples?: GeoSample[];
  intervals?: GeoDrillInterval[];
}

// ── Marker styles (GitHub GeoJSON viewer + Mapbox convention) ────────────────

const STATION_COLOR  = '#22C55E';   // green
const DRILLHOLE_COLOR = '#7C3AED';  // purple

// ── BBox helper ──────────────────────────────────────────────────────────────

function calcBbox(coords: Array<[number, number, number]>): [number, number, number, number, number, number] | undefined {
  if (coords.length === 0) return undefined;
  let minLon = Infinity, minLat = Infinity, minAlt = Infinity;
  let maxLon = -Infinity, maxLat = -Infinity, maxAlt = -Infinity;
  for (const [lon, lat, alt] of coords) {
    if (lon < minLon) minLon = lon;
    if (lat < minLat) minLat = lat;
    if (alt < minAlt) minAlt = alt;
    if (lon > maxLon) maxLon = lon;
    if (lat > maxLat) maxLat = lat;
    if (alt > maxAlt) maxAlt = alt;
  }
  return [minLon, minLat, minAlt, maxLon, maxLat, maxAlt];
}

// ── Clean helper: remove nulls/undefined from objects ────────────────────────

function clean<T extends Record<string, any>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v != null && v !== ''),
  ) as Partial<T>;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function exportGeoJSON(data: GeoExportData): string {
  const features: object[] = [];
  const allCoords: Array<[number, number, number]> = [];

  // Index sub-data by parent ID for O(1) lookup
  const lithoByStation   = new Map<string, GeoLithology[]>();
  const structByStation  = new Map<string, GeoStructural[]>();
  const samplesByStation = new Map<string, GeoSample[]>();
  const intervalsByHole  = new Map<string, GeoDrillInterval[]>();

  for (const l of data.lithologies ?? []) {
    if (!lithoByStation.has(l.stationId)) lithoByStation.set(l.stationId, []);
    lithoByStation.get(l.stationId)!.push(l);
  }
  for (const s of data.structural ?? []) {
    if (!structByStation.has(s.stationId)) structByStation.set(s.stationId, []);
    structByStation.get(s.stationId)!.push(s);
  }
  for (const s of data.samples ?? []) {
    if (!samplesByStation.has(s.stationId)) samplesByStation.set(s.stationId, []);
    samplesByStation.get(s.stationId)!.push(s);
  }
  for (const iv of data.intervals ?? []) {
    if (!intervalsByHole.has(iv.drillHoleId)) intervalsByHole.set(iv.drillHoleId, []);
    intervalsByHole.get(iv.drillHoleId)!.push(iv);
  }

  // ── Station features ──────────────────────────────────────────────────────
  for (const s of data.stations) {
    if (!s.latitude || !s.longitude) continue;
    const alt = s.altitude ?? 0;
    allCoords.push([s.longitude, s.latitude, alt]);

    const lithologies = (lithoByStation.get(s.id) ?? []).map((l) => clean({
      rockType: l.rockType,
      rockGroup: l.rockGroup,
      color: l.color,
      texture: l.texture,
      grainSize: l.grainSize,
      mineralogy: l.mineralogy,
      alteration: l.alteration,
      alterationIntensity: l.alterationIntensity,
      mineralization: l.mineralization,
      mineralizationPercent: l.mineralizationPercent,
      structure: l.structure,
      weathering: l.weathering,
      notes: l.notes,
    }));

    const structural = (structByStation.get(s.id) ?? []).map((st) => clean({
      type: st.type,
      strike: st.strike,
      dip: st.dip,
      dipDirection: st.dipDirection,
      movement: st.movement,
      thickness: st.thickness,
      filling: st.filling,
      roughness: st.roughness,
      continuity: st.continuity,
      notes: st.notes,
    }));

    const samples = (samplesByStation.get(s.id) ?? []).map((sm) => clean({
      code: sm.code,
      type: sm.type,
      description: sm.description,
      weight: sm.weight,
      length: sm.length,
      status: sm.status,
      destination: sm.destination,
      analysisRequested: sm.analysisRequested,
      latitude: sm.latitude,
      longitude: sm.longitude,
    }));

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [s.longitude, s.latitude, alt],
      },
      properties: {
        // ── Identity ──
        feature_type: 'station',
        code: s.code,
        date: s.date,
        geologist: s.geologist,
        description: s.description,
        weatherConditions: s.weatherConditions ?? null,
        // ── Geological sub-data ──
        lithologies_count: lithologies.length,
        structural_count:  structural.length,
        samples_count:     samples.length,
        lithologies:       lithologies.length > 0 ? lithologies : undefined,
        structural:        structural.length > 0 ? structural : undefined,
        samples:           samples.length > 0 ? samples : undefined,
        // ── Primary lithology summary (for easy GIS symbology) ──
        primary_rock_type:  lithologies[0]?.rockType ?? null,
        primary_rock_group: lithologies[0]?.rockGroup ?? null,
        // ── Map styling hints ──
        'marker-color':  STATION_COLOR,
        'marker-symbol': 'circle',
        'marker-size':   'medium',
      },
    });
  }

  // ── Drillhole features ─────────────────────────────────────────────────────
  for (const d of data.drillHoles) {
    if (!d.latitude || !d.longitude) continue;
    const alt = d.altitude ?? 0;
    allCoords.push([d.longitude, d.latitude, alt]);

    const sortedIntervals = (intervalsByHole.get(d.id) ?? [])
      .sort((a, b) => a.fromDepth - b.fromDepth)
      .map((iv) => clean({
        from: iv.fromDepth,
        to: iv.toDepth,
        rockType: iv.rockType,
        rockGroup: iv.rockGroup,
        color: iv.color,
        texture: iv.texture,
        grainSize: iv.grainSize,
        mineralogy: iv.mineralogy,
        alteration: iv.alteration,
        alterationIntensity: iv.alterationIntensity,
        mineralizationPercent: iv.mineralizationPercent,
        rqd: iv.rqd,
        recovery: iv.recovery,
        structure: iv.structure,
        weathering: iv.weathering,
        notes: iv.notes,
      }));

    // Compute percent complete
    const pctComplete = d.actualDepth != null && d.plannedDepth > 0
      ? Math.round((d.actualDepth / d.plannedDepth) * 100)
      : null;

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [d.longitude, d.latitude, alt],
      },
      properties: {
        // ── Identity ──
        feature_type:   'drillhole',
        holeId:         d.holeId,
        drillType:      d.type,
        geologist:      d.geologist,
        azimuth:        d.azimuth,
        inclination:    d.inclination,
        plannedDepth:   d.plannedDepth,
        actualDepth:    d.actualDepth ?? null,
        percentComplete: pctComplete,
        status:         d.status,
        startDate:      d.startDate ?? null,
        endDate:        d.endDate ?? null,
        notes:          d.notes ?? null,
        // ── Interval log ──
        intervals_count: sortedIntervals.length,
        intervals:       sortedIntervals.length > 0 ? sortedIntervals : undefined,
        // ── Map styling hints ──
        'marker-color':  DRILLHOLE_COLOR,
        'marker-symbol': 'triangle',
        'marker-size':   'medium',
      },
    });
  }

  const bbox = calcBbox(allCoords);

  const featureCollection: Record<string, any> = {
    type: 'FeatureCollection',
    name: data.projectName,
    ...(data.projectDescription ? { description: data.projectDescription } : {}),
    ...(bbox ? { bbox } : {}),
    generated: new Date().toISOString(),
    generator: 'GeoAgent v1.0',
    crs: {
      type: 'name',
      properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' },
    },
    features,
  };

  return JSON.stringify(featureCollection, null, 2);
}

export async function downloadGeoJSON(data: GeoExportData, slug: string) {
  const json = exportGeoJSON(data);
  const encoder = new TextEncoder();
  await saveFile(`${slug}.geojson`, encoder.encode(json).buffer as ArrayBuffer);
}
