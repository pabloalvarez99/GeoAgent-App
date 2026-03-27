'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  MapPin,
  ArrowDown,
  Compass,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
} from 'lucide-react';
import { useDrillHoles, useDrillIntervals } from '@/lib/hooks/use-drillholes';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { IntervalForm } from '@/components/forms/interval-form';
import type { DrillIntervalFormData } from '@geoagent/geo-shared/validation';
import type { GeoDrillInterval } from '@geoagent/geo-shared/types';

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Completado': CheckCircle2,
  'En Progreso': Clock,
  'Abandonado': XCircle,
  'Suspendido': PauseCircle,
};

export default function DrillHoleDetailPage({
  params,
}: {
  params: Promise<{ id: string; dhId: string }>;
}) {
  const { id: projectId, dhId } = use(params);
  const { project } = useProject(projectId);
  const { drillHoles } = useDrillHoles(projectId);
  const drillHole = drillHoles.find((d) => d.id === dhId);
  const { intervals, loading, saveInterval, removeInterval } = useDrillIntervals(dhId);

  const [intervalOpen, setIntervalOpen] = useState(false);
  const [editInterval, setEditInterval] = useState<GeoDrillInterval | null>(null);
  const [deleteInterval, setDeleteInterval] = useState<GeoDrillInterval | null>(null);

  if (!drillHole) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">Sondaje no encontrado</p>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}/drillholes`}>← Volver a sondajes</Link>
        </Button>
      </div>
    );
  }

  const actualDepth = drillHole.actualDepth ?? 0;
  const pct = drillHole.plannedDepth > 0 ? Math.min(100, (actualDepth / drillHole.plannedDepth) * 100) : 0;
  const nextDepth = intervals.length > 0 ? Math.max(...intervals.map((i) => i.toDepth)) : 0;
  const StatusIcon = statusIcons[drillHole.status] ?? Clock;

  async function handleIntervalSubmit(data: DrillIntervalFormData) {
    await saveInterval({ ...data, drillHoleId: dhId }, editInterval?.id);
    setIntervalOpen(false);
    setEditInterval(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href={`/projects/${projectId}/drillholes`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{drillHole.holeId}</h1>
            <Badge variant="secondary">{drillHole.type}</Badge>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <StatusIcon className="h-4 w-4" />
              {drillHole.status}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="font-mono">{drillHole.latitude.toFixed(6)}, {drillHole.longitude.toFixed(6)}</span>
            </span>
            <span className="flex items-center gap-1">
              <Compass className="h-3 w-3" />
              Az: {drillHole.azimuth}° | Inc: {drillHole.inclination}°
            </span>
            <span className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3" />
              {actualDepth}/{drillHole.plannedDepth} m
            </span>
          </div>
          {actualDepth > 0 && (
            <div className="mt-2 space-y-0.5 max-w-xs">
              <Progress value={pct} className="h-2" />
              <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% perforado</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-xs text-muted-foreground">Intervalos</p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-blue-400">{intervals.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-xs text-muted-foreground">Prof. perforada</p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-orange-400">{actualDepth} m</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-xs text-muted-foreground">RQD prom.</p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-green-400">
              {intervals.length > 0 && intervals.some((i) => i.rqd != null)
                ? `${(intervals.reduce((s, i) => s + (i.rqd ?? 0), 0) / intervals.filter((i) => i.rqd != null).length).toFixed(0)}%`
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Intervals */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Intervalos litológicos</h2>
          <Button size="sm" onClick={() => { setEditInterval(null); setIntervalOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" />
            Agregar intervalo
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
          </div>
        ) : intervals.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            No hay intervalos registrados. Agrega el primer intervalo litológico.
          </p>
        ) : (
          <div className="space-y-1.5">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[80px_80px_1fr_80px_80px_60px_60px_60px] gap-2 px-3 py-1 text-xs text-muted-foreground font-medium border-b border-border">
              <span>Desde</span>
              <span>Hasta</span>
              <span>Litología</span>
              <span>Alteración</span>
              <span>Mineraliz.</span>
              <span>RQD</span>
              <span>Rec.</span>
              <span></span>
            </div>
            {intervals.map((interval) => (
              <div
                key={interval.id}
                className="group hidden sm:grid grid-cols-[80px_80px_1fr_80px_80px_60px_60px_60px] gap-2 px-3 py-2 items-center hover:bg-muted/30 rounded text-sm"
              >
                <span className="font-mono text-xs">{interval.fromDepth.toFixed(1)}</span>
                <span className="font-mono text-xs">{interval.toDepth.toFixed(1)}</span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-xs">{interval.rockType}</p>
                  <p className="truncate text-xs text-muted-foreground">{interval.color} · {interval.texture}</p>
                </div>
                <span className="text-xs text-muted-foreground truncate">{interval.alteration ?? '—'}</span>
                <span className="text-xs text-muted-foreground truncate">{interval.mineralization ?? '—'}</span>
                <span className="font-mono text-xs">{interval.rqd != null ? `${interval.rqd}%` : '—'}</span>
                <span className="font-mono text-xs">{interval.recovery != null ? `${interval.recovery}%` : '—'}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditInterval(interval); setIntervalOpen(true); }}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteInterval(interval)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {/* Mobile cards */}
            {intervals.map((interval) => (
              <Card key={`mobile-${interval.id}`} className="sm:hidden group">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-semibold">{interval.fromDepth.toFixed(1)}–{interval.toDepth.toFixed(1)} m</span>
                        <Badge variant="outline" className="text-xs">{interval.rockType}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[interval.color, interval.texture, interval.alteration].filter(Boolean).join(' · ')}
                      </p>
                      {(interval.rqd != null || interval.recovery != null) && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {interval.rqd != null && `RQD: ${interval.rqd}%`}
                          {interval.rqd != null && interval.recovery != null && ' | '}
                          {interval.recovery != null && `Rec: ${interval.recovery}%`}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditInterval(interval); setIntervalOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteInterval(interval)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Interval Dialog */}
      <Dialog open={intervalOpen} onOpenChange={(o) => { setIntervalOpen(o); if (!o) setEditInterval(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editInterval ? 'Editar intervalo' : 'Nuevo intervalo'}</DialogTitle>
          </DialogHeader>
          <IntervalForm
            defaultValues={editInterval ?? undefined}
            fromDepthMin={editInterval ? editInterval.fromDepth : nextDepth}
            onSubmit={handleIntervalSubmit}
            onCancel={() => setIntervalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteInterval} onOpenChange={(o) => !o && setDeleteInterval(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar intervalo?</AlertDialogTitle>
            <AlertDialogDescription>
              Intervalo {deleteInterval?.fromDepth.toFixed(1)}–{deleteInterval?.toDepth.toFixed(1)} m será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { removeInterval(deleteInterval!.id); setDeleteInterval(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
