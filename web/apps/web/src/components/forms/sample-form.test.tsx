import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SampleForm } from './sample-form';

function setup(overrides: Partial<React.ComponentProps<typeof SampleForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(<SampleForm onSubmit={onSubmit} onCancel={onCancel} {...overrides} />);
  return { onSubmit, onCancel };
}

const validDefaults = {
  code: 'MUE-1',
  type: 'Roca',
  description: 'descripcion',
  status: 'Pendiente',
};

describe('SampleForm', () => {
  it('renders sections + actions', () => {
    setup();
    expect(screen.getByText('Identificación')).toBeInTheDocument();
    expect(screen.getByText('Medidas y análisis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar muestra/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Capturar GPS/ })).toBeInTheDocument();
  });

  it('cancel calls onCancel', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation errors when submitting empty', async () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Guardar muestra/ }));
    expect(await screen.findByText(/Codigo de muestra es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Tipo de muestra es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Descripcion es obligatorio/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('GPS unsupported shows error message', () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    });
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Capturar GPS/ }));
    expect(screen.getByText(/GPS no disponible/)).toBeInTheDocument();
  });

  it('GPS success populates lat/lon inputs', async () => {
    const getCurrentPosition = vi.fn(
      (success: PositionCallback) => {
        success({
          coords: {
            latitude: -33.4,
            longitude: -70.6,
            altitude: 500,
            accuracy: 5,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    );
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition },
      configurable: true,
    });
    setup();
    fireEvent.click(screen.getByRole('button', { name: /Capturar GPS/ }));
    expect(getCurrentPosition).toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByDisplayValue('-33.4')).toBeInTheDocument();
    });
  });

  it('GPS error shows error message', async () => {
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
    expect(await screen.findByText(/No se pudo obtener la ubicación/)).toBeInTheDocument();
  });

  it('submits valid defaultValues', async () => {
    const { onSubmit } = setup({ defaultValues: validDefaults });
    fireEvent.click(screen.getByRole('button', { name: /Guardar muestra/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject(validDefaults);
  });

  it('full Radix Select interaction submits required fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<SampleForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('MUE-001'), { target: { value: 'MUE-42' } });
    fireEvent.change(screen.getByPlaceholderText(/Descripción de la muestra/), {
      target: { value: 'roca verde' },
    });

    const open = (idx: number) => {
      const triggers = screen.getAllByRole('combobox');
      fireEvent.pointerDown(triggers[idx], { button: 0, ctrlKey: false, pointerType: 'mouse' });
    };
    const pick = async (name: string) => {
      const opts = await screen.findAllByRole('option', { name });
      const visible = opts.find((o) => o.tagName !== 'OPTION');
      fireEvent.click(visible ?? opts[0]);
    };

    open(0); await pick('Roca');
    open(1); await pick('Enviada');

    fireEvent.click(screen.getByRole('button', { name: /Guardar muestra/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      code: 'MUE-42',
      type: 'Roca',
      description: 'roca verde',
      status: 'Enviada',
    });
  });
});
