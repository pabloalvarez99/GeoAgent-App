'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Cloud,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Layers,
  TrendingUp,
  FlaskConical,
} from 'lucide-react';
import { useStations } from '@/lib/hooks/use-stations';
import { useLithologies } from '@/lib/hooks/use-lithologies';
import { useStructural } from '@/lib/hooks/use-structural';
import { useSamples } from '@/lib/hooks/use-samples';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
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
import { LithologyForm } from '@/components/forms/lithology-form';
import { StructuralForm } from '@/components/forms/structural-form';
import { SampleForm } from '@/components/forms/sample-form';
import { StationForm } from '@/components/forms/station-form';
import type { LithologyFormData, StructuralFormData, SampleFormData, StationFormData } from '@geoagent/geo-shared/validation';
import type { GeoLithology, GeoStructural, GeoSample } from '@geoagent/geo-shared/types';
import { toast } from 'sonner';

export default function StationDetailPage({
  params,
}: {
  params: Promise<{ id: string; stId: string }>;
}) {
  const { id: projectId, stId } = use(params);
  const { project } = useProject(projectId);
  const { stations, loading: stationsLoading, editStation } = useStations(projectId);
  const station = stations.find((s) => s.id === stId);

  const { lithologies, loading: lithoLoading, addOrUpdateLithology, removeLithology } = useLithologies(stId);
  const { structural, loading: structLoading, addOrUpdateStructural, removeStructural } = useStructural(stId);
  const { samples, loading: sampleLoading, addOrUpdateSample, removeSample } = useSamples(stId);

  // Station edit state
  const [stationEditOpen, setStationEditOpen] = useState(false);

  // Lithology dialog state

  const [lithoOpen, setLithoOpen] = useState(false);
  const [lithoEdit, setLithoEdit] = useState<GeoLithology | null>(null);
  const [lithoDelete, setLithoDelete] = useState<GeoLithology | null>(null);

  // Structural dialog state
  const [structOpen, setStructOpen] = useState(false);
  const [structEdit, setStructEdit] = useState<GeoStructural | null>(null);
  const [structDelete, setStructDelete] = useState<GeoStructural | null>(null);

  // Sample dialog state
  const [sampleOpen, setSampleOpen] = useState(false);
  const [sampleEdit, setSampleEdit] = useState<GeoSample | null>(null);
  const [sampleDelete, setSampleDelete] = useState<GeoSample | null>(null);

  if (stationsLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Cargando estación...</span>
      </div>
    );
  }

  if (!station) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <p className="text-muted-foreground">Estación no encontrada</p>
        <Button variant="outline" asChild>
          <Link href={`/projects/${projectId}/stations`}>← Volver a estaciones</Link>
        </Button>
      </div>
    );
  }

  // Station handlers
  async function handleStationEdit(data: StationFormData) {
    try {
      await editStation(stId, { ...data, projectId });
      toast.success('Estación actualizada');
      setStationEditOpen(false);
    } catch {
      toast.error('Error al actualizar estación');
    }
  }

  // Lithology handlers
  async function handleLithoSubmit(data: LithologyFormData) {
    try {
      await addOrUpdateLithology({ ...data, stationId: stId }, lithoEdit?.id);
      toast.success('Litología guardada');
      setLithoOpen(false);
      setLithoEdit(null);
    } catch {
      toast.error('Error al guardar litología');
    }
  }

  // Structural handlers
  async function handleStructSubmit(data: StructuralFormData) {
    try {
      await addOrUpdateStructural({ ...data, stationId: stId }, structEdit?.id);
      toast.success('Dato estructural guardado');
      setStructOpen(false);
      setStructEdit(null);
    } catch {
      toast.error('Error al guardar dato estructural');
    }
  }

  // Sample handlers
  async function handleSampleSubmit(data: SampleFormData) {
    try {
      await addOrUpdateSample({ ...data, stationId: stId }, sampleEdit?.id);
      toast.success('Muestra guardada');
      setSampleOpen(false);
      setSampleEdit(null);
    } catch {
      toast.error('Error al guardar muestra');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href={`/projects/${projectId}/stations`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{station.code}</h1>
            {station.weatherConditions && (
              <Badge variant="secondary">
                <Cloud className="h-3 w-3 mr-1" />
                {station.weatherConditions}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 ml-1"
              onClick={() => setStationEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{station.description}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> {station.geologist}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {station.date}
            </span>
            <span className="flex items-center gap-1 font-mono">
              <MapPin className="h-3 w-3" />
              {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
              {station.altitude ? ` · ${station.altitude.toFixed(0)} m` : ''}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="lithology">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="lithology" className="flex-1 sm:flex-none">
            <Layers className="h-4 w-4 mr-1.5" />
            Litología ({lithologies.length})
          </TabsTrigger>
          <TabsTrigger value="structural" className="flex-1 sm:flex-none">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            Estructural ({structural.length})
          </TabsTrigger>
          <TabsTrigger value="samples" className="flex-1 sm:flex-none">
            <FlaskConical className="h-4 w-4 mr-1.5" />
            Muestras ({samples.length})
          </TabsTrigger>
        </TabsList>

        {/* Lithology Tab */}
        <TabsContent value="lithology" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setLithoEdit(null); setLithoOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Agregar litología
            </Button>
          </div>
          {lithoLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : lithologies.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No hay registros de litología
            </p>
          ) : (
            lithologies.map((litho) => (
              <Card key={litho.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge>{litho.rockGroup}</Badge>
                        <Badge variant="outline">{litho.rockType}</Badge>
                        <Badge variant="secondary">{litho.color}</Badge>
                        <Badge variant="secondary">{litho.texture}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[litho.mineralogy, litho.alteration, litho.structure].filter(Boolean).join(' · ')}
                      </p>
                      {litho.notes && (
                        <p className="text-xs text-muted-foreground italic">{litho.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLithoEdit(litho); setLithoOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setLithoDelete(litho)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Structural Tab */}
        <TabsContent value="structural" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setStructEdit(null); setStructOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Agregar estructura
            </Button>
          </div>
          {structLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : structural.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No hay datos estructurales
            </p>
          ) : (
            structural.map((s) => (
              <Card key={s.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <Badge>{s.type}</Badge>
                        <span className="text-sm font-mono font-semibold">
                          {s.strike}°/{s.dip}°{s.dipDirection}
                        </span>
                        {s.movement && <Badge variant="secondary">{s.movement}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {[
                          s.roughness && `Rugosidad: ${s.roughness}`,
                          s.continuity && `Continuidad: ${s.continuity}`,
                          s.thickness != null && `Espesor: ${s.thickness} m`,
                        ].filter(Boolean).join(' · ')}
                      </p>
                      {s.notes && (
                        <p className="text-xs text-muted-foreground italic">{s.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setStructEdit(s); setStructOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setStructDelete(s)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Samples Tab */}
        <TabsContent value="samples" className="space-y-3 mt-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setSampleEdit(null); setSampleOpen(true); }}>
              <Plus className="h-4 w-4 mr-1.5" /> Agregar muestra
            </Button>
          </div>
          {sampleLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
            </div>
          ) : samples.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              No hay muestras registradas
            </p>
          ) : (
            samples.map((sample) => (
              <Card key={sample.id} className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <Badge variant="outline" className="font-mono">{sample.code}</Badge>
                        <Badge>{sample.type}</Badge>
                        <Badge
                          variant={sample.status === 'Resultados Recibidos' ? 'default' : 'secondary'}
                          className={sample.status === 'Resultados Recibidos' ? 'bg-green-600' : ''}
                        >
                          {sample.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {sample.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          sample.weight != null && `${sample.weight} kg`,
                          sample.analysisRequested && `Análisis: ${sample.analysisRequested}`,
                          sample.destination && `Destino: ${sample.destination}`,
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSampleEdit(sample); setSampleOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setSampleDelete(sample)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Station Edit Dialog */}
      <Dialog open={stationEditOpen} onOpenChange={setStationEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar estación {station.code}</DialogTitle>
          </DialogHeader>
          <StationForm
            defaultValues={station}
            onSubmit={handleStationEdit}
            onCancel={() => setStationEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Litho Dialog */}
      <Dialog open={lithoOpen} onOpenChange={(o) => { setLithoOpen(o); if (!o) setLithoEdit(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{lithoEdit ? 'Editar litología' : 'Nueva litología'}</DialogTitle>
          </DialogHeader>
          <LithologyForm
            defaultValues={lithoEdit ?? undefined}
            onSubmit={handleLithoSubmit}
            onCancel={() => setLithoOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Litho Delete */}
      <AlertDialog open={!!lithoDelete} onOpenChange={(o) => !o && setLithoDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro de litología?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { try { await removeLithology(lithoDelete!.id); toast.success('Litología eliminada'); } catch { toast.error('Error al eliminar litología'); } setLithoDelete(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Struct Dialog */}
      <Dialog open={structOpen} onOpenChange={(o) => { setStructOpen(o); if (!o) setStructEdit(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{structEdit ? 'Editar estructura' : 'Nueva estructura'}</DialogTitle>
          </DialogHeader>
          <StructuralForm
            defaultValues={structEdit ?? undefined}
            onSubmit={handleStructSubmit}
            onCancel={() => setStructOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Struct Delete */}
      <AlertDialog open={!!structDelete} onOpenChange={(o) => !o && setStructDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar registro estructural?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { try { await removeStructural(structDelete!.id); toast.success('Dato estructural eliminado'); } catch { toast.error('Error al eliminar dato estructural'); } setStructDelete(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sample Dialog */}
      <Dialog open={sampleOpen} onOpenChange={(o) => { setSampleOpen(o); if (!o) setSampleEdit(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{sampleEdit ? 'Editar muestra' : 'Nueva muestra'}</DialogTitle>
          </DialogHeader>
          <SampleForm
            defaultValues={sampleEdit ?? undefined}
            onSubmit={handleSampleSubmit}
            onCancel={() => setSampleOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Sample Delete */}
      <AlertDialog open={!!sampleDelete} onOpenChange={(o) => !o && setSampleDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar muestra?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => { try { await removeSample(sampleDelete!.id); toast.success('Muestra eliminada'); } catch { toast.error('Error al eliminar muestra'); } setSampleDelete(null); }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
