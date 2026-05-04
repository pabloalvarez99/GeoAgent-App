---
date: 2026-05-04
slug: handoff-protocol
topic: Agregar protocolo de handoff entre sesiones a CLAUDE.md por ahorro de tokens
files_touched:
  - CLAUDE.md
commits:
  - b103dab
status: completed
tags: [docs, claude-md, tokens, handoff, workflow]
secrets_redacted: false
---

## Prompt

> quiero ahorrar tokens asi que cuando se junten demasiados tokens, crear prompt y seguir en nueva sesion, agrega eso a c:\Users\Administrator\Documents\GitHub\GeoAgent-App\CLAUDE.md

## Resumen respuesta

Agregué sección "💸 Ahorro de tokens — Handoff entre sesiones" al top de CLAUDE.md. Define triggers (>40 turnos, >60% contexto, >3 archivos grandes), pasos handoff (`tasks/handoff-YYYY-MM-DD-HHMM.md` con estado/files/commits/próximo paso/prompt copy-paste), y restricciones (no cortar a mitad de edit/test/commit).

## Outputs

**Archivos modificados:**
- `CLAUDE.md` — sección nueva `💸 Ahorro de tokens` insertada en top.

**Commits:**
- `b103dab` — `docs(claude): handoff protocol cuando contexto >70% para ahorrar tokens`

**Decisiones tomadas:**
- Threshold de corte: ~70% contexto (antes si sesión densa).
- Handoff vive en `tasks/handoff-YYYY-MM-DD-HHMM.md` (nuevo namespace).
- Prompt copy-paste estandarizado: "Lee `<plan>` + `<handoff>`, continúa desde Task N Step M".

**Pendiente:**
- Validar protocolo en próxima sesión grande.
