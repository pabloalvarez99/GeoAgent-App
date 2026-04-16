# GeoAgent-App — Contexto de Herramientas y Entorno

> **Para el agente que retome esta sesión:** Este archivo documenta todo lo disponible en este equipo para trabajar con Claude Code. Actualizar cuando se instale algo nuevo.
> Última actualización: 2026-04-15

## Estado Actual del Proyecto (2026-04-15)

**Qué funciona:**
- ✅ App Android completa (NO tocar `app/`)
- ✅ Web platform completa en Vercel: `https://web-taupe-three-27.vercel.app`
  - Auth (Firebase), Projects, Stations, Drillholes, Map, Photos, Export (PDF/Excel/GeoJSON/CSV)
- ✅ Sincronización Android ↔ Web funcionando (fix `updated_at` → `updatedAt` aplicado)

**En progreso / Pendiente:**
- ⏳ Fase 8: Electron Desktop (web/apps/desktop/) — wrapper .exe
- ⏳ Fase 9: Analytics (recharts), Settings page, Import CSV/Excel
- ⏳ Fase 10: CI/CD GitHub Actions, PWA manifest

**Gotchas activos más importantes:**
1. **NO usar pnpm** — el monorepo web/ usa npm workspaces. pnpm + Node 22 + Vercel = crash fatal (ERR_INVALID_THIS)
2. **NO usar `orderBy('updatedAt')` en Firestore** — excluye silenciosamente docs de Android. Ver `lib/firebase/firestore.ts`
3. **AdvancedMarker requiere `mapId`** — sin él, los marcadores del mapa no renderizan

**Próximos pasos sugeridos:**
1. Implementar Electron wrapper (Fase 8) — ver bitacora.md §8 para especificación completa
2. Agregar Google Maps API key en variables de entorno Vercel para habilitar el mapa en producción

---

## 1. Sistema Operativo y Entorno

- **OS:** Windows 11 Pro (Build 26200.8037)
- **Shell en Claude Code:** bash (Git Bash / MinGW64) — usar sintaxis Unix, **no** PowerShell/cmd
- **Usuario Windows:** Pablo
- **Directorio del repo:** `C:\Users\Pablo\Documents\GitHub\GeoAgent-App`

---

## 2. CLIs Instalados

