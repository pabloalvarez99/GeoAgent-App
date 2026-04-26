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
  Upload,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
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
  { href: 'stations',  label: 'Estaciones', icon: Layers,   desc: 'Puntos de muestreo'     },
  { href: 'drillholes',label: 'Sondajes',   icon: Drill,    desc: 'Perforaciones y logs'   },
  { href: 'map',       label: 'Mapa',       icon: Map,      desc: 'Vista georreferenciada' },
  { href: 'photos',    label: 'Fotos',      icon: Camera,   desc: 'Galería del proyecto'   },
  { href: 'export',    label: 'Exportar',   icon: Download, desc: 'PDF, Excel, GeoJSON'    },
  { href: 'import',    label: 'Importar',   icon: Upload,   desc: 'CSV y Excel masivo'     },
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
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="skeleton h-8 w-8 rounded-md shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-7 w-56 rounded" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
        <div className="skeleton h-10 w-full rounded-lg" />
        <div className="skeleton h-48 rounded-lg" />
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

      {/* Description */}
      {project.description && (
        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">
          {project.description}
        </p>
      )}

      {/* Stats */}
      {(() => {
        const totalDrilled = drillHoles.reduce((sum, d) => sum + (d.actualDepth ?? 0), 0);
        const maxDepth = drillHoles.length > 0
          ? Math.max(...drillHoles.map((d) => d.actualDepth ?? d.plannedDepth))
          : null;
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Estaciones', value: stations.length, color: 'text-blue-400', accent: 'stat-accent-blue' },
              { label: 'Sondajes', value: drillHoles.length, color: 'text-purple-400', accent: 'stat-accent-purple' },
              {
                label: 'Prof. máxima',
                value: maxDepth != null ? `${maxDepth} m` : '—',
                color: 'text-orange-400',
                accent: 'stat-accent-amber',
              },
              {
                label: 'Total perforado',
                value: totalDrilled > 0 ? `${totalDrilled} m` : '—',
                color: 'text-green-400',
                accent: 'stat-accent-green',
              },
            ].map(({ label, value, color, accent }) => (
              <Card key={label} className={accent}>
                <CardHeader className="pb-1 pt-4 px-4">
                  <p className="text-xs text-muted-foreground">{label}</p>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className={`text-2xl font-semibold font-data ${color}`}>{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })()}

      {/* Analytics — shown only when there is data */}
      {(drillHoles.length > 0 || stations.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Drill hole depth progress */}
          {drillHoles.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Profundidad planificada vs real (m)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={drillHoles.map((d) => ({
                      name: d.holeId,
                      Planificada: d.plannedDepth,
                      Real: d.actualDepth ?? 0,
                    }))}
                    margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#0d0d11', border: '1px solid #27272a', fontSize: 12, borderRadius: 6 }}
                    />
                    <Bar dataKey="Planificada" fill="#6366f1" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Real" fill="#22c55e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Drill hole status distribution */}
          {drillHoles.length > 0 && (() => {
            const statusMap: Record<string, number> = {};
            drillHoles.forEach((d) => {
              statusMap[d.status] = (statusMap[d.status] ?? 0) + 1;
            });
            const pieData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
            const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#64748b'];
            return (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Estado de sondajes
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: '#0d0d11', border: '1px solid #27272a', fontSize: 12, borderRadius: 6 }}
                      />
                      <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Sub navigation — icon grid cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {subNavItems.map(({ href, label, icon: Icon, desc }) => {
          const count = href === 'stations' ? stations.length : href === 'drillholes' ? drillHoles.length : null;
          return (
            <Link key={href} href={`/projects/${id}/${href}`}>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 hover:border-primary/30 hover:bg-primary/5 transition-all duration-150 card-lift group">
                <div className="rounded-md bg-muted p-1.5 shrink-0 group-hover:bg-primary/10 transition-colors">
                  <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium leading-none">{label}</p>
                    {count !== null && count > 0 && (
                      <span className="text-[10px] font-mono bg-muted rounded px-1 py-0.5 text-muted-foreground">{count}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
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
