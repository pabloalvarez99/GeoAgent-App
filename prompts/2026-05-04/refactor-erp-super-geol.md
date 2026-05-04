---
date: 2026-05-04
slug: refactor-erp-super-geol
topic: Refactor GeoAgent → ERP para Superintendente de Geología CMSG (Héctor Figueroa)
files_touched:
  - docs/superpowers/specs/2026-05-04-geology-super-cockpit-design.md
  - docs/superpowers/plans/2026-05-04-geology-super-cockpit.md
commits:
  - e98cc67
  - a72dbdd
related_spec: docs/superpowers/specs/2026-05-04-geology-super-cockpit-design.md
related_plan: docs/superpowers/plans/2026-05-04-geology-super-cockpit.md
status: completed
tags: [brainstorm, planning, mineria, super-geol, cmsg, erp, F0, F1]
secrets_redacted: false
---

## Prompt

> hacer que geoagent se un tipo ERP para el que es el superintedente de geologia de su compañia minera en la que trabaja San Geronimo, Coquimbo Chile [seguido de Análisis Estratégico extenso ~6000 palabras sobre Compañía Minera San Gerónimo: historia (1963 Talcuna → 1988 fundación CMSG → 1998 Tugal → 1999 Lambert → 2011 ampliación 120k tmpm + San Antonio → 2020 totalidad San Antonio → 2015 Agrocopper → 2021-22 Planta Recuperación Magnética); directorio (Patricio/Yerko/Juan Rendic, James Stefanic, Gerentes); División Talcuna (Mina 21 Mayo subt, San Antonio IOCG subt, Tugal rajo; Planta 120k t/mes; Área 200 molienda 110 tmsph, Wi=13 Talcuna / Wi=10 Tunal, P80=125µm, molinos 9'×12' + 7'×7', CCM EMOTRON F&L Ingeniería); División Lambert (Planta San Lorenzo lixiviación óxidos, CopperFull Feedgrade ISO 9001 INN+UKAS, Agrocopper, Ferticopper); Mineral Forecast IA targeting; Ceibo lixiviación sulfuros; SAP ERP + Prime Group MAM; sostenibilidad (PMGD 12 MW renovables, ISO 50001:2018 vigente may-2027 AENOR, Ley 21.305); RCA N°29/2017 Lambert, Cartas Pertinencia SEA, Rol F-037-2016 SMA; >800 trabajadores directos + 450 contratistas, modelo "cero campamento", Buk + SoySangerónimo; CPHS 7 comités, brigada 29 rescatistas Stop The Bleed Chancón, parada planta 8-10 abril 2026 cero incidentes. Conclusión: Sistema de Mando y Control Centralizado móvil para Héctor Figueroa Aguilera.] & 'c:\Users\Administrator\Documents\GitHub\GeoAgent-App\Resumen Ejecutivo.pdf' ultrathink refacotirza la app para que le sea una herramienta util para el y todos sus trabajores con los que debe administrar

## Follow-ups del mismo turno

- **"lo que creas que es mas potente, escalable, profesional y funtamental ultrathink"** → asistente recomendó F0 (multi-org/faena/yacimiento + RBAC 6 roles) + F1 (Resource Intelligence Hub: Reconciliación Mina-Planta + QA/QC Shewhart + Recursos JORC + Sondajes productividad). Razón: Reconciliación = KPI #1 super geol mundial; sin QA/QC reconc = garbage; RBAC habilita uso por equipo. Reusa stack actual (Next 15 + Firebase). 2-3 sem solo-dev.
- **"si"** → aprobó plan. Spec doc creada `docs/superpowers/specs/2026-05-04-geology-super-cockpit-design.md`, commit `e98cc67`.
- **"ok"** → invoké writing-plans skill. Plan 15 tasks TDD escrito en `docs/superpowers/plans/2026-05-04-geology-super-cockpit.md`, commit `a72dbdd`.

## Resumen respuesta

Re-leí prompt y detecté precisión clave: "Superintendente **de Geología**", no super general. Cambia scope completamente — alinea perfecto con stack GeoAgent existente (drillholes/3D/fence). Decomposed PDF en 6 fases (F0-F5), recomendé arrancar con F0+F1 como iron-triangle: foundation multi-tenant + Resource Intelligence Hub. Spec + plan de 15 tasks TDD entregados.

## Outputs

**Archivos creados:**
- `docs/superpowers/specs/2026-05-04-geology-super-cockpit-design.md` (269 líneas)
- `docs/superpowers/plans/2026-05-04-geology-super-cockpit.md` (~2365 líneas, 15 tasks TDD)

**Commits:**
- `e98cc67` — `docs(spec): geology superintendent cockpit F0+F1 design`
- `a72dbdd` — `docs(plan): F0+F1 implementation plan 15 tasks TDD-style`

**Decisiones tomadas:**
- Scope F0+F1 únicamente; F2-F5 deferred.
- Stack: Next 15 App Router + Firebase 11 + recharts + Vitest (sin nuevas integraciones externas SAP/MAM/Mineral Forecast en F0+F1).
- 6 roles: super_geol / geol_senior / geol_mina / qaqc / geotec / visitante.
- Data path: `orgs/{orgId}/faenas/{faenaId}/yacimientos/{yacId}/{resourceModel|reconciliacion|qaqc|sondajes_plan}` — migración desde `users/{uid}/...` legado.
- Reglas reconciliación: factor metal Cu objetivo [0.95, 1.05], warning [0.90, 0.95) ∪ (1.05, 1.10], critical fuera.
- QA/QC: HARD ±10% gruesos / ±20% pulpas, bias ±5% pass / ±10% warning / >10% fail, Shewhart ±2σ/±3σ.

**Pendiente:**
- Ejecución plan (15 tasks). Decisión inline vs subagent-driven pendiente.
- Ejecutar seed `scripts/seed-cmsg-org.ts` con UID real Héctor cuando se obtenga.
- Cargar datos demo reconc/qaqc últimos 6 meses Talcuna para demo.
- Configurar Firebase emulator para tests rules (deferred F1.5).
