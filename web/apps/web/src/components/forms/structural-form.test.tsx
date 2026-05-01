import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { StructuralForm } from './structural-form';

function setup(overrides: Partial<React.ComponentProps<typeof StructuralForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(<StructuralForm onSubmit={onSubmit} onCancel={onCancel} {...overrides} />);
  return { onSubmit, onCancel };
}

const validDefaults = {
  type: 'Falla',
  strike: 120,
  dip: 45,
  dipDirection: 'NE',
};

describe('StructuralForm', () => {
  it('renders core sections', () => {
    setup();
    expect(screen.getByText('Tipo y orientación')).toBeInTheDocument();
    expect(screen.getByText('Propiedades')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar estructura/ })).toBeInTheDocument();
  });

  it('cancel calls onCancel', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation errors when submitting empty', async () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Guardar estructura/ }));
    expect(await screen.findByText(/Tipo de estructura es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Direccion de buzamiento es obligatorio/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid defaultValues', async () => {
    const { onSubmit } = setup({ defaultValues: validDefaults });
    fireEvent.click(screen.getByRole('button', { name: /Guardar estructura/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject(validDefaults);
  });

  it('full Radix Select interaction submits all required fields', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<StructuralForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    const open = (idx: number) => {
      const triggers = screen.getAllByRole('combobox');
      fireEvent.pointerDown(triggers[idx], { button: 0, ctrlKey: false, pointerType: 'mouse' });
    };
    const pick = async (name: string) => {
      const opts = await screen.findAllByRole('option', { name });
      const visible = opts.find((o) => o.tagName !== 'OPTION');
      fireEvent.click(visible ?? opts[0]);
    };

    open(0); await pick('Falla');
    open(1); await pick('NE');
    open(2); await pick('Normal');
    open(3); await pick('Lisa');
    open(4); await pick('Continua');

    fireEvent.change(screen.getAllByPlaceholderText(/0–360/)[0], { target: { value: '120' } });
    fireEvent.change(screen.getByPlaceholderText(/0–90/), { target: { value: '45' } });

    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      type: 'Falla',
      strike: 120,
      dip: 45,
      dipDirection: 'NE',
      movement: 'Normal',
      roughness: 'Lisa',
      continuity: 'Continua',
    });
  });

  it('rejects strike out of range', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const { container } = render(
      <StructuralForm
        onSubmit={onSubmit}
        onCancel={vi.fn()}
        defaultValues={{ ...validDefaults, strike: 400 }}
      />,
    );
    fireEvent.submit(container.querySelector('form')!);
    expect(await screen.findByText(/Rumbo debe estar entre 0 y 360/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
