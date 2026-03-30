'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mountain,
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  X,
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
  { href: '/home', label: 'Inicio', icon: LayoutDashboard },
  { href: '/projects', label: 'Proyectos', icon: FolderOpen },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          // Base styles
          'flex flex-col border-r border-border bg-card transition-all duration-200 z-50',
          // Desktop: static in layout flow
          'hidden md:flex',
          collapsed ? 'md:w-14' : 'md:w-56',
          // Mobile: fixed overlay, slides in from left
          mobileOpen && 'fixed inset-y-0 left-0 flex w-64 md:relative md:w-auto',
        )}
      >
        {/* Logo + mobile close */}
        <div className="flex h-14 items-center border-b border-border px-3 gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Mountain className="h-5 w-5 text-primary" />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-semibold tracking-tight text-sm flex-1">GeoAgent</span>
          )}
          {/* Mobile close button */}
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1 rounded hover:bg-accent text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-0.5 p-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const item = (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  collapsed && !mobileOpen && 'justify-center',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {(!collapsed || mobileOpen) && <span>{label}</span>}
              </Link>
            );
            if (collapsed && !mobileOpen) {
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
          {(!collapsed || mobileOpen) && user?.email && (
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
                  'w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                  collapsed && !mobileOpen ? 'justify-center px-0' : 'justify-start',
                )}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {(!collapsed || mobileOpen) && <span className="ml-2">Cerrar sesión</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && !mobileOpen && (
              <TooltipContent side="right">Cerrar sesión</TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="absolute -right-3 top-16 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors"
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
