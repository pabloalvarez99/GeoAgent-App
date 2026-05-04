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
