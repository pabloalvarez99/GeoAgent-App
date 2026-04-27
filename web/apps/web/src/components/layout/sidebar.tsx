'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  X,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth';
import { useProject } from '@/lib/hooks/use-projects';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Custom GeoAgent triangle logo mark
function GeoMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" aria-hidden>
      <polygon
        points="256,88 420,348 92,348"
        stroke="#22c55e"
        strokeWidth="52"
        strokeLinejoin="round"
        fill="rgba(34,197,94,0.07)"
      />
      <circle cx="256" cy="88" r="36" fill="#22c55e" />
    </svg>
  );
}

const navItems = [
  { href: '/home', label: 'Inicio', icon: LayoutDashboard },
  { href: '/projects', label: 'Proyectos', icon: FolderOpen },
  { href: '/analytics', label: 'Analítica', icon: BarChart3 },
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

function ActiveProjectBadge({
  id,
  collapsed,
  mobileOpen,
}: {
  id: string;
  collapsed: boolean;
  mobileOpen: boolean;
}) {
  const { project } = useProject(id);
  if (!project) return null;

  if (!collapsed || mobileOpen) {
    return (
      <div className="px-2 pb-2">
        <p className="px-2 mb-1 text-[10px] uppercase tracking-widest text-muted-foreground/50">
          Proyecto activo
        </p>
        <div className="rounded-md bg-primary/5 border border-primary/15 px-2.5 py-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <p className="text-xs font-medium text-primary truncate leading-tight">
              {project.name}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate pl-3.5">
            {project.location}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center pb-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-2 w-2 rounded-full bg-primary cursor-default" />
        </TooltipTrigger>
        <TooltipContent side="right">{project.name}</TooltipContent>
      </Tooltip>
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
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const activeProjectId = projectMatch ? projectMatch[1] : null;

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col border-r border-border sidebar-surface transition-all duration-200 z-50 relative',
          'hidden md:flex',
          collapsed ? 'md:w-14' : 'md:w-56',
          mobileOpen && 'fixed inset-y-0 left-0 flex w-64 md:relative md:w-auto',
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            'flex h-14 items-center border-b border-border shrink-0',
            collapsed && !mobileOpen ? 'justify-center' : 'px-3 gap-2.5',
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <GeoMark size={18} />
          </div>
          {(!collapsed || mobileOpen) && (
            <span className="font-semibold tracking-tight text-sm flex-1">GeoAgent</span>
          )}
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
                onClick={mobileOpen ? onMobileClose : undefined}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'nav-active'
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

        {/* Active project badge */}
        {activeProjectId && (
          <ActiveProjectBadge
            id={activeProjectId}
            collapsed={collapsed}
            mobileOpen={mobileOpen}
          />
        )}

        {/* User + sign out */}
        <div className="border-t border-border p-2 space-y-1">
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
                  'w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10',
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
          className="absolute -right-3 top-16 hidden md:flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </aside>
    </TooltipProvider>
  );
}
