'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos, subscribeReconc, subscribeQAQC } from '@/lib/firebase/orgs';
import { CockpitTile } from '@/components/super/cockpit-tile';
import { classifyFactor } from '@/lib/data/reconc';
import type { Reconciliacion, QAQCBatch } from '@/types/reconc';
import type { Faena, Yacimiento } from '@/types/org';

export default function CockpitPage() {
  const { currentOrg, member } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Yacimiento[]>([]);
  const [reconcs, setReconcs] = useState<Reconciliacion[]>([]);
  const [qaqcs, setQaqcs] = useState<QAQCBatch[]>([]);

  useEffect(() => {
    if (!currentOrg) return;
    return subscribeFaenas(currentOrg.id, setFaenas);
  }, [currentOrg]);

  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) =>
      subscribeYacimientos(currentOrg.id, f.id, (items) =>
        setYacs((prev) => {
          const filtered = prev.filter((y) => y.faenaId !== f.id);
          return [...filtered, ...items];
        }),
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);

  useEffect(() => {
    if (!currentOrg || yacs.length === 0) return;
    const allReconc: Reconciliacion[] = [];
    const allQaqc: QAQCBatch[] = [];
    const unsubs = yacs.flatMap((y) => [
      subscribeReconc(currentOrg.id, y.faenaId, y.id, (items) => {
        allReconc.push(...items);
        setReconcs([...allReconc]);
      }),
      subscribeQAQC(currentOrg.id, y.faenaId, y.id, (items) => {
        allQaqc.push(...items);
        setQaqcs([...allQaqc]);
      }),
    ]);
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, yacs]);

  if (!currentOrg || !member) {
    return <div className="p-6">Cargando organización…</div>;
  }

  const lastReconc = [...reconcs].sort((a, b) => b.mes.localeCompare(a.mes))[0];
  const lastFactor = lastReconc?.factor_metal_cu ?? null;
  const factorStatus = classifyFactor(lastFactor);

  const failQaqc = qaqcs.filter((q) => q.status === 'fail').length;
  const totalQaqc = qaqcs.length || 1;
  const failRate = (failQaqc / totalQaqc) * 100;
  const qaqcStatus: 'ok' | 'warning' | 'critical' = failRate < 5 ? 'ok' : failRate < 10 ? 'warning' : 'critical';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Cockpit · {currentOrg.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          Hola {member.nombre} · {member.role}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CockpitTile
          title="Reconciliación (último mes)"
          kpi={lastFactor != null ? lastFactor.toFixed(3) : '—'}
          status={factorStatus}
          subtitle={lastReconc ? `Factor metal Cu · ${lastReconc.mes}` : 'Sin datos'}
          href="/super/reconc"
        />
        <CockpitTile
          title="QA/QC Fail Rate"
          kpi={`${failRate.toFixed(1)}%`}
          status={qaqcStatus}
          subtitle={`${failQaqc} fails de ${totalQaqc} batches`}
          href="/super/qaqc"
        />
        <CockpitTile
          title="Recursos & Reservas"
          kpi={`${yacs.length}`}
          subtitle="yacimientos activos"
          href="/super/recursos"
        />
        <CockpitTile
          title="Sondajes activos"
          kpi="—"
          subtitle="ver detalle"
          href="/super/sondajes"
        />
      </div>
    </div>
  );
}
