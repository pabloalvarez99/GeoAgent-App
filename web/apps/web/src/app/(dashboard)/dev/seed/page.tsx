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
  createStation,
  saveLithology,
  saveStructural,
  saveSample,
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

// Suite costera sedimentaria-metamórfica de Coquimbo (calizas Quebrada Marquesa,
// dolomitas Arqueros, skarn local). Demo basada en informe SE 25-04-2026.
const SE_SUITE: RockSpec[] = [
  { type: 'Suelo / regolito', group: 'Sedimentaria', color: 'Marrón claro', texture: 'Clástica', grainSize: 'Fino-Medio', mineralogy: 'Cuarzo, líticos, óxidos' },
  { type: 'Caliza arrecifal', group: 'Sedimentaria', color: 'Gris claro', texture: 'Bioclástica', grainSize: 'Medio', mineralogy: 'Calcita, fragmentos fósiles' },
  { type: 'Dolomita', group: 'Sedimentaria', color: 'Gris medio', texture: 'Clástica', grainSize: 'Gruesa', mineralogy: 'Dolomita, calcita' },
  { type: 'Caliza dolomítica', group: 'Sedimentaria', color: 'Gris oscuro', texture: 'Microcristalina', grainSize: 'Fino', mineralogy: 'Calcita, dolomita, hematita' },
  { type: 'Marga calcárea', group: 'Sedimentaria', color: 'Gris verdoso', texture: 'Laminada', grainSize: 'Fino', mineralogy: 'Arcilla, calcita' },
  { type: 'Dolomita silicificada', group: 'Sedimentaria', color: 'Gris beige', texture: 'Microcristalina', grainSize: 'Fino', mineralogy: 'Dolomita, cuarzo secundario', alteration: 'Silícea', alterationIntensity: 'Moderada' },
  { type: 'Skarn de granate-piroxeno', group: 'Metamorfica', color: 'Marrón rojizo', texture: 'Granoblástica', grainSize: 'Grueso', mineralogy: 'Granate, piroxeno, magnetita', alteration: 'Skarn cálcico', alterationIntensity: 'Fuerte', mineralization: 'Magnetita-Calcopirita', mineralizationPercent: 8 },
  { type: 'Mármol bandeado', group: 'Metamorfica', color: 'Blanco grisáceo', texture: 'Granoblástica', grainSize: 'Medio', mineralogy: 'Calcita, dolomita, tremolita' },
];

