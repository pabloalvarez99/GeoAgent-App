import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSub = vi.fn();
const mockSave = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/firebase/firestore', () => ({
  subscribeToSamples: (...args: unknown[]) => mockSub(...args),
  saveSample: (...args: unknown[]) => mockSave(...args),
  deleteSample: vi.fn(),
}));

vi.mock('@/lib/firebase/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useSamples } from './use-samples';

describe('useSamples', () => {
  beforeEach(() => vi.clearAllMocks());

  it('skips when no user', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useSamples('st1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSub).not.toHaveBeenCalled();
  });

  it('skips when stationId empty', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    const { result } = renderHook(() => useSamples(''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSub).not.toHaveBeenCalled();
  });

  it('subscribes and pushes samples', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let cb: ((data: unknown[]) => void) | null = null;
    mockSub.mockImplementation((_uid, _sid, onData) => {
      cb = onData;
      return () => {};
    });
    const { result } = renderHook(() => useSamples('st1'));
    expect(mockSub).toHaveBeenCalledWith('u1', 'st1', expect.any(Function));
    act(() => cb!([{ id: 'sm1' }]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.samples).toEqual([{ id: 'sm1' }]);
  });

  it('addOrUpdateSample requires auth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useSamples('st1'));
    await expect(result.current.addOrUpdateSample({} as never)).rejects.toThrow('No autenticado');
  });
});
