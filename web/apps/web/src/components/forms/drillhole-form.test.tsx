import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DrillHoleForm } from './drillhole-form';

function setup(overrides: Partial<React.ComponentProps<typeof DrillHoleForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(<DrillHoleForm onSubmit={onSubmit} onCancel={onCancel} {...overrides} />);
  return { onSubmit, onCancel };
}

const validDefaults = {
  holeId: 'SDH-1',
  type: 'Diamantina',
  geologist: 'Pablo',
  latitude: -23.5,
  longitude: -68.7,
  azimuth: 90,
  inclination: -60,
  plannedDepth: 250,
  status: 'En Progreso',
};

describe('DrillHoleForm', () => {
  it('renders sections', () => {
    setup();
    expect(screen.getByText('Identificación')).toBeInTheDocument();
    expect(screen.getByText('Collar GPS')).toBeInTheDocument();
    expect(screen.getByText('Geometría y profundidad')).toBeInTheDocument();
    expect(screen.getByText('Estado y fechas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar sondaje/ })).toBeInTheDocument();
  });

  it('cancel calls onCancel', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation errors when submitting empty', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<DrillHoleForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.submit(container.querySelector('form')!);
    expect(await screen.findByText(/ID del sondaje es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Tipo de sondaje es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Geologo es obligatorio/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('GPS capture populates lat/lon', () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: -23.5,
          longitude: -68.7,
          altitude: 2400,
          accuracy: 5,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      } as GeolocationPosition);
    });
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    });
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Capturar GPS/ }));
    expect(getCurrentPosition).toHaveBeenCalled();
    expect(screen.getByText(/-23\.500000, -68\.700000/)).toBeInTheDocument();
  });

  it('GPS unsupported is no-op', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Capturar GPS/ }));
    expect(screen.getByRole('button', { name: /Capturar GPS/ })).not.toBeDisabled();
  });

  it('GPS error keeps form usable', () => {
    const getCurrentPosition = vi.fn(
      (_s: PositionCallback, error?: PositionErrorCallback) => {
        error?.({ code: 1, message: 'denied' } as GeolocationPositionError);
      },
    );
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    });
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Capturar GPS/ }));
    expect(screen.getByRole('button', { name: /Capturar GPS/ })).not.toBeDisabled();
  });

  it('submits valid defaultValues', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <DrillHoleForm onSubmit={onSubmit} onCancel={vi.fn()} defaultValues={validDefaults} />,
    );
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject(validDefaults);
  });

  it('full Radix Select interaction submits required fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<DrillHoleForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('SDH-001'), { target: { value: 'SDH-99' } });
    fireEvent.change(screen.getByPlaceholderText(/Nombre del geólogo/), { target: { value: 'Pablo' } });
    fireEvent.change(screen.getByPlaceholderText(/0–360/), { target: { value: '180' } });
    fireEvent.change(screen.getByPlaceholderText(/-90 a 0/), { target: { value: '-60' } });
    fireEvent.change(screen.getByPlaceholderText(/^0\.0$/), { target: { value: '300' } });
    const latInput = screen.getAllByPlaceholderText('0.000000')[0];
    fireEvent.change(latInput, { target: { value: '-23.5' } });
    const lonInput = screen.getAllByPlaceholderText('0.000000')[1];
    fireEvent.change(lonInput, { target: { value: '-68.7' } });

    const open = (idx: number) => {
      const triggers = screen.getAllByRole('combobox');
      fireEvent.pointerDown(triggers[idx], { button: 0, ctrlKey: false, pointerType: 'mouse' });
    };
    const pick = async (name: string) => {
      const opts = await screen.findAllByRole('option', { name });
      const visible = opts.find((o) => o.tagName !== 'OPTION');
      fireEvent.click(visible ?? opts[0]);
    };

    open(0); await pick('Diamantina');
    open(1); await pick('Completado');

    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      holeId: 'SDH-99',
      type: 'Diamantina',
      geologist: 'Pablo',
      azimuth: 180,
      inclination: -60,
      plannedDepth: 300,
      status: 'Completado',
    });
  });
});
