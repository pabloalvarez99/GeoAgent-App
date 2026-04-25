# Formateo — Manual de Operaciones de Documentación

> **Claude: lee este archivo AL INICIO de cada sesión, después del SessionStart hook.**
> Es el contrato que mantiene `bitacora.md`, `context.md` y `CLAUDE.md` vivos y veraces.
> Si lo violas, las próximas sesiones empiezan con información obsoleta, duplicada o contradictoria — el costo se paga en confusión durante meses.

---

## 🎯 Entrada Rápida (TL;DR)

Tres docs, tres roles distintos, **una fuente de verdad por hecho**:

| Doc | Pregunta que responde | Naturaleza | Cambia con |
|-----|------------------------|------------|------------|
| `bitacora.md` | "¿Qué pasó? ¿Qué hicimos? ¿Qué decidimos?" | Diario cronológico | Cada cambio funcional, deploy, decisión |
| `context.md` | "¿Cómo funciona este equipo? ¿Qué hay disponible ahora?" | Snapshot de estado actual | CLIs, URLs, secretos, fases, entorno |
| `CLAUDE.md` | "¿Cómo trabajo en este proyecto?" | Manual operativo | Convenciones, arquitectura, workflow, gotchas |

**Regla absoluta**: nunca pegar el mismo hecho en dos docs. Si dudas, link al canónico.

---

## 📍 Matriz Fact → Doc (cero duplicación)

Para cualquier hecho nuevo, encuentra aquí su doc canónico:

| Tipo de hecho | Doc canónico (sección) | Ejemplo |
|---------------|------------------------|---------|
| Feature implementado | `bitacora.md` § Últimos cambios | "Agregada exportación PDF con columna estratigráfica + fotos" |
| Bug arreglado (root cause útil) | `bitacora.md` § Últimos cambios + `CLAUDE.md` § Gotchas si recurrente | "Fix: `orderBy('updatedAt')` excluía docs Android" |
| Decisión arquitectónica | `bitacora.md` § Decisiones técnicas | "Electron carga URL Vercel, no app embedded" |
| Nueva URL/servicio cloud | `context.md` § Servicios Cloud | "Vercel: web-taupe-three-27.vercel.app activo" |
| CLI instalado o actualizado | `context.md` § CLIs Instalados | "firebase 15.15.0 (npm global)" |
| Plugin/MCP de Claude Code agregado | `context.md` § Plugins de Claude Code | "context7 — fetcha docs de librerías" |
| Variable de entorno nueva | `context.md` § Secretos pendientes o § Variables | "FIREBASE_TOKEN requerido en GitHub Actions" |
| Convención de código | `CLAUDE.md` § Conventions | "Todo UI text en español, touch targets 48dp+" |
| Patrón de arquitectura | `CLAUDE.md` § Architecture | "Repository = single source of truth, sync via WorkManager" |
| Workflow/regla de proceso | `CLAUDE.md` § Workflow Orchestration | "Plan mode obligatorio para tareas 3+ pasos" |
| Trampa conocida (gotcha) | `CLAUDE.md` § Gotchas + `obsidian-mind/brain/Gotchas.md` | "AdvancedMarker requiere `mapId`" |
| Estado actual de fase | `bitacora.md` § Estado (canónico) → espejo en `context.md` § Estado | "Fase 8 Electron: ⏳ pendiente" |
| Comando frecuente útil | `context.md` § Comandos Frecuentes | Snippet bash para Firestore REST API |
| Limitación del entorno | `context.md` § Limitaciones Conocidas | "Playwright crashea — no usar para verificación" |

**Reglas de no-duplicación**:
- "Estado actual" tiene espejo intencional en `bitacora.md` y `context.md`. **Fuente:** `bitacora.md`. **Espejo:** `context.md`. Actualiza primero la fuente, copia al espejo.
- Gotchas: `CLAUDE.md` lista los del proyecto; `obsidian-mind/brain/Gotchas.md` es catálogo cross-proyecto. Promueve al vault solo cuando el gotcha es transferible o ya picó dos veces.
- Si un hecho cabe en dos lugares, elige el que responde mejor a la pregunta del usuario futuro: "¿qué cambió hoy?" → bitácora; "¿qué hay disponible?" → context; "¿cómo trabajo?" → CLAUDE.

