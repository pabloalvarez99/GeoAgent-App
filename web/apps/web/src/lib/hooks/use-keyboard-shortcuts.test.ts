import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardShortcuts, type Shortcut } from './use-keyboard-shortcuts';

function fireKey(opts: Partial<KeyboardEventInit & { target: EventTarget }>) {
  const ev = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...opts });
  if (opts.target) Object.defineProperty(ev, 'target', { value: opts.target });
  window.dispatchEvent(ev);
  return ev;
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires action on matching key without modifiers', () => {
    const action = vi.fn();
    const shortcuts: Shortcut[] = [{ key: 'n', description: 'new', action }];
    renderHook(() => useKeyboardShortcuts(shortcuts));
    fireKey({ key: 'n', target: document.body });
    expect(action).toHaveBeenCalledOnce();
  });

  it('case-insensitive key match', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'n', description: '', action }]));
    fireKey({ key: 'N', target: document.body });
    expect(action).toHaveBeenCalledOnce();
  });

  it('skips when target is INPUT', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'n', description: '', action }]));
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireKey({ key: 'n', target: input });
    expect(action).not.toHaveBeenCalled();
  });

  it('skips when target is contentEditable', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'n', description: '', action }]));
    const div = document.createElement('div');
    div.contentEditable = 'true';
    Object.defineProperty(div, 'isContentEditable', { value: true });
    document.body.appendChild(div);
    fireKey({ key: 'n', target: div });
    expect(action).not.toHaveBeenCalled();
  });

  it('respects ctrl modifier requirement', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'k', ctrl: true, description: '', action }]));
    fireKey({ key: 'k', target: document.body });
    expect(action).not.toHaveBeenCalled();
    fireKey({ key: 'k', ctrlKey: true, target: document.body });
    expect(action).toHaveBeenCalledOnce();
  });

  it('respects shift modifier requirement', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'e', shift: true, description: '', action }]));
    fireKey({ key: 'e', target: document.body });
    expect(action).not.toHaveBeenCalled();
    fireKey({ key: 'e', shiftKey: true, target: document.body });
    expect(action).toHaveBeenCalledOnce();
  });

  it('preventDefault called on match', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'n', description: '', action }]));
    const ev = fireKey({ key: 'n', target: document.body });
    expect(ev.defaultPrevented).toBe(true);
  });

  it('no match → no action, no preventDefault', () => {
    const action = vi.fn();
    renderHook(() => useKeyboardShortcuts([{ key: 'n', description: '', action }]));
    const ev = fireKey({ key: 'z', target: document.body });
    expect(action).not.toHaveBeenCalled();
    expect(ev.defaultPrevented).toBe(false);
  });
});
