'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard:error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-destructive/15 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold">Algo salió mal</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Se produjo un error al cargar esta sección. Puedes reintentar o volver al inicio.
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-muted-foreground/70">
                ref: {error.digest}
              </p>
            )}
            {process.env.NODE_ENV === 'development' && error.message && (
              <pre className="mt-3 overflow-x-auto rounded border border-border bg-background/60 p-2 text-[11px] text-muted-foreground">
                {error.message}
              </pre>
            )}
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={reset} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar
              </Button>
              <Button size="sm" variant="outline" asChild className="gap-1.5">
                <Link href="/home">
                  <Home className="h-3.5 w-3.5" />
                  Inicio
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
