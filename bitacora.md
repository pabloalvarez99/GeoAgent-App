# GeoAgent — Bitácora de Desarrollo Web + Desktop

> **Para el agente que retome esta sesión:** Lee este archivo completo antes de hacer cualquier cosa.
> Contiene TODO el contexto, las decisiones tomadas, lo que está hecho y lo que falta.
> No se necesita conocimiento previo del proyecto — todo está aquí.

---

## 1. Contexto del Proyecto

**GeoAgent-App** es una app Android nativa (Kotlin + Jetpack Compose) para recolección de datos geológicos en el campo.

**Repo:** `C:\Users\Admin\Documents\GitHub\GeoAgent-App`
**Backend:** Firebase (Firestore + Auth + Storage) — proyecto ID: `geoagent-app`
**Estado Android:** Completo y funcional. NO modificar el directorio `app/` salvo instrucción explícita del usuario.

> ⚠️ **PRIORIDAD: WEB PRIMERO.** Todo trabajo activo va en `web/`. Android solo cuando el usuario lo solicita directamente.

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

### ✅ COMPLETADO (Fases 1-7)

#### Fase 1: Foundation
- [x] Monorepo npm workspaces (Turborepo)
- [x] Next.js 15 + shadcn/ui + Tailwind dark theme
- [x] `geo-shared` package (types, constants, validation zod)
- [x] Firebase Web SDK v11 (Firestore + Auth + Storage)
- [x] Firebase Auth: login/logout con AuthContext
- [x] Layout: sidebar + header + rutas protegidas (middleware)
- [x] Vercel deployment funcionando (npm, no pnpm — ver "Decisiones Técnicas")

#### Fase 2: Proyectos + Dashboard
- [x] Dashboard `/` con stats y proyectos recientes
- [x] `/projects` lista con búsqueda, crear, editar, eliminar
- [x] `/projects/[id]` detalle con contadores en tiempo real

#### Fase 3: Estaciones
- [x] hooks: `use-stations.ts`, `use-lithologies.ts`, `use-structural.ts`, `use-samples.ts`
- [x] `/projects/[id]/stations` lista con búsqueda
- [x] `/projects/[id]/stations/new` crear/editar con GPS capture
- [x] `/projects/[id]/stations/[stId]` detalle con tabs litología/estructural/muestras
- [x] Formularios: StationForm, LithologyForm, StructuralForm, SampleForm

#### Fase 4: Sondajes
- [x] hooks: `use-drillholes.ts` (incluye `useDrillIntervals`)
- [x] `/projects/[id]/drillholes` lista con depth bars + status icons
- [x] `/projects/[id]/drillholes/new` crear/editar con GPS
- [x] `/projects/[id]/drillholes/[dhId]` detalle con tabla de intervalos, RQD, Recovery
- [x] Formularios: DrillHoleForm, IntervalForm

#### Fase 5: Mapa
- [x] `/projects/[id]/map` — Google Maps con marcadores estaciones (azul) + sondajes (violeta)
- [x] Panel lateral de detalle al hacer clic en marcador
- [x] Manejo de API key no configurado

#### Fase 6: Fotos
- [x] `use-photos.ts` hook
- [x] `/projects/[id]/photos` — galería grid con URLs de Firebase Storage
- [x] Viewer full-screen, delete con confirmación

#### Fase 7: Exportación
- [x] `lib/export/pdf.ts` — jsPDF + autotable (reporte completo)
- [x] `lib/export/excel.ts` — XLSX workbook multi-hoja
- [x] `lib/export/geojson.ts` — FeatureCollection con estaciones + sondajes
- [x] `lib/export/csv.ts` — CSV collar/survey/assay (formato industria)
- [x] `/projects/[id]/export` — página con 4 export cards

### ⏳ PENDIENTE — Fase 8: Electron Desktop

- [ ] `web/apps/desktop/electron-src/main.ts`
- [ ] `web/apps/desktop/electron-src/preload.ts`
- [ ] `web/apps/desktop/package.json`
- [ ] `web/apps/desktop/electron-builder.yml`
- [ ] build: genera `GeoAgent-Setup.exe`
- [ ] auto-update via GitHub Releases

### ⏳ PENDIENTE — Fase 9: Features PC-Exclusivos

- [ ] Dashboard analytics con recharts
- [ ] Settings page
- [ ] Importación CSV/Excel → bulk create

### ⏳ PENDIENTE — Fase 10: Deploy Final

- [ ] Variables de entorno en Vercel (Google Maps API key)
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

### ⚠️ Decisión Técnica: pnpm → npm

Vercel + Node.js 22 + pnpm 9.x tenía un bug fatal (`ERR_INVALID_THIS: URLSearchParams` en undici).
**Solución:** Cambio completo a npm workspaces. El `web/package.json` usa `"packageManager": "npm@10.9.2"` y
`web/vercel.json` usa `"installCommand": "npm install"`. Las dependencias internas usan `"*"` en vez de `"workspace:*"`.

---

---

## 16. Fixes de Sincronización Android ↔ Web (2026-04-03)

### Problema raíz: field name mismatch
Android escribía `updated_at` (snake_case) en Firestore. La web hacía `orderBy('updatedAt')` (camelCase).
Firestore excluye silenciosamente documentos que no tienen el campo por el que se ordena → **todos los datos de Android eran invisibles en la web**.

