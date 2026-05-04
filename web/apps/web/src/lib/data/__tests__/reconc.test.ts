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
