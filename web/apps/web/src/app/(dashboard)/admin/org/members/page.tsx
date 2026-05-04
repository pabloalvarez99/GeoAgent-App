'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useOrg } from '@/lib/auth/org-context';
import { RoleMatrixEditor } from '@/components/admin/role-matrix-editor';
import type { Member } from '@/types/org';

export default function MembersPage() {
  const { currentOrg, member } = useOrg();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!currentOrg) return;
    return onSnapshot(collection(db, 'orgs', currentOrg.id, 'members'), (snap) => {
      setMembers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Member, 'uid'>) })));
    });
  }, [currentOrg]);

  if (!currentOrg || !member) return <div className="p-6">Cargando…</div>;
  if (member.role !== 'super_geol') return <div className="p-6">Acceso denegado.</div>;

  return (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-bold">Miembros</h1>
      {members.map((m) => <RoleMatrixEditor key={m.uid} orgId={currentOrg.id} member={m} />)}
    </div>
  );
}
