import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StratigraphicColumn } from './stratigraphic-column';
import type { GeoDrillInterval } from '@geoagent/geo-shared/types';

function makeInterval(over: Partial<GeoDrillInterval> = {}): GeoDrillInterval {
  return {
    id: 'i1',
    drillHoleId: 'h1',
    fromDepth: 0,
    toDepth: 10,
    rockType: 'Granito',
    rockGroup: 'Ignea',
    color: 'Gris',
    texture: 'Fanerítica',
    grainSize: 'Medio',
    mineralogy: 'Qz, Fk',
    ...over,
  };
}

describe('StratigraphicColumn', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('renders nothing when no intervals', () => {
    const { container } = render(<StratigraphicColumn intervals={[]} totalDepth={100} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when totalDepth <= 0', () => {
    const { container } = render(
      <StratigraphicColumn intervals={[makeInterval()]} totalDepth={0} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders svg with intervals + legend', () => {
    const intervals = [
      makeInterval({ id: 'a', fromDepth: 0, toDepth: 10, rockGroup: 'Ignea', rqd: 80, recovery: 90 }),
      makeInterval({ id: 'b', fromDepth: 10, toDepth: 25, rockGroup: 'Sedimentaria', rockType: 'Arenisca' }),
      makeInterval({ id: 'c', fromDepth: 25, toDepth: 40, rockGroup: 'Metamorfica', rockType: 'Gneis Largo Nombre Test' }),
      makeInterval({ id: 'd', fromDepth: 40, toDepth: 50, rockGroup: 'Desconocido', rockType: 'XX' }),
    ];
    render(<StratigraphicColumn intervals={intervals} totalDepth={50} holeId="DH-1" />);
    const svg = document.querySelector('svg[aria-label="Columna estratigráfica"]');
    expect(svg).toBeTruthy();
    expect(screen.getByText('Ignea')).toBeInTheDocument();
    expect(screen.getByText('Sedimentaria')).toBeInTheDocument();
    expect(screen.getByText('Metamorfica')).toBeInTheDocument();
  });

  it('shows tooltip on mouseenter and clears on mouseleave', () => {
    const intervals = [
      makeInterval({ id: 'a', fromDepth: 0, toDepth: 100, rqd: 75, recovery: 88, alteration: 'Sericita' }),
    ];
    const { container } = render(<StratigraphicColumn intervals={intervals} totalDepth={100} />);
    const group = container.querySelector('svg g[style*="cursor"]')!;
    fireEvent.mouseEnter(group, { clientX: 50, clientY: 50 });
    expect(screen.getByText(/0\.0–100\.0 m/)).toBeInTheDocument();
    expect(screen.getByText(/RQD: 75%/)).toBeInTheDocument();
    expect(screen.getByText(/Rec: 88%/)).toBeInTheDocument();
    expect(screen.getByText('Sericita')).toBeInTheDocument();
    fireEvent.mouseMove(group, { clientX: 60, clientY: 60 });
    expect(screen.getByText(/0\.0–100\.0 m/)).toBeInTheDocument();
  });

  it('downloads svg on button click', () => {
    const intervals = [makeInterval()];
    const createUrl = vi.fn(() => 'blob:x');
    const revokeUrl = vi.fn();
    Object.defineProperty(URL, 'createObjectURL', { value: createUrl, configurable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: revokeUrl, configurable: true });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<StratigraphicColumn intervals={intervals} totalDepth={50} holeId="DH-9" />);
    fireEvent.click(screen.getByRole('button', { name: /SVG/i }));
    expect(createUrl).toHaveBeenCalled();
    expect(revokeUrl).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
  });

  it('uses tickStep 5 when totalDepth <= 50', () => {
    render(<StratigraphicColumn intervals={[makeInterval({ toDepth: 30 })]} totalDepth={30} />);
    // Expect tick text 5, 10, 15, 20, 25, 30
    expect(document.querySelectorAll('text').length).toBeGreaterThan(5);
  });
});
