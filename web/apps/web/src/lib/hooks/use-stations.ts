'use client';

import { useState, useEffect } from 'react';
import type { GeoStation } from '@geoagent/geo-shared/types';
import {
  subscribeToStations,
  createStation,
  updateStation,
  deleteStation,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/firebase/auth';

export function useStations(projectId: string) {
  const { user } = useAuth();
  const [stations, setStations] = useState<GeoStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) {
      setStations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToStations(user.uid, projectId, (data) => {
      setStations(data as GeoStation[]);
      setLoading(false);
    });
    return unsub;
  }, [user, projectId]);

  async function addStation(data: Omit<GeoStation, 'id'>) {
    if (!user) throw new Error('No autenticado');
    await createStation(user.uid, data);
  }

  async function editStation(id: string, data: Partial<GeoStation>) {
    if (!user) throw new Error('No autenticado');
    await updateStation(user.uid, id, data);
  }

  async function removeStation(id: string) {
    if (!user) throw new Error('No autenticado');
    await deleteStation(user.uid, id);
  }

  return { stations, loading, addStation, editStation, removeStation };
}
