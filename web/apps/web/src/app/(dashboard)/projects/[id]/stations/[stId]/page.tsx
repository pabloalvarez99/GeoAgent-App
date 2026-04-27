'use client';

import { use, useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Calendar,
  User,
  Cloud,
  Plus,
  Pencil,
  Trash2,
  Layers,
  TrendingUp,
  FlaskConical,
  ExternalLink,
  Camera,
  Map as MapViewIcon,
  Copy,
  Check,
  Upload,
  Loader2,
} from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { ref as storageRef, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase/client';
import { userCollection } from '@/lib/firebase/firestore';
import { COLLECTIONS } from '@geoagent/geo-shared/constants';
import { useAuth } from '@/lib/firebase/auth';
import { usePreferences } from '@/lib/hooks/use-preferences';
import { formatLatLng } from '@/lib/utils/coords';
import { useStations } from '@/lib/hooks/use-stations';
import { useLithologies } from '@/lib/hooks/use-lithologies';
import { useStructural } from '@/lib/hooks/use-structural';
import { useSamples } from '@/lib/hooks/use-samples';
import { useProject } from '@/lib/hooks/use-projects';
import { usePhotos } from '@/lib/hooks/use-photos';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function StationMiniMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="h-40 rounded-lg border border-border bg-muted/30 flex items-center justify-center">
        <p className="text-xs text-muted-foreground">Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</p>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        mapId="station-mini-map"
        defaultCenter={{ lat: latitude, lng: longitude }}
        defaultZoom={14}
        gestureHandling="cooperative"
        disableDefaultUI
        className="h-40 w-full rounded-lg overflow-hidden border border-border"
        colorScheme="DARK"
        style={{ height: 160 }}
      >
        <AdvancedMarker position={{ lat: latitude, lng: longitude }} />
      </Map>
    </APIProvider>
  );
}

