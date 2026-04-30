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
});
