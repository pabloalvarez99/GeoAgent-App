'use client';

import { useState, useEffect } from 'react';
import type { GeoProject } from '@geoagent/geo-shared/types';
import {
  subscribeToProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/firebase/firestore';
import { useAuth } from '@/lib/firebase/auth';

export function useProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<GeoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeToProjects(
      user.uid,
      (data) => {
        setProjects(data as GeoProject[]);
        setLoading(false);
        setError(null);
      },
    );
    return unsub;
  }, [user]);

  async function addProject(data: Omit<GeoProject, 'id'>) {
    if (!user) throw new Error('No autenticado');
    await createProject(user.uid, data);
  }

  async function editProject(id: string, data: Partial<GeoProject>) {
    if (!user) throw new Error('No autenticado');
    await updateProject(user.uid, id, data);
  }

  async function removeProject(id: string) {
    if (!user) throw new Error('No autenticado');
    await deleteProject(user.uid, id);
  }

  return { projects, loading, error, addProject, editProject, removeProject };
}

export function useProject(projectId: string) {
  const { projects, loading } = useProjects();
  const project = projects.find((p) => p.id === projectId) ?? null;
  return { project, loading };
}
