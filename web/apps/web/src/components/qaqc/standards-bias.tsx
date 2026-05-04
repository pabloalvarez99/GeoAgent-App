'use client';

import { ShewhartChart } from './shewhart-chart';

interface BiasInput { medido: number; esperado: number; }

export function StandardsBias({ pairs }: { pairs: BiasInput[] }) {
  const biasSeries = pairs
    .filter((p) => p.esperado > 0)
    .map((p) => ((p.medido - p.esperado) / p.esperado) * 100);
  return <ShewhartChart values={biasSeries} />;
}
