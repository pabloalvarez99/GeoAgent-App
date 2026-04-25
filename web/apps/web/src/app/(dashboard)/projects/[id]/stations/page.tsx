'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Search,
  Layers,
  Pencil,
  Trash2,
  MapPin,
  Calendar,
  User,
  ArrowUpDown,
} from 'lucide-react';
import { useStations } from '@/lib/hooks/use-stations';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

type SortKey = 'code' | 'date_desc' | 'date_asc' | 'geologist';

export default function StationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { project } = useProject(projectId);
  const { stations, loading, addStation, editStation, removeStation } = useStations(projectId);

  const search = searchParams.get('q') ?? '';
  const sort = (searchParams.get('sort') as SortKey) ?? 'code';

  const [editTarget, setEditTarget] = useState<GeoStation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GeoStation | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  function updateParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.replace(`?${p.toString()}`, { scroll: false });
  }

  const filtered = stations
    .filter(
      (s) =>
        !search ||
        s.code.toLowerCase().includes(search.toLowerCase()) ||
        s.geologist.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sort === 'date_desc') return b.date.localeCompare(a.date);
      if (sort === 'date_asc') return a.date.localeCompare(b.date);
      if (sort === 'geologist') return a.geologist.localeCompare(b.geologist);
      return a.code.localeCompare(b.code);
    });

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

      {/* Search + Sort */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, geólogo o descripción..."
            value={search}
            onChange={(e) => updateParam('q', e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sort} onValueChange={(v) => updateParam('sort', v === 'code' ? '' : v)}>
          <SelectTrigger className="w-44 shrink-0">
            <ArrowUpDown className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="code">Código A→Z</SelectItem>
            <SelectItem value="date_desc">Fecha: más reciente</SelectItem>
            <SelectItem value="date_asc">Fecha: más antigua</SelectItem>
            <SelectItem value="geologist">Geólogo A→Z</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="bg-muted/20 border-b border-border px-4 py-2.5 flex gap-8">
            {['Código', 'Descripción', 'Geólogo', 'Fecha'].map((h) => (
              <span key={h} className="text-xs font-medium text-muted-foreground">{h}</span>
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-3.5 border-b border-border last:border-0">
              <div className="skeleton h-5 w-16 rounded" />
              <div className="skeleton h-4 w-40 rounded hidden sm:block" />
              <div className="skeleton h-4 w-24 rounded hidden md:block" />
              <div className="skeleton h-4 w-20 rounded hidden lg:block" />
            </div>
          ))}
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
        <div className="space-y-3">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th className="hidden sm:table-cell">Descripción</th>
                  <th className="hidden md:table-cell">Geólogo</th>
                  <th className="hidden lg:table-cell">Fecha</th>
                  <th className="hidden xl:table-cell">Coordenadas</th>
                  <th className="text-right w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((station) => (
                  <tr
                    key={station.id}
                    className="group"
                    onClick={() => router.push(`/projects/${projectId}/stations/${station.id}`)}
                  >
                    <td>
                      <Badge variant="outline" className="font-mono text-xs">
                        {station.code}
                      </Badge>
                    </td>
                    <td className="hidden sm:table-cell text-muted-foreground max-w-[200px]">
                      <span className="block truncate">{station.description || '—'}</span>
                    </td>
                    <td className="hidden md:table-cell text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <User className="h-3 w-3 shrink-0" />
                        {station.geologist}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {station.date}
                      </span>
                    </td>
                    <td className="hidden xl:table-cell font-mono text-xs text-muted-foreground">
                      {station.latitude.toFixed(5)}, {station.longitude.toFixed(5)}
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground text-right">
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
