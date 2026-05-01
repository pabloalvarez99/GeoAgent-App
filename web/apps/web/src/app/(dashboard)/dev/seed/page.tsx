'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  createProject,
  createDrillHole,
  saveDrillInterval,
} from '@/lib/firebase/firestore';
import { toast } from 'sonner';

type RockSpec = {
  type: string;
  group: 'Ignea' | 'Sedimentaria' | 'Metamorfica' | 'Otro';
  color: string;
  texture: string;
  grainSize: string;
  mineralogy: string;
  alteration?: string;
  alterationIntensity?: string;
  mineralization?: string;
  mineralizationPercent?: number;
};

const SUITE: RockSpec[] = [
  { type: 'Grava cuaternaria', group: 'Sedimentaria', color: 'Marrón claro', texture: 'Clástica', grainSize: 'Grueso', mineralogy: 'Cuarzo, feldespato, líticos' },
  { type: 'Andesita', group: 'Ignea', color: 'Gris oscuro', texture: 'Porfírica', grainSize: 'Fino', mineralogy: 'Plagioclasa, hornblenda, biotita', alteration: 'Propilítica', alterationIntensity: 'Débil' },
  { type: 'Andesita silicificada', group: 'Ignea', color: 'Gris claro', texture: 'Porfírica', grainSize: 'Fino', mineralogy: 'Plagioclasa, cuarzo secundario', alteration: 'Silícea', alterationIntensity: 'Moderada', mineralization: 'Pirita diseminada', mineralizationPercent: 2 },
  { type: 'Brecha hidrotermal', group: 'Ignea', color: 'Gris verdoso', texture: 'Brechosa', grainSize: 'Variable', mineralogy: 'Cuarzo, calcita, sulfuros', alteration: 'Silícea-Sericítica', alterationIntensity: 'Fuerte', mineralization: 'Pirita-Calcopirita', mineralizationPercent: 8 },
  { type: 'Pórfido cuarzo-feldespático', group: 'Ignea', color: 'Gris claro a beige', texture: 'Porfírica', grainSize: 'Medio', mineralogy: 'Cuarzo, feldespato potásico, biotita', alteration: 'Potásica', alterationIntensity: 'Moderada', mineralization: 'Calcopirita-Bornita', mineralizationPercent: 5 },
  { type: 'Pórfido mineralizado', group: 'Ignea', color: 'Gris verdoso', texture: 'Porfírica', grainSize: 'Medio', mineralogy: 'Cuarzo, feldespato, sulfuros', alteration: 'Potásica', alterationIntensity: 'Fuerte', mineralization: 'Calcopirita-Molibdenita', mineralizationPercent: 12 },
  { type: 'Diorita', group: 'Ignea', color: 'Verde grisáceo', texture: 'Fanerítica', grainSize: 'Medio', mineralogy: 'Plagioclasa, hornblenda', alteration: 'Propilítica', alterationIntensity: 'Moderada', mineralization: 'Pirita', mineralizationPercent: 3 },
  { type: 'Skarn de granate', group: 'Metamorfica', color: 'Marrón rojizo', texture: 'Granoblástica', grainSize: 'Grueso', mineralogy: 'Granate, piroxeno, magnetita', alteration: 'Skarn cálcico', alterationIntensity: 'Fuerte', mineralization: 'Magnetita-Calcopirita', mineralizationPercent: 15 },
  { type: 'Mármol', group: 'Metamorfica', color: 'Blanco grisáceo', texture: 'Granoblástica', grainSize: 'Medio', mineralogy: 'Calcita, dolomita' },
  { type: 'Caliza recristalizada', group: 'Sedimentaria', color: 'Gris claro', texture: 'Microcristalina', grainSize: 'Fino', mineralogy: 'Calcita' },
  { type: 'Esquisto cuarzo-mica', group: 'Metamorfica', color: 'Gris plateado', texture: 'Esquistosa', grainSize: 'Fino', mineralogy: 'Cuarzo, moscovita, biotita' },
  { type: 'Granodiorita', group: 'Ignea', color: 'Gris claro', texture: 'Fanerítica', grainSize: 'Grueso', mineralogy: 'Cuarzo, plagioclasa, biotita, hornblenda' },
];

