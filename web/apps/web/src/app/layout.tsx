import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AuthProvider } from '@/lib/firebase/auth';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'GeoAgent',
    template: '%s — GeoAgent',
  },
  description: 'Plataforma de administración geológica — recolección y análisis de datos de campo',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GeoAgent',
  },
  openGraph: {
    title: 'GeoAgent',
    description: 'Plataforma de geología de campo — web y Android',
    type: 'website',
    locale: 'es_CL',
  },
};

export const viewport: Viewport = {
  themeColor: '#22c55e',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <AuthProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" richColors />
        </AuthProvider>
      </body>
    </html>
  );
}
