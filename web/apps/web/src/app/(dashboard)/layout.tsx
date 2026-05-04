'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { CommandPalette } from '@/components/layout/command-palette';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { OrgProvider } from '@/lib/auth/org-context';

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
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Sidebar skeleton */}
        <div className="hidden md:flex flex-col w-56 border-r border-border shrink-0" style={{ background: 'hsl(240 6% 5.2%)' }}>
          <div className="flex h-14 items-center gap-2.5 px-3 border-b border-border">
            <div className="skeleton h-8 w-8 rounded-lg shrink-0" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
          <div className="flex-1 p-2 space-y-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-8 w-full rounded-md" />
            ))}
          </div>
          <div className="border-t border-border p-2 space-y-1">
            <div className="skeleton h-8 w-full rounded-md" />
          </div>
        </div>
        {/* Main area skeleton */}
        <div className="flex flex-1 flex-col min-w-0">
          <div className="flex h-14 items-center border-b border-border bg-card px-4 gap-3">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="flex-1" />
            <div className="skeleton h-8 w-28 rounded-md hidden sm:block" />
          </div>
          <div className="flex-1 p-6 space-y-6">
            <div className="skeleton h-8 w-48 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-lg" />)}
            </div>
            <div className="skeleton h-48 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <OrgProvider>
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
    </OrgProvider>
  );
}
