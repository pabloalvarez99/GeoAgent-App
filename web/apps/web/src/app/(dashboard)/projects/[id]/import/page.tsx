'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { read, utils } from 'xlsx';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { useDrillHoles } from '@/lib/hooks/use-drillholes';
import { createStation, createDrillHole, saveDrillInterval } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── Tipos de resultado ───────────────────────────────────────────────────────
type RowError = { row: number; field: string; message: string; value: string };

interface ParseResult {
  valid: any[];
  errors: RowError[];
}

// ── Columnas de preview por tab ──────────────────────────────────────────────
const PREVIEW_COLUMNS = {
  stations: [
    { label: 'Código',   key: 'code' },
    { label: 'Geólogo',  key: 'geologist' },
    { label: 'Lat',      key: 'latitude',  numeric: true },
    { label: 'Lng',      key: 'longitude', numeric: true },
    { label: 'Fecha',    key: 'date' },
  ],
  drillholes: [
    { label: 'HoleID',   key: 'holeId' },
    { label: 'Tipo',     key: 'type' },
    { label: 'Az',       key: 'azimuth',      numeric: true },
    { label: 'Inc',      key: 'inclination',  numeric: true },
    { label: 'Prof',     key: 'plannedDepth', numeric: true },
  ],
  intervals: [
    { label: 'HoleID',     key: 'drillHoleId' },
    { label: 'De',         key: 'fromDepth',  numeric: true },
    { label: 'A',          key: 'toDepth',    numeric: true },
    { label: 'Tipo Roca',  key: 'rockType' },
    { label: 'RQD',        key: 'rqd',        numeric: true },
  ],
} as const;

// ── Validación de filas ──────────────────────────────────────────────────────
function validateStationRow(row: any, index: number): { data: any } | { error: RowError } {
  const code = String(row['code'] ?? row['codigo'] ?? row['station'] ?? '').trim();
  const lat = parseFloat(row['latitude'] ?? row['latitud'] ?? row['lat']);
  const lon = parseFloat(row['longitude'] ?? row['longitud'] ?? row['lon'] ?? row['lng']);
  if (!code) return { error: { row: index + 2, field: 'code', message: 'campo requerido vacío', value: '' } };
  if (isNaN(lat) || lat < -90 || lat > 90)
    return { error: { row: index + 2, field: 'latitude', message: 'latitud inválida (debe ser -90 a 90)', value: String(row['latitude'] ?? row['latitud'] ?? row['lat'] ?? '').slice(0, 40) } };
  if (isNaN(lon) || lon < -180 || lon > 180)
    return { error: { row: index + 2, field: 'longitude', message: 'longitud inválida (debe ser -180 a 180)', value: String(row['longitude'] ?? row['longitud'] ?? row['lon'] ?? row['lng'] ?? '').slice(0, 40) } };
  return {
    data: {
      code,
      latitude: lat,
      longitude: lon,
      altitude: parseFloat(row['altitude'] ?? row['altitud'] ?? row['elev'] ?? '') || undefined,
      date: String(row['date'] ?? row['fecha'] ?? new Date().toISOString().split('T')[0]),
      geologist: String(row['geologist'] ?? row['geologo'] ?? row['geólogo'] ?? '').trim() || 'Importado',
      description: String(row['description'] ?? row['descripcion'] ?? row['descripción'] ?? '').trim() || '',
      weatherConditions: String(row['weatherConditions'] ?? row['clima'] ?? '').trim() || undefined,
    },
  };
}

