'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import { read, utils } from 'xlsx';
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { createStation, createDrillHole } from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── Tipos de resultado ───────────────────────────────────────────────────────
interface ParseResult {
  valid: any[];
  errors: { row: number; message: string }[];
}

// ── Validación de filas ──────────────────────────────────────────────────────
function validateStationRow(row: any, index: number): { data: any } | { error: string } {
  const lat = parseFloat(row['latitude'] ?? row['latitud'] ?? row['lat']);
  const lon = parseFloat(row['longitude'] ?? row['longitud'] ?? row['lon'] ?? row['lng']);
  const code = String(row['code'] ?? row['codigo'] ?? row['station'] ?? '').trim();
  if (!code) return { error: `Fila ${index + 2}: falta campo "code" (código de estación)` };
  if (isNaN(lat) || lat < -90 || lat > 90) return { error: `Fila ${index + 2}: latitud inválida` };
  if (isNaN(lon) || lon < -180 || lon > 180) return { error: `Fila ${index + 2}: longitud inválida` };
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

function validateDrillHoleRow(row: any, index: number): { data: any } | { error: string } {
  const lat = parseFloat(row['latitude'] ?? row['latitud'] ?? row['lat']);
  const lon = parseFloat(row['longitude'] ?? row['longitud'] ?? row['lon'] ?? row['lng']);
  const holeId = String(row['holeId'] ?? row['hole_id'] ?? row['id_sondaje'] ?? row['sondaje'] ?? '').trim();
  const plannedDepth = parseFloat(row['plannedDepth'] ?? row['planned_depth'] ?? row['profundidad'] ?? row['depth'] ?? '');
  if (!holeId) return { error: `Fila ${index + 2}: falta campo "holeId"` };
  if (isNaN(lat) || lat < -90 || lat > 90) return { error: `Fila ${index + 2}: latitud inválida` };
  if (isNaN(lon) || lon < -180 || lon > 180) return { error: `Fila ${index + 2}: longitud inválida` };
  if (isNaN(plannedDepth) || plannedDepth <= 0) return { error: `Fila ${index + 2}: profundidad planificada inválida` };
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
        const errors: { row: number; message: string }[] = [];

        rows.forEach((row, i) => {
          const result = type === 'stations'
            ? validateStationRow(row, i)
            : validateDrillHoleRow(row, i);
          if ('data' in result) valid.push(result.data);
          else errors.push({ row: i + 2, message: result.error });
        });

        resolve({ valid, errors });
      } catch {
        resolve({ valid: [], errors: [{ row: 0, message: 'No se pudo leer el archivo. Verifica que sea .xlsx o .csv válido.' }] });
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function ImportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { user } = useAuth();

  const [tab, setTab] = useState<'stations' | 'drillholes'>('stations');
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'ready' | 'importing' | 'done' | 'error'>('idle');
  const [importedCount, setImportedCount] = useState(0);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setStatus('parsing');
    setParseResult(null);
    const result = await parseFile(f, tab);
    setParseResult(result);
    setStatus('ready');
  }, [tab]);

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
    setTab(t as 'stations' | 'drillholes');
    setFile(null);
    setParseResult(null);
    setStatus('idle');
  };

  const handleImport = async () => {
    if (!user || !parseResult?.valid.length) return;
    setStatus('importing');
    setImportedCount(0);
    let count = 0;
    try {
      // Batch in groups of 50 to avoid overwhelming Firestore
      const items = parseResult.valid;
      for (let i = 0; i < items.length; i++) {
        const item = { ...items[i], projectId };
        if (tab === 'stations') await createStation(user.uid, item);
        else await createDrillHole(user.uid, item);
        count++;
        setImportedCount(count);
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
  };

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
            ) : (
              <p className="text-xs font-mono text-muted-foreground">
                <span className="text-foreground">holeId</span>, <span className="text-foreground">latitude</span>, <span className="text-foreground">longitude</span>, <span className="text-foreground">plannedDepth</span>
                {' '}— opcionales: azimuth, inclination, actualDepth, type, status, geologist, startDate, endDate, notes
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">Acepta nombres en español e inglés. Formatos: .xlsx, .xls, .csv</p>
          </CardContent>
        </Card>

        <TabsContent value={tab} className="mt-4 space-y-4">
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
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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

          {/* Preview resultado */}
          {parseResult && status !== 'importing' && status !== 'done' && (
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
                      <Badge variant="secondary" className="text-red-400">
                        <XCircle className="h-3 w-3 mr-1" />
                        {parseResult.errors.length} errores
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-3">
                {parseResult.errors.length > 0 && (
                  <div className="space-y-1">
                    {parseResult.errors.slice(0, 5).map((e, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-red-400">
                        <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                        {e.message}
                      </div>
                    ))}
                    {parseResult.errors.length > 5 && (
                      <p className="text-xs text-muted-foreground">...y {parseResult.errors.length - 5} errores más</p>
                    )}
                  </div>
                )}

                {parseResult.valid.length > 0 && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs text-muted-foreground mb-2">Vista previa (primeras 3 filas):</p>
                    <div className="overflow-x-auto">
                      <table className="text-xs w-full">
                        <thead>
                          <tr className="text-muted-foreground">
                            {Object.keys(parseResult.valid[0]).slice(0, 6).map((k) => (
                              <th key={k} className="text-left pr-3 pb-1 font-medium">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {parseResult.valid.slice(0, 3).map((row, i) => (
                            <tr key={i}>
                              {Object.values(row).slice(0, 6).map((v: any, j) => (
                                <td key={j} className="pr-3 pb-0.5 truncate max-w-[100px]">
                                  {v === undefined || v === null ? '—' : String(v)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={reset}>
                    Cambiar archivo
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleImport}
                    disabled={parseResult.valid.length === 0}
                  >
                    Importar {parseResult.valid.length} {tab === 'stations' ? 'estaciones' : 'sondajes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progreso de importación */}
          {status === 'importing' && (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  Importando... {importedCount} / {parseResult?.valid.length}
                </p>
                <p className="text-xs text-muted-foreground">No cierres esta ventana</p>
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
                  <p className="text-sm text-muted-foreground mt-1">
                    Se importaron {importedCount} {tab === 'stations' ? 'estaciones' : 'sondajes'} exitosamente
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
