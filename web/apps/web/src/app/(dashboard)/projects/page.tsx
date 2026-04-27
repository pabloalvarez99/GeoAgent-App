'use client';

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import {
  Plus,
  FolderOpen,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  LayoutGrid,
  LayoutList,
} from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import { useStations } from '@/lib/hooks/use-stations';
import { useDrillHoles } from '@/lib/hooks/use-drillholes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectForm } from '@/components/forms/project-form';
import { cn } from '@/lib/utils';
import type { GeoProject } from '@geoagent/geo-shared/types';
import type { ProjectFormData } from '@geoagent/geo-shared/validation';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

// Deterministic accent color based on project name hash
const PROJECT_ACCENTS = [
  { bg: 'bg-emerald-500/15', text: 'text-emerald-400', ring: 'ring-emerald-500/25' },
  { bg: 'bg-blue-500/15',    text: 'text-blue-400',    ring: 'ring-blue-500/25'    },
  { bg: 'bg-violet-500/15',  text: 'text-violet-400',  ring: 'ring-violet-500/25'  },
  { bg: 'bg-amber-500/15',   text: 'text-amber-400',   ring: 'ring-amber-500/25'   },
  { bg: 'bg-rose-500/15',    text: 'text-rose-400',    ring: 'ring-rose-500/25'    },
  { bg: 'bg-cyan-500/15',    text: 'text-cyan-400',    ring: 'ring-cyan-500/25'    },
  { bg: 'bg-orange-500/15',  text: 'text-orange-400',  ring: 'ring-orange-500/25'  },
  { bg: 'bg-pink-500/15',    text: 'text-pink-400',    ring: 'ring-pink-500/25'    },
];

function getProjectAccent(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PROJECT_ACCENTS[Math.abs(hash) % PROJECT_ACCENTS.length];
}

// Mini counter hook that doesn't require parent to pass down IDs
function ProjectStats({ projectId }: { projectId: string }) {
  const { stations } = useStations(projectId);
  const { drillHoles } = useDrillHoles(projectId);
  return (
    <div className="flex gap-3 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
        <span className="font-mono font-medium text-foreground">{stations.length}</span>
        <span>est.</span>
      </span>
      <span className="flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shrink-0" />
        <span className="font-mono font-medium text-foreground">{drillHoles.length}</span>
        <span>sond.</span>
      </span>
    </div>
  );
}

