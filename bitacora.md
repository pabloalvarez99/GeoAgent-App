# GeoAgent — Bitácora de Desarrollo Web + Desktop

> **Para el agente que retome esta sesión:** Lee este archivo completo antes de hacer cualquier cosa.
> Contiene TODO el contexto, las decisiones tomadas, lo que está hecho y lo que falta.
> No se necesita conocimiento previo del proyecto — todo está aquí.

---

## 1. Contexto del Proyecto

**GeoAgent-App** es una app Android nativa (Kotlin + Jetpack Compose) para recolección de datos geológicos en el campo.

**Repo:** `C:\Users\Admin\Documents\GitHub\GeoAgent-App`
**Backend:** Firebase (Firestore + Auth + Storage) — proyecto ID: `geoagent-app`
**Estado Android:** Completo y funcional. NO modificar el directorio `app/`.

### Objetivo de esta tarea
Crear una **plataforma web + app Windows (Electron)** que use el **mismo Firebase** que la app Android, logrando sincronización en tiempo real automática entre Android y Web/Desktop.

- **Web:** Next.js 16 desplegado en Vercel — mismo login, misma data
- **Desktop:** Electron wrapping Next.js — instalador `.exe` para Windows 10+
- **Sync:** Firestore `onSnapshot()` = real-time automático, sin backend adicional

---

## 2. Arquitectura Decidida

```
Firebase (existente: Firestore + Auth + Storage)
    │
    ├── Android App (Kotlin) ← ya existe, NO tocar
    │
    └── Web App (Next.js 16)  ← LO QUE ESTAMOS CONSTRUYENDO
            │
            └── Electron (Windows) ← wraps el web app
```

**Firestore structure** (idéntico en Android y Web):
```
users/{userId}/projects/{id}
users/{userId}/stations/{id}
users/{userId}/lithologies/{id}
users/{userId}/structural_data/{id}
users/{userId}/samples/{id}
users/{userId}/drill_holes/{id}
users/{userId}/drill_intervals/{id}
users/{userId}/photos/{id}
```

**Firebase config:**
- Project ID: `geoagent-app`
- Storage bucket: `geoagent-app.firebasestorage.app`
- API Key: `AIzaSyCN-eXfzPpZ9sQ2Po8qBDt_vfRqK6TKnjo` (Android key, la web tendrá su propia)
- Auth domain: `geoagent-app.firebaseapp.com`

---

## 3. Stack Tecnológico (Web)

| Herramienta | Versión | Propósito |
|---|---|---|
| Next.js | 16 | Framework web (App Router) |
| shadcn/ui | latest | UI components |
| Tailwind CSS | 4 | Styling |
| Firebase Web SDK | 11 | Firestore + Auth + Storage |
| @tanstack/react-query | 5 | Data fetching + real-time |
| react-hook-form + zod | latest | Formularios + validación |
| @vis.gl/react-google-maps | latest | Mapa interactivo |
| SheetJS (xlsx) | latest | Export Excel |
| jsPDF + jspdf-autotable | latest | Export PDF |
| recharts | latest | Gráficos de analytics |
| TypeScript | 5 | Type safety |
| pnpm | 11 | Package manager |
| Turborepo | 2 | Monorepo orchestration |

**Desktop (Fase 7):**
- Electron 34+, electron-builder, electron-updater

---

## 4. Estructura de Directorios (target final)

