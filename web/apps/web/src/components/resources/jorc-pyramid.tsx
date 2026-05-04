'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import type { ResourceModel, JorcCategoria } from '@/types/reconc';

const ORDER: JorcCategoria[] = ['inferred', 'indicated', 'measured', 'probable', 'proven'];
const LABELS: Record<JorcCategoria, string> = {
  inferred: 'Inferido', indicated: 'Indicado', measured: 'Medido', probable: 'Probable', proven: 'Probado',
};
const COLORS: Record<JorcCategoria, string> = {
  inferred: '#94a3b8', indicated: '#60a5fa', measured: '#3b82f6', probable: '#10b981', proven: '#059669',
};

export function JorcPyramid({ models }: { models: ResourceModel[] }) {
  const totals = ORDER.map((cat) => {
    const docs = models.filter((m) => m.categoria === cat && m.status === 'approved');
    const tonelaje = docs.reduce((s, d) => s + d.tonelaje, 0);
    const ley_avg = docs.length ? docs.reduce((s, d) => s + d.ley_cu * d.tonelaje, 0) / (tonelaje || 1) : 0;
    return { categoria: LABELS[cat], tonelaje, ley_avg, color: COLORS[cat] };
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={totals} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="categoria" />
        <Tooltip
          formatter={(v: number, n: string) => n === 'tonelaje' ? `${v.toLocaleString()} t` : `${v.toFixed(2)}%`}
        />
        <Legend />
        <Bar dataKey="tonelaje" fill="#3b82f6" name="Tonelaje" />
      </BarChart>
    </ResponsiveContainer>
  );
}
