'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mountain,
  FolderOpen,
  Map,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { href: '/projects', label: 'Proyectos', icon: FolderOpen },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'relative flex flex-col border-r border-border bg-card transition-all duration-200',
          collapsed ? 'w-14' : 'w-56',
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-3 gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Mountain className="h-5 w-5 text-primary" />
          </div>
          {!collapsed && (
            <span className="font-semibold tracking-tight text-sm">GeoAgent</span>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const item = (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  collapsed && 'justify-center',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
            if (collapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{item}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }
            return item;
          })}
        </nav>

        {/* User + sign out */}
        <div className="border-t border-border p-2 space-y-1">
          {!collapsed && user?.email && (
            <p className="px-2 py-1 text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className={cn(
                  'w-full text-muted-foreground hover:text-destructive',
                  collapsed ? 'justify-center px-0' : 'justify-start',
                )}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="ml-2">Cerrar sesión</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Cerrar sesión</TooltipContent>}
          </Tooltip>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-16 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </aside>
    </TooltipProvider>
  );
}