export default function ProjectsPage() {
  const { projects, loading, addProject, editProject, removeProject } = useProjects();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GeoProject | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GeoProject | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'name_desc'>('date_desc');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filteredProjects = useMemo(() => {
    const q = search.toLowerCase().trim();
    let result = q
      ? projects.filter((p) => p.name.toLowerCase().includes(q) || p.location?.toLowerCase().includes(q))
      : [...projects];
    result.sort((a, b) => {
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      if (sort === 'name_desc') return b.name.localeCompare(a.name);
      const ta = (a.updatedAt as any)?.toDate?.()?.getTime?.() ?? 0;
      const tb = (b.updatedAt as any)?.toDate?.()?.getTime?.() ?? 0;
      return sort === 'date_asc' ? ta - tb : tb - ta;
    });
    return result;
  }, [projects, search, sort]);

  async function handleCreate(data: ProjectFormData) {
    try {
      await addProject(data);
      toast.success('Proyecto creado');
      setCreateOpen(false);
    } catch {
      toast.error('Error al crear proyecto');
    }
  }

  async function handleEdit(data: ProjectFormData) {
    if (!editTarget) return;
    try {
      await editProject(editTarget.id, data);
      toast.success('Proyecto actualizado');
      setEditTarget(null);
    } catch {
      toast.error('Error al actualizar proyecto');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await removeProject(deleteTarget.id);
      toast.success('Proyecto eliminado');
      setDeleteTarget(null);
    } catch {
      toast.error('Error al eliminar proyecto');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? '...' : `${projects.length} proyecto${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo proyecto
        </Button>
      </div>

      {/* Search + Sort bar */}
      {!loading && projects.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar proyectos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="h-8 w-[160px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date_desc">Más recientes</SelectItem>
              <SelectItem value="date_asc">Más antiguos</SelectItem>
              <SelectItem value="name_asc">Nombre A→Z</SelectItem>
              <SelectItem value="name_desc">Nombre Z→A</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-md border border-border h-8 overflow-hidden shrink-0">
            <button
              onClick={() => setView('grid')}
              className={`flex items-center justify-center h-full px-2.5 transition-colors ${view === 'grid' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Vista cuadrícula"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center justify-center h-full px-2.5 transition-colors ${view === 'list' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              title="Vista lista"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton h-36 rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
            <svg width={44} height={44} viewBox="0 0 512 512" fill="none" aria-hidden>
              <polygon points="256,88 420,348 92,348" stroke="#22c55e" strokeWidth="52" strokeLinejoin="round" fill="rgba(34,197,94,0.07)" />
              <circle cx="256" cy="88" r="36" fill="#22c55e" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-lg">Sin proyectos todavía</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Crea tu primer proyecto para comenzar a registrar datos de geología de campo
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Crear primer proyecto
          </Button>
        </div>
      )}

      {/* Project grid / list */}
      {!loading && projects.length > 0 && (
        <>
          {filteredProjects.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin resultados para &quot;{search}&quot;</p>
              <button onClick={() => setSearch('')} className="text-xs text-primary hover:underline">
                Limpiar búsqueda
              </button>
            </div>
          )}

          {view === 'grid' && filteredProjects.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProjects.map((project) => {
                const accent = getProjectAccent(project.name);
                const initials = project.name.slice(0, 2).toUpperCase();
                return (
                  <Card
                    key={project.id}
                    className="group relative hover:border-border card-lift transition-all"
                  >
                    <div className="absolute top-3 right-3 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditTarget(project)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(project)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <Link href={`/projects/${project.id}`}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'flex h-9 w-9 rounded-lg items-center justify-center shrink-0 ring-1 text-sm font-bold select-none',
                            accent.bg, accent.text, accent.ring,
                          )}>
                            {initials}
                          </div>
                          <div className="min-w-0 pr-6">
                            <CardTitle className="text-base truncate">{project.name}</CardTitle>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="truncate">{project.location}</span>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="line-clamp-2 text-xs mb-3">
                          {project.description}
                        </CardDescription>
                        <div className="flex items-center justify-between mt-2">
                          <ProjectStats projectId={project.id} />
                          {project.updatedAt && (
                            <span className="text-[10px] text-muted-foreground/60 shrink-0 ml-2">
                              {formatDistanceToNow((project.updatedAt as any).toDate?.() ?? project.updatedAt, { addSuffix: true, locale: es })}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                );
              })}
            </div>
          )}

          {view === 'list' && filteredProjects.length > 0 && (
            <div className="rounded-lg border border-border overflow-hidden">
              {filteredProjects.map((project, idx) => {
                const accent = getProjectAccent(project.name);
                const initials = project.name.slice(0, 2).toUpperCase();
                return (
                  <div
                    key={project.id}
                    className={`group flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors ${idx < filteredProjects.length - 1 ? 'border-b border-border' : ''}`}
                  >
                    <Link href={`/projects/${project.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        'flex h-8 w-8 rounded-md items-center justify-center shrink-0 ring-1 text-xs font-bold select-none',
                        accent.bg, accent.text, accent.ring,
                      )}>
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{project.location}</span>
                        </div>
                      </div>
                      <div className="hidden sm:block shrink-0">
                        <ProjectStats projectId={project.id} />
                      </div>
                      {project.updatedAt && (
                        <span className="hidden md:block text-[10px] text-muted-foreground/60 shrink-0 w-24 text-right">
                          {formatDistanceToNow((project.updatedAt as any).toDate?.() ?? project.updatedAt, { addSuffix: true, locale: es })}
                        </span>
                      )}
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditTarget(project)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(project)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo proyecto</DialogTitle>
            <DialogDescription>
              Los datos se sincronizan automáticamente con la app Android
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={() => setCreateOpen(false)}
            submitLabel="Crear proyecto"
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ProjectForm
              defaultValues={editTarget}
              onSubmit={handleEdit}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>&quot;{deleteTarget?.name}&quot;</strong>. Esta acción no se puede
              deshacer. Los datos en la app Android permanecerán hasta la próxima sincronización.
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
