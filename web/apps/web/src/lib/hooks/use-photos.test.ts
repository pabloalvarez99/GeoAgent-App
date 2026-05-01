import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubscribe = vi.fn();
const mockDelete = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/firebase/firestore', () => ({
  subscribeToPhotos: (...args: unknown[]) => mockSubscribe(...args),
  deletePhoto: (...args: unknown[]) => mockDelete(...args),
}));

vi.mock('@/lib/firebase/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { usePhotos } from './use-photos';

describe('usePhotos', () => {
  beforeEach(() => vi.clearAllMocks());

  it('skips subscription when no user', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => usePhotos({ projectId: 'p1' }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('skips subscription when no filter key', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    const { result } = renderHook(() => usePhotos({}));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes with uid + filters and pushes data', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let cb: ((data: unknown[]) => void) | null = null;
    mockSubscribe.mockImplementation((_uid, _filters, onData) => {
      cb = onData;
      return () => {};
    });
    const filters = { projectId: 'p1' };
    const { result } = renderHook(() => usePhotos(filters));
    expect(mockSubscribe).toHaveBeenCalledWith('u1', filters, expect.any(Function));
    act(() => cb!([{ id: 'ph1' }]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.photos).toEqual([{ id: 'ph1' }]);
  });

  it('removePhoto requires auth', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => usePhotos({ projectId: 'p1' }));
    await expect(result.current.removePhoto('ph1')).rejects.toThrow('No autenticado');
  });
});
