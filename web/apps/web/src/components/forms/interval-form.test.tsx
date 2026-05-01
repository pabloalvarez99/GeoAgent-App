import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IntervalForm } from './interval-form';

function setup(overrides: Partial<React.ComponentProps<typeof IntervalForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(<IntervalForm onSubmit={onSubmit} onCancel={onCancel} {...overrides} />);
  return { onSubmit, onCancel };
}

const validDefaults = {
  fromDepth: 0,
  toDepth: 5,
  rockType: 'Granito',
  rockGroup: 'Ígnea',
  color: 'Gris',
  texture: 'Fanerítica',
  grainSize: 'Grueso',
  mineralogy: 'Cuarzo',
};

describe('IntervalForm', () => {
  it('renders sections + actions', () => {
    setup();
    expect(screen.getByText('Profundidad')).toBeInTheDocument();
    expect(screen.getByText('Litología')).toBeInTheDocument();
    expect(screen.getByText('Calidad de testigo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar intervalo/ })).toBeInTheDocument();
  });

  it('uses fromDepthMin to seed defaults', () => {
    render(<IntervalForm fromDepthMin={12} onSubmit={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByDisplayValue('12')).toBeInTheDocument();
    expect(screen.getByDisplayValue('13')).toBeInTheDocument();
  });

  it('cancel calls onCancel', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation errors when submitting empty', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<IntervalForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.submit(container.querySelector('form')!);
    expect(await screen.findByText(/Tipo de roca es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Mineralogia es obligatorio/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('warns when toDepth <= fromDepth', () => {
    render(
      <IntervalForm
        defaultValues={{ fromDepth: 5, toDepth: 5 }}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByText(/debe ser mayor que/)).toBeInTheDocument();
  });

  it('blocks submit when fromDepth >= toDepth (zod refine)', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <IntervalForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        defaultValues={{ ...validDefaults, fromDepth: 10, toDepth: 5 }}
      />,
    );
    fireEvent.submit(container.querySelector('form')!);
    expect(await screen.findByText(/'Desde' debe ser menor que 'Hasta'/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid defaultValues', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <IntervalForm onSubmit={onSubmit} onCancel={vi.fn()} defaultValues={validDefaults} />,
    );
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject(validDefaults);
  });

  it('shows RQD progress bar when RQD set', () => {
    setup({ defaultValues: { ...validDefaults, rqd: 75, recovery: 90 } });
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('full Radix Select interaction submits all required fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <IntervalForm onSubmit={onSubmit} onCancel={vi.fn()} fromDepthMin={2} />,
    );
    const open = (idx: number) => {
      const triggers = screen.getAllByRole('combobox');
      fireEvent.pointerDown(triggers[idx], { button: 0, ctrlKey: false, pointerType: 'mouse' });
    };
    const pick = async (name: string) => {
      const opts = await screen.findAllByRole('option', { name });
      const visible = opts.find((o) => o.tagName !== 'OPTION');
      fireEvent.click(visible ?? opts[0]);
    };

    open(0); await pick('Sedimentaria');
    open(1); await pick('Arenisca');
    open(2); await pick('Rojo');
    open(3); await pick('Clastica');
    open(4); await pick('Fina');

    fireEvent.change(screen.getByPlaceholderText(/Cuarzo, Feldespato/), { target: { value: 'Qz' } });
    fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      fromDepth: 2,
      toDepth: 3,
      rockGroup: 'Sedimentaria',
      rockType: 'Arenisca',
      color: 'Rojo',
      texture: 'Clastica',
      grainSize: 'Fina',
      mineralogy: 'Qz',
    });
  });
});
