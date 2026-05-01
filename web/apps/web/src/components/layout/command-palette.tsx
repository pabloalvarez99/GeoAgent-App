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
  Box,
  Settings,
  Home,
  Plus,
  Search,
  type LucideIcon,
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
  icon: LucideIcon;
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
    { id: `p-${p.id}-3d`, label: `${p.name} — Vista 3D`, icon: Box, action: () => navigate(`/projects/${p.id}/3d`), group: 'Proyectos' },
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
        {/* Search input */}
        <div className="flex items-center gap-2.5 border-b border-border px-3 py-0.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Buscar proyectos, rutas, acciones..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
          />
          {query && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setQuery('')}
            >
              ✕
            </button>
          )}
          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 shrink-0 font-mono">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[420px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Sin resultados para &ldquo;{query}&rdquo;</p>
            </div>
          ) : (
            <div className="py-1.5">
              {Object.entries(groups).map(([group, items]) => (
                <div key={group} className="mb-1">
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
                    {group}
                  </p>
                  {items.map((item) => {
                    const idx = globalIndex++;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors rounded-sm mx-1 pr-4
                          ${idx === selected
                            ? 'bg-primary/10 text-foreground'
                            : 'hover:bg-muted/50 text-foreground/80'
                          }`}
                        style={{ width: 'calc(100% - 8px)' }}
                        onClick={item.action}
                        onMouseEnter={() => setSelected(idx)}
                      >
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border/60
                          ${idx === selected ? 'bg-primary/10 border-primary/20' : 'bg-muted/40'}`}>
                          <Icon className={`h-3.5 w-3.5 ${idx === selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-sm">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                          )}
                        </div>
                        {idx === selected && (
                          <kbd className="text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5 font-mono shrink-0">↵</kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-3 py-2 flex items-center gap-4 text-[11px] text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <kbd className="border border-border/60 rounded px-1 py-0.5 font-mono">↑↓</kbd>
            navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="border border-border/60 rounded px-1 py-0.5 font-mono">↵</kbd>
            ir
          </span>
          <span className="ml-auto">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
