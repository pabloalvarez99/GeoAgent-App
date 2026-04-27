import type {
  GeoProject,
  GeoStation,
  GeoLithology,
  GeoStructural,
  GeoSample,
  GeoDrillHole,
  GeoDrillInterval,
  GeoPhoto,
} from '@geoagent/geo-shared/types';

// ── Public interface ─────────────────────────────────────────────────────────

export interface PdfExportData {
  project: GeoProject;
  stations: GeoStation[];
  lithologies: GeoLithology[];
  structural: GeoStructural[];
  samples: GeoSample[];
  drillHoles: GeoDrillHole[];
  intervals: GeoDrillInterval[];
  photos: Array<GeoPhoto & { downloadUrl?: string }>;
}

// ── TOC entry ────────────────────────────────────────────────────────────────

interface TocEntry {
  title: string;
  page: number;
  indent: boolean;
}

// ── Page constants (A4, mm) ──────────────────────────────────────────────────

const PW = 210;
const PH = 297;
const ML = 14;
const MR = 14;
const CW = PW - ML - MR;   // 182 mm content width
const MT = 24;              // top of content area (after running header)
const MB = 16;              // bottom of content area (before footer)

// ── Color palette ────────────────────────────────────────────────────────────

type RGB = [number, number, number];
const G_DARK:  RGB = [15, 118, 52];
const G_MID:   RGB = [34, 197, 94];
const G_LIGHT: RGB = [220, 252, 231];
const PURPLE:  RGB = [109, 40, 217];
const AMBER:   RGB = [217, 119, 6];
const BLUE:    RGB = [37, 99, 235];
const RED:     RGB = [220, 38, 38];
const SLATE:   RGB = [30, 41, 59];
const MUTED:   RGB = [100, 116, 139];
const LIGHT:   RGB = [248, 250, 252];
const BORDER:  RGB = [226, 232, 240];
const WHITE:   RGB = [255, 255, 255];

// ── Rock type → color map (geological conventions) ───────────────────────────

function rockTypeColor(rockType: string | null | undefined): RGB {
  const rt = (rockType ?? '').toLowerCase();
  if (rt.includes('granit')) return [255, 182, 193];
  if (rt.includes('tonalita') || rt.includes('tonalite')) return [255, 160, 160];
  if (rt.includes('diorita') || rt.includes('diorite')) return [192, 192, 192];
  if (rt.includes('gabro') || rt.includes('gabbro')) return [128, 128, 128];
  if (rt.includes('andesita') || rt.includes('andesite')) return [189, 183, 107];
  if (rt.includes('riolita') || rt.includes('rhyolite')) return [255, 200, 150];
  if (rt.includes('basalto') || rt.includes('basalt')) return [100, 100, 100];
  if (rt.includes('pórfido') || rt.includes('porphyry')) return [210, 140, 180];
  if (rt.includes('brecha') || rt.includes('breccia')) return [188, 143, 143];
  if (rt.includes('toba') || rt.includes('tuff')) return [220, 200, 100];
  if (rt.includes('arenisca') || rt.includes('sandstone')) return [210, 180, 140];
  if (rt.includes('caliza') || rt.includes('limestone')) return [135, 206, 235];
  if (rt.includes('lutita') || rt.includes('shale')) return [119, 136, 153];
  if (rt.includes('cuarcita') || rt.includes('quartzite')) return [240, 240, 200];
  if (rt.includes('esquisto') || rt.includes('schist')) return [180, 160, 200];
  if (rt.includes('gneis') || rt.includes('gneiss')) return [200, 180, 160];
  if (rt.includes('mármol') || rt.includes('marble')) return [245, 245, 240];
  if (rt.includes('cuarzo') || rt.includes('quartz')) return [240, 230, 210];
  return [34, 197, 94]; // default green
}

// ── Image helper: fetch URL → base64 (avoids canvas CORS taint) ──────────────

async function fetchPhoto(
  url: string,
): Promise<{ data: string; format: 'JPEG' | 'PNG' } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) {
      console.warn('[PDF] fetchPhoto HTTP error', response.status, url);
      return null;
    }
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    const base64 = dataUrl.split(',')[1];
    if (!base64) return null;
    const format: 'JPEG' | 'PNG' = blob.type === 'image/png' ? 'PNG' : 'JPEG';
    return { data: base64, format };
  } catch (err) {
    console.warn('[PDF] fetchPhoto failed (likely CORS). Run: gsutil cors set cors.json gs://geoagent-app.firebasestorage.app', url, err);
    return null;
  }
}

// ── Document helpers ─────────────────────────────────────────────────────────

function setFill(doc: any, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc: any, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }
function setTxt(doc: any, c: RGB)  { doc.setTextColor(c[0], c[1], c[2]); }

