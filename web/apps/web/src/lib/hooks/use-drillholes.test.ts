import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubHoles = vi.fn();
const mockSubIntervals = vi.fn();
const mockCreateHole = vi.fn();
const mockSaveInterval = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/firebase/firestore', () => ({
  subscribeToDrillHoles: (...args: unknown[]) => mockSubHoles(...args),
  subscribeToDrillIntervals: (...args: unknown[]) => mockSubIntervals(...args),
  createDrillHole: (...args: unknown[]) => mockCreateHole(...args),
  updateDrillHole: vi.fn(),
  deleteDrillHole: vi.fn(),
  saveDrillInterval: (...args: unknown[]) => mockSaveInterval(...args),
  deleteDrillInterval: vi.fn(),
}));

vi.mock('@/lib/firebase/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useDrillHoles, useDrillIntervals } from './use-drillholes';

describe('useDrillHoles', () => {
  beforeEach(() => vi.clearAllMocks());

  it('skips subscription when no user', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useDrillHoles('proj1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubHoles).not.toHaveBeenCalled();
  });

  it('skips subscription when projectId empty', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    const { result } = renderHook(() => useDrillHoles(''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubHoles).not.toHaveBeenCalled();
  });

  it('subscribes and pushes data', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let cb: ((data: unknown[]) => void) | null = null;
    mockSubHoles.mockImplementation((_uid, _pid, onData) => {
      cb = onData;
      return () => {};
    });
    const { result } = renderHook(() => useDrillHoles('proj1'));
    expect(mockSubHoles).toHaveBeenCalledWith('u1', 'proj1', expect.any(Function), expect.any(Function));
    act(() => cb!([{ id: 'd1' }]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.drillHoles).toEqual([{ id: 'd1' }]);
  });

  it('addDrillHole requires auth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useDrillHoles('proj1'));
    await expect(result.current.addDrillHole({} as never)).rejects.toThrow('No autenticado');
  });

  it('mutations delegate when authenticated, throw when not', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    mockSubHoles.mockReturnValue(() => {});
    const { result } = renderHook(() => useDrillHoles('proj1'));
    await result.current.addDrillHole({ holeId: 'd' } as never);
    expect(mockCreateHole).toHaveBeenCalledWith('u1', { holeId: 'd' });
    await result.current.editDrillHole('d1', { holeId: 'd2' });
    await result.current.removeDrillHole('d1');

    mockUseAuth.mockReturnValue({ user: null });
    const { result: r2 } = renderHook(() => useDrillHoles('proj1'));
    await expect(r2.current.editDrillHole('d1', {})).rejects.toThrow('No autenticado');
    await expect(r2.current.removeDrillHole('d1')).rejects.toThrow('No autenticado');
  });

  it('subscribe error callback clears loading', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let errCb: (() => void) | null = null;
    mockSubHoles.mockImplementation((_u, _p, _ok, onErr) => {
      errCb = onErr;
      return () => {};
    });
    const { result } = renderHook(() => useDrillHoles('proj1'));
    act(() => errCb!());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});

describe('useDrillIntervals', () => {
  beforeEach(() => vi.clearAllMocks());

  it('skips when no user or no drillHoleId', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useDrillIntervals('dh1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubIntervals).not.toHaveBeenCalled();
  });

  it('subscribes and pushes intervals', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let cb: ((data: unknown[]) => void) | null = null;
    mockSubIntervals.mockImplementation((_uid, _dhid, onData) => {
      cb = onData;
      return () => {};
    });
    const { result } = renderHook(() => useDrillIntervals('dh1'));
    expect(mockSubIntervals).toHaveBeenCalledWith('u1', 'dh1', expect.any(Function));
    act(() => cb!([{ id: 'i1', from: 0, to: 1 }]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.intervals).toEqual([{ id: 'i1', from: 0, to: 1 }]);
  });

  it('saveInterval requires auth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useDrillIntervals('dh1'));
    await expect(result.current.saveInterval({} as never)).rejects.toThrow('No autenticado');
  });

  it('mutations delegate when authenticated, removeInterval throws when unauth', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    mockSubIntervals.mockReturnValue(() => {});
    const { result } = renderHook(() => useDrillIntervals('dh1'));
    await result.current.saveInterval({ from: 0 } as never, 'i1');
    expect(mockSaveInterval).toHaveBeenCalledWith('u1', { from: 0 }, 'i1');
    await result.current.removeInterval('i1');

    mockUseAuth.mockReturnValue({ user: null });
    const { result: r2 } = renderHook(() => useDrillIntervals('dh1'));
    await expect(r2.current.removeInterval('i1')).rejects.toThrow('No autenticado');
  });

  it('skips when drillHoleId empty', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    const { result } = renderHook(() => useDrillIntervals(''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubIntervals).not.toHaveBeenCalled();
  });
});
