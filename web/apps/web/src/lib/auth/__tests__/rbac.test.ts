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