function currentPage(doc: any): number {
  return (doc.internal as any).getCurrentPageInfo().pageNumber;
}

function runningHeader(doc: any, projectName: string) {
  setFill(doc, G_DARK);
  doc.rect(0, 0, PW, 9, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, WHITE);
  doc.text('GeoAgent', ML, 6);
  doc.setFont('helvetica', 'normal');
  const truncName = projectName.length > 55 ? projectName.slice(0, 52) + '…' : projectName;
  doc.text(truncName.toUpperCase(), PW / 2, 6, { align: 'center' });
  doc.text(new Date().toLocaleDateString('es-CL'), PW - MR, 6, { align: 'right' });
  setTxt(doc, SLATE);
}

function pageFooter(doc: any, pageNum: number, total: number) {
  const fY = PH - 7;
  setDraw(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.line(ML, fY - 1, PW - MR, fY - 1);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  setTxt(doc, MUTED);
  doc.text('Informe Geológico de Campo — GeoAgent', ML, fY + 3);
  doc.text(`Página ${pageNum} de ${total}`, PW - MR, fY + 3, { align: 'right' });
}

/** Add new page + running header. Returns starting y. */
function newPage(doc: any, projectName: string): number {
  doc.addPage();
  runningHeader(doc, projectName);
  return MT;
}

/** If remaining space < needed, add new page. */
function guard(doc: any, y: number, needed: number, projectName: string): number {
  if (y + needed > PH - MB) return newPage(doc, projectName);
  return y;
}

// ── Section / subsection titles ───────────────────────────────────────────────

function sectionTitle(doc: any, y: number, num: string, title: string, projectName: string): number {
  y = guard(doc, y, 14, projectName);
  setFill(doc, G_DARK);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, WHITE);
  doc.text(`${num}.  ${title.toUpperCase()}`, ML + 4, y + 5.5);
  setTxt(doc, SLATE);
  return y + 12;
}

function subsectionTitle(doc: any, y: number, title: string, count: number, color: RGB = G_DARK): number {
  const label = `${title}   (${count} registro${count !== 1 ? 's' : ''})`;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, color);
  doc.text(label, ML, y);
  setDraw(doc, color);
  doc.setLineWidth(0.4);
  doc.line(ML, y + 1.2, ML + doc.getTextWidth(label), y + 1.2);
  setTxt(doc, SLATE);
  return y + 6;
}

// ── Info block helpers ────────────────────────────────────────────────────────

function infoBox(
  doc: any,
  y: number,
  rows: Array<{ label: string; value: string; span?: boolean }>,
  colW = 44,
): number {
  const pad = 4;
  const lineH = 5.5;
  const totalH = Math.ceil(rows.length / 2) * lineH + pad * 2;

  setFill(doc, LIGHT);
  setDraw(doc, BORDER);
  doc.setLineWidth(0.25);
  doc.roundedRect(ML, y, CW, totalH, 2, 2, 'FD');

  let cx = ML + pad;
  let cy = y + pad + 3.5;
  rows.forEach((row, i) => {
    if (row.span) {
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      setTxt(doc, MUTED);
      doc.text(row.label + ':', ML + pad, cy);
      doc.setFont('helvetica', 'normal');
      setTxt(doc, SLATE);
      const lines = doc.splitTextToSize(row.value || '—', CW - pad * 2 - colW);
      doc.text(lines, ML + pad + colW, cy);
      cy += lines.length * lineH;
      return;
    }
    const col = i % 2;
    if (col === 0 && i > 0) cy += lineH;
    const x = ML + pad + col * (CW / 2);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    setTxt(doc, MUTED);
    doc.text(row.label + ':', x, cy);
    doc.setFont('helvetica', 'normal');
    setTxt(doc, SLATE);
    doc.text(row.value || '—', x + colW, cy);
  });

  return y + totalH + 4;
}

// ── Placeholder when no records ────────────────────────────────────────────────

function noRecords(doc: any, y: number): number {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  setTxt(doc, MUTED);
  doc.text('Sin registros.', ML + 4, y);
  setTxt(doc, SLATE);
  return y + 7;
}

// ── Format helpers ────────────────────────────────────────────────────────────

const f = (v: any, suffix = '') => (v != null && v !== '' ? `${v}${suffix}` : '—');
const fp = (v: any) => (v != null ? `${v}%` : '—');
const fc = (v: number | null | undefined) => (v != null ? v.toFixed(6) : '—');
const fd = (v: string | null | undefined) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('es-CL'); } catch { return v; }
};

// ── Cover page ────────────────────────────────────────────────────────────────

