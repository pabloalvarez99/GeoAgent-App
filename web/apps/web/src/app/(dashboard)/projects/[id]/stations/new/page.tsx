'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useStations } from '@/lib/hooks/use-stations';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { StationForm } from '@/components/forms/station-form';
import type { StationFormData } from '@geoagent/geo-shared/validation';

export default function NewStationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { project } = useProject(projectId);
  const { addStation } = useStations(projectId);

  async function handleSubmit(data: StationFormData) {
    await addStation({ ...data, projectId });
    router.push(`/projects/${projectId}/stations`);
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
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/projects/${projectId}/stations`)}
      />
    </div>
  );
}
