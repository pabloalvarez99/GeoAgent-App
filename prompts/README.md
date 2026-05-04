# Prompts — Trail auditable

Trail completo de cada prompt enviado a Claude Code en este repositorio. Permite rebobinar decisiones, auditar qué se pidió vs qué se hizo, reconstruir contexto entre sesiones/PCs/modelos.

> **Convención maestra:** ver `CLAUDE.md` §2.2 — esta carpeta implementa esa regla.

## Estructura

```
prompts/
├── README.md            ← este archivo
├── INDEX.md             ← índice cronológico maestro (un día por línea)
└── YYYY-MM-DD/          ← carpeta diaria
    ├── _index.md        ← tabla diaria de prompts
    └── HHMMSS-<slug>.md ← un archivo por prompt
```

## Naming

- **Carpeta diaria:** `YYYY-MM-DD/` (ISO date local).
- **Archivo de prompt:** `HHMMSS-<slug>.md`
  - `HHMMSS` = hora local 24h al momento de recibir el prompt.
  - `<slug>` = kebab-case 3-6 palabras, empieza por verbo o tema. Ejemplos: `refactor-erp-super`, `fix-fence-mobile-scroll`, `brainstorm-cockpit-3d`, `debug-firestore-rules`.

## Schema de archivo

````markdown
---
date: 2026-05-04T14:32:18-04:00
slug: <kebab-case>
topic: <una línea descriptiva>
session_id: <opcional>
files_touched:
  - path/relativo/al/repo
commits:
  - <sha-corto>
related_handoff: tasks/handoff-YYYY-MM-DD-HHMM.md   # opcional
related_spec: docs/superpowers/specs/<file>.md      # opcional
related_plan: docs/superpowers/plans/<file>.md      # opcional
status: completed | in_progress | abandoned
tags: [tag1, tag2]
secrets_redacted: false                             # true si hubo redacción
---

## Prompt

<verbatim user prompt — sin parafrasear, sin truncar>

## Resumen respuesta

<1-3 frases sobre qué se entregó>

## Outputs

- Archivos creados/modificados (lista)
- Commits (sha + mensaje)
- Decisiones tomadas
- Pendiente que dejó este prompt

## Follow-ups del mismo turno

- **HH:MM:SS · "ok"** → procedió con writing-plans skill.
- **HH:MM:SS · "si"** → aprobó arquitectura propuesta.
````

## Cuándo crear un archivo

- **Cada prompt no trivial** del usuario → un archivo nuevo.
- **Prompts triviales** (`ok`, `si`, `continúa`, saludos) → NO crear archivo. Anexar como `Follow-ups del mismo turno` en el archivo del prompt no-trivial inmediatamente anterior.
- **Prompts gigantes** (>5000 palabras, dumps de PDF) → preservar verbatim. Resumen denso pero prompt sin truncar.

## Cuándo escribir el archivo

1. **Inicio de respuesta** a prompt no trivial → crear archivo con frontmatter + prompt verbatim.
2. **Cierre del turno** → completar `Resumen respuesta`, `Outputs`, `status`, `commits`.
3. **Actualizar índices** (`_index.md` diario, `INDEX.md` maestro si primer prompt del día).

## Reglas estrictas

- **Verbatim del prompt** — no parafrasear, no editar.
- **Cero secretos** — credenciales se reemplazan con `[REDACTED]`. Marcar `secrets_redacted: true` en frontmatter.
- **Slugs deterministas** — empezar por verbo o tema (`fix-`, `add-`, `refactor-`, `brainstorm-`, `debug-`).
- **No archivos por respuestas internas** — sólo por prompts del usuario.
- **Commit junto a otros cambios** cuando posible. Mensaje: `chore(prompts): registrar prompt YYYY-MM-DD HH:MM <slug>`.

## Excepción: usuario pide no registrar

Si el usuario pide explícitamente "no registres este prompt":

- NO crear archivo.
- Anotar fila opaca en `_index.md` diario: `HH:MM:SS · — · (no registrado por solicitud)`.
- Respetar la solicitud sin pedir más detalles.
