'use client';

import { useState, useEffect } from 'react';
import type { GeoDrillHole, GeoDrillInterval } from '@geoagent/geo-shared/types';
import {
  subscribeToDrillHoles,
  subscribeToDrillIntervals,
  createDrillHole,
  updateDrillHole,
  deleteDrillHole,
  saveDrillInterval,
  deleteDrillInterval,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/firebase/auth';

export function useDrillHoles(projectId: string) {
  const { user } = useAuth();
  const [drillHoles, setDrillHoles] = useState<GeoDrillHole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) {
      setDrillHoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToDrillHoles(user.uid, projectId, (data) => {
      setDrillHoles(data as GeoDrillHole[]);
      setLoading(false);
    });
    return unsub;
  }, [user, projectId]);

  async function addDrillHole(data: Omit<GeoDrillHole, 'id'>) {
    if (!user) throw new Error('No autenticado');
    await createDrillHole(user.uid, data);
  }

  async function editDrillHole(id: string, data: Partial<GeoDrillHole>) {
    if (!user) throw new Error('No autenticado');
    await updateDrillHole(user.uid, id, data);
  }

  async function removeDrillHole(id: string) {
    if (!user) throw new Error('No autenticado');
    await deleteDrillHole(user.uid, id);
  }

  return { drillHoles, loading, addDrillHole, editDrillHole, removeDrillHole };
}

export function useDrillIntervals(drillHoleId: string) {
  const { user } = useAuth();
  const [intervals, setIntervals] = useState<GeoDrillInterval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !drillHoleId) {
      setIntervals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToDrillIntervals(user.uid, drillHoleId, (data) => {
      setIntervals(data as GeoDrillInterval[]);
      setLoading(false);
    });
    return unsub;
  }, [user, drillHoleId]);

  async function saveInterval(data: Omit<GeoDrillInterval, 'id'>, existingId?: string) {
    if (!user) throw new Error('No autenticado');
    await saveDrillInterval(user.uid, data, existingId);
  }

  async function removeInterval(id: string) {
    if (!user) throw new Error('No autenticado');
    await deleteDrillInterval(user.uid, id);
  }

  return { intervals, loading, saveInterval, removeInterval };
}
