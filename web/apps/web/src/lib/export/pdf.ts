import type {
  GeoProject,
  GeoStation,
  GeoLithology,
  GeoDrillHole,
  GeoDrillInterval,
} from '@geoagent/geo-shared/types';

export interface PdfExportData {
  project: GeoProject;
  stations: GeoStation[];
  lithologies: GeoLithology[];
  drillHoles: GeoDrillHole[];
  intervals: GeoDrillInterval[];
}

export async function downloadPDF(data: PdfExportData) {
  // Dynamic import to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(34, 197, 94); // green accent
  doc.rect(0, 0, pageWidth, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('GeoAgent — Reporte de Proyecto', 10, 7);
  doc.text(new Date().toLocaleDateString('es-CL'), pageWidth - 10, 7, { align: 'right' });

  y = 20;
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.project.name, 14, y);
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Ubicacion: ${data.project.location}`, 14, y);
  y += 5;
  doc.text(data.project.description, 14, y);
  y += 10;

  // ── Summary stats ───────────────────────────────────────────────────────
  doc.setDrawColor(200);
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(14, y, pageWidth - 28, 16, 2, 2, 'FD');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  const stats = [
    `Estaciones: ${data.stations.length}`,
    `Sondajes: ${data.drillHoles.length}`,
    `Intervalos: ${data.intervals.length}`,
    `Litologias: ${data.lithologies.length}`,
  ];
  stats.forEach((s, i) => doc.text(s, 20 + i * 45, y + 10));
  y += 22;

  // ── Stations Table ──────────────────────────────────────────────────────
  if (data.stations.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Estaciones', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Codigo', 'Fecha', 'Geologo', 'Latitud', 'Longitud', 'Descripcion']],
      body: data.stations.map((s) => [
        s.code,
        s.date,
        s.geologist,
        s.latitude.toFixed(6),
        s.longitude.toFixed(6),
        s.description.slice(0, 60) + (s.description.length > 60 ? '…' : ''),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Drill Holes Table ───────────────────────────────────────────────────
  if (data.drillHoles.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Sondajes', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Tipo', 'Geologo', 'Azimut', 'Incl.', 'Prof. Plan.', 'Prof. Real', 'Estado']],
      body: data.drillHoles.map((d) => [
        d.holeId,
        d.type,
        d.geologist,
        `${d.azimuth}°`,
        `${d.inclination}°`,
        `${d.plannedDepth} m`,
        d.actualDepth ? `${d.actualDepth} m` : '—',
        d.status,
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [124, 58, 237], textColor: 255 }, // purple for drill holes
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Intervals Table ─────────────────────────────────────────────────────
  if (data.intervals.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('Intervalos de Sondaje', 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [['Sondaje', 'Desde', 'Hasta', 'Tipo Roca', 'RQD', 'Recovery', 'Notas']],
      body: data.intervals.map((i) => {
        const hole = data.drillHoles.find((d) => d.id === i.drillHoleId);
        return [
          hole?.holeId ?? i.drillHoleId,
          `${i.fromDepth} m`,
          `${i.toDepth} m`,
          `${i.rockGroup} / ${i.rockType}`,
          i.rqd != null ? `${i.rqd}%` : '—',
          i.recovery != null ? `${i.recovery}%` : '—',
          (i.notes ?? '').slice(0, 40),
        ];
      }),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [245, 158, 11], textColor: 255 }, // amber
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
  }

  // ── Footer on each page ─────────────────────────────────────────────────
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text(`GeoAgent — ${data.project.name}`, 14, doc.internal.pageSize.getHeight() - 6);
    doc.text(`Pagina ${i} de ${pageCount}`, pageWidth - 14, doc.internal.pageSize.getHeight() - 6, { align: 'right' });
  }

  doc.save(`${data.project.name.replace(/\s+/g, '_')}_GeoAgent_Reporte.pdf`);
}
