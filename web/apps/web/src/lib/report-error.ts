/**
 * Centralized error reporter. Currently logs to console.
 *
 * To enable Sentry:
 *   1. pnpm add @sentry/nextjs
 *   2. npx @sentry/wizard@latest -i nextjs
 *   3. Set NEXT_PUBLIC_SENTRY_DSN in Vercel env
 *   4. Replace the console.error block below with:
 *        const Sentry = await import('@sentry/nextjs');
 *        Sentry.captureException(error, { tags: { scope }, extra: context });
 */
type ErrorContext = Record<string, unknown> | undefined;

export function reportError(
  scope: string,
  error: unknown,
  context?: ErrorContext,
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  // eslint-disable-next-line no-console
  console.error(`[${scope}]`, err, context ?? {});

  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    // Sentry hook point — see header comment.
  }
}
