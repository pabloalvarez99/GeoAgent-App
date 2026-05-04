'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos, subscribeResourceModel } from '@/lib/firebase/orgs';
import { JorcPyramid } from '@/components/resources/jorc-pyramid';
import type { Faena, Yacimiento } from '@/types/org';
import type { ResourceModel } from '@/types/reconc';

export default function RecursosPage() {
  const { currentOrg } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Yacimiento[]>([]);
  const [models, setModels] = useState<Record<string, ResourceModel[]>>({});

  useEffect(() => { if (currentOrg) return subscribeFaenas(currentOrg.id, setFaenas); }, [currentOrg]);
  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) => subscribeYacimientos(currentOrg.id, f.id, (items) =>
      setYacs((prev) => [...prev.filter((y) => y.faenaId !== f.id), ...items]),
    ));
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);
  useEffect(() => {
    if (!currentOrg || yacs.length === 0) return;
    const unsubs = yacs.map((y) => subscribeResourceModel(currentOrg.id, y.faenaId, y.id, (items) =>
      setModels((prev) => ({ ...prev, [y.id]: items })),
    ));
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, yacs]);

  return (
    <div className="p-4 md:p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Recursos & Reservas (JORC)</h1>
      </header>
      {yacs.map((y) => (
        <section key={y.id} className="space-y-2">
          <h2 className="text-lg font-semibold">{y.nombre}</h2>
          {(models[y.id]?.length ?? 0) > 0 ? (
            <JorcPyramid models={models[y.id]!} />
          ) : (
            <p className="text-muted-foreground">Sin modelo aprobado.</p>
          )}
        </section>
      ))}
    </div>
  );
}