export default function SeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSeed() {
    if (!user) {
      toast.error('Sin sesión activa');
      return;
    }
    setLoading(true);
    try {
      const projectRef = await createProject(user.uid, {
        name: 'Demo — Pórfido Cu-Au El Encuentro',
        description: 'Proyecto de exploración por pórfido cuprífero. Anomalía geofísica + alteración argílica avanzada en superficie.',
        location: 'Coquimbo, Chile',
        createdAt: new Date().toISOString(),
      });
      const projectId = projectRef.id;

      const holes = [
        { holeId: 'EE-001', azimuth: 90, inclination: -60, lat: -29.9700, lng: -71.3199, depth: 280 },
        { holeId: 'EE-002', azimuth: 90, inclination: -75, lat: -29.9702, lng: -71.3197, depth: 320 },
        { holeId: 'EE-003', azimuth: 270, inclination: -65, lat: -29.9698, lng: -71.3201, depth: 260 },
      ];

      let firstHoleId = '';
      for (const h of holes) {
        const dhRef = await createDrillHole(user.uid, {
          projectId,
          holeId: h.holeId,
          type: 'Diamantina',
          geologist: 'P. Faúndez',
          latitude: h.lat,
          longitude: h.lng,
          altitude: 320,
          azimuth: h.azimuth,
          inclination: h.inclination,
          plannedDepth: h.depth,
          actualDepth: h.depth,
          startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
          status: 'Completado',
        });
        if (!firstHoleId) firstHoleId = dhRef.id;

        const segments = SUITE.length;
        const step = h.depth / segments;
        for (let i = 0; i < segments; i++) {
          const r = SUITE[i];
          await saveDrillInterval(user.uid, {
            drillHoleId: dhRef.id,
            fromDepth: +(i * step).toFixed(2),
            toDepth: +((i + 1) * step).toFixed(2),
            rockType: r.type,
            rockGroup: r.group,
            color: r.color,
            texture: r.texture,
            grainSize: r.grainSize,
            mineralogy: r.mineralogy,
            alteration: r.alteration ?? null,
            alterationIntensity: r.alterationIntensity ?? null,
            mineralization: r.mineralization ?? null,
            mineralizationPercent: r.mineralizationPercent ?? null,
            rqd: 55 + ((i * 11 + h.depth) % 40),
            recovery: 78 + ((i * 7) % 20),
            structure: null,
            weathering: i < 2 ? 'Moderado' : 'Sano',
            notes: null,
          });
        }
      }

      toast.success('Proyecto demo creado');
      router.push(`/projects/${projectId}/drillholes/${firstHoleId}`);
    } catch (e) {
      console.error(e);
      toast.error('Error al crear demo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Seed datos demo
          </CardTitle>
          <CardDescription>
            Crea proyecto &quot;Demo — Pórfido Cu-Au El Encuentro&quot; con 3 sondajes diamantina
            (EE-001, EE-002, EE-003) y 12 intervalos litológicos por sondaje cubriendo
            260–320m. Suite realista: andesita → brecha hidrotermal → pórfido mineralizado →
            skarn → mármol. Datos persistidos en Firestore bajo tu usuario.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>3 sondajes en abanico desde superficie (Az 90°/270°, Inc -60° a -75°)</li>
            <li>36 intervalos totales (12 por sondaje)</li>
            <li>RQD 55–95%, Recovery 78–98%</li>
            <li>Mineralización: Pirita, Calcopirita, Bornita, Molibdenita, Magnetita</li>
          </ul>
          <Button onClick={handleSeed} disabled={loading || !user} className="w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando…</>
            ) : (
              <>Crear proyecto demo</>
            )}
          </Button>
          {!user && (
            <p className="text-xs text-destructive">Inicia sesión primero.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
