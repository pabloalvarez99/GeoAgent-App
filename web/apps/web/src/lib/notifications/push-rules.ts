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
