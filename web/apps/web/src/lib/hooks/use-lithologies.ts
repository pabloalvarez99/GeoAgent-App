'use client';

import { useState, useEffect } from 'react';
import type { GeoLithology } from '@geoagent/geo-shared/types';
import {
  subscribeToLithologies,
  saveLithology,
  deleteLithology,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/firebase/auth';

export function useLithologies(stationId: string) {
  const { user } = useAuth();
  const [lithologies, setLithologies] = useState<GeoLithology[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !stationId) {
      setLithologies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToLithologies(user.uid, stationId, (data) => {
      setLithologies(data as GeoLithology[]);
      setLoading(false);
    });
    return unsub;
  }, [user, stationId]);

  async function addOrUpdateLithology(data: Omit<GeoLithology, 'id'>, existingId?: string) {
    if (!user) throw new Error('No autenticado');
    await saveLithology(user.uid, data, existingId);
  }

  async function removeLithology(id: string) {
    if (!user) throw new Error('No autenticado');
    await deleteLithology(user.uid, id);
  }

  return { lithologies, loading, addOrUpdateLithology, removeLithology };
}
