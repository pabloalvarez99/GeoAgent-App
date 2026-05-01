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

  it('editProject + removeProject delegate when authenticated, throw when not', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    mockSubscribe.mockReturnValue(() => {});
    mockUpdate.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
    const { result } = renderHook(() => useProjects());
    await result.current.editProject('p1', { name: 'y' });
    expect(mockUpdate).toHaveBeenCalledWith('u1', 'p1', { name: 'y' });
    await result.current.removeProject('p1');
    expect(mockDelete).toHaveBeenCalledWith('u1', 'p1');

    mockUseAuth.mockReturnValue({ user: null });
    const { result: r2 } = renderHook(() => useProjects());
    await expect(r2.current.editProject('p1', {})).rejects.toThrow('No autenticado');
    await expect(r2.current.removeProject('p1')).rejects.toThrow('No autenticado');
  });
});

import { useProject } from './use-projects';

describe('useProject', () => {
  beforeEach(() => vi.clearAllMocks());

  it('finds project by id from subscribed list', async () => {
    mockUseAuth.mockReturnValue({ user: { uid: 'u1' } });
    let cb: ((data: unknown[]) => void) | null = null;
    mockSubscribe.mockImplementation((_uid, onData) => {
      cb = onData;
      return () => {};
    });
    const { result } = renderHook(() => useProject('p1'));
    act(() => cb!([{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }]));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.project).toEqual({ id: 'p1', name: 'A' });
  });

  it('returns null when id not found', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useProject('nope'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.project).toBeNull();
  });
});
