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
  type LucideIcon,
} from 'lucide-react';
import { useProject } from '@/lib/hooks/use-projects';
import { useStations } from '@/lib/hooks/use-stations';
import { useDrillHoles } from '@/lib/hooks/use-drillholes';
import { useAuth } from '@/lib/firebase/auth';
import {
  getStationsOnce,
  getDrillHolesOnce,
  getPhotosOnce,
  getLithologiesForStations,
  getStructuralForStations,
  getSamplesForStations,
  getIntervalsForDrillHoles,
} from '@/lib/firebase/firestore';
// Heavy export libs (jspdf ~250KB, xlsx-js-style ~600KB) are loaded on-demand
// via dynamic import inside each handler. Keeps the initial page chunk light.
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { GeoProject } from '@geoagent/geo-shared/types';

type ExportStatus = 'idle' | 'loading' | 'done' | 'error';

interface ExportCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  formats: string[];
  status: ExportStatus;
  onExport: () => void;
  accent: string;
  accentBorder?: string;
}

function ExportCard({ icon: Icon, title, description, formats, status, onExport, accent, accentBorder }: ExportCardProps) {
  return (
    <Card className={`hover:border-border/80 transition-colors card-lift ${accentBorder ?? ''}`}>
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

      // Batch fetch sub-data — single whereIn query per collection instead of N queries
      const stationIds = (allStations as any[]).map((s) => s.id);
      const drillHoleIds = (allDrillHoles as any[]).map((d) => d.id);
      const [allLithologies, allStructural, allSamples, allIntervals] = await Promise.all([
        getLithologiesForStations(user.uid, stationIds),
        getStructuralForStations(user.uid, stationIds),
        getSamplesForStations(user.uid, stationIds),
        getIntervalsForDrillHoles(user.uid, drillHoleIds),
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

      const { downloadPDF } = await import('@/lib/export/pdf');
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

      const stationIdsExcel = (allStations as any[]).map((s) => s.id);
      const drillHoleIdsExcel = (allDrillHoles as any[]).map((d) => d.id);
      const [allLithologies, allStructural, allSamples, allIntervals] = await Promise.all([
        getLithologiesForStations(user.uid, stationIdsExcel),
        getStructuralForStations(user.uid, stationIdsExcel),
        getSamplesForStations(user.uid, stationIdsExcel),
        getIntervalsForDrillHoles(user.uid, drillHoleIdsExcel),
      ]);

      const { downloadExcel } = await import('@/lib/export/excel');
      await downloadExcel({
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

      // Batch fetch sub-data for rich GeoJSON properties
      const stationIdsGeo = (allStations as any[]).map((s) => s.id);
      const drillHoleIdsGeo = (allDrillHoles as any[]).map((d) => d.id);
      const [allLithologies, allStructural, allSamples, allIntervals] = await Promise.all([
        getLithologiesForStations(user.uid, stationIdsGeo),
        getStructuralForStations(user.uid, stationIdsGeo),
        getSamplesForStations(user.uid, stationIdsGeo),
        getIntervalsForDrillHoles(user.uid, drillHoleIdsGeo),
      ]);

      const { downloadGeoJSON } = await import('@/lib/export/geojson');
      await downloadGeoJSON({
        projectName: project.name,
        projectDescription: (project as any).description,
        stations: allStations as any,
        drillHoles: allDrillHoles as any,
        lithologies: allLithologies as any,
        structural: allStructural as any,
        samples: allSamples as any,
        intervals: allIntervals as any,
      }, project.name.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/\s+/g, '_'));
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
      const drillHoleIdsCsv = (allDrillHoles as any[]).map((d) => d.id);
      const allIntervals = await getIntervalsForDrillHoles(user.uid, drillHoleIdsCsv);

      // Enrich intervals with readable holeId for CSV
      const drillHoleMap: Record<string, string> = Object.fromEntries(
        (allDrillHoles as any[]).map((d: any) => [d.id, d.holeId]),
      );
      const enriched = (allIntervals as any[]).map((i: any) => ({
        ...i,
        holeId: drillHoleMap[i.drillHoleId] ?? i.drillHoleId,
      }));

      const { downloadCsvBundle } = await import('@/lib/export/csv');
      await downloadCsvBundle(
        allDrillHoles as any,
        enriched as any,
        project.name.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/\s+/g, '_'),
      );
      setCsvStatus('done');
      toast.success('ZIP descargado con collar, survey y lith');
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
      accentBorder: 'stat-accent-rose',
    },
    {
      icon: Sheet,
      title: 'Libro Excel',
      description: 'Workbook con 7 hojas: proyecto, estaciones, litologías, estructural, muestras, sondajes e intervalos',
      formats: ['.xlsx'],
      status: excelStatus,
      onExport: handleExcel,
      accent: 'bg-green-600/20',
      accentBorder: 'stat-accent-green',
    },
    {
      icon: Map,
      title: 'GeoJSON',
      description: 'FeatureCollection con litologías, estructurales, muestras e intervalos como propiedades. Compatible con QGIS, Mapbox y GitHub.',
      formats: ['.geojson'],
      status: geojsonStatus,
      onExport: handleGeoJSON,
      accent: 'bg-blue-500/20',
      accentBorder: 'stat-accent-blue',
    },
    {
      icon: FileSpreadsheet,
      title: 'CSV Minería (ZIP)',
      description: 'Bundle estándar para Leapfrog Geo, Surpac y Micromine. Incluye collar, survey y log litológico.',
      formats: ['collar.csv', 'survey.csv', 'lith.csv'],
      status: csvStatus,
      onExport: handleCSV,
      accent: 'bg-amber-500/20',
      accentBorder: 'stat-accent-amber',
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
      <p className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg p-4">
        <strong>Nota:</strong> Los exports más completos (PDF, Excel) cargan todos los datos del proyecto incluyendo sub-datos de estaciones y sondajes. El proceso puede tomar algunos segundos según la cantidad de datos.
      </p>
    </div>
  );
}
