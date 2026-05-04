'use client';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Legend,
} from 'recharts';
import type { Reconciliacion } from '@/types/reconc';

interface Props { data: Reconciliacion[]; metric: 'factor_metal_cu' | 'factor_t' | 'factor_ley_cu'; }

export function FactorChart({ data, metric }: Props) {
  const sorted = [...data].sort((a, b) => a.mes.localeCompare(b.mes));
  const chart = sorted.map((r) => ({ mes: r.mes, value: r[metric] }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chart}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis domain={[0.7, 1.3]} />
        <Tooltip />
        <Legend />
        <ReferenceLine y={1.0} stroke="#888" strokeDasharray="2 2" />
        <ReferenceLine y={0.95} stroke="#10b981" strokeDasharray="4 2" label="0.95" />
        <ReferenceLine y={1.05} stroke="#10b981" strokeDasharray="4 2" label="1.05" />
        <ReferenceLine y={0.9} stroke="#ef4444" strokeDasharray="4 2" label="0.90" />
        <ReferenceLine y={1.1} stroke="#ef4444" strokeDasharray="4 2" label="1.10" />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name={metric} />
      </LineChart>
    </ResponsiveContainer>
  );
}
