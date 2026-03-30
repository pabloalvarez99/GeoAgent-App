'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  FolderOpen,
  Layers,
  Drill,
  ArrowRight,
  Plus,
  MapPin,
  Mountain,
  Loader2,
  Download,
  Smartphone,
} from 'lucide-react';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAuth } from '@/lib/firebase/auth';
import { subscribeToAllStations, subscribeToAllDrillHoles } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor = 'text-primary',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-muted p-1.5">
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, loading } = useProjects();
  const [stationCount, setStationCount] = useState<number | null>(null);
  const [drillHoleCount, setDrillHoleCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubStations = subscribeToAllStations(user.uid, (items) => setStationCount(items.length));
    const unsubDrillHoles = subscribeToAllDrillHoles(user.uid, (items) => setDrillHoleCount(items.length));
    return () => { unsubStations(); unsubDrillHoles(); };
  }, [user]);

  const displayName =
    user?.displayName || user?.email?.split('@')[0] || 'Geólogo';

  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", {
    locale: es,
  });

  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight capitalize">
          Bienvenido, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={FolderOpen}
          label="Total proyectos"
          value={loading ? '—' : projects.length}
          sub={loading ? 'Cargando...' : undefined}
          iconColor="text-primary"
        />
        <StatCard
          icon={Layers}
          label="Estaciones"
          value={stationCount ?? '—'}
          sub={stationCount === null ? 'Cargando...' : undefined}
          iconColor="text-blue-400"
        />
        <StatCard
          icon={Drill}
          label="Sondajes"
          value={drillHoleCount ?? '—'}
          sub={drillHoleCount === null ? 'Cargando...' : undefined}
          iconColor="text-purple-400"
        />
      </div>

      {/* Recent projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Proyectos recientes</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects" className="flex items-center gap-1 text-sm">
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando proyectos...</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && projects.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="rounded-full bg-muted p-5">
                <Mountain className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Sin proyectos todavía</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crea tu primer proyecto de geología de campo
                </p>
              </div>
              <Button asChild>
                <Link href="/projects">
                  <Plus className="h-4 w-4 mr-2" />
                  Crea tu primer proyecto
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Project cards */}
        {!loading && recentProjects.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:border-primary/50 transition-colors h-full">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 shrink-0">
                        <FolderOpen className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold truncate">
                          {project.name}
                        </CardTitle>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{project.location}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {project.description || 'Sin descripción'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {/* Show more hint when there are more than 3 projects */}
        {!loading && projects.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{projects.length - 3} proyecto{projects.length - 3 !== 1 ? 's' : ''} más —{' '}
            <Link href="/projects" className="text-primary hover:underline">
              Ver todos
            </Link>
          </p>
        )}
      </div>

      {/* Android App Download */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center justify-between gap-4 py-4 px-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/15 p-2.5 shrink-0">
              <Smartphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">GeoAgent para Android</p>
              <p className="text-xs text-muted-foreground">
                Recoge datos en campo con GPS, cámara y modo sin conexión
              </p>
            </div>
          </div>
          <Button size="sm" asChild className="shrink-0">
            <a href="https://github.com/pabloalvarez99/GeoAgent-App/releases/latest/download/app-debug.apk" download="GeoAgent.apk">
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Descargar APK
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
