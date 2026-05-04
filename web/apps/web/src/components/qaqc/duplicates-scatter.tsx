'use client';

import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';

interface DupPoint { orig: number; check: number; }

export function DuplicatesScatter({ pairs, limitPct }: { pairs: DupPoint[]; limitPct: number }) {
  const max = Math.max(1, ...pairs.flatMap((p) => [p.orig, p.check]));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid />
        <XAxis dataKey="orig" name="Original" domain={[0, max]} />
        <YAxis dataKey="check" name="Duplicado" domain={[0, max]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <ReferenceLine
          segment={[{ x: 0, y: 0 }, { x: max, y: max }]}
          stroke="#000" strokeDasharray="2 2" label="1:1"
        />
        <ReferenceLine
          segment={[{ x: 0, y: 0 }, { x: max, y: max * (1 + limitPct) }]}
          stroke="#ef4444" strokeDasharray="3 3"
        />
        <ReferenceLine
          segment={[{ x: 0, y: 0 }, { x: max, y: max * (1 - limitPct) }]}
          stroke="#ef4444" strokeDasharray="3 3"
        />
        <Scatter data={pairs} fill="#3b82f6" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
