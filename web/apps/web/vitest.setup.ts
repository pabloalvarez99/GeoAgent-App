import '@testing-library/jest-dom/vitest';

// Radix UI primitives (Select, Dialog, etc.) call PointerEvent capture APIs and
// scrollIntoView on Element. happy-dom doesn't ship them. Stub them so the
// pointer-down / option-click flow doesn't blow up in tests.
if (typeof window !== 'undefined') {
  const E = Element.prototype as unknown as Record<string, unknown>;
  if (!E.hasPointerCapture) E.hasPointerCapture = () => false;
  if (!E.setPointerCapture) E.setPointerCapture = () => {};
  if (!E.releasePointerCapture) E.releasePointerCapture = () => {};
  if (!E.scrollIntoView) E.scrollIntoView = () => {};
}
