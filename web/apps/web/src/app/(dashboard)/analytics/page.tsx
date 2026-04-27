'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  BarChart3,
  FolderOpen,
  Layers,
  Drill,
  FlaskConical,
  Gauge,
  Users,
} from 'lucide-react';
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
import { useAuth } from '@/lib/firebase/auth';
import { useProjects } from '@/lib/hooks/use-projects';
import {
  subscribeToAllStations,
  subscribeToAllDrillHoles,
  subscribeToAllLithologies,
  subscribeToAllSamples,
} from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CHART_COLORS = [
  '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#8b5cf6',
];

// ── Tooltip helpers ───────────────────────────────────────────────────────────
function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">
        {payload[0].value} registro{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md max-w-[200px]">
      <p className="font-medium truncate">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill ?? p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="skeleton h-[220px] w-full rounded" />;
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  iconColor = 'text-primary',
  accentClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  iconColor?: string;
  accentClass?: string;
}) {
  return (
    <Card className={accentClass}>
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GlobalAnalyticsPage() {
  const { user } = useAuth();
  const { projects, loading: projectsLoading } = useProjects();

  const [stations, setStations] = useState<any[]>([]);
  const [drillHoles, setDrillHoles] = useState<any[]>([]);
  const [lithologies, setLithologies] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let resolved = 0;
    const check = () => {
      resolved++;
      if (resolved >= 4) setDataLoading(false);
    };

    const u1 = subscribeToAllStations(user.uid, (d) => { setStations(d); check(); });
    const u2 = subscribeToAllDrillHoles(user.uid, (d) => { setDrillHoles(d); check(); });
    const u3 = subscribeToAllLithologies(user.uid, (d) => { setLithologies(d); check(); });
    const u4 = subscribeToAllSamples(user.uid, (d) => { setSamples(d); check(); });
    return () => { u1(); u2(); u3(); u4(); };
  }, [user]);

  const loading = projectsLoading || dataLoading;

  // ── Summary stats ────────────────────────────────────────────────────────────
  const totalMetros = useMemo(() =>
    drillHoles.reduce((acc, d) => acc + (Number(d.actualDepth) || 0), 0),
    [drillHoles],
  );

  // ── Chart 1: Rock groups (Ignea / Sedimentaria / Metamorfica) ────────────────
  const rockGroupData = useMemo(() => {
    const counts: Record<string, number> = {};
    lithologies.forEach((l) => {
      const key = l.rockGroup || 'Sin grupo';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [lithologies]);

  // ── Chart 2: Top 10 rock types (horizontal bar) ──────────────────────────────
  const rockTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    lithologies.forEach((l) => {
      const key = l.rockType || 'Sin tipo';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name: name.length > 18 ? name.slice(0, 17) + '…' : name,
        value,
      }));
  }, [lithologies]);

  // ── Chart 3: Sample types (donut) ───────────────────────────────────────────
  const sampleTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    samples.forEach((s) => {
      const key = s.type || 'Sin tipo';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));
  }, [samples]);

  // ── Chart 4: Drillholes by status ───────────────────────────────────────────
  const drillStatusData = useMemo(() => {
    const STATUS_LABELS: Record<string, string> = {
      'En Progreso': 'En Progreso',
      'Completado': 'Completado',
      'Abandonado': 'Abandonado',
      'Suspendido': 'Suspendido',
    };
    const counts: Record<string, number> = {
      'En Progreso': 0,
      'Completado': 0,
      'Abandonado': 0,
      'Suspendido': 0,
    };
    drillHoles.forEach((d) => {
      const s = d.status as string;
      if (s && counts[s] !== undefined) counts[s]++;
      else if (s) counts[s] = (counts[s] ?? 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: STATUS_LABELS[name] ?? name, value }));
  }, [drillHoles]);

  // ── Chart 5: Top 5 geologists by station count ──────────────────────────────
  // Uses `createdBy` (email) or `geologistName` field on station docs
  const geologistData = useMemo(() => {
    const counts: Record<string, number> = {};
    stations.forEach((s) => {
      const key = s.geologist || s.geologistName || s.createdBy || 'Desconocido';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({
        name: name.length > 20 ? name.slice(0, 19) + '…' : name,
        Estaciones: value,
      }));
  }, [stations]);

  const hasData =
    lithologies.length > 0 || samples.length > 0 || drillHoles.length > 0 || stations.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Analítica global</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Resumen de todos los proyectos
        </p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
          value={loading ? '—' : stations.length}
          iconColor="text-blue-400"
          accentClass="stat-accent-blue"
        />
        <StatCard
          icon={FlaskConical}
          label="Muestras"
          value={loading ? '—' : samples.length}
          iconColor="text-amber-400"
          accentClass="stat-accent-amber"
        />
        <StatCard
          icon={Drill}
          label="Sondajes"
          value={loading ? '—' : drillHoles.length}
          iconColor="text-purple-400"
          accentClass="stat-accent-purple"
        />
        <StatCard
          icon={Gauge}
          label="Metros perforados"
          value={loading ? '—' : `${totalMetros.toFixed(0)} m`}
          sub="suma de profundidad real"
          iconColor="text-rose-400"
          accentClass="stat-accent-rose"
        />
      </div>

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-4">
          <div className="skeleton h-5 w-32 rounded" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-64 rounded-lg" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-lg" />
          <div className="skeleton h-64 rounded-lg" />
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasData && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground/25" />
          <p className="text-sm text-muted-foreground font-medium">
            Sin datos para mostrar
          </p>
          <p className="text-xs text-muted-foreground">
            Crea proyectos, estaciones y litologías para ver analítica global
          </p>
        </div>
      )}

      {/* Charts */}
      {!loading && hasData && (
        <div className="space-y-6">

          {/* Row 1: Litho groups + Sample types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Chart 1 — Grupos litológicos */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Grupos litológicos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {rockGroupData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                    Sin litologías registradas
                  </div>
                ) : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={rockGroupData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {rockGroupData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(v) => (
                            <span className="text-xs text-foreground">{v}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 3 — Tipos de muestra (donut) */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-amber-400" />
                  Tipos de muestra
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {sampleTypeData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                    Sin muestras registradas
                  </div>
                ) : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sampleTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {sampleTypeData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(v) => (
                            <span className="text-xs text-foreground">{v}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chart 2 — Top 10 tipos de roca (horizontal bar) */}
          {rockTypeData.length > 0 && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Top 10 tipos de roca</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={rockTypeData}
                      layout="vertical"
                      margin={{ top: 4, right: 20, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="hsl(var(--border))"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        allowDecimals={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip content={<CustomBarTooltip />} />
                      <Bar dataKey="value" name="Frecuencia" radius={[0, 4, 4, 0]}>
                        {rockTypeData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Row 2: Drill status + Top geologists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Chart 4 — Sondajes por estado */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Drill className="h-4 w-4 text-purple-400" />
                  Sondajes por estado
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {drillStatusData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                    Sin sondajes registrados
                  </div>
                ) : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={drillStatusData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="value" name="Sondajes" radius={[2, 2, 0, 0]}>
                          {drillStatusData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[(i + 1) % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chart 5 — Top 5 geólogos por estaciones */}
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  Top 5 geólogos por estaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {geologistData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
                    Sin datos de geólogos
                  </div>
                ) : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={geologistData}
                        layout="vertical"
                        margin={{ top: 4, right: 20, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(var(--border))"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar
                          dataKey="Estaciones"
                          radius={[0, 4, 4, 0]}
                          fill="#06b6d4"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
