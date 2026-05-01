import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StationForm } from './station-form';

function setup(overrides: Partial<React.ComponentProps<typeof StationForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(<StationForm onSubmit={onSubmit} onCancel={onCancel} {...overrides} />);
  return { onSubmit, onCancel };
}

describe('StationForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders core fields + actions', () => {
    setup();
    expect(screen.getByLabelText(/Código/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Geólogo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar estación/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Capturar GPS/ })).toBeInTheDocument();
  });

  it('cancel calls onCancel', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation errors when submitting empty (default coords 0,0)', async () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Guardar estación/ }));
    expect(await screen.findByText(/Codigo de estacion es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Geologo es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Descripcion es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Captura las coordenadas GPS/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('captures GPS via navigator.geolocation', async () => {
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
    expect(await screen.findByText(/-23\.500000, -68\.700000/)).toBeInTheDocument();
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

  it('no-op if geolocation unsupported', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Capturar GPS/ }));
    expect(screen.getByRole('button', { name: /Capturar GPS/ })).not.toBeDisabled();
  });

  it('submits valid data', async () => {
    const { onSubmit } = setup({
      defaultValues: {
        code: 'EST-1',
        geologist: 'Pablo',
        description: 'outcrop',
        latitude: -23.5,
        longitude: -68.7,
        altitude: 2400,
        date: '2026-01-15',
        weatherConditions: null,
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /Guardar estación/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.code).toBe('EST-1');
    expect(arg.latitude).toBe(-23.5);
    expect(arg.longitude).toBe(-68.7);
  });

});
