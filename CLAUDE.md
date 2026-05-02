## ⚠️ PRIORIDAD DEL PROYECTO — LEER PRIMERO

**WEB + ELECTRON.** Plataformas activas: web (`web/`) y desktop Electron. Android **DESACTIVADO** (2026-04-29).

- Android (`app/`) → **NO TOCAR**. Pausado por decisión del usuario. Código existente queda como referencia, no hay trabajo activo.
- Toda nueva funcionalidad va en `web/apps/web/`, `web/packages/`, o el paquete de Electron.
- Si el usuario no especifica plataforma → asumir web.
- Solo retomar Android si el usuario lo pide explícitamente y reactiva la prioridad.

---

## Bitácora — Regla Obligatoria

**SIEMPRE actualiza `bitacora.md` al final de cada sesión, después de cada deploy y después de cualquier cambio significativo.**

`bitacora.md` es el único documento de contexto que permite a Claude Code (en cualquier PC, desde cero) entender el proyecto completo sin conocimiento previo. Debe contener:
- Estado actual de cada fase (✅ COMPLETADO / ⏳ PENDIENTE)
- Últimos cambios realizados (qué se hizo y por qué)
- Decisiones técnicas importantes
- URLs de servicios deployados
- Variables de entorno necesarias

Si no actualizas `bitacora.md`, la próxima sesión empezará sin contexto y repetirá trabajo.

---

## Ciclo de cierre — Regla Obligatoria

**Al cerrar cualquier cambio significativo, ejecutar SIEMPRE en este orden, sin pedir confirmación:**

1. **Actualizar `bitacora.md`** — APPEND entrada `## YYYY-MM-DD — <tema>` con qué cambió y por qué
2. **Verificar** — `npx tsc --noEmit` + `npm test -- --run` desde `web/apps/web/`. Si rojo → fix antes de continuar
3. **Commit** — Conventional Commits, mensaje en español o inglés breve. Co-Authored-By: Claude
4. **Push** — `git push origin master` (o branch activa)
5. **Deploy** — `cd <repo-root> && vercel --prod --yes` (CLI rápido, ~30-60s). Auto-deploy via git push también funciona pero más lento. Esperar Ready, capturar URL. Solo el `.vercel/` en repo root está linkeado al proyecto correcto (`web` → `geoagent-app.vercel.app`); no recrear `.vercel/` en subdirectorios — causa path doubling con `rootDirectory: web/apps/web` remoto
6. **Bitácora segunda pasada** — APPEND URL deploy + estado Ready a la entrada recién creada

Si el deploy falla → diagnosticar root cause, fix, redeploy. No dejar deploy roto silenciado.

Esta regla aplica a: cambios de feature, fixes UX, refactors visibles. NO aplica a: WIP exploratorio, lectura, debugging puro sin edits.

---

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

# GeoAgent — Plataformas activas

## Web (`web/apps/web/`) — PRIMARIO
Next.js 15 App Router + React 19 + Tailwind + Firebase. Deploy: Vercel (`geoagent-app.vercel.app`).

## Desktop Electron (`web/apps/desktop/`) — SECUNDARIO
Wrapper de la web app. Carga build estático de Next vía `app://` protocol. NSIS installer Windows x64. Auto-updater desde GitHub releases.

- `electron-src/main.ts` — main process: protocol handler, IPC, menú nativo ES, auto-updater
- `electron-src/preload.ts` — `window.electronAPI` (saveFile, openFile, getVersion, checkForUpdates)
- `web/src/lib/electron.ts` — bridge con fallback browser (`isElectron()`, `saveFile()`)
- Build: `npm run desktop` (dev) · `cd apps/desktop && npm run build` (export → installer)
- `next.config.ts` activa `output: 'export'` con `NEXT_EXPORT=1`
- Cualquier flujo de export nuevo debe usar `saveFile()` de `lib/electron.ts`, no `<a download>` directo.

---

# GeoAgent — Android (PAUSADO 2026-04-29)

> Plataforma desactivada. No tocar `app/` salvo instrucción explícita del usuario para reactivar.

