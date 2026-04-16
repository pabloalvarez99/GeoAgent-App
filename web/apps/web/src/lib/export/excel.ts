import * as XLSX from 'xlsx-js-style';
import { saveFile } from '@/lib/electron';
import type {
  GeoProject,
  GeoStation,
  GeoLithology,
  GeoStructural,
  GeoSample,
  GeoDrillHole,
  GeoDrillInterval,
} from '@geoagent/geo-shared/types';

export interface ExcelExportData {
  project: GeoProject;
  stations: GeoStation[];
  lithologies: GeoLithology[];
  structural: GeoStructural[];
  samples: GeoSample[];
  drillHoles: GeoDrillHole[];
  intervals: GeoDrillInterval[];
}

// ── Color constants (hex, no #) ───────────────────────────────────────────────

const C = {
  GREEN_DARK:   '0F7634',
  GREEN_MID:    '22C55E',
  GREEN_LIGHT:  'DCFCE7',
  PURPLE_DARK:  '6D28D9',
  PURPLE_LIGHT: 'EDE9FE',
  AMBER_DARK:   'D97706',
  AMBER_LIGHT:  'FEF3C7',
  BLUE_DARK:    '2563EB',
  BLUE_LIGHT:   'DBEAFE',
  RED_DARK:     'DC2626',
  RED_LIGHT:    'FEE2E2',
  SLATE:        '1E293B',
  MUTED:        '64748B',
  LIGHT:        'F8FAFC',
  BORDER:       'E2E8F0',
  WHITE:        'FFFFFF',
  ALT_ROW:      'F1F5F9',
};

// ── Style builders ────────────────────────────────────────────────────────────

type CellStyle = Record<string, any>;

function thinBorder(color = C.BORDER) {
  const s = { style: 'thin', color: { rgb: color } };
  return { top: s, bottom: s, left: s, right: s };
}

function headerStyle(bgRgb: string, fgRgb = C.WHITE): CellStyle {
  return {
    fill: { patternType: 'solid', fgColor: { rgb: bgRgb } },
    font: { bold: true, color: { rgb: fgRgb }, sz: 9 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
    border: thinBorder(bgRgb),
  };
}

function cellStyle(bgRgb: string, bold = false, align: 'left'|'center'|'right' = 'left'): CellStyle {
  return {
    fill: { patternType: 'solid', fgColor: { rgb: bgRgb } },
    font: { bold, color: { rgb: C.SLATE }, sz: 9 },
    alignment: { horizontal: align, vertical: 'center', wrapText: false },
    border: thinBorder(),
  };
}

const ROW_EVEN  = cellStyle(C.WHITE);
const ROW_ODD   = cellStyle(C.ALT_ROW);
const ROW_BOLD  = cellStyle(C.WHITE, true);
const CENTER    = { ...ROW_EVEN, alignment: { horizontal: 'center', vertical: 'center' } };

// ── Sheet helpers ─────────────────────────────────────────────────────────────

/** Compute column widths from data rows (max chars per col). */
function autoColWidths(headers: string[], rows: (string | number | null | undefined)[][]): XLSX.ColInfo[] {
  const widths = headers.map((h) => Math.max(h.length, 8));
  for (const row of rows) {
    row.forEach((cell, ci) => {
      const len = String(cell ?? '').length;
      if (len > widths[ci]) widths[ci] = len;
    });
  }
  return widths.map((w) => ({ wch: Math.min(w + 2, 48) }));
}

/** Build a styled sheet from headers + data rows. */
function makeSheet(
  headers: string[],
  rows: (string | number | null | undefined)[][],
  headerBg = C.GREEN_DARK,
): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = autoColWidths(headers, rows);
  ws['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' as any };
  if (ws['!ref']) {
    ws['!autofilter'] = { ref: ws['!ref'] };
  }

  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C2 = range.s.c; C2 <= range.e.c; ++C2) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C2 });
      if (!ws[addr]) continue;
      ws[addr].s = R === 0 ? headerStyle(headerBg) : (R % 2 === 0 ? ROW_ODD : ROW_EVEN);
    }
  }
  return ws;
}

/** Append a styled sheet to the workbook. */
function addSheet(wb: XLSX.WorkBook, name: string, headers: string[], rows: (string | number | null | undefined)[][], headerBg = C.GREEN_DARK) {
  XLSX.utils.book_append_sheet(wb, makeSheet(headers, rows, headerBg), name);
}

// ── Format helpers ────────────────────────────────────────────────────────────

const fv = (v: any, suffix = '') => (v != null && v !== '' ? `${v}${suffix}` : '');
const fp = (v: any) => (v != null && v !== '' ? `${v}%` : '');
const fc = (v: number | null | undefined) => (v != null ? v.toFixed(6) : '');
const fd = (v: string | null | undefined) => {
  if (!v) return '';
  try { return new Date(v).toLocaleDateString('es-CL'); } catch { return v; }
};

