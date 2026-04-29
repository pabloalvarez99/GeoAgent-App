import Link from 'next/link';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Compass className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold">404</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No encontramos lo que buscabas.
        </p>
        <Button asChild size="sm" className="mt-4 gap-1.5">
          <Link href="/home">
            <Home className="h-3.5 w-3.5" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </div>
  );
}
