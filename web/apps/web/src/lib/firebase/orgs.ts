'use client';

import {
  collection, doc, getDoc, getDocs, query, orderBy, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './client';
import type { Member, Org, Faena, Yacimiento } from '@/types/org';
import type { Reconciliacion, ResourceModel, QAQCBatch } from '@/types/reconc';

export async function fetchUserOrgs(uid: string): Promise<Org[]> {
  const q = query(collection(db, 'orgs'));
  const snap = await getDocs(q);
  const orgs: Org[] = [];
  for (const d of snap.docs) {
    const memberSnap = await getDoc(doc(db, 'orgs', d.id, 'members', uid));
    if (memberSnap.exists() && memberSnap.data().activo) {
      orgs.push({ id: d.id, ...(d.data() as Omit<Org, 'id'>) });
    }
  }
  return orgs;
}

export async function fetchMember(orgId: string, uid: string): Promise<Member | null> {
  const s = await getDoc(doc(db, 'orgs', orgId, 'members', uid));
  if (!s.exists()) return null;
  return { uid, ...(s.data() as Omit<Member, 'uid'>) };
}

export function subscribeFaenas(
  orgId: string,
  cb: (items: Faena[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'orgs', orgId, 'faenas'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Faena, 'id'>) })));
  });
}

export function subscribeYacimientos(
  orgId: string,
  faenaId: string,
  cb: (items: Yacimiento[]) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos'),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Yacimiento, 'id'>) })))
  );
}

export function subscribeReconc(
  orgId: string,
  faenaId: string,
  yacId: string,
  cb: (items: Reconciliacion[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos', yacId, 'reconciliacion'),
    orderBy('mes', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reconciliacion, 'id'>) }))),
  );
}

export function subscribeResourceModel(
  orgId: string, faenaId: string, yacId: string,
  cb: (items: ResourceModel[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos', yacId, 'resourceModel'),
    orderBy('periodo', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResourceModel, 'id'>) }))),
  );
}

export function subscribeQAQC(
  orgId: string, faenaId: string, yacId: string,
  cb: (items: QAQCBatch[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos', yacId, 'qaqc'),
    orderBy('fecha', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QAQCBatch, 'id'>) }))),
  );
}
