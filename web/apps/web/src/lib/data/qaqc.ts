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
