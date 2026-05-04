'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ROLE_LABELS, type Member, type Role } from '@/types/org';

const ROLES: Role[] = ['super_geol', 'geol_senior', 'geol_mina', 'qaqc', 'geotec', 'visitante'];

export function RoleMatrixEditor({ orgId, member }: { orgId: string; member: Member }) {
  const [role, setRole] = useState<Role>(member.role);
  const [activo, setActivo] = useState(member.activo);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'orgs', orgId, 'members', member.uid), { role, activo });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b py-3">
      <div className="flex-1">
        <div className="font-medium">{member.nombre}</div>
        <div className="text-xs text-muted-foreground">{member.email}</div>
      </div>
      <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="border rounded px-2 py-1 bg-background">
        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Activo
      </label>
      <button onClick={save} disabled={saving} className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm">
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </div>
  );
}
