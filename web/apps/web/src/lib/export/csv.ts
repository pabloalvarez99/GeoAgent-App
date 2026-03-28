import type { GeoDrillHole } from '@geoagent/geo-shared/types';

function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Collar CSV — one row per drill hole (Acme/industry standard format)
export function exportCollarCsv(drillHoles: GeoDrillHole[]): string {
  const header = ['BHID', 'X', 'Y', 'Z', 'LENGTH', 'AZIMUTH', 'DIP', 'TYPE', 'STATUS', 'START_DATE', 'END_DATE'];
  const rows = drillHoles.map((d) => [
    d.holeId,
    String(d.longitude ?? ''),
    String(d.latitude ?? ''),
    String(d.altitude ?? ''),
    String(d.actualDepth ?? d.plannedDepth ?? ''),
    String(d.azimuth ?? ''),
    String(d.inclination ?? ''),
    d.type ?? '',
    d.status ?? '',
    d.startDate ?? '',
    d.endDate ?? '',
  ]);
  return toCsv([header, ...rows]);
}

// Survey CSV — azimuth/inclination at depth (simplified: just collar survey)
export function exportSurveyCsv(drillHoles: GeoDrillHole[]): string {
  const header = ['BHID', 'AT', 'AZ', 'DIP'];
  const rows = drillHoles.map((d) => [d.holeId, '0', String(d.azimuth ?? ''), String(d.inclination ?? '')]);
  return toCsv([header, ...rows]);
}

// Assay CSV — drill intervals (lithology data)
export function exportAssayCsv(
  intervals: Array<{
    drillHoleId: string;
    holeId: string;
    fromDepth: number;
    toDepth: number;
    rockType: string;
    rockGroup: string;
    rqd?: number | null;
    recovery?: number | null;
    mineralizationPercent?: number | null;
  }>,
): string {
  const header = ['BHID', 'FROM', 'TO', 'ROCK_GROUP', 'ROCK_TYPE', 'RQD', 'RECOVERY', 'MINERAL_PCT'];
  const rows = intervals.map((i) => [
    i.holeId,
    String(i.fromDepth),
    String(i.toDepth),
    i.rockGroup,
    i.rockType,
    String(i.rqd ?? ''),
    String(i.recovery ?? ''),
    String(i.mineralizationPercent ?? ''),
  ]);
  return toCsv([header, ...rows]);
}

export function downloadCsvBundle(
  drillHoles: GeoDrillHole[],
  allIntervals: Array<any>,
  projectSlug: string,
) {
  const collarBlob = new Blob([exportCollarCsv(drillHoles)], { type: 'text/csv' });
  const surveyBlob = new Blob([exportSurveyCsv(drillHoles)], { type: 'text/csv' });
  const assayBlob = new Blob([exportAssayCsv(allIntervals)], { type: 'text/csv' });

  triggerDownload(collarBlob, `${projectSlug}_collar.csv`);
  setTimeout(() => triggerDownload(surveyBlob, `${projectSlug}_survey.csv`), 100);
  setTimeout(() => triggerDownload(assayBlob, `${projectSlug}_assay.csv`), 200);
}
