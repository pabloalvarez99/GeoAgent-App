'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  MapPin,
  ArrowDown,
  Compass,
} from 'lucide-react';
import { useDrillHoles, useDrillIntervals } from '@/lib/hooks/use-drillholes';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { StatusBadge, getDrillStatusVariant } from '@/components/ui/status-badge';
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
import { DrillHoleForm } from '@/components/forms/drillhole-form';
import { StratigraphicColumn } from '@/components/drillhole/stratigraphic-column';
import type { DrillIntervalFormData, DrillHoleFormData } from '@geoagent/geo-shared/validation';
import type { GeoDrillInterval } from '@geoagent/geo-shared/types';
import { toast } from 'sonner';

export default function DrillHoleDetailPage({
  params,
}: {
  params: Promise<{ id: string; dhId: string }>;
}) {
  const { id: projectId, dhId } = use(params);
  const { project } = useProject(projectId);
  const { drillHoles, loading: dhLoading, editDrillHole } = useDrillHoles(projectId);
  const drillHole = drillHoles.find((d) => d.id === dhId);
  const { intervals, loading, saveInterval, removeInterval } = useDrillIntervals(dhId);

  const [drillHoleEditOpen, setDrillHoleEditOpen] = useState(false);

  const [intervalOpen, setIntervalOpen] = useState(false);
  const [editInterval, setEditInterval] = useState<GeoDrillInterval | null>(null);
  const [deleteInterval, setDeleteInterval] = useState<GeoDrillInterval | null>(null);

  if (dhLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="skeleton h-8 w-8 rounded-md shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="skeleton h-7 w-24 rounded" />
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-20 rounded-full" />
            </div>
            <div className="skeleton h-4 w-64 rounded" />
          </div>
        </div>
        <div className="skeleton h-px w-full rounded" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
      </div>
    );
  }

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

  async function handleDrillHoleEdit(data: DrillHoleFormData) {
    try {
      await editDrillHole(dhId, { ...data, projectId });
      toast.success('Sondaje actualizado');
      setDrillHoleEditOpen(false);
    } catch {
      toast.error('Error al actualizar sondaje');
    }
  }

  async function handleIntervalSubmit(data: DrillIntervalFormData) {
    try {
      await saveInterval({ ...data, drillHoleId: dhId }, editInterval?.id);
      toast.success('Intervalo guardado');
      setIntervalOpen(false);
      setEditInterval(null);
    } catch {
      toast.error('Error al guardar intervalo');
    }
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
            <StatusBadge
              variant={getDrillStatusVariant(drillHole.status)}
              label={drillHole.status}
              pulse={drillHole.status === 'En Progreso'}
              size="md"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 ml-1"
              onClick={() => setDrillHoleEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
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
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% perforado</p>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="stat-accent-blue">
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-xs text-muted-foreground">Intervalos</p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-blue-400 font-data">{intervals.length}</p>
          </CardContent>
        </Card>
        <Card className="stat-accent-amber">
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-xs text-muted-foreground">Prof. perforada</p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-orange-400 font-data">{actualDepth} m</p>
          </CardContent>
        </Card>
        <Card className="stat-accent-green">
          <CardHeader className="pb-1 pt-3 px-4">
            <p className="text-xs text-muted-foreground">RQD prom.</p>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold text-green-400 font-data">
              {intervals.length > 0 && intervals.some((i) => i.rqd != null)
                ? `${(intervals.reduce((s, i) => s + (i.rqd ?? 0), 0) / intervals.filter((i) => i.rqd != null).length).toFixed(0)}%`
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stratigraphic Column */}
      {intervals.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Columna estratigráfica</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <StratigraphicColumn intervals={intervals} totalDepth={drillHole.actualDepth ?? drillHole.plannedDepth} />
          </CardContent>
        </Card>
      )}

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
          <div className="rounded-lg border border-border overflow-hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-6 px-4 py-3 border-b border-border last:border-0">
                <div className="skeleton h-4 w-12 rounded" />
                <div className="skeleton h-4 w-12 rounded" />
                <div className="skeleton h-4 w-32 rounded" />
                <div className="skeleton h-4 w-16 rounded hidden md:block" />
                <div className="skeleton h-4 w-10 rounded" />
              </div>
            ))}
          </div>
        ) : intervals.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ArrowDown className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No hay intervalos registrados</p>
            <Button size="sm" variant="outline" onClick={() => { setEditInterval(null); setIntervalOpen(true); }}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar intervalo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop table */}
            <div className="hidden sm:block rounded-lg border border-border overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Desde (m)</th>
                    <th>Hasta (m)</th>
                    <th>Litología</th>
                    <th className="hidden md:table-cell">Alteración</th>
                    <th className="hidden lg:table-cell">Mineraliz.</th>
                    <th>RQD</th>
                    <th className="hidden md:table-cell">Rec.</th>
                    <th className="text-right w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {intervals.map((interval) => (
                    <tr key={interval.id} className="group">
                      <td className="font-mono text-xs">{interval.fromDepth.toFixed(1)}</td>
                      <td className="font-mono text-xs">{interval.toDepth.toFixed(1)}</td>
                      <td>
                        <p className="text-xs font-medium truncate max-w-[160px]">{interval.rockType}</p>
                        <p className="text-[11px] text-muted-foreground">{interval.color} · {interval.texture}</p>
                      </td>
                      <td className="hidden md:table-cell text-xs text-muted-foreground">{interval.alteration ?? '—'}</td>
                      <td className="hidden lg:table-cell text-xs text-muted-foreground">{interval.mineralization ?? '—'}</td>
                      <td className="font-mono text-xs">{interval.rqd != null ? `${interval.rqd}%` : '—'}</td>
                      <td className="hidden md:table-cell font-mono text-xs">{interval.recovery != null ? `${interval.recovery}%` : '—'}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditInterval(interval); setIntervalOpen(true); }}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => setDeleteInterval(interval)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Drill Hole Edit Dialog */}
      <Dialog open={drillHoleEditOpen} onOpenChange={setDrillHoleEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar sondaje {drillHole.holeId}</DialogTitle>
          </DialogHeader>
          <DrillHoleForm
            defaultValues={drillHole}
            onSubmit={handleDrillHoleEdit}
            onCancel={() => setDrillHoleEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

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
              onClick={async () => { try { await removeInterval(deleteInterval!.id); toast.success('Intervalo eliminado'); } catch { toast.error('Error al eliminar intervalo'); } setDeleteInterval(null); }}
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
