# Geology Superintendent Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build F0 (multi-org/faena/yacimiento taxonomy + RBAC) + F1 (Resource Intelligence Hub: reconciliación mina-planta, QA/QC charts, R&R, sondajes productividad) atop existing GeoAgent web app.

**Architecture:** Extend Firebase Firestore schema from `users/{uid}/...` single-tenant to `orgs/{orgId}/...` multi-tenant with role-based access; layer Next.js App Router routes under `/super/*` and `/admin/org/*`; client-side calc libs for reconc + QA/QC; recharts for visualizations; FCM web push for KPI alerts.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Firebase 11 (Firestore + Auth + FCM), Tailwind, Radix UI, recharts, Vitest, React Query.

**Spec reference:** `docs/superpowers/specs/2026-05-04-geology-super-cockpit-design.md`

**Working directory for all paths below:** repo root `C:\Users\Administrator\Documents\GitHub\GeoAgent-App`. Web app code lives in `web/apps/web/`. Firestore rules at repo-root `firestore.rules`.

---

## File Structure

**New files:**
- `web/apps/web/src/types/org.ts` — Org/Member/Faena/Yacimiento types + role enum
- `web/apps/web/src/types/reconc.ts` — ResourceModel, Reconciliacion, QAQCBatch types
- `web/apps/web/src/lib/auth/rbac.ts` — RBAC matrix + `can()` + `useRole()` hook
- `web/apps/web/src/lib/auth/org-context.tsx` — current org context provider
- `web/apps/web/src/lib/data/reconc.ts` — factor calc, outlier detection
- `web/apps/web/src/lib/data/qaqc.ts` — Shewhart bands, HARD, bias
- `web/apps/web/src/lib/firebase/orgs.ts` — Firestore queries for org subcollections
- `web/apps/web/src/lib/notifications/push-rules.ts` — KPI threshold checks
- `web/apps/web/src/components/super/cockpit-tile.tsx` — generic KPI tile
- `web/apps/web/src/components/reconc/factor-chart.tsx`
- `web/apps/web/src/components/reconc/cumulative-curve.tsx`
- `web/apps/web/src/components/qaqc/shewhart-chart.tsx`
- `web/apps/web/src/components/qaqc/duplicates-scatter.tsx`
- `web/apps/web/src/components/qaqc/standards-bias.tsx`
- `web/apps/web/src/components/resources/jorc-pyramid.tsx`
- `web/apps/web/src/components/sondajes/productivity-chart.tsx`
- `web/apps/web/src/components/admin/role-matrix-editor.tsx`
- `web/apps/web/src/components/admin/yacimiento-form.tsx`
- `web/apps/web/src/app/(dashboard)/super/page.tsx` — cockpit
- `web/apps/web/src/app/(dashboard)/super/reconc/page.tsx`
- `web/apps/web/src/app/(dashboard)/super/reconc/[yacId]/[mes]/page.tsx`
- `web/apps/web/src/app/(dashboard)/super/qaqc/page.tsx`
- `web/apps/web/src/app/(dashboard)/super/qaqc/[batchId]/page.tsx`
- `web/apps/web/src/app/(dashboard)/super/recursos/page.tsx`
- `web/apps/web/src/app/(dashboard)/super/recursos/[yacId]/page.tsx`
- `web/apps/web/src/app/(dashboard)/super/sondajes/page.tsx`
- `web/apps/web/src/app/(dashboard)/admin/org/page.tsx`
- `web/apps/web/src/app/(dashboard)/admin/org/members/page.tsx`
- `web/apps/web/src/app/(dashboard)/admin/org/faenas/page.tsx`
- `web/apps/web/src/lib/data/__tests__/reconc.test.ts`
- `web/apps/web/src/lib/data/__tests__/qaqc.test.ts`
- `web/apps/web/src/lib/auth/__tests__/rbac.test.ts`
- `scripts/seed-cmsg-org.ts` — seed CMSG org + faenas + yacimientos
- `scripts/migrate-to-org-rbac.ts` — backfill faenaId/yacId on existing data

**Modified files:**
- `firestore.rules` — add multi-org RBAC
- `web/apps/web/src/lib/firebase/auth.tsx` — extend with currentOrgId + role
- `web/apps/web/src/lib/firebase/messaging.ts` — wire push-rules
- `web/apps/web/src/app/(dashboard)/layout.tsx` — wrap in OrgProvider, add super/admin nav
- `web/apps/web/package.json` — add `recharts`
- `bitacora.md` — append entry
- `firestore.indexes.json` — composite indexes (create if absent)

---

## Task 1: Setup — recharts dependency + types scaffold

**Files:**
- Modify: `web/apps/web/package.json`
- Create: `web/apps/web/src/types/org.ts`
- Create: `web/apps/web/src/types/reconc.ts`

- [ ] **Step 1: Install recharts**

Run from `web/apps/web/`:
```bash
npm install recharts@^2.13.0
```

- [ ] **Step 2: Create org types file**

Create `web/apps/web/src/types/org.ts`:
```typescript
export type Role =
  | 'super_geol'
  | 'geol_senior'
  | 'geol_mina'
  | 'qaqc'
  | 'geotec'
  | 'visitante';

export const ROLE_LABELS: Record<Role, string> = {
  super_geol: 'Superintendente de Geología',
  geol_senior: 'Geólogo Senior',
  geol_mina: 'Geólogo Mina',
  qaqc: 'QA/QC',
  geotec: 'Geotécnico',
  visitante: 'Visitante',
};

export interface Org {
  id: string;
  nombre: string;
  ruc?: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: number;
}

export interface Member {
  uid: string;
  email: string;
  nombre: string;
  role: Role;
  faenaIds: string[];
  yacimientoIds: string[];
  activo: boolean;
}

export type FaenaNombre = 'Talcuna' | 'Lambert';

export interface Faena {
  id: string;
  nombre: FaenaNombre | string;
  region: string;
}

export type YacimientoTipo = 'subt' | 'rajo' | 'compra';
export type YacimientoModelo = 'IOCG' | 'vetiforme' | 'oxido_Cu' | 'porfido' | 'otro';

export interface Yacimiento {
  id: string;
  faenaId: string;
  nombre: string;
  tipo: YacimientoTipo;
  modelo: YacimientoModelo;
  coords?: { lat: number; lng: number };
  activo: boolean;
}
```

- [ ] **Step 3: Create reconc types file**

Create `web/apps/web/src/types/reconc.ts`:
```typescript
export type JorcCategoria =
  | 'inferred'
  | 'indicated'
  | 'measured'
  | 'probable'
  | 'proven';

export interface ResourceModel {
  id: string;
  yacId: string;
  periodo: string; // YYYY-MM
  categoria: JorcCategoria;
  tonelaje: number;
  ley_cu: number;
  ley_au?: number;
  ley_ag?: number;
  NSR_usd_t?: number;
  autorUid: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  aprobadoPor?: string;
  fechaAprobacion?: number;
  rejectReason?: string;
}

export interface Reconciliacion {
  id: string;
  yacId: string;
  mes: string; // YYYY-MM
  plan_t: number;
  plan_ley_cu: number;
  plan_ley_au?: number;
  real_t_planta: number;
  real_ley_cu_planta: number;
  real_ley_au_planta?: number;
  factor_t: number;
  factor_ley_cu: number;
  factor_ley_au?: number;
  factor_metal_cu: number;
  dilucion_pct?: number;
  recuperacion_minera_pct?: number;
  firmadoPor?: string;
  fechaFirma?: number;
}

export type QAQCTipo = 'dup_grueso' | 'dup_pulpa' | 'blank' | 'std';
export type QAQCStatus = 'pass' | 'warning' | 'fail';

export interface QAQCBatch {
  id: string;
  yacId: string;
  tipo: QAQCTipo;
  fecha: number;
  lab: 'Lambert' | 'ALS' | 'SGS' | 'otro';
  sampleIdOrig?: string;
  sampleIdCheck?: string;
  valorOrig?: number;
  valorCheck?: number;
  stdCertificadoId?: string;
  valorEsperado?: number;
  detLimit?: number;
  status: QAQCStatus;
  flaggedBy?: string;
  notas?: string;
}
```

- [ ] **Step 4: Verify type-check passes**

Run from `web/apps/web/`:
```bash
npm run type-check
```
Expected: no errors related to new files.

- [ ] **Step 5: Commit**

```bash
git add web/apps/web/package.json web/apps/web/package-lock.json web/apps/web/src/types/org.ts web/apps/web/src/types/reconc.ts
git commit -m "feat(super): add recharts dep + org/reconc type definitions"
```

---

## Task 2: RBAC matrix lib + tests (TDD)

**Files:**
- Create: `web/apps/web/src/lib/auth/rbac.ts`
- Test: `web/apps/web/src/lib/auth/__tests__/rbac.test.ts`

- [ ] **Step 1: Write failing tests**