---

## ⚡ Disparadores (cuándo actualizar)

Cada acción del usuario o del sistema dispara updates específicos. **No esperes a "wrap-up"** — actualiza en el momento.

| Acción | Update inmediato obligatorio |
|--------|------------------------------|
| `git commit -m "feat: X"` | `bitacora.md` § Últimos cambios — entrada con fecha |
| `git commit -m "fix: X"` | `bitacora.md` § Últimos cambios + (si root cause útil) `CLAUDE.md` § Gotchas |
| Deploy Vercel/Firebase exitoso | `bitacora.md` § Últimos cambios + (si URL nueva) `context.md` § Servicios |
| `npm install -g X` | `context.md` § CLIs Instalados |
| Nueva env var en Vercel/GitHub Actions | `context.md` § Variables o § Secretos pendientes |
| Decisión arquitectónica tomada | `bitacora.md` § Decisiones técnicas + (si durable) `obsidian-mind/brain/Key Decisions.md` |
| Bug debugeado >30min con root cause no obvio | `CLAUDE.md` § Gotchas + `obsidian-mind/brain/Gotchas.md` |
| Fase completada | Cambia ⏳→✅ en `bitacora.md`, `context.md`, este `formateo.md` |
| Inicio de fase nueva | `bitacora.md` § Próximos pasos detalla + nuevo note en `obsidian-mind/work/active/` |
| Firestore schema/structure cambia | `CLAUDE.md` § Firebase + `bitacora.md` § Decisiones |
| Convención de UI/código nueva | `CLAUDE.md` § Conventions |
| Plugin Claude Code instalado/quitado | `context.md` § Plugins |

---

## 🛠 Ritual de Actualización (los 7 pasos)

Cuando un disparador se activa:

1. **Identifica doc canónico** usando matriz arriba
2. **Ubica sección correcta** (reusa headers existentes — no crees secciones nuevas sin justificar)
3. **Escribe entrada con fecha** (`YYYY-MM-DD`) y máximo 2 líneas concretas
4. **Verifica entradas previas redundantes** — si quedaron stale, bórralas o márcalas `~~obsoleto~~`
5. **Si el cambio cruza docs** (ej: feature toca convención), actualiza ambos en el mismo turno
6. **Si el aprendizaje es durable cross-proyecto**, promueve a `obsidian-mind/brain/`
7. **Verifica que el espejo `bitacora→context` quedó sincronizado**

**Nunca** dejes un update "para más tarde". Doc obsoleto miente más que doc inexistente.

---

## 📝 Plantillas de Entrada (copia y rellena)

### `bitacora.md` § Últimos cambios

```markdown
### 2026-04-25 — <Título corto de la sesión>
- ✅ <feature/fix concreto, no "varios cambios">
- ✅ <feature/fix concreto>
- 🐛 Root cause: <problema observable> → fix: <solución>
- 🚀 Deploy: <URL exitoso o nombre de release>
- 📝 Nota: <contexto adicional si necesario>
```

### `bitacora.md` § Decisiones técnicas

```markdown
**2026-04-25 — <Título de decisión>**
- **Contexto:** <problema o trade-off enfrentado>
- **Decisión:** <qué se eligió, concreto>
- **Razón:** <por qué, idealmente con alternativa rechazada>
- **Reversible si:** <condición que justificaría revisar>
```

### `bitacora.md` § Próximos pasos

```markdown
- [ ] **<Tarea>** — owner: <quien> — target: <fecha o "esta sesión">
  - Subtarea concreta 1
  - Subtarea concreta 2
```

### `context.md` § CLIs Instalados (fila nueva)

```markdown
| `nombre` | versión | npm global / `path completo` | uso breve |
```

### `CLAUDE.md` § Gotchas (entrada nueva)

```markdown
- **<síntoma observable>**: <causa raíz no obvia>. Fix: <solución concreta>. Detectado: 2026-04-25.
```

