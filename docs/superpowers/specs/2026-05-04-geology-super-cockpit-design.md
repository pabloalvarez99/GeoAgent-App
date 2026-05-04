# Geology Superintendent Cockpit — Design Spec

**Date:** 2026-05-04
**Author:** Pablo + Claude
**Target user:** Héctor Figueroa Aguilera, Superintendente de Geología, Compañía Minera San Gerónimo (CMSG)
**Status:** Approved (brainstorm)
**Phase:** F0 (Foundation) + F1 (Resource Intelligence Hub)

---

## 1. Context

Compañía Minera San Gerónimo opera 4 yacimientos activos en Región de Coquimbo:
- **Talcuna** (faena): Mina 21 de Mayo (subt), Mina San Antonio (subt, IOCG), Mina Tugal (rajo)
- **Lambert** (faena): Planta San Lorenzo + compra mineral pequeños mineros (óxidos Cu)

Planta Concentradora Talcuna procesa **120.000 t/mes**. Concentrado Cu+Au+Ag = 70% facturación corp. División Lambert produce CopperFull Feedgrade, Agrocopper, Ferticopper. Lab Lambert ISO 9001:2015 (INN + UKAS). Certificación ISO 50001:2018 vigente hasta may-2027.

GeoAgent actual = field tool single-user para sondajes/stations/lithology/structural/samples + 3D viewer + fence + exports. Stack: Next 15 App Router, React 19, Tailwind, Firebase (Firestore + Auth + Storage), Vercel deploy. Electron wrapper opcional. Android pausado.

Gap = capa supervisor team-grade. Héctor administra equipo geólogos en 4 yacimientos + QA/QC lab Lambert + reporta a Gerencia Exploraciones (José Díaz Ramos) y Gerencia Minas (Remigio Núñez). Necesita cockpit móvil con KPIs decisión-crítica desde terreno (galerías subt, planta, sala eléctrica, oficina).

## 2. Goals

1. **Reconciliación Mina-Planta confiable** — factor mensual modelo predicho vs ley alimentación planta real, tendencia, alerta cuando factor sale rango 0.95-1.05
2. **QA/QC integridad data** — Shewhart control charts duplicados/blancos/estándares certificados, bias detection, fail rate alertas
3. **Recursos & Reservas vista única** — JORC categories (Inferred/Indicated/Measured + Probable/Proven) tonelaje × ley × NSR por yacimiento, depleción mensual
4. **Sondajes productividad** — m/turno por máquina diamantina, costo $/m, plan vs real, días retraso
5. **Multi-org + RBAC** — Org → Faena → Yacimiento taxonomy, 6 roles, permission matrix
6. **Mobile-first cockpit** — responsive tiles, push notifications cuando KPI cruza umbral

## 3. Non-Goals (F0+F1)

- SAP ERP integration
- Prime Group MAM integration
- Mineral Forecast IA targeting visor
- SCADA/Modbus telemetry molinos/variadores EMOTRON
- Buk/SoySangerónimo RRHH dashboards
- Compra mineral Lambert workflow (módulo F4)
- Sernageomin compliance tracker (F5)
- Geotecnia avanzada (rating Q/RMR/MRMR)
- Block model 3D editor (solo viewer + secciones por ahora)

Razón: F0+F1 entregable 2-3 sem solo-dev. F2-F5 dependen de validación Héctor + APIs externas.

## 4. Architecture

### 4.1 Data model (Firestore)

```
orgs/{orgId}
  ├─ profile { nombre, ruc, plan }
  ├─ members/{uid}
  │     { role: super_geol|geol_senior|geol_mina|qaqc|geotec|visitante,
  │       faenas: [faenaId],
  │       yacimientos: [yacId],
  │       activo: bool }
  ├─ faenas/{faenaId}
  │     { nombre: "Talcuna"|"Lambert", region: "Coquimbo" }
  │     └─ yacimientos/{yacId}
  │           { nombre, tipo: "subt"|"rajo"|"compra",
  │             tipo_yac: "IOCG"|"vetiforme"|"oxido_Cu"|...,
  │             coords: {lat, lng}, activo: bool }
  │           ├─ resourceModel/{periodo}     # YYYY-MM
  │           │     { categoria: inferred|indicated|measured|probable|proven,
  │           │       tonelaje, ley_cu, ley_au, ley_ag, NSR_usd_t,
  │           │       autor_uid, aprobado_por, fecha_aprobacion }
  │           ├─ reconciliacion/{mes}         # YYYY-MM
  │           │     { plan_t, plan_ley_cu, plan_ley_au,
  │           │       real_t_planta, real_ley_cu_planta, real_ley_au_planta,
  │           │       factor_t, factor_ley_cu, factor_ley_au,
  │           │       dilucion_pct, recuperacion_minera_pct,
  │           │       firmado_por, fecha_firma }
  │           ├─ qaqc/{batchId}
  │           │     { tipo: dup_grueso|dup_pulpa|blank|std,
  │           │       sample_id_orig, sample_id_check,
  │           │       valor_orig, valor_check, std_certificado_id,
  │           │       valor_esperado, lab: "Lambert"|"ALS"|"SGS",
  │           │       fecha, status: pass|warning|fail, flagged_by }
  │           ├─ sondajes_plan/{plan_id}
  │           │     { fecha_ini, fecha_fin_plan, metros_plan,
  │           │       maquina, contratista, costo_m_usd }
  │           └─ (drillholes/stations/etc — existentes con yacId fk)
  └─ alertas/{alertId}
        { tipo, severidad, recurso, mensaje, leida_por: [uid], creada }
```