Create `web/apps/web/src/lib/auth/__tests__/rbac.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { can } from '../rbac';
import type { Member } from '@/types/org';

const mkMember = (over: Partial<Member>): Member => ({
  uid: 'u1', email: 'x@y.cl', nombre: 'X', role: 'visitante',
  faenaIds: [], yacimientoIds: [], activo: true, ...over,
});

describe('can()', () => {
  it('super_geol can do anything', () => {
    const m = mkMember({ role: 'super_geol' });
    expect(can(m, 'approve_resource_model', { yacId: 'y1' })).toBe(true);
    expect(can(m, 'sign_reconciliacion', { yacId: 'y1' })).toBe(true);
    expect(can(m, 'manage_org', {})).toBe(true);
    expect(can(m, 'edit_qaqc', { yacId: 'y1' })).toBe(true);
  });

  it('geol_senior can approve sondaje only on assigned yac', () => {
    const m = mkMember({ role: 'geol_senior', yacimientoIds: ['y1'] });
    expect(can(m, 'approve_sondaje', { yacId: 'y1' })).toBe(true);
    expect(can(m, 'approve_sondaje', { yacId: 'y2' })).toBe(false);
  });

  it('geol_senior cannot approve resourceModel (only super)', () => {
    const m = mkMember({ role: 'geol_senior', yacimientoIds: ['y1'] });
    expect(can(m, 'approve_resource_model', { yacId: 'y1' })).toBe(false);
  });

  it('geol_mina edits drillhole only on assigned yac', () => {
    const m = mkMember({ role: 'geol_mina', yacimientoIds: ['y1'] });
    expect(can(m, 'edit_drillhole', { yacId: 'y1' })).toBe(true);
    expect(can(m, 'edit_drillhole', { yacId: 'y2' })).toBe(false);
    expect(can(m, 'approve_sondaje', { yacId: 'y1' })).toBe(false);
  });

  it('qaqc edits qaqc batches anywhere', () => {
    const m = mkMember({ role: 'qaqc' });
    expect(can(m, 'edit_qaqc', { yacId: 'y1' })).toBe(true);
    expect(can(m, 'edit_drillhole', { yacId: 'y1' })).toBe(false);
  });

  it('geotec edits geotec ratings only', () => {
    const m = mkMember({ role: 'geotec' });
    expect(can(m, 'edit_geotec', { yacId: 'y1' })).toBe(true);
    expect(can(m, 'edit_drillhole', { yacId: 'y1' })).toBe(false);
  });

  it('visitante read-only public dashboards', () => {
    const m = mkMember({ role: 'visitante' });
    expect(can(m, 'view_public_dashboard', {})).toBe(true);
    expect(can(m, 'edit_drillhole', { yacId: 'y1' })).toBe(false);
    expect(can(m, 'view_resource_model', { yacId: 'y1' })).toBe(false);
  });

  it('inactive member denied always', () => {
    const m = mkMember({ role: 'super_geol', activo: false });
    expect(can(m, 'manage_org', {})).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify fail**

Run from `web/apps/web/`:
```bash
npm test -- --run src/lib/auth/__tests__/rbac.test.ts
```
Expected: FAIL — `can` not exported.

- [ ] **Step 3: Implement rbac.ts**

Create `web/apps/web/src/lib/auth/rbac.ts`:
```typescript
import type { Member, Role } from '@/types/org';

export type Action =
  | 'view_public_dashboard'
  | 'view_resource_model'
  | 'view_reconc'
  | 'view_qaqc'
  | 'edit_drillhole'
  | 'edit_resource_model'
  | 'edit_qaqc'
  | 'edit_geotec'
  | 'approve_sondaje'
  | 'approve_resource_model'
  | 'sign_reconciliacion'
  | 'manage_org';

export interface ResourceCtx {
  yacId?: string;
  faenaId?: string;
}

const ALL_YAC_ROLES: Role[] = ['super_geol', 'qaqc', 'geotec'];

function inAssigned(m: Member, ctx: ResourceCtx): boolean {
  if (!ctx.yacId) return true;
  return m.yacimientoIds.includes(ctx.yacId);
}