### Fixes aplicados:
1. **`app/.../RemoteDataSource.kt`** — cambiado `cleanData["updated_at"]` → `cleanData["updatedAt"]` en `upsert()`
2. **`web/.../firestore.ts`** — eliminado `orderBy('updatedAt', 'desc')` de `subscribeToProjects`, `subscribeToStations`, `subscribeToDrillHoles`
3. **`use-stations.ts` y `use-drillholes.ts`** — agregado `onError: () => setLoading(false)` para evitar spinner infinito
4. **`map/page.tsx`** — agregado `mapId="geoagent-map"` al componente `<Map>` (requerido por `AdvancedMarker`)

### Commit: `87c7edc` — "fix: sync Android↔Web — field name mismatch was hiding all Android data"

### Estado post-fix:
- APK Build #38 publicado en GitHub Releases con el fix del `updatedAt`
- Web app redesplegada en Vercel con queries sin orderBy
- Datos en Room (SQLite) local de Android están **siempre seguros** independiente de errores de sync
- Para verificar: instalar APK desde GitHub Releases → ajustes → "Sincronizar ahora"

---

---

## 2026-04-15 — Integración completa de plataformas Google

**Servicios agregados:**
- ✅ Firebase Analytics (Android + Web)
- ✅ Firebase Crashlytics (Android) + plugin Gradle
- ✅ Firebase Performance Monitoring (Android + Web)
- ✅ Firebase Cloud Messaging / FCM (Android + Web service worker)
- ✅ Firebase App Check (Android: Play Integrity en release, Debug en debug / Web: reCAPTCHA v3)
- ✅ Google Search Console (meta tag de verificación en layout.tsx)
- ✅ Firebase App Distribution (CI job `distribute-beta` con grupo "geologists")
- ✅ APIs habilitadas: `firebaseappcheck.googleapis.com`, `fcm.googleapis.com`
- ✅ Grupo App Distribution creado: `geologists`
- ✅ `.firebaserc` creado

**Archivos modificados:** `libs.versions.toml`, `build.gradle.kts` (root + app), `GeoAgentApp.kt`, `AndroidManifest.xml`, `client.ts`, `layout.tsx`, `.env.local.example`, `build-deploy.yml`
**Archivos creados:** `.firebaserc`, `GeoAgentMessagingService.kt`, `firebase-messaging-sw.js`, `messaging.ts`

**Secretos pendientes de agregar en GitHub repo (Settings > Secrets):**
- `FIREBASE_ANDROID_APP_ID` = `1:609077404870:android:6d1ec2fd44f6728e86e3c7`
- `FIREBASE_TOKEN` = resultado de correr `! firebase login:ci` en terminal

**Variables pendientes de obtener y agregar en `.env.local` + Vercel:**
- `NEXT_PUBLIC_FIREBASE_VAPID_KEY` — Firebase Console > Project Settings > Cloud Messaging > Web Push certificates
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — Google Search Console > verificación HTML tag
- `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` — console.recaptcha.google.com > sitio v3

---

## 2026-04-15 — Second Brain / Obsidian PKM Setup

**Qué se hizo:**
- Configurado sistema Second Brain con vault Obsidian en `C:\Users\Admin\Documents\obsidian-mind`
- Creado `reference/GeoAgent Architecture.md` con stack completo, rutas clave, env vars, feature status
- APPEND en `brain/Gotchas.md` — 6 trampas específicas de GeoAgent (Firestore mismatch, pnpm bug, AdvancedMarker, etc.)
- APPEND en `brain/Key Decisions.md` — 6 decisiones arquitectónicas (Client Components, npm workspaces, no next-forge, etc.)
- APPEND en `brain/North Star.md` — objetivos del producto GeoAgent
- Actualizado `CLAUDE.md` con sección Obsidian PKM y reglas de uso
- Actualizado `context.md` como punto de entrada actualizado para próxima sesión

**Por qué:**
- Configurar PKM persistente para que cualquier sesión futura (cualquier PC) tenga acceso al conocimiento durable del proyecto sin necesidad de re-leer el codebase desde cero.

**Estado resultante:**
- Vault Obsidian sincronizado con estado actual del proyecto (Fases 1-7 completas, Fases 8-10 pendientes)
- CLAUDE.md tiene instrucciones de cómo usar el vault
- bitacora.md y context.md actualizados

---

---

## 2026-04-15 — Reportes de exportación profesionales

**Qué se hizo:**
- Reescrito `web/apps/web/src/lib/export/excel.ts` con `xlsx-js-style`:
  - Hoja **Resumen** con estadísticas del proyecto (primera hoja)
  - Encabezados con fondo verde oscuro + texto blanco negrita
  - Filas alternas (blanco / gris claro)
  - Autofilter + freeze de primera fila en todas las hojas
  - Anchos de columna automáticos por contenido
  - Código de estación (legible) en lugar de UUID en Litologías, Estructural y Muestras
  - ID del sondaje (legible) en lugar de UUID en Intervalos
  - Intervalos ordenados por sondaje y profundidad
  - Headers de color diferenciado por tipo (verde, púrpura, ámbar)

- Mejorado `web/apps/web/src/lib/export/pdf.ts`:
  - **Tabla de Contenidos** en página 2 (con numeración de página por sección y subsección)
  - **Columna Estratigráfica** visual por sondaje (barras de colores por tipo de roca, escala de profundidad, etiquetas)
  - **Fotografías de sondajes** (nueva sección, igual que fotos de estaciones)
  - Eliminados todos los `.slice()` de truncamiento en notas, descripciones, análisis, destino
  - `overflow: 'linebreak'` en tablas para texto largo
  - Footer ajustado para excluir portada y TOC del numerado de páginas

