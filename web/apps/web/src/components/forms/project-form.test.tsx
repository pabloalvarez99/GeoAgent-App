import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProjectForm } from './project-form';

function setup(overrides: Partial<React.ComponentProps<typeof ProjectForm>> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(<ProjectForm onSubmit={onSubmit} onCancel={onCancel} {...overrides} />);
  return { onSubmit, onCancel };
}

describe('ProjectForm', () => {
  it('renders three inputs + actions', () => {
    setup();
    expect(screen.getByLabelText(/Nombre del proyecto/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ubicación/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeInTheDocument();
  });

  it('uses custom submitLabel', () => {
    setup({ submitLabel: 'Crear' });
    expect(screen.getByRole('button', { name: 'Crear' })).toBeInTheDocument();
  });

  it('hydrates defaultValues', () => {
    setup({
      defaultValues: { name: 'P1', description: 'desc', location: 'Atacama' },
    });
    expect(screen.getByLabelText(/Nombre del proyecto/)).toHaveValue('P1');
    expect(screen.getByLabelText(/Descripción/)).toHaveValue('desc');
    expect(screen.getByLabelText(/Ubicación/)).toHaveValue('Atacama');
  });

  it('cancel button calls onCancel', () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows validation errors when submitting empty', async () => {
    const { onSubmit } = setup();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText(/Nombre del proyecto es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Descripcion es obligatorio/)).toBeInTheDocument();
    expect(screen.getByText(/Ubicacion es obligatorio/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits valid data', async () => {
    const { onSubmit } = setup();
    fireEvent.change(screen.getByLabelText(/Nombre del proyecto/), { target: { value: 'Norte' } });
    fireEvent.change(screen.getByLabelText(/Descripción/), { target: { value: 'Cu-Au' } });
    fireEvent.change(screen.getByLabelText(/Ubicación/), { target: { value: 'Atacama' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      { name: 'Norte', description: 'Cu-Au', location: 'Atacama' },
      expect.anything(),
    );
  });

  it('disables buttons + shows spinner while submitting', async () => {
    let resolve: () => void = () => {};
    const onSubmit = vi.fn(
      () => new Promise<void>((r) => {
        resolve = r;
      }),
    );
    render(<ProjectForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Nombre del proyecto/), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText(/Descripción/), { target: { value: 'B' } });
    fireEvent.change(screen.getByLabelText(/Ubicación/), { target: { value: 'C' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText(/Guardando/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    resolve();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
  });
});
