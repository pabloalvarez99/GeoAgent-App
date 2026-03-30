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

// ── Image helper: fetch URL → canvas resize → base64 ─────────────────────────

async function fetchPhoto(
  url: string,
): Promise<{ data: string; format: 'JPEG' } | null> {
  if (typeof window === 'undefined') return null;
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('load'));
      el.src = url;
    });
    const MAX = 1024;
    const scale = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
    return { data: dataUrl.split(',')[1], format: 'JPEG' };
  } catch {
    return null;
  }
}

// ── Document helpers ─────────────────────────────────────────────────────────

function setFill(doc: any, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(doc: any, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }
function setTxt(doc: any, c: RGB)  { doc.setTextColor(c[0], c[1], c[2]); }

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
  setFill(doc, LIGHT);
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
      // Full-width row
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
  // Top dark green band
  setFill(doc, G_DARK);
  doc.rect(0, 0, PW, 46, 'F');

  // Thin accent line inside band
  setFill(doc, G_MID);
  doc.rect(0, 42, PW, 4, 'F');

  // Brand
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

  // Project title
  let y = 60;
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, SLATE);
  const titleLines = doc.splitTextToSize(data.project.name, CW);
  doc.text(titleLines, ML, y);
  y += titleLines.length * 9 + 3;

  // Location
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  setTxt(doc, MUTED);
  doc.text(`Ubicación: ${data.project.location}`, ML, y);
  y += 8;

  // Divider
  setDraw(doc, BORDER);
  doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y);
  y += 7;

  // Description
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

  // Stats grid (3 columns × 2 rows)
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

  // Photos count (if any)
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

  // Generation date line
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

  // Bottom band
  setFill(doc, G_DARK);
  doc.rect(0, PH - 14, PW, 14, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  setTxt(doc, WHITE);
  doc.text('DOCUMENTO TÉCNICO — USO PROFESIONAL', PW / 2, PH - 6.5, { align: 'center' });
}

// ── Summary section (Page 2) ──────────────────────────────────────────────────

function addSummarySection(doc: any, autoTable: any, data: PdfExportData, projectName: string): number {
  let y = MT;

  y = sectionTitle(doc, y, '1', 'Resumen del Proyecto', projectName);
  y += 2;

  // Project info table
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

  // Totals table
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
): Promise<number> {
  let y = sectionTitle(doc, startY, '2', 'Estaciones de Campo', projectName);
  y += 2;

  for (let si = 0; si < stations.length; si++) {
    const st = stations[si];

    // ── Station header bar ──────────────────────────────────
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
    y += 10;

    // Info box
    const infoRows: Array<{ label: string; value: string; span?: boolean }> = [
      { label: 'Latitud',    value: fc(st.latitude) },
      { label: 'Longitud',   value: fc(st.longitude) },
      { label: 'Altitud',    value: f(st.altitude, ' m') },
      { label: 'Condiciones', value: f(st.weatherConditions) },
    ];
    if (st.description) {
      infoRows.push({ label: 'Descripción', value: st.description, span: true });
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
          f(l.notes).slice(0, 35),
        ]),
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: G_DARK as any, textColor: WHITE as any },
        alternateRowStyles: { fillColor: LIGHT as any },
        columnStyles: { 7: { cellWidth: 30 } },
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
          f(s.notes).slice(0, 30),
        ]),
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: PURPLE as any, textColor: WHITE as any },
        alternateRowStyles: { fillColor: LIGHT as any },
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
        head: [['Código', 'Tipo', 'Peso (g)', 'Long. (m)', 'Descripción', 'Estado', 'Destino', 'Análisis']],
        body: stSamples.map((s) => [
          f(s.code), f(s.type), f(s.weight), f(s.length),
          f(s.description).slice(0, 35), f(s.status),
          f(s.destination).slice(0, 20), f(s.analysisRequested).slice(0, 20),
        ]),
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: AMBER as any, textColor: WHITE as any },
        alternateRowStyles: { fillColor: LIGHT as any },
        didDrawPage: () => runningHeader(doc, projectName),
        margin: { top: MT, left: ML, right: MR, bottom: MB },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // ── Fotografías ────────────────────────────────────────
    const stPhotos = photos.filter(
      (p) => p.stationId === st.id || (!p.stationId && !p.drillHoleId && p.projectId),
    ).filter((p) => p.downloadUrl);

    if (stPhotos.length > 0) {
      y = guard(doc, y, 14, projectName);
      y = subsectionTitle(doc, y, '▸  Fotografías', stPhotos.length, [139, 92, 246] as RGB);
      y += 2;

      const photoW = 86;
      const photoH = 62;
      const gap = 4;
      const capH = 9;
      const rowH = photoH + capH + 4;

      for (let pi = 0; pi < stPhotos.length; pi += 2) {
        y = guard(doc, y, rowH + 4, projectName);

        for (let side = 0; side < 2; side++) {
          const photo = stPhotos[pi + side];
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
          const cap = (photo.description || photo.fileName || '').slice(0, 42);
          doc.text(cap, px, y + photoH + 5);
          const dateCap = fd(photo.takenAt);
          if (dateCap !== '—') {
            doc.text(dateCap, px + photoW, y + photoH + 5, { align: 'right' });
          }
        }

        y += rowH;
      }
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

function addDrillholeSection(
  doc: any,
  autoTable: any,
  startY: number,
  drillHoles: GeoDrillHole[],
  intervals: GeoDrillInterval[],
  projectName: string,
): number {
  let y = guard(doc, startY, 20, projectName);
  y = sectionTitle(doc, y, '3', 'Sondajes', projectName);
  y += 2;

  for (let di = 0; di < drillHoles.length; di++) {
    const dh = drillHoles[di];

    // ── Drillhole header bar ──────────────────────────────
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
    y += 10;

    // Info box
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

    // ── Intervalos table ──────────────────────────────────
    const dhIntervals = intervals
      .filter((i) => i.drillHoleId === dh.id)
      .sort((a, b) => a.fromDepth - b.fromDepth);

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
          f(iv.notes).slice(0, 25),
        ]),
        styles: { fontSize: 7, cellPadding: 1.8 },
        headStyles: { fillColor: AMBER as any, textColor: WHITE as any, fontSize: 6.5 },
        alternateRowStyles: { fillColor: LIGHT as any },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 10, halign: 'center' },
          2: { cellWidth: 9,  halign: 'center' },
          11: { halign: 'center' },
          12: { halign: 'center' },
          13: { cellWidth: 25 },
        },
        didDrawPage: () => runningHeader(doc, projectName),
        margin: { top: MT, left: ML, right: MR, bottom: MB },
      });
      y = (doc as any).lastAutoTable.finalY + 5;
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

  // Page 1: Cover
  addCoverPage(doc, data);

  // Page 2: Summary
  doc.addPage();
  runningHeader(doc, data.project.name);
  let y = addSummarySection(doc, autoTable, data, data.project.name);

  // Pages 3+: Stations
  if (data.stations.length > 0) {
    y = guard(doc, y, 30, data.project.name);
    y = await addStationSection(
      doc, autoTable, y,
      data.stations, data.lithologies, data.structural,
      data.samples, data.photos,
      data.project.name,
    );
  }

  // Drillholes
  if (data.drillHoles.length > 0) {
    y = addDrillholeSection(
      doc, autoTable, y,
      data.drillHoles, data.intervals,
      data.project.name,
    );
  }

  // Apply footers to all pages except cover (page 1)
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    pageFooter(doc, i - 1, totalPages - 1);
  }

  const slug = data.project.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '');
  doc.save(`${slug}_GeoAgent_Informe.pdf`);
}
