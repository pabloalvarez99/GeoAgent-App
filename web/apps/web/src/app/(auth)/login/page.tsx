'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Custom GeoAgent triangle logo mark
function GeoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" aria-hidden>
      <polygon
        points="256,88 420,348 92,348"
        stroke="#22c55e"
        strokeWidth="52"
        strokeLinejoin="round"
        fill="rgba(34,197,94,0.07)"
      />
      <circle cx="256" cy="88" r="36" fill="#22c55e" />
      <line x1="92" y1="362" x2="420" y2="362" stroke="#22c55e" strokeWidth="28" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export default function LoginPage() {
  const { signIn, resetPassword, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/projects');
    }
  }, [loading, user, router]);

  if (!loading && user) {
    return null;
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResetSubmitting(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/user-not-found') {
        setError('No existe una cuenta con ese email.');
      } else {
        setError('Error al enviar el correo. Verifica tu conexión.');
      }
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace('/projects');
    } catch (err: any) {
      const code = err?.code ?? '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos.');
      } else if (code === 'auth/user-not-found') {
        setError('No existe una cuenta con ese email.');
      } else if (code === 'auth/too-many-requests') {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.');
      } else {
        setError('Error al iniciar sesión. Verifica tu conexión.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background px-4 overflow-hidden">
      {/* Subtle grid texture */}
      <div className="login-grid absolute inset-0 pointer-events-none" />
      {/* Green radial glow at top */}
      <div className="login-glow absolute inset-0 pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-primary/10 ring-1 ring-primary/20">
            <GeoMark size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight">GeoAgent</h1>
            <p className="text-sm text-muted-foreground">
              Plataforma de geología de campo
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">
              {forgotMode ? 'Recuperar contraseña' : 'Iniciar sesión'}
            </CardTitle>
            <CardDescription>
              {forgotMode
                ? 'Ingresa tu email y te enviaremos un enlace de recuperación'
                : 'Usa las mismas credenciales de la app Android'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forgotMode ? (
              resetSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-primary bg-primary/10 rounded-md px-3 py-2">
                    Correo enviado. Revisa tu bandeja de entrada.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => { setForgotMode(false); setResetSent(false); }}>
                    Volver al inicio de sesión
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="geologo@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={resetSubmitting}>
                    {resetSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar enlace'}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => { setForgotMode(false); setError(''); }}>
                    Cancelar
                  </Button>
                </form>
              )
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="geologo@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => { setForgotMode(true); setError(''); }}
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Iniciando sesión...
                    </>
                  ) : (
                    'Iniciar sesión'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Solo usuarios registrados en la app Android pueden acceder.
        </p>
      </div>
    </div>
  );
}