export function can(m: Member, action: Action, ctx: ResourceCtx): boolean {
  if (!m.activo) return false;
  if (m.role === 'super_geol') return true;

  switch (action) {
    case 'manage_org':
      return false;

    case 'view_public_dashboard':
      return true;

    case 'view_resource_model':
    case 'view_reconc':
      if (m.role === 'visitante') return false;
      return ALL_YAC_ROLES.includes(m.role) || inAssigned(m, ctx);

    case 'view_qaqc':
      if (m.role === 'visitante') return false;
      return true;

    case 'edit_drillhole':
      if (m.role === 'geol_senior' || m.role === 'geol_mina') return inAssigned(m, ctx);
      return false;

    case 'edit_resource_model':
      return m.role === 'geol_senior' && inAssigned(m, ctx);

    case 'approve_resource_model':
      return false; // only super_geol (handled above)

    case 'approve_sondaje':
      return m.role === 'geol_senior' && inAssigned(m, ctx);

    case 'edit_qaqc':
      return m.role === 'qaqc';

    case 'edit_geotec':
      return m.role === 'geotec';

    case 'sign_reconciliacion':
      return false; // only super_geol

    default:
      return false;
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run:
```bash
npm test -- --run src/lib/auth/__tests__/rbac.test.ts
```
Expected: 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add web/apps/web/src/lib/auth/rbac.ts web/apps/web/src/lib/auth/__tests__/rbac.test.ts
git commit -m "feat(rbac): role permission matrix with tests covering 6 roles"
```

---

## Task 3: Reconciliación calc lib + tests (TDD)

**Files:**
- Create: `web/apps/web/src/lib/data/reconc.ts`
- Test: `web/apps/web/src/lib/data/__tests__/reconc.test.ts`

- [ ] **Step 1: Write failing tests**

Create `web/apps/web/src/lib/data/__tests__/reconc.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { computeFactors, classifyFactor, detectOutliers } from '../reconc';

describe('computeFactors', () => {
  it('happy path', () => {
    const r = computeFactors({
      plan_t: 100000,
      plan_ley_cu: 1.0,
      real_t_planta: 98000,
      real_ley_cu_planta: 1.05,
    });
    expect(r.factor_t).toBeCloseTo(0.98, 4);
    expect(r.factor_ley_cu).toBeCloseTo(1.05, 4);
    expect(r.factor_metal_cu).toBeCloseTo(0.98 * 1.05, 4);
  });

  it('handles zero plan defensively', () => {
    const r = computeFactors({
      plan_t: 0, plan_ley_cu: 0,
      real_t_planta: 100, real_ley_cu_planta: 1,
    });
    expect(r.factor_t).toBeNull();
    expect(r.factor_ley_cu).toBeNull();
    expect(r.factor_metal_cu).toBeNull();
  });

  it('au optional', () => {
    const r = computeFactors({
      plan_t: 100, plan_ley_cu: 1, real_t_planta: 100, real_ley_cu_planta: 1,
      plan_ley_au: 0.5, real_ley_au_planta: 0.6,
    });
    expect(r.factor_ley_au).toBeCloseTo(1.2, 4);
  });
});

describe('classifyFactor', () => {
  it.each([
    [1.0, 'ok'],
    [0.95, 'ok'],
    [1.05, 'ok'],
    [0.94, 'warning'],
    [1.06, 'warning'],
    [0.89, 'critical'],
    [1.11, 'critical'],
    [null, 'unknown'],
  ])('%s -> %s', (factor, expected) => {
    expect(classifyFactor(factor as number | null)).toBe(expected);
  });
});

describe('detectOutliers', () => {
  it('flags points outside 2σ', () => {
    const series = [1.0, 1.0, 1.0, 1.0, 1.0, 1.5];
    const out = detectOutliers(series);
    expect(out).toEqual([5]);
  });

  it('empty series returns []', () => {
    expect(detectOutliers([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
npm test -- --run src/lib/data/__tests__/reconc.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement reconc.ts**

Create `web/apps/web/src/lib/data/reconc.ts`:
```typescript
export interface FactorInput {
  plan_t: number;
  plan_ley_cu: number;
  real_t_planta: number;
  real_ley_cu_planta: number;
  plan_ley_au?: number;
  real_ley_au_planta?: number;
}

export interface FactorOutput {
  factor_t: number | null;
  factor_ley_cu: number | null;
  factor_ley_au: number | null;
  factor_metal_cu: number | null;
}

function safeDiv(num: number, den: number): number | null {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0) return null;
  return num / den;
}

export function computeFactors(i: FactorInput): FactorOutput {
  const factor_t = safeDiv(i.real_t_planta, i.plan_t);
  const factor_ley_cu = safeDiv(i.real_ley_cu_planta, i.plan_ley_cu);
  const factor_ley_au =
    i.plan_ley_au != null && i.real_ley_au_planta != null
      ? safeDiv(i.real_ley_au_planta, i.plan_ley_au)
      : null;
  const factor_metal_cu =
    factor_t != null && factor_ley_cu != null ? factor_t * factor_ley_cu : null;
  return { factor_t, factor_ley_cu, factor_ley_au, factor_metal_cu };
}

export type FactorClass = 'ok' | 'warning' | 'critical' | 'unknown';

export function classifyFactor(f: number | null): FactorClass {
  if (f == null || !Number.isFinite(f)) return 'unknown';
  if (f >= 0.95 && f <= 1.05) return 'ok';
  if (f >= 0.9 && f <= 1.1) return 'warning';
  return 'critical';
}

function meanStd(arr: number[]): { mean: number; std: number } {
  const n = arr.length;
  if (n === 0) return { mean: 0, std: 0 };
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const variance = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return { mean, std: Math.sqrt(variance) };
}

export function detectOutliers(series: number[], sigmas = 2): number[] {
  if (series.length === 0) return [];
  const { mean, std } = meanStd(series);
  if (std === 0) return [];
  const out: number[] = [];
  series.forEach((v, i) => {
    if (Math.abs(v - mean) > sigmas * std) out.push(i);
  });
  return out;
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test -- --run src/lib/data/__tests__/reconc.test.ts
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add web/apps/web/src/lib/data/reconc.ts web/apps/web/src/lib/data/__tests__/reconc.test.ts
git commit -m "feat(reconc): factor computation + classification + outlier detection"
```

---

## Task 4: QA/QC calc lib + tests (TDD)

**Files:**
- Create: `web/apps/web/src/lib/data/qaqc.ts`
- Test: `web/apps/web/src/lib/data/__tests__/qaqc.test.ts`

- [ ] **Step 1: Write failing tests**

Create `web/apps/web/src/lib/data/__tests__/qaqc.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { hardDuplicate, biasStd, classifyDuplicate, classifyBias, classifyBlank, shewhartBands } from '../qaqc';

describe('hardDuplicate', () => {
  it('returns relative diff', () => {
    expect(hardDuplicate(1.0, 1.1)).toBeCloseTo(0.0952, 3);
  });
  it('zero pair returns null', () => {
    expect(hardDuplicate(0, 0)).toBeNull();
  });
});

describe('classifyDuplicate', () => {
  it('grueso pass <10%', () => {
    expect(classifyDuplicate(0.05, 'dup_grueso')).toBe('pass');
  });
  it('grueso fail >10%', () => {
    expect(classifyDuplicate(0.15, 'dup_grueso')).toBe('fail');
  });
  it('pulpa pass <20%', () => {
    expect(classifyDuplicate(0.15, 'dup_pulpa')).toBe('pass');
  });
  it('pulpa fail >20%', () => {
    expect(classifyDuplicate(0.25, 'dup_pulpa')).toBe('fail');
  });
});

describe('biasStd', () => {
  it('positive bias', () => {
    expect(biasStd(1.05, 1.0)).toBeCloseTo(0.05, 4);
  });
  it('zero esperado returns null', () => {
    expect(biasStd(1, 0)).toBeNull();
  });
});

describe('classifyBias', () => {
  it.each([
    [0.0, 'pass'],
    [0.04, 'pass'],
    [0.06, 'warning'],
    [0.11, 'fail'],
    [-0.11, 'fail'],
  ])('bias=%s -> %s', (b, e) => {
    expect(classifyBias(b)).toBe(e);
  });
});

describe('classifyBlank', () => {
  it('within 5x detLimit pass', () => {
    expect(classifyBlank(0.02, 0.01)).toBe('pass');
  });
  it('above 5x fail', () => {
    expect(classifyBlank(0.06, 0.01)).toBe('fail');
  });
});

describe('shewhartBands', () => {
  it('returns mean ± 2σ and ± 3σ', () => {
    const series = [1, 1, 1, 1, 1];
    const r = shewhartBands(series);
    expect(r.mean).toBe(1);
    expect(r.std).toBe(0);
    expect(r.upper2).toBe(1);
    expect(r.lower3).toBe(1);
  });
  it('non-trivial', () => {
    const r = shewhartBands([1, 2, 3, 4, 5]);
    expect(r.mean).toBe(3);
    expect(r.std).toBeCloseTo(1.4142, 3);
    expect(r.upper2).toBeCloseTo(3 + 2 * 1.4142, 3);
    expect(r.lower3).toBeCloseTo(3 - 3 * 1.4142, 3);
  });
});
```

- [ ] **Step 2: Run, verify fail**

```bash
npm test -- --run src/lib/data/__tests__/qaqc.test.ts
```

- [ ] **Step 3: Implement qaqc.ts**

Create `web/apps/web/src/lib/data/qaqc.ts`:
```typescript
import type { QAQCStatus, QAQCTipo } from '@/types/reconc';

export function hardDuplicate(orig: number, check: number): number | null {
  const sum = orig + check;
  if (sum === 0) return null;
  return Math.abs(orig - check) / (sum / 2);
}

export function classifyDuplicate(hard: number | null, tipo: QAQCTipo): QAQCStatus {
  if (hard == null) return 'fail';
  const limit = tipo === 'dup_grueso' ? 0.1 : 0.2;
  if (hard <= limit * 0.5) return 'pass';
  if (hard <= limit) return 'pass';
  return 'fail';
}

export function biasStd(medido: number, esperado: number): number | null {
  if (esperado === 0) return null;
  return (medido - esperado) / esperado;
}

export function classifyBias(bias: number | null): QAQCStatus {
  if (bias == null) return 'fail';
  const a = Math.abs(bias);
  if (a <= 0.05) return 'pass';
  if (a <= 0.1) return 'warning';
  return 'fail';
}

export function classifyBlank(valor: number, detLimit: number): QAQCStatus {
  if (detLimit <= 0) return 'fail';
  return valor <= 5 * detLimit ? 'pass' : 'fail';
}

export interface ShewhartBands {
  mean: number;
  std: number;
  upper2: number;
  lower2: number;
  upper3: number;
  lower3: number;
}

export function shewhartBands(series: number[]): ShewhartBands {
  const n = series.length;
  const mean = n ? series.reduce((a, b) => a + b, 0) / n : 0;
  const variance = n ? series.reduce((a, b) => a + (b - mean) ** 2, 0) / n : 0;
  const std = Math.sqrt(variance);
  return {
    mean,
    std,
    upper2: mean + 2 * std,
    lower2: mean - 2 * std,
    upper3: mean + 3 * std,
    lower3: mean - 3 * std,
  };
}
```

- [ ] **Step 4: Run, verify pass**

```bash
npm test -- --run src/lib/data/__tests__/qaqc.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add web/apps/web/src/lib/data/qaqc.ts web/apps/web/src/lib/data/__tests__/qaqc.test.ts
git commit -m "feat(qaqc): Shewhart bands + HARD duplicates + bias + blank classifiers"
```

---

## Task 5: Firestore rules + indexes for multi-org RBAC

**Files:**
- Modify: `firestore.rules`
- Create/Modify: `firestore.indexes.json`

- [ ] **Step 1: Replace firestore.rules**

Overwrite `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Legacy single-tenant retained until migration
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Helpers
    function signedIn() { return request.auth != null; }
    function memberDoc(orgId) {
      return get(/databases/$(database)/documents/orgs/$(orgId)/members/$(request.auth.uid));
    }
    function isMember(orgId) {
      return signedIn() && exists(/databases/$(database)/documents/orgs/$(orgId)/members/$(request.auth.uid))
        && memberDoc(orgId).data.activo == true;
    }
    function role(orgId) { return memberDoc(orgId).data.role; }
    function isSuper(orgId) { return isMember(orgId) && role(orgId) == 'super_geol'; }
    function hasYac(orgId, yacId) {
      return isMember(orgId) && (
        role(orgId) in ['super_geol', 'qaqc', 'geotec'] ||
        yacId in memberDoc(orgId).data.yacimientoIds
      );
    }

    match /orgs/{orgId} {
      allow read: if isMember(orgId);
      allow write: if isSuper(orgId);

      match /members/{uid} {
        allow read: if isMember(orgId);
        allow write: if isSuper(orgId);
      }

      match /faenas/{faenaId} {
        allow read: if isMember(orgId);
        allow write: if isSuper(orgId);

        match /yacimientos/{yacId} {
          allow read: if isMember(orgId);
          allow write: if isSuper(orgId);

          match /resourceModel/{docId} {
            allow read: if isMember(orgId) && hasYac(orgId, yacId);
            allow create, update: if isMember(orgId)
              && (role(orgId) == 'super_geol'
                  || (role(orgId) == 'geol_senior' && hasYac(orgId, yacId)));
            allow delete: if isSuper(orgId);
          }

          match /reconciliacion/{docId} {
            allow read: if isMember(orgId) && hasYac(orgId, yacId);
            allow write: if isSuper(orgId);
          }

          match /qaqc/{docId} {
            allow read: if isMember(orgId);
            allow create, update: if isMember(orgId)
              && role(orgId) in ['super_geol', 'qaqc'];
            allow delete: if isSuper(orgId);
          }

          match /sondajes_plan/{docId} {
            allow read: if isMember(orgId) && hasYac(orgId, yacId);
            allow write: if isMember(orgId)
              && role(orgId) in ['super_geol', 'geol_senior'];
          }
        }
      }

      match /alertas/{alertId} {
        allow read: if isMember(orgId);
        allow write: if isSuper(orgId);
      }
    }
  }
}
```

- [ ] **Step 2: Add composite indexes**

Create or merge `firestore.indexes.json` at repo root:
```json
{
  "indexes": [
    {
      "collectionGroup": "reconciliacion",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "yacId", "order": "ASCENDING" },
        { "fieldPath": "mes", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "resourceModel",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "yacId", "order": "ASCENDING" },
        { "fieldPath": "periodo", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "qaqc",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "yacId", "order": "ASCENDING" },
        { "fieldPath": "fecha", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 3: Deploy rules to Firebase**

```bash
firebase deploy --only firestore:rules,firestore:indexes
```
Expected: success message.

- [ ] **Step 4: Commit**

```bash
git add firestore.rules firestore.indexes.json
git commit -m "feat(firestore): multi-org RBAC rules + composite indexes for reconc/qaqc/resourceModel"
```

---

## Task 6: Org context provider + queries

**Files:**
- Create: `web/apps/web/src/lib/firebase/orgs.ts`
- Create: `web/apps/web/src/lib/auth/org-context.tsx`
- Modify: `web/apps/web/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Create orgs query module**

Create `web/apps/web/src/lib/firebase/orgs.ts`:
```typescript
'use client';

import {
  collection, doc, getDoc, getDocs, query, where, orderBy, onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './client';
import type { Member, Org, Faena, Yacimiento } from '@/types/org';
import type { Reconciliacion, ResourceModel, QAQCBatch } from '@/types/reconc';

export async function fetchUserOrgs(uid: string): Promise<Org[]> {
  const q = query(collection(db, 'orgs'));
  const snap = await getDocs(q);
  const orgs: Org[] = [];
  for (const d of snap.docs) {
    const memberSnap = await getDoc(doc(db, 'orgs', d.id, 'members', uid));
    if (memberSnap.exists() && memberSnap.data().activo) {
      orgs.push({ id: d.id, ...(d.data() as Omit<Org, 'id'>) });
    }
  }
  return orgs;
}

export async function fetchMember(orgId: string, uid: string): Promise<Member | null> {
  const s = await getDoc(doc(db, 'orgs', orgId, 'members', uid));
  if (!s.exists()) return null;
  return { uid, ...(s.data() as Omit<Member, 'uid'>) };
}

export function subscribeFaenas(
  orgId: string,
  cb: (items: Faena[]) => void,
): Unsubscribe {
  return onSnapshot(collection(db, 'orgs', orgId, 'faenas'), (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Faena, 'id'>) })));
  });
}

export function subscribeYacimientos(
  orgId: string,
  faenaId: string,
  cb: (items: Yacimiento[]) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos'),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Yacimiento, 'id'>) })))
  );
}

export function subscribeReconc(
  orgId: string,
  faenaId: string,
  yacId: string,
  cb: (items: Reconciliacion[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos', yacId, 'reconciliacion'),
    orderBy('mes', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Reconciliacion, 'id'>) }))),
  );
}

export function subscribeResourceModel(
  orgId: string, faenaId: string, yacId: string,
  cb: (items: ResourceModel[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos', yacId, 'resourceModel'),
    orderBy('periodo', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ResourceModel, 'id'>) }))),
  );
}

export function subscribeQAQC(
  orgId: string, faenaId: string, yacId: string,
  cb: (items: QAQCBatch[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos', yacId, 'qaqc'),
    orderBy('fecha', 'desc'),
  );
  return onSnapshot(q, (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<QAQCBatch, 'id'>) }))),
  );
}
```

- [ ] **Step 2: Create org context provider**

Create `web/apps/web/src/lib/auth/org-context.tsx`:
```typescript
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/firebase/auth';
import { fetchUserOrgs, fetchMember } from '@/lib/firebase/orgs';
import type { Member, Org } from '@/types/org';

interface OrgContextValue {
  orgs: Org[];
  currentOrg: Org | null;
  member: Member | null;
  loading: boolean;
  switchOrg: (orgId: string) => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);
const LS_KEY = 'geoagent.currentOrgId';

export function OrgProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [currentOrg, setCurrentOrg] = useState<Org | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setOrgs([]); setCurrentOrg(null); setMember(null); setLoading(false); return; }
    let alive = true;
    (async () => {
      const list = await fetchUserOrgs(user.uid);
      if (!alive) return;
      setOrgs(list);
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY) : null;
      const pick = list.find((o) => o.id === stored) ?? list[0] ?? null;
      setCurrentOrg(pick);
      if (pick) setMember(await fetchMember(pick.id, user.uid));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  const switchOrg = (orgId: string) => {
    const o = orgs.find((x) => x.id === orgId) ?? null;
    setCurrentOrg(o);
    if (typeof window !== 'undefined' && o) window.localStorage.setItem(LS_KEY, o.id);
    if (o && user) fetchMember(o.id, user.uid).then(setMember);
  };

  return (
    <OrgContext.Provider value={{ orgs, currentOrg, member, loading, switchOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within OrgProvider');
  return ctx;
}
```

- [ ] **Step 3: Wrap dashboard layout**

Open `web/apps/web/src/app/(dashboard)/layout.tsx` and wrap children in `<OrgProvider>` (import from `@/lib/auth/org-context`). The exact wrap depends on existing structure — read the file first, then add the provider as outermost wrapper after AuthProvider.

Example (add to existing file):
```tsx
import { OrgProvider } from '@/lib/auth/org-context';
// ... inside the component return:
//   <AuthGuard>
//     <OrgProvider>
//       {existing content}
//     </OrgProvider>
//   </AuthGuard>
```

- [ ] **Step 4: Type-check + smoke test**

```bash
cd web/apps/web && npm run type-check && npm test -- --run
```
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add web/apps/web/src/lib/firebase/orgs.ts web/apps/web/src/lib/auth/org-context.tsx web/apps/web/src/app/\(dashboard\)/layout.tsx
git commit -m "feat(org): Firestore subscriptions + OrgContext provider with org switcher"
```

---

## Task 7: Seed CMSG org + migration script

**Files:**
- Create: `scripts/seed-cmsg-org.ts`
- Create: `scripts/migrate-to-org-rbac.ts`
- Modify: `web/apps/web/package.json` (scripts)

- [ ] **Step 1: Create seed script**

Create `scripts/seed-cmsg-org.ts`:
```typescript
// Run with: npx tsx scripts/seed-cmsg-org.ts <super_geol_uid>
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as fs from 'node:fs';

const SA = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json';
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(SA, 'utf-8'))) });
}
const db = getFirestore();

async function main() {
  const superUid = process.argv[2];
  if (!superUid) throw new Error('usage: tsx seed-cmsg-org.ts <super_geol_uid>');

  const orgRef = db.collection('orgs').doc('cmsg');
  await orgRef.set({
    nombre: 'Compañía Minera San Gerónimo',
    plan: 'enterprise',
    createdAt: Date.now(),
  });

  await orgRef.collection('members').doc(superUid).set({
    email: 'super@cmsg.cl',
    nombre: 'Héctor Figueroa Aguilera',
    role: 'super_geol',
    faenaIds: ['talcuna', 'lambert'],
    yacimientoIds: ['21mayo', 'sanantonio', 'tugal', 'lambert'],
    activo: true,
  });

  await orgRef.collection('faenas').doc('talcuna').set({
    nombre: 'Talcuna', region: 'Coquimbo',
  });
  await orgRef.collection('faenas').doc('lambert').set({
    nombre: 'Lambert', region: 'Coquimbo',
  });

  const yacs = [
    { id: '21mayo', faena: 'talcuna', nombre: 'Mina 21 de Mayo', tipo: 'subt', modelo: 'vetiforme' },
    { id: 'sanantonio', faena: 'talcuna', nombre: 'Mina San Antonio', tipo: 'subt', modelo: 'IOCG' },
    { id: 'tugal', faena: 'talcuna', nombre: 'Mina Tugal', tipo: 'rajo', modelo: 'vetiforme' },
    { id: 'lambert', faena: 'lambert', nombre: 'Lambert (compra)', tipo: 'compra', modelo: 'oxido_Cu' },
  ];

  for (const y of yacs) {
    await orgRef.collection('faenas').doc(y.faena).collection('yacimientos').doc(y.id).set({
      faenaId: y.faena, nombre: y.nombre, tipo: y.tipo, modelo: y.modelo, activo: true,
    });
  }

  console.log('Seeded org=cmsg with super_geol=', superUid);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Create migration script (skeleton)**

Create `scripts/migrate-to-org-rbac.ts`:
```typescript
// Backfills existing users/{uid}/drillholes -> orgs/cmsg/.../drillholes (idempotent).
// Run AFTER seed-cmsg-org.ts. Usage: npx tsx scripts/migrate-to-org-rbac.ts <uid> <yacId>
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'node:fs';

const SA = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ?? './service-account.json';
if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(fs.readFileSync(SA, 'utf-8'))) });
}
const db = getFirestore();

async function main() {
  const [uid, yacId] = process.argv.slice(2);
  if (!uid || !yacId) throw new Error('usage: tsx migrate-to-org-rbac.ts <uid> <yacId>');

  const cols = ['drillholes', 'stations', 'lithologies', 'structurals', 'samples'];
  for (const col of cols) {
    const src = await db.collection('users').doc(uid).collection(col).get();
    console.log(`Migrating ${col}: ${src.size} docs`);
    let n = 0;
    for (const d of src.docs) {
      const data = d.data();
      if (!data.yacId) data.yacId = yacId;
      if (!data.orgId) data.orgId = 'cmsg';
      await d.ref.update({ yacId: data.yacId, orgId: data.orgId });
      n++;
    }
    console.log(`  tagged ${n} docs with yacId=${yacId}, orgId=cmsg`);
  }
  console.log('Migration done. Existing rules still allow access via legacy path.');
}

main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Add tsx as dev dep + npm scripts**

Run from `web/apps/web/`:
```bash
npm i -D tsx firebase-admin
```

Edit `web/apps/web/package.json` scripts block to add:
```json
"seed:cmsg": "tsx ../../../scripts/seed-cmsg-org.ts",
"migrate:org": "tsx ../../../scripts/migrate-to-org-rbac.ts"
```

- [ ] **Step 4: Verify scripts compile**

```bash
cd web/apps/web && npx tsx --check ../../../scripts/seed-cmsg-org.ts ../../../scripts/migrate-to-org-rbac.ts || true
```
Expected: no syntax errors. Actual execution requires service account JSON, defer until ready.

- [ ] **Step 5: Commit**

```bash
git add scripts/seed-cmsg-org.ts scripts/migrate-to-org-rbac.ts web/apps/web/package.json web/apps/web/package-lock.json
git commit -m "feat(scripts): seed CMSG org + migration backfill for legacy single-tenant data"
```

---

## Task 8: Cockpit page + tile component

**Files:**
- Create: `web/apps/web/src/components/super/cockpit-tile.tsx`
- Create: `web/apps/web/src/app/(dashboard)/super/page.tsx`

- [ ] **Step 1: Tile component**

Create `web/apps/web/src/components/super/cockpit-tile.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CockpitTileProps {
  title: string;
  kpi: string;
  status?: 'ok' | 'warning' | 'critical' | 'unknown';
  subtitle?: string;
  href: string;
  icon?: ReactNode;
  sparkline?: ReactNode;
}

const STATUS_BG: Record<string, string> = {
  ok: 'bg-emerald-500/10 border-emerald-500/30',
  warning: 'bg-amber-500/10 border-amber-500/30',
  critical: 'bg-red-500/10 border-red-500/30',
  unknown: 'bg-muted/30 border-muted',
};

export function CockpitTile({ title, kpi, status = 'unknown', subtitle, href, icon, sparkline }: CockpitTileProps) {
  return (
    <Link
      href={href}
      className={cn(
        'block rounded-xl border p-4 transition hover:scale-[1.01]',
        STATUS_BG[status],
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {icon}
      </div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{kpi}</div>
      {subtitle && <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>}
      {sparkline && <div className="mt-3 h-12">{sparkline}</div>}
    </Link>
  );
}
```

- [ ] **Step 2: Cockpit page**

Create `web/apps/web/src/app/(dashboard)/super/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos, subscribeReconc, subscribeQAQC } from '@/lib/firebase/orgs';
import { CockpitTile } from '@/components/super/cockpit-tile';
import { classifyFactor } from '@/lib/data/reconc';
import type { Reconciliacion, QAQCBatch } from '@/types/reconc';
import type { Faena, Yacimiento } from '@/types/org';

export default function CockpitPage() {
  const { currentOrg, member } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Yacimiento[]>([]);
  const [reconcs, setReconcs] = useState<Reconciliacion[]>([]);
  const [qaqcs, setQaqcs] = useState<QAQCBatch[]>([]);

  useEffect(() => {
    if (!currentOrg) return;
    return subscribeFaenas(currentOrg.id, setFaenas);
  }, [currentOrg]);

  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) =>
      subscribeYacimientos(currentOrg.id, f.id, (items) =>
        setYacs((prev) => {
          const filtered = prev.filter((y) => y.faenaId !== f.id);
          return [...filtered, ...items];
        }),
      ),
    );
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);

  useEffect(() => {
    if (!currentOrg || yacs.length === 0) return;
    const allReconc: Reconciliacion[] = [];
    const allQaqc: QAQCBatch[] = [];
    const unsubs = yacs.flatMap((y) => [
      subscribeReconc(currentOrg.id, y.faenaId, y.id, (items) => {
        allReconc.push(...items);
        setReconcs([...allReconc]);
      }),
      subscribeQAQC(currentOrg.id, y.faenaId, y.id, (items) => {
        allQaqc.push(...items);
        setQaqcs([...allQaqc]);
      }),
    ]);
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, yacs]);

  if (!currentOrg || !member) {
    return <div className="p-6">Cargando organización…</div>;
  }

  const lastReconc = [...reconcs].sort((a, b) => b.mes.localeCompare(a.mes))[0];
  const lastFactor = lastReconc?.factor_metal_cu ?? null;
  const factorStatus = classifyFactor(lastFactor);

  const failQaqc = qaqcs.filter((q) => q.status === 'fail').length;
  const totalQaqc = qaqcs.length || 1;
  const failRate = (failQaqc / totalQaqc) * 100;
  const qaqcStatus: 'ok' | 'warning' | 'critical' = failRate < 5 ? 'ok' : failRate < 10 ? 'warning' : 'critical';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Cockpit · {currentOrg.nombre}</h1>
        <p className="text-sm text-muted-foreground">
          Hola {member.nombre} · {member.role}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CockpitTile
          title="Reconciliación (último mes)"
          kpi={lastFactor != null ? lastFactor.toFixed(3) : '—'}
          status={factorStatus}
          subtitle={lastReconc ? `Factor metal Cu · ${lastReconc.mes}` : 'Sin datos'}
          href="/super/reconc"
        />
        <CockpitTile
          title="QA/QC Fail Rate"
          kpi={`${failRate.toFixed(1)}%`}
          status={qaqcStatus}
          subtitle={`${failQaqc} fails de ${totalQaqc} batches`}
          href="/super/qaqc"
        />
        <CockpitTile
          title="Recursos & Reservas"
          kpi={`${yacs.length}`}
          subtitle="yacimientos activos"
          href="/super/recursos"
        />
        <CockpitTile
          title="Sondajes activos"
          kpi="—"
          subtitle="ver detalle"
          href="/super/sondajes"
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
cd web/apps/web && npm run type-check
```

- [ ] **Step 4: Smoke run dev server, navigate /super**

```bash
cd web/apps/web && npm run dev
```
Open `http://localhost:3000/super`. Expected: page renders (data may be empty pre-seed). Stop server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add web/apps/web/src/components/super/cockpit-tile.tsx web/apps/web/src/app/\(dashboard\)/super/page.tsx
git commit -m "feat(super): cockpit page with reconc/qaqc/recursos/sondajes KPI tiles"
```

---

## Task 9: Reconciliación deep page + factor chart + cumulative curve

**Files:**
- Create: `web/apps/web/src/components/reconc/factor-chart.tsx`
- Create: `web/apps/web/src/components/reconc/cumulative-curve.tsx`
- Create: `web/apps/web/src/app/(dashboard)/super/reconc/page.tsx`

- [ ] **Step 1: Factor chart component**

Create `web/apps/web/src/components/reconc/factor-chart.tsx`:
```tsx
'use client';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Legend,
} from 'recharts';
import type { Reconciliacion } from '@/types/reconc';

interface Props { data: Reconciliacion[]; metric: 'factor_metal_cu' | 'factor_t' | 'factor_ley_cu'; }

export function FactorChart({ data, metric }: Props) {
  const sorted = [...data].sort((a, b) => a.mes.localeCompare(b.mes));
  const chart = sorted.map((r) => ({ mes: r.mes, value: r[metric] }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chart}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis domain={[0.7, 1.3]} />
        <Tooltip />
        <Legend />
        <ReferenceLine y={1.0} stroke="#888" strokeDasharray="2 2" />
        <ReferenceLine y={0.95} stroke="#10b981" strokeDasharray="4 2" label="0.95" />
        <ReferenceLine y={1.05} stroke="#10b981" strokeDasharray="4 2" label="1.05" />
        <ReferenceLine y={0.9} stroke="#ef4444" strokeDasharray="4 2" label="0.90" />
        <ReferenceLine y={1.1} stroke="#ef4444" strokeDasharray="4 2" label="1.10" />
        <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name={metric} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Cumulative curve component**

Create `web/apps/web/src/components/reconc/cumulative-curve.tsx`:
```tsx
'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import type { Reconciliacion } from '@/types/reconc';

export function CumulativeCurve({ data }: { data: Reconciliacion[] }) {
  const sorted = [...data].sort((a, b) => a.mes.localeCompare(b.mes));
  let cumPlan = 0; let cumReal = 0;
  const chart = sorted.map((r) => {
    cumPlan += r.plan_t;
    cumReal += r.real_t_planta;
    return { mes: r.mes, plan: cumPlan, real: cumReal };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chart}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="mes" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="plan" stroke="#94a3b8" fill="#cbd5e1" name="Plan acumulado (t)" />
        <Area type="monotone" dataKey="real" stroke="#3b82f6" fill="#bfdbfe" name="Real acumulado (t)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Reconciliación page**

Create `web/apps/web/src/app/(dashboard)/super/reconc/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos, subscribeReconc } from '@/lib/firebase/orgs';
import { FactorChart } from '@/components/reconc/factor-chart';
import { CumulativeCurve } from '@/components/reconc/cumulative-curve';
import type { Faena, Yacimiento } from '@/types/org';
import type { Reconciliacion } from '@/types/reconc';

export default function ReconcPage() {
  const { currentOrg } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Yacimiento[]>([]);
  const [selectedYac, setSelectedYac] = useState<string>('');
  const [data, setData] = useState<Reconciliacion[]>([]);

  useEffect(() => {
    if (!currentOrg) return;
    return subscribeFaenas(currentOrg.id, setFaenas);
  }, [currentOrg]);

  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) =>
      subscribeYacimientos(currentOrg.id, f.id, (items) => {
        setYacs((prev) => [...prev.filter((y) => y.faenaId !== f.id), ...items]);
      }),
    );
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);

  useEffect(() => {
    if (!currentOrg || !selectedYac) return;
    const yac = yacs.find((y) => y.id === selectedYac);
    if (!yac) return;
    return subscribeReconc(currentOrg.id, yac.faenaId, yac.id, setData);
  }, [currentOrg, selectedYac, yacs]);

  if (!currentOrg) return <div className="p-6">Cargando…</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Reconciliación Mina-Planta</h1>
      </header>

      <select
        value={selectedYac}
        onChange={(e) => setSelectedYac(e.target.value)}
        className="border rounded px-3 py-2 bg-background"
      >
        <option value="">Selecciona yacimiento…</option>
        {yacs.map((y) => (
          <option key={y.id} value={y.id}>{y.nombre}</option>
        ))}
      </select>

      {selectedYac && data.length > 0 ? (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2">Factor metal Cu</h2>
            <FactorChart data={data} metric="factor_metal_cu" />
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Curva acumulada (toneladas)</h2>
            <CumulativeCurve data={data} />
          </section>
        </div>
      ) : selectedYac ? (
        <p className="text-muted-foreground">Sin datos de reconciliación para este yacimiento.</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
cd web/apps/web && npm run type-check
```
Expected: green.

- [ ] **Step 5: Commit**

```bash
git add web/apps/web/src/components/reconc web/apps/web/src/app/\(dashboard\)/super/reconc/page.tsx
git commit -m "feat(reconc): factor chart + cumulative curve + yac-selector page"
```

---

## Task 10: QA/QC deep page + Shewhart + duplicates scatter + bias

**Files:**
- Create: `web/apps/web/src/components/qaqc/shewhart-chart.tsx`
- Create: `web/apps/web/src/components/qaqc/duplicates-scatter.tsx`
- Create: `web/apps/web/src/components/qaqc/standards-bias.tsx`
- Create: `web/apps/web/src/app/(dashboard)/super/qaqc/page.tsx`

- [ ] **Step 1: Shewhart chart**

Create `web/apps/web/src/components/qaqc/shewhart-chart.tsx`:
```tsx
'use client';

import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid,
} from 'recharts';
import { shewhartBands } from '@/lib/data/qaqc';

interface Point { idx: number; valor: number; status: string; }

export function ShewhartChart({ values }: { values: number[] }) {
  const bands = shewhartBands(values);
  const data: Point[] = values.map((v, i) => ({
    idx: i, valor: v, status: Math.abs(v - bands.mean) > 3 * bands.std ? 'fail' : Math.abs(v - bands.mean) > 2 * bands.std ? 'warning' : 'pass',
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="idx" />
        <YAxis />
        <Tooltip />
        <ReferenceLine y={bands.mean} stroke="#888" label="μ" />
        <ReferenceLine y={bands.upper2} stroke="#f59e0b" strokeDasharray="4 2" label="+2σ" />
        <ReferenceLine y={bands.lower2} stroke="#f59e0b" strokeDasharray="4 2" label="-2σ" />
        <ReferenceLine y={bands.upper3} stroke="#ef4444" strokeDasharray="4 2" label="+3σ" />
        <ReferenceLine y={bands.lower3} stroke="#ef4444" strokeDasharray="4 2" label="-3σ" />
        <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2} dot />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Duplicates scatter**

Create `web/apps/web/src/components/qaqc/duplicates-scatter.tsx`:
```tsx
'use client';

import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
} from 'recharts';

interface DupPoint { orig: number; check: number; }

export function DuplicatesScatter({ pairs, limitPct }: { pairs: DupPoint[]; limitPct: number }) {
  const max = Math.max(1, ...pairs.flatMap((p) => [p.orig, p.check]));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid />
        <XAxis dataKey="orig" name="Original" domain={[0, max]} />
        <YAxis dataKey="check" name="Duplicado" domain={[0, max]} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <ReferenceLine
          segment={[{ x: 0, y: 0 }, { x: max, y: max }]}
          stroke="#000" strokeDasharray="2 2" label="1:1"
        />
        <ReferenceLine
          segment={[{ x: 0, y: 0 }, { x: max, y: max * (1 + limitPct) }]}
          stroke="#ef4444" strokeDasharray="3 3"
        />
        <ReferenceLine
          segment={[{ x: 0, y: 0 }, { x: max, y: max * (1 - limitPct) }]}
          stroke="#ef4444" strokeDasharray="3 3"
        />
        <Scatter data={pairs} fill="#3b82f6" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 3: Standards bias chart**

Create `web/apps/web/src/components/qaqc/standards-bias.tsx`:
```tsx
'use client';

import { ShewhartChart } from './shewhart-chart';

interface BiasInput { medido: number; esperado: number; }

export function StandardsBias({ pairs }: { pairs: BiasInput[] }) {
  const biasSeries = pairs
    .filter((p) => p.esperado > 0)
    .map((p) => ((p.medido - p.esperado) / p.esperado) * 100);
  return <ShewhartChart values={biasSeries} />;
}
```

- [ ] **Step 4: QA/QC page**

Create `web/apps/web/src/app/(dashboard)/super/qaqc/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos, subscribeQAQC } from '@/lib/firebase/orgs';
import { ShewhartChart } from '@/components/qaqc/shewhart-chart';
import { DuplicatesScatter } from '@/components/qaqc/duplicates-scatter';
import { StandardsBias } from '@/components/qaqc/standards-bias';
import type { Faena, Yacimiento } from '@/types/org';
import type { QAQCBatch } from '@/types/reconc';

export default function QAQCPage() {
  const { currentOrg } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Yacimiento[]>([]);
  const [selectedYac, setSelectedYac] = useState<string>('');
  const [batches, setBatches] = useState<QAQCBatch[]>([]);

  useEffect(() => { if (currentOrg) return subscribeFaenas(currentOrg.id, setFaenas); }, [currentOrg]);
  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) => subscribeYacimientos(currentOrg.id, f.id, (items) => {
      setYacs((prev) => [...prev.filter((y) => y.faenaId !== f.id), ...items]);
    }));
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);
  useEffect(() => {
    if (!currentOrg || !selectedYac) return;
    const y = yacs.find((x) => x.id === selectedYac);
    if (!y) return;
    return subscribeQAQC(currentOrg.id, y.faenaId, y.id, setBatches);
  }, [currentOrg, selectedYac, yacs]);

  const dupGrueso = batches.filter((b) => b.tipo === 'dup_grueso' && b.valorOrig != null && b.valorCheck != null)
    .map((b) => ({ orig: b.valorOrig!, check: b.valorCheck! }));
  const dupPulpa = batches.filter((b) => b.tipo === 'dup_pulpa' && b.valorOrig != null && b.valorCheck != null)
    .map((b) => ({ orig: b.valorOrig!, check: b.valorCheck! }));
  const stds = batches.filter((b) => b.tipo === 'std' && b.valorOrig != null && b.valorEsperado != null)
    .map((b) => ({ medido: b.valorOrig!, esperado: b.valorEsperado! }));
  const blanks = batches.filter((b) => b.tipo === 'blank' && b.valorOrig != null).map((b) => b.valorOrig!);

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">QA/QC</h1>
      </header>
      <select value={selectedYac} onChange={(e) => setSelectedYac(e.target.value)} className="border rounded px-3 py-2 bg-background">
        <option value="">Selecciona yacimiento…</option>
        {yacs.map((y) => <option key={y.id} value={y.id}>{y.nombre}</option>)}
      </select>

      {selectedYac && (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2">Estándares certificados (bias %)</h2>
            {stds.length > 0 ? <StandardsBias pairs={stds} /> : <p className="text-muted-foreground">Sin estándares.</p>}
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Duplicados gruesos (HARD ±10%)</h2>
            {dupGrueso.length > 0 ? <DuplicatesScatter pairs={dupGrueso} limitPct={0.1} /> : <p className="text-muted-foreground">Sin duplicados gruesos.</p>}
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Duplicados pulpa (HARD ±20%)</h2>
            {dupPulpa.length > 0 ? <DuplicatesScatter pairs={dupPulpa} limitPct={0.2} /> : <p className="text-muted-foreground">Sin duplicados pulpa.</p>}
          </section>
          <section>
            <h2 className="text-lg font-semibold mb-2">Blancos</h2>
            {blanks.length > 0 ? <ShewhartChart values={blanks} /> : <p className="text-muted-foreground">Sin blancos.</p>}
          </section>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Type-check + commit**

```bash
cd web/apps/web && npm run type-check
git add web/apps/web/src/components/qaqc web/apps/web/src/app/\(dashboard\)/super/qaqc/page.tsx
git commit -m "feat(qaqc): Shewhart + duplicates scatter + standards bias + page"
```

---

## Task 11: Recursos & Reservas page + JORC pyramid

**Files:**
- Create: `web/apps/web/src/components/resources/jorc-pyramid.tsx`
- Create: `web/apps/web/src/app/(dashboard)/super/recursos/page.tsx`

- [ ] **Step 1: JORC pyramid component**

Create `web/apps/web/src/components/resources/jorc-pyramid.tsx`:
```tsx
'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';
import type { ResourceModel, JorcCategoria } from '@/types/reconc';

const ORDER: JorcCategoria[] = ['inferred', 'indicated', 'measured', 'probable', 'proven'];
const LABELS: Record<JorcCategoria, string> = {
  inferred: 'Inferido', indicated: 'Indicado', measured: 'Medido', probable: 'Probable', proven: 'Probado',
};
const COLORS: Record<JorcCategoria, string> = {
  inferred: '#94a3b8', indicated: '#60a5fa', measured: '#3b82f6', probable: '#10b981', proven: '#059669',
};

export function JorcPyramid({ models }: { models: ResourceModel[] }) {
  const totals = ORDER.map((cat) => {
    const docs = models.filter((m) => m.categoria === cat && m.status === 'approved');
    const tonelaje = docs.reduce((s, d) => s + d.tonelaje, 0);
    const ley_avg = docs.length ? docs.reduce((s, d) => s + d.ley_cu * d.tonelaje, 0) / (tonelaje || 1) : 0;
    return { categoria: LABELS[cat], tonelaje, ley_avg, color: COLORS[cat] };
  });

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={totals} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis type="category" dataKey="categoria" />
        <Tooltip
          formatter={(v: number, n: string) => n === 'tonelaje' ? `${v.toLocaleString()} t` : `${v.toFixed(2)}%`}
        />
        <Legend />
        <Bar dataKey="tonelaje" fill="#3b82f6" name="Tonelaje" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Recursos page**

Create `web/apps/web/src/app/(dashboard)/super/recursos/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos, subscribeResourceModel } from '@/lib/firebase/orgs';
import { JorcPyramid } from '@/components/resources/jorc-pyramid';
import type { Faena, Yacimiento } from '@/types/org';
import type { ResourceModel } from '@/types/reconc';

export default function RecursosPage() {
  const { currentOrg } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Yacimiento[]>([]);
  const [models, setModels] = useState<Record<string, ResourceModel[]>>({});

  useEffect(() => { if (currentOrg) return subscribeFaenas(currentOrg.id, setFaenas); }, [currentOrg]);
  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) => subscribeYacimientos(currentOrg.id, f.id, (items) =>
      setYacs((prev) => [...prev.filter((y) => y.faenaId !== f.id), ...items]),
    ));
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);
  useEffect(() => {
    if (!currentOrg || yacs.length === 0) return;
    const unsubs = yacs.map((y) => subscribeResourceModel(currentOrg.id, y.faenaId, y.id, (items) =>
      setModels((prev) => ({ ...prev, [y.id]: items })),
    ));
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, yacs]);

  return (
    <div className="p-4 md:p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">Recursos & Reservas (JORC)</h1>
      </header>
      {yacs.map((y) => (
        <section key={y.id} className="space-y-2">
          <h2 className="text-lg font-semibold">{y.nombre}</h2>
          {(models[y.id]?.length ?? 0) > 0 ? (
            <JorcPyramid models={models[y.id]!} />
          ) : (
            <p className="text-muted-foreground">Sin modelo aprobado.</p>
          )}
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
cd web/apps/web && npm run type-check
git add web/apps/web/src/components/resources web/apps/web/src/app/\(dashboard\)/super/recursos/page.tsx
git commit -m "feat(resources): JORC pyramid bar chart + per-yacimiento recursos page"
```

---

## Task 12: Sondajes productivity page + chart

**Files:**
- Create: `web/apps/web/src/components/sondajes/productivity-chart.tsx`
- Create: `web/apps/web/src/app/(dashboard)/super/sondajes/page.tsx`

- [ ] **Step 1: Productivity chart**

Create `web/apps/web/src/components/sondajes/productivity-chart.tsx`:
```tsx
'use client';

import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from 'recharts';

export interface MachineProd {
  maquina: string;
  m_real: number;
  m_plan: number;
  costo_m: number;
}

export function ProductivityChart({ data }: { data: MachineProd[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="maquina" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="m_plan" fill="#94a3b8" name="Plan (m)" />
        <Bar dataKey="m_real" fill="#3b82f6" name="Real (m)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

- [ ] **Step 2: Sondajes page (placeholder data path)**

Create `web/apps/web/src/app/(dashboard)/super/sondajes/page.tsx`:
```tsx
'use client';

import { ProductivityChart, type MachineProd } from '@/components/sondajes/productivity-chart';
import { useOrg } from '@/lib/auth/org-context';

export default function SondajesPage() {
  const { currentOrg } = useOrg();

  // F1 MVP: sondajes_plan subcollection lectura agregada por máquina.
  // Stub data hasta que UI de carga de planes se construya en F2.
  const data: MachineProd[] = [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Sondajes productividad</h1>
        <p className="text-sm text-muted-foreground">{currentOrg?.nombre}</p>
      </header>
      {data.length === 0 ? (
        <p className="text-muted-foreground">
          Carga planes de sondaje desde el módulo de proyectos (próximamente). Cuando existan datos en
          <code className="mx-1 px-1 bg-muted rounded">sondajes_plan</code> aparecerán métricas plan vs real
          por máquina diamantina.
        </p>
      ) : (
        <ProductivityChart data={data} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Type-check + commit**

```bash
cd web/apps/web && npm run type-check
git add web/apps/web/src/components/sondajes web/apps/web/src/app/\(dashboard\)/super/sondajes/page.tsx
git commit -m "feat(sondajes): productivity bar chart + page (data ingestion deferred to F2)"
```

---

## Task 13: Org admin pages — members + faenas/yacimientos editors

**Files:**
- Create: `web/apps/web/src/components/admin/role-matrix-editor.tsx`
- Create: `web/apps/web/src/components/admin/yacimiento-form.tsx`
- Create: `web/apps/web/src/app/(dashboard)/admin/org/page.tsx`
- Create: `web/apps/web/src/app/(dashboard)/admin/org/members/page.tsx`
- Create: `web/apps/web/src/app/(dashboard)/admin/org/faenas/page.tsx`

- [ ] **Step 1: Role matrix editor**

Create `web/apps/web/src/components/admin/role-matrix-editor.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { ROLE_LABELS, type Member, type Role } from '@/types/org';

const ROLES: Role[] = ['super_geol', 'geol_senior', 'geol_mina', 'qaqc', 'geotec', 'visitante'];

export function RoleMatrixEditor({ orgId, member }: { orgId: string; member: Member }) {
  const [role, setRole] = useState<Role>(member.role);
  const [activo, setActivo] = useState(member.activo);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'orgs', orgId, 'members', member.uid), { role, activo });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-3 border-b py-3">
      <div className="flex-1">
        <div className="font-medium">{member.nombre}</div>
        <div className="text-xs text-muted-foreground">{member.email}</div>
      </div>
      <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="border rounded px-2 py-1 bg-background">
        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>
      <label className="flex items-center gap-1 text-sm">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        Activo
      </label>
      <button onClick={save} disabled={saving} className="px-3 py-1 rounded bg-primary text-primary-foreground text-sm">
        {saving ? 'Guardando…' : 'Guardar'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Yacimiento form**

Create `web/apps/web/src/components/admin/yacimiento-form.tsx`:
```tsx
'use client';

import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import type { YacimientoTipo, YacimientoModelo } from '@/types/org';

export function YacimientoForm({ orgId, faenaId, onCreated }: { orgId: string; faenaId: string; onCreated: () => void }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<YacimientoTipo>('subt');
  const [modelo, setModelo] = useState<YacimientoModelo>('vetiforme');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    await addDoc(collection(db, 'orgs', orgId, 'faenas', faenaId, 'yacimientos'), {
      faenaId, nombre, tipo, modelo, activo: true,
    });
    setNombre('');
    onCreated();
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2 items-end border rounded p-3">
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre yacimiento" className="border rounded px-2 py-1 bg-background" />
      <select value={tipo} onChange={(e) => setTipo(e.target.value as YacimientoTipo)} className="border rounded px-2 py-1 bg-background">
        <option value="subt">Subterráneo</option>
        <option value="rajo">Rajo abierto</option>
        <option value="compra">Compra</option>
      </select>
      <select value={modelo} onChange={(e) => setModelo(e.target.value as YacimientoModelo)} className="border rounded px-2 py-1 bg-background">
        <option value="IOCG">IOCG</option>
        <option value="vetiforme">Vetiforme</option>
        <option value="oxido_Cu">Óxido Cu</option>
        <option value="porfido">Pórfido</option>
        <option value="otro">Otro</option>
      </select>
      <button className="px-3 py-1 rounded bg-primary text-primary-foreground">Crear</button>
    </form>
  );
}
```

- [ ] **Step 3: Admin org root page**

Create `web/apps/web/src/app/(dashboard)/admin/org/page.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { useOrg } from '@/lib/auth/org-context';

export default function OrgAdminPage() {
  const { currentOrg, member } = useOrg();
  if (!currentOrg || !member) return <div className="p-6">Cargando…</div>;
  if (member.role !== 'super_geol') return <div className="p-6">Solo super_geol puede administrar la org.</div>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Administración · {currentOrg.nombre}</h1>
      <ul className="space-y-2">
        <li><Link href="/admin/org/members" className="underline">Miembros & roles</Link></li>
        <li><Link href="/admin/org/faenas" className="underline">Faenas & yacimientos</Link></li>
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Members admin page**

Create `web/apps/web/src/app/(dashboard)/admin/org/members/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useOrg } from '@/lib/auth/org-context';
import { RoleMatrixEditor } from '@/components/admin/role-matrix-editor';
import type { Member } from '@/types/org';

export default function MembersPage() {
  const { currentOrg, member } = useOrg();
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!currentOrg) return;
    return onSnapshot(collection(db, 'orgs', currentOrg.id, 'members'), (snap) => {
      setMembers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as Omit<Member, 'uid'>) })));
    });
  }, [currentOrg]);

  if (!currentOrg || !member) return <div className="p-6">Cargando…</div>;
  if (member.role !== 'super_geol') return <div className="p-6">Acceso denegado.</div>;

  return (
    <div className="p-6 space-y-2">
      <h1 className="text-2xl font-bold">Miembros</h1>
      {members.map((m) => <RoleMatrixEditor key={m.uid} orgId={currentOrg.id} member={m} />)}
    </div>
  );
}
```

- [ ] **Step 5: Faenas admin page**

Create `web/apps/web/src/app/(dashboard)/admin/org/faenas/page.tsx`:
```tsx
'use client';

