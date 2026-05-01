import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockPathname = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

import { Header } from './header';

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
  });

  it('shows "Inicio" when at root', () => {
    mockPathname.mockReturnValue('/');
    render(<Header />);
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('renders breadcrumb segments with route labels', () => {
    mockPathname.mockReturnValue('/projects/abc/stations/new');
    render(<Header />);
    expect(screen.getByText('Proyectos')).toBeInTheDocument();
    expect(screen.getByText('Estaciones')).toBeInTheDocument();
    expect(screen.getByText('Nuevo')).toBeInTheDocument();
  });

  it('truncates long unknown id segments to ···', () => {
    mockPathname.mockReturnValue('/projects/abcdefghijklmnopqrstu');
    render(<Header />);
    expect(screen.getByText('···')).toBeInTheDocument();
  });

  it('shows title prop', () => {
    mockPathname.mockReturnValue('/home');
    render(<Header title="Mi título" />);
    expect(screen.getByText('Mi título')).toBeInTheDocument();
  });

  it('fires onMenuClick + onCommandOpen', () => {
    mockPathname.mockReturnValue('/home');
    const onMenu = vi.fn();
    const onCmd = vi.fn();
    render(<Header onMenuClick={onMenu} onCommandOpen={onCmd} />);
    const buttons = screen.getAllByRole('button');
    buttons[0].click();
    expect(onMenu).toHaveBeenCalled();
    fireEvent.click(screen.getByText(/Buscar/));
    expect(onCmd).toHaveBeenCalled();
  });

  it('reacts to online/offline events', () => {
    mockPathname.mockReturnValue('/home');
    render(<Header />);
    expect(screen.getByText('Conectado')).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(screen.getByText('Sin conexión')).toBeInTheDocument();
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(screen.getByText('Conectado')).toBeInTheDocument();
  });
});
