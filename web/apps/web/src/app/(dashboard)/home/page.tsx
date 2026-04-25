'use client';

import { useEffect, useState, useMemo } from 'react';
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
  Monitor,
  FlaskConical,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useProjects } from '@/lib/hooks/use-projects';
import { useAuth } from '@/lib/firebase/auth';
import {
  subscribeToAllStations,
  subscribeToAllDrillHoles,
  subscribeToAllLithologies,
  subscribeToAllSamples,
  subscribeToAllStructuralData,
} from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ── Colores para gráficos ────────────────────────────────────────────────────
const CHART_COLORS = [
  '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#8b5cf6',
];

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor = 'text-primary',
  accent = 'green',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor?: string;
  accent?: 'green' | 'blue' | 'purple' | 'amber';
}) {
  return (
    <Card className={cn('overflow-hidden', `stat-accent-${accent}`)}>
      <CardContent className="px-4 pt-4 pb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <Icon className={cn('h-3.5 w-3.5 shrink-0 opacity-40', iconColor)} />
        </div>
        <p className="text-3xl font-bold tracking-tight font-data leading-none">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Custom tooltip para PieChart ─────────────────────────────────────────────
function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} registro{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

// ── Custom tooltip para BarChart ─────────────────────────────────────────────
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md max-w-[200px]">
      <p className="font-medium truncate">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { projects, loading } = useProjects();
  const [stations, setStations] = useState<any[]>([]);
  const [drillHoles, setDrillHoles] = useState<any[]>([]);
  const [lithologies, setLithologies] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [structuralData, setStructuralData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let resolved = 0;
    const check = () => { resolved++; if (resolved >= 5) setDataLoading(false); };

    const u1 = subscribeToAllStations(user.uid, (d) => { setStations(d); check(); });
    const u2 = subscribeToAllDrillHoles(user.uid, (d) => { setDrillHoles(d); check(); });
    const u3 = subscribeToAllLithologies(user.uid, (d) => { setLithologies(d); check(); });
    const u4 = subscribeToAllSamples(user.uid, (d) => { setSamples(d); check(); });
    const u5 = subscribeToAllStructuralData(user.uid, (d) => { setStructuralData(d); check(); });
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [user]);

  const displayName =
    user?.displayName || user?.email?.split('@')[0] || 'Geólogo';

  const today = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

  const recentProjects = projects.slice(0, 3);

  // ── Gráfico 1: distribución de tipos de roca (lithologies) ──────────────
  const rockTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    lithologies.forEach((l) => {
      const key = l.rockType || 'Sin tipo';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [lithologies]);

  // ── Gráfico 2: actividad por proyecto (estaciones + sondajes) ───────────
  const projectActivityData = useMemo(() => {
    return projects.slice(0, 8).map((p) => ({
      name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
      Estaciones: stations.filter((s) => s.projectId === p.id).length,
      Sondajes: drillHoles.filter((d) => d.projectId === p.id).length,
    }));
  }, [projects, stations, drillHoles]);

  // ── Gráfico 3: progreso de sondajes (plannedDepth vs actualDepth) ────────
  const drillProgressData = useMemo(() => {
    return drillHoles
      .filter((d) => d.plannedDepth > 0)
      .slice(0, 8)
      .map((d) => ({
        name: d.holeId?.length > 10 ? d.holeId.slice(0, 10) + '…' : (d.holeId || 'S/N'),
        Planificado: Number(d.plannedDepth) || 0,
        Real: Number(d.actualDepth) || 0,
      }));
  }, [drillHoles]);

  // ── Gráfico 4: tipos estructurales por dirección de buzamiento ──────────────
  const structuralTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    structuralData.forEach((s) => {
      const key = s.type || 'Sin tipo';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [structuralData]);

  // ── Gráfico 5: buzamiento (dip) por dirección compass ───────────────────────
  const dipDirectionData = useMemo(() => {
    const SECTORS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const counts: Record<string, number> = {};
    SECTORS.forEach((s) => { counts[s] = 0; });
    structuralData.forEach((s) => {
      const dir = s.dipDirection as string | undefined;
      if (dir && counts[dir] !== undefined) counts[dir]++;
    });
    return SECTORS.map((name) => ({ name, value: counts[name] }));
  }, [structuralData]);

  const hasAnalyticsData = lithologies.length > 0 || drillHoles.length > 0 || stations.length > 0 || structuralData.length > 0;

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}
          label="Proyectos"
          value={loading ? '—' : projects.length}
          accent="green"
          iconColor="text-primary"
        />
        <StatCard
          icon={Layers}
          label="Estaciones"
          value={dataLoading ? '—' : stations.length}
          accent="blue"
          iconColor="text-blue-400"
        />
        <StatCard
          icon={Drill}
          label="Sondajes"
          value={dataLoading ? '—' : drillHoles.length}
          accent="purple"
          iconColor="text-purple-400"
        />
        <StatCard
          icon={FlaskConical}
          label="Muestras"
          value={dataLoading ? '—' : samples.length}
          accent="amber"
          iconColor="text-amber-400"
        />
      </div>

      {/* Analytics section */}
      {!dataLoading && hasAnalyticsData && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Analytics</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Distribución de tipos de roca */}
            {rockTypeData.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tipos de roca (litologías)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={rockTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {rockTypeData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span className="text-xs text-muted-foreground">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actividad por proyecto */}
            {projectActivityData.some((p) => p.Estaciones > 0 || p.Sondajes > 0) && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Actividad por proyecto
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectActivityData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="Estaciones" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Sondajes" fill="#a855f7" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Progreso de sondajes */}
            {drillProgressData.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Profundidad sondajes — planificada vs. real (m)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={drillProgressData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="Planificado" fill="hsl(var(--muted-foreground))" opacity={0.4} radius={[2, 2, 0, 0]} />
                        <Bar dataKey="Real" fill="#22c55e" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tipos estructurales */}
            {structuralTypeData.length > 0 && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tipos estructurales
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={structuralTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {structuralTypeData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[(i + 4) % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span className="text-xs text-muted-foreground">{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dirección de buzamiento */}
            {dipDirectionData.some((d) => d.value > 0) && (
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Dirección de buzamiento (frecuencia)
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dipDirectionData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="value" name="Registros" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

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

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando proyectos...</span>
          </div>
        )}

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
                        <p className="text-sm font-semibold truncate">{project.name}</p>
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

        {!loading && projects.length > 3 && (
          <p className="text-xs text-muted-foreground text-center">
            +{projects.length - 3} proyecto{projects.length - 3 !== 1 ? 's' : ''} más —{' '}
            <Link href="/projects" className="text-primary hover:underline">
              Ver todos
            </Link>
          </p>
        )}
      </div>

      {/* Downloads section */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-center justify-between gap-4 py-4 px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/15 p-2.5 shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">GeoAgent Android</p>
                <p className="text-xs text-muted-foreground">GPS, cámara, modo sin conexión</p>
                <a
                  href="https://github.com/pabloalvarez99/GeoAgent-App/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary/60 hover:text-primary transition-colors"
                >
                  Ver todas las versiones →
                </a>
              </div>
            </div>
            <Button size="sm" asChild className="shrink-0">
              <a
                href="https://github.com/pabloalvarez99/GeoAgent-App/releases/latest/download/app-debug.apk"
                download="GeoAgent.apk"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                APK
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="flex items-center justify-between gap-4 py-4 px-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/15 p-2.5 shrink-0">
                <Monitor className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">GeoAgent Windows</p>
                <p className="text-xs text-muted-foreground">App de escritorio con menú nativo</p>
                <a
                  href="https://github.com/pabloalvarez99/GeoAgent-App/releases/latest"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-400/60 hover:text-blue-400 transition-colors"
                >
                  Ver todas las versiones →
                </a>
              </div>
            </div>
            <Button size="sm" variant="outline" asChild className="shrink-0 border-blue-500/30">
              <a
                href="https://github.com/pabloalvarez99/GeoAgent-App/releases/latest/download/GeoAgent-Setup.exe"
                download="GeoAgent-Setup.exe"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                .exe
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