export default function StationDetailPage({
  params,
}: {
  params: Promise<{ id: string; stId: string }>;
}) {
  const { id: projectId, stId } = use(params);
  const { user } = useAuth();
  const { coordFormat } = usePreferences();
  const { project } = useProject(projectId);
  const { stations, loading: stationsLoading, editStation } = useStations(projectId);
  const station = stations.find((s) => s.id === stId);

  const currentStIdx = stations.findIndex((s) => s.id === stId);
  const prevStation = currentStIdx > 0 ? stations[currentStIdx - 1] : null;
  const nextStation = currentStIdx < stations.length - 1 ? stations[currentStIdx + 1] : null;

  const { lithologies, loading: lithoLoading, addOrUpdateLithology, removeLithology } = useLithologies(stId);
  const { structural, loading: structLoading, addOrUpdateStructural, removeStructural } = useStructural(stId);
  const { samples, loading: sampleLoading, addOrUpdateSample, removeSample } = useSamples(stId);
  const { photos, loading: photosLoading } = usePhotos({ stationId: stId });

  // Resolve download URLs for up to 4 photos
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoUrlsLoading, setPhotoUrlsLoading] = useState(false);

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Record<string, { name: string; progress: number }>>({});
  const isUploadingPhotos = Object.keys(uploadQueue).length > 0;

  useEffect(() => {
    if (photos.length === 0) {
      setPhotoUrls([]);
      return;
    }
    let cancelled = false;
    setPhotoUrlsLoading(true);
    const slice = photos.filter((p) => p.storagePath).slice(0, 4);
    Promise.all(
      slice.map((p) => getDownloadURL(storageRef(storage, p.storagePath!)).catch(() => null)),
    ).then((urls) => {
      if (!cancelled) {
        setPhotoUrls(urls.filter(Boolean) as string[]);
        setPhotoUrlsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [photos]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

  // Tab navigation (controlled)
  const [activeTab, setActiveTab] = useState<'lithology' | 'structural' | 'samples'>('lithology');

  // Copy coords state
  const [coordsCopied, setCoordsCopied] = useState(false);
  function copyCoords() {
    if (!station) return;
    navigator.clipboard.writeText(formatLatLng(station.latitude, station.longitude, coordFormat));
    setCoordsCopied(true);
    setTimeout(() => setCoordsCopied(false), 2000);
  }

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
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="skeleton h-8 w-8 rounded-md shrink-0 mt-0.5" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-7 w-40 rounded" />
            <div className="skeleton h-4 w-64 rounded" />
          </div>
        </div>
        <div className="skeleton h-9 w-full rounded-lg" />
        <div className="skeleton h-48 rounded-lg" />
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

  async function uploadPhotos(files: FileList | File[]) {
    if (!user || files.length === 0) return;
    const arr = Array.from(files);

    const initial: Record<string, { name: string; progress: number }> = {};
    arr.forEach((file) => {
      const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2)}_${file.name.replace(/\s+/g, '_')}`;
      initial[uniqueName] = { name: file.name, progress: 0 };
    });
    setUploadQueue(initial);

    const uploadPromises = arr.map(async (file, idx) => {
      const uniqueName = Object.keys(initial)[idx];
      const path = `photos/${user.uid}/${uniqueName}`;
      const fileRef = storageRef(storage, path);

      return new Promise<void>((resolve, reject) => {
        const task = uploadBytesResumable(fileRef, file);

        task.on(
          'state_changed',
          (snapshot) => {
            const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setUploadQueue((prev) => ({
              ...prev,
              [uniqueName]: { ...prev[uniqueName], progress: pct },
            }));
          },
          (error) => reject(error),
          async () => {
            try {
              await getDownloadURL(fileRef);
              await addDoc(userCollection(user.uid, COLLECTIONS.PHOTOS), {
                projectId,
                stationId: stId,
                fileName: file.name,
                storagePath: path,
                description: file.name.replace(/\.[^.]+$/, ''),
                takenAt: new Date().toISOString(),
                updatedAt: serverTimestamp(),
              });
              setUploadQueue((prev) => ({
                ...prev,
                [uniqueName]: { ...prev[uniqueName], progress: 100 },
              }));
              resolve();
            } catch (e) {
              reject(e);
            }
          },
        );
      });
    });

    try {
      await Promise.all(uploadPromises);
      toast.success(
        arr.length === 1
          ? '1 foto subida correctamente'
          : `${arr.length} fotos subidas correctamente`,
      );
    } catch (e) {
      console.error(e);
      toast.error('Error al subir las fotos');
    } finally {
      setTimeout(() => setUploadQueue({}), 1500);
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
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 ml-1 text-xs text-muted-foreground hover:text-primary"
              asChild
            >
              <Link href={`/projects/${projectId}/map?center_lat=${station.latitude}&center_lng=${station.longitude}&center_zoom=16`}>
                <MapViewIcon className="h-3.5 w-3.5 mr-1" />
                Ver en mapa
              </Link>
            </Button>
            <div className="flex items-center gap-0.5 ml-2">
              {prevStation ? (
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <Link href={`/projects/${projectId}/stations/${prevStation.id}`} title={`Anterior: ${prevStation.code}`}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
              )}
              {nextStation ? (
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <Link href={`/projects/${projectId}/stations/${nextStation.id}`} title={`Siguiente: ${nextStation.code}`}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
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
              {formatLatLng(station.latitude, station.longitude, coordFormat)}
              {station.altitude ? ` · ${station.altitude.toFixed(0)} m` : ''}
              <button
                onClick={copyCoords}
                className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Copiar coordenadas"
              >
                {coordsCopied
                  ? <Check className="h-3 w-3 text-green-400" />
                  : <Copy className="h-3 w-3" />}
              </button>
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Quick stats — clickable → navigate to tab */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setActiveTab('lithology')}
          className="stat-accent-blue rounded-lg border border-border bg-card px-4 py-3 text-left hover:border-blue-500/40 transition-colors"
        >
          <p className="text-xs text-muted-foreground">Litologías</p>
          <p className="text-xl font-bold text-blue-400 font-data mt-0.5">{lithologies.length || '—'}</p>
        </button>
        <button
          onClick={() => setActiveTab('structural')}
          className="stat-accent-amber rounded-lg border border-border bg-card px-4 py-3 text-left hover:border-amber-500/40 transition-colors"
        >
          <p className="text-xs text-muted-foreground">Estructural</p>
          <p className="text-xl font-bold text-orange-400 font-data mt-0.5">{structural.length || '—'}</p>
        </button>
        <button
          onClick={() => setActiveTab('samples')}
          className="stat-accent-green rounded-lg border border-border bg-card px-4 py-3 text-left hover:border-green-500/40 transition-colors"
        >
          <p className="text-xs text-muted-foreground">Muestras</p>
          <p className="text-xl font-bold text-green-400 font-data mt-0.5">{samples.length || '—'}</p>
        </button>
      </div>

      {/* Dominant lithology insight */}
      {!lithoLoading && lithologies.length > 0 && (() => {
        const rockCounts: Record<string, number> = {};
        const groupCounts: Record<string, number> = {};
        lithologies.forEach((l) => {
          rockCounts[l.rockType] = (rockCounts[l.rockType] ?? 0) + 1;
          groupCounts[l.rockGroup] = (groupCounts[l.rockGroup] ?? 0) + 1;
        });
        const dominantRock = Object.entries(rockCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        const dominantGroup = Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
        return (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span>Litología dominante:</span>
            <Badge variant="secondary" className="text-xs">{dominantGroup}</Badge>
            <span className="text-muted-foreground/60">·</span>
            <Badge variant="outline" className="text-xs font-normal">{dominantRock}</Badge>
          </div>
        );
      })()}

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadPhotos(e.target.files)}
      />

      {/* Photo strip */}
      {!photosLoading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5 shrink-0" />
              {photoUrlsLoading ? 'Cargando fotos...' : `${photos.length} foto${photos.length !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhotos}
              >
                {isUploadingPhotos ? (
                  <><Loader2 className="h-3 w-3 animate-spin" />Subiendo...</>
                ) : (
                  <><Upload className="h-3 w-3" />Subir foto</>
                )}
              </Button>
              {photos.length > 0 && (
                <Link
                  href={`/projects/${projectId}/photos`}
                  className="text-xs text-primary hover:underline"
                >
                  Ver todas
                </Link>
              )}
            </div>
          </div>
          {/* Upload progress */}
          {isUploadingPhotos && (
            <div className="rounded-lg border border-border bg-card p-2.5 space-y-1.5">
              {Object.entries(uploadQueue).map(([key, { name, progress }]) => (
                <div key={key} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">{name}</span>
                    <span className="text-xs font-mono text-muted-foreground ml-2">{progress}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {photoUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photoUrls.map((url, i) => (
                <Link
                  key={i}
                  href={`/projects/${projectId}/photos`}
                  className="shrink-0 h-20 w-20 rounded-md overflow-hidden border border-border hover:border-primary/40 transition-colors"
                >
                  <Image
                    src={url}
                    alt={`Foto ${i + 1}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </Link>
              ))}
              {photos.length > 4 && (
                <Link
                  href={`/projects/${projectId}/photos`}
                  className="shrink-0 h-20 w-20 rounded-md border border-border bg-muted/40 flex items-center justify-center hover:border-primary/40 transition-colors"
                >
                  <span className="text-xs text-muted-foreground font-mono">+{photos.length - 4}</span>
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mini-map */}
      {station.latitude !== 0 && station.longitude !== 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">Ubicación</p>
          <StationMiniMap latitude={station.latitude} longitude={station.longitude} />
          <Link
            href={`/projects/${projectId}/map?center_lat=${station.latitude}&center_lng=${station.longitude}&center_zoom=16`}
            className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <MapViewIcon className="h-3 w-3" />
            Ver en mapa completo
          </Link>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
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
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-16 rounded-lg" />)}
            </div>
          ) : lithologies.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No hay registros de litología</p>
              <Button size="sm" variant="outline" onClick={() => { setLithoEdit(null); setLithoOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar litología
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Grupo / Tipo</th>
                    <th className="hidden sm:table-cell">Color · Textura</th>
                    <th className="hidden md:table-cell">Mineralogía</th>
                    <th className="hidden lg:table-cell">Alteración</th>
                    <th className="hidden xl:table-cell">Notas</th>
                    <th className="text-right w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {lithologies.map((litho) => (
                    <tr key={litho.id} className="group">
                      <td>
                        <div className="space-y-0.5">
                          <Badge className="text-xs">{litho.rockGroup}</Badge>
                          <p className="text-xs text-muted-foreground">{litho.rockType}</p>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell text-xs text-muted-foreground">
                        {litho.color} · {litho.texture}
                      </td>
                      <td className="hidden md:table-cell text-xs text-muted-foreground">
                        {litho.mineralogy || '—'}
                      </td>
                      <td className="hidden lg:table-cell text-xs text-muted-foreground">
                        {litho.alteration || '—'}
                      </td>
                      <td className="hidden xl:table-cell text-xs text-muted-foreground italic max-w-[160px]">
                        <span className="block truncate">{litho.notes || '—'}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setLithoEdit(litho); setLithoOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setLithoDelete(litho)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="rounded-lg border border-border overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-6 px-4 py-3 border-b border-border last:border-0">
                  <div className="skeleton h-5 w-20 rounded-full" />
                  <div className="skeleton h-4 w-24 rounded" />
                  <div className="skeleton h-4 w-16 rounded hidden md:block" />
                </div>
              ))}
            </div>
          ) : structural.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No hay datos estructurales</p>
              <Button size="sm" variant="outline" onClick={() => { setStructEdit(null); setStructOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar estructura
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Rumbo / Buz.</th>
                    <th className="hidden md:table-cell">Movimiento</th>
                    <th className="hidden lg:table-cell">Rugosidad</th>
                    <th className="hidden lg:table-cell">Espesor</th>
                    <th className="text-right w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {structural.map((s) => (
                    <tr key={s.id} className="group">
                      <td>
                        <Badge className="text-xs">{s.type}</Badge>
                      </td>
                      <td className="font-mono text-xs font-semibold">
                        {s.strike}° / {s.dip}° {s.dipDirection}
                      </td>
                      <td className="hidden md:table-cell text-xs text-muted-foreground">
                        {s.movement ? <Badge variant="secondary" className="text-xs">{s.movement}</Badge> : '—'}
                      </td>
                      <td className="hidden lg:table-cell text-xs text-muted-foreground">{s.roughness ?? '—'}</td>
                      <td className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                        {s.thickness != null ? `${s.thickness} m` : '—'}
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setStructEdit(s); setStructOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setStructDelete(s)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="rounded-lg border border-border overflow-hidden">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-6 px-4 py-3 border-b border-border last:border-0">
                  <div className="skeleton h-5 w-16 rounded" />
                  <div className="skeleton h-5 w-20 rounded-full" />
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-4 w-28 rounded hidden md:block" />
                </div>
              ))}
            </div>
          ) : samples.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <FlaskConical className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No hay muestras registradas</p>
              <Button size="sm" variant="outline" onClick={() => { setSampleEdit(null); setSampleOpen(true); }}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Agregar muestra
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th className="hidden md:table-cell">Peso</th>
                    <th className="hidden lg:table-cell">Descripción</th>
                    <th className="text-right w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((sample) => (
                    <tr key={sample.id} className="group">
                      <td>
                        <Badge variant="outline" className="font-mono text-xs">{sample.code}</Badge>
                      </td>
                      <td>
                        <Badge className="text-xs">{sample.type}</Badge>
                      </td>
                      <td>
                        <Badge
                          variant={sample.status === 'Resultados Recibidos' ? 'default' : 'secondary'}
                          className={`text-xs ${sample.status === 'Resultados Recibidos' ? 'bg-green-600/20 text-green-400 border-green-500/30' : ''}`}
                        >
                          {sample.status}
                        </Badge>
                      </td>
                      <td className="hidden md:table-cell font-mono text-xs text-muted-foreground">
                        {sample.weight != null ? `${sample.weight} kg` : '—'}
                      </td>
                      <td className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px]">
                        <span className="block truncate">{sample.description || '—'}</span>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSampleEdit(sample); setSampleOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setSampleDelete(sample)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
