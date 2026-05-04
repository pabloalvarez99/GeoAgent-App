'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos } from '@/lib/firebase/orgs';
import { YacimientoForm } from '@/components/admin/yacimiento-form';
import type { Faena, Yacimiento } from '@/types/org';

export default function FaenasPage() {
  const { currentOrg, member } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Record<string, Yacimiento[]>>({});

  useEffect(() => { if (currentOrg) return subscribeFaenas(currentOrg.id, setFaenas); }, [currentOrg]);
  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) => subscribeYacimientos(currentOrg.id, f.id, (items) =>
      setYacs((p) => ({ ...p, [f.id]: items }))));
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);

  if (!currentOrg || !member) return <div className="p-6">Cargando…</div>;
  if (member.role !== 'super_geol') return <div className="p-6">Acceso denegado.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Faenas & Yacimientos</h1>
      {faenas.map((f) => (
        <section key={f.id} className="border rounded p-4 space-y-3">
          <h2 className="text-lg font-semibold">{f.nombre} · {f.region}</h2>
          <ul className="text-sm space-y-1">
            {(yacs[f.id] ?? []).map((y) => (
              <li key={y.id} className="flex gap-2">
                <span className="font-medium">{y.nombre}</span>
                <span className="text-muted-foreground">{y.tipo} · {y.modelo}</span>
              </li>
            ))}
          </ul>
          <YacimientoForm orgId={currentOrg.id} faenaId={f.id} onCreated={() => {}} />
        </section>
      ))}
    </div>
  );
}
