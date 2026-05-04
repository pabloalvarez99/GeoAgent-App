---
date: 2026-05-04
slug: prompt-log-system
topic: Diseñar sistema de registro auditable de prompts + profesionalizar CLAUDE.md
files_touched:
  - CLAUDE.md
  - prompts/README.md
  - prompts/INDEX.md
  - prompts/2026-05-04/_index.md
  - prompts/2026-05-04/refactor-erp-super-geol.md
  - prompts/2026-05-04/handoff-protocol.md
  - prompts/2026-05-04/prompt-log-system.md
commits: []
status: in_progress
tags: [docs, claude-md, prompts, audit-trail, workflow]
secrets_redacted: false
---

## Prompt

> agregar a c:\Users\Administrator\Documents\GitHub\GeoAgent-App\CLAUDE.md que todo nuevo prompt quede guardado en una carpeta junto a bitacora y cada prompt en un .md con su fecha y hora, o la mejor forma que creas que se podria organizar mientras se deja todo registrado, deja CLAUDE.md muy profesional ultrathink

## Resumen respuesta

Reescribí CLAUDE.md completo a versión profesional con tabla de contenidos numerada, secciones consistentes, y eliminé duplicaciones. Diseñé sistema de prompt log: carpeta `prompts/` raíz con estructura `YYYY-MM-DD/HHMMSS-<slug>.md`, índices diarios + maestro, schema con frontmatter YAML (date ISO, slug, topic, files_touched, commits, related_handoff/spec/plan, status, tags, secrets_redacted). Reglas de prompts triviales (anexar como follow-ups, no archivo nuevo) y verbatim obligatorio. Bootstrap: README, INDEX, carpeta hoy, 3 archivos retroactivos (este incluido).

## Outputs

**Archivos creados:**
- `prompts/README.md` — schema + convenciones completas.
- `prompts/INDEX.md` — índice cronológico maestro.
- `prompts/2026-05-04/_index.md` — índice diario.
- `prompts/2026-05-04/refactor-erp-super-geol.md` — prompt 1 retroactivo.
- `prompts/2026-05-04/handoff-protocol.md` — prompt 2 retroactivo.
- `prompts/2026-05-04/prompt-log-system.md` — este archivo.

**Archivos modificados:**
- `CLAUDE.md` — rewrite completo, profesional, con TOC + 9 secciones numeradas.

**Decisiones tomadas:**
- Granularidad: un archivo por prompt no trivial; triviales (`ok`, `si`) anexados como `Follow-ups del mismo turno`.
- Naming: `HHMMSS-<slug>.md` con slug kebab-case 3-6 palabras empezando por verbo o tema.
- Frontmatter YAML obligatorio con campos auditables.
- Verbatim del prompt sin truncar; prompts gigantes preservados.
- Secretos redactados con `[REDACTED]` + flag `secrets_redacted: true`.
- Carpeta `prompts/` queda al lado de `bitacora.md` en raíz.
- CLAUDE.md re-estructurado: 9 secciones numeradas con TOC, eliminó duplicación entre "ciclo de cierre", "bitácora" y "task management".

**Pendiente:**
- Commit final de CLAUDE.md + carpeta `prompts/`.
- Verificar en próxima sesión que el flujo se respete consistentemente.
