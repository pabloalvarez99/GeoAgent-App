'use client';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts';
import { shewhartBands } from '@/lib/data/qaqc';

interface Point { idx: number; valor: number; status: string; }

export function ShewhartChart({ values }: { values: number[] }) {
  const bands = shewhartBands(values);
  const data: Point[] = values.map((v, i) => ({
    idx: i, valor: v, status: Math.abs(v - bands.mean) > 3 * bands.std ? 'fail' : Math.abs(v - bands.mean) > 2 * bands.std ? 'warning' : 'pass',
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="idx" />
        <YAxis />
        <Tooltip />
        <ReferenceLine y={bands.mean} stroke="#888" label="μ" />
        <ReferenceLine y={bands.upper2} stroke="#f59e0b" strokeDasharray="4 2" label="+2σ" />
        <ReferenceLine y={bands.lower2} stroke="#f59e0b" strokeDasharray="4 2" label="-2σ" />
        <ReferenceLine y={bands.upper3} stroke="#ef4444" strokeDasharray="4 2" label="+3σ" />
        <ReferenceLine y={bands.lower3} stroke="#ef4444" strokeDasharray="4 2" label="-3σ" />
        <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
