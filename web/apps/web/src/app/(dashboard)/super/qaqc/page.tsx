'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos, subscribeQAQC } from '@/lib/firebase/orgs';
import { ShewhartChart } from '@/components/qaqc/shewhart-chart';
import { DuplicatesScatter } from '@/components/qaqc/duplicates-scatter';
import { StandardsBias } from '@/components/qaqc/standards-bias';
import type { Faena, Yacimiento } from '@/types/org';
import type { QAQCBatch } from '@/types/reconc';

export default function QAQCPage() {
  const { currentOrg } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Yacimiento[]>([]);
  const [selectedYac, setSelectedYac] = useState<string>('');
  const [batches, setBatches] = useState<QAQCBatch[]>([]);

  useEffect(() => { if (currentOrg) return subscribeFaenas(currentOrg.id, setFaenas); }, [currentOrg]);
  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) => subscribeYacimientos(currentOrg.id, f.id, (items) => {
      setYacs((prev) => [...prev.filter((y) => y.faenaId !== f.id), ...items]);
    }));
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);
  useEffect(() => {
    if (!currentOrg || !selectedYac) return;
    const y = yacs.find((x) => x.id === selectedYac);
    if (!y) return;
    return subscribeQAQC(currentOrg.id, y.faenaId, y.id, setBatches);
  }, [currentOrg, selectedYac, yacs]);

  const dupGrueso = batches.filter((b) => b.tipo === 'dup_grueso' && b.valorOrig != null && b.valorCheck != null)
    .map((b) => ({ orig: b.valorOrig!, check: b.valorCheck! }));
  const dupPulpa = batches.filter((b) => b.tipo === 'dup_pulpa' && b.valorOrig != null && b.valorCheck != null)
    .map((b) => ({ orig: b.valorOrig!, check: b.valorCheck! }));
  const stds = batches.filter((b) => b.tipo === 'std' && b.valorOrig != null && b.valorEsperado != null)
    .map((b) => ({ medido: b.valorOrig!, esperado: b.valorEsperado! }));
  const blanks = batches.filter((b) => b.tipo === 'blank' && b.valorOrig != null).map((b) => b.valorOrig!);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">QA/QC</h1>
      </header>
      <select value={selectedYac} onChange={(e) => setSelectedYac(e.target.value)} className="border rounded px-3 py-2 bg-background">
        <option value="">Selecciona yacimiento…</option>
        {yacs.map((y) => <option key={y.id} value={y.id}>{y.nombre}</option>)}
      </select>

      {selectedYac && (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2">Estándares certificados (bias %)</h2>
            {stds.length > 0 ? <StandardsBias pairs={stds} /> : <p className="text-muted-foreground">Sin estándares.</p>}
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Duplicados gruesos (HARD ±10%)</h2>
            {dupGrueso.length > 0 ? <DuplicatesScatter pairs={dupGrueso} limitPct={0.1} /> : <p className="text-muted-foreground">Sin duplicados gruesos.</p>}
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Duplicados pulpa (HARD ±20%)</h2>
            {dupPulpa.length > 0 ? <DuplicatesScatter pairs={dupPulpa} limitPct={0.2} /> : <p className="text-muted-foreground">Sin duplicados pulpa.</p>}
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Blancos</h2>
            {blanks.length > 0 ? <ShewhartChart values={blanks} /> : <p className="text-muted-foreground">Sin blancos.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
