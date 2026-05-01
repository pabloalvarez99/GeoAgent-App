import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubscribe = vi.fn();
const mockSave = vi.fn();
const mockDelete = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/firebase/firestore', () => ({
  subscribeToStructural: (...args: unknown[]) => mockSubscribe(...args),
  saveStructural: (...args: unknown[]) => mockSave(...args),
  deleteStructural: (...args: unknown[]) => mockDelete(...args),
}));

vi.mock('@/lib/firebase/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useStructural } from './use-structural';

describe('useStructural', () => {
  beforeEach(() => vi.clearAllMocks());

  it('skips subscription when no user', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useStructural('st1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('skips subscription when stationId empty', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    const { result } = renderHook(() => useStructural(''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes with uid + stationId and pushes data', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let cb: ((data: unknown[]) => void) | null = null;
    mockSubscribe.mockImplementation((_uid, _sid, onData) => {
      cb = onData;
      return () => {};
    });
    const { result } = renderHook(() => useStructural('st1'));
    expect(mockSubscribe).toHaveBeenCalledWith('u1', 'st1', expect.any(Function));
    act(() => cb!([{ id: 'x1' }]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.structural).toEqual([{ id: 'x1' }]);
  });

  it('addOrUpdateStructural requires auth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useStructural('st1'));
    await expect(result.current.addOrUpdateStructural({} as never)).rejects.toThrow('No autenticado');
  });

  it('removeStructural requires auth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useStructural('st1'));
    await expect(result.current.removeStructural('x1')).rejects.toThrow('No autenticado');
  });
});