```
GeoAgent-App/
├── app/                          # Android (NO TOCAR)
├── bitacora.md                   # ESTE ARCHIVO
├── web/                          # TODO lo nuevo va aquí
│   ├── package.json              # pnpm workspace root
│   ├── pnpm-workspace.yaml
│   ├── turbo.json
│   ├── apps/
│   │   ├── web/                  # Next.js 16 app
│   │   │   ├── src/
│   │   │   │   ├── app/
│   │   │   │   │   ├── (auth)/login/page.tsx
│   │   │   │   │   ├── (dashboard)/
│   │   │   │   │   │   ├── layout.tsx       ← sidebar + nav
│   │   │   │   │   │   ├── page.tsx         ← dashboard
│   │   │   │   │   │   ├── projects/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │   │       ├── stations/
│   │   │   │   │   │   │       ├── drillholes/
│   │   │   │   │   │   │       ├── map/
│   │   │   │   │   │   │       ├── photos/
│   │   │   │   │   │   │       └── export/
│   │   │   │   │   │   └── settings/page.tsx
│   │   │   │   │   ├── layout.tsx           ← root layout
│   │   │   │   │   ├── middleware.ts         ← auth guard
│   │   │   │   │   └── globals.css
│   │   │   │   ├── components/
│   │   │   │   │   ├── ui/                  ← shadcn components
│   │   │   │   │   ├── layout/              ← Sidebar, Header, Shell
│   │   │   │   │   ├── map/                 ← MapView component
│   │   │   │   │   ├── forms/               ← todos los formularios
│   │   │   │   │   └── data-tables/         ← TanStack Table
│   │   │   │   ├── lib/
│   │   │   │   │   ├── firebase/
│   │   │   │   │   │   ├── init.ts          ← Firebase app init
│   │   │   │   │   │   ├── auth.tsx         ← AuthContext + hooks
│   │   │   │   │   │   └── firestore.ts     ← CRUD helpers
│   │   │   │   │   ├── hooks/               ← useProjects, useStations, etc.
│   │   │   │   │   └── export/              ← pdf.ts, excel.ts, geojson.ts
│   │   │   │   └── types/                   ← TypeScript interfaces
│   │   │   ├── next.config.ts
│   │   │   ├── tailwind.config.ts
│   │   │   ├── tsconfig.json
│   │   │   └── package.json
│   │   └── desktop/              # Electron wrapper (Fase 7)
│   │       ├── electron-src/
│   │       │   ├── main.ts
│   │       │   └── preload.ts
│   │       └── package.json
│   └── packages/
│       └── geo-shared/           # Tipos + constantes compartidas
│           ├── src/
│           │   ├── types.ts      ← interfaces TypeScript (mirror Android entities)
│           │   ├── constants.ts  ← GeoConstants (rock types, dropdowns, etc.)
│           │   └── validation.ts ← FormValidation (mirror FormValidation.kt)
│           └── package.json
├── CLAUDE.md
├── firestore.rules               # Ya correctas, no tocar
├── storage.rules                 # Ya correctas, no tocar
└── vercel-deploy/                # Landing page APK (reemplazar con web real)
```

---

## 5. Modelo de Datos Completo (TypeScript)

```typescript
// Estas interfaces van en web/packages/geo-shared/src/types.ts
// Reflejan EXACTAMENTE los DTOs de Android (RemoteProject.kt, etc.)

export interface GeoProject {
  id: string;
  name: string;
  description: string;
  location: string;
  updatedAt?: any; // Firestore Timestamp
}

export interface GeoStation {
  id: string;
  projectId: string;
  code: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  date: string;          // ISO 8601
  geologist: string;
  description: string;
  weatherConditions?: string;
  updatedAt?: any;
}

export interface GeoLithology {
  id: string;
  stationId: string;
  rockType: string;
  rockGroup: string;
  color: string;
  texture: string;
  grainSize: string;
  mineralogy: string;
  alteration?: string;
  alterationIntensity?: string;
  mineralization?: string;
  mineralizationPercent?: number;
  structure?: string;
  weathering?: string;
  notes?: string;
  updatedAt?: any;
}

export interface GeoStructural {
  id: string;
  stationId: string;
  type: string;
  strike: number;
  dip: number;
  dipDirection: string;
  movement?: string;
  thickness?: number;
  filling?: string;
  roughness?: string;
  continuity?: string;
  notes?: string;
  updatedAt?: any;
}

export interface GeoSample {
  id: string;
  stationId: string;
  code: string;
  type: string;
  weight?: number;
  length?: number;
  description: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  destination?: string;
  analysisRequested?: string;
  status: string;
  notes?: string;
  updatedAt?: any;
}

export interface GeoDrillHole {
  id: string;
  projectId: string;
  holeId: string;
  type: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  azimuth: number;
  inclination: number;
  plannedDepth: number;
  actualDepth?: number;
  startDate?: string;
  endDate?: string;
  status: string;
  geologist: string;
  notes?: string;
  updatedAt?: any;
}

export interface GeoDrillInterval {
  id: string;
  drillHoleId: string;
  fromDepth: number;
  toDepth: number;
  rockType: string;
  rockGroup: string;
  color: string;
  texture: string;
  grainSize: string;
  mineralogy: string;
  alteration?: string;
  alterationIntensity?: string;
  mineralization?: string;
  mineralizationPercent?: number;
  rqd?: number;
  recovery?: number;
  structure?: string;
  weathering?: string;
  notes?: string;
  updatedAt?: any;
}

export interface GeoPhoto {
  id: string;
  projectId?: string;
  stationId?: string;
  drillHoleId?: string;
  fileName: string;
  storagePath?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  takenAt?: string;
  updatedAt?: any;
}
```

