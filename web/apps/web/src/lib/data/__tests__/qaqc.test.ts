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