**Dependencia agregada:** `xlsx-js-style ^1.2.0` (ya en package.json)
**TypeScript:** 0 errores

---

## 2026-04-15 — Exportaciones GeoJSON/CSV profesionales + mejoras UX

**GeoJSON mejorado (`geojson.ts`):**
- Incluye litologías, datos estructurales, muestras como propiedades del feature de estación
- Incluye log de intervalos como propiedades del feature de sondaje
- BBox calculado automáticamente
- `marker-color`/`marker-symbol` para visualización en QGIS/GitHub/Mapbox
- CRS declarado explícitamente (WGS84)
- Compatible con Electron via `saveFile`

**CSV mejorado (`csv.ts`):**
- Bundle ZIP con JSZip: collar + survey + lith (renombrado de "assay" que es incorrecto)
- Survey incluye 2 entradas por sondaje (collar + total depth) para compatibilidad con Leapfrog
- Lith CSV incluye todos los campos del log (RQD, recovery, mineralogía, alteración, etc.)
- README.txt en el ZIP con instrucciones de uso
- Compatible con Electron via `saveFile`
- Instalada dependencia: `jszip ^3.10.1`

**Import (`import/page.tsx`):**
- Paralelizado en batches de 20 (antes sequential, ahora ~20x más rápido para imports grandes)

**Página de proyecto (`projects/[id]/page.tsx`):**
- "Descripción" movida fuera del grid de stats (no era una stat)
- Nueva stat: "Total perforado" (suma de actualDepth de todos los sondajes)
- Descripción mostrada como párrafo con borde lateral verde

**Mapa (`map/page.tsx`):**
- Botón "Abrir en Google Maps" en panel de estaciones (enlace directo a coordenadas)
- Botón "Abrir en Google Maps" en panel de sondajes
- Importado icono `ExternalLink` de lucide-react

---

*Última actualización: 2026-04-15 — Todas las exportaciones profesionales completadas. UX mejorada en mapa y página de proyecto.*

---

## 2026-04-17 — Sync Optimization Task 3: Cloud Storage Snapshot

**Problema resuelto:** En el primer sync (instalación nueva o reinstalación), el `SyncWorker` hacía N lecturas individuales a Firestore (una por documento en 8 colecciones), lo cual es costoso y lento para usuarios con muchos datos.

**Solución implementada:**
1. **Cloud Function `generateSnapshot`** (`functions/src/index.ts`): función callable que:
   - Lee todas las colecciones del usuario via Admin SDK (sin límite de lectura por reglas)
   - Serializa a JSON, comprime con gzip
   - Sube a `snapshots/{userId}/snapshot.json.gz` en Firebase Storage
   - Retorna URL firmada válida por 1 hora
   - Región: `us-central1`, timeout: 120s, memoria: 512MB

2. **Android (`SyncWorker.kt`)**: al detectar `lastSyncTimestamp == 0L`:
   - Llama `remoteDataSource.downloadSnapshot()` vía función callable
   - Si exitoso: parsea el gzip JSON, inserta todos los registros en Room
   - Avanza `lastSyncTimestamp = snapshotPayload.generatedAt`
   - El pull posterior solo busca documentos `updatedAt > snapshotTimestamp`
   - Si falla (función no desplegada, sin red): fallback al pull completo normal

3. **`RemoteDataSource.kt`**: agrega `FirebaseFunctions` como dependencia inyectada + método `downloadSnapshot()`

4. **`FirebaseModule.kt`**: agrega `provideFirebaseFunctions()` como proveedor Hilt

5. **`storage.rules`**: agrega regla para `snapshots/{userId}/snapshot.json.gz` (read: usuario autenticado = owner, write: false — solo Admin SDK)

6. **`app/build.gradle.kts`**: agrega `com.google.firebase:firebase-functions-ktx` (sin versión — viene del BOM)

7. **`functions/package.json` + `tsconfig.json` + `.gitignore`**: proyecto TypeScript Cloud Functions (Node 20)

**Build Android:** BUILD SUCCESSFUL ✅

**Para deploy de la función:**
```bash
cd functions && npm install
firebase deploy --only functions
```
La función `generateSnapshot` aparece en Firebase Console > Functions.

**Archivos modificados:**
- `functions/src/index.ts` (nuevo)
- `functions/package.json` (nuevo)
- `functions/tsconfig.json` (nuevo)
- `functions/.gitignore` (nuevo)
- `storage.rules`
- `app/build.gradle.kts`
- `app/src/main/java/com/geoagent/app/data/remote/RemoteDataSource.kt`
- `app/src/main/java/com/geoagent/app/data/sync/SyncWorker.kt`
- `app/src/main/java/com/geoagent/app/di/FirebaseModule.kt`

**Commits:** `0e5ab69` (feat) + `29f4748` (chore: gitignore node_modules)

---

## 2026-04-17 — Sync Optimization Tasks 1 & 2: Pull Fix + Delta Sync

### Task 1: Fix Android pull — update existing SYNCED records
**Problema:** `pullFromRemote()` siempre hacía skip de records existentes (`if existing == null { insert } else { skip }`). Ediciones desde la web eran invisibles en Android.

**Fix:** Lógica nueva de "insert-or-update": si `existing.syncStatus == SYNCED && remoteUpdatedAt > existing.updatedAt` → update. Protege cambios locales pendientes (PENDING/MODIFIED).

