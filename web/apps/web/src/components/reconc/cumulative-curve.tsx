'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import type { Reconciliacion } from '@/types/reconc';

export function CumulativeCurve({ data }: { data: Reconciliacion[] }) {
  const sorted = [...data].sort((a, b) => a.mes.localeCompare(b.mes));
  let cumPlan = 0; let cumReal = 0;
  const chart = sorted.map((r) => {
    cumPlan += r.plan_t;
    cumReal += r.real_t_planta;
    return { mes: r.mes, plan: cumPlan, real: cumReal };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chart}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="plan" stroke="#94a3b8" fill="#cbd5e1" name="Plan acumulado (t)" />
        <Area type="monotone" dataKey="real" stroke="#3b82f6" fill="#bfdbfe" name="Real acumulado (t)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
