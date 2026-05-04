'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos, subscribeReconc } from '@/lib/firebase/orgs';
import { FactorChart } from '@/components/reconc/factor-chart';
import { CumulativeCurve } from '@/components/reconc/cumulative-curve';
import type { Faena, Yacimiento } from '@/types/org';
import type { Reconciliacion } from '@/types/reconc';

export default function ReconcPage() {
  const { currentOrg } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Yacimiento[]>([]);
  const [selectedYac, setSelectedYac] = useState<string>('');
  const [data, setData] = useState<Reconciliacion[]>([]);

  useEffect(() => {
    if (!currentOrg) return;
    return subscribeFaenas(currentOrg.id, setFaenas);
  }, [currentOrg]);

  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) =>
      subscribeYacimientos(currentOrg.id, f.id, (items) => {
        setYacs((prev) => [...prev.filter((y) => y.faenaId !== f.id), ...items]);
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);

  useEffect(() => {
    if (!currentOrg || !selectedYac) return;
    const yac = yacs.find((y) => y.id === selectedYac);
    if (!yac) return;
    return subscribeReconc(currentOrg.id, yac.faenaId, yac.id, setData);
  }, [currentOrg, selectedYac, yacs]);

  if (!currentOrg) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Reconciliación Mina-Planta</h1>
      </header>

      <select
        value={selectedYac}
        onChange={(e) => setSelectedYac(e.target.value)}
        className="border rounded px-3 py-2 bg-background"
      >
        <option value="">Selecciona yacimiento…</option>
        {yacs.map((y) => (
          <option key={y.id} value={y.id}>{y.nombre}</option>
        ))}
      </select>

      {selectedYac && data.length > 0 ? (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2">Factor metal Cu</h2>
            <FactorChart data={data} metric="factor_metal_cu" />
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Curva acumulada (toneladas)</h2>
            <CumulativeCurve data={data} />
          </section>
        </div>
      ) : selectedYac ? (
        <p className="text-muted-foreground">Sin datos de reconciliación para este yacimiento.</p>
      ) : null}
    </div>
  );
}
