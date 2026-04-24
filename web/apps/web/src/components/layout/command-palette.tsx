'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  Layers,
  Drill,
  Map,
  Download,
  Upload,
  Camera,
  Settings,
  Home,
  Plus,
  Search,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useProjects } from '@/lib/hooks/use-projects';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const { projects } = useProjects();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const navigate = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  const staticItems: CommandItem[] = [
    { id: 'home', label: 'Inicio', description: 'Dashboard principal', icon: Home, action: () => navigate('/home'), group: 'Navegación' },
    { id: 'projects', label: 'Proyectos', description: 'Ver todos los proyectos', icon: FolderOpen, action: () => navigate('/projects'), group: 'Navegación' },
    { id: 'new-project', label: 'Nuevo proyecto', description: 'Crear un proyecto nuevo', icon: Plus, action: () => navigate('/projects'), group: 'Acciones' },
    { id: 'settings', label: 'Ajustes', description: 'Configuración de la cuenta', icon: Settings, action: () => navigate('/settings'), group: 'Navegación' },
  ];

  const projectItems: CommandItem[] = projects.flatMap((p) => [
    { id: `p-${p.id}`, label: p.name, description: p.location, icon: FolderOpen, action: () => navigate(`/projects/${p.id}`), group: 'Proyectos' },
    { id: `p-${p.id}-stations`, label: `${p.name} — Estaciones`, icon: Layers, action: () => navigate(`/projects/${p.id}/stations`), group: 'Proyectos' },
    { id: `p-${p.id}-drillholes`, label: `${p.name} — Sondajes`, icon: Drill, action: () => navigate(`/projects/${p.id}/drillholes`), group: 'Proyectos' },
    { id: `p-${p.id}-map`, label: `${p.name} — Mapa`, icon: Map, action: () => navigate(`/projects/${p.id}/map`), group: 'Proyectos' },
    { id: `p-${p.id}-photos`, label: `${p.name} — Fotos`, icon: Camera, action: () => navigate(`/projects/${p.id}/photos`), group: 'Proyectos' },
    { id: `p-${p.id}-export`, label: `${p.name} — Exportar`, icon: Download, action: () => navigate(`/projects/${p.id}/export`), group: 'Proyectos' },
    { id: `p-${p.id}-import`, label: `${p.name} — Importar`, icon: Upload, action: () => navigate(`/projects/${p.id}/import`), group: 'Proyectos' },
  ]);

  const allItems = [...staticItems, ...projectItems];

  const filtered = query.trim()
    ? allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          item.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : staticItems;

  useEffect(() => { setSelected(0); }, [query]);
  useEffect(() => { if (!open) setQuery(''); }, [open]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && filtered[selected]) { filtered[selected].action(); }
  }

  // Group items for display
  const groups = filtered.reduce<Record<string, CommandItem[]>>((acc, item) => {
    (acc[item.group] ||= []).push(item);
    return acc;
  }, {});

  let globalIndex = 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0 mr-2" />
          <input
            autoFocus
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Buscar proyectos, rutas, acciones..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          <kbd className="ml-2 text-xs text-muted-foreground border rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-[400px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Sin resultados</p>
          ) : (
            Object.entries(groups).map(([group, items]) => (
              <div key={group}>
                <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {group}
                </p>
                {items.map((item) => {
                  const idx = globalIndex++;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors
                        ${idx === selected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'}`}
                      onClick={item.action}
                      onMouseEnter={() => setSelected(idx)}
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate">{item.label}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="border-t px-3 py-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span><kbd className="border rounded px-1">↑↓</kbd> navegar</span>
          <span><kbd className="border rounded px-1">↵</kbd> ir</span>
          <span><kbd className="border rounded px-1">Esc</kbd> cerrar</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