export default function SeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSe, setLoadingSe] = useState(false);

  async function handleSeedSe() {
    if (!user) {
      toast.error('Sin sesión activa');
      return;
    }
    setLoadingSe(true);
    try {
      // Datos exactos del informe SE 25-04-2026 — Coquimbo costero.
      const projectRef = await createProject(user.uid, {
        name: 'Se',
        description: 'Demo basada en informe SE 25-04-2026 (Coquimbo). Sondajes RC en abanico sobre secuencia caliza-dolomita-skarn local.',
        location: 'Coquimbo, Chile',
        createdAt: new Date().toISOString(),
      });
      const projectId = projectRef.id;

      // Estación Ss exacta del PDF
      const stationRef = await createStation(user.uid, {
        projectId,
        code: 'Ss',
        date: new Date('2026-04-16').toISOString(),
        geologist: 'Za',
        latitude: -29.957848,
        longitude: -71.292942,
        altitude: 50.7,
        description: 'As',
        weatherConditions: null,
      });
      const stationId = stationRef.id;

      await saveLithology(user.uid, {
        stationId,
        projectId,
        rockType: 'Dolomita',
        rockGroup: 'Sedimentaria',
        color: 'Gris Medio',
        texture: 'Clastica',
        grainSize: 'Gruesa',
        mineralogy: 'Dolomita, calcita',
        notes: null,
      });

      await saveStructural(user.uid, {
        stationId,
        projectId,
        type: 'Foliacion',
        strike: 0,
        dip: 0,
        dipDirection: 'SE',
        movement: null,
        thickness: 5,
        filling: null,
        roughness: null,
        notes: null,
      });

      await saveSample(user.uid, {
        stationId,
        projectId,
        code: 'Z',
        type: 'Canal',
        weight: 2,
        length: 2,
        description: 'D',
        status: 'Enviada',
        destination: null,
        analysisRequested: null,
      });

      // Sondajes RC en abanico desde collar PDF (-29.957864, -71.292972 alt 51.8).
      // Expansión vs PDF (1 sondaje 7m) → 3 sondajes 80m c/u con intervalos para visor 3D.
      const collarLat = -29.957864;
      const collarLng = -71.292972;
      const holes = [
        { holeId: 'S-001', azimuth: 0, inclination: -90, lat: collarLat, lng: collarLng, depth: 80, type: 'Aire Reverso' },
        { holeId: 'S-002', azimuth: 90, inclination: -70, lat: collarLat + 0.00018, lng: collarLng + 0.00018, depth: 100, type: 'Aire Reverso' },
        { holeId: 'S-003', azimuth: 270, inclination: -75, lat: collarLat + 0.00018, lng: collarLng - 0.00018, depth: 90, type: 'Aire Reverso' },
      ];

      let firstHoleId = '';
      for (const h of holes) {
        const dhRef = await createDrillHole(user.uid, {
          projectId,
          holeId: h.holeId,
          type: h.type,
          geologist: 'Jj',
          latitude: h.lat,
          longitude: h.lng,
          altitude: 51.8,
          azimuth: h.azimuth,
          inclination: h.inclination,
          plannedDepth: h.depth,
          actualDepth: h.depth,
          startDate: new Date('2026-04-25').toISOString(),
          status: 'Completado',
        });
        if (!firstHoleId) firstHoleId = dhRef.id;

        const segments = SE_SUITE.length;
        const step = h.depth / segments;
        for (let i = 0; i < segments; i++) {
          const r = SE_SUITE[i];
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
            rqd: 60 + ((i * 13 + h.depth) % 35),
            recovery: 82 + ((i * 9) % 17),
            structure: null,
            weathering: i < 2 ? 'Moderado' : 'Sano',
            notes: null,
          });
        }
      }

      toast.success('Proyecto demo "Se" (Coquimbo) creado');
      router.push(`/projects/${projectId}/3d`);
    } catch (e) {
      console.error(e);
      toast.error('Error al crear demo Se');
    } finally {
      setLoadingSe(false);
    }
  }

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
    <div className="max-w-xl mx-auto py-12 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Demo SE — Coquimbo (informe 25-04-2026)
          </CardTitle>
          <CardDescription>
            Replica el informe SE: proyecto &quot;Se&quot; en Coquimbo, estación Ss
            (-29.957848, -71.292942) con litología Dolomita, estructural Foliación SE,
            muestra Z. Expandido a 3 sondajes RC (S-001/002/003) en abanico desde el
            collar del PDF (-29.957864, -71.292972, 51.8 m), 80–100 m c/u, suite
            costera caliza-dolomita-skarn-mármol. Después abre directo el visor 3D.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Coords exactas del PDF (-29.957848 / -71.292942 estación)</li>
            <li>1 estación + 1 lito + 1 estructural + 1 muestra (matching PDF)</li>
            <li>3 sondajes RC, 24 intervalos totales, RQD 60-95%, Rec 82-99%</li>
            <li>Skarn Cu mineralizado en tramos profundos</li>
          </ul>
          <Button
            onClick={handleSeedSe}
            disabled={loadingSe || !user}
            className="w-full bg-emerald-600 hover:bg-emerald-500"
          >
            {loadingSe ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando demo SE…</>
            ) : (
              <>Crear demo SE (Coquimbo)</>
            )}
          </Button>
          {!user && (
            <p className="text-xs text-destructive">Inicia sesión primero.</p>
          )}
        </CardContent>
      </Card>

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
