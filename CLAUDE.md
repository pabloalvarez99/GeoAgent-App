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

# GeoAgent - Android Field Geology App

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

## Obsidian Mind Vault (PKM)

Vault instalado en `C:\Users\Admin\Documents\obsidian-mind`. Cerebro externo del proyecto — conocimiento durable que persiste entre sesiones y máquinas.

| Qué guardar | Dónde en el vault |
|---|---|
| Patrones y gotchas del codebase | `brain/Patterns.md`, `brain/Gotchas.md` |
| Decisiones arquitectónicas | `brain/Key Decisions.md` |
| Features activas en desarrollo | `work/active/` |
| Contexto de stack y arquitectura | `reference/GeoAgent Architecture.md` |
| Objetivos del producto | `brain/North Star.md` |

### Reglas
- Conocimiento durable → vault `brain/`, no en memoria efímera de sesión
- Al terminar sesión significativa, actualizar `brain/Gotchas.md` con trampas reales encontradas
- Las decisiones irreversibles van a `brain/Key Decisions.md` con fecha y justificación
- APPEND siempre — los archivos `brain/` son compartidos entre proyectos
