'use client';

import { use, useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ref as storageRef, getDownloadURL, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase/client';
import { userCollection } from '@/lib/firebase/firestore';
import { usePhotos } from '@/lib/hooks/use-photos';
import { useProject } from '@/lib/hooks/use-projects';
import { useAuth } from '@/lib/firebase/auth';
import { COLLECTIONS } from '@geoagent/geo-shared/constants';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Loader2,
  ImageIcon,
  MapPin,
  CalendarDays,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import type { GeoPhoto } from '@geoagent/geo-shared/types';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

// Skeleton card shown while photos are loading
function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-square bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-3 bg-muted rounded w-1/2" />
      </div>
    </div>
  );
}

export default function ProjectPhotosPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const { user } = useAuth();
  const { project } = useProject(projectId);
  const { photos, loading, removePhoto } = usePhotos({ projectId });

  // Map of photoId → download URL
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  // Tracks which photo IDs have already been fetched (avoids re-fetching on every list update)
  const fetchedIdsRef = useRef<Set<string>>(new Set());
  // Which photo is open in the lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<GeoPhoto | null>(null);
  // Which photo is pending deletion confirmation
  const [deleteTarget, setDeleteTarget] = useState<GeoPhoto | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Upload state
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | File[]) {
    if (!user || files.length === 0) return;
    setUploading(true);
    const arr = Array.from(files);
    try {
      await Promise.all(
        arr.map(async (file) => {
          const uniqueName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const path = `photos/${user.uid}/${uniqueName}`;
          const fileRef = storageRef(storage, path);
          await uploadBytesResumable(fileRef, file).then(
            () => Promise.resolve(),
            (err) => { throw err; },
          );
          const downloadUrl = await getDownloadURL(fileRef);
          const docRef = await addDoc(userCollection(user.uid, COLLECTIONS.PHOTOS), {
            projectId,
            fileName: file.name,
            storagePath: path,
            description: file.name.replace(/\.[^.]+$/, ''),
            takenAt: new Date().toISOString(),
            updatedAt: serverTimestamp(),
          });
          // Cache URL immediately so thumbnail renders without waiting for a second getDownloadURL
          fetchedIdsRef.current.add(docRef.id);
          setPhotoUrls((prev) => ({ ...prev, [docRef.id]: downloadUrl }));
        }),
      );
      toast.success(
        arr.length === 1
          ? '1 foto subida correctamente'
          : `${arr.length} fotos subidas correctamente`,
      );
    } catch (e) {
      console.error(e);
      toast.error('Error al subir las fotos');
    } finally {
      setUploading(false);
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length) uploadFiles(files);
    },
    [user, projectId],
  );

  // Fetch Firebase Storage download URLs — only for photos not yet cached
  useEffect(() => {
    const toFetch = photos.filter((p) => p.storagePath && !fetchedIdsRef.current.has(p.id));
    if (toFetch.length === 0) return;

    let cancelled = false;
    // Mark all as in-flight to prevent duplicate fetches if the effect re-runs
    toFetch.forEach((p) => fetchedIdsRef.current.add(p.id));

    (async () => {
      const updates: Record<string, string> = {};
      await Promise.all(
        toFetch.map(async (photo) => {
          try {
            const url = await getDownloadURL(storageRef(storage, photo.storagePath!));
            updates[photo.id] = url;
          } catch {
            // Photo missing from Storage — allow retry by removing from fetched set
            fetchedIdsRef.current.delete(photo.id);
          }
        }),
      );
      if (!cancelled && Object.keys(updates).length > 0) {
        setPhotoUrls((prev) => ({ ...prev, ...updates }));
      }
    })();

    return () => { cancelled = true; };
  }, [photos]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      // Delete the Storage file first to avoid orphaned files accumulating cost
      if (deleteTarget.storagePath) {
        try {
          await deleteObject(storageRef(storage, deleteTarget.storagePath));
        } catch {
          // File may already be missing from Storage — proceed with Firestore delete
        }
      }
      await removePhoto(deleteTarget.id);
      // Clean up caches
      fetchedIdsRef.current.delete(deleteTarget.id);
      setPhotoUrls((prev) => {
        const next = { ...prev };
        delete next[deleteTarget.id];
        return next;
      });
      // Close lightbox if the deleted photo was open
      if (lightboxPhoto?.id === deleteTarget.id) setLightboxPhoto(null);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const lightboxUrl = lightboxPhoto ? photoUrls[lightboxPhoto.id] : undefined;

  return (
    <div
      className="space-y-6"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 border-4 border-dashed border-primary rounded-xl pointer-events-none">
          <div className="text-center">
            <Upload className="h-12 w-12 text-primary mx-auto mb-2" />
            <p className="text-lg font-semibold text-primary">Suelta las imágenes aquí</p>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && uploadFiles(e.target.files)}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/projects/${projectId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Camera className="h-5 w-5 text-green-400" />
              Fotos
            </h1>
            {project && (
              <p className="text-sm text-muted-foreground">{project.name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!loading && photos.length > 0 && (
            <Badge variant="secondary">
              {photos.length} foto{photos.length !== 1 ? 's' : ''}
            </Badge>
          )}
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />Subiendo...</>
            ) : (
              <><Upload className="h-3.5 w-3.5 mr-2" />Subir fotos</>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        // Loading skeleton grid
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        // Empty state
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <div className="rounded-full bg-muted p-6">
            <Camera className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground">
              No hay fotos en este proyecto
            </p>
            <p className="text-sm text-muted-foreground/60">
              Arrastra imágenes aquí o usa el botón &quot;Subir fotos&quot;.
            </p>
          </div>
          <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-2" />
            Subir fotos
          </Button>
        </div>
      ) : (
        // Photo grid
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {photos.map((photo) => {
            const url = photoUrls[photo.id];
            return (
              <Card
                key={photo.id}
                className="group overflow-hidden border-border hover:border-primary/40 transition-colors cursor-pointer"
                onClick={() => url && setLightboxPhoto(photo)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-square bg-muted overflow-hidden">
                  {url ? (
                    <Image
                      src={url}
                      alt={photo.description ?? photo.fileName}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Delete button — visible on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(photo);
                    }}
                    className="absolute top-2 right-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive focus:outline-none"
                    aria-label="Eliminar foto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Caption */}
                <CardContent className="p-2.5 space-y-1">
                  <p className="text-xs font-medium truncate leading-tight">
                    {photo.description ?? photo.fileName}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    <span className="truncate">{formatDate(photo.takenAt)}</span>
                  </div>
                  {photo.latitude != null && photo.longitude != null && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="font-mono truncate">
                        {photo.latitude.toFixed(5)}, {photo.longitude.toFixed(5)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lightbox dialog */}
      <Dialog
        open={!!lightboxPhoto}
        onOpenChange={(open) => !open && setLightboxPhoto(null)}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-border">
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="text-white text-sm font-medium truncate">
              {lightboxPhoto?.description ?? lightboxPhoto?.fileName}
            </DialogTitle>
          </DialogHeader>

          {/* Full-size image */}
          <div className="relative w-full" style={{ minHeight: '60vh' }}>
            {lightboxUrl ? (
              <Image
                src={lightboxUrl}
                alt={lightboxPhoto?.description ?? lightboxPhoto?.fileName ?? 'Foto'}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center" style={{ minHeight: '60vh' }}>
                <Loader2 className="h-8 w-8 animate-spin text-white/40" />
              </div>
            )}
          </div>

          {/* Metadata footer */}
          {lightboxPhoto && (
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-white/10">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {formatDate(lightboxPhoto.takenAt)}
                </span>
                {lightboxPhoto.latitude != null && lightboxPhoto.longitude != null && (
                  <span className="flex items-center gap-1 font-mono">
                    <MapPin className="h-3 w-3" />
                    {lightboxPhoto.latitude.toFixed(5)}, {lightboxPhoto.longitude.toFixed(5)}
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground h-7 shrink-0"
                onClick={() => {
                  setDeleteTarget(lightboxPhoto);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Eliminar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente{' '}
              <strong>&quot;{deleteTarget?.description ?? deleteTarget?.fileName}&quot;</strong>.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Eliminando...
                </>
              ) : (
                'Eliminar foto'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