**Nuevos métodos `updateFromRemote()` en DAOs:** ProjectDao, StationDao, LithologyDao, StructuralDao, SampleDao, DrillHoleDao, DrillIntervalDao — cada uno con `@Query UPDATE ... SET ... sync_status='SYNCED' WHERE id=:id`.

### Task 2: Delta sync — filter pull by `updatedAt > lastSyncTimestamp`
**Problema:** Cada sync descargaba todos los documentos de las 8 colecciones (sin filtro).

**Fix:**
- `RemoteDataSource.fetchAllSince(collection, sinceMs)`: usa `whereGreaterThan("updatedAt", Timestamp(Date(sinceMs)))` cuando `sinceMs > 0L`.
- `SyncWorker`: captura `syncStartMs = System.currentTimeMillis()` ANTES del pull (no después — evita gap de documentos creados durante sync).
- `preferencesHelper.lastSyncTimestamp = syncStartMs` en ambas ramas de éxito.
- Pull de fotos migrado a `fetchAllPhotosRaw()` para consistencia.
- ID maps (`projectIdMap`, etc.) limpiados al inicio de `doWork()` para evitar bugs en reintento.

**Timestamp correcto:** Server timestamps de Firestore (`remoteUpdatedAt`) almacenados en Room en vez del device clock — elimina problemas de clock-skew entre dispositivos.

**`firestore.indexes.json`:** Índice `updatedAt ASCENDING` agregado a las 8 colecciones. Deploy: `firebase deploy --only firestore:indexes`.

---

## 2026-04-17 — Task 4: Electron SPA — custom `app://` protocol

**Problema:** `loadFile(indexPath)` carga `file:///.../index.html` como origen. Problemas:
1. Firebase Auth rechaza cookies/tokens en `file://` en Electron 34+
2. SPA routing con Next.js static export falla: navegar a `/projects` busca `file:///projects.html` (no existe)
3. Assets con paths relativos se rompen en sub-rutas

**Solución:**
1. `protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }])` — antes de `app.whenReady()`.
2. `protocol.handle('app', handler)` en `app.whenReady()` — sirve archivos de `resources/web-out/` con fallback: `path` → `path/index.html` → `index.html` (para deep links).
3. `mainWindow.loadURL('app://./index.html')` en vez de `loadFile()`.
4. `next.config.ts`: `trailingSlash: true` en el bloque `NEXT_EXPORT=1` — Next.js emite `/projects/index.html` en vez de `/projects.html`.

**Archivos modificados:**
- `web/apps/desktop/electron-src/main.ts`
- `web/apps/web/next.config.ts`

**Resultado:** Firebase Auth, localStorage, fetch, y SPA routing funcionan correctamente en producción Electron.

---

## 2026-04-17 — Mejoras autónomas (sesión continuada)

### Android: Corrección crítica `updateFromRemote` — remoteUpdatedAt vs device clock
**Problema:** Los 7 `updateFromRemote()` en `SyncWorker.kt` guardaban `now` (device clock) en lugar del timestamp del servidor Firestore. En el siguiente sync de otro dispositivo, `remoteUpdatedAt (ej: 950ms) < existing.updatedAt (1000ms)` → update silenciosamente omitido.
**Fix:** Los 7 calls ahora pasan `remoteUpdatedAt` (parseado del campo `updatedAt` del documento Firestore).
**Archivo:** `app/.../data/sync/SyncWorker.kt`

### Cloud Functions: Cascade delete + snapshot cache
**Nuevas funciones en `functions/src/index.ts`:**
- `onStationDeleted` — elimina lithologies, structural_data, samples de esa estación al borrar desde web/admin
- `onDrillHoleDeleted` — elimina drill_intervals al borrar sondaje
- `onProjectDeleted` — elimina stations, drill_holes, photos al borrar proyecto (los triggers anteriores se encargan de los nietos)
- Helper `deleteQuery()` — borra en lotes de 500, recursivo para colecciones grandes

**Snapshot cache fix:** `file.save()` tenía clave `metadata` duplicada → fix a formato anidado correcto.

### Web Firestore: subscribeToAllStructuralData + getBatch + bulk helpers
**`web/.../firestore.ts`:**
- `subscribeToAllStructuralData(userId, onData)` — para dashboard analytics
- `getBatch<T>(userId, col, field, ids)` — divide ids en chunks de 10 (límite Firestore `whereIn`), ejecuta en paralelo → N queries → ceil(N/10) queries
- `getLithologiesForStations`, `getStructuralForStations`, `getSamplesForStations`, `getIntervalsForDrillHoles` — usan getBatch

### Web Home: Gráficos de datos estructurales
**`web/.../home/page.tsx`:**
- PieChart "Tipos estructurales" (count por type)
- BarChart "Dirección de buzamiento" (count por dipDirection, 8 sectores, fill ámbar)
- `hasAnalyticsData` incluye `structuralData.length > 0`

### Web Export: Queries batched
**`web/.../export/page.tsx`:** Todos los handlers (PDF, Excel, GeoJSON, CSV) usan las funciones batch en lugar de N queries individuales por estación/sondaje.

### CI/CD: Deploy Cloud Functions
**`.github/workflows/build-deploy.yml`:** Job 4 `deploy-functions` — se ejecuta en push si hay cambios en `functions/` o manualmente con `inputs.deploy_functions=true`.