function addCoverPage(doc: any, data: PdfExportData) {
  setFill(doc, G_DARK);
  doc.rect(0, 0, PW, 46, 'F');
  setFill(doc, G_MID);
  doc.rect(0, 42, PW, 4, 'F');

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, WHITE);
  doc.text('GeoAgent', ML, 20);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  setTxt(doc, G_LIGHT);
  doc.text('Sistema de Geología de Campo', ML, 28);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, WHITE);
  doc.text('INFORME GEOLÓGICO DE CAMPO', PW / 2, 37, { align: 'center' });

  let y = 60;
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, SLATE);
  const titleLines = doc.splitTextToSize(data.project.name, CW);
  doc.text(titleLines, ML, y);
  y += titleLines.length * 9 + 3;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setTxt(doc, MUTED);
  doc.text(`Ubicación: ${data.project.location}`, ML, y);
  y += 8;

  setDraw(doc, BORDER);
  doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y);
  y += 7;

  if (data.project.description) {
    setFill(doc, LIGHT);
    const descLines = doc.splitTextToSize(data.project.description, CW - 10);
    const dh = descLines.length * 4.8 + 8;
    doc.roundedRect(ML, y, CW, dh, 2, 2, 'F');
    setFill(doc, G_MID);
    doc.rect(ML, y, 3, dh, 'F');
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'italic');
    setTxt(doc, MUTED);
    doc.text(descLines, ML + 7, y + 5.5);
    y += dh + 8;
  }

  const statItems = [
    { label: 'Estaciones de Campo', value: data.stations.length,    color: BLUE   },
    { label: 'Sondajes',            value: data.drillHoles.length,   color: PURPLE },
    { label: 'Registros Litología', value: data.lithologies.length,  color: G_DARK },
    { label: 'Datos Estructurales', value: data.structural.length,   color: AMBER  },
    { label: 'Muestras',            value: data.samples.length,      color: RED    },
    { label: 'Intervalos Sondaje',  value: data.intervals.length,    color: SLATE  },
  ];

  const cols = 3;
  const bW = (CW - (cols - 1) * 4) / cols;
  const bH = 22;

  y += 2;
  statItems.forEach(({ label, value, color }, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const bx = ML + col * (bW + 4);
    const by = y + row * (bH + 4);

    setFill(doc, LIGHT);
    setDraw(doc, BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(bx, by, bW, bH, 2, 2, 'FD');
    setFill(doc, color);
    doc.rect(bx, by, 3, bH, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    setTxt(doc, color);
    doc.text(String(value), bx + 8, by + 13);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    setTxt(doc, MUTED);
    doc.text(doc.splitTextToSize(label, bW - 12), bx + 8, by + 18);
  });

  y += Math.ceil(statItems.length / cols) * (bH + 4) + 6;

  if (data.photos.length > 0) {
    setFill(doc, LIGHT);
    setDraw(doc, BORDER);
    doc.setLineWidth(0.25);
    doc.roundedRect(ML, y, CW, 16, 2, 2, 'FD');
    const violet: RGB = [139, 92, 246];
    setFill(doc, violet);
    doc.rect(ML, y, 3, 16, 'F');
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setTxt(doc, violet);
    doc.text(String(data.photos.length), ML + 8, y + 11);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    setTxt(doc, MUTED);
    doc.text('Fotografías de campo adjuntas en este informe', ML + 24, y + 11);
    y += 20;
  }

  const genY = PH - 26;
  setDraw(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.line(ML, genY, PW - MR, genY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  setTxt(doc, MUTED);
  const dateStr = new Date().toLocaleDateString('es-CL', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.text(`Generado el ${dateStr}`, ML, genY + 5);
  doc.text('GeoAgent © Sistema de Geología de Campo', PW - MR, genY + 5, { align: 'right' });

  setFill(doc, G_DARK);
  doc.rect(0, PH - 14, PW, 14, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, WHITE);
  doc.text('DOCUMENTO TÉCNICO — USO PROFESIONAL', PW / 2, PH - 6.5, { align: 'center' });
}

// ── Table of Contents ─────────────────────────────────────────────────────────

function renderTOC(doc: any, entries: TocEntry[], projectName: string) {
  let y = MT;

  setFill(doc, G_DARK);
  doc.rect(ML, y, CW, 8, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, WHITE);
  doc.text('TABLA DE CONTENIDOS', ML + 4, y + 5.5);
  setTxt(doc, SLATE);
  y += 14;

  entries.forEach((entry, i) => {
    const ix = entry.indent ? ML + 8 : ML;
    const pageStr = String(entry.page);
    const maxTitleW = CW - 18 - (entry.indent ? 8 : 0);

    // Alternating row background
    if (i % 2 === 0) {
      setFill(doc, LIGHT);
      doc.rect(ML, y - 3.5, CW, 7, 'F');
    }

    // Accent bar for section titles
    if (!entry.indent) {
      setFill(doc, G_MID);
      doc.rect(ML, y - 3.5, 3, 7, 'F');
    }

    doc.setFontSize(entry.indent ? 8 : 8.5);
    doc.setFont('helvetica', entry.indent ? 'normal' : 'bold');
    setTxt(doc, entry.indent ? MUTED : SLATE);
    doc.text(entry.title, ix + (entry.indent ? 0 : 4), y);

    // Dots
    const titleW = doc.getTextWidth(entry.title);
    const dotsStartX = ix + (entry.indent ? 0 : 4) + titleW + 2;
    const dotsEndX = PW - MR - 12;
    doc.setFontSize(7);
    setTxt(doc, BORDER);
    const dotStr = '.'.repeat(Math.max(0, Math.floor((dotsEndX - dotsStartX) / 1.7)));
    doc.text(dotStr, dotsStartX, y);

    // Page number
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setTxt(doc, G_DARK);
    doc.text(pageStr, PW - MR, y, { align: 'right' });

    y += 7;
  });
}

// ── Summary section ───────────────────────────────────────────────────────────

function addSummarySection(doc: any, autoTable: any, data: PdfExportData, projectName: string): number {
  let y = MT;

  y = sectionTitle(doc, y, '1', 'Resumen del Proyecto', projectName);
  y += 2;

  autoTable(doc, {
    startY: y,
    body: [
      ['Nombre del Proyecto', data.project.name],
      ['Ubicación', data.project.location],
      ['Descripción', data.project.description || '—'],
      ['Fecha del Informe', new Date().toLocaleDateString('es-CL')],
    ],
    styles: { fontSize: 8.5, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: LIGHT as any, textColor: MUTED as any, cellWidth: 48 },
      1: { textColor: SLATE as any },
    },
    theme: 'plain',
    tableLineColor: BORDER as any,
    tableLineWidth: 0.25,
    didDrawPage: () => runningHeader(doc, projectName),
    margin: { top: MT, left: ML, right: MR, bottom: MB },
  });
  y = (doc as any).lastAutoTable.finalY + 8;

  y = guard(doc, y, 28, projectName);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, G_DARK);
  doc.text('Totales del Proyecto', ML, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Estaciones', 'Sondajes', 'Litologías', 'Estructurales', 'Muestras', 'Intervalos', 'Fotografías']],
    body: [[
      data.stations.length,
      data.drillHoles.length,
      data.lithologies.length,
      data.structural.length,
      data.samples.length,
      data.intervals.length,
      data.photos.length,
    ]],
    styles: { fontSize: 9, cellPadding: 3, halign: 'center' },
    headStyles: { fillColor: G_DARK as any, textColor: WHITE as any, fontStyle: 'bold' },
    bodyStyles: { fontStyle: 'bold', textColor: SLATE as any },
    theme: 'grid',
    didDrawPage: () => runningHeader(doc, projectName),
    margin: { top: MT, left: ML, right: MR, bottom: MB },
  });

  return (doc as any).lastAutoTable.finalY + 10;
}

// ── Stratigraphic column ──────────────────────────────────────────────────────

function addStratigraphicColumn(
  doc: any,
  y: number,
  dh: GeoDrillHole,
  intervals: GeoDrillInterval[],
  projectName: string,
): number {
  if (intervals.length === 0) return y;

  const totalDepth = dh.actualDepth ?? dh.plannedDepth ?? 0;
  if (totalDepth <= 0) return y;

  const COL_MAX_H = 120;  // max visual height in mm
  const COL_W     = 20;   // column bar width
  const RULER_W   = 14;   // depth ruler width on left
  const LABEL_W   = CW - RULER_W - COL_W - 6; // label area width on right
  const COL_X     = ML + RULER_W + 2;
  const LABEL_X   = COL_X + COL_W + 3;
  const scale     = COL_MAX_H / totalDepth;     // mm per meter

  // How much space do we actually need?
  const needed = COL_MAX_H + 24;
  y = guard(doc, y, needed, projectName);

  // Section label
  y = subsectionTitle(doc, y, '▸  Columna Estratigráfica', intervals.length, PURPLE);
  y += 2;

  const colTopY = y;

  // Background rect for the column
  setFill(doc, [245, 245, 245]);
  setDraw(doc, BORDER);
  doc.setLineWidth(0.2);
  doc.rect(COL_X, colTopY, COL_W, COL_MAX_H, 'FD');

  // Draw depth ticks on ruler (5 ticks)
  const TICKS = 5;
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  setTxt(doc, MUTED);
  for (let t = 0; t <= TICKS; t++) {
    const depthM = (totalDepth / TICKS) * t;
    const ty = colTopY + (depthM / totalDepth) * COL_MAX_H;
    setDraw(doc, MUTED);
    doc.setLineWidth(0.2);
    doc.line(COL_X - 2, ty, COL_X, ty);
    doc.text(`${Math.round(depthM)}m`, COL_X - 3, ty + 1.5, { align: 'right' });
  }

  // Draw interval bars
  const labelPositions: Array<{ y: number; label: string; color: RGB }> = [];

  intervals.forEach((iv) => {
    const barY  = colTopY + iv.fromDepth * scale;
    const barH  = Math.max(0.5, ((iv.toDepth ?? iv.fromDepth + 1) - iv.fromDepth) * scale);
    const color = rockTypeColor(iv.rockType);

    setFill(doc, color);
    doc.rect(COL_X, barY, COL_W, barH, 'F');

    // Border between intervals
    setDraw(doc, BORDER);
    doc.setLineWidth(0.15);
    doc.line(COL_X, barY + barH, COL_X + COL_W, barY + barH);

    // Collect label if bar is tall enough (>=3mm)
    if (barH >= 3) {
      labelPositions.push({
        y: barY + barH / 2,
        label: `${iv.fromDepth}–${iv.toDepth}m  ${iv.rockType ?? ''}`.trim(),
        color,
      });
    }
  });

  // Column border on top
  setDraw(doc, BORDER);
  doc.setLineWidth(0.2);
  doc.rect(COL_X, colTopY, COL_W, COL_MAX_H, 'D');

  // Labels on the right side
  let lastLabelY = -99;
  labelPositions.forEach(({ y: ly, label, color }) => {
    // Avoid overlapping labels
    if (ly - lastLabelY < 4.5) return;
    lastLabelY = ly;

    setDraw(doc, color);
    doc.setLineWidth(0.3);
    doc.line(COL_X + COL_W, ly, LABEL_X, ly);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    setTxt(doc, SLATE);
    const truncLabel = label.length > 35 ? label.slice(0, 33) + '…' : label;
    doc.text(truncLabel, LABEL_X, ly + 1.5);
  });

  setTxt(doc, SLATE);
  return y + COL_MAX_H + 6;
}

// ── Photo grid helper ────────────────────────────────────────────────────────

async function addPhotoGrid(
  doc: any,
  y: number,
  photos: Array<GeoPhoto & { downloadUrl?: string }>,
  sectionTitle: string,
  projectName: string,
): Promise<number> {
  const photoW = 86;
  const photoH = 62;
  const gap    = 4;
  const capH   = 9;
  const rowH   = photoH + capH + 4;

  y = guard(doc, y, 14, projectName);
  // subsectionTitle reuse
  const label = `${sectionTitle}   (${photos.length} foto${photos.length !== 1 ? 's' : ''})`;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, [139, 92, 246] as RGB);
  doc.text(label, ML, y);
  setDraw(doc, [139, 92, 246] as RGB);
  doc.setLineWidth(0.4);
  doc.line(ML, y + 1.2, ML + doc.getTextWidth(label), y + 1.2);
  setTxt(doc, SLATE);
  y += 8;

  for (let pi = 0; pi < photos.length; pi += 2) {
    y = guard(doc, y, rowH + 4, projectName);

    for (let side = 0; side < 2; side++) {
      const photo = photos[pi + side];
      if (!photo) break;
      const px = ML + side * (photoW + gap);

      if (photo.downloadUrl) {
        const imgData = await fetchPhoto(photo.downloadUrl);
        if (imgData) {
          doc.addImage(imgData.data, imgData.format, px, y, photoW, photoH);
          setDraw(doc, BORDER);
          doc.setLineWidth(0.3);
          doc.rect(px, y, photoW, photoH);
        } else {
          setFill(doc, LIGHT);
          setDraw(doc, BORDER);
          doc.setLineWidth(0.3);
          doc.roundedRect(px, y, photoW, photoH, 2, 2, 'FD');
          doc.setFontSize(7.5);
          doc.setFont('helvetica', 'italic');
          setTxt(doc, MUTED);
          doc.text('Imagen no disponible', px + photoW / 2, y + photoH / 2, { align: 'center' });
        }
      }

      // Caption
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      setTxt(doc, MUTED);
      const cap = photo.description || photo.fileName || '';
      const capLines = doc.splitTextToSize(cap, photoW);
      doc.text(capLines[0] ?? '', px, y + photoH + 5);
      const dateCap = fd(photo.takenAt);
      if (dateCap !== '—') {
        doc.text(dateCap, px + photoW, y + photoH + 5, { align: 'right' });
      }
    }

    y += rowH;
  }

  return y;
}

