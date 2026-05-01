import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click</Button>);
    expect(screen.getByRole('button', { name: 'Click' })).toBeInTheDocument();
  });

  it('fires onClick', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    screen.getByRole('button').click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('applies variant + size classes', () => {
    render(<Button variant="destructive" size="sm">X</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-destructive');
    expect(btn.className).toContain('h-9');
  });

  it('disabled blocks click', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>D</Button>);
    screen.getByRole('button').click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('asChild renders slot child element', () => {
    render(
      <Button asChild>
        <a href="/x">Link</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Link' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('/x');
  });
});
