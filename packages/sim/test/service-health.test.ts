import { readFileSync } from 'node:fs';
import { it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  initializeServiceHealth,
  stageServiceHealth,
  activateServiceHealth,
  evaluateServiceHealth,
  serviceHealthSource,
  HEALTH_RECOVERY,
  HEALTH_INPUT,
  tickWorld,
  uploadPracticeFile,
  parseServiceHealth,
  startSplunk,
  resolveHost,
  saveWorld,
  loadWorld,
} from '../src';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
const fresh = () =>
  createWorld({
    ...profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
    fleetSize: 50,
  });
it('derives KPI/dependency health from actual queries, keeps no-data unknown, and verifies recovery from newly accepted records', () => {
  const w = fresh();
  initializeServiceHealth(w);
  expect(w.serviceHealth!.evaluations[0]!.services.find((s) => s.id === 'checkout')).toMatchObject({
    score: 50,
    state: 'degraded',
  });
  stageServiceHealth(w, serviceHealthSource());
  activateServiceHealth(w);
  const broken = evaluateServiceHealth(w);
  expect(broken.services.find((s) => s.id === 'checkout')).toMatchObject({
    score: 0,
    state: 'critical',
    dependencies: ['authentication'],
  });
  tickWorld(w, 12);
  expect(evaluateServiceHealth(w).services.find((s) => s.id === 'checkout')).toMatchObject({
    score: null,
    state: 'unknown',
  });
  const fs = hostFs(w, resolveHost(w, 'idx01')!);
  uploadPracticeFile(w, 'idx01', HEALTH_INPUT, fs.readFile(HEALTH_INPUT, ROOT) + HEALTH_RECOVERY);
  tickWorld(w, 1);
  const healthy = evaluateServiceHealth(w);
  expect(healthy.services.every((s) => s.state === 'healthy' && s.score === 100)).toBe(true);
  expect(healthy.services.find((s) => s.id === 'checkout')?.kpis[0]).toMatchObject({
    value: 0,
    sourceRows: 3,
  });
  const resumed = loadWorld(saveWorld(w), []);
  expect(resumed.serviceHealth).toEqual(w.serviceHealth);
  const model = JSON.parse(serviceHealthSource());
  model.services[0].dependencies = ['checkout'];
  expect(() => parseServiceHealth(w, JSON.stringify(model))).toThrow('cycle');
  model.services[0].dependencies = [];
  model.services[1].kpis[0].search = '| makeresults | eval error_rate=0';
  expect(() => parseServiceHealth(w, JSON.stringify(model))).toThrow('actual index');
});
it('correlates an actual stopped indexing service with downstream health while keeping application KPI independently healthy', () => {
  const w = fresh();
  initializeServiceHealth(w, true);
  const first = w.serviceHealth!.evaluations[0]!,
    checkout = first.services.find((s) => s.id === 'checkout')!;
  expect(checkout.baseScore).toBe(100);
  expect(checkout.score).toBeCloseTo(80);
  expect(checkout.dependencyImpact).toBe(true);
  expect(first.services.find((s) => s.id === 'indexing')?.kpis.find((k) => k.id === 'idx02')).toMatchObject({
    value: 0,
    state: 'critical',
  });
  startSplunk(w, resolveHost(w, 'idx02')!);
  const recovered = evaluateServiceHealth(w);
  expect(recovered.services.every((s) => s.state === 'healthy')).toBe(true);
  expect(loadWorld(saveWorld(w), []).serviceHealth).toEqual(w.serviceHealth);
});
