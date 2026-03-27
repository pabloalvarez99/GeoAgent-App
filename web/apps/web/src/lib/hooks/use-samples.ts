'use client';

import { useState, useEffect } from 'react';
import type { GeoSample } from '@geoagent/geo-shared/types';
import {
  subscribeToSamples,
  saveSample,
  deleteSample,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/firebase/auth';

export function useSamples(stationId: string) {
  const { user } = useAuth();
  const [samples, setSamples] = useState<GeoSample[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !stationId) {
      setSamples([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToSamples(user.uid, stationId, (data) => {
      setSamples(data as GeoSample[]);
      setLoading(false);
    });
    return unsub;
  }, [user, stationId]);

  async function addOrUpdateSample(data: Omit<GeoSample, 'id'>, existingId?: string) {
    if (!user) throw new Error('No autenticado');
    await saveSample(user.uid, data, existingId);
  }

  async function removeSample(id: string) {
    if (!user) throw new Error('No autenticado');
    await deleteSample(user.uid, id);
  }

  return { samples, loading, addOrUpdateSample, removeSample };
}