| CLI | Versión | Ubicación | Uso |
|-----|---------|-----------|-----|
| `gcloud` | SDK 563.0.0 | `C:\Program Files (x86)\Google\Cloud SDK\...` | Firestore REST API, Firebase auth token |
| `firebase` | 15.12.0 | npm global | Deploy reglas, índices Firestore, hosting |
| `vercel` | 50.13.1 | npm global | Deploy web, ver logs, gestionar env vars |
| `node` | v24.13.0 | `C:\Program Files\nodejs\` | Runtime JS |
| `npm` | 11.6.2 | `C:\Program Files\nodejs\` | Package manager |
| `pnpm` | 10.32.1 | npm global | Package manager del monorepo web/ |
| `cargo` | 1.93.0 | `~/.cargo/bin/` | Compilar/correr API Rust |
| `rustup` | 1.28.2 | `~/.cargo/bin/` | Gestión toolchain Rust |
| `git` | 2.53.0 | MinGW64 | Control de versiones |
| `docker` | 29.2.1 | `C:\Program Files\Docker\Docker\...` | Contenedores (para Rust API Dockerfile) |
| `kubectl` | (incluido con Docker) | Docker bin | Kubernetes (disponible pero no usado) |
| `curl` | MinGW64 | MinGW64 | HTTP requests desde bash |

### CLIs NO en PATH de bash por defecto (agregar manualmente)
- `gh` (GitHub CLI) v2.89.0 — instalado en `C:\Program Files\GitHub CLI\gh.exe`. **Agregar al PATH:** `export PATH="$PATH:/c/Program Files/GitHub CLI"` (ya en `~/.bashrc` y `~/.bash_profile`). Autenticado como `pabloalvarez99`.
- `flyctl` — **no en PATH de bash**. Disponible en Windows pero no encontrado. Para fly.io usar `flyctl` desde cmd/PowerShell o instalarlo globalmente

### Cuentas autenticadas
- **gcloud:** `timadapa@gmail.com` — tiene acceso al proyecto Firebase `geoagent-app`
- **firebase:** autenticado (mismo proyecto `geoagent-app`)
- **vercel:** autenticado — proyecto `web-taupe-three-27.vercel.app`

---

## 3. Plugins de Claude Code Instalados

| Plugin | Fuente | Descripción / Uso |
|--------|--------|-------------------|
| `superpowers` | claude-plugins-official | Meta-skill: gestión de skills, flujo de trabajo principal |
| `code-simplifier` | claude-plugins-official | Simplifica y refina código |
| `gopls-lsp` | claude-plugins-official | LSP para Go |
| `context7` | claude-plugins-official | Fetcha documentación actualizada de librerías (React, Next.js, Axum, etc.) |
| `frontend-design` | claude-plugins-official | Diseño UI/UX frontend |
| `typescript-lsp` | claude-plugins-official | LSP para TypeScript — autocompletado y análisis semántico |
| `serena` | claude-plugins-official | Herramientas semánticas de código (find_symbol, get_symbols_overview, etc.) |
| `claude-mem` | thedotmack | Memoria persistente entre sesiones (observaciones, búsqueda semántica de historial) |
| `supabase` | claude-plugins-official | Integración Supabase (no usado en GeoAgent) |
| `vercel` | claude-plugins-official | Deploy Vercel, ver logs, gestionar proyectos desde Claude |
| `claude-code-setup` | claude-plugins-official | Setup de proyectos con Claude Code |
| `code-review` | claude-plugins-official | Revisión de código (superpowers:code-reviewer) |
| `feature-dev` | claude-plugins-official | Desarrollo de features (architect, explorer, reviewer) |
| `playwright` | claude-plugins-official | Automatización de browser (chrome headless) — **no funciona en este entorno** |
| `claude-md-management` | claude-plugins-official | Gestión de archivos CLAUDE.md |
| `ralph-loop` | claude-plugins-official | Loop de refinamiento iterativo |
| `security-guidance` | claude-plugins-official | Guías de seguridad |
| `commit-commands` | claude-plugins-official | Comandos /commit, /review-pr |
| `skill-creator` | claude-plugins-official | Crear nuevos skills |
| `pyright-lsp` | claude-plugins-official | LSP para Python |
| `plugin-dev` | claude-plugins-official | Desarrollo de plugins (validator, agent-creator, skill-reviewer) |
| `kotlin-lsp` | claude-plugins-official | LSP para Kotlin — útil para el código Android |
| `railway` | claude-plugins-official | Deploy Railway (no usado en GeoAgent) |
| `rust-analyzer-lsp` | claude-plugins-official | LSP para Rust — análisis semántico del API Axum |

---

## 4. Skills Disponibles (via Skill tool)

Skills invocables con `/nombre` o via la herramienta `Skill`:

| Skill | Cuándo usarlo |
|-------|---------------|
| `/commit` | Crear commits Git bien formateados |
| `/review-pr` | Revisar pull requests |
| `superpowers:code-reviewer` | Revisión profunda de código después de completar una fase |
| `feature-dev:code-architect` | Diseñar arquitectura de nuevas features |
| `feature-dev:code-explorer` | Explorar partes desconocidas del codebase |
| `feature-dev:code-reviewer` | Revisar bugs, seguridad, calidad de código |
| `plugin-dev:plugin-validator` | Validar estructura de plugins |
| `plugin-dev:agent-creator` | Crear agentes nuevos |
| `plugin-dev:skill-reviewer` | Revisar calidad de skills |
| `code-simplifier:code-simplifier` | Simplificar código complejo |

---

## 5. MCP Servers Activos

| MCP Server | Herramientas clave |
|------------|-------------------|
| `plugin:context7` | `resolve-library-id`, `query-docs` — docs de Next.js, Axum, Firebase, etc. |
| `plugin:serena` | `find_symbol`, `get_symbols_overview`, `find_referencing_symbols`, `search_for_pattern`, `replace_symbol_body` |
| `plugin:claude-mem` | `search`, `smart_search`, `get_observations`, `timeline` — historial semántico de sesiones |
| `plugin:vercel` | `get_deployment`, `get_runtime_logs`, `list_deployments`, `deploy_to_vercel` |
| `plugin:playwright` | Browser automation — **crashes en este entorno** (exit code 0, Chrome no inicia) |
| `plugin:supabase` | Supabase integration (no usado) |
| `serena` (nativo) | Mismo que plugin:serena |

---

## 6. Subagentes Disponibles (via Agent tool)

| Tipo | `subagent_type` | Uso |
|------|----------------|-----|
| General | (omitir) | Investigación compleja, búsquedas abiertas |
| Explorador | `Explore` | Búsqueda rápida de archivos, patrones en codebase |
| Planificador | `Plan` | Diseñar estrategia de implementación |
| Revisor | `superpowers:code-reviewer` | Revisión completa al terminar una fase |
| Arquitecto | `feature-dev:code-architect` | Diseño de nuevas features |
| Explorador de código | `feature-dev:code-explorer` | Análisis profundo del codebase existente |
| Revisor de código | `feature-dev:code-reviewer` | Bugs, seguridad, calidad |

---

## 7. Servicios Cloud del Proyecto

| Servicio | Proyecto/URL | Estado |
|----------|-------------|--------|
| Firebase / Firestore | `geoagent-app` | ✅ Activo |
| Firebase Auth | `geoagent-app.firebaseapp.com` | ✅ Activo |
| Firebase Storage | `geoagent-app.firebasestorage.app` | ✅ Activo |
| Vercel (Web) | `https://web-taupe-three-27.vercel.app` | ✅ Activo |
| Fly.io (Rust API) | `geoagent-api` (app no creada aún) | ⏳ Pendiente |
| GitHub Repo | `pabloasc/GeoAgent-App` | ✅ Activo |

