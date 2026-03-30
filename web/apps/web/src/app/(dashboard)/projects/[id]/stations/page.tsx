'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  Layers,
  Loader2,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  User,
} from 'lucide-react';
import { useStations } from '@/lib/hooks/use-stations';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { StationForm } from '@/components/forms/station-form';
import type { StationFormData } from '@geoagent/geo-shared/validation';
import type { GeoStation } from '@geoagent/geo-shared/types';
import { toast } from 'sonner';

export default function StationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { project } = useProject(projectId);
  const { stations, loading, addStation, editStation, removeStation } = useStations(projectId);

  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<GeoStation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GeoStation | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const filtered = stations.filter(
    (s) =>
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.geologist.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleEdit(data: StationFormData) {
    if (!editTarget) return;
    try {
      await editStation(editTarget.id, data);
      toast.success('Estación actualizada');
      setEditOpen(false);
      setEditTarget(null);
    } catch {
      toast.error('Error al actualizar estación');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await removeStation(deleteTarget.id);
      toast.success('Estación eliminada');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar estación');
    }
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
            <h1 className="text-xl font-bold">Estaciones</h1>
            {project && (
              <p className="text-sm text-muted-foreground">{project.name}</p>
            )}
          </div>
        </div>
        <Button asChild>
          <Link href={`/projects/${projectId}/stations/new`}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva estación
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por código, geólogo o descripción..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Cargando estaciones...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Layers className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            {search ? 'Sin resultados para la búsqueda' : 'No hay estaciones registradas'}
          </p>
          {!search && (
            <Button asChild size="sm">
              <Link href={`/projects/${projectId}/stations/new`}>
                <Plus className="h-4 w-4 mr-1.5" />
                Crear primera estación
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((station) => (
            <Card
              key={station.id}
              className="group hover:border-primary/40 transition-colors cursor-pointer"
              onClick={() => router.push(`/projects/${projectId}/stations/${station.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-xs shrink-0">
                        {station.code}
                      </Badge>
                      <span className="text-sm text-muted-foreground truncate">
                        {station.description}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {station.geologist}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {station.date}
                      </span>
                      <span className="flex items-center gap-1 font-mono">
                        <MapPin className="h-3 w-3" />
                        {station.latitude.toFixed(5)}, {station.longitude.toFixed(5)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => { setEditTarget(station); setEditOpen(true); }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(station)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          <p className="text-xs text-muted-foreground text-right pt-1">
            {filtered.length} estación{filtered.length !== 1 ? 'es' : ''}
          </p>
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar estación {editTarget?.code}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <StationForm
              defaultValues={editTarget}
              onSubmit={handleEdit}
              onCancel={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar estación?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la estación{' '}
              <strong>&quot;{deleteTarget?.code}&quot;</strong> y todos sus datos asociados.
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
