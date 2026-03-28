'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  type Query,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './client';
import { COLLECTIONS } from '@geoagent/geo-shared/constants';

// Base path for all user data — mirrors Android: users/{userId}/{collection}
export function userCollection(userId: string, col: string) {
  return collection(db, 'users', userId, col);
}

export function userDoc(userId: string, col: string, docId: string) {
  return doc(db, 'users', userId, col, docId);
}

// Generic real-time listener — returns unsubscribe function
export function subscribeToCollection<T>(
  q: Query<DocumentData>,
  onData: (items: T[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
      onData(items);
    },
    (err) => onError?.(err),
  );
}

// Projects
export function subscribeToProjects(userId: string, onData: (items: any[]) => void) {
  const q = query(
    userCollection(userId, COLLECTIONS.PROJECTS),
    orderBy('updatedAt', 'desc'),
  );
  return subscribeToCollection(q, onData);
}

export async function createProject(userId: string, data: Omit<any, 'id'>) {
  return addDoc(userCollection(userId, COLLECTIONS.PROJECTS), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateProject(userId: string, projectId: string, data: Partial<any>) {
  return updateDoc(userDoc(userId, COLLECTIONS.PROJECTS, projectId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProject(userId: string, projectId: string) {
  return deleteDoc(userDoc(userId, COLLECTIONS.PROJECTS, projectId));
}

// Stations
export function subscribeToStations(
  userId: string,
  projectId: string,
  onData: (items: any[]) => void,
) {
  const q = query(
    userCollection(userId, COLLECTIONS.STATIONS),
    where('projectId', '==', projectId),
    orderBy('updatedAt', 'desc'),
  );
  return subscribeToCollection(q, onData);
}

export async function createStation(userId: string, data: Omit<any, 'id'>) {
  return addDoc(userCollection(userId, COLLECTIONS.STATIONS), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateStation(userId: string, stationId: string, data: Partial<any>) {
  return updateDoc(userDoc(userId, COLLECTIONS.STATIONS, stationId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteStation(userId: string, stationId: string) {
  return deleteDoc(userDoc(userId, COLLECTIONS.STATIONS, stationId));
}

// Lithologies
export function subscribeToLithologies(
  userId: string,
  stationId: string,
  onData: (items: any[]) => void,
) {
  const q = query(
    userCollection(userId, COLLECTIONS.LITHOLOGIES),
    where('stationId', '==', stationId),
  );
  return subscribeToCollection(q, onData);
}

export async function saveLithology(userId: string, data: any, existingId?: string) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (existingId) {
    return updateDoc(userDoc(userId, COLLECTIONS.LITHOLOGIES, existingId), payload);
  }
  return addDoc(userCollection(userId, COLLECTIONS.LITHOLOGIES), payload);
}

export async function deleteLithology(userId: string, id: string) {
  return deleteDoc(userDoc(userId, COLLECTIONS.LITHOLOGIES, id));
}

// Structural data
export function subscribeToStructural(
  userId: string,
  stationId: string,
  onData: (items: any[]) => void,
) {
  const q = query(
    userCollection(userId, COLLECTIONS.STRUCTURAL_DATA),
    where('stationId', '==', stationId),
  );
  return subscribeToCollection(q, onData);
}

export async function saveStructural(userId: string, data: any, existingId?: string) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (existingId) {
    return updateDoc(userDoc(userId, COLLECTIONS.STRUCTURAL_DATA, existingId), payload);
  }
  return addDoc(userCollection(userId, COLLECTIONS.STRUCTURAL_DATA), payload);
}

export async function deleteStructural(userId: string, id: string) {
  return deleteDoc(userDoc(userId, COLLECTIONS.STRUCTURAL_DATA, id));
}

// Samples
export function subscribeToSamples(
  userId: string,
  stationId: string,
  onData: (items: any[]) => void,
) {
  const q = query(
    userCollection(userId, COLLECTIONS.SAMPLES),
    where('stationId', '==', stationId),
  );
  return subscribeToCollection(q, onData);
}

export async function saveSample(userId: string, data: any, existingId?: string) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (existingId) {
    return updateDoc(userDoc(userId, COLLECTIONS.SAMPLES, existingId), payload);
  }
  return addDoc(userCollection(userId, COLLECTIONS.SAMPLES), payload);
}

export async function deleteSample(userId: string, id: string) {
  return deleteDoc(userDoc(userId, COLLECTIONS.SAMPLES, id));
}

// Drill holes
export function subscribeToDrillHoles(
  userId: string,
  projectId: string,
  onData: (items: any[]) => void,
) {
  const q = query(
    userCollection(userId, COLLECTIONS.DRILL_HOLES),
    where('projectId', '==', projectId),
    orderBy('updatedAt', 'desc'),
  );
  return subscribeToCollection(q, onData);
}

export async function createDrillHole(userId: string, data: Omit<any, 'id'>) {
  return addDoc(userCollection(userId, COLLECTIONS.DRILL_HOLES), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function updateDrillHole(userId: string, drillHoleId: string, data: Partial<any>) {
  return updateDoc(userDoc(userId, COLLECTIONS.DRILL_HOLES, drillHoleId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDrillHole(userId: string, drillHoleId: string) {
  return deleteDoc(userDoc(userId, COLLECTIONS.DRILL_HOLES, drillHoleId));
}

// Drill intervals
export function subscribeToDrillIntervals(
  userId: string,
  drillHoleId: string,
  onData: (items: any[]) => void,
) {
  const q = query(
    userCollection(userId, COLLECTIONS.DRILL_INTERVALS),
    where('drillHoleId', '==', drillHoleId),
    orderBy('fromDepth', 'asc'),
  );
  return subscribeToCollection(q, onData);
}

export async function saveDrillInterval(userId: string, data: any, existingId?: string) {
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (existingId) {
    return updateDoc(userDoc(userId, COLLECTIONS.DRILL_INTERVALS, existingId), payload);
  }
  return addDoc(userCollection(userId, COLLECTIONS.DRILL_INTERVALS), payload);
}

export async function deleteDrillInterval(userId: string, id: string) {
  return deleteDoc(userDoc(userId, COLLECTIONS.DRILL_INTERVALS, id));
}

// Photos
export function subscribeToPhotos(
  userId: string,
  filters: { projectId?: string; stationId?: string; drillHoleId?: string },
  onData: (items: any[]) => void,
) {
  let q = query(userCollection(userId, COLLECTIONS.PHOTOS));
  if (filters.projectId) {
    q = query(q, where('projectId', '==', filters.projectId));
  } else if (filters.stationId) {
    q = query(q, where('stationId', '==', filters.stationId));
  } else if (filters.drillHoleId) {
    q = query(q, where('drillHoleId', '==', filters.drillHoleId));
  }
  return subscribeToCollection(q, onData);
}

export async function deletePhoto(userId: string, photoId: string) {
  return deleteDoc(userDoc(userId, COLLECTIONS.PHOTOS, photoId));
}

// ── One-time reads for exports ──────────────────────────────────────────────
async function getAll<T>(q: Query<DocumentData>): Promise<T[]> {
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
}

export async function getStationsOnce(userId: string, projectId: string) {
  return getAll(
    query(userCollection(userId, COLLECTIONS.STATIONS), where('projectId', '==', projectId)),
  );
}

export async function getDrillHolesOnce(userId: string, projectId: string) {
  return getAll(
    query(userCollection(userId, COLLECTIONS.DRILL_HOLES), where('projectId', '==', projectId)),
  );
}

export async function getLithologiesOnce(userId: string, stationId: string) {
  return getAll(
    query(userCollection(userId, COLLECTIONS.LITHOLOGIES), where('stationId', '==', stationId)),
  );
}

export async function getStructuralOnce(userId: string, stationId: string) {
  return getAll(
    query(userCollection(userId, COLLECTIONS.STRUCTURAL_DATA), where('stationId', '==', stationId)),
  );
}

export async function getSamplesOnce(userId: string, stationId: string) {
  return getAll(
    query(userCollection(userId, COLLECTIONS.SAMPLES), where('stationId', '==', stationId)),
  );
}

export async function getIntervalsOnce(userId: string, drillHoleId: string) {
  return getAll(
    query(
      userCollection(userId, COLLECTIONS.DRILL_INTERVALS),
      where('drillHoleId', '==', drillHoleId),
      orderBy('fromDepth', 'asc'),
    ),
  );
}
