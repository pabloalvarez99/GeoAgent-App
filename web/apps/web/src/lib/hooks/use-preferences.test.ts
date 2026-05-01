import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { usePreferences } from './use-preferences';

const KEY = 'geoagent-display-prefs';

describe('usePreferences', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to DD + comfortable', () => {
    const { result } = renderHook(() => usePreferences());
    expect(result.current.coordFormat).toBe('DD');
    expect(result.current.density).toBe('comfortable');
  });

  it('hydrates from localStorage', () => {
    localStorage.setItem(KEY, JSON.stringify({ coordFormat: 'DMS', density: 'compact' }));
    const { result } = renderHook(() => usePreferences());
    expect(result.current.coordFormat).toBe('DMS');
    expect(result.current.density).toBe('compact');
  });

  it('ignores corrupted JSON gracefully', () => {
    localStorage.setItem(KEY, '{not json');
    const { result } = renderHook(() => usePreferences());
    expect(result.current.coordFormat).toBe('DD');
  });

  it('setCoordFormat persists to localStorage', () => {
    const { result } = renderHook(() => usePreferences());
    act(() => result.current.setCoordFormat('DMS'));
    expect(result.current.coordFormat).toBe('DMS');
    expect(JSON.parse(localStorage.getItem(KEY)!).coordFormat).toBe('DMS');
  });

  it('setDensity persists to localStorage', () => {
    const { result } = renderHook(() => usePreferences());
    act(() => result.current.setDensity('compact'));
    expect(result.current.density).toBe('compact');
    expect(JSON.parse(localStorage.getItem(KEY)!).density).toBe('compact');
  });
});
