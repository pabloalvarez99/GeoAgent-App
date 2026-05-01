import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge, getDrillStatusVariant } from './status-badge';

describe('StatusBadge', () => {
  it('renders label', () => {
    render(<StatusBadge variant="success" label="Activo" />);
    expect(screen.getByText('Activo')).toBeInTheDocument();
  });

  it('applies variant styles', () => {
    render(<StatusBadge variant="danger" label="Error" />);
    const el = screen.getByText('Error');
    expect(el.className).toContain('text-red-400');
    expect(el.className).toContain('bg-red-500/10');
  });

  it('applies pulse class on dot when enabled', () => {
    const { container } = render(<StatusBadge variant="progress" label="x" pulse />);
    const dot = container.querySelector('span > span');
    expect(dot?.className).toContain('animate-pulse');
  });

  it('size md uses larger paddings', () => {
    render(<StatusBadge variant="neutral" label="N" size="md" />);
    expect(screen.getByText('N').className).toContain('px-2.5');
  });
});

describe('getDrillStatusVariant', () => {
  it.each([
    ['Completado', 'success'],
    ['En Progreso', 'progress'],
    ['Suspendido', 'warning'],
    ['Abandonado', 'danger'],
    ['Otro', 'neutral'],
  ])('%s → %s', (status, expected) => {
    expect(getDrillStatusVariant(status)).toBe(expected);
  });
});
