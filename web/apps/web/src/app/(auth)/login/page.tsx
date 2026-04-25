'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mountain, Wifi, Shield, RefreshCw, Globe } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Topographic contour lines — geological identity visual
function TopoBackground() {
  return (
    <svg
      viewBox="0 0 500 700"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 h-full w-full opacity-[0.07]"
      aria-hidden
    >
      <path d="M-20 400 Q80 340 180 380 Q280 420 380 360 Q480 300 560 340" stroke="#22c55e" strokeWidth="1.5" fill="none" />
      <path d="M-20 430 Q100 360 200 400 Q300 440 400 375 Q500 310 580 355" stroke="#22c55e" strokeWidth="1.5" fill="none" />
      <path d="M-20 460 Q120 380 220 420 Q320 460 420 390 Q520 320 600 370" stroke="#22c55e" strokeWidth="1.5" fill="none" />
      <path d="M-20 490 Q140 400 240 445 Q340 490 440 410 Q540 330 620 385" stroke="#22c55e" strokeWidth="1.5" fill="none" />
      <path d="M-20 370 Q60 320 160 355 Q260 390 360 335 Q460 280 540 325" stroke="#22c55e" strokeWidth="1" fill="none" />
      <path d="M-20 340 Q40 300 140 330 Q240 360 340 310 Q440 260 520 305" stroke="#22c55e" strokeWidth="1" fill="none" />
      <path d="M-20 520 Q160 420 260 470 Q360 520 460 430 Q560 340 640 400" stroke="#22c55e" strokeWidth="1" fill="none" />
      <path d="M-20 550 Q180 440 280 495 Q380 550 480 450 Q580 350 660 415" stroke="#22c55e" strokeWidth="0.8" fill="none" />
      <path d="M-20 580 Q200 460 300 520 Q400 580 500 470 Q600 360 680 430" stroke="#22c55e" strokeWidth="0.8" fill="none" />
      <path d="M50 0 Q90 100 70 200 Q50 300 90 400" stroke="#22c55e" strokeWidth="1" fill="none" />
      <path d="M150 0 Q190 120 165 240 Q140 360 180 460" stroke="#22c55e" strokeWidth="0.8" fill="none" />
      <path d="M250 0 Q285 130 260 260 Q235 390 275 490" stroke="#22c55e" strokeWidth="1" fill="none" />
      <path d="M350 0 Q380 140 355 280 Q330 420 370 520" stroke="#22c55e" strokeWidth="0.8" fill="none" />
      <path d="M450 0 Q475 150 450 300 Q425 450 465 550" stroke="#22c55e" strokeWidth="1" fill="none" />
      {/* Elevation markers */}
      <circle cx="180" cy="380" r="3" fill="#22c55e" opacity="0.5" />
      <circle cx="320" cy="330" r="2" fill="#22c55e" opacity="0.4" />
      <circle cx="260" cy="420" r="3" fill="#22c55e" opacity="0.5" />
      <circle cx="400" cy="360" r="2" fill="#22c55e" opacity="0.4" />
    </svg>
  );
}

const brandFeatures = [
  { icon: Wifi, text: 'Sincronización en tiempo real Android ↔ Web' },
  { icon: Shield, text: 'Datos protegidos con Firebase Auth' },
  { icon: RefreshCw, text: 'Funciona sin conexión — sincroniza al volver' },
  { icon: Globe, text: 'Acceso desde cualquier dispositivo' },
];

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

  if (!loading && user) {
    router.replace('/projects');
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
    <div className="min-h-screen flex bg-background">
      {/* ── Left brand panel (desktop only) ───────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[420px] relative flex-col justify-between p-10 overflow-hidden sidebar-surface border-r border-border/50">
        <TopoBackground />

        {/* Brand mark */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
              <Mountain className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">GeoAgent</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight leading-snug mb-4">
            Datos geológicos.<br />
            <span className="text-primary">Donde los necesitas.</span>
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[300px]">
            Plataforma profesional para recolección y análisis de datos geológicos de campo — Android, Web y Desktop en sincronía.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3.5">
          {brandFeatures.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 shrink-0">
                <Icon className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ──────────────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center gap-3 lg:hidden">
            <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
              <Mountain className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">GeoAgent</h1>
              <p className="text-sm text-muted-foreground">Plataforma de geología de campo</p>
            </div>
          </div>

          {/* Form header */}
          <div className="lg:block">
            <h1 className="text-2xl font-bold tracking-tight">
              {forgotMode ? 'Recuperar contraseña' : 'Bienvenido'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {forgotMode
                ? 'Te enviaremos un enlace de recuperación'
                : 'Usa las mismas credenciales de la app Android'}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {forgotMode ? (
              resetSent ? (
                <div className="space-y-4">
                  <p className="text-sm text-primary bg-primary/10 rounded-lg px-4 py-3 border border-primary/20">
                    Correo enviado. Revisa tu bandeja de entrada.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => { setForgotMode(false); setResetSent(false); }}
                  >
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
                    <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                      {error}
                    </p>
                  )}
                  <Button type="submit" className="w-full" disabled={resetSubmitting}>
                    {resetSubmitting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</>
                      : 'Enviar enlace de recuperación'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => { setForgotMode(false); setError(''); }}
                  >
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
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 border border-destructive/20">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full h-10" disabled={submitting}>
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
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Solo usuarios registrados en la app Android pueden acceder.
          </p>
        </div>
      </div>
    </div>
  );
}
