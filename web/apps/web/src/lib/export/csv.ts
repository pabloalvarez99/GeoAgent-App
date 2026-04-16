import { saveFile } from '@/lib/electron';
import type { GeoDrillHole, GeoDrillInterval } from '@geoagent/geo-shared/types';

// ── CSV serialisation ─────────────────────────────────────────────────────────

function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => {
        const s = cell == null ? '' : String(cell);
        // Quote if contains comma, quote, newline
        return s.search(/[",\n\r]/) !== -1 ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(','),
    )
    .join('\r\n');
}

function fv(v: any) { return v != null && v !== '' ? v : ''; }

// ── Collar CSV ────────────────────────────────────────────────────────────────
//
// Standard: one row per drill hole.
// Columns use mining-software naming (Leapfrog, Surpac, Micromine compatible).
// Coordinates stored as LATITUDE/LONGITUDE (WGS84) — no projected conversion.
// Field geologists: load into QGIS, reproject to local UTM if needed.

export function exportCollarCsv(drillHoles: GeoDrillHole[]): string {
  const header = [
    'BHID', 'LATITUDE', 'LONGITUDE', 'ELEVATION',
    'EOH',       // End-Of-Hole depth (actual or planned)
    'AZIMUTH', 'DIP',
    'DRILL_TYPE', 'STATUS',
    'GEOLOGIST',
    'START_DATE', 'END_DATE',
    'NOTES',
  ];
  const rows = drillHoles.map((d) => [
    d.holeId,
    fv(d.latitude),
    fv(d.longitude),
    fv(d.altitude),
    fv(d.actualDepth ?? d.plannedDepth),
    fv(d.azimuth),
    fv(d.inclination),
    fv(d.type),
    fv(d.status),
    fv(d.geologist),
    fv(d.startDate),
    fv(d.endDate),
    fv(d.notes),
  ]);
  return toCsv([header, ...rows]);
}

// ── Survey CSV ────────────────────────────────────────────────────────────────
//
// Standard: azimuth + dip readings at depth intervals.
// For straight holes: provide collar (0m) and total-depth readings so
// software like Leapfrog doesn't complain about single-entry survey files.

export function exportSurveyCsv(drillHoles: GeoDrillHole[]): string {
  const header = ['BHID', 'AT', 'AZ', 'DIP'];
  const rows: (string | number)[][] = [];
  for (const d of drillHoles) {
    const az  = fv(d.azimuth)    || 0;
    const dip = fv(d.inclination) || -90;
    const eoh = d.actualDepth ?? d.plannedDepth ?? 0;
    // Collar reading (depth 0)
    rows.push([d.holeId, 0, az, dip]);
    // End-of-hole reading (required by most logging software)
    if (eoh > 0) {
      rows.push([d.holeId, eoh, az, dip]);
    }
  }
  return toCsv([header, ...rows]);
}

// ── Lithology CSV ─────────────────────────────────────────────────────────────
//
// Standard lith log. Named "lith" not "assay" — assay is chemical analysis.
// Compatible with Leapfrog Geo's "Lithology" table import.

export function exportLithCsv(
  intervals: Array<GeoDrillInterval & { holeId: string }>,
): string {
  const header = [
    'BHID', 'FROM', 'TO', 'LENGTH',
    'ROCK_GROUP', 'ROCK_TYPE',
    'COLOR', 'TEXTURE', 'GRAIN_SIZE',
    'MINERALOGY',
    'ALTERATION', 'ALTER_INTENSITY',
    'MIN_PCT',
    'RQD_PCT', 'RECOVERY_PCT',
    'STRUCTURE', 'WEATHERING',
    'NOTES',
  ];
  const sorted = [...intervals].sort((a, b) => {
    if (a.holeId < b.holeId) return -1;
    if (a.holeId > b.holeId) return 1;
    return a.fromDepth - b.fromDepth;
  });
  const rows = sorted.map((i) => {
    const len = i.toDepth != null ? +(i.toDepth - i.fromDepth).toFixed(2) : '';
    return [
      i.holeId,
      i.fromDepth,
      fv(i.toDepth),
      len,
      fv(i.rockGroup),
      fv(i.rockType),
      fv(i.color),
      fv(i.texture),
      fv(i.grainSize),
      fv(i.mineralogy),
      fv(i.alteration),
      fv(i.alterationIntensity),
      fv(i.mineralizationPercent),
      fv(i.rqd),
      fv(i.recovery),
      fv(i.structure),
      fv(i.weathering),
      fv(i.notes),
    ];
  });
  return toCsv([header, ...rows]);
}

// ── Download bundle (ZIP) ────────────────────────────────────────────────────
//
// Packages collar + survey + lith into a single .zip.
// Uses JSZip — loaded dynamically to keep initial bundle size small.

export async function downloadCsvBundle(
  drillHoles: GeoDrillHole[],
  allIntervals: Array<GeoDrillInterval & { holeId: string }>,
  projectSlug: string,
) {
  const collarCsv  = exportCollarCsv(drillHoles);
  const surveyCsv  = exportSurveyCsv(drillHoles);
  const lithCsv    = exportLithCsv(allIntervals);

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  zip.file(`${projectSlug}_collar.csv`,  collarCsv);
  zip.file(`${projectSlug}_survey.csv`,  surveyCsv);
  zip.file(`${projectSlug}_lith.csv`,    lithCsv);

  // README inside the zip
  zip.file('README.txt', [
    `GeoAgent — Exportación de sondajes`,
    `Proyecto: ${projectSlug}`,
    `Generado: ${new Date().toISOString()}`,
    ``,
    `Archivos:`,
    `  ${projectSlug}_collar.csv   — Cabecera de sondajes (lat/lon WGS84)`,
    `  ${projectSlug}_survey.csv   — Levantamiento direccional`,
    `  ${projectSlug}_lith.csv     — Log litológico por intervalos`,
    ``,
    `Compatibilidad: Leapfrog Geo, Surpac, Micromine, QGIS`,
    `CRS: WGS84 (EPSG:4326) — reprojectar a UTM local antes de modelar.`,
  ].join('\n'));

  const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
  await saveFile(`${projectSlug}_sondajes.zip`, zipBuffer);
}
