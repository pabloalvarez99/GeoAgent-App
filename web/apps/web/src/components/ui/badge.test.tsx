import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it.each([
    ['default', 'bg-primary'],
    ['secondary', 'bg-secondary'],
    ['destructive', 'bg-destructive'],
    ['success', 'bg-green-500/20'],
    ['warning', 'bg-yellow-500/20'],
  ] as const)('variant %s applies expected class', (variant, expectedClass) => {
    render(<Badge variant={variant}>{variant}</Badge>);
    expect(screen.getByText(variant).className).toContain(expectedClass);
  });

  it('outline variant has no bg class', () => {
    render(<Badge variant="outline">o</Badge>);
    expect(screen.getByText('o').className).toContain('text-foreground');
  });

  it('forwards className', () => {
    render(<Badge className="custom-x">b</Badge>);
    expect(screen.getByText('b').className).toContain('custom-x');
  });
});
