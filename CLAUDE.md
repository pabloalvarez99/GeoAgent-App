# GeoAgent — Project Instructions for Claude Code

> Documento maestro. Define cómo Claude Code colabora en este repositorio: prioridades, ciclos de cierre, registro auditable de prompts, integración con segundo cerebro (Obsidian) y convenciones técnicas de cada plataforma.

---

## Tabla de contenidos

1. [Prioridad de plataforma](#1-prioridad-de-plataforma)
2. [Reglas operativas obligatorias](#2-reglas-operativas-obligatorias)
   - 2.1 [Bitácora del proyecto](#21-bitácora-del-proyecto)
   - 2.2 [Registro auditable de prompts](#22-registro-auditable-de-prompts)
   - 2.3 [Handoff por presupuesto de tokens](#23-handoff-por-presupuesto-de-tokens)
   - 2.4 [Ciclo de cierre](#24-ciclo-de-cierre)
3. [Orquestación de workflow](#3-orquestación-de-workflow)
4. [Gestión de tareas](#4-gestión-de-tareas)
5. [Principios técnicos](#5-principios-técnicos)
6. [Plataformas activas](#6-plataformas-activas)
   - 6.1 [Web (`web/apps/web/`)](#61-web-webappsweb)
   - 6.2 [Desktop Electron](#62-desktop-electron-webappsdesktop)
7. [Plataforma pausada — Android](#7-plataforma-pausada--android)
8. [Obsidian Mind Vault — segundo cerebro](#8-obsidian-mind-vault--segundo-cerebro)
9. [Quick reference](#9-quick-reference)

---

## 1. Prioridad de plataforma

**Stack activo: web + Electron.** Android está **pausado** desde 2026-04-29.

| Plataforma | Path | Estado | Trabajo nuevo |
|---|---|---|---|
| Web | `web/apps/web/` | ✅ Primaria | Sí |
| Desktop Electron | `web/apps/desktop/` | ✅ Secundaria | Sí, sólo si afecta wrapper |
| Android nativa | `app/` | ⏸️ Pausada | No tocar |

Reglas:
- Toda nueva funcionalidad va en `web/apps/web/`, `web/packages/` o el paquete Electron.
- Si el usuario no especifica plataforma → asumir **web**.
- Sólo retomar Android si el usuario lo pide explícitamente y reactiva la prioridad.
- Código Android existente queda como referencia histórica; no introducir cambios incidentales.

---

## 2. Reglas operativas obligatorias

Estas cuatro reglas son **no-negociables**. Aplicar en cada sesión sin pedir confirmación.

### 2.1 Bitácora del proyecto

**Archivo:** `bitacora.md` (raíz del repo).
**Cuándo actualizar:** al final de cada sesión, después de cada deploy y tras cualquier cambio significativo.

`bitacora.md` es el único documento que permite a Claude Code (en cualquier PC, desde cero) entender el proyecto completo sin contexto previo. Debe contener:

- Estado actual de cada fase (✅ COMPLETADO / ⏳ PENDIENTE / ❌ BLOQUEADO).
- Últimos cambios realizados — qué se hizo y por qué.
- Decisiones técnicas importantes (con fecha).
- URLs de servicios deployados.
- Variables de entorno necesarias.

**Formato de entrada:**

```markdown
## YYYY-MM-DD — <tema breve>

**Qué cambió:** …
**Por qué:** …
**Pendiente:** …
**Deploy URL:** … (si aplica)
```

Si no actualizas `bitacora.md`, la próxima sesión empezará sin contexto y repetirá trabajo.

### 2.2 Registro auditable de prompts

**Carpeta:** `prompts/` (raíz del repo, junto a `bitacora.md`).
**Objetivo:** trail completo de cada prompt + respuesta + outputs, indexado por fecha y tema. Permite rebobinar decisiones, auditar qué se pidió vs qué se hizo, y reconstruir contexto entre PCs/sesiones.

#### Estructura

```
prompts/
├── README.md                      # Schema + convenciones (auto-mantenido)
├── INDEX.md                       # Índice maestro: todos los prompts cronológicos
└── YYYY-MM-DD/                    # Carpeta por día
    ├── _index.md                  # Tabla diaria: hora · slug · tema · commits
    └── HHMMSS-<slug>.md           # Un archivo por prompt
```

- **Carpeta diaria:** `prompts/YYYY-MM-DD/` — agrupa todos los prompts del día.
- **Archivo de prompt:** `HHMMSS-<slug>.md` donde `HHMMSS` = hora local 24h y `<slug>` = kebab-case 3-6 palabras describiendo intención (`refactor-erp-super`, `fix-fence-mobile-scroll`).
- **Índice diario `_index.md`:** tabla con todos los prompts del día — hora, slug, tema, archivos tocados, commits.
- **Índice maestro `INDEX.md`:** lista cronológica con link a cada `YYYY-MM-DD/_index.md`. Una línea por día.

#### Schema de cada archivo de prompt

````markdown
---
date: 2026-05-04T14:32:18-04:00
slug: refactor-erp-super
topic: Brainstorm + plan ERP geology superintendent cockpit
session_id: <opcional — id sesión Claude Code>
files_touched:
  - docs/superpowers/specs/2026-05-04-geology-super-cockpit-design.md
  - docs/superpowers/plans/2026-05-04-geology-super-cockpit.md
commits:
  - e98cc67
  - a72dbdd
  - b103dab
related_handoff: tasks/handoff-2026-05-04-2200.md   # opcional
related_spec: docs/superpowers/specs/<file>.md      # opcional
related_plan: docs/superpowers/plans/<file>.md      # opcional
status: completed                                   # completed | in_progress | abandoned
tags: [brainstorm, planning, mineria, super-geol]
---

## Prompt

<texto verbatim del usuario, completo>

## Resumen respuesta

<1-3 frases sobre qué se entregó>

## Outputs

- Archivos creados/modificados (lista)
- Commits (sha + mensaje)
- Decisiones tomadas
- Pendiente que dejó este prompt
````

#### Cuándo escribir un archivo de prompt

- **Cada prompt no trivial** del usuario → un archivo. Esto incluye preguntas, instrucciones de cambio, brainstorms, fixes.
- **Prompts triviales** (saludos, "ok", "si", "continúa") → NO crear archivo nuevo. En su lugar, anexar como sub-sección en el archivo del prompt no-trivial inmediatamente anterior:
  ```markdown
  ## Follow-ups del mismo turno

  - **HH:MM:SS · "ok"** → procedió con writing-plans skill. Plan generado.
  - **HH:MM:SS · "si"** → aprobó arquitectura propuesta.
  ```
- **Prompts gigantes** (>5000 palabras, dumps de PDF, transcripciones) → preservar verbatim, pero el resumen debe ser denso. No truncar el prompt.

#### Cuándo escribir el archivo

Al **inicio de la respuesta** a un prompt no-trivial: crear el archivo con frontmatter + prompt verbatim. Al **cierre del turno**: completar `Resumen respuesta` + `Outputs` + `status`.

Si el turno produjo commits, agregarlos a `commits:` y al `_index.md` diario.

#### Mantenimiento de índices

- `prompts/YYYY-MM-DD/_index.md` se actualiza al final de cada turno con una fila nueva.
- `prompts/INDEX.md` se actualiza al primer prompt de un día nuevo: agregar línea `- [YYYY-MM-DD](YYYY-MM-DD/_index.md) — N prompts, temas: X, Y, Z`.
- `prompts/README.md` se crea una sola vez con la convención completa.

#### Reglas estrictas

- **Verbatim del prompt** — no parafrasear, no editar. Es trail auditable.
- **Cero secretos** — si el prompt incluye credenciales, redactarlas con `[REDACTED]` y dejar nota en frontmatter `secrets_redacted: true`.
- **Slugs deterministas** — empezar por verbo o tema (`fix-`, `add-`, `refactor-`, `brainstorm-`, `debug-`).
- **No crear archivos por respuestas internas** — solo por prompts del usuario.
- **Commit junto a otros cambios** — el archivo del prompt va en el mismo commit que los outputs cuando sea posible (`docs(prompts): + feat(...)` o commit aparte `chore(prompts): registrar prompt YYYY-MM-DD HH:MM`).

#### Excepción explícita

Si el usuario pide explícitamente "no registres este prompt" → respetar. Anotar en el `_index.md` diario una fila opaca: `HH:MM:SS · — · (no registrado por solicitud)`.

### 2.3 Handoff por presupuesto de tokens

**Cuando el contexto se acerque al límite (~70% lleno o sesión densa), NO seguir trabajando en la misma sesión.** Cortar limpio y reanudar fresco.

Procedimiento:

1. **Detener trabajo activo** en un punto seguro — task/step terminada, no a mitad de un edit.
2. **Generar handoff** en `tasks/handoff-YYYY-MM-DD-HHMM.md` con:
   - **Estado actual:** qué task/step del plan está completa, cuál sigue.
   - **Archivos tocados** (paths absolutos + qué cambió).
   - **Commits hechos** (SHA + mensaje corto).
   - **Pendiente inmediato:** próximo paso concreto + comando exacto.
   - **Bloqueos / decisiones abiertas.**
   - **Plan/spec activo** (path al `.md` en `docs/superpowers/{plans,specs}/`).
   - **Prompt copy-paste** para arrancar nueva sesión:
     > "Lee `docs/superpowers/plans/<plan>.md` + `tasks/handoff-<file>.md`, continúa desde Task N Step M."
3. **Commit del handoff:** `docs(handoff): pause sesión <fecha> en task N step M`.
4. **Avisar al usuario** con path del handoff + prompt listo para pegar.
5. **Cerrar sesión actual** sin seguir trabajando.

**Triggers para cortar:**

- Conversación >40 turnos.
- Más de 3 archivos grandes (>500 líneas) leídos en sesión.
- `/context` reporta >60% usado.
- Sensación de "ya leí mucho de esto antes".
- Antes de empezar task pesada nueva si contexto ya alto.

**No cortar a mitad de:** edit en progreso, test corriendo, commit/push en flight.

**Razón:** tokens caros. Sesiones largas inflan input cost cada turno (cache miss + history). Mejor reanudar fresco con contexto comprimido en handoff que arrastrar 100k tokens muertos.

### 2.4 Ciclo de cierre

**Al cerrar cualquier cambio significativo, ejecutar SIEMPRE en este orden, sin pedir confirmación:**

1. **Actualizar `bitacora.md`** — APPEND entrada `## YYYY-MM-DD — <tema>` con qué cambió y por qué.
2. **Verificar** — desde `web/apps/web/`:
   ```bash
   npm run type-check
   npm test -- --run
   ```
   Si falla → fix antes de continuar.
3. **Commit** — Conventional Commits, mensaje en español o inglés breve. Siempre `Co-Authored-By: Claude`.
4. **Push** — `git push origin master` (o branch activa).
5. **Deploy** — desde **raíz del repo**:
   ```bash
   vercel --prod --yes
   ```
   - CLI rápido (~30-60s). Auto-deploy via git push también funciona pero más lento.
   - Esperar `Ready`, capturar URL.
   - **Sólo el `.vercel/` en repo root** está linkeado al proyecto correcto (`web` → `geoagent-app.vercel.app`). No recrear `.vercel/` en subdirectorios — causa path doubling con `rootDirectory: web/apps/web` remoto.
6. **Bitácora segunda pasada** — APPEND URL deploy + estado `Ready ✅` a la entrada recién creada.
7. **Cerrar prompt en el log** — actualizar `prompts/YYYY-MM-DD/HHMMSS-<slug>.md` con `Outputs` + `status: completed`.

Si el deploy falla → diagnosticar root cause, fix, redeploy. **No dejar deploy roto silenciado.**

**Aplica a:** cambios de feature, fixes UX, refactors visibles.
**No aplica a:** WIP exploratorio, lectura, debugging puro sin edits.

---

## 3. Orquestación de workflow

### Plan node por defecto

- Entrar a plan mode para cualquier tarea no trivial (3+ steps o decisiones arquitectónicas).
- Si algo se desvía → **STOP y re-plan** inmediatamente. No empujar.
- Usar plan mode también para verification, no sólo para construir.
- Specs detalladas upfront reducen ambigüedad y reproceso.

### Estrategia de subagentes

- Usar subagentes liberalmente para mantener limpio el contexto principal.
- Delegar research, exploration y análisis paralelo.
- Para problemas complejos: más compute via subagentes.
- **Una task por subagente** para ejecución enfocada.

### Self-improvement loop

- Tras cualquier corrección del usuario → actualizar `tasks/lessons.md` con el patrón.
- Escribir reglas que prevengan el mismo error.
- Iterar ruthlessly hasta que la tasa de error caiga.
- Revisar `tasks/lessons.md` al inicio de sesión cuando la tarea sea relevante.

### Verification before done

- Nunca marcar task completa sin probar que funciona.
- Diff de comportamiento contra `master` cuando aplique.
- Pregunta interna: "¿un staff engineer aprobaría esto?"
- Correr tests, revisar logs, demostrar correctness.

### Demand elegance (balanced)

- Para cambios no triviales: pausar y preguntar "¿hay forma más elegante?"
- Si un fix se siente hacky: "knowing everything I know now, implement the elegant solution".
- Saltar para fixes simples — no over-engineer.
- Challenge a tu propio trabajo antes de presentarlo.

### Autonomous bug fixing

- Reporte de bug → arréglalo. No pedir hand-holding.
- Apunta a logs, errores, tests fallidos → resuélvelos.
- Cero context switching para el usuario.
- Arreglar CI sin que te digan cómo.

---

## 4. Gestión de tareas

1. **Plan first** — escribir plan en `tasks/todo.md` con items checkables.
2. **Verify plan** — check-in con usuario antes de empezar implementación.
3. **Track progress** — marcar items completos a medida que avanzas.
4. **Explain changes** — resumen alto nivel en cada step.
5. **Document results** — sección review en `tasks/todo.md`.
6. **Capture lessons** — actualizar `tasks/lessons.md` tras correcciones.

Layout estándar:

```
tasks/
├── todo.md                # Backlog activo + checkable items
├── lessons.md             # Patrones aprendidos de correcciones
└── handoff-YYYY-MM-DD-HHMM.md   # Handoffs entre sesiones (sección 2.3)
```

---

## 5. Principios técnicos

- **Simplicity first** — cada cambio tan simple como sea posible. Mínimo código tocado.
- **No laziness** — encontrar root cause. Sin fixes temporales. Estándar senior.
- **Minimal impact** — cambios sólo tocan lo necesario. Evitar introducir bugs colaterales.
- **All UI text in Spanish** — convención del producto.
- **Date handling** — usar APIs thread-safe (`date-fns` en web, `DateTimeFormatter` en Android legacy). Nunca `SimpleDateFormat`.

---

## 6. Plataformas activas

### 6.1 Web (`web/apps/web/`)

**Stack:** Next.js 15 (App Router) + React 19 + TypeScript + Tailwind + Firebase 11.
**Deploy:** Vercel — `geoagent-app.vercel.app`.
**Testing:** Vitest. **Type-check:** `npm run type-check`.

Estructura clave (raíz `web/apps/web/`):

```
src/
├── app/
│   ├── (auth)/login/
│   └── (dashboard)/
│       ├── home/ projects/ analytics/ settings/ dev/
│       └── (futuro: super/, admin/)
├── components/
├── lib/
│   ├── firebase/        # auth, client, firestore, init, messaging
│   ├── hooks/
│   ├── export/
│   ├── electron.ts      # bridge browser ↔ Electron
│   └── utils/
└── types/
```

### 6.2 Desktop Electron (`web/apps/desktop/`)

Wrapper de la web app. Carga build estático de Next vía `app://` protocol. Installer NSIS Windows x64. Auto-updater desde GitHub releases.

- `electron-src/main.ts` — main process: protocol handler, IPC, menú nativo ES, auto-updater.
- `electron-src/preload.ts` — `window.electronAPI` (`saveFile`, `openFile`, `getVersion`, `checkForUpdates`).
- `web/apps/web/src/lib/electron.ts` — bridge con fallback browser (`isElectron()`, `saveFile()`).
- Build: `npm run desktop` (dev) · `cd web/apps/desktop && npm run build` (export → installer).
- `next.config.ts` activa `output: 'export'` con `NEXT_EXPORT=1`.
- **Convención de export:** cualquier flujo de export nuevo debe usar `saveFile()` de `lib/electron.ts`, no `<a download>` directo.

---

## 7. Plataforma pausada — Android

> **Pausada desde 2026-04-29.** No tocar `app/` salvo instrucción explícita del usuario para reactivar.

**Stack legado (referencia):** Kotlin + Jetpack Compose + Material 3, Room (SQLite) local + Firestore cloud, Firebase Auth + Storage, Hilt DI, Coroutines + Flow, WorkManager sync, Compose Navigation con rutas `@Serializable`, Apache POI / Android PdfDocument para exports.

**Arquitectura legada:**

- `data/local/{entity,dao,database}/` — 8 entidades (Project, Station, Lithology, Structural, Sample, DrillHole, DrillInterval, Photo) + DAOs + DB con migrations 1→2→3.
- `data/remote/` — `RemoteDataSource.kt` + DTOs Firebase (`toMap()` / `fromFirestoreMap()`).
- `data/repository/` — 8 repos, single source of truth.
- `data/sync/` — SyncManager, SyncWorker (`@HiltWorker`), ConnectivityObserver.
- `di/` — DatabaseModule, FirebaseModule, NetworkModule.
- `ui/screens/` — 13 áreas, 40 archivos (Screen + ViewModel por feature).
- `util/` — CodeGenerator, DateFormatter, ExportHelper, FormValidation, LocationHelper, PreferencesHelper, PdfReportGenerator.

**Pantallas:** auth/login, project (list, detail), station (list, detail, create), lithology, structural, sample, drillhole (list, detail, create + interval form), photo (camera, gallery), map (Google Maps), export (PDF, Excel, GeoJSON, ZIP CSV collar/survey/assay), settings, home.

**Convenciones legadas:**

- All UI text in Spanish.
- Touch targets >48dp para uso con guantes en terreno.
- Offline-first: Room primero, sync cuando WiFi.
- `syncStatus`: `PENDING → SYNCED`, `MODIFIED → SYNCED`.
- `Flow` para reactivo, `suspend` para writes.
- Package: `com.geoagent.app`.
- `DateFormatter` con `DateTimeFormatter` thread-safe (no `SimpleDateFormat`).
- PDF photo embedding via `decodeSampledBitmap()` para evitar OOM.

**Firebase legado:**

- Config: `app/google-services.json`.
- Firestore: `users/{userId}/{collection}/{docId}` (path single-tenant — ver migración multi-org en `docs/superpowers/specs/2026-05-04-geology-super-cockpit-design.md`).
- Storage: `photos/{userId}/{fileName}`.
- Rules: `firestore.rules`, `storage.rules`.
- `supabase/` legacy (no usado por la app).

---

## 8. Obsidian Mind Vault — segundo cerebro

**Path:** `C:\Users\Administrator\Documents\obsidian-mind\` (el path antiguo `C:\Users\Admin\...` está mal — no usar).

Vault = cerebro externo durable, **compartido entre proyectos** (Tu Farmacia + GeoAgent + futuros). Persiste entre sesiones, PCs y modelos. Si algo merece sobrevivir a `/clear`, va al vault.

### Mapa del vault

| Path | Contenido | Cuándo escribir |
|---|---|---|
| `brain/Gotchas.md` | Trampas reales que mordieron — root cause + fix. Caveman-compressed | Tras debug no trivial: bug raro, error oscuro, edge case |
| `brain/Patterns.md` | Idiomas/convenciones reusables del codebase | Patrón replicable (>2 usos esperados) |
| `brain/Key Decisions.md` | Decisiones irreversibles + fecha + justificación | Cambio de stack, migración, tradeoff arquitectónico |
| `brain/North Star.md` | Objetivos del producto (no técnicos) | Cambio de visión/scope mayor |
| `brain/Skills.md` | Recetas operativas (cómo hacer X) | Procedimiento que se repetirá |
| `brain/Memories.md` | Contexto del usuario / preferencias persistentes | Sólo si Pablo lo pide explícito |
| `reference/GeoAgent Architecture.md` | Snapshot de arquitectura | Cambio estructural mayor |
| `work/active/` | Features en desarrollo (un `.md` por feature) | Al iniciar feature multi-sesión |
| `work/archive/` | Features completados | Mover desde `active/` al cerrar |
| `work/incidents/` | Postmortems de incidentes | Tras incidente prod o regresión grave |

### Protocolo de sesión

**Inicio (cuando la tarea es no trivial):**

1. Leer `brain/Gotchas.md` filtrando por `## GeoAgent — *`.
2. Leer `brain/Key Decisions.md` si la tarea toca arquitectura.
3. Si feature continúa → leer `work/active/<feature>.md`.

**Durante la sesión:**

- `bitacora.md` (proyecto) = log cronológico verboso, **qué se hizo**.
- `prompts/` (proyecto) = trail auditable, **qué se pidió**.
- Vault `brain/` = lecciones destiladas, **qué aprender**. No duplicar bitácora aquí.
- **Regla decisión:** ¿lo necesita otro proyecto/agente futuro sin contexto? → vault. ¿Sólo histórico de este proyecto? → bitácora.

**Cierre de sesión significativa:**

1. Trampa real encontrada → APPEND a `brain/Gotchas.md` bajo `## GeoAgent — <tema>`.
2. Decisión irreversible → APPEND a `brain/Key Decisions.md` con fecha ISO + por qué.
3. Patrón nuevo (>2 usos esperados) → APPEND a `brain/Patterns.md`.
4. Feature sigue abierto → actualizar `work/active/<feature>.md`.
5. Arquitectura cambió → editar `reference/GeoAgent Architecture.md`.

### Formato — caveman compressed

Los archivos `brain/` usan estilo ultra-comprimido para densidad máxima:

- Bullet por línea, sin artículos.
- `X → Y` para causalidad.
- Abreviaciones técnicas (DB / auth / fn / req / res).
- Errores quoted exactos en backticks.

**Ejemplo real:**

```
## GeoAgent — Sync
- Android escribía `updated_at`, web ordenaba `updatedAt` → datos invisibles. Fix: snake_case en ambos lados
- Firestore rules sin desplegar = sync falla silente. Verificar con `firebase deploy --only firestore:rules`
```

### Reglas estrictas

- **APPEND, no sobrescribir** — vault compartido entre proyectos. Header `## <Proyecto> — <tema>` separa contextos.
- **Verificar antes de citar** — entrada vieja puede estar stale. Confirmar contra código actual antes de actuar.
- **No duplicar bitácora** — si está en `bitacora.md`, no copiar al vault salvo que sea lección reusable.
- **Backup automático** — `Gotchas.md` tiene `Gotchas.original.md` como backup human-readable. No tocar `.original.md`.
- **Path con espacios** — `"Key Decisions.md"` necesita comillas en CLI.

### Cuándo NO usar el vault

- Estado efímero de sesión actual → memoria de Claude.
- TODOs del proyecto → `tasks/todo.md`.
- Log cronológico → `bitacora.md`.
- Trail de prompts → `prompts/`.
- Lecciones de correcciones del usuario → `tasks/lessons.md` (per-proyecto).
- Snippets de código grandes — vault es para destilados, no copy-paste.

---

## 9. Quick reference

### Layout del repo (artefactos clave)

```
GeoAgent-App/
├── CLAUDE.md                       # Este archivo (instrucciones maestras)
├── bitacora.md                     # Log cronológico del proyecto (§2.1)
├── prompts/                        # Trail auditable de prompts (§2.2)
│   ├── README.md
│   ├── INDEX.md
│   └── YYYY-MM-DD/
├── tasks/
│   ├── todo.md                     # Backlog activo
│   ├── lessons.md                  # Lecciones aprendidas
│   └── handoff-*.md                # Handoffs entre sesiones (§2.3)
├── docs/
│   └── superpowers/
│       ├── specs/                  # Design specs aprobadas
│       └── plans/                  # Implementation plans
├── web/
│   ├── apps/
│   │   ├── web/                    # Next.js 15 (primaria)
│   │   └── desktop/                # Electron wrapper
│   └── packages/                   # Compartidos
├── app/                            # Android (PAUSADO — no tocar)
├── firestore.rules
├── firestore.indexes.json
└── .vercel/                        # Linkeado a geoagent-app.vercel.app
```

### Comandos frecuentes

```bash
# Type-check + tests (web)
cd web/apps/web && npm run type-check && npm test -- --run

# Dev server
cd web/apps/web && npm run dev

# Build Electron desktop
cd web/apps/desktop && npm run build

# Deploy producción (desde repo root)
vercel --prod --yes

# Deploy reglas Firestore
firebase deploy --only firestore:rules,firestore:indexes

# Crear handoff (template)
date +"tasks/handoff-%Y-%m-%d-%H%M.md"

# Crear archivo de prompt del momento
date +"prompts/%Y-%m-%d/%H%M%S-<slug>.md"
```

### Documentos vivos a actualizar (checklist por sesión)

- [ ] `bitacora.md` — entrada nueva con fecha ISO.
- [ ] `prompts/YYYY-MM-DD/HHMMSS-<slug>.md` — un archivo por prompt no trivial.
- [ ] `prompts/YYYY-MM-DD/_index.md` — fila nueva.
- [ ] `prompts/INDEX.md` — línea nueva si es primer prompt del día.
- [ ] `tasks/lessons.md` — si hubo corrección del usuario.
- [ ] Vault `brain/{Gotchas,Patterns,Key Decisions}.md` — si aplica.

### Notas finales

- **Comunicación con el usuario:** español por defecto. Caveman mode si está activo (`stop caveman` para desactivar).
- **Commits:** Conventional Commits + `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
- **Secretos:** nunca commitear `.env*`, `service-account.json`, `google-services.json` con keys reales. Si se filtran en un prompt → marcar `secrets_redacted: true` y redactar antes de guardar.