---

## 6. Constantes Geológicas (todos los dropdowns)

Guardados en `web/packages/geo-shared/src/constants.ts`:

```typescript
export const ROCK_GROUPS = ['Ignea', 'Sedimentaria', 'Metamorfica'];

export const ROCK_TYPES_BY_GROUP = {
  'Ignea': ['Andesita','Basalto','Granito','Diorita','Riolita','Dacita','Gabro',
            'Granodiorita','Tonalita','Sienita','Peridotita','Porfido','Toba',
            'Brecha Volcanica','Ignimbrita'],
  'Sedimentaria': ['Arenisca','Lutita','Caliza','Conglomerado','Limolita',
                   'Dolomita','Arcillolita','Marga','Evaporita','Chert',
                   'Fosforita','Brecha Sedimentaria'],
  'Metamorfica': ['Esquisto','Gneis','Marmol','Pizarra','Cuarcita','Filita',
                  'Anfibolita','Migmatita','Hornfels','Skarn','Serpentinita','Milonita'],
};

export const COLORS = ['Blanco','Gris Claro','Gris Medio','Gris Oscuro','Negro',
                       'Rojo','Rosado','Cafe','Cafe Claro','Amarillo','Verde',
                       'Verde Oscuro','Azul','Violeta','Naranja'];

export const TEXTURES = ['Faneritica','Afanitica','Porfirica','Vitrea',
                         'Clastica','Foliada','Granoblastica','Piroclastica'];

export const GRAIN_SIZES = ['Muy Fina','Fina','Media','Gruesa','Muy Gruesa'];

export const ALTERATIONS = ['Ninguna','Filica','Argilica','Argilica Avanzada',
                             'Propilitica','Potasica','Silicica','Clorita-Epidota',
                             'Carbonatacion','Sericitizacion','Turmalina'];

export const ALTERATION_INTENSITIES = ['Debil','Moderada','Fuerte','Intensa','Pervasiva'];

export const STRUCTURES = ['Masiva','Foliada','Bandeada','Brechada','Vesicular',
                            'Amigdaloidal','Fluidal','Estratificada','Laminada','Cizallada'];

export const WEATHERING_GRADES = ['Fresca','Leve','Moderada','Alta','Muy Alta','Suelo Residual'];

export const STRUCTURAL_TYPES = ['Falla','Fractura','Veta','Vetilla','Foliacion',
                                  'Estratificacion','Contacto','Diaclasa','Clivaje','Zona de Cizalle'];

export const DIP_DIRECTIONS = ['N','NE','E','SE','S','SW','W','NW'];
export const FAULT_MOVEMENTS = ['Normal','Inversa','Dextral','Sinistral','Oblicua'];
export const ROUGHNESS = ['Lisa','Rugosa','Escalonada','Ondulada','Estriada'];
export const CONTINUITY = ['Continua','Discontinua','Intermitente'];

export const SAMPLE_TYPES = ['Roca','Suelo','Sedimento','Canal','Chip','Trinchera','Panel'];
export const DRILL_HOLE_TYPES = ['Diamantina','RC','Aire Reverso','Percusion'];
export const DRILL_HOLE_STATUSES = ['En Progreso','Completado','Abandonado','Suspendido'];

export const MINERALS = ['Cuarzo','Feldespato','Plagioclasa','Biotita','Moscovita',
                         'Hornblenda','Augita','Olivino','Calcita','Dolomita','Pirita',
                         'Calcopirita','Molibdenita','Magnetita','Hematita','Galena',
                         'Esfalerita','Arsenopirita','Bornita','Covelina','Clorita',
                         'Epidota','Sericita','Arcilla','Turmalina','Granate',
                         'Actinolita','Wollastonita','Fluorita'];

export const WEATHER_CONDITIONS = ['Despejado','Nublado','Parcial','Lluvia','Nieve','Viento','Niebla'];
```

---

## 7. Validaciones (zod schemas)

En `web/packages/geo-shared/src/validation.ts`, mirror exacto de `FormValidation.kt`:

```typescript
import { z } from 'zod';

// Reglas base
const requiredString = (field: string) =>
  z.string().min(1, `${field} es obligatorio`);

const optionalNumber = z.number().optional();

export const projectSchema = z.object({
  name: requiredString('Nombre del proyecto'),
  description: requiredString('Descripcion'),
  location: requiredString('Ubicacion'),
});

export const stationSchema = z.object({
  code: requiredString('Codigo de estacion'),
  geologist: requiredString('Geologo'),
  description: requiredString('Descripcion'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  altitude: z.number().optional(),
  date: z.string(),
  weatherConditions: z.string().optional(),
}).refine(d => !(d.latitude === 0 && d.longitude === 0), {
  message: 'Captura las coordenadas GPS antes de guardar',
  path: ['latitude'],
});

export const drillHoleSchema = z.object({
  holeId: requiredString('ID del sondaje'),
  type: requiredString('Tipo de sondaje'),
  geologist: requiredString('Geologo'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  azimuth: z.number().min(0).max(360, 'Azimut debe estar entre 0 y 360'),
  inclination: z.number().min(-90, 'Inclinacion debe estar entre -90 y 0').max(0),
  plannedDepth: z.number().positive('Profundidad planeada debe ser positiva'),
  actualDepth: z.number().positive().optional(),
  status: requiredString('Estado'),
  notes: z.string().optional(),
});

export const drillIntervalSchema = z.object({
  fromDepth: z.number({ required_error: 'Ingrese la profundidad inicial' }),
  toDepth: z.number({ required_error: 'Ingrese la profundidad final' }),
  rockType: requiredString('Tipo de roca'),
  rockGroup: requiredString('Grupo de roca'),
  color: requiredString('Color'),
  texture: requiredString('Textura'),
  grainSize: requiredString('Tamano de grano'),
  mineralogy: requiredString('Mineralogia'),
  rqd: z.number().min(0).max(100).optional(),
  recovery: z.number().min(0).max(100).optional(),
  mineralizationPercent: z.number().min(0).max(100).optional(),
}).refine(d => d.fromDepth < d.toDepth, {
  message: "'Desde' debe ser menor que 'Hasta'",
  path: ['fromDepth'],
});
```

---

## 8. Rutas de la Web App

| Ruta | Pantalla | Equivalente Android |
|---|---|---|
| `/login` | Login Firebase | LoginScreen |
| `/` (redirect) | → `/projects` | — |
| `/projects` (dashboard) | Lista proyectos + stats | HomeScreen + ProjectListScreen |
| `/projects/[id]` | Detalle proyecto | ProjectDetailScreen |
| `/projects/[id]/stations` | Lista estaciones | StationListScreen |
| `/projects/[id]/stations/[stId]` | Detalle estación | StationDetailScreen |
| `/projects/[id]/stations/new` | Crear/editar estación | StationCreateScreen |
| `/projects/[id]/stations/[stId]/lithology/new` | Form litología | LithologyFormScreen |
| `/projects/[id]/stations/[stId]/structural/new` | Form estructural | StructuralFormScreen |
| `/projects/[id]/stations/[stId]/samples/new` | Form muestra | SampleFormScreen |
| `/projects/[id]/drillholes` | Lista sondajes | DrillHoleListScreen |
| `/projects/[id]/drillholes/[dhId]` | Detalle sondaje | DrillHoleDetailScreen |
| `/projects/[id]/drillholes/new` | Crear/editar sondaje | DrillHoleCreateScreen |
| `/projects/[id]/drillholes/[dhId]/intervals/new` | Form intervalo | DrillIntervalFormScreen |
| `/projects/[id]/map` | Mapa full-screen | MapViewScreen |
| `/projects/[id]/photos` | Galería fotos | PhotoGalleryScreen |
| `/projects/[id]/export` | Centro exportación | ExportScreen |
| `/settings` | Preferencias | SettingsScreen |

---

## 9. Diseño UI

- **Tema:** Dark mode (zinc/slate base)
- **Acento:** `#22c55e` (verde — mismo que badge SYNCED Android)
- **Fuente UI:** Geist Sans
- **Fuente código/datos:** Geist Mono (coordenadas, IDs, profundidades)
- **Layout:** Sidebar izquierda colapsable + header fijo + main content
- **Idioma:** 100% Español
- **Componentes:** shadcn/ui (Button, Input, Select, Table, Dialog, etc.)

