'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  MapPin,
  Layers,
  Drill,
  Map,
  Camera,
  Download,
  Loader2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useProject, useProjects } from '@/lib/hooks/use-projects';
import { useStations } from '@/lib/hooks/use-stations';
import { useDrillHoles } from '@/lib/hooks/use-drillholes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ProjectForm } from '@/components/forms/project-form';
import type { ProjectFormData } from '@geoagent/geo-shared/validation';
import { useState } from 'react';
import { toast } from 'sonner';

const subNavItems = [
  { href: 'stations', label: 'Estaciones', icon: Layers },
  { href: 'drillholes', label: 'Sondajes', icon: Drill },
  { href: 'map', label: 'Mapa', icon: Map },
  { href: 'photos', label: 'Fotos', icon: Camera },
  { href: 'export', label: 'Exportar', icon: Download },
];

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { project, loading } = useProject(id);
  const { editProject, removeProject } = useProjects();
  const { stations } = useStations(id);
  const { drillHoles } = useDrillHoles(id);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Cargando...</span>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">Proyecto no encontrado</p>
        <Button variant="outline" asChild>
          <Link href="/projects">← Volver a proyectos</Link>
        </Button>
      </div>
    );
  }

  async function handleEdit(data: ProjectFormData) {
    try {
      await editProject(id, data);
      toast.success('Proyecto actualizado');
      setEditOpen(false);
    } catch {
      toast.error('Error al actualizar proyecto');
    }
  }

  async function handleDelete() {
    try {
      await removeProject(id);
      toast.success('Proyecto eliminado');
      router.replace('/projects');
    } catch {
      toast.error('Error al eliminar proyecto');
    }
  }

  return (
    <div className="space-y-6">
      {/* Back + title */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
            <Link href="/projects">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{project.location}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4 mr-1.5" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Estaciones', value: stations.length, color: 'text-blue-400' },
          { label: 'Sondajes', value: drillHoles.length, color: 'text-purple-400' },
          {
            label: 'Prof. máx.',
            value:
              drillHoles.length > 0
                ? `${Math.max(...drillHoles.map((d) => d.actualDepth ?? d.plannedDepth))} m`
                : '—',
            color: 'text-orange-400',
          },
          { label: 'Descripción', value: project.description, color: 'text-muted-foreground', small: true },
        ].map(({ label, value, color, small }) => (
          <Card key={label}>
            <CardHeader className="pb-1 pt-4 px-4">
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`font-semibold ${color} ${small ? 'text-xs line-clamp-2' : 'text-2xl'}`}>
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub navigation */}
      <div className="flex flex-wrap gap-2">
        {subNavItems.map(({ href, label, icon: Icon }) => (
          <Button key={href} variant="outline" asChild>
            <Link href={`/projects/${id}/${href}`}>
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Link>
          </Button>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar proyecto</DialogTitle>
          </DialogHeader>
          <ProjectForm
            defaultValues={project}
            onSubmit={handleEdit}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente <strong>&quot;{project.name}&quot;</strong> y todos sus
              datos (estaciones, sondajes, fotos). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar proyecto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