### Web Photos: Bugs corregidos
**`web/.../photos/page.tsx`:**
- **Storage leak (crítico):** `handleDelete()` ahora llama `deleteObject(storageRef(...))` antes de eliminar el doc Firestore. Las fotos eliminadas ya no dejan archivos huérfanos en Firebase Storage.
- **URL cache inefficiency:** El `useEffect` anterior re-fetcheaba TODAS las URLs cada vez que cambiaba la lista (para 50 fotos + 1 nueva = 51 requests). Fix: `fetchedIdsRef` (Set) rastreo de IDs ya fetched → solo se fetchean fotos nuevas, se hace merge con `setPhotoUrls(prev => ({ ...prev, ...updates }))`.
- **Upload cache:** `uploadFiles()` ahora cachea el URL inmediatamente tras `addDoc` (el `docRef.id` + el `downloadUrl` ya disponible del upload) → la miniatura aparece instantáneamente sin esperar el segundo `getDownloadURL`.

### Web Settings: Network status real
**`web/.../settings/page.tsx`:** Badge "Conectado" hardcodeado reemplazado por estado real `navigator.onLine` + listeners `window.addEventListener('online'/'offline')`. Muestra "En línea" (verde pulsante) o "Sin conexión" (ámbar) con mensaje contextual sobre caché local de Firestore.

### Web Command Palette: Fix hint
**`web/.../command-palette.tsx`:** Footer mostraba `Ctrl+K` como shortcut para cerrar — en realidad ese shortcut ABRE el palette. Corregido a `Esc`.

---

## 2026-04-17 — Mejoras autónomas (sesión continuada #2)

### Web: Flash "not found" en detail pages durante carga
**Problema:** `stations/[stId]/page.tsx` y `drillholes/[dhId]/page.tsx` llamaban `.find()` sobre un array vacío (`loading: true`) → mostraban "Estación no encontrada" inmediatamente en cada refresh o navegación directa a URL.
**Fix:** Ambas páginas ahora consumen el `loading` del hook y muestran un spinner mientras se cargan los datos antes de intentar buscar el item.
**Archivos:** `web/.../stations/[stId]/page.tsx`, `web/.../drillholes/[dhId]/page.tsx`

### Android: Firestore no borraba campos nullable al sincronizar
**Problema crítico de consistencia:** `RemoteDataSource.upsert()` filtraba `null` del mapa antes de escribir en Firestore (`if (v != null) cleanData[k] = v`). Si un usuario limpiaba un campo opcional (ej: `weatherConditions`) en Android, el dato antiguo quedaba en Firestore sin ser eliminado — la web seguía mostrando el valor obsoleto.
**Fix:** Los valores `null` ahora se mapean a `FieldValue.delete()` para eliminar explícitamente el campo en Firestore durante un merge.
**Archivo:** `app/.../data/remote/RemoteDataSource.kt`

### Web Forms: Placeholder no aparecía al resetear Select
**Problema:** En `interval-form.tsx`, `lithology-form.tsx` y `structural-form.tsx`, los `Select` usaban `value={value ?? undefined}`. En Radix UI, `'' ?? undefined = ''` (el operador `??` no cortocircuita en string vacío), así que el Select recibía `value=""` — un valor válido que suprime el placeholder. Visible al cambiar grupo de roca (el tipo de roca quedaba visualmente en blanco en lugar de mostrar "Seleccionar tipo").
**Fix:** Cambiado a `value={value || undefined}` — el operador `||` sí cortocircuita en string vacío, pasando `undefined` al Select para activar el placeholder.
**Archivos:** `web/.../forms/interval-form.tsx`, `web/.../forms/lithology-form.tsx`, `web/.../forms/structural-form.tsx`

---

## 2026-04-17 — Mejoras autónomas (sesión continuada #3)

### Web: Botón "Editar" en páginas de detalle de estación y sondaje
**Problema:** Las páginas de detalle (`stations/[stId]` y `drillholes/[dhId]`) no tenían botón para editar el registro padre — solo sus sub-datos (litologías, intervalos). El usuario debía volver a la lista para encontrar el ícono de edición.
**Fix:** Ícono `Pencil` añadido junto al título. Dialog con `StationForm`/`DrillHoleForm` pre-llenado con los datos actuales.
**Archivos:** `web/.../stations/[stId]/page.tsx`, `web/.../drillholes/[dhId]/page.tsx`

### Android: Fecha incorrecta en sondajes del snapshot
**Problema:** `applySnapshot()` usaba `parseIsoDate(item["startDate"] as? String).takeIf { it > 0 }`. Pero `parseIsoDate(null)` retorna `System.currentTimeMillis()` (siempre > 0), así que sondajes sin `startDate` recibían la fecha actual al importar el snapshot.
**Fix:** Cambiado a `(item["startDate"] as? String)?.let { parseIsoDate(it) }` — null-safe, retorna `null` si el campo está ausente.
**Archivo:** `app/.../data/sync/SyncWorker.kt`

---

## 2026-04-17 — Fix crítico de sincronización Android ↔ Web

### Bug #1: Firestore rules NUNCA desplegadas → sync error permanente
**Problema raíz:** El archivo `firestore.rules` en el repo tiene las reglas correctas (`allow read, write: if request.auth != null && request.auth.uid == userId`), pero **el CI/CD nunca las desplegaba**. Firebase revierte a `allow read, write: if false` después de los primeros 30 días. Todos los writes desde Android fallaban con `PERMISSION_DENIED` → mensaje "error de sincronización".
**Fix:** Nuevo job `deploy-firestore-rules` en `.github/workflows/build-deploy.yml` — se ejecuta en cada push a master y despliega `firestore.rules` + `firestore.indexes.json` con `firebase deploy --only firestore`.
**ACCIÓN MANUAL REQUERIDA:** Ejecutar `firebase deploy --only firestore` desde la terminal ahora mismo para aplicar las reglas en producción sin esperar el próximo push.