function validateDrillHoleRow(row: any, index: number): { data: any } | { error: RowError } {
  const holeId = String(row['holeId'] ?? row['hole_id'] ?? row['id_sondaje'] ?? row['sondaje'] ?? '').trim();
  const lat = parseFloat(row['latitude'] ?? row['latitud'] ?? row['lat']);
  const lon = parseFloat(row['longitude'] ?? row['longitud'] ?? row['lon'] ?? row['lng']);
  const plannedDepth = parseFloat(row['plannedDepth'] ?? row['planned_depth'] ?? row['profundidad'] ?? row['depth'] ?? '');
  if (!holeId) return { error: { row: index + 2, field: 'holeId', message: 'campo requerido vacío', value: '' } };
  if (isNaN(lat) || lat < -90 || lat > 90)
    return { error: { row: index + 2, field: 'latitude', message: 'latitud inválida', value: String(row['latitude'] ?? row['latitud'] ?? row['lat'] ?? '').slice(0, 40) } };
  if (isNaN(lon) || lon < -180 || lon > 180)
    return { error: { row: index + 2, field: 'longitude', message: 'longitud inválida', value: String(row['longitude'] ?? row['longitud'] ?? row['lon'] ?? row['lng'] ?? '').slice(0, 40) } };
  if (isNaN(plannedDepth) || plannedDepth <= 0)
    return { error: { row: index + 2, field: 'plannedDepth', message: 'profundidad planificada inválida (debe ser > 0)', value: String(row['plannedDepth'] ?? row['planned_depth'] ?? row['profundidad'] ?? row['depth'] ?? '').slice(0, 40) } };
  return {
    data: {
      holeId,
      latitude: lat,
      longitude: lon,
      altitude: parseFloat(row['altitude'] ?? row['altitud'] ?? '') || undefined,
      azimuth: parseFloat(row['azimuth'] ?? row['azimut'] ?? '0') || 0,
      inclination: parseFloat(row['inclination'] ?? row['inclinacion'] ?? row['inclinación'] ?? '-90') || -90,
      plannedDepth,
      actualDepth: parseFloat(row['actualDepth'] ?? row['actual_depth'] ?? row['profundidad_real'] ?? '') || undefined,
      type: String(row['type'] ?? row['tipo'] ?? 'DDH').trim(),
      status: String(row['status'] ?? row['estado'] ?? 'Planificado').trim(),
      geologist: String(row['geologist'] ?? row['geologo'] ?? row['geólogo'] ?? '').trim() || 'Importado',
      startDate: String(row['startDate'] ?? row['fecha_inicio'] ?? '').trim() || undefined,
      endDate: String(row['endDate'] ?? row['fecha_fin'] ?? '').trim() || undefined,
      notes: String(row['notes'] ?? row['notas'] ?? '').trim() || undefined,
    },
  };
}

function validateIntervalRow(
  row: any,
  index: number,
  holeIdToDocId: Record<string, string>,
): { data: any } | { error: RowError } {
  const rawHoleId = String(
    row['HoleID'] ?? row['holeId'] ?? row['hole_id'] ?? row['SondajeID'] ?? row['sondaje'] ?? '',
  ).trim();
  if (!rawHoleId) return { error: { row: index + 2, field: 'HoleID', message: 'campo requerido vacío', value: '' } };
  const drillHoleId = holeIdToDocId[rawHoleId];
  if (!drillHoleId)
    return { error: { row: index + 2, field: 'HoleID', message: 'sondaje no existe en este proyecto', value: rawHoleId.slice(0, 40) } };

  const fromDepth = parseFloat(row['From'] ?? row['from'] ?? row['Desde'] ?? row['desde'] ?? '');
  const toDepth = parseFloat(row['To'] ?? row['to'] ?? row['Hasta'] ?? row['hasta'] ?? '');
  if (isNaN(fromDepth) || fromDepth < 0)
    return { error: { row: index + 2, field: 'From', message: 'profundidad inicial inválida', value: String(row['From'] ?? row['from'] ?? row['Desde'] ?? '').slice(0, 40) } };
  if (isNaN(toDepth))
    return { error: { row: index + 2, field: 'To', message: 'profundidad final inválida', value: String(row['To'] ?? row['to'] ?? row['Hasta'] ?? '').slice(0, 40) } };
  if (fromDepth >= toDepth)
    return { error: { row: index + 2, field: 'From/To', message: `"Desde" debe ser menor que "Hasta"`, value: `${fromDepth} ≥ ${toDepth}` } };

  const rockType = String(row['RockType'] ?? row['TipoRoca'] ?? row['rockType'] ?? row['tipo_roca'] ?? '').trim();
  const rockGroup = String(row['RockGroup'] ?? row['GrupoRoca'] ?? row['rockGroup'] ?? row['grupo_roca'] ?? '').trim();
  if (!rockType) return { error: { row: index + 2, field: 'RockType', message: 'campo requerido vacío', value: '' } };
  if (!rockGroup) return { error: { row: index + 2, field: 'RockGroup', message: 'campo requerido vacío', value: '' } };

  const color = String(row['Color'] ?? row['color'] ?? '').trim();
  const texture = String(row['Texture'] ?? row['Textura'] ?? row['texture'] ?? '').trim();
  const grainSize = String(row['GrainSize'] ?? row['Tamano'] ?? row['Tamaño'] ?? row['grainSize'] ?? '').trim();
  const mineralogy = String(row['Mineralogy'] ?? row['Mineralogia'] ?? row['Mineralogía'] ?? row['mineralogy'] ?? '').trim();

  const rqd = parseFloat(row['RQD'] ?? row['rqd'] ?? '');
  const recovery = parseFloat(row['Recovery'] ?? row['Recuperacion'] ?? row['Recuperación'] ?? row['recovery'] ?? '');

  return {
    data: {
      drillHoleId,
      fromDepth,
      toDepth,
      rockType,
      rockGroup,
      color: color || 'Sin color',
      texture: texture || 'Sin textura',
      grainSize: grainSize || 'Media',
      mineralogy: mineralogy || '',
      alteration: String(row['Alteration'] ?? row['Alteracion'] ?? row['Alteración'] ?? row['alteration'] ?? '').trim() || undefined,
      alterationIntensity: String(row['AlterationIntensity'] ?? row['IntensidadAlteracion'] ?? row['alterationIntensity'] ?? '').trim() || undefined,
      mineralization: String(row['Mineralization'] ?? row['Mineralizacion'] ?? row['Mineralización'] ?? row['mineralization'] ?? '').trim() || undefined,
      mineralizationPercent: isNaN(parseFloat(row['MineralizationPercent'] ?? row['PorcMineralizacion'] ?? '')) ? undefined : parseFloat(row['MineralizationPercent'] ?? row['PorcMineralizacion'] ?? ''),
      rqd: isNaN(rqd) ? undefined : rqd,
      recovery: isNaN(recovery) ? undefined : recovery,
      notes: String(row['Notes'] ?? row['Notas'] ?? row['notes'] ?? '').trim() || undefined,
    },
  };
}

