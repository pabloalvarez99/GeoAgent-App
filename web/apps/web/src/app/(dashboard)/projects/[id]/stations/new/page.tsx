'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useStations } from '@/lib/hooks/use-stations';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { StationForm } from '@/components/forms/station-form';
import type { StationFormData } from '@geoagent/geo-shared/validation';
import { toast } from 'sonner';

export default function NewStationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { project } = useProject(projectId);
  const { addStation } = useStations(projectId);

  const searchParams = useSearchParams();
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const gpsDefaults = latParam && lngParam
    ? { latitude: parseFloat(latParam), longitude: parseFloat(lngParam) }
    : undefined;

  async function handleSubmit(data: StationFormData) {
    try {
      await addStation({ ...data, projectId });
      toast.success('Estación creada');
      router.push(`/projects/${projectId}/stations`);
    } catch {
      toast.error('Error al crear estación');
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${projectId}/stations`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nueva estación</h1>
          {project && (
            <p className="text-sm text-muted-foreground">{project.name}</p>
          )}
        </div>
      </div>

      <StationForm
        defaultValues={gpsDefaults as any}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/projects/${projectId}/stations`)}
      />
    </div>
  );
}
