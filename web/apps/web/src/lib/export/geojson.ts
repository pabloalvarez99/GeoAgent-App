import type { GeoStation, GeoDrillHole } from '@geoagent/geo-shared/types';

export interface GeoExportData {
  projectName: string;
  stations: GeoStation[];
  drillHoles: GeoDrillHole[];
}

export function exportGeoJSON(data: GeoExportData): string {
  const features: object[] = [];

  for (const s of data.stations) {
    if (!s.latitude || !s.longitude) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.longitude, s.latitude, s.altitude ?? 0] },
      properties: {
        type: 'station',
        id: s.id,
        code: s.code,
        date: s.date,
        geologist: s.geologist,
        description: s.description,
        weatherConditions: s.weatherConditions ?? null,
        projectId: s.projectId,
      },
    });
  }

  for (const d of data.drillHoles) {
    if (!d.latitude || !d.longitude) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [d.longitude, d.latitude, d.altitude ?? 0] },
      properties: {
        type: 'drillhole',
        id: d.id,
        holeId: d.holeId,
        drillType: d.type,
        geologist: d.geologist,
        azimuth: d.azimuth,
        inclination: d.inclination,
        plannedDepth: d.plannedDepth,
        actualDepth: d.actualDepth ?? null,
        status: d.status,
        startDate: d.startDate ?? null,
        endDate: d.endDate ?? null,
        projectId: d.projectId,
      },
    });
  }

  return JSON.stringify({ type: 'FeatureCollection', features }, null, 2);
}

export function downloadGeoJSON(data: GeoExportData, filename: string) {
  const json = exportGeoJSON(data);
  const blob = new Blob([json], { type: 'application/geo+json' });
  triggerDownload(blob, `${filename}.geojson`);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