---

## 8. Limitaciones Conocidas de este Entorno

1. **`gh` CLI requiere PATH manual en bash** — `export PATH="$PATH:/c/Program Files/GitHub CLI"` (ya guardado en `~/.bashrc`). Una vez en PATH, funciona normal.
2. **Playwright no funciona** — Chrome falla al iniciar (exit code 0). No usar para verificación
3. **`python3` no disponible en bash** — usar `node` para parsing JSON
4. **`flyctl` no en PATH de bash** — correr desde cmd/PowerShell para deploy Fly.io
5. **Firebase Firestore REST API** — usar `gcloud auth print-access-token` para obtener token Bearer
6. **PowerShell en bash**: comandos complejos con variables `${}` requieren escribir a `.ps1` temp y ejecutar con `powershell -File`

---

## 9. Comandos Frecuentes

```bash
# Obtener token Firebase para REST API
ACCESS_TOKEN=$(gcloud auth print-access-token)

# Query Firestore (collectionGroup)
curl -s -X POST \
  "https://firestore.googleapis.com/v1/projects/geoagent-app/databases/(default)/documents:runQuery" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"structuredQuery": {"from": [{"collectionId": "stations", "allDescendants": true}], "limit": 5}}'

# Verificar URL producción
curl -s -o /dev/null -w "%{http_code}" https://web-taupe-three-27.vercel.app/

# Compilar y correr API Rust localmente
cd web/apps/api && FIREBASE_PROJECT_ID=geoagent-app cargo run

# Deploy Firebase rules/indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes

# Ver deployments Vercel
vercel ls 2>/dev/null | head -20

# GitHub Actions status (via API)
curl -s "https://api.github.com/repos/pabloasc/GeoAgent-App/actions/runs?per_page=5" | node -e "..."
```