function parseFile(file: File, type: 'stations' | 'drillholes'): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = utils.sheet_to_json(sheet);

        const valid: any[] = [];
        const errors: RowError[] = [];

        rows.forEach((row, i) => {
          const result = type === 'stations'
            ? validateStationRow(row, i)
            : validateDrillHoleRow(row, i);
          if ('data' in result) valid.push(result.data);
          else errors.push(result.error);
        });

        resolve({ valid, errors });
      } catch {
        resolve({ valid: [], errors: [{ row: 0, field: 'archivo', message: 'No se pudo leer el archivo. Verifica que sea .xlsx o .csv válido.', value: file.name.slice(0, 40) }] });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function parseIntervalFile(file: File, holeIdToDocId: Record<string, string>): Promise<ParseResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = utils.sheet_to_json(sheet);
        const valid: any[] = [];
        const errors: RowError[] = [];
        rows.forEach((row, i) => {
          const result = validateIntervalRow(row, i, holeIdToDocId);
          if ('data' in result) valid.push(result.data);
          else errors.push(result.error);
        });
        resolve({ valid, errors });
      } catch {
        resolve({ valid: [], errors: [{ row: 0, field: 'archivo', message: 'No se pudo leer el archivo. Verifica que sea .xlsx o .csv válido.', value: file.name.slice(0, 40) }] });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ── Descarga de plantilla CSV ────────────────────────────────────────────────
function downloadTemplate(filename: string, headers: string[], exampleRow: string[]): void {
  const csvContent = [headers.join(','), exampleRow.join(',')].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const TEMPLATES = {
  stations: {
    filename: 'plantilla_estaciones.csv',
    headers: ['Codigo', 'Geologo', 'Descripcion', 'Latitud', 'Longitud', 'Altitud', 'Fecha', 'CondicionesClima'],
    example: ['EST-001', 'Juan Perez', 'Afloramiento granítico', '-33.4569', '-70.6483', '850', '2026-04-15', 'Despejado'],
  },
  drillholes: {
    filename: 'plantilla_sondajes.csv',
    headers: ['HoleID', 'Tipo', 'Geologo', 'Latitud', 'Longitud', 'Altitud', 'Azimut', 'Inclinacion', 'ProfPlanificada', 'Estado', 'Notas'],
    example: ['DDH-001', 'Diamantina', 'Ana Lopez', '-33.4571', '-70.6480', '855', '270', '-60', '200', 'En Progreso', 'Inicio de campaña'],
  },
  intervals: {
    filename: 'plantilla_intervalos.csv',
    headers: ['HoleID', 'Desde', 'Hasta', 'TipoRoca', 'GrupoRoca', 'Color', 'Textura', 'TamanoGrano', 'Mineralogia', 'RQD', 'Recuperacion', 'Notas'],
    example: ['DDH-001', '0', '5.5', 'Andesita', 'Ignea', 'Gris Medio', 'Afanitica', 'Fina', 'Cuarzo Plagioclasa', '85', '92', 'Zona alterada'],
  },
} as const;

// ── Componente principal ─────────────────────────────────────────────────────
export default function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { user } = useAuth();
  const { drillHoles } = useDrillHoles(projectId);

  const holeIdToDocId = Object.fromEntries(drillHoles.map((d) => [d.holeId, d.id]));

  const [tab, setTab] = useState<'stations' | 'drillholes' | 'intervals'>('stations');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'ready' | 'importing' | 'done' | 'error'>('idle');
  const [importedCount, setImportedCount] = useState(0);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setStatus('parsing');
    setParseResult(null);
    setShowAllErrors(false);
    const result = tab === 'intervals'
      ? await parseIntervalFile(f, holeIdToDocId)
      : await parseFile(f, tab);
    setParseResult(result);
    setStatus('ready');
  }, [tab, holeIdToDocId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleTabChange = (t: string) => {
    setTab(t as 'stations' | 'drillholes' | 'intervals');
    setFile(null);
    setParseResult(null);
    setStatus('idle');
    setImportProgress(null);
    setShowAllErrors(false);
  };

  const handleImport = async () => {
    if (!user || !parseResult?.valid.length) return;
    setStatus('importing');
    setImportedCount(0);
    setImportProgress({ current: 0, total: parseResult.valid.length });
    let count = 0;
    const BATCH = 20;
    try {
      const items = parseResult.valid;
      for (let i = 0; i < items.length; i += BATCH) {
        const chunk = items.slice(i, i + BATCH);
        await Promise.all(
          chunk.map(async (item) => {
            if (tab === 'stations') await createStation(user.uid, { ...item, projectId });
            else if (tab === 'drillholes') await createDrillHole(user.uid, { ...item, projectId });
            else await saveDrillInterval(user.uid, item);
          }),
        );
        count += chunk.length;
        setImportedCount(count);
        setImportProgress({ current: count, total: items.length });
      }
      setStatus('done');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const reset = () => {
    setFile(null);
    setParseResult(null);
    setStatus('idle');
    setImportedCount(0);
    setImportProgress(null);
    setShowAllErrors(false);
  };

  const previewCols = PREVIEW_COLUMNS[tab === 'intervals' ? 'intervals' : tab === 'drillholes' ? 'drillholes' : 'stations'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Importar datos</h1>
          <p className="text-sm text-muted-foreground">Sube un archivo CSV o Excel para importar en bulk</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="stations">Estaciones</TabsTrigger>
          <TabsTrigger value="drillholes">Sondajes</TabsTrigger>
          <TabsTrigger value="intervals">Intervalos</TabsTrigger>
        </TabsList>

        {/* Plantilla de columnas */}
        <Card className="mt-4 border-dashed">
          <CardContent className="py-3 px-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Columnas requeridas:</p>
            {tab === 'stations' ? (
              <p className="text-xs font-mono text-muted-foreground">
                <span className="text-foreground">code</span>, <span className="text-foreground">latitude</span>, <span className="text-foreground">longitude</span>
                {' '}— opcionales: altitude, date, geologist, description, weatherConditions
              </p>
            ) : tab === 'drillholes' ? (
              <p className="text-xs font-mono text-muted-foreground">
                <span className="text-foreground">holeId</span>, <span className="text-foreground">latitude</span>, <span className="text-foreground">longitude</span>, <span className="text-foreground">plannedDepth</span>
                {' '}— opcionales: azimuth, inclination, actualDepth, type, status, geologist, startDate, endDate, notes
              </p>
            ) : (
              <p className="text-xs font-mono text-muted-foreground">
                <span className="text-foreground">HoleID</span>, <span className="text-foreground">From</span>, <span className="text-foreground">To</span>, <span className="text-foreground">RockType</span>, <span className="text-foreground">RockGroup</span>
                {' '}— opcionales: Color, Texture, GrainSize, Mineralogy, Alteration, RQD, Recovery, Notes
                {drillHoles.length === 0 && <span className="text-amber-400 ml-1">— (crea sondajes primero)</span>}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Acepta nombres en español e inglés. Formatos: .xlsx, .xls, .csv</p>
          </CardContent>
        </Card>

        <TabsContent value={tab} className="mt-4 space-y-4">
          {/* Botón descarga plantilla */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const t = TEMPLATES[tab];
                downloadTemplate(t.filename, [...t.headers], [...t.example]);
              }}
              className="gap-1.5"
            >
              <FileDown className="h-3.5 w-3.5" />
              Descargar plantilla CSV
            </Button>
          </div>

          {/* Drop zone */}
          {status === 'idle' || status === 'parsing' ? (
            <div
              className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer
                ${dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleInput}
              />
              {status === 'parsing' ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="skeleton h-12 w-12 rounded-full" />
                  <p className="text-sm text-muted-foreground">Procesando archivo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-muted p-4">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Arrastra tu archivo aquí</p>
                    <p className="text-xs text-muted-foreground mt-1">o haz click para seleccionar</p>
                  </div>
                </div>
              )}
            </div>
          ) : null}

          {/* Resultado del parsing + preview + import */}
          {parseResult && status !== 'done' && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    {file?.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-green-500">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {parseResult.valid.length} válidas
                    </Badge>
                    {parseResult.errors.length > 0 && (
                      <Badge variant="secondary" className="text-destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        {parseResult.errors.length} errores
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-4">

                {/* ── Errores detallados ── */}
                {parseResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-destructive">
                        {parseResult.errors.length} {parseResult.errors.length === 1 ? 'error' : 'errores'} de validación
                      </p>
                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowAllErrors((v) => !v)}
                      >
                        {showAllErrors ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        {showAllErrors ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                    {showAllErrors && (
                      <div className="space-y-1">
                        {parseResult.errors.slice(0, 10).map((e, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-destructive/90">
                            <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0 text-destructive" />
                            <span>
                              <span className="font-medium">[Fila {e.row}]</span>{' '}
                              <span className="font-mono">{e.field}</span>:{' '}
                              {e.message}
                              {e.value ? <span className="text-muted-foreground"> (valor: &quot;{e.value}&quot;)</span> : null}
                            </span>
                          </div>
                        ))}
                        {parseResult.errors.length > 10 && (
                          <p className="text-xs text-muted-foreground pl-5">
                            + {parseResult.errors.length - 10} errores más
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── Preview table (10 filas) ── */}
                {parseResult.valid.length > 0 && status !== 'importing' && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Vista previa — primeras {Math.min(10, parseResult.valid.length)} de {parseResult.valid.length} filas válidas:
                    </p>
                    <div className="overflow-x-auto rounded-md border border-border">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr className="bg-muted/50">
                            {previewCols.map((col) => (
                              <th key={col.key} className="border border-border px-2 py-1.5 text-left font-medium text-muted-foreground whitespace-nowrap">
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.valid.slice(0, 10).map((row, i) => (
                            <tr key={i} className="even:bg-muted/20">
                              {previewCols.map((col) => {
                                const v = row[col.key];
                                const display = v === undefined || v === null ? '—' : String(v);
                                return (
                                  <td
                                    key={col.key}
                                    className={`border border-border px-2 py-1 truncate max-w-[120px] ${(col as any).numeric ? 'font-data text-right' : ''}`}
                                  >
                                    {display}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ── Barra de progreso durante importación ── */}
                {status === 'importing' && importProgress && (
                  <div className="space-y-1">
                    <div className="h-1.5 rounded-full bg-primary/20 overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${Math.round((importProgress.current / importProgress.total) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {importProgress.current} / {importProgress.total} registros importados...
                    </p>
                  </div>
                )}

                {/* ── Botones de acción ── */}
                {status !== 'importing' && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={reset}>
                      Cambiar archivo
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleImport}
                      disabled={parseResult.valid.length === 0}
                    >
                      Confirmar e importar {parseResult.valid.length} {tab === 'stations' ? 'estaciones' : tab === 'drillholes' ? 'sondajes' : 'intervalos'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Éxito */}
          {status === 'done' && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-primary" />
                <div>
                  <p className="font-semibold">¡Importación completada!</p>
                  <p className="text-sm text-green-500 mt-1">
                    ✓ {importedCount} {tab === 'stations' ? 'estaciones' : tab === 'drillholes' ? 'sondajes' : 'intervalos'} importados exitosamente
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={reset}>Importar más</Button>
                  <Button asChild>
                    <Link href={tab === 'stations' ? `/projects/${projectId}/stations` : `/projects/${projectId}/drillholes`}>
                      Ver {tab === 'stations' ? 'estaciones' : 'sondajes'}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {status === 'error' && (
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
                <XCircle className="h-10 w-10 text-red-400" />
                <div>
                  <p className="font-semibold">Error en la importación</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Se importaron {importedCount} registros antes del error. Revisa los datos e intenta de nuevo.
                  </p>
                </div>
                <Button variant="outline" onClick={reset}>Intentar de nuevo</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