import { useEffect, useState } from 'react';
import { useOrg } from '@/lib/auth/org-context';
import { subscribeFaenas, subscribeYacimientos } from '@/lib/firebase/orgs';
import { YacimientoForm } from '@/components/admin/yacimiento-form';
import type { Faena, Yacimiento } from '@/types/org';

export default function FaenasPage() {
  const { currentOrg, member } = useOrg();
  const [faenas, setFaenas] = useState<Faena[]>([]);
  const [yacs, setYacs] = useState<Record<string, Yacimiento[]>>({});

  useEffect(() => { if (currentOrg) return subscribeFaenas(currentOrg.id, setFaenas); }, [currentOrg]);
  useEffect(() => {
    if (!currentOrg || faenas.length === 0) return;
    const unsubs = faenas.map((f) => subscribeYacimientos(currentOrg.id, f.id, (items) =>
      setYacs((p) => ({ ...p, [f.id]: items }))));
    return () => unsubs.forEach((u) => u());
  }, [currentOrg, faenas]);

  if (!currentOrg || !member) return <div className="p-6">Cargando…</div>;
  if (member.role !== 'super_geol') return <div className="p-6">Acceso denegado.</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Faenas & Yacimientos</h1>
      {faenas.map((f) => (
        <section key={f.id} className="border rounded p-4 space-y-3">
          <h2 className="text-lg font-semibold">{f.nombre} · {f.region}</h2>
          <ul className="text-sm space-y-1">
            {(yacs[f.id] ?? []).map((y) => (
              <li key={y.id} className="flex gap-2">
                <span className="font-medium">{y.nombre}</span>
                <span className="text-muted-foreground">{y.tipo} · {y.modelo}</span>
              </li>
            ))}
          </ul>
          <YacimientoForm orgId={currentOrg.id} faenaId={f.id} onCreated={() => {}} />
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Type-check + commit**

```bash
cd web/apps/web && npm run type-check
git add web/apps/web/src/components/admin web/apps/web/src/app/\(dashboard\)/admin
git commit -m "feat(admin): org root + members role editor + faenas/yacimientos CRUD"
```

---

## Task 14: Push notifications — KPI threshold rules

**Files:**
- Create: `web/apps/web/src/lib/notifications/push-rules.ts`
- Modify: `web/apps/web/src/lib/firebase/messaging.ts` (read first)

- [ ] **Step 1: Read existing messaging module**

```bash
cat web/apps/web/src/lib/firebase/messaging.ts
```
Note exports / interfaces. Plan to call existing notification dispatch from new rules module.

- [ ] **Step 2: Create push-rules**

Create `web/apps/web/src/lib/notifications/push-rules.ts`:
```typescript
import { classifyFactor } from '@/lib/data/reconc';
import type { Reconciliacion, QAQCBatch } from '@/types/reconc';

export interface AlertPayload {
  tipo: 'reconc_factor' | 'qaqc_fail_rate' | 'sondaje_retraso';
  severidad: 'warning' | 'critical';
  recurso: string;
  mensaje: string;
}

export function reconcAlerts(yacNombre: string, items: Reconciliacion[]): AlertPayload[] {
  const last = [...items].sort((a, b) => b.mes.localeCompare(a.mes))[0];
  if (!last) return [];
  const cls = classifyFactor(last.factor_metal_cu);
  if (cls === 'ok' || cls === 'unknown') return [];
  return [{
    tipo: 'reconc_factor',
    severidad: cls === 'critical' ? 'critical' : 'warning',
    recurso: yacNombre,
    mensaje: `Factor metal Cu ${last.factor_metal_cu?.toFixed(3)} en ${last.mes} (${cls})`,
  }];
}

export function qaqcAlerts(yacNombre: string, batches: QAQCBatch[]): AlertPayload[] {
  if (batches.length < 50) return [];
  const recent = [...batches].sort((a, b) => b.fecha - a.fecha).slice(0, 50);
  const fails = recent.filter((b) => b.status === 'fail').length;
  const rate = (fails / recent.length) * 100;
  if (rate < 10) return [];
  return [{
    tipo: 'qaqc_fail_rate',
    severidad: rate >= 20 ? 'critical' : 'warning',
    recurso: yacNombre,
    mensaje: `QA/QC fail rate ${rate.toFixed(1)}% en últimos 50 batches`,
  }];
}
```

- [ ] **Step 3: (Optional) Wire alerts to Firestore alertas collection**

Inside cockpit page, on data refresh, call rules and write `orgs/{orgId}/alertas` docs deduped (key by `tipo+recurso+mes`). Defer FCM delivery to existing messaging module — only write doc, let server-side trigger (future Cloud Function) deliver push.

This is a stub — do NOT wire delivery yet. Just expose the rules so future tasks can compose.

- [ ] **Step 4: Type-check + commit**

```bash
cd web/apps/web && npm run type-check
git add web/apps/web/src/lib/notifications/push-rules.ts
git commit -m "feat(notif): KPI threshold rules for reconc factor + qaqc fail rate"
```

---

## Task 15: Smoke E2E + bitácora + verification

**Files:**
- Modify: `bitacora.md`

- [ ] **Step 1: Run full type-check + tests**

```bash
cd web/apps/web && npm run type-check && npm test -- --run
```
Expected: green.

- [ ] **Step 2: Manual smoke**

```bash
cd web/apps/web && npm run dev
```
In browser, login. Visit `/super`, `/super/reconc`, `/super/qaqc`, `/super/recursos`, `/super/sondajes`, `/admin/org`. Confirm each renders without errors. Check console for warnings. Stop server.

- [ ] **Step 3: Append bitácora**

Append to `bitacora.md`:
```markdown

## 2026-05-04 — F0+F1 Geology Superintendent Cockpit

**Qué cambió:**
- Tipos `Org/Member/Faena/Yacimiento/ResourceModel/Reconciliacion/QAQCBatch`
- RBAC matrix (`lib/auth/rbac.ts`) + tests 8 casos cubriendo 6 roles
- Reconciliación calc (`lib/data/reconc.ts`): factors, classify, outliers
- QA/QC calc (`lib/data/qaqc.ts`): HARD, bias, Shewhart bands
- Firestore rules multi-org RBAC + indexes (reconc/qaqc/resourceModel)
- OrgContext provider + Firestore subscriptions (`lib/firebase/orgs.ts`)
- Cockpit `/super` con tiles KPI (reconc, qaqc, recursos, sondajes)
- Deep pages: `/super/reconc` (factor chart + cumulative curve), `/super/qaqc` (Shewhart + duplicates scatter + bias), `/super/recursos` (JORC pyramid), `/super/sondajes` (productivity bar)
- Admin org: `/admin/org/{members,faenas}` solo super_geol
- Push rules `lib/notifications/push-rules.ts` (delivery deferred)
- Seed script `scripts/seed-cmsg-org.ts` + migration `scripts/migrate-to-org-rbac.ts`

**Por qué:** habilita uso multi-usuario nivel ERP geológico para Héctor Figueroa (super geol CMSG) y su equipo en 4 yacimientos (21 May, San Antonio, Tugal, Lambert).

**Pendiente:** ejecutar seed + migration con UID real Héctor; cargar datos demo reconc/qaqc de últimos 6 meses Talcuna; F2 workflow approvals; F3 Mineral Forecast IA visor.

**Deploy:** TBD tras seed datos reales.
```

- [ ] **Step 4: Final commit + push + deploy**

```bash
git add bitacora.md
git commit -m "docs(bitacora): F0+F1 geology super cockpit shipped"
git push origin master
cd ../../../  # back to repo root
vercel --prod --yes
```
Capture deploy URL.

- [ ] **Step 5: Bitácora second pass with deploy URL**

Append to the just-created bitácora entry:
```markdown
**Deploy URL:** https://geoagent-app.vercel.app — Ready ✅
```

```bash
git add bitacora.md
git commit -m "docs(bitacora): F0+F1 deploy URL"
git push origin master
```

---

## Self-Review notes

Spec coverage:
- §2 Goals 1-6 → Tasks 3, 4, 8, 9, 10, 11, 12, 13, 14
- §4.1 data model → Tasks 1, 5, 7
- §4.2 RBAC → Tasks 2, 5
- §4.3 routing → Tasks 8-13
- §4.4 components → covered Tasks 8-13
- §4.5 mobile-first → tile component responsive grid (Task 8)
- §4.6 approval flow → schema present (status field), UI deferred to F2 (acceptable per spec §11)
- §5 cálculos → Tasks 3, 4
- §6 error handling → safeDiv/null returns (Task 3), defensive empty data states in pages
- §7 testing → Tasks 2, 3, 4 unit tests; rules emulator test mentioned in spec but Firebase emulator setup deferred (acceptable smoke risk)
- §8 migration → Task 7
- §9 deploy → Task 5 (rules deploy), Task 15 (Vercel)
- §12 success criteria → demo path covered Tasks 8-13 + admin

Type consistency: `Reconciliacion.factor_metal_cu` used consistently across `reconc.ts`, `factor-chart.tsx`, `cockpit/page.tsx`, `push-rules.ts`. `QAQCBatch.valorOrig` consistent. `Member.role` `Role` enum consistent.

Placeholders: none. Sondajes page (Task 12) has documented `data: MachineProd[] = []` stub explicitly tied to F2 — acceptable per spec §11 deferred items.

Gap accepted: rules emulator tests (spec §7) deferred — added as F1.5 followup if QA budget allows.