### Bug #2: Delta sync omitía todos los registros hijo si el padre no fue modificado recientemente
**Problema raíz:** En `pullFromRemote(sinceMs)`, los mapas `remoteProjectToLocal` y `remoteStationToLocal` se construían **solo** con documentos retornados por el query delta (modificados desde `sinceMs`). Al sincronizar una estación editada cuyo proyecto padre no fue modificado, `remoteProjectToLocal[rs.projectId]` retornaba null → `return@forEach` → **estación silenciosamente omitida**. Mismo problema en cascada para litologías, estructural, muestras, intervalos y fotos.
**Fix:** Tres nuevas funciones `resolveLocalProjectId()`, `resolveLocalStationId()`, `resolveLocalDrillHoleId()` — primero buscan en el mapa en memoria (eficiente para el caso común), luego hacen un fallback a `dao.getByRemoteId()` (Room query) cuando el padre no está en el delta. El resultado se cachea en el mapa para evitar queries repetidas.
**Archivo:** `app/.../data/sync/SyncWorker.kt`

---

## 2026-04-25 — Rediseño UI ultra-profesional (Sesión nueva)

### Design System: GeoAgent Design Handoff implementado
Implementado sistema de diseño extraído de `https://api.anthropic.com/v1/design/h/8QZnfQT1Lc8FlikUP3b6tQ`:
- **Tokens:** Dark zinc-950 base (`--background: 240 10% 3.9%`), flat cards (mismo color que bg, bordes hacen el trabajo), accent verde `#22c55e`
- **Logo:** SVG `GeoMark` — triángulo outline verde (#22c55e) + círculo en vértice superior
- **Login:** Centrado max-w-sm, fondo con grid 48px (`.login-grid`) + glow verde radial (`.login-glow`)
- **Sidebar:** `GeoMark` logo + `UserAvatar` (inicial del email en anillo verde), `sidebar-surface` para diferenciar del contenido
- **StatCards:** Accent borders izquierdo via `.stat-accent-*`, `font-data` (Geist Mono) en números
- **Project avatars:** Hash determinístico del nombre → 8 colores de acento → avatar con iniciales (consistent entre Home y Projects pages)
- **PWA:** `icon.svg`, `icon-192.png`, `icon-512.png`, `favicon.png` del design bundle

### UI: Data Tables — reemplazo de card lists
Listas de estaciones y sondajes reemplazadas con tablas responsivas usando la clase `.data-table` (definida en globals.css). En desktop muestran todas las columnas; en mobile solo las esenciales. Beneficios: mayor densidad de datos, look de software profesional.
- **Estaciones:** Code | Descripción | Geólogo | Fecha | Coordenadas | Actions
- **Sondajes:** ID | Tipo | Estado | Profundidad (from/to) | Progreso (mini progress bar) | Az/Inc | Actions
- **Intervalos (drillhole detail):** reemplazada inline grid con `data-table` bordered
- **Estructural (station detail):** tabla con Tipo | Rumbo/Buz. | Movimiento | Rugosidad | Espesor
- **Muestras (station detail):** tabla con Código | Tipo | Estado | Peso | Descripción

### UI: Skeleton loading states
Reemplazados spinners `<Loader2>` en estaciones y sondajes con skeleton placeholder rows que muestran la estructura de la tabla durante la carga.

### UI: Command Palette mejorado
- Icon box con bg/border activo cuando item seleccionado
- Shortcut `↵` visible en item activo
- Empty state con icono + mensaje
- Footer con count de resultados
- Clara jerarquía de grupos

### CSS globals.css: Nuevas clases
```css
.sidebar-surface   /* bg ligeramente más claro que background */
.card-lift         /* translateY(-1px) en hover */
.data-table        /* tabla responsiva con estilos consistentes */
.skeleton          /* animación shimmer para loading states */
```

### Drillhole detail: Stat cards mejoradas
Stats de intervalos/profundidad/RQD con `stat-accent-*` borders + `font-data` en números.

### Export page: CSS tokens
Reemplazados colores hardcodeados `bg-zinc-900/60 border-zinc-800` con tokens CSS del design system (`hover:border-border/80 bg-card`).

**URL producción:** `https://web-taupe-three-27.vercel.app`
**Commits de esta sesión:** feat(web): data tables, skeletons, command palette polish, stat accents

---

## 2026-04-25 — Android PdfReportGenerator: Reescritura completa (fotos + diseño profesional)

### Problema raíz
Fotos no aparecían en el PDF. `decodeSampledBitmap()` solo manejaba rutas absolutas — no content URIs (MediaStore/FileProvider). Además el diseño era básico (texto plano, sin tablas, fotos en miniatura de 133×100px).

### Solución: Reescritura total de `PdfReportGenerator.kt`

**Fix fotos:**
- Nuevo `loadBitmap(photo, reqW, reqH)`: detecta ruta absoluta vs `content://` URI
- Rutas absolutas → `decodeSampledBitmap()` (existente)
- Content URIs → `contentResolver.openInputStream(Uri.parse(path))` → `BitmapFactory.decodeStream()`
- Fotos sin archivo local (solo en nube) → placeholder con icono ☁ y metadata

**Diseño profesional:**
- **Portada:** bloque navy 60%/blanco 40%, acento dorado lateral, caja stats (estaciones/muestras/sondajes/fotos), descripción del proyecto
- **Cabecera/pie de página:** banda navy con acento dorado, número de página, nombre del proyecto
- **Resumen ejecutivo:** tabla índice de estaciones + tabla índice de sondajes
- **Estaciones:** card header navy/dorado, tablas de litología (tipo/grupo/color/textura/grano/mineralogía), tabla de alteración/mineralización (solo si tiene datos), tabla estructural completa (rumbo/manteo/mov/relleno/rugosidad), tabla de muestras (código/tipo/estado/peso/long/destino/análisis), fotos grandes (hasta 270px alto, sombra, FILTER_BITMAP_FLAG, borde, caption con fecha+GPS)
- **Sondajes:** card header, metadata técnico (az/inc/prof/fechas), tabla de intervalos de logging (11 cols: de/a/long/tipo/grupo/color/textura/alt/mineral/RQD/rec), fotos
- **Texto wrap:** `wrapGuard()` — textos largos (notas, descripciones) se parten en múltiples líneas con saltos de página automáticos
- **Anti-alias:** todos los Paint con `Paint.ANTI_ALIAS_FLAG`
- **Memoria:** `inPreferredConfig = Bitmap.Config.RGB_565` reduce uso de memoria 50%

**Arquitectura:**
- `PS` (PageState) inner class gestiona estado de página (canvas, y, sec, proj)
- `guard(need)` auto-crea nueva página si queda menos de `need` px
- Métodos separados: `drawCover`, `drawExecutiveSummary`, `drawStation`, `drawDrillHole`, `drawPhotoBlock`, `drawTable`, `banner`, `kvRow`, `wrapText`, `wrapGuard`

**Archivo modificado:** `app/src/main/java/com/geoagent/app/util/PdfReportGenerator.kt`

---

## 2026-04-25 — UI ultra-profesional sesión #2 (continuación)

### Completado en esta sesión

**Design System — surface depth:**
- `--background: 240 10% 2.4%` (más oscuro) vs `--card: 240 10% 5.5%` vs `--popover: 240 10% 7%`
- Cards ahora visualmente sobre el fondo — depth real sin sombras
- `.nav-active` class: borde izquierdo verde + bg sutil (reemplaza `bg-primary/10 text-primary` inline)
- `.stat-accent-rose` añadido al design system

**Header — indicador de conexión:**
- Dot verde pulsante (En línea) / ámbar (Sin conexión) con texto en md+
- `window.addEventListener('online'/'offline')` real-time
- Conectado a Firebase → indicador de estado Firebase implícito

**Sidebar:**
- Usa `.nav-active` CSS class (borde izquierdo verde + bg correcto)

**Skeleton loading:**
- Dashboard layout loading: sidebar + header + content skeleton completo
- Projects page loading: grid 6 tarjetas skeleton
- Project detail loading: full page skeleton
- Station detail loading: header + tabs skeleton
- Drillhole detail loading: header + stats skeleton

**Litología tab → data-table:**
- Litologías de estación convertidas a `data-table` (igual que estructural/muestras)
- Columnas: Grupo/Tipo | Color·Textura | Mineralogía | Alteración | Notas | Actions

**Formularios — secciones con Separator:**
Todos los formularios ahora tienen secciones visualmente separadas con `<Separator>` y header `text-[10px] uppercase tracking-widest`:
- `interval-form.tsx`: Profundidad | Litología | Calidad de testigo | Alteración y mineralización
- `drillhole-form.tsx`: Identificación | Collar GPS | Geometría y profundidad | Estado y fechas
- `station-form.tsx`: Identificación | Coordenadas GPS | Condiciones de campo
- `lithology-form.tsx`: Tipo de roca | Alteración y mineralización
- `structural-form.tsx`: Tipo y orientación | Propiedades
- `sample-form.tsx`: Identificación | Medidas y análisis | Coordenadas GPS

**Inline progress bars:**
- RQD (azul) y Recuperación (verde) en interval-form.tsx usan CSS bars en lugar de `Progress` shadcn
- Todos los `Progress` de shadcn eliminados del código web

**Commits de esta sesión:**
- `1d5b927` — feat(web): professional UI pass — data tables, skeleton loaders, StatusBadge
- `4f7f02b` — feat(web): surface depth, nav-active indicator, online status in header
- `b84b405` — feat(web): section interval form with separators, inline RQD/recovery bars
- `4a63877` — feat(web): section drillhole and station forms with visual separators
- `8160dd8` — feat(web): section lithology, structural, sample forms with visual separators

**Estado producción:** Desplegado en `https://web-taupe-three-27.vercel.app`

---

## 2026-04-26 — 5 mejoras web + fix Electron

### Feature 1: Página de analítica por proyecto (`/projects/[id]/analytics`)
- **Creado:** `web/apps/web/src/app/(dashboard)/projects/[id]/analytics/page.tsx`
- **Modificado:** `projects/[id]/page.tsx` — añadido "Analítica" con ícono `BarChart3` a `subNavItems`
- 5 gráficos recharts (patrones idénticos a home/page.tsx):
  - Donut: grupos litológicos (Ignea/Sedimentaria/Metamorfica)
  - Donut: tipos de muestra
  - BarChart horizontal: top 8 tipos de roca por frecuencia
  - BarChart: profundidad planificada vs real por sondaje
  - BarChart: RQD promedio por sondaje
- Carga batched via `getLithologiesForStations`, `getSamplesForStations`, `getIntervalsForDrillHoles`
- Skeletons durante carga, empty state si no hay datos

### Feature 2: Importación de intervalos litológicos (3er tab)
- **Modificado:** `projects/[id]/import/page.tsx`
- Nuevo tab "Intervalos" en la página de importación
- `validateIntervalRow(row, index, holeIdToDocId)` — valida holeId contra sondajes existentes del proyecto
- Aliases de columnas en español e inglés (HoleID/sondaje, From/Desde, RockType/TipoRoca, etc.)
- Importación via `saveDrillInterval` en batches de 20
- Muestra warning si no hay sondajes creados aún

### Feature 3: Overlay de coordenadas al hacer click en el mapa
- **Modificado:** `projects/[id]/map/page.tsx`
- Click en área vacía del mapa → badge con lat/lon a 6 decimales (Geist Mono)
- Botón "Copiar" → clipboard + toast de confirmación
- Botón × para cerrar overlay
- No conflicta con clicks en marcadores (`e.stop()` en marcadores previene propagación)

### Feature 4: Descarga SVG de columna estratigráfica
- **Modificado:** `components/drillhole/stratigraphic-column.tsx`
- Nueva prop `holeId?: string` para nombre del archivo descargado
- Botón "SVG" en la leyenda de la columna → descarga `columna_<holeId>.svg`
- Usa `useRef<SVGSVGElement>` + `outerHTML` + Blob URL
- **Modificado:** `drillholes/[dhId]/page.tsx` — pasa `holeId={drillHole.holeId}`

### Feature 5: Fix Electron build:web
- **Modificado:** `web/apps/desktop/package.json`
- `build:web` ahora usa `cross-env NEXT_EXPORT=1 npm run build` (antes no tenía NEXT_EXPORT → no generaba `/out/` → el installer quedaba vacío)
- `cross-env ^7.0.3` añadido a devDependencies
- Requiere `npm install` en `web/apps/desktop/` antes de usar

**Archivos creados:** `projects/[id]/analytics/page.tsx`
**Archivos modificados:** `projects/[id]/page.tsx`, `projects/[id]/import/page.tsx`, `projects/[id]/map/page.tsx`, `components/drillhole/stratigraphic-column.tsx`, `drillholes/[dhId]/page.tsx`, `web/apps/desktop/package.json`

---

## 2026-04-26 — 5 mejoras web ronda 2 (sesión continuada)

### Feature 1: Status filter pills en lista de sondajes
- **Modificado:** `projects/[id]/drillholes/page.tsx`
- Pills clickeables para filtrar por estado (En Progreso / Completado / Abandonado / Suspendido)
- URL param `?status=` — synced con router, persistente en navegación
- Pill "Todos" + una pill por estado único con conteo
- Filter se combina (AND) con búsqueda por texto existente
- Contador inferior muestra "N de M sondajes" cuando hay filtro activo

### Feature 2: Settings — PWA install card + Keyboard icon fix
- **Modificado:** `settings/page.tsx`
- Nueva Card (Sección 5): "Instalar GeoAgent" — usa `deferredPrompt` y `handleInstall` ya definidos pero sin UI
- Muestra botón "Instalar GeoAgent" cuando `deferredPrompt` disponible, mensaje fallback si no
- Card se oculta si app ya está instalada como standalone (`isStandalone`)
- Fix: ícono de Atajos de teclado cambiado de `Shield` a `Keyboard` (correcto semánticamente)
- `BeforeInstallPromptEvent` interface declarada explícitamente (fix pre-existente)

### Feature 3: Feed de actividad reciente en Home
- **Modificado:** `home/page.tsx`
- `recentActivity` useMemo: merge de `stations` + `drillHoles` ordenados por `updatedAt` desc, slice 8
- Helper `timeAgo(seconds)`: formato relativo en español (hace X min/h/día)
- Sección "Actividad reciente" antes de "Proyectos recientes": lista card con ícono de tipo, label monospace, nombre de proyecto, tiempo relativo, flecha
- Solo renderiza si `!dataLoading && recentActivity.length > 0`

### Feature 4: Lightbox de fotos — navegación por teclado + flechas + descarga
- **Modificado:** `projects/[id]/photos/page.tsx`
- `useEffect` con listener `keydown` para `ArrowLeft`/`ArrowRight` — cicla entre fotos con URL cargada
- `handleDownload()`: descarga via `<a download>` con nombre del archivo
- Botón "Descargar" en footer del lightbox (junto a "Eliminar")
- Flechas `ChevronLeft`/`ChevronRight` superpuestas en la imagen (solo visibles con 2+ fotos cargadas)
- Escape ya manejado por `onOpenChange` del Dialog

### Feature 5: Geologist filter pills en lista de estaciones
- **Modificado:** `projects/[id]/stations/page.tsx`
- Pills clickeables por geólogo único con conteo, URL param `?geologist=`
- Pill "Todos" + pill por geólogo (con ícono `User`)
- Filter AND-combinado con búsqueda por texto
- Contador inferior muestra "N de M estaciones" cuando hay filtro activo
- Solo visible si hay 2+ geólogos distintos en el proyecto

**Archivos modificados:** `drillholes/page.tsx`, `settings/page.tsx`, `home/page.tsx`, `photos/page.tsx`, `stations/page.tsx`

*Última actualización: 2026-04-26 — 10 features web completados en esta sesión. Stack completo y funcional.*
