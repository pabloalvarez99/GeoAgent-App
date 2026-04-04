import * as XLSX from 'xlsx';
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

export function downloadExcel(data: ExcelExportData) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Project Info
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet([
      ['Proyecto', data.project.name],
      ['Descripcion', data.project.description],
      ['Ubicacion', data.project.location],
      ['Estaciones', data.stations.length],
      ['Sondajes', data.drillHoles.length],
      ['Muestras', data.samples.length],
    ]),
    'Proyecto',
  );

  // Sheet 2: Stations
  const stationHeaders = ['ID', 'Codigo', 'Fecha', 'Geologo', 'Descripcion', 'Latitud', 'Longitud', 'Altitud', 'Condiciones'];
  const stationRows = data.stations.map((s) => [
    s.id, s.code, s.date, s.geologist, s.description,
    s.latitude, s.longitude, s.altitude ?? '', s.weatherConditions ?? '',
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([stationHeaders, ...stationRows]), 'Estaciones');

  // Sheet 3: Lithologies
  const lithoHeaders = ['Estacion ID', 'Tipo Roca', 'Grupo', 'Color', 'Textura', 'Granulometria', 'Mineralogia', 'Alteracion', 'Intensidad', 'Mineralizacion', 'Min %', 'Estructura', 'Meteorizacion', 'Notas'];
  const lithoRows = data.lithologies.map((l) => [
    l.stationId, l.rockType, l.rockGroup, l.color, l.texture, l.grainSize,
    l.mineralogy, l.alteration ?? '', l.alterationIntensity ?? '',
    l.mineralization ?? '', l.mineralizationPercent ?? '',
    l.structure ?? '', l.weathering ?? '', l.notes ?? '',
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([lithoHeaders, ...lithoRows]), 'Litologias');

  // Sheet 4: Structural
  const structHeaders = ['Estacion ID', 'Tipo', 'Rumbo', 'Buzamiento', 'Dir Buz', 'Movimiento', 'Espesor', 'Relleno', 'Rugosidad', 'Continuidad', 'Notas'];
  const structRows = data.structural.map((s) => [
    s.stationId, s.type, s.strike, s.dip, s.dipDirection,
    s.movement ?? '', s.thickness ?? '', s.filling ?? '',
    s.roughness ?? '', s.continuity ?? '', s.notes ?? '',
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([structHeaders, ...structRows]), 'Estructural');

  // Sheet 5: Samples
  const sampleHeaders = ['Estacion ID', 'Codigo', 'Tipo', 'Descripcion', 'Peso', 'Largo', 'Estado', 'Destino', 'Analisis', 'Latitud', 'Longitud', 'Notas'];
  const sampleRows = data.samples.map((s) => [
    s.stationId, s.code, s.type, s.description,
    s.weight ?? '', s.length ?? '', s.status,
    s.destination ?? '', s.analysisRequested ?? '',
    s.latitude ?? '', s.longitude ?? '', s.notes ?? '',
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([sampleHeaders, ...sampleRows]), 'Muestras');

  // Sheet 6: Drill Holes
  const dhHeaders = ['ID', 'Sondaje', 'Tipo', 'Geologo', 'Latitud', 'Longitud', 'Altitud', 'Azimut', 'Inclinacion', 'Prof Planeada', 'Prof Real', 'Estado', 'Inicio', 'Fin', 'Notas'];
  const dhRows = data.drillHoles.map((d) => [
    d.id, d.holeId, d.type, d.geologist,
    d.latitude, d.longitude, d.altitude ?? '',
    d.azimuth, d.inclination, d.plannedDepth, d.actualDepth ?? '',
    d.status, d.startDate ?? '', d.endDate ?? '', d.notes ?? '',
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([dhHeaders, ...dhRows]), 'Sondajes');

  // Sheet 7: Intervals
  const intHeaders = ['Sondaje ID', 'Desde', 'Hasta', 'Tipo Roca', 'Grupo', 'Color', 'Textura', 'Granulometria', 'Mineralogia', 'Alteracion', 'Intensidad', 'RQD', 'Recovery', 'Min %', 'Estructura', 'Meteorizacion', 'Notas'];
  const intRows = data.intervals.map((i) => [
    i.drillHoleId, i.fromDepth, i.toDepth, i.rockType, i.rockGroup,
    i.color, i.texture, i.grainSize, i.mineralogy,
    i.alteration ?? '', i.alterationIntensity ?? '',
    i.rqd ?? '', i.recovery ?? '', i.mineralizationPercent ?? '',
    i.structure ?? '', i.weathering ?? '', i.notes ?? '',
  ]);
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([intHeaders, ...intRows]), 'Intervalos');

  const filename = `${data.project.name.replace(/\s+/g, '_')}_GeoAgent.xlsx`;

  if (typeof window !== 'undefined' && (window as any).electronAPI?.isElectron) {
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    await (window as any).electronAPI.saveFile(filename, buffer);
  } else {
    XLSX.writeFile(wb, filename);
  }
}
