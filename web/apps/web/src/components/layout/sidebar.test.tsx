import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, onClick, className }: { href: string; children: React.ReactNode; onClick?: () => void; className?: string }) => (
    <a href={href} onClick={onClick} className={className}>{children}</a>
  ),
}));

const mockSignOut = vi.fn();
const mockUseAuth = vi.fn();
vi.mock('@/lib/firebase/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseProject = vi.fn();
vi.mock('@/lib/hooks/use-projects', () => ({
  useProject: (id: string) => mockUseProject(id),
}));

vi.mock('@/components/ui/tooltip', () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname.mockReturnValue('/home');
    mockUseAuth.mockReturnValue({ user: { email: 'pablo@test.com' }, signOut: mockSignOut });
    mockUseProject.mockReturnValue({ project: null });
  });

  it('renders nav items + brand', () => {
    render(<Sidebar />);
    expect(screen.getByText('GeoAgent')).toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Analítica')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('renders user email + initial avatar', () => {
    render(<Sidebar />);
    expect(screen.getByText('pablo@test.com')).toBeInTheDocument();
    expect(screen.getByText('P')).toBeInTheDocument();
  });

  it('marks active nav by pathname', () => {
    mockPathname.mockReturnValue('/projects/abc');
    const { container } = render(<Sidebar />);
    const projectsLink = container.querySelector('a[href="/projects"]')!;
    expect(projectsLink.className).toContain('nav-active');
  });

  it('signOut click triggers signOut', () => {
    render(<Sidebar />);
    fireEvent.click(screen.getByText('Cerrar sesión'));
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows ActiveProjectBadge when route has projectId + project loaded', () => {
    mockPathname.mockReturnValue('/projects/p1/stations');
    mockUseProject.mockReturnValue({ project: { id: 'p1', name: 'Mina Norte', location: 'Atacama' } });
    render(<Sidebar />);
    expect(screen.getByText('Proyecto activo')).toBeInTheDocument();
    expect(screen.getByText('Mina Norte')).toBeInTheDocument();
    expect(screen.getByText('Atacama')).toBeInTheDocument();
  });

  it('toggles collapse with side button', () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector('aside')!;
    expect(aside.className).toContain('md:w-56');
    const toggle = container.querySelector('button.absolute.-right-3')!;
    fireEvent.click(toggle);
    expect(aside.className).toContain('md:w-14');
    fireEvent.click(toggle);
    expect(aside.className).toContain('md:w-56');
  });

  it('mobileOpen renders close X button + invokes onMobileClose', () => {
    const onClose = vi.fn();
    const { container } = render(<Sidebar mobileOpen onMobileClose={onClose} />);
    const xBtn = container.querySelector('button.md\\:hidden')!;
    fireEvent.click(xBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('handles unauthenticated user (no email)', () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: mockSignOut });
    render(<Sidebar />);
    expect(screen.getByText('GeoAgent')).toBeInTheDocument();
  });

  it('does not render badge when no projectId in pathname', () => {
    mockPathname.mockReturnValue('/home');
    render(<Sidebar />);
    expect(screen.queryByText('Proyecto activo')).not.toBeInTheDocument();
  });
});
