'use client';

import Link from 'next/link';
import { useOrg } from '@/lib/auth/org-context';

export default function OrgAdminPage() {
  const { currentOrg, member } = useOrg();
  if (!currentOrg || !member) return <div className="p-6">Cargando…</div>;
  if (member.role !== 'super_geol') return <div className="p-6">Solo super_geol puede administrar la org.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Administración · {currentOrg.nombre}</h1>
      <ul className="space-y-2">
        <li><Link href="/admin/org/members" className="underline">Miembros & roles</Link></li>
        <li><Link href="/admin/org/faenas" className="underline">Faenas & yacimientos</Link></li>
      </ul>
    </div>
  );
}
