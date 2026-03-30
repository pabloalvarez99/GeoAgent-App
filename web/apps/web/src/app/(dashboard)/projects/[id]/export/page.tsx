'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Download,
  FileText,
  Sheet,
  Map,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '@/lib/hooks/use-projects';
import { useStations } from '@/lib/hooks/use-stations';
import { useDrillHoles } from '@/lib/hooks/use-drillholes';
import { useAuth } from '@/lib/firebase/auth';
import {
  getStationsOnce,
  getDrillHolesOnce,
  getLithologiesOnce,
  getStructuralOnce,
  getSamplesOnce,
  getIntervalsOnce,
  getPhotosOnce,
} from '@/lib/firebase/firestore';
import { downloadPDF } from '@/lib/export/pdf';
import { downloadExcel } from '@/lib/export/excel';
import { downloadGeoJSON } from '@/lib/export/geojson';
import { downloadCsvBundle } from '@/lib/export/csv';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GeoProject } from '@geoagent/geo-shared/types';

type ExportStatus = 'idle' | 'loading' | 'done' | 'error';

interface ExportCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  formats: string[];
  status: ExportStatus;
  onExport: () => void;
  accent: string;
}

function ExportCard({ icon: Icon, title, description, formats, status, onExport, accent }: ExportCardProps) {
  return (
    <Card className="bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${accent}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {formats.map((f) => (
            <Badge key={f} variant="secondary" className="text-xs font-mono">
              {f}
            </Badge>
          ))}
        </div>
        <Button
          onClick={onExport}
          disabled={status === 'loading'}
          className="w-full"
          variant={status === 'done' ? 'outline' : 'default'}
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : status === 'done' ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
              Descargado
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { project } = useProject(id);
  const { stations } = useStations(id);
  const { drillHoles } = useDrillHoles(id);

  const [pdfStatus, setPdfStatus] = useState<ExportStatus>('idle');
  const [excelStatus, setExcelStatus] = useState<ExportStatus>('idle');
  const [geojsonStatus, setGeojsonStatus] = useState<ExportStatus>('idle');
  const [csvStatus, setCsvStatus] = useState<ExportStatus>('idle');

  async function handlePDF() {
    if (!user || !project) return;
    setPdfStatus('loading');
    try {
      // Fetch primary collections in parallel
      const [allStations, allDrillHoles, rawPhotos] = await Promise.all([
        getStationsOnce(user.uid, id),
        getDrillHolesOnce(user.uid, id),
        getPhotosOnce(user.uid, id),
      ]);

      // Fetch per-station and per-hole sub-data in parallel
      const [allLithologies, allStructural, allSamples, allIntervals] = await Promise.all([
        Promise.all(allStations.map((s: any) => getLithologiesOnce(user.uid, s.id))).then((r) => r.flat()),
        Promise.all(allStations.map((s: any) => getStructuralOnce(user.uid, s.id))).then((r) => r.flat()),
        Promise.all(allStations.map((s: any) => getSamplesOnce(user.uid, s.id))).then((r) => r.flat()),
        Promise.all(allDrillHoles.map((d: any) => getIntervalsOnce(user.uid, d.id))).then((r) => r.flat()),
      ]);

      // Resolve Firebase Storage download URLs for photos
      const { getDownloadURL, ref: storageRef } = await import('firebase/storage');
      const { storage } = await import('@/lib/firebase/client');
      const photosWithUrls = await Promise.all(
        (rawPhotos as any[]).map(async (photo) => {
          if (!photo.storagePath) return { ...photo, downloadUrl: undefined };
          try {
            const url = await getDownloadURL(storageRef(storage, photo.storagePath));
            return { ...photo, downloadUrl: url };
          } catch {
            return { ...photo, downloadUrl: undefined };
          }
        }),
      );

      await downloadPDF({
        project: project as GeoProject,
        stations: allStations as any,
        lithologies: allLithologies as any,
        structural: allStructural as any,
        samples: allSamples as any,
        drillHoles: allDrillHoles as any,
        intervals: allIntervals as any,
        photos: photosWithUrls as any,
      });
      setPdfStatus('done');
      toast.success('PDF generado correctamente');
      setTimeout(() => setPdfStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setPdfStatus('error');
      toast.error('Error al generar el PDF');
      setTimeout(() => setPdfStatus('idle'), 3000);
    }
  }

  async function handleExcel() {
    if (!user || !project) return;
    setExcelStatus('loading');
    try {
      const [allStations, allDrillHoles] = await Promise.all([
        getStationsOnce(user.uid, id),
        getDrillHolesOnce(user.uid, id),
      ]);

      const [allLithologies, allStructural, allSamples, allIntervals] = await Promise.all([
        Promise.all(allStations.map((s: any) => getLithologiesOnce(user.uid, s.id))).then((r) => r.flat()),
        Promise.all(allStations.map((s: any) => getStructuralOnce(user.uid, s.id))).then((r) => r.flat()),
        Promise.all(allStations.map((s: any) => getSamplesOnce(user.uid, s.id))).then((r) => r.flat()),
        Promise.all(allDrillHoles.map((d: any) => getIntervalsOnce(user.uid, d.id))).then((r) => r.flat()),
      ]);

      downloadExcel({
        project: project as GeoProject,
        stations: allStations as any,
        lithologies: allLithologies as any,
        structural: allStructural as any,
        samples: allSamples as any,
        drillHoles: allDrillHoles as any,
        intervals: allIntervals as any,
      });
      setExcelStatus('done');
      toast.success('Excel generado correctamente');
      setTimeout(() => setExcelStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setExcelStatus('error');
      toast.error('Error al generar el Excel');
      setTimeout(() => setExcelStatus('idle'), 3000);
    }
  }

  async function handleGeoJSON() {
    if (!user || !project) return;
    setGeojsonStatus('loading');
    try {
      const [allStations, allDrillHoles] = await Promise.all([
        getStationsOnce(user.uid, id),
        getDrillHolesOnce(user.uid, id),
      ]);
      downloadGeoJSON({
        projectName: project.name,
        stations: allStations as any,
        drillHoles: allDrillHoles as any,
      }, project.name.replace(/\s+/g, '_'));
      setGeojsonStatus('done');
      toast.success('GeoJSON exportado correctamente');
      setTimeout(() => setGeojsonStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setGeojsonStatus('error');
      toast.error('Error al generar el GeoJSON');
      setTimeout(() => setGeojsonStatus('idle'), 3000);
    }
  }

  async function handleCSV() {
    if (!user || !project) return;
    setCsvStatus('loading');
    try {
      const allDrillHoles = await getDrillHolesOnce(user.uid, id);
      const allIntervals = await Promise.all(
        allDrillHoles.map((d: any) => getIntervalsOnce(user.uid, d.id)),
      ).then((r) => r.flat());

      // Enrich intervals with holeId for CSV
      const enriched = allIntervals.map((i: any) => {
        const hole = (allDrillHoles as any[]).find((d: any) => d.id === i.drillHoleId);
        return { ...i, holeId: hole?.holeId ?? i.drillHoleId };
      });

      downloadCsvBundle(allDrillHoles as any, enriched, project.name.replace(/\s+/g, '_'));
      setCsvStatus('done');
      toast.success('CSVs exportados correctamente');
      setTimeout(() => setCsvStatus('idle'), 3000);
    } catch (e) {
      console.error(e);
      setCsvStatus('error');
      toast.error('Error al generar los CSVs');
      setTimeout(() => setCsvStatus('idle'), 3000);
    }
  }

  const exports: ExportCardProps[] = [
    {
      icon: FileText,
      title: 'Reporte PDF',
      description: 'Informe completo del proyecto con tablas de estaciones, sondajes e intervalos',
      formats: ['.pdf'],
      status: pdfStatus,
      onExport: handlePDF,
      accent: 'bg-red-500/20',
    },
    {
      icon: Sheet,
      title: 'Libro Excel',
      description: 'Workbook con 7 hojas: proyecto, estaciones, litologías, estructural, muestras, sondajes e intervalos',
      formats: ['.xlsx'],
      status: excelStatus,
      onExport: handleExcel,
      accent: 'bg-green-600/20',
    },
    {
      icon: Map,
      title: 'GeoJSON',
      description: 'FeatureCollection con estaciones y sondajes como puntos georreferenciados',
      formats: ['.geojson'],
      status: geojsonStatus,
      onExport: handleGeoJSON,
      accent: 'bg-blue-500/20',
    },
    {
      icon: FileSpreadsheet,
      title: 'CSV Minería',
      description: 'Archivos CSV en formato estándar de la industria: collar, survey y assay para software de geoestadística',
      formats: ['_collar.csv', '_survey.csv', '_assay.csv'],
      status: csvStatus,
      onExport: handleCSV,
      accent: 'bg-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Exportar datos</h1>
          {project && (
            <p className="text-sm text-muted-foreground mt-0.5">{project.name}</p>
          )}
        </div>
      </div>

      {/* Stats summary */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
          {stations.length} estaciones
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400 inline-block" />
          {drillHoles.length} sondajes
        </span>
      </div>

      {/* Export cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {exports.map((exp) => (
          <ExportCard key={exp.title} {...exp} />
        ))}
      </div>

      {/* Note */}
      <p className="text-xs text-muted-foreground bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
        <strong>Nota:</strong> Los exports más completos (PDF, Excel) cargan todos los datos del proyecto incluyendo sub-datos de estaciones y sondajes. El proceso puede tomar algunos segundos según la cantidad de datos.
      </p>
    </div>
  );
}
