'use client';

import { ProductivityChart, type MachineProd } from '@/components/sondajes/productivity-chart';
import { useOrg } from '@/lib/auth/org-context';

export default function SondajesPage() {
  const { currentOrg } = useOrg();

  // F1 MVP: sondajes_plan subcollection lectura agregada por máquina.
  // Stub data hasta que UI de carga de planes se construya en F2.
  const data: MachineProd[] = [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Sondajes productividad</h1>
        <p className="text-sm text-muted-foreground">{currentOrg?.nombre}</p>
      </header>
      {data.length === 0 ? (
        <p className="text-muted-foreground">
          Carga planes de sondaje desde el módulo de proyectos (próximamente). Cuando existan datos en
          <code className="mx-1 px-1 bg-muted rounded">sondajes_plan</code> aparecerán métricas plan vs real
          por máquina diamantina.
        </p>
      ) : (
        <ProductivityChart data={data} />
      )}
    </div>
  );
}