### 4.2 RBAC matrix

| Acción | super_geol | geol_senior | geol_mina | qaqc | geotec | visitante |
|---|---|---|---|---|---|---|
| Read all yacs | ✓ | yacs asignados | yacs asignados | ✓ | ✓ | dashboards públicos |
| Edit drillhole/mapeo | ✓ | ✓ | yacs asignados | — | — | — |
| Approve sondaje | ✓ | ✓ | — | — | — | — |
| Edit resourceModel | ✓ | ✓ | — | — | — | — |
| Approve resourceModel | ✓ | — | — | — | — | — |
| Sign reconciliación | ✓ | — | — | — | — | — |
| Edit QA/QC batch | ✓ | — | — | ✓ | — | — |
| Edit geotec ratings | ✓ | — | — | — | ✓ | — |
| Manage org/members | ✓ | — | — | — | — | — |

Implementación: Firestore Security Rules + client-side guards + middleware Next.

### 4.3 Routing nueva

```
/super                       Cockpit (tiles KPI)
/super/reconc                Reconciliación deep + tendencia
/super/reconc/[yacId]/[mes]  Detalle mes
/super/qaqc                  QA/QC dashboards
/super/qaqc/[batchId]        Batch detalle
/super/recursos              R&R por yacimiento (JORC pyramid)
/super/recursos/[yacId]      Yacimiento deep
/super/sondajes              Productividad diamantinas
/admin/org                   Org settings
/admin/org/members           Members + roles
/admin/org/faenas            Faenas + yacimientos taxonomy
```

Existentes (`/projects`, `/drillholes`, etc) se mantienen pero con scope yac.

### 4.4 Componentes nuevos clave

- `lib/auth/rbac.ts` — `can(user, action, resource)` matrix + hook `useRole()`
- `lib/data/reconc.ts` — calcular factor, tendencia, detección outliers
- `lib/data/qaqc.ts` — Shewhart bands ±2σ/±3σ, bias %, Thompson-Howarth duplicates
- `lib/notifications/push.ts` — Firebase Messaging triggers
- `components/super/cockpit-tile.tsx` — tile genérica (titulo, KPI, sparkline, drill-down)
- `components/reconc/factor-chart.tsx` — line chart factor temporal con bandas
- `components/reconc/cumulative-curve.tsx` — área plan vs real acumulado
- `components/qaqc/shewhart-chart.tsx` — control chart con ±2σ/±3σ, puntos colored
- `components/qaqc/duplicates-scatter.tsx` — orig vs check, R², línea 1:1, HARD ±10%
- `components/qaqc/standards-bias.tsx` — std certificado vs medido, bias %
- `components/resources/jorc-pyramid.tsx` — pirámide categorías + tonelaje × ley
- `components/sondajes/productivity.tsx` — bar chart m/turno por máquina + costo
- `components/admin/role-matrix.tsx` — UI editar roles members
- `components/admin/yacimiento-form.tsx` — crear/editar yac

### 4.5 Mobile-first

- Cockpit `/super` = grid responsive (1 col móvil, 2 tablet, 3 desktop)
- Tiles colapsables/reordenables (drag-drop, persist Firestore por user)
- Tap tile → drill-down full screen
- Push notif Firebase Messaging cuando:
  - Factor reconc fuera [0.90, 1.10]
  - QAQC fail rate >10% en últimos 50 batches
  - Sondaje retrasado >5 días vs plan
  - Nuevo resourceModel pendiente approval (solo super_geol)

### 4.6 Flujo aprobación resourceModel

```
geol_senior crea draft → status: draft
  ↓ submit
status: pending_approval → push notif super_geol
  ↓ approve | reject (con razón)
status: approved | rejected → push notif autor
```

Spec asume publicación incremental por yac (no bloque global).

## 5. Cálculos clave