## Project Overview
Android native app (Kotlin + Jetpack Compose) for field geology data collection.
Offline-first with Firebase cloud sync (Firestore + Auth + Storage).

## Tech Stack
- **Language:** Kotlin
- **UI:** Jetpack Compose + Material 3
- **Database:** Room (SQLite) for local, Firebase Firestore for cloud
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage (photos)
- **DI:** Hilt (`@HiltViewModel`, `@HiltWorker`)
- **Async:** Coroutines + Flow
- **Sync:** WorkManager (periodic + manual)
- **Navigation:** Compose Navigation with type-safe `@Serializable` routes
- **Export:** Apache POI (Excel .xlsx), Android PdfDocument (PDF), GeoJSON, CSV (collar/survey/assay)

## Architecture
- `data/local/entity/` - Room entities (8: Project, Station, Lithology, Structural, Sample, DrillHole, DrillInterval, Photo)
- `data/local/dao/` - Room DAOs (8 matching entities)
- `data/local/database/` - GeoAgentDatabase + migrations (1→2→3)
- `data/remote/RemoteDataSource.kt` - Firebase Firestore/Storage operations
- `data/remote/dto/` - Firebase DTOs with `toMap()` / `fromFirestoreMap()` (8 files)
- `data/repository/` - Repositories (8, single source of truth pattern)
- `data/sync/` - SyncManager, SyncWorker (`@HiltWorker`), ConnectivityObserver
- `di/` - Hilt modules: DatabaseModule, FirebaseModule, NetworkModule
- `ui/screens/` - 13 feature areas, 40 files (Screen + ViewModel per feature)
- `ui/components/` - Reusable UI components
- `ui/navigation/` - Routes.kt (sealed `@Serializable` routes), GeoAgentNavHost, AuthNavigation
- `ui/theme/` - Material 3 theme
- `util/` - CodeGenerator, DateFormatter, ExportHelper, FormValidation, LocationHelper, PreferencesHelper, PdfReportGenerator

