'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  Drill,
  Loader2,
  Pencil,
  Trash2,
  MapPin,
  ArrowDown,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
} from 'lucide-react';
import { useDrillHoles } from '@/lib/hooks/use-drillholes';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { DrillHoleForm } from '@/components/forms/drillhole-form';
import type { DrillHoleFormData } from '@geoagent/geo-shared/validation';
import type { GeoDrillHole } from '@geoagent/geo-shared/types';

const statusIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Completado': CheckCircle2,
  'En Progreso': Clock,
  'Abandonado': XCircle,
  'Suspendido': PauseCircle,
};

const statusColors: Record<string, string> = {
  'Completado': 'text-green-400',
  'En Progreso': 'text-blue-400',
  'Abandonado': 'text-red-400',
  'Suspendido': 'text-yellow-400',
};

export default function DrillHolesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { project } = useProject(projectId);
  const { drillHoles, loading, editDrillHole, removeDrillHole } = useDrillHoles(projectId);

  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<GeoDrillHole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GeoDrillHole | null>(null);

  const filtered = drillHoles.filter(
    (d) =>
      d.holeId.toLowerCase().includes(search.toLowerCase()) ||
      d.geologist.toLowerCase().includes(search.toLowerCase()) ||
      d.type.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleEdit(data: DrillHoleFormData) {
    if (!editTarget) return;
    await editDrillHole(editTarget.id, data);
    setEditTarget(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await removeDrillHole(deleteTarget.id);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Sondajes</h1>
            {project && <p className="text-sm text-muted-foreground">{project.name}</p>}
          </div>
        </div>
        <Button asChild>
          <Link href={`/projects/${projectId}/drillholes/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo sondaje
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por ID, geólogo o tipo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando sondajes...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Drill className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {search ? 'Sin resultados para la búsqueda' : 'No hay sondajes registrados'}
          </p>
          {!search && (
            <Button asChild size="sm">
              <Link href={`/projects/${projectId}/drillholes/new`}>
                <Plus className="h-4 w-4 mr-1.5" />
                Crear primer sondaje
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((dh) => {
            const actualDepth = dh.actualDepth ?? 0;
            const pct = dh.plannedDepth > 0 ? Math.min(100, (actualDepth / dh.plannedDepth) * 100) : 0;
            const StatusIcon = statusIcons[dh.status] ?? Clock;
            const statusColor = statusColors[dh.status] ?? 'text-muted-foreground';

            return (
              <Card
                key={dh.id}
                className="group hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => router.push(`/projects/${projectId}/drillholes/${dh.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-sm shrink-0">
                          {dh.holeId}
                        </Badge>
                        <Badge variant="secondary">{dh.type}</Badge>
                        <span className={`flex items-center gap-1 text-xs ${statusColor}`}>
                          <StatusIcon className="h-3 w-3" />
                          {dh.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <ArrowDown className="h-3 w-3" />
                          {dh.actualDepth ?? 0}/{dh.plannedDepth} m
                        </span>
                        <span className="flex items-center gap-1 font-mono">
                          <MapPin className="h-3 w-3" />
                          {dh.latitude.toFixed(5)}, {dh.longitude.toFixed(5)}
                        </span>
                        <span>Az: {dh.azimuth}° / Inc: {dh.inclination}°</span>
                      </div>
                      {dh.actualDepth != null && dh.actualDepth > 0 && (
                        <div className="space-y-0.5">
                          <Progress value={pct} className="h-1.5" />
                          <p className="text-xs text-muted-foreground">{pct.toFixed(0)}% perforado</p>
                        </div>
                      )}
                    </div>
                    <div
                      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setEditTarget(dh)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(dh)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <p className="text-xs text-muted-foreground text-right pt-1">
            {filtered.length} sondaje{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar sondaje {editTarget?.holeId}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <DrillHoleForm
              defaultValues={editTarget}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sondaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente <strong>&quot;{deleteTarget?.holeId}&quot;</strong> y todos sus intervalos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