### 5.1 Reconciliación

```
factor_t       = real_t_planta / plan_t
factor_ley_cu  = real_ley_cu_planta / plan_ley_cu
factor_metal   = factor_t × factor_ley_cu

Target: factor_metal ∈ [0.95, 1.05]
Warning: ∈ [0.90, 0.95) ∪ (1.05, 1.10]
Critical: <0.90 o >1.10
```

Plan source: resourceModel del periodo (categoría measured + indicated). Real source: producción planta (input manual mensual por super_geol — F0+F1 no integra SCADA).

### 5.2 QA/QC

**Duplicados** (Thompson-Howarth simplified):
```
HARD = |orig - check| / ((orig + check)/2)
HARD > 10% → fail (gruesos), > 20% → fail (pulpas)
Plot scatter orig vs check, R², regresión
```

**Estándares certificados**:
```
bias = (medido - esperado) / esperado × 100%
±2σ warning, ±3σ fail
Shewhart con n últimas mediciones
```

**Blancos**:
```
valor > 5× límite detección → contaminación, fail
```

### 5.3 Sondajes productividad

```
m_turno_avg     = Σ metros_avanzados / Σ turnos_efectivos
costo_m_real    = Σ costo_facturado / Σ metros_avanzados
desviacion_plan = (metros_real - metros_plan) / metros_plan × 100%
```

## 6. Error handling

- Firestore offline persistence ON (existente) → cockpit lee cache si sin red
- Cálculos client-side defensivos: divisor 0 → mostrar "—", no NaN
- Approval optimistic UI con rollback si Firestore fail
- Push notif failure silenciosa (logged), no bloquea operación
- RBAC denial → 403 page con explicación rol requerido + contacto super_geol

## 7. Testing

- Unit (Vitest):
  - `lib/data/reconc.ts`: factor cálculo, edge cases (0, negative, missing)
  - `lib/data/qaqc.ts`: HARD, bias, Shewhart bands
  - `lib/auth/rbac.ts`: matrix completa, todos roles × acciones
- Integration:
  - Firestore rules emulator: cada rol vs cada colección
  - Approval flow happy + rollback
- E2E (Playwright, smoke):
  - Login super_geol → cockpit → click tile reconc → ver chart
  - Login qaqc → flag batch → super_geol recibe notif

## 8. Migration

Existing data:
- Drillholes/stations/etc: añadir campo `faenaId`, `yacId` con default org single-tenant para usuarios actuales (Pablo dev)
- Crear org seed CMSG con faenas Talcuna+Lambert + yacs 21May/SanAnt/Tugal/Lambert (compra)
- Migration script: `scripts/migrate-to-org-rbac.ts`

## 9. Deploy

- Firebase rules: `firestore.rules` extendido con RBAC checks
- Firestore indexes: composite (orgId+yacId+fecha desc) para resourceModel/reconciliacion/qaqc
- Vercel: sin cambios infra (sigue Next 15 App Router)
- Env vars nuevas: `NEXT_PUBLIC_FIREBASE_VAPID_KEY` para FCM web push

## 10. Riesgos

| Riesgo | Mitigación |
|---|---|
| Firestore rules complejas → bug seguridad | Emulator tests cubren matriz completa, pen-test manual |
| Reconc input manual = error humano | Doble validación (geol_senior vs super_geol firma), audit log |
| Push notif spam | Debounce 1h por tipo+recurso, settings per user |
| Multi-org migration breaks single-user | Default org seed, feature flag `MULTI_ORG_ENABLED` |
| Performance dashboards con muchos yacs | Aggregations precomputed (Firestore Functions trigger on write) — F1.5 si necesario |

## 11. Out of scope explicitly deferred

- F2 Workflow approvals avanzado (parte diaria geól mina)
- F3 Mineral Forecast IA visor heatmaps
- F4 Lambert compra mineral pequeños mineros
- F5 Sernageomin compliance geol tracker
- SCADA/MAM/SAP integraciones
- Block model 3D editing (solo viewer existente)

## 12. Success criteria

Demo a Héctor en 3 sem mostrando:
1. Login como super_geol, ver cockpit con tiles reconc + qaqc + recursos + sondajes
2. Drill-down a reconc Talcuna últimos 6 meses, identificar mes outlier
3. Drill-down a QAQC, ver Shewhart de estándar SRM-Cu lab Lambert con bias visible
4. Crear nuevo geol_mina, asignar yacimiento San Antonio, login en otro browser → ve solo San Antonio
5. Geol_senior crea resourceModel draft → submit → super_geol recibe notif móvil → aprueba → autor recibe confirmación
6. Push notif demo: factor reconc inyectado <0.90 → notif llega a teléfono Héctor