---

## 10. Fases de Implementación

### ✅ COMPLETADO

- [x] Plan de arquitectura creado y aprobado
- [x] `bitacora.md` creado (este archivo)
- [x] `web/package.json` creado (workspace root)
- [x] `web/pnpm-workspace.yaml` creado
- [x] Directorios creados: `web/apps/web/src/`, `web/packages/geo-shared/src/`, `web/apps/desktop/electron-src/`

### 🔄 EN PROGRESO

- [ ] `web/turbo.json`
- [ ] `web/apps/web/package.json` (Next.js 16 + todas las dependencias)
- [ ] `web/apps/web/next.config.ts`
- [ ] `web/apps/web/tsconfig.json`
- [ ] `web/apps/web/tailwind.config.ts`
- [ ] `web/packages/geo-shared/package.json`
- [ ] `web/packages/geo-shared/src/types.ts`
- [ ] `web/packages/geo-shared/src/constants.ts`
- [ ] `web/packages/geo-shared/src/validation.ts`

### ⏳ PENDIENTE — Fase 1: Foundation

- [ ] `web/apps/web/src/lib/firebase/init.ts` — Firebase Web SDK init
- [ ] `web/apps/web/src/lib/firebase/auth.tsx` — AuthContext + useAuth hook
- [ ] `web/apps/web/src/lib/firebase/firestore.ts` — helpers CRUD
- [ ] `web/apps/web/src/app/layout.tsx` — root layout
- [ ] `web/apps/web/src/app/globals.css` — Tailwind + CSS vars
- [ ] `web/apps/web/src/middleware.ts` — proteger rutas con Firebase Auth
- [ ] `web/apps/web/src/app/(auth)/login/page.tsx` — pantalla login
- [ ] `web/apps/web/src/app/(dashboard)/layout.tsx` — sidebar + header
- [ ] `web/apps/web/src/components/layout/sidebar.tsx`
- [ ] `web/apps/web/src/components/layout/header.tsx`
- [ ] instalar dependencias: `pnpm install` en `web/`
- [ ] instalar shadcn/ui: `npx shadcn@latest init`

### ⏳ PENDIENTE — Fase 2: Proyectos + Dashboard

- [ ] `web/apps/web/src/lib/hooks/use-projects.ts` — Firestore onSnapshot
- [ ] `web/apps/web/src/app/(dashboard)/page.tsx` — dashboard con stats
- [ ] `web/apps/web/src/app/(dashboard)/projects/page.tsx` — lista proyectos
- [ ] `web/apps/web/src/app/(dashboard)/projects/[id]/page.tsx` — detalle

### ⏳ PENDIENTE — Fase 3: Estaciones

- [ ] hooks: `use-stations.ts`, `use-lithologies.ts`, `use-structural.ts`, `use-samples.ts`
- [ ] páginas: stations list, station detail, station create/edit
- [ ] forms: LithologyForm, StructuralForm, SampleForm

### ⏳ PENDIENTE — Fase 4: Sondajes

- [ ] hooks: `use-drillholes.ts`, `use-intervals.ts`
- [ ] páginas: drillholes list, detail, create/edit
- [ ] tabla inline de intervalos (TanStack Table editable)
- [ ] gráfico columna litológica (recharts)

### ⏳ PENDIENTE — Fase 5: Mapa + Fotos

- [ ] `src/components/map/map-view.tsx` — Google Maps con marcadores
- [ ] `src/app/(dashboard)/projects/[id]/map/page.tsx`
- [ ] galería de fotos (Firebase Storage URLs)
- [ ] upload multi-foto drag & drop

### ⏳ PENDIENTE — Fase 6: Exportación

- [ ] `src/lib/export/pdf.ts` — jsPDF (mirror PdfReportGenerator.kt)
- [ ] `src/lib/export/excel.ts` — SheetJS (mirror ExportHelper.kt)
- [ ] `src/lib/export/geojson.ts` — GeoJSON export
- [ ] `src/lib/export/csv.ts` — CSV collar/survey/assay
- [ ] página export con preview PDF

### ⏳ PENDIENTE — Fase 7: Electron Desktop