### `obsidian-mind/brain/Gotchas.md` (promoción cross-proyecto)

```markdown
## <Proyecto> — <Categoría>

- **<síntoma>**: <causa>. Fix: <solución>. Detectado: 2026-04-25.
```

---

## 🚨 Detección de Drift (auto-checks)

Al inicio de sesión y antes de wrap-up, ejecutar:

| Check | Comando o validación |
|-------|----------------------|
| Última entrada `bitacora.md` >7 días | `git log --since="7 days ago" --oneline` debe coincidir con cambios listados |
| Versiones CLI en `context.md` ≠ reales | `node -v && npm -v && firebase --version && vercel --version && gh --version` |
| URLs en `context.md` no responden | `curl -sI <url>` debe ser 200/301, no 404/timeout |
| `CLAUDE.md` referencia paths inexistentes | `ls` los paths mencionados (`app/`, `web/`, `data/local/entity/`) |
| TODO/FIXME en código no listado en próximos pasos | `grep -r "TODO\|FIXME" --include="*.kt" --include="*.tsx" --include="*.ts" \| head` |
| Estado de fases ≠ realidad del repo | Verifica `web/apps/desktop/` existe si Fase 8 marcada ✅ |
| Gotcha en `CLAUDE.md` ya resuelto en código | Grep el síntoma en código actual; si no aparece, marca `~~obsoleto~~` |

Si encuentras drift, **corrígelo antes de hacer cualquier otra cosa**. Drift no detectado se compone.

---

## 🚫 Anti-patrones (NO hagas esto)

- ❌ "Varios cambios menores" / "Algunas mejoras" — lista cada cambio concreto
- ❌ Entrada sin fecha — toda entrada de bitácora lleva `YYYY-MM-DD`
- ❌ Pegar el mismo hecho en `bitacora.md` y `context.md` sin pensar — usa la matriz
- ❌ Crear sección nueva por capricho — reusa headers existentes
- ❌ Borrar gotchas porque "ya no aplican" sin verificar — son archivo histórico; márcalos `~~obsoleto~~` o documenta la resolución
- ❌ Marcar fase ✅ sin verificación real (build verde + URL responde + commit pusheado)
- ❌ Listar TODO en `bitacora.md` § Próximos sin owner ni target
- ❌ Convertir `bitacora.md` en log automático de mensajes git — solo eventos significativos
- ❌ `context.md` como changelog — context refleja estado actual, no histórico
- ❌ `CLAUDE.md` como bitácora — es manual operativo, no diario
- ❌ Actualizar docs en commit final del día sin testing — los datos en docs deben ser verificables
- ❌ Usar emoji decorativo sin función — los ✅⏳🚧🐛🚀 sí tienen función (estado/tipo)

---

## ✅ Checklist de Cierre de Sesión

Antes de "wrap up" o cerrar sesión, ejecutar mentalmente:

- [ ] Cambios funcionales del día → `bitacora.md` § Últimos cambios (con fecha)
- [ ] Decisión nueva → `bitacora.md` § Decisiones + (si durable) `obsidian-mind/brain/Key Decisions.md`
- [ ] Gotcha nuevo descubierto → `CLAUDE.md` § Gotchas + `obsidian-mind/brain/Gotchas.md`
- [ ] CLI/herramienta instalada → `context.md` § CLIs
- [ ] Estado de fase cambió → `bitacora.md`, `context.md`, este `formateo.md` reflejan lo mismo
- [ ] `bitacora.md` § Próximos pasos refleja qué viene
- [ ] No hay entradas duplicadas creadas hoy
- [ ] Drift detection corrió sin hallazgos
- [ ] (Opcional) Commit de docs separado: `git commit -m "docs: actualiza bitacora/context/claude"`

---

## 🔗 Mapa de Referencias Cruzadas

