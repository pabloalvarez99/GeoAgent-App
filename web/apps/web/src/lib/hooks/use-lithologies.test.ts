import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubscribe = vi.fn();
const mockSave = vi.fn();
const mockDelete = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/firebase/firestore', () => ({
  subscribeToLithologies: (...args: unknown[]) => mockSubscribe(...args),
  saveLithology: (...args: unknown[]) => mockSave(...args),
  deleteLithology: (...args: unknown[]) => mockDelete(...args),
}));

vi.mock('@/lib/firebase/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useLithologies } from './use-lithologies';

describe('useLithologies', () => {
  beforeEach(() => vi.clearAllMocks());

  it('skips subscription when no user', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useLithologies('st1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('skips subscription when stationId empty', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    const { result } = renderHook(() => useLithologies(''));
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
    const { result } = renderHook(() => useLithologies('st1'));
    expect(mockSubscribe).toHaveBeenCalledWith('u1', 'st1', expect.any(Function));
    act(() => cb!([{ id: 'l1' }]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.lithologies).toEqual([{ id: 'l1' }]);
  });

  it('addOrUpdateLithology requires auth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useLithologies('st1'));
    await expect(result.current.addOrUpdateLithology({} as never)).rejects.toThrow('No autenticado');
  });

  it('removeLithology requires auth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useLithologies('st1'));
    await expect(result.current.removeLithology('l1')).rejects.toThrow('No autenticado');
  });
});
