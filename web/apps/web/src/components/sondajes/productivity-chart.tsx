'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

export interface MachineProd {
  maquina: string;
  m_real: number;
  m_plan: number;
  costo_m: number;
}

export function ProductivityChart({ data }: { data: MachineProd[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="maquina" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="m_plan" fill="#94a3b8" name="Plan (m)" />
        <Bar dataKey="m_real" fill="#3b82f6" name="Real (m)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