```
formateo.md (este archivo)
  ├─→ describe → bitacora.md, context.md, CLAUDE.md
  └─→ apunta a → obsidian-mind/brain/, obsidian-mind/work/, obsidian-mind/reference/

bitacora.md (DIARIO — cronológico)
  ├─→ refleja estado en → context.md § Estado actual
  ├─→ decisiones promueven a → obsidian-mind/brain/Key Decisions.md
  └─→ features activas → obsidian-mind/work/active/

context.md (SNAPSHOT — estado presente)
  ├─→ deriva CLIs/env de → realidad del sistema (drift check)
  └─→ apunta a → obsidian-mind/reference/GeoAgent Architecture.md

CLAUDE.md (MANUAL — cómo trabajar)
  ├─→ convenciones aplican a → todo el código del repo
  └─→ gotchas espejan a → obsidian-mind/brain/Gotchas.md
```

---

## 📦 Estado Vigente del Proyecto (snapshot 2026-04-25)

> Si discrepa con `bitacora.md`, **`bitacora.md` gana** y este snapshot debe corregirse.

| Componente | Estado |
|---|---|
| Android app (Kotlin + Jetpack Compose) | ✅ Completo — NO tocar `app/` |
| Web platform (Next.js 16 en Vercel) | ✅ Live — `https://web-taupe-three-27.vercel.app` |
| Sync Android ↔ Web (Firebase Firestore) | ✅ Funcionando |
| Electron Desktop (.exe en `web/apps/desktop/`) | ✅ |
| CI/CD (APK + Vercel + Electron + Firebase App Distribution) | ✅ Activo |
| Firebase Analytics + Crashlytics + Performance + FCM + App Check | ✅ Android + Web |
| Reportes PDF profesionales (TOC, fotos, columna estratigráfica) | ✅ |
| Reportes Excel (estilos, autofilter, hoja Resumen) | ✅ |
| **Fase 9: Analytics + Settings + Import CSV/Excel** | ⏳ Pendiente diseño |

**Pendientes de configuración** (no son código, son setup):
- GitHub Secrets: `FIREBASE_ANDROID_APP_ID`, `FIREBASE_TOKEN` (correr `firebase login:ci`)
- Vercel env: `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`

---

## 🧠 Vault Cross-Reference

`C:\Users\Administrator\Documents\obsidian-mind\` — segundo cerebro persistente cross-proyecto (git-tracked, Obsidian-browsable).

| Qué se promueve al vault | Cuándo |
|--------------------------|--------|
| Decisión arquitectónica → `brain/Key Decisions.md` | Decisión irreversible o de alto impacto |
| Gotcha recurrente → `brain/Gotchas.md` | Bug que ya pasó 2+ veces o transferible a otro proyecto |
| Patrón de implementación → `brain/Patterns.md` | Patrón que se repite cross-feature o cross-proyecto |
| Feature activa → `work/active/<Feature>.md` | Inicio de fase nueva (con frontmatter `status: active`) |
| Feature completada → `work/archive/YYYY/<Feature>.md` | Fin de fase, `git mv` desde `active/` |
| Cambio de arquitectura → `reference/GeoAgent Architecture.md` | Cambio de stack o estructura significativo |
| Cambio de objetivos/prioridades → `brain/North Star.md` | Pivote o nueva fase de producto |

Comandos vault desde `obsidian-mind/`:
- `/om-standup` — kickoff con contexto completo (lee North Star + active + recent)
- `/om-dump` — captura rápida de ideas/decisiones (auto-routing)
- `/om-wrap-up` — cierre de sesión: archiva, actualiza índices, captura learnings

---

## 🧭 Bootstrap (sesión nueva, máquina nueva)

Si llegas con cero contexto:

```bash
# 1. Lee este archivo primero
cat formateo.md

# 2. Lee bitácora (estado + cronología)
cat bitacora.md | head -200

# 3. Lee context (entorno + setup)
cat context.md | head -200

# 4. Lee CLAUDE.md (convenciones + gotchas)
cat CLAUDE.md

# 5. Verifica drift
git log --since="14 days ago" --oneline
node -v && npm -v && firebase --version

# 6. (Opcional) Carga vault context
cd /c/Users/Administrator/Documents/obsidian-mind && /om-standup
```