// ── Station section ───────────────────────────────────────────────────────────

async function addStationSection(
  doc: any,
  autoTable: any,
  startY: number,
  stations: GeoStation[],
  lithologies: GeoLithology[],
  structural: GeoStructural[],
  samples: GeoSample[],
  photos: Array<GeoPhoto & { downloadUrl?: string }>,
  projectName: string,
  tocEntries: TocEntry[],
): Promise<number> {
  let y = sectionTitle(doc, startY, '2', 'Estaciones de Campo', projectName);
  tocEntries.push({ title: '2.  Estaciones de Campo', page: currentPage(doc), indent: false });
  y += 2;

  for (let si = 0; si < stations.length; si++) {
    const st = stations[si];

    y = guard(doc, y, 40, projectName);

    setFill(doc, SLATE);
    doc.rect(ML, y, CW, 8, 'F');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    setTxt(doc, WHITE);
    doc.text(`2.${si + 1}  ${st.code}`, ML + 4, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setTxt(doc, G_LIGHT);
    doc.text(`${fd(st.date)}  ·  ${st.geologist}`, PW - MR - 4, y + 5.5, { align: 'right' });
    setTxt(doc, SLATE);

    // TOC sub-entry for each station
    tocEntries.push({ title: `2.${si + 1}  ${st.code} — ${st.geologist}`, page: currentPage(doc), indent: true });

    y += 10;

    const infoRows: Array<{ label: string; value: string; span?: boolean }> = [
      { label: 'Latitud',    value: fc(st.latitude) },
      { label: 'Longitud',   value: fc(st.longitude) },
      { label: 'Altitud',    value: f(st.altitude, ' m') },
      { label: 'Condiciones', value: f(st.weatherConditions) },
    ];
    if (st.description) {
      infoRows.push({ label: 'Descripción', value: st.description, span: true });
    }
    if ((st as any).notes) {
      infoRows.push({ label: 'Notas', value: (st as any).notes, span: true });
    }
    y = infoBox(doc, y, infoRows);

    // ── Litología ──────────────────────────────────────────
    const stLitho = lithologies.filter((l) => l.stationId === st.id);
    y = guard(doc, y, 14, projectName);
    y = subsectionTitle(doc, y, '▸  Litología', stLitho.length, G_DARK);

    if (stLitho.length === 0) {
      y = noRecords(doc, y);
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Grupo', 'Tipo Roca', 'Color', 'Textura', 'Granulometría', 'Alteración', '% Min.', 'Notas']],
        body: stLitho.map((l) => [
          f(l.rockGroup), f(l.rockType), f(l.color), f(l.texture),
          f(l.grainSize), f(l.alteration), fp(l.mineralizationPercent),
          f(l.notes),
        ]),
        styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: G_DARK as any, textColor: WHITE as any },
        alternateRowStyles: { fillColor: LIGHT as any },
        columnStyles: { 7: { cellWidth: 38 } },
        didDrawPage: () => runningHeader(doc, projectName),
        margin: { top: MT, left: ML, right: MR, bottom: MB },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // ── Datos Estructurales ────────────────────────────────
    const stStruct = structural.filter((s) => s.stationId === st.id);
    y = guard(doc, y, 14, projectName);
    y = subsectionTitle(doc, y, '▸  Datos Estructurales', stStruct.length, PURPLE);

    if (stStruct.length === 0) {
      y = noRecords(doc, y);
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Tipo', 'Rumbo (°)', 'Buz. (°)', 'Dir. Buz.', 'Movimiento', 'Espesor (m)', 'Relleno', 'Rugosidad', 'Notas']],
        body: stStruct.map((s) => [
          f(s.type), f(s.strike, '°'), f(s.dip, '°'), f(s.dipDirection),
          f(s.movement), f(s.thickness), f(s.filling), f(s.roughness),
          f(s.notes),
        ]),
        styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: PURPLE as any, textColor: WHITE as any },
        alternateRowStyles: { fillColor: LIGHT as any },
        columnStyles: { 8: { cellWidth: 36 } },
        didDrawPage: () => runningHeader(doc, projectName),
        margin: { top: MT, left: ML, right: MR, bottom: MB },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // ── Muestras ───────────────────────────────────────────
    const stSamples = samples.filter((s) => s.stationId === st.id);
    y = guard(doc, y, 14, projectName);
    y = subsectionTitle(doc, y, '▸  Muestras', stSamples.length, AMBER);

    if (stSamples.length === 0) {
      y = noRecords(doc, y);
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Código', 'Tipo', 'Peso (g)', 'Long. (m)', 'Descripción', 'Estado', 'Destino', 'Análisis Solicitado']],
        body: stSamples.map((s) => [
          f(s.code), f(s.type), f(s.weight), f(s.length),
          f(s.description), f(s.status),
          f(s.destination), f(s.analysisRequested),
        ]),
        styles: { fontSize: 7.5, cellPadding: 2, overflow: 'linebreak' },
        headStyles: { fillColor: AMBER as any, textColor: WHITE as any },
        alternateRowStyles: { fillColor: LIGHT as any },
        columnStyles: {
          4: { cellWidth: 35 },
          7: { cellWidth: 28 },
        },
        didDrawPage: () => runningHeader(doc, projectName),
        margin: { top: MT, left: ML, right: MR, bottom: MB },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // ── Fotografías de la estación ─────────────────────────
    const stPhotos = photos
      .filter((p) => p.stationId === st.id || (!p.stationId && !p.drillHoleId && p.projectId))
      .filter((p) => p.downloadUrl);

    if (stPhotos.length > 0) {
      y = await addPhotoGrid(doc, y, stPhotos, '▸  Fotografías', projectName);
    }

    // Separator between stations
    y += 4;
    setDraw(doc, BORDER);
    doc.setLineWidth(0.25);
    doc.line(ML, y, PW - MR, y);
    y += 6;
  }

  return y;
}

// ── Drillhole section ─────────────────────────────────────────────────────────

async function addDrillholeSection(
  doc: any,
  autoTable: any,
  startY: number,
  drillHoles: GeoDrillHole[],
  intervals: GeoDrillInterval[],
  photos: Array<GeoPhoto & { downloadUrl?: string }>,
  projectName: string,
  tocEntries: TocEntry[],
): Promise<number> {
  let y = guard(doc, startY, 20, projectName);
  y = sectionTitle(doc, y, '3', 'Sondajes', projectName);
  tocEntries.push({ title: '3.  Sondajes', page: currentPage(doc), indent: false });
  y += 2;

  for (let di = 0; di < drillHoles.length; di++) {
    const dh = drillHoles[di];

    y = guard(doc, y, 50, projectName);

    setFill(doc, PURPLE);
    doc.rect(ML, y, CW, 8, 'F');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    setTxt(doc, WHITE);
    doc.text(`3.${di + 1}  ${dh.holeId}`, ML + 4, y + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setTxt(doc, [200, 180, 255] as RGB);
    doc.text(`${f(dh.type)}  ·  ${dh.geologist}  ·  ${dh.status}`, PW - MR - 4, y + 5.5, { align: 'right' });
    setTxt(doc, SLATE);

    tocEntries.push({ title: `3.${di + 1}  ${dh.holeId} — ${dh.geologist}`, page: currentPage(doc), indent: true });

    y += 10;

    const dhRows: Array<{ label: string; value: string; span?: boolean }> = [
      { label: 'Latitud',      value: fc(dh.latitude) },
      { label: 'Longitud',     value: fc(dh.longitude) },
      { label: 'Altitud',      value: f(dh.altitude, ' m') },
      { label: 'Azimut',       value: f(dh.azimuth, '°') },
      { label: 'Inclinación',  value: f(dh.inclination, '°') },
      { label: 'Estado',       value: f(dh.status) },
      { label: 'Prof. Planif.', value: f(dh.plannedDepth, ' m') },
      { label: 'Prof. Real',   value: f(dh.actualDepth, ' m') },
      { label: 'Inicio',       value: fd(dh.startDate) },
      { label: 'Fin',          value: fd(dh.endDate) },
    ];
    if (dh.notes) {
      dhRows.push({ label: 'Notas', value: dh.notes, span: true });
    }
    y = infoBox(doc, y, dhRows, 36);

    // Progress bar (planned vs actual)
    if (dh.actualDepth != null && dh.plannedDepth > 0) {
      const pct = Math.min(dh.actualDepth / dh.plannedDepth, 1);
      const barW = CW;
      const barH = 5;

      y = guard(doc, y, 12, projectName);
      setFill(doc, BORDER);
      doc.roundedRect(ML, y, barW, barH, 1, 1, 'F');
      setFill(doc, pct >= 1 ? G_MID : PURPLE);
      doc.roundedRect(ML, y, barW * pct, barH, 1, 1, 'F');

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      setTxt(doc, WHITE);
      const pctLabel = `${Math.round(pct * 100)}%  (${dh.actualDepth}m / ${dh.plannedDepth}m)`;
      doc.text(pctLabel, ML + barW * pct - 2, y + 3.5, { align: 'right' });
      setTxt(doc, SLATE);
      y += barH + 6;
    }

    // ── Columna Estratigráfica ──────────────────────────────
    const dhIntervals = intervals
      .filter((i) => i.drillHoleId === dh.id)
      .sort((a, b) => a.fromDepth - b.fromDepth);

    y = addStratigraphicColumn(doc, y, dh, dhIntervals, projectName);

    // ── Intervalos table ──────────────────────────────────
    y = guard(doc, y, 14, projectName);
    y = subsectionTitle(doc, y, '▸  Log de Intervalos', dhIntervals.length, AMBER);

    if (dhIntervals.length === 0) {
      y = noRecords(doc, y);
    } else {
      autoTable(doc, {
        startY: y,
        head: [['De\n(m)', 'Hasta\n(m)', 'Esp.', 'Grupo', 'Tipo Roca', 'Color', 'Text.', 'Gran.', 'Alter.', 'Int.', '% Min.', 'RQD%', 'Rec.%', 'Notas']],
        body: dhIntervals.map((iv) => [
          f(iv.fromDepth), f(iv.toDepth),
          iv.toDepth != null && iv.fromDepth != null
            ? `${(iv.toDepth - iv.fromDepth).toFixed(1)}`
            : '—',
          f(iv.rockGroup), f(iv.rockType), f(iv.color),
          f(iv.texture), f(iv.grainSize),
          f(iv.alteration), f(iv.alterationIntensity),
          fp(iv.mineralizationPercent),
          fp(iv.rqd), fp(iv.recovery),
          f(iv.notes),
        ]),
        styles: { fontSize: 7, cellPadding: 1.8, overflow: 'linebreak' },
        headStyles: { fillColor: AMBER as any, textColor: WHITE as any, fontSize: 6.5 },
        alternateRowStyles: { fillColor: LIGHT as any },
        columnStyles: {
          0:  { cellWidth: 10, halign: 'center' },
          1:  { cellWidth: 10, halign: 'center' },
          2:  { cellWidth: 9,  halign: 'center' },
          11: { halign: 'center' },
          12: { halign: 'center' },
          13: { cellWidth: 30 },
        },
        didDrawPage: () => runningHeader(doc, projectName),
        margin: { top: MT, left: ML, right: MR, bottom: MB },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // ── Fotografías del sondaje ───────────────────────────
    const dhPhotos = photos
      .filter((p) => (p as any).drillHoleId === dh.id)
      .filter((p) => p.downloadUrl);

    if (dhPhotos.length > 0) {
      y = await addPhotoGrid(doc, y, dhPhotos, '▸  Fotografías del Sondaje', projectName);
    }

    // Separator
    y += 4;
    setDraw(doc, BORDER);
    doc.setLineWidth(0.25);
    doc.line(ML, y, PW - MR, y);
    y += 6;
  }

  return y;
}

// ── Main export function ──────────────────────────────────────────────────────

export async function downloadPDF(data: PdfExportData) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const tocEntries: TocEntry[] = [];

  // ── Page 1: Cover ───────────────────────────────────────
  addCoverPage(doc, data);

  // ── Page 2: TOC placeholder (filled at the end) ─────────
  doc.addPage();
  runningHeader(doc, data.project.name);
  const tocPageNum = currentPage(doc); // = 2

  // ── Page 3: Summary ─────────────────────────────────────
  doc.addPage();
  runningHeader(doc, data.project.name);
  tocEntries.push({ title: '1.  Resumen del Proyecto', page: currentPage(doc), indent: false });
  let y = addSummarySection(doc, autoTable, data, data.project.name);

  // ── Stations ─────────────────────────────────────────────
  if (data.stations.length > 0) {
    y = guard(doc, y, 30, data.project.name);
    y = await addStationSection(
      doc, autoTable, y,
      data.stations, data.lithologies, data.structural,
      data.samples, data.photos,
      data.project.name, tocEntries,
    );
  }

  // ── Drillholes ────────────────────────────────────────────
  if (data.drillHoles.length > 0) {
    y = await addDrillholeSection(
      doc, autoTable, y,
      data.drillHoles, data.intervals,
      data.photos,
      data.project.name, tocEntries,
    );
  }

  // ── Apply footers to all pages except cover and TOC ──────
  const totalPages = (doc.internal as any).getNumberOfPages();
  const contentPages = totalPages - 2; // exclude cover (1) and TOC (2)
  for (let i = 3; i <= totalPages; i++) {
    doc.setPage(i);
    pageFooter(doc, i - 2, contentPages);
  }

  // ── Render TOC on page 2 ─────────────────────────────────
  doc.setPage(tocPageNum);
  renderTOC(doc, tocEntries, data.project.name);
  pageFooter(doc, 0, contentPages); // TOC gets "Página 0" which is blank — actually skip footer for TOC
  // Overwrite footer area with clean line only
  setFill(doc, WHITE);
  doc.rect(0, PH - 10, PW, 10, 'F');
  setDraw(doc, BORDER);
  doc.setLineWidth(0.3);
  doc.line(ML, PH - 8, PW - MR, PH - 8);
  doc.setFontSize(7);
  setTxt(doc, MUTED);
  doc.text('Tabla de Contenidos — GeoAgent', ML, PH - 4);

  // ── Save ─────────────────────────────────────────────────
  const slug = data.project.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
  const filename = `${slug}_GeoAgent_Informe.pdf`;

  if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
    const pdfBuffer = doc.output('arraybuffer');
    await (window as any).electronAPI.saveFile(filename, pdfBuffer);
  } else {
    doc.save(filename);
  }
}
