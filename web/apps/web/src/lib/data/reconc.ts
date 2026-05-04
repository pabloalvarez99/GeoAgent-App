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
