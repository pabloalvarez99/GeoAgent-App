import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AuthProvider } from '@/lib/firebase/auth';
import { Toaster } from 'sonner';
import './globals.css';

export const metadata: Metadata = {
  title: 'GeoAgent',
  description: 'Plataforma de administración geológica — Web y Desktop',
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
