# GeoAgent-App — Contexto de Herramientas y Entorno

> **Para el agente que retome esta sesión:** Este archivo documenta todo lo disponible en este equipo para trabajar con Claude Code. Actualizar cuando se instale algo nuevo.
> Última actualización: 2026-04-25 (máquina Administrator)

## Estado Actual del Proyecto (2026-04-25)

**Qué funciona — TODO COMPLETADO:**
- ✅ App Android completa (NO tocar `app/`)
- ✅ Web platform completa en Vercel: `https://web-taupe-three-27.vercel.app`
  - Auth (Firebase), Projects, Stations, Drillholes, Map, Photos, Export (PDF/Excel/GeoJSON/CSV)
- ✅ Sincronización Android ↔ Web funcionando
- ✅ Electron Desktop (.exe en `web/apps/desktop/`)
- ✅ CI/CD completo: APK + Vercel + Electron + Firebase App Distribution
- ✅ Firebase Analytics, Crashlytics, Performance, FCM, App Check (Android + Web)
- ✅ Reportes PDF profesionales: portada, TOC, estaciones con fotos, sondajes con columna estratigráfica + fotos
- ✅ Reportes Excel profesionales: estilos coloreados, códigos legibles, hoja Resumen, autofilter

**Secretos GitHub pendientes de agregar (Settings > Secrets & variables > Actions):**
- `FIREBASE_ANDROID_APP_ID` = `1:609077404870:android:6d1ec2fd44f6728e86e3c7`
- `FIREBASE_TOKEN` = correr `firebase login:ci` y copiar token

**Variables Vercel pendientes:**
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — Google Search Console

**Gotchas activos más importantes:**
1. **NO usar pnpm** — el monorepo web/ usa npm workspaces. pnpm + Node 22 + Vercel = crash fatal (ERR_INVALID_THIS)
2. **NO usar `orderBy('updatedAt')` en Firestore** — excluye silenciosamente docs de Android
3. **AdvancedMarker requiere `mapId`** — sin él, los marcadores del mapa no renderizan

**Próximos pasos sugeridos:**
1. Agregar secretos GitHub faltantes (ver arriba)
2. Verificar Google Search Console una vez agregada la env var

---

## 1. Sistema Operativo y Entorno

- **OS:** Windows 11 Pro (Build 26100)
- **Shell en Claude Code:** bash (Git Bash / MinGW64) — usar sintaxis Unix, **no** PowerShell/cmd
- **Usuario Windows:** Administrator
- **Directorio del repo:** `C:\Users\Administrator\Documents\GitHub\GeoAgent-App`

---

## 2. CLIs Instalados

| CLI | Versión | Ubicación | Uso |
|-----|---------|-----------|-----|
| `firebase` | 15.15.0 | npm global | Deploy reglas, índices Firestore, hosting — **⚠️ necesita `firebase login`** |
| `vercel` | 52.0.0 | npm global | Deploy web — autenticado como `timadapa-6315` |
| `node` | v24.15.0 | `C:\Program Files\nodejs\` | Runtime JS |
| `npm` | 11.12.1 | `C:\Program Files\nodejs\` | Package manager |
| `git` | 2.54.0 | MinGW64 | Control de versiones |
| `gh` | 2.91.0 | `C:\Program Files\GitHub CLI\` — agregar al PATH: `export PATH="$PATH:/c/Program Files/GitHub CLI"` (ya en `~/.bashrc`) | GitHub CLI — **⚠️ necesita `gh auth login`** |
| `curl` | MinGW64 | MinGW64 | HTTP requests desde bash |

### CLIs NO en PATH de bash por defecto (agregar manualmente)
- `gh` — PATH ya agregado en `~/.bashrc`: `export PATH="$PATH:/c/Program Files/GitHub CLI"`. **Pendiente: `gh auth login`**

### Cuentas autenticadas
- **vercel:** `timadapa-6315` ✅ (autenticado 2026-04-25)
- **firebase:** ⚠️ NO autenticado — correr `firebase login`
- **gh:** ⚠️ NO autenticado — correr `gh auth login`

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
