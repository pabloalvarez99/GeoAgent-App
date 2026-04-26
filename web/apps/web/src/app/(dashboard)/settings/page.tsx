'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LogOut,
  User,
  Database,
  Info,
  Wifi,
  Shield,
  RefreshCw,
  CheckCircle2,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StatusBadge } from '@/components/ui/status-badge';

function UserAvatar({ user }: { user: NonNullable<ReturnType<typeof useAuth>['user']> }) {
  const initials = (
    user.displayName
      ? user.displayName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : (user.email?.[0] ?? '?').toUpperCase()
  );

  if (user.photoURL) {
    return (
      <div className="relative h-14 w-14 rounded-full overflow-hidden ring-2 ring-border shrink-0">
        <Image
          src={user.photoURL}
          alt={user.displayName ?? 'Avatar'}
          fill
          className="object-cover"
          sizes="56px"
        />
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-2 ring-border text-primary font-semibold text-lg select-none">
      {initials}
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between py-2.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium truncate max-w-xs sm:text-right ${
          mono ? 'font-mono text-xs tracking-tight text-muted-foreground' : ''
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      toast.success('GeoAgent instalado correctamente');
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  async function handleSync() {
    setSyncing(true);
    setSyncDone(false);
    // Force Next.js to revalidate all active server components / Client segments
    router.refresh();
    // Brief delay so the spinner is visible
    await new Promise((r) => setTimeout(r, 1200));
    setSyncing(false);
    setSyncDone(true);
    setTimeout(() => setSyncDone(false), 3000);
  }

  if (!user) return null;

  const displayName =
    user.displayName || user.email?.split('@')[0] || 'Usuario';

  const firebaseProjectId =
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? 'geoagent-app';
  const firebaseAuthDomain = `${firebaseProjectId}.firebaseapp.com`;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preferencias de cuenta y estado de conexión
        </p>
      </div>

      {/* Section 1: Perfil de usuario */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Perfil de usuario</CardTitle>
          </div>
          <CardDescription>Tu información de cuenta de GeoAgent</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <UserAvatar user={user} />
            <div className="min-w-0">
              <p className="font-semibold truncate">{displayName}</p>
              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>

          <Separator />

          {/* Details */}
          <div className="divide-y divide-border">
            <InfoRow label="Nombre" value={displayName} />
            <InfoRow label="Correo electrónico" value={user.email ?? '—'} />
            <InfoRow
              label="UID"
              value={user.uid}
              mono
            />
          </div>

          <Separator />

          <Button
            variant="outline"
            className="text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar sesión
          </Button>
        </CardContent>
      </Card>

      {/* Section 2: Conexión Firebase */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Conexión Firebase</CardTitle>
          </div>
          <CardDescription>Estado de sincronización con la nube</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <StatusBadge
              variant={isOnline ? 'success' : 'warning'}
              label={isOnline ? 'En línea' : 'Sin conexión'}
              pulse={isOnline}
              size="md"
            />
            <span className="text-xs text-muted-foreground">
              {isOnline ? 'Firebase Auth activo' : 'Usando caché local de Firestore'}
            </span>
          </div>

          <Separator />

          <div className="divide-y divide-border">
            <InfoRow label="Project ID" value={firebaseProjectId} mono />
            <InfoRow label="Auth Domain" value={firebaseAuthDomain} mono />
            <InfoRow label="Proveedor" value="Email / Contraseña" />
          </div>

          <Separator />

          <div className="flex items-start gap-2.5 rounded-md bg-muted/50 p-3 text-sm">
            <Database className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground leading-relaxed">
              Sincronización en tiempo real activa — los datos se sincronizan automáticamente
              con la app Android a través de Firebase Firestore.
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleSync}
            disabled={syncing}
            className="gap-2"
          >
            {syncDone ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-green-500">Datos actualizados</span>
              </>
            ) : (
              <>
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Section 3: Acerca de GeoAgent */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Acerca de GeoAgent</CardTitle>
          </div>
          <CardDescription>Información de la plataforma</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="divide-y divide-border">
            <InfoRow label="Versión web" value="1.0.0" />
            <InfoRow label="Plataforma" value="Next.js 16 + Firebase Firestore" />
            <InfoRow label="UI" value="shadcn/ui + Tailwind CSS" />
          </div>

          <Separator />

          <div className="flex items-start gap-2.5 rounded-md bg-muted/50 p-3 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-muted-foreground leading-relaxed">
              GeoAgent Web se sincroniza con la app Android nativa (Kotlin + Jetpack Compose)
              a través de Firebase. Los datos de campo recolectados en la app móvil aparecen
              aquí automáticamente.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Atajos de teclado */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Atajos de teclado</CardTitle>
          </div>
          <CardDescription>Accesos rápidos disponibles en toda la aplicación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            {[
              { keys: ['⌃', 'K'], label: 'Abrir búsqueda rápida' },
              { keys: ['⌃', 'N'], label: 'Ir a Proyectos' },
              { keys: ['⌃', 'E'], label: 'Exportar (proyecto activo)' },
              { keys: ['Esc'], label: 'Cerrar diálogos y paleta de comandos' },
              { keys: ['↑', '↓'], label: 'Navegar resultados en paleta' },
              { keys: ['↵'], label: 'Ejecutar acción seleccionada' },
            ].map(({ keys, label }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <div className="flex items-center gap-1">
                  {keys.map((k) => (
                    <kbd key={k} className="text-xs border border-border rounded px-1.5 py-0.5 font-mono bg-muted/50">{k}</kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
