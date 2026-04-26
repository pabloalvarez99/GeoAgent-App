'use client';

import { use, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, FlaskConical, Layers, Drill } from 'lucide-react';
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
import { useStations } from '@/lib/hooks/use-stations';
import { useDrillHoles } from '@/lib/hooks/use-drillholes';
import { useAuth } from '@/lib/firebase/auth';
import {
  getLithologiesForStations,
  getSamplesForStations,
  getIntervalsForDrillHoles,
} from '@/lib/firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CHART_COLORS = [
  '#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#8b5cf6',
];

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-1.5 text-xs shadow-md">
      <p className="font-medium">{payload[0].name}</p>
      <p className="text-muted-foreground">{payload[0].value} registro{payload[0].value !== 1 ? 's' : ''}</p>
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
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(p.value % 1 === 0 ? 0 : 1) : p.value}
        </p>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return <div className="skeleton h-[220px] w-full rounded" />;
}

export default function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { user } = useAuth();
  const { stations, loading: stationsLoading } = useStations(projectId);
  const { drillHoles, loading: dhLoading } = useDrillHoles(projectId);

  const [lithologies, setLithologies] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [intervals, setIntervals] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user || stationsLoading || dhLoading) return;
    if (stations.length === 0 && drillHoles.length === 0) {
      setDataLoading(false);
      return;
    }
    setDataLoading(true);
    const stationIds = stations.map((s) => s.id);
    const drillHoleIds = drillHoles.map((d) => d.id);

    Promise.all([
      stationIds.length > 0 ? getLithologiesForStations(user.uid, stationIds) : Promise.resolve([]),
      stationIds.length > 0 ? getSamplesForStations(user.uid, stationIds) : Promise.resolve([]),
      drillHoleIds.length > 0 ? getIntervalsForDrillHoles(user.uid, drillHoleIds) : Promise.resolve([]),
    ]).then(([liths, samps, ints]) => {
      setLithologies(liths as any[]);
      setSamples(samps as any[]);
      setIntervals(ints as any[]);
      setDataLoading(false);
    });
  }, [user, stations, drillHoles, stationsLoading, dhLoading]);

  const loading = stationsLoading || dhLoading || dataLoading;

  const rockGroupData = useMemo(() => {
    const counts: Record<string, number> = {};
    lithologies.forEach((l) => {
      const key = l.rockGroup || 'Sin grupo';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [lithologies]);

  const rockTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    lithologies.forEach((l) => {
      const key = l.rockType || 'Sin tipo';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name: name.length > 16 ? name.slice(0, 15) + '…' : name, value }));
  }, [lithologies]);

  const sampleTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    samples.forEach((s) => {
      const key = s.type || 'Sin tipo';
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [samples]);

  const drillProgressData = useMemo(() => {
    return drillHoles
      .filter((d) => d.plannedDepth > 0)
      .slice(0, 10)
      .map((d) => ({
        name: d.holeId?.length > 10 ? d.holeId.slice(0, 10) + '…' : (d.holeId || 'S/N'),
        Planificado: Number(d.plannedDepth) || 0,
        Real: Number(d.actualDepth) || 0,
      }));
  }, [drillHoles]);

  const rqdData = useMemo(() => {
    const byHole: Record<string, number[]> = {};
    intervals.forEach((i) => {
      if (i.rqd != null && i.drillHoleId) {
        if (!byHole[i.drillHoleId]) byHole[i.drillHoleId] = [];
        byHole[i.drillHoleId].push(i.rqd);
      }
    });
    return drillHoles
      .filter((d) => byHole[d.id]?.length > 0)
      .slice(0, 10)
      .map((d) => {
        const vals = byHole[d.id];
        return {
          name: d.holeId?.length > 10 ? d.holeId.slice(0, 10) + '…' : (d.holeId || 'S/N'),
          RQD: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length),
        };
      });
  }, [drillHoles, intervals]);

  const hasData = lithologies.length > 0 || samples.length > 0 || drillHoles.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Analítica del proyecto</h1>
          <p className="text-sm text-muted-foreground">
            {stations.length} estación{stations.length !== 1 ? 'es' : ''} · {drillHoles.length} sondaje{drillHoles.length !== 1 ? 's' : ''} · {lithologies.length} litología{lithologies.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {!loading && !hasData ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">Sin datos suficientes para generar gráficos</p>
          <p className="text-xs text-muted-foreground">Agrega estaciones y litologías para ver analítica</p>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="stat-accent-green">
              <CardHeader className="pb-1 pt-3 px-4"><p className="text-xs text-muted-foreground">Estaciones</p></CardHeader>
              <CardContent className="px-4 pb-3"><p className="text-2xl font-bold text-green-400 font-data">{loading ? '—' : stations.length}</p></CardContent>
            </Card>
            <Card className="stat-accent-blue">
              <CardHeader className="pb-1 pt-3 px-4"><p className="text-xs text-muted-foreground">Litologías</p></CardHeader>
              <CardContent className="px-4 pb-3"><p className="text-2xl font-bold text-blue-400 font-data">{loading ? '—' : lithologies.length}</p></CardContent>
            </Card>
            <Card className="stat-accent-amber">
              <CardHeader className="pb-1 pt-3 px-4"><p className="text-xs text-muted-foreground">Muestras</p></CardHeader>
              <CardContent className="px-4 pb-3"><p className="text-2xl font-bold text-orange-400 font-data">{loading ? '—' : samples.length}</p></CardContent>
            </Card>
            <Card className="stat-accent-rose">
              <CardHeader className="pb-1 pt-3 px-4"><p className="text-xs text-muted-foreground">Intervalos</p></CardHeader>
              <CardContent className="px-4 pb-3"><p className="text-2xl font-bold text-rose-400 font-data">{loading ? '—' : intervals.length}</p></CardContent>
            </Card>
          </div>

          {/* Pies: rock groups + sample types */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Grupos litológicos
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? <ChartSkeleton /> : rockGroupData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Sin litologías registradas</div>
                ) : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={rockGroupData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                          {rockGroupData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-amber-400" />
                  Tipos de muestra
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? <ChartSkeleton /> : sampleTypeData.length === 0 ? (
                  <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Sin muestras registradas</div>
                ) : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sampleTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                          {sampleTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top rock types horizontal bar */}
          {(loading || rockTypeData.length > 0) && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Top tipos de roca</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {loading ? <ChartSkeleton /> : (
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={rockTypeData} layout="vertical" margin={{ top: 4, right: 20, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <Tooltip content={<CustomBarTooltip />} />
                        <Bar dataKey="value" name="Frecuencia" radius={[0, 4, 4, 0]}>
                          {rockTypeData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Drill charts */}
          {(loading || drillHoles.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Drill className="h-4 w-4 text-amber-400" />
                    Profundidad por sondaje
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {loading ? <ChartSkeleton /> : drillProgressData.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Sin sondajes con profundidad</div>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={drillProgressData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                          <Tooltip content={<CustomBarTooltip />} />
                          <Legend formatter={(v) => <span className="text-xs text-foreground">{v}</span>} />
                          <Bar dataKey="Planificado" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                          <Bar dataKey="Real" fill="#22c55e" radius={[2, 2, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">RQD promedio por sondaje</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {loading ? <ChartSkeleton /> : rqdData.length === 0 ? (
                    <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">Sin datos de RQD registrados</div>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={rqdData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <Tooltip content={<CustomBarTooltip />} />
                          <Bar dataKey="RQD" name="RQD %" radius={[2, 2, 0, 0]}>
                            {rqdData.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
