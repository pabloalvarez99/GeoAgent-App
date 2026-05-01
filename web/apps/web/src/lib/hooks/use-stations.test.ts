import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubscribe = vi.fn();
const mockCreate = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/firebase/firestore', () => ({
  subscribeToStations: (...args: unknown[]) => mockSubscribe(...args),
  createStation: (...args: unknown[]) => mockCreate(...args),
  updateStation: vi.fn(),
  deleteStation: vi.fn(),
}));

vi.mock('@/lib/firebase/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useStations } from './use-stations';

describe('useStations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('skips subscription when no user', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useStations('proj1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('skips subscription when projectId empty', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    const { result } = renderHook(() => useStations(''));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes with uid + projectId and pushes data', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let cb: ((data: unknown[]) => void) | null = null;
    mockSubscribe.mockImplementation((_uid, _pid, onData) => {
      cb = onData;
      return () => {};
    });
    const { result } = renderHook(() => useStations('proj1'));
    expect(mockSubscribe).toHaveBeenCalledWith('u1', 'proj1', expect.any(Function), expect.any(Function));
    act(() => cb!([{ id: 's1' }]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.stations).toEqual([{ id: 's1' }]);
  });

  it('addStation requires auth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useStations('proj1'));
    await expect(result.current.addStation({} as never)).rejects.toThrow('No autenticado');
  });

  it('mutations delegate when authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    mockSubscribe.mockReturnValue(() => {});
    mockCreate.mockResolvedValue(undefined);
    const { result } = renderHook(() => useStations('proj1'));
    await result.current.addStation({ code: 'st' } as never);
    expect(mockCreate).toHaveBeenCalledWith('u1', { code: 'st' });
    await result.current.editStation('s1', { code: 'st2' });
    await result.current.removeStation('s1');
  });

  it('editStation + removeStation throw when unauth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useStations('proj1'));
    await expect(result.current.editStation('s1', {})).rejects.toThrow('No autenticado');
    await expect(result.current.removeStation('s1')).rejects.toThrow('No autenticado');
  });

  it('subscribe error callback clears loading', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let errCb: (() => void) | null = null;
    mockSubscribe.mockImplementation((_uid, _pid, _ok, onErr) => {
      errCb = onErr;
      return () => {};
    });
    const { result } = renderHook(() => useStations('proj1'));
    act(() => errCb!());
    await waitFor(() => expect(result.current.loading).toBe(false));
  });
});
