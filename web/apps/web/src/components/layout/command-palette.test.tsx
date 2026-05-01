import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUseProjects = vi.fn();
vi.mock('@/lib/hooks/use-projects', () => ({
  useProjects: () => mockUseProjects(),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { CommandPalette } from './command-palette';

describe('CommandPalette', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseProjects.mockReturnValue({
      projects: [
        { id: 'p1', name: 'Mina Norte', location: 'Atacama' },
        { id: 'p2', name: 'Faena Sur', location: 'Coquimbo' },
      ],
    });
  });

  it('renders nothing when closed', () => {
    render(<CommandPalette open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  it('renders static items when open with empty query', () => {
    render(<CommandPalette open onClose={vi.fn()} />);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Nuevo proyecto')).toBeInTheDocument();
    expect(screen.getByText('Ajustes')).toBeInTheDocument();
  });

  it('filters by query against label and description', () => {
    render(<CommandPalette open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Buscar proyectos/i);
    fireEvent.change(input, { target: { value: 'mina' } });
    expect(screen.getByText('Mina Norte')).toBeInTheDocument();
    expect(screen.queryByText('Faena Sur')).not.toBeInTheDocument();
  });

  it('shows empty state when no matches', () => {
    render(<CommandPalette open onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Buscar proyectos/i), {
      target: { value: 'zzznoexiste' },
    });
    expect(screen.getByText(/Sin resultados/)).toBeInTheDocument();
  });

  it('clears query via ✕ button', () => {
    render(<CommandPalette open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Buscar proyectos/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'mina' } });
    fireEvent.click(screen.getByText('✕'));
    expect(input.value).toBe('');
  });

  it('navigates and closes on click', () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} />);
    fireEvent.click(screen.getByText('Inicio'));
    expect(mockPush).toHaveBeenCalledWith('/home');
    expect(onClose).toHaveBeenCalled();
  });

  it('keyboard nav: ArrowDown/Up + Enter triggers action', () => {
    const onClose = vi.fn();
    render(<CommandPalette open onClose={onClose} />);
    const input = screen.getByPlaceholderText(/Buscar proyectos/i);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('ArrowDown clamps at last item, ArrowUp clamps at 0', () => {
    render(<CommandPalette open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Buscar proyectos/i);
    for (let i = 0; i < 20; i++) fireEvent.keyDown(input, { key: 'ArrowDown' });
    for (let i = 0; i < 20; i++) fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('Enter no-op when filtered is empty', () => {
    render(<CommandPalette open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Buscar proyectos/i);
    fireEvent.change(input, { target: { value: 'zzznoexiste' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('onMouseEnter resets selection back to first item', () => {
    render(<CommandPalette open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Buscar proyectos/i);
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    const homeBtn = screen.getByText('Inicio').closest('button')!;
    fireEvent.mouseEnter(homeBtn);
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('resets query when closed and reopened', () => {
    const { rerender } = render(<CommandPalette open onClose={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Buscar proyectos/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'mina' } });
    expect(input.value).toBe('mina');
    rerender(<CommandPalette open={false} onClose={vi.fn()} />);
    rerender(<CommandPalette open onClose={vi.fn()} />);
    const reopened = screen.getByPlaceholderText(/Buscar proyectos/i) as HTMLInputElement;
    expect(reopened.value).toBe('');
  });

  it('shows project sub-items (no description) when filtering', () => {
    render(<CommandPalette open onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Buscar proyectos/i), { target: { value: 'Estaciones' } });
    expect(screen.getByText(/Mina Norte — Estaciones/)).toBeInTheDocument();
  });

  it('singular result count when filtered to one', () => {
    render(<CommandPalette open onClose={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText(/Buscar proyectos/i), { target: { value: 'Coquimbo' } });
    const footer = screen.getByText((_, el) => el?.textContent === '1 resultado');
    expect(footer).toBeInTheDocument();
  });
});
