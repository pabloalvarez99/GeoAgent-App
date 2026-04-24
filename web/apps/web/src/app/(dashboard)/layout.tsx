'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPalette } from '@/components/layout/command-palette';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  // Global keyboard shortcuts — memoized so the event listener isn't re-registered on every render
  const shortcuts = useMemo(() => [
    {
      key: 'k',
      ctrl: true,
      description: 'Abrir búsqueda rápida',
      action: () => setCommandOpen((o) => !o),
    },
    {
      key: 'n',
      ctrl: true,
      description: 'Nuevo proyecto',
      action: () => router.push('/projects'),
    },
    {
      key: 'e',
      ctrl: true,
      description: 'Exportar (proyecto activo)',
      action: () => {
        const match = pathname.match(/\/projects\/([^/]+)/);
        if (match) router.push(`/projects/${match[1]}/export`);
      },
    },
  ], [pathname, router]);

  useKeyboardShortcuts(shortcuts);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm">Cargando GeoAgent...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} onCommandOpen={() => setCommandOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
