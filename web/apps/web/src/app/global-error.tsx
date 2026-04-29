'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[global:error]', error);
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0b',
          color: '#e7e7ea',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 480,
            width: '100%',
            border: '1px solid #2a2a30',
            borderRadius: 12,
            padding: '1.5rem',
            background: '#111114',
          }}
        >
          <h1 style={{ fontSize: 18, margin: 0, marginBottom: 8 }}>Error crítico</h1>
          <p style={{ fontSize: 14, color: '#a0a0a8', margin: 0, marginBottom: 16 }}>
            La aplicación encontró un error inesperado. Recarga la página para continuar.
          </p>
          {error.digest && (
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#6a6a72', margin: 0, marginBottom: 16 }}>
              ref: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: '0.5rem 1rem',
              fontSize: 13,
              fontWeight: 500,
              borderRadius: 6,
              border: 'none',
              background: '#22c55e',
              color: '#0a0a0b',
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
