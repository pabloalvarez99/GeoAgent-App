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
