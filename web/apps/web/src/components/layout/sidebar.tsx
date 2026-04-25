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

function UserAvatar({ email }: { email?: string | null }) {
  const initial = email ? email[0].toUpperCase() : '?';
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/20 text-primary text-xs font-bold ring-1 ring-primary/30 select-none">
      {initial}
    </div>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col transition-all duration-200 z-50 sidebar-surface relative',
          'hidden md:flex',
          collapsed ? 'md:w-[52px]' : 'md:w-[220px]',
          mobileOpen && 'fixed inset-y-0 left-0 flex w-64 md:relative md:w-auto',
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-border/50 shrink-0',
            collapsed && !mobileOpen ? 'justify-center' : 'px-4 gap-3',
          )}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/25">
            <Mountain className="h-4 w-4 text-primary" />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-semibold text-sm tracking-tight flex-1 text-foreground">
              GeoAgent
            </span>
          )}
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            const item = (
              <Link
                key={href}
                href={href}
                onClick={mobileOpen ? onMobileClose : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md text-sm font-medium transition-all duration-150 relative',
                  collapsed && !mobileOpen ? 'justify-center px-0 py-2.5' : 'px-2.5 py-2',
                  active
                    ? 'nav-active text-primary'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
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
        <div className="border-t border-border/50 p-2 space-y-1">
          {(!collapsed || mobileOpen) && user?.email && (
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <UserAvatar email={user.email} />
              <p className="text-xs text-muted-foreground truncate flex-1">{user.email}</p>
            </div>
          )}
          {collapsed && !mobileOpen && (
            <div className="flex justify-center py-1">
              <UserAvatar email={user?.email} />
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className={cn(
                  'w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors',
                  collapsed && !mobileOpen ? 'justify-center px-0' : 'justify-start gap-2.5',
                )}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                {(!collapsed || mobileOpen) && <span>Cerrar sesión</span>}
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
          className="absolute -right-3 top-[18px] hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground hover:border-border/80 transition-all z-20"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