// ── Resumen sheet ─────────────────────────────────────────────────────────────

function addResumenSheet(wb: XLSX.WorkBook, data: ExcelExportData) {
  const ws = XLSX.utils.aoa_to_sheet([]);
  const rows: (string | number)[][] = [
    ['GeoAgent — Informe de Proyecto'],
    [],
    ['Proyecto',   data.project.name],
    ['Descripción', data.project.description ?? ''],
    ['Ubicación',  data.project.location ?? ''],
    ['Fecha',      new Date().toLocaleDateString('es-CL')],
    [],
    ['ESTADÍSTICAS DEL PROYECTO'],
    ['Estaciones de Campo',  data.stations.length],
    ['Litologías',           data.lithologies.length],
    ['Datos Estructurales',  data.structural.length],
    ['Muestras',             data.samples.length],
    ['Sondajes',             data.drillHoles.length],
    ['Intervalos de Sondaje', data.intervals.length],
  ];

  XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A1' });

  // Title style
  const titleCell = ws['A1'];
  if (titleCell) {
    titleCell.s = {
      fill: { patternType: 'solid', fgColor: { rgb: C.GREEN_DARK } },
      font: { bold: true, color: { rgb: C.WHITE }, sz: 14 },
      alignment: { horizontal: 'left', vertical: 'center' },
    };
  }

  // Section header style
  const statsHeader = ws['A8'];
  if (statsHeader) {
    statsHeader.s = {
      fill: { patternType: 'solid', fgColor: { rgb: C.GREEN_LIGHT } },
      font: { bold: true, color: { rgb: C.GREEN_DARK }, sz: 10 },
    };
  }

  // Label/value style for info rows
  ['A3','A4','A5','A6'].forEach((addr) => {
    if (ws[addr]) ws[addr].s = { font: { bold: true, color: { rgb: C.MUTED }, sz: 9 } };
  });
  ['B3','B4','B5','B6'].forEach((addr) => {
    if (ws[addr]) ws[addr].s = { font: { color: { rgb: C.SLATE }, sz: 9 } };
  });

  // Stats rows
  for (let r = 9; r <= 14; r++) {
    const labelAddr = XLSX.utils.encode_cell({ r: r - 1, c: 0 });
    const valueAddr = XLSX.utils.encode_cell({ r: r - 1, c: 1 });
    if (ws[labelAddr]) ws[labelAddr].s = { font: { color: { rgb: C.MUTED }, sz: 9 }, alignment: { horizontal: 'left' } };
    if (ws[valueAddr]) ws[valueAddr].s = { font: { bold: true, color: { rgb: C.GREEN_DARK }, sz: 11 } };
  }

  ws['!cols'] = [{ wch: 28 }, { wch: 50 }];
  ws['!rows'] = [{ hpt: 28 }];

  XLSX.utils.book_append_sheet(wb, ws, 'Resumen');
}

// ── Main export function ──────────────────────────────────────────────────────

