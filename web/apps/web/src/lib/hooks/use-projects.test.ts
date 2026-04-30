import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubscribe = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockUseAuth = vi.fn();

vi.mock('@/lib/firebase/firestore', () => ({
  subscribeToProjects: (...args: unknown[]) => mockSubscribe(...args),
  createProject: (...args: unknown[]) => mockCreate(...args),
  updateProject: (...args: unknown[]) => mockUpdate(...args),
  deleteProject: (...args: unknown[]) => mockDelete(...args),
}));

vi.mock('@/lib/firebase/auth', () => ({
  useAuth: () => mockUseAuth(),
}));

import { useProjects } from './use-projects';

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty + not-loading when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useProjects());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projects).toEqual([]);
    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it('subscribes and pushes projects when authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let cb: ((data: unknown[]) => void) | null = null;
    mockSubscribe.mockImplementation((_uid, onData) => {
      cb = onData;
      return () => {};
    });
    const { result } = renderHook(() => useProjects());
    expect(mockSubscribe).toHaveBeenCalledWith('u1', expect.any(Function));
    act(() => cb!([{ id: 'p1', name: 'Proj' }]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projects).toEqual([{ id: 'p1', name: 'Proj' }]);
  });

  it('addProject throws when unauthenticated', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useProjects());
    await expect(result.current.addProject({ name: 'x' } as never)).rejects.toThrow('No autenticado');
  });

  it('addProject delegates to createProject when authenticated', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    mockSubscribe.mockReturnValue(() => {});
    mockCreate.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProjects());
    await result.current.addProject({ name: 'x' } as never);
    expect(mockCreate).toHaveBeenCalledWith('u1', { name: 'x' });
  });
});
