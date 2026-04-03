'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ROUTE_LABELS: Record<string, string> = {
  home: 'Inicio',
  projects: 'Proyectos',
  stations: 'Estaciones',
  drillholes: 'Sondajes',
  map: 'Mapa',
  photos: 'Fotos',
  export: 'Exportar',
  import: 'Importar',
  settings: 'Configuración',
  new: 'Nuevo',
  lithology: 'Litología',
  structural: 'Estructural',
  samples: 'Muestras',
  intervals: 'Intervalos',
};

function getLabel(segment: string): string {
  if (segment.length > 15 && /^[a-zA-Z0-9]+$/.test(segment)) return '···';
  return ROUTE_LABELS[segment] ?? segment;
}

interface HeaderProps {
  title?: string;
  onMenuClick?: () => void;
  onCommandOpen?: () => void;
}

export function Header({ title, onMenuClick, onCommandOpen }: HeaderProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="flex h-14 items-center border-b border-border bg-card px-4 gap-3">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden shrink-0 h-8 w-8"
        onClick={onMenuClick}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground min-w-0 flex-1">
        {segments.length === 0 ? (
          <span className="text-foreground font-medium">Inicio</span>
        ) : (
          segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            return (
              <span key={i} className="flex items-center gap-1 min-w-0">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                <span className={isLast ? 'text-foreground font-medium truncate' : 'truncate'}>
                  {getLabel(seg)}
                </span>
              </span>
            );
          })
        )}
      </nav>

      {title && (
        <div className="text-sm font-medium text-muted-foreground hidden sm:block shrink-0">
          {title}
        </div>
      )}

      {/* Search / Command Palette button */}
      <Button
        variant="outline"
        size="sm"
        className="hidden sm:flex items-center gap-2 text-muted-foreground text-xs h-8 px-3"
        onClick={onCommandOpen}
      >
        <Search className="h-3.5 w-3.5" />
        Buscar...
        <kbd className="ml-1 border rounded px-1 text-[10px]">⌃K</kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden h-8 w-8"
        onClick={onCommandOpen}
      >
        <Search className="h-4 w-4" />
      </Button>
    </header>
  );
}
