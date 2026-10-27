import { describe, expect, it } from 'vitest';
import { Rng, unit } from '../src/rng';

describe('Rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = new Rng('alpha');
    const b = new Rng('alpha');
    for (let i = 0; i < 1000; i++) expect(a.next()).toBe(b.next());
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng('alpha');
    const b = new Rng('alphb');
    const same = Array.from({ length: 100 }, () => a.next() === b.next()).filter(Boolean).length;
    expect(same).toBe(0);
  });

  it('forks are independent of how much the parent has been used', () => {
    const a = new Rng('s');
    const b = new Rng('s');
    for (let i = 0; i < 50; i++) b.next();
    expect(a.fork('tick', 7).next()).toBe(b.fork('tick', 7).next());
    expect(a.fork('tick', 7).next()).not.toBe(a.fork('tick', 8).next());
  });

  it('stays in range and is roughly uniform', () => {
    const r = new Rng('uniform');
    const buckets = new Array(10).fill(0);
    let min = 1,
      max = 0;
    for (let i = 0; i < 100_000; i++) {
      const x = r.next();
      min = Math.min(min, x);
      max = Math.max(max, x);
      buckets[Math.floor(x * 10)]++;
    }
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThan(1);
    for (const b of buckets) {
      expect(b).toBeGreaterThan(9_500);
      expect(b).toBeLessThan(10_500);
    }
  });

  it('weighted() follows the weights', () => {
    const r = new Rng('w');
    const counts = [0, 0, 0];
    for (let i = 0; i < 30_000; i++) counts[r.weighted([1, 2, 7])]++;
    expect(counts[0]! / 30_000).toBeCloseTo(0.1, 1);
    expect(counts[2]! / 30_000).toBeCloseTo(0.7, 1);
  });

  it('unit() is stateless and stable', () => {
    expect(unit(1, 2, 3)).toBe(unit(1, 2, 3));
    expect(unit(1, 2, 3)).not.toBe(unit(1, 2, 4));
  });
});
