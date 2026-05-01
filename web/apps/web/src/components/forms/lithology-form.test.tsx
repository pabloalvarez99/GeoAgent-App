import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LithologyForm } from './lithology-form';

function setup(overrides: Partial<React.ComponentProps<typeof LithologyForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(<LithologyForm onSubmit={onSubmit} onCancel={onCancel} {...overrides} />);
  return { onSubmit, onCancel };
}

const validDefaults = {
  rockType: 'Granito',
  rockGroup: 'Ígnea',
  color: 'Gris',
  texture: 'Fanerítica',
  grainSize: 'Grueso',
  mineralogy: 'Cuarzo, feldespato',
};

describe('LithologyForm', () => {
  it('renders header sections + actions', () => {
    setup();
    expect(screen.getByText('Tipo de roca')).toBeInTheDocument();
    expect(screen.getByText('Alteración y mineralización')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Guardar litología/ })).toBeInTheDocument();
  });

  it('cancel calls onCancel', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation errors when submitting empty', async () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByRole('button', { name: /Guardar litología/ }));
    expect(await screen.findByText(/Tipo de roca es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Grupo de roca es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Color es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Textura es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Mineralogia es obligatorio/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid defaultValues', async () => {
    const { onSubmit } = setup({ defaultValues: validDefaults });
    fireEvent.click(screen.getByRole('button', { name: /Guardar litología/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject(validDefaults);
  });

  it('hydrates mineralogy + notes inputs', () => {
    setup({
      defaultValues: { ...validDefaults, mineralogy: 'Pirita', notes: 'comentario' },
    });
    expect(screen.getByDisplayValue('Pirita')).toBeInTheDocument();
    expect(screen.getByDisplayValue('comentario')).toBeInTheDocument();
  });

  it('selecting rockGroup populates rockType options + resets rockType', async () => {
    const { onSubmit } = setup();
    const triggers = screen.getAllByRole('combobox');
    // First trigger = Grupo de roca
    fireEvent.pointerDown(triggers[0], { button: 0, ctrlKey: false, pointerType: 'mouse' });
    const igneaOpt = await screen.findByRole('option', { name: 'Ignea' });
    fireEvent.click(igneaOpt);
    // After selecting group, rockType placeholder changes to "Seleccionar tipo"
    await waitFor(() => {
      const after = screen.getAllByRole('combobox');
      expect(after[1].textContent).toMatch(/Seleccionar tipo/);
    });
    // Open rockType select and pick first option
    const after = screen.getAllByRole('combobox');
    fireEvent.pointerDown(after[1], { button: 0, ctrlKey: false, pointerType: 'mouse' });
    const opt = await screen.findAllByRole('option');
    fireEvent.click(opt[0]);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits with all selects via Radix interaction', async () => {
    const { onSubmit } = setup();
    const open = (idx: number) => {
      const triggers = screen.getAllByRole('combobox');
      fireEvent.pointerDown(triggers[idx], { button: 0, ctrlKey: false, pointerType: 'mouse' });
    };
    const pick = async (name: string) => {
      // Radix renders native <select> + listbox; pick role=option in the listbox (not the hidden native one)
      const opts = await screen.findAllByRole('option', { name });
      const visible = opts.find((o) => o.getAttribute('role') === 'option' && o.tagName !== 'OPTION');
      fireEvent.click(visible ?? opts[0]);
    };

    open(0); await pick('Ignea');
    open(1); await pick('Granito');
    open(2); await pick('Negro');
    open(3); await pick('Faneritica');
    open(4); await pick('Media');

    fireEvent.change(screen.getByPlaceholderText(/Cuarzo, Feldespato/), { target: { value: 'Qz, Fk' } });

    fireEvent.click(screen.getByRole('button', { name: /Guardar litología/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      rockGroup: 'Ignea',
      rockType: 'Granito',
      color: 'Negro',
      texture: 'Faneritica',
      grainSize: 'Media',
      mineralogy: 'Qz, Fk',
    });
  });
});
