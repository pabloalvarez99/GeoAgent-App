'use client';

import { useState, useEffect } from 'react';
import type { GeoPhoto } from '@geoagent/geo-shared/types';
import { subscribeToPhotos, deletePhoto } from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/firebase/auth';

export function usePhotos(filters: { projectId?: string; stationId?: string; drillHoleId?: string }) {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<GeoPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key = filters.projectId || filters.stationId || filters.drillHoleId;
    if (!user || !key) {
      setPhotos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToPhotos(user.uid, filters, (data) => {
      setPhotos(data as GeoPhoto[]);
      setLoading(false);
    });
    return unsub;
  }, [user, filters.projectId, filters.stationId, filters.drillHoleId]);

  async function removePhoto(id: string) {
    if (!user) throw new Error('No autenticado');
    await deletePhoto(user.uid, id);
  }

  return { photos, loading, removePhoto };
}
