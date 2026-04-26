'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useDrillHoles } from '@/lib/hooks/use-drillholes';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { DrillHoleForm } from '@/components/forms/drillhole-form';
import type { DrillHoleFormData } from '@geoagent/geo-shared/validation';
import { toast } from 'sonner';

export default function NewDrillHolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { project } = useProject(projectId);
  const { addDrillHole } = useDrillHoles(projectId);

  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const gpsDefaults = latParam && lngParam
    ? { latitude: parseFloat(latParam), longitude: parseFloat(lngParam) }
    : undefined;

  async function handleSubmit(data: DrillHoleFormData) {
    try {
      await addDrillHole({ ...data, projectId });
      toast.success('Sondaje creado');
      router.push(`/projects/${projectId}/drillholes`);
    } catch {
      toast.error('Error al crear sondaje');
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}/drillholes`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nuevo sondaje</h1>
          {project && <p className="text-sm text-muted-foreground">{project.name}</p>}
        </div>
      </div>

      <DrillHoleForm
        defaultValues={gpsDefaults as any}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/projects/${projectId}/drillholes`)}
      />
    </div>
  );
}