## Screens
- **auth/** - Login (Firebase Auth)
- **project/** - List, Detail
- **station/** - List, Detail, Create
- **lithology/** - Form (per station)
- **structural/** - Form (per station)
- **sample/** - Form (per station)
- **drillhole/** - List, Detail, Create + DrillIntervalForm
- **photo/** - CameraCapture, PhotoGallery
- **map/** - Google Maps view (stations + drill holes, multiple map types)
- **export/** - PDF report, Excel, GeoJSON, Collar/Survey/Assay CSV (ZIP)
- **settings/** - Sync controls, coordinate format, preferences
- **home/** - Dashboard

## Conventions
- All UI text in **Spanish**
- Large touch targets (48dp+ buttons) for field use with gloves
- Offline-first: all data saved to Room first, synced when WiFi available
- Entity syncStatus: PENDING → SYNCED, MODIFIED → SYNCED
- Use `Flow` for reactive UI, `suspend` for writes
- Package: `com.geoagent.app`
- DateFormatter uses thread-safe `DateTimeFormatter` (not `SimpleDateFormat`)
- PDF photo embedding uses `decodeSampledBitmap()` to prevent OOM

## Firebase
- Config: `app/google-services.json`
- Firestore structure: `users/{userId}/{collection}/{docId}`
- Storage: `photos/{userId}/{fileName}`
- Rules: `firestore.rules`, `storage.rules`
- Legacy `supabase/` directory exists with migration SQL (not used by app)

ve actualizando bitacora.md despues de cada prompt y cambios significativos

---

## Obsidian Mind Vault (Segundo Cerebro) — OBLIGATORIO

**Path correcto:** `C:\Users\Administrator\Documents\obsidian-mind\`
(El path antiguo `C:\Users\Admin\...` está mal — no usar.)

Vault = cerebro externo durable. Compartido entre proyectos (Tu Farmacia + GeoAgent + futuros). Persiste entre sesiones, PCs y modelos. Si algo merece sobrevivir a `/clear`, va al vault.

### Mapa del vault

| Path | Contenido | Cuándo escribir |
|---|---|---|
| `brain/Gotchas.md` | Trampas reales que mordieron — root cause + fix. Caveman-compressed | Tras debug no-trivial: bug raro, error oscuro, edge case |
| `brain/Patterns.md` | Idiomas/convenciones reusables del codebase | Al detectar patrón replicable (>2 usos) |
| `brain/Key Decisions.md` | Decisiones irreversibles + fecha + justificación | Cambio de stack, migración, tradeoff arquitectónico |
| `brain/North Star.md` | Objetivos del producto, no técnicos | Cambio de visión/scope mayor |
| `brain/Skills.md` | Recetas operativas (cómo hacer X) | Procedimiento que se repetirá |
| `brain/Memories.md` | Contexto del usuario / preferencias persistentes | Solo si Pablo lo pide explícito |
| `reference/GeoAgent Architecture.md` | Snapshot de arquitectura (stack, dirs, flujos) | Cambio estructural mayor del codebase |
| `work/active/` | Features en desarrollo activo (un .md por feature) | Al iniciar feature multi-sesión |
| `work/archive/` | Features completados | Mover desde `active/` al cerrar feature |
| `work/incidents/` | Postmortems de incidentes | Tras incidente prod o regresión grave |

### Protocolo de sesión

**Al inicio de sesión (cuando tarea es no-trivial):**
1. Leer `brain/Gotchas.md` filtrando por proyecto activo (`## GeoAgent — *`)
2. Leer `brain/Key Decisions.md` si la tarea toca arquitectura
3. Si feature continúa → leer `work/active/<feature>.md`

**Durante sesión:**
- `bitacora.md` (proyecto) = log cronológico verboso, qué se hizo
- Vault `brain/` = lecciones destiladas, qué aprender. NO duplicar bitácora aquí
- Regla decisión: ¿lo necesita otro proyecto/agente futuro sin contexto? → vault. ¿Solo histórico de este proyecto? → bitácora.

**Al cierre de sesión significativa:**
1. Si encontraste trampa real → APPEND a `brain/Gotchas.md` bajo header `## GeoAgent — <tema>`
2. Si tomaste decisión irreversible → APPEND a `brain/Key Decisions.md` con fecha ISO + por qué
3. Si patrón nuevo (>2 usos esperados) → APPEND a `brain/Patterns.md`
4. Si feature sigue abierto → actualizar `work/active/<feature>.md` con estado
5. Si arquitectura cambió → editar `reference/GeoAgent Architecture.md`

### Formato — caveman compressed

Los archivos `brain/` usan estilo ultra-comprimido para maximizar densidad:
- Bullet por línea, sin artículos
- `X → Y` para causalidad
- Abreviaciones técnicas (DB/auth/fn/req/res)
- Quote errores exactos con backticks

Ejemplo (de `Gotchas.md` real):
```
## GeoAgent — Sync
- Android escribía `updated_at`, web ordenaba `updatedAt` → datos invisibles. Fix: snake_case en ambos lados
- Firestore rules sin desplegar = sync falla silente. Verificar con `firebase deploy --only firestore:rules`
```

### Reglas estrictas

- **APPEND, no sobrescribir** — vault es compartido entre proyectos. Header `## <Proyecto> — <tema>` separa contextos
- **Verificar antes de citar** — entrada del vault con fecha vieja puede estar stale. Confirmar con código actual antes de actuar
- **No duplicar bitácora** — si ya está en `bitacora.md`, no copiar al vault salvo que sea lección reusable
- **Backup automático** — Gotchas.md tiene `Gotchas.original.md` como backup human-readable. No tocar `.original.md`
- **Path con espacios** — `"Key Decisions.md"` necesita comillas en CLI

### Cuándo NO usar el vault

- Estado efímero de sesión actual → memoria de Claude
- TODOs del proyecto → `tasks/todo.md`
- Log de cambios → `bitacora.md`
- Lecciones de correcciones del usuario → `tasks/lessons.md` (per-proyecto)
- Snippets de código grandes → vault es para destilados, no copy-paste de código
