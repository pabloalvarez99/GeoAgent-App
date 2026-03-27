'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  projects: 'Proyectos',
  stations: 'Estaciones',
  drillholes: 'Sondajes',
  map: 'Mapa',
  photos: 'Fotos',
  export: 'Exportar',
  settings: 'Configuración',
  new: 'Nuevo',
  lithology: 'Litología',
  structural: 'Estructural',
  samples: 'Muestras',
  intervals: 'Intervalos',
};

function getLabel(segment: string): string {
  // If it looks like a Firestore ID (long alphanumeric), don't show it
  if (segment.length > 15 && /^[a-zA-Z0-9]+$/.test(segment)) return '···';
  return ROUTE_LABELS[segment] ?? segment;
}

export function Header({ title }: { title?: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="flex h-14 items-center border-b border-border bg-card px-4 gap-2">
      <nav className="flex items-center gap-1 text-sm text-muted-foreground min-w-0">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          return (
            <span key={i} className="flex items-center gap-1 min-w-0">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
              <span
                className={
                  isLast ? 'text-foreground font-medium truncate' : 'truncate'
                }
              >
                {getLabel(seg)}
              </span>
            </span>
          );
        })}
      </nav>
      {title && (
        <div className="ml-auto text-sm font-medium text-muted-foreground hidden sm:block">
          {title}
        </div>
      )}
    </header>
  );
}
