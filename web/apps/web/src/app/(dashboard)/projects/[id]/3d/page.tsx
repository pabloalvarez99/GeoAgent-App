'use client';

import { use, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft, Box, Loader2 } from 'lucide-react';
import { useStations } from '@/lib/hooks/use-stations';
import { useDrillHoles, useAllDrillIntervals } from '@/lib/hooks/use-drillholes';
import { useProjects } from '@/lib/hooks/use-projects';

const DrillHole3DViewer = dynamic(
  () => import('@/components/drillhole/drillhole-3d-viewer'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-950 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando visor 3D…</span>
      </div>
    ),
  },
);

export default function Project3DPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { projects } = useProjects();
  const project = projects.find((p) => p.id === id);
  const { stations } = useStations(id);
  const { drillHoles, loading: loadingDrillHoles } = useDrillHoles(id);
  const drillHoleIds = useMemo(() => drillHoles.map((d) => d.id), [drillHoles]);
  const { intervals: allIntervals, loading: loadingIntervals } = useAllDrillIntervals(drillHoleIds);

  const drillHolesWithIntervals = useMemo(
    () =>
      drillHoles.map((dh) => ({
        drillHole: dh,
        intervals: allIntervals.filter((i) => i.drillHoleId === dh.id),
      })),
    [drillHoles, allIntervals],
  );

  const loading = loadingDrillHoles || loadingIntervals;

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0b1220]">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border bg-popover/95 backdrop-blur z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href={`/projects/${id}`}
            className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded hover:bg-accent text-foreground shrink-0"
            title="Volver al proyecto"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Volver</span>
          </Link>
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground min-w-0">
            <Box className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="truncate">Vista 3D</span>
            {project && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="truncate text-muted-foreground">{project.name}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
          <span>{drillHoles.length} sondajes</span>
          <span>{allIntervals.length} intervalos</span>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2 py-1 text-[10px] font-mono rounded bg-popover/90 border border-border">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Cargando datos…</span>
          </div>
        )}
        {!loading && drillHoles.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Sin sondajes en este proyecto.
          </div>
        ) : (
          <DrillHole3DViewer
            drillHoles={drillHolesWithIntervals}
            stations={stations}
            projectId={id}
            fillParent
          />
        )}
      </div>
    </div>
  );
}
