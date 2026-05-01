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
  Download,
  Monitor,
  FlaskConical,
  BarChart3,
  Box,
  TrendingUp,
  TrendingDown,
  type LucideIcon,
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

// ── Colores para avatares de proyecto ────────────────────────────────────────
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
  accentClass,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  iconColor?: string;
  accentClass?: string;
}) {
  return (
    <Card className={cn(accentClass)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-muted p-1.5">
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-2xl font-bold tracking-tight font-data">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const recentProjects = projects.slice(0, 3);

  const projectsWith3D = useMemo(() => {
    const counts = new Map<string, number>();
    drillHoles.forEach((d) => counts.set(d.projectId, (counts.get(d.projectId) ?? 0) + 1));
    return projects
      .filter((p) => (counts.get(p.id) ?? 0) > 0)
      .map((p) => ({ ...p, drillCount: counts.get(p.id) ?? 0 }))
      .sort((a, b) => b.drillCount - a.drillCount)
      .slice(0, 6);
  }, [projects, drillHoles]);

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

  // ── Actividad reciente: últimas 8 entradas (estaciones + sondajes) ──────────
  const recentActivity = useMemo(() => {
    const toSeconds = (v: any): number => {
      if (!v) return 0;
      if (typeof v === 'object' && 'seconds' in v) return v.seconds;
      if (typeof v === 'string') return new Date(v).getTime() / 1000;
      return 0;
    };
    const items = [
      ...stations.map((s) => ({ type: 'station' as const, id: s.id, label: s.code, projectId: s.projectId, ts: toSeconds(s.updatedAt) })),
      ...drillHoles.map((d) => ({ type: 'drillhole' as const, id: d.id, label: d.holeId, projectId: d.projectId, ts: toSeconds(d.updatedAt) })),
    ];
    return items.sort((a, b) => b.ts - a.ts).slice(0, 8);
  }, [stations, drillHoles]);

  const activeDrillHoles = useMemo(() => {
    return drillHoles
      .filter((d) => d.status === 'En Progreso')
      .map((d) => {
        const actual = Number(d.actualDepth) || 0;
        const planned = Number(d.plannedDepth) || 1;
        const pct = Math.min(100, (actual / planned) * 100);
        return { ...d, actual, planned, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [drillHoles]);

  // ── Resumen de la semana ─────────────────────────────────────────────────────
  const weeklyStats = useMemo(() => {
    const now = Date.now();
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const thisWeekStart = now - oneWeekMs;
    const lastWeekStart = now - 2 * oneWeekMs;

    function getMs(updatedAt: any): number {
      if (!updatedAt) return 0;
      if (typeof updatedAt.toDate === 'function') return updatedAt.toDate().getTime();
      if (typeof updatedAt === 'number') return updatedAt;
      return new Date(updatedAt).getTime();
    }

    const stationsThisWeek = stations.filter(s => {
      const ms = getMs(s.updatedAt);
      return ms >= thisWeekStart;
    }).length;
    const stationsLastWeek = stations.filter(s => {
      const ms = getMs(s.updatedAt);
      return ms >= lastWeekStart && ms < thisWeekStart;
    }).length;

    const drillsThisWeek = drillHoles.filter(d => {
      const ms = getMs(d.updatedAt);
      return ms >= thisWeekStart;
    }).length;
    const drillsLastWeek = drillHoles.filter(d => {
      const ms = getMs(d.updatedAt);
      return ms >= lastWeekStart && ms < thisWeekStart;
    }).length;

    function pctChange(current: number, prev: number): number | null {
      if (prev === 0) return current > 0 ? 100 : null;
      return Math.round(((current - prev) / prev) * 100);
    }

    return {
      stationsThisWeek,
      stationsPct: pctChange(stationsThisWeek, stationsLastWeek),
      drillsThisWeek,
      drillsPct: pctChange(drillsThisWeek, drillsLastWeek),
      totalThisWeek: stationsThisWeek + drillsThisWeek,
      isActive: stationsThisWeek + drillsThisWeek > 0,
    };
  }, [stations, drillHoles]);

  function timeAgo(seconds: number): string {
    if (!seconds) return '—';
    const diff = Math.floor(Date.now() / 1000) - seconds;
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} día${Math.floor(diff / 86400) !== 1 ? 's' : ''}`;
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}, {displayName}
        </h1>
        <p className="text-sm text-muted-foreground capitalize">{today}</p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}
          label="Proyectos"
          value={loading ? '—' : projects.length}
          iconColor="text-primary"
          accentClass="stat-accent-green"
        />
        <StatCard
          icon={Layers}
          label="Estaciones"
          value={dataLoading ? '—' : stations.length}
          iconColor="text-blue-400"
          accentClass="stat-accent-blue"
        />
        <StatCard
          icon={Drill}
          label="Sondajes"
          value={dataLoading ? '—' : drillHoles.length}
          iconColor="text-purple-400"
          accentClass="stat-accent-purple"
        />
        <StatCard
          icon={FlaskConical}
          label="Muestras"
          value={dataLoading ? '—' : samples.length}
          iconColor="text-amber-400"
          accentClass="stat-accent-amber"
        />
      </div>

      {/* Visor 3D — acceso rápido */}
      {!dataLoading && projectsWith3D.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-cyan-400" />
              <h2 className="text-base font-semibold">Visor 3D</h2>
              <span className="text-xs text-muted-foreground font-mono">
                {projectsWith3D.length} proyecto{projectsWith3D.length !== 1 ? 's' : ''}
              </span>
            </div>
            {projectsWith3D[0] && (
              <Button size="sm" asChild>
                <Link href={`/projects/${projectsWith3D[0].id}/3d`} className="flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5" />
                  Abrir visor
                </Link>
              </Button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projectsWith3D.map((p) => {
              const accent = getProjectAccent(p.name);
              return (
                <Link key={p.id} href={`/projects/${p.id}/3d`}>
                  <Card className="hover:border-cyan-500/50 transition-colors h-full card-lift border-cyan-500/10 bg-gradient-to-br from-cyan-500/5 to-transparent">
                    <CardContent className="px-4 py-3 flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 rounded-lg items-center justify-center shrink-0 ring-1',
                        accent.bg, accent.ring,
                      )}>
                        <Box className={cn('h-5 w-5', accent.text)} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {p.drillCount} sondaje{p.drillCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Analytics skeleton */}
      {dataLoading && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="skeleton h-4 w-4 rounded" />
            <div className="skeleton h-5 w-20 rounded" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-64 rounded-lg" />)}
          </div>
        </div>
      )}

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

      {/* Esta semana */}
      {!dataLoading && weeklyStats.isActive && (
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Esta semana
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Total */}
            <Card className="stat-accent-green">
              <CardHeader className="pb-1 pt-4 px-4">
                <p className="text-xs text-muted-foreground">Registros activos</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-semibold font-data text-green-400">{weeklyStats.totalThisWeek}</p>
                <p className="text-xs text-muted-foreground mt-1">modificados esta semana</p>
              </CardContent>
            </Card>

            {/* Estaciones */}
            <Card className="stat-accent-blue">
              <CardHeader className="pb-1 pt-4 px-4">
                <p className="text-xs text-muted-foreground">Estaciones</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-semibold font-data text-blue-400">{weeklyStats.stationsThisWeek}</p>
                {weeklyStats.stationsPct !== null && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${weeklyStats.stationsPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {weeklyStats.stationsPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {weeklyStats.stationsPct >= 0 ? '+' : ''}{weeklyStats.stationsPct}% vs semana anterior
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Sondajes */}
            <Card className="stat-accent-purple">
              <CardHeader className="pb-1 pt-4 px-4">
                <p className="text-xs text-muted-foreground">Sondajes</p>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-2xl font-semibold font-data text-purple-400">{weeklyStats.drillsThisWeek}</p>
                {weeklyStats.drillsPct !== null && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${weeklyStats.drillsPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {weeklyStats.drillsPct >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {weeklyStats.drillsPct >= 0 ? '+' : ''}{weeklyStats.drillsPct}% vs semana anterior
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* En perforación */}
      {!dataLoading && activeDrillHoles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Drill className="h-4 w-4 text-purple-400" />
              <h2 className="text-base font-semibold">En perforación</h2>
            </div>
            <span className="text-xs text-muted-foreground font-mono">{activeDrillHoles.length} activo{activeDrillHoles.length !== 1 ? 's' : ''}</span>
          </div>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {activeDrillHoles.slice(0, 5).map((dh) => {
                const project = projects.find((p) => p.id === dh.projectId);
                return (
                  <Link
                    key={dh.id}
                    href={`/projects/${dh.projectId}/drillholes/${dh.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="rounded-md bg-muted p-1.5 shrink-0">
                      <Drill className="h-3.5 w-3.5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate font-mono">{dh.holeId}</p>
                      {project && (
                        <p className="text-xs text-muted-foreground truncate">{project.name}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500 transition-all"
                            style={{ width: `${dh.pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                          {dh.actual}/{dh.planned}m
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      {dh.pct.toFixed(0)}%
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent activity */}
      {!dataLoading && recentActivity.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Actividad reciente</h2>
          </div>
          <Card>
            <CardContent className="p-0 divide-y divide-border">
              {recentActivity.map((item) => {
                const project = projects.find((p) => p.id === item.projectId);
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={item.type === 'station'
                      ? `/projects/${item.projectId}/stations/${item.id}`
                      : `/projects/${item.projectId}/drillholes/${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="rounded-md bg-muted p-1.5 shrink-0">
                      {item.type === 'station'
                        ? <Layers className="h-3.5 w-3.5 text-blue-400" />
                        : <Drill className="h-3.5 w-3.5 text-purple-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate font-mono">{item.label}</p>
                      {project && (
                        <p className="text-xs text-muted-foreground truncate">{project.name}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                      {timeAgo(item.ts)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-28 rounded-lg" />
            ))}
          </div>
        )}

        {!loading && projects.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <svg width={36} height={36} viewBox="0 0 512 512" fill="none" aria-hidden>
                  <polygon points="256,88 420,348 92,348" stroke="#22c55e" strokeWidth="52" strokeLinejoin="round" fill="rgba(34,197,94,0.07)" />
                  <circle cx="256" cy="88" r="36" fill="#22c55e" />
                </svg>
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
            {recentProjects.map((project) => {
              const accent = getProjectAccent(project.name);
              const initials = project.name.slice(0, 2).toUpperCase();
              return (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:border-primary/40 transition-colors h-full card-lift">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-9 w-9 rounded-lg items-center justify-center shrink-0 ring-1 text-sm font-bold select-none',
                          accent.bg, accent.text, accent.ring,
                        )}>
                          {initials}
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
              );
            })}
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
      <div className="grid gap-3">
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