- [ ] `web/apps/desktop/electron-src/main.ts`
- [ ] `web/apps/desktop/electron-src/preload.ts`
- [ ] `web/apps/desktop/package.json`
- [ ] `web/apps/desktop/electron-builder.yml`
- [ ] build: genera `GeoAgent-Setup.exe`
- [ ] auto-update via GitHub Releases

### ⏳ PENDIENTE — Fase 8: Features PC-Exclusivos

- [ ] Importación CSV/Excel → bulk create
- [ ] Dashboard analytics con recharts
- [ ] Atajos de teclado
- [ ] Vista dividida mapa + lista

### ⏳ PENDIENTE — Fase 9: Deploy

- [ ] Variables de entorno en Vercel
- [ ] GitHub Actions CI/CD
- [ ] PWA manifest
- [ ] GitHub Actions build Electron → GitHub Releases

---

## 11. Variables de Entorno Necesarias

Para `web/apps/web/.env.local`:
```bash
# Firebase Web Config (obtener de Firebase Console > Project Settings > Web apps)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=geoagent-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=geoagent-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=geoagent-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=609077404870
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Google Maps (obtener de Google Cloud Console)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

**IMPORTANTE:** El desarrollador necesita registrar una **Web App** en Firebase Console para el proyecto `geoagent-app`. El API key de Android (`AIzaSyCN-eXfzPpZ9sQ2Po8qBDt_vfRqK6TKnjo`) puede usarse para desarrollo pero se recomienda crear uno específico para web.

---

## 12. Comandos para Ejecutar

Desde `web/`:
```bash
pnpm install                     # Instalar todas las dependencias
pnpm web                         # Dev server: http://localhost:3000
pnpm build                       # Build producción
pnpm desktop                     # Dev Electron (Fase 7)
```

Desde root del repo:
```bash
cd web && pnpm install && pnpm web
```

---

## 13. Decisiones Técnicas Importantes

1. **No next-forge:** next-forge es para SaaS con Clerk/Stripe/Prisma. No encaja — usamos Firebase. Setup manual de Next.js.

2. **Client Components primario:** La app es mayormente Client Components porque Firebase Web SDK necesita el browser. No Server Components para data fetching (Firebase no tiene Admin SDK use case aquí — todo es per-user scoped).

3. **Middleware de auth:** Usar Firebase Auth con cookies/tokens en `middleware.ts` para proteger rutas. Patrón: verificar `firebase-auth-token` cookie.

4. **onSnapshot + react-query:** Para real-time, usar `onSnapshot()` dentro de `useEffect`, actualizar state de react-query manualmente. Alternativa: `useFirestoreQuery` custom hook.

5. **Static Next.js para Electron:** Para el desktop, usar `output: 'export'` en next.config.ts y cargar desde Electron. Firebase SDK funciona perfectamente client-side.

6. **Firestore offline:** `enableIndexedDbPersistence(db)` en el init para que funcione sin internet con datos cacheados.

7. **No supabase/** ni ningún directorio legacy: El directorio `supabase/` tiene migrations SQL de una arquitectura anterior. No usar.

---

## 14. Archivos Android Importantes (referencia)

Para entender la lógica de negocio, los archivos Android clave son:

- `app/src/main/java/com/geoagent/app/data/GeoConstants.kt` — todos los dropdowns
- `app/src/main/java/com/geoagent/app/util/FormValidation.kt` — validaciones
- `app/src/main/java/com/geoagent/app/util/ExportHelper.kt` — export Excel/GeoJSON
- `app/src/main/java/com/geoagent/app/util/PdfReportGenerator.kt` — export PDF
- `app/src/main/java/com/geoagent/app/data/remote/dto/` — estructura exacta Firestore
- `app/src/main/java/com/geoagent/app/data/remote/RemoteDataSource.kt` — operaciones Firestore

---

## 15. Estado Actual del Git

Commits recientes relevantes (en branch `master`):
- `c15f8b5` — feat: include lithology, structural, and sample data in GeoJSON export
- `d2074ca` — fix: replace project!! with safe ?.let in ProjectDetailScreen dialogs
- `d512c9d` — fix: replace unsafe !! with safe null handling in MapViewScreen
- `ffc5a71` — fix: add error handling to delete operations
- `ba6d7c3` — fix: improve sync error handling with auth pre-check
- `e326690` — chore: rename SupabaseModule.kt to FirebaseModule.kt

Todo el trabajo nuevo va en commits separados del Android.

---

*Última actualización: 2026-03-27 — Iniciando Fase 1*