export async function downloadExcel(data: ExcelExportData) {
  const wb = XLSX.utils.book_new();

  // Lookup maps for human-readable cross-references
  const stationCodeMap = new Map(data.stations.map((s) => [s.id, s.code]));
  const drillHoleMap   = new Map(data.drillHoles.map((d) => [d.id, d.holeId]));

  // ── Sheet 1: Resumen ────────────────────────────────────────────────────────
  addResumenSheet(wb, data);

  // ── Sheet 2: Estaciones ─────────────────────────────────────────────────────
  addSheet(wb, 'Estaciones', [
    'Código', 'Fecha', 'Geólogo', 'Descripción',
    'Latitud', 'Longitud', 'Altitud (m)',
    'Condiciones Clima',
  ], data.stations.map((s) => [
    s.code,
    fd(s.date),
    s.geologist,
    s.description ?? '',
    fc(s.latitude),
    fc(s.longitude),
    fv(s.altitude),
    fv(s.weatherConditions),
  ]));

  // ── Sheet 3: Litologías ──────────────────────────────────────────────────────
  addSheet(wb, 'Litologias', [
    'Estación', 'Grupo Roca', 'Tipo Roca', 'Color', 'Textura',
    'Granulometría', 'Mineralogía', 'Alteración', 'Intens. Alter.',
    'Mineralización', 'Min. %', 'Estructura', 'Meteorización', 'Notas',
  ], data.lithologies.map((l) => [
    stationCodeMap.get(l.stationId) ?? l.stationId,
    fv(l.rockGroup),
    fv(l.rockType),
    fv(l.color),
    fv(l.texture),
    fv(l.grainSize),
    fv(l.mineralogy),
    fv(l.alteration),
    fv(l.alterationIntensity),
    fv(l.mineralization),
    fp(l.mineralizationPercent),
    fv(l.structure),
    fv(l.weathering),
    fv(l.notes),
  ]));

  // ── Sheet 4: Estructural ─────────────────────────────────────────────────────
  addSheet(wb, 'Estructural', [
    'Estación', 'Tipo', 'Rumbo (°)', 'Buzamiento (°)', 'Dir. Buzamiento',
    'Movimiento', 'Espesor (m)', 'Relleno', 'Rugosidad', 'Continuidad', 'Notas',
  ], data.structural.map((s) => [
    stationCodeMap.get(s.stationId) ?? s.stationId,
    fv(s.type),
    fv(s.strike),
    fv(s.dip),
    fv(s.dipDirection),
    fv(s.movement),
    fv(s.thickness),
    fv(s.filling),
    fv(s.roughness),
    fv(s.continuity),
    fv(s.notes),
  ]), C.PURPLE_DARK);

  // ── Sheet 5: Muestras ───────────────────────────────────────────────────────
  addSheet(wb, 'Muestras', [
    'Estación', 'Código Muestra', 'Tipo', 'Descripción',
    'Peso (g)', 'Largo (m)', 'Estado', 'Destino', 'Análisis Solicitado',
    'Latitud', 'Longitud', 'Notas',
  ], data.samples.map((s) => [
    stationCodeMap.get(s.stationId) ?? s.stationId,
    fv(s.code),
    fv(s.type),
    fv(s.description),
    fv(s.weight),
    fv(s.length),
    fv(s.status),
    fv(s.destination),
    fv(s.analysisRequested),
    fc(s.latitude),
    fc(s.longitude),
    fv(s.notes),
  ]), C.AMBER_DARK);

  // ── Sheet 6: Sondajes ───────────────────────────────────────────────────────
  addSheet(wb, 'Sondajes', [
    'ID Sondaje', 'Tipo', 'Geólogo', 'Latitud', 'Longitud', 'Altitud (m)',
    'Azimut (°)', 'Inclinación (°)', 'Prof. Planificada (m)', 'Prof. Real (m)',
    'Estado', 'Avance %', 'Fecha Inicio', 'Fecha Fin', 'Notas',
  ], data.drillHoles.map((d) => {
    const pct = d.actualDepth != null && d.plannedDepth > 0
      ? `${Math.round((d.actualDepth / d.plannedDepth) * 100)}%`
      : '';
    return [
      d.holeId,
      fv(d.type),
      d.geologist,
      fc(d.latitude),
      fc(d.longitude),
      fv(d.altitude),
      fv(d.azimuth),
      fv(d.inclination),
      d.plannedDepth,
      fv(d.actualDepth),
      fv(d.status),
      pct,
      fd(d.startDate),
      fd(d.endDate),
      fv(d.notes),
    ];
  }), C.PURPLE_DARK);

  // ── Sheet 7: Intervalos ──────────────────────────────────────────────────────
  addSheet(wb, 'Intervalos', [
    'Sondaje', 'Desde (m)', 'Hasta (m)', 'Espesor (m)',
    'Grupo Roca', 'Tipo Roca', 'Color', 'Textura', 'Granulometría',
    'Mineralogía', 'Alteración', 'Intens. Alter.', 'RQD (%)', 'Recup. (%)',
    'Min. %', 'Estructura', 'Meteorización', 'Notas',
  ], data.intervals
    .slice()
    .sort((a, b) => {
      const hA = drillHoleMap.get(a.drillHoleId) ?? '';
      const hB = drillHoleMap.get(b.drillHoleId) ?? '';
      return hA < hB ? -1 : hA > hB ? 1 : a.fromDepth - b.fromDepth;
    })
    .map((i) => {
      const esp = i.toDepth != null && i.fromDepth != null
        ? +(i.toDepth - i.fromDepth).toFixed(2)
        : '';
      return [
        drillHoleMap.get(i.drillHoleId) ?? i.drillHoleId,
        i.fromDepth,
        fv(i.toDepth),
        esp,
        fv(i.rockGroup),
        fv(i.rockType),
        fv(i.color),
        fv(i.texture),
        fv(i.grainSize),
        fv(i.mineralogy),
        fv(i.alteration),
        fv(i.alterationIntensity),
        fp(i.rqd),
        fp(i.recovery),
        fp(i.mineralizationPercent),
        fv(i.structure),
        fv(i.weathering),
        fv(i.notes),
      ];
    }), C.AMBER_DARK);

  // ── Write file ──────────────────────────────────────────────────────────────
  const filename = `${data.project.name.replace(/[^a-zA-Z0-9\s_\-]/g, '').replace(/\s+/g, '_')}_GeoAgent.xlsx`;
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
  await saveFile(filename, buffer);
}
