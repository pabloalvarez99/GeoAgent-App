'use client';

import { useState, useEffect } from 'react';
import type { GeoStructural } from '@geoagent/geo-shared/types';
import {
  subscribeToStructural,
  saveStructural,
  deleteStructural,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/firebase/auth';

export function useStructural(stationId: string) {
  const { user } = useAuth();
  const [structural, setStructural] = useState<GeoStructural[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !stationId) {
      setStructural([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToStructural(user.uid, stationId, (data) => {
      setStructural(data as GeoStructural[]);
      setLoading(false);
    });
    return unsub;
  }, [user, stationId]);

  async function addOrUpdateStructural(data: Omit<GeoStructural, 'id'>, existingId?: string) {
    if (!user) throw new Error('No autenticado');
    await saveStructural(user.uid, data, existingId);
  }

  async function removeStructural(id: string) {
    if (!user) throw new Error('No autenticado');
    await deleteStructural(user.uid, id);
  }

  return { structural, loading, addOrUpdateStructural, removeStructural };
}
