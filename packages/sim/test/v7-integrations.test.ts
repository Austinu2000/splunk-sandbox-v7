import { readFileSync, existsSync } from 'node:fs';
import { parse, stringify } from 'yaml';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  setupFoundation,
  foundationCheck,
  engineeringLessonSchema,
  saveWorld,
  loadWorld,
  stageIntegration,
  activateIntegration,
  pollIntegration,
  readIntegrationSource,
  INTEGRATION_PATHS,
  AWS_POLICY_SOURCE,
  CRIBL_ROUTES_SOURCE,
  DATABASE_SOURCE,
  appendDatabaseRow,
  resolveHost,
  restartSplunk,
  runSearch,
  recordSearchEvidence,
  stageServiceHealth,
  serviceHealthSource,
  activateServiceHealth,
  evaluateServiceHealth,
  tickWorld,
  uploadPracticeFile,
  HEALTH_INPUT,
  HEALTH_RECOVERY,
  startSplunk,
} from '../src';
import type { FoundationCheck } from '../src/engineering/foundations';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
const profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const definition = (id: string) => {
  const live = new URL('../../../lessons/v7/' + id + '.json', import.meta.url),
    draft = new URL('../../../lessons/v7-drafts/' + id + '.json', import.meta.url);
  return engineeringLessonSchema.parse(JSON.parse(readFileSync(existsSync(live) ? live : draft, 'utf8')));
};
function solve(w: ReturnType<typeof createWorld>, id: string) {
  const n = Number(id.slice(3));
  if (n === 83) {
    stageIntegration(w, 'aws', 'awsPolicy', AWS_POLICY_SOURCE);
    pollIntegration(w, 'aws');
    pollIntegration(w, 'aws');
  }
  if (n === 84) {
    const source = parse(readIntegrationSource(w, 'hf01', INTEGRATION_PATHS.otel));
    source.service.pipelines.traces = {
      receivers: ['otlp'],
      processors: ['batch'],
      exporters: ['splunk_hec/traces'],
    };
    stageIntegration(w, 'otel', 'otel', stringify(source));
    activateIntegration(w, 'otel');
    pollIntegration(w, 'otel');
    pollIntegration(w, 'otel');
  }
  if (n === 85) {
    stageIntegration(w, 'cribl', 'cribl', CRIBL_ROUTES_SOURCE);
    activateIntegration(w, 'cribl');
    const d = JSON.parse(readIntegrationSource(w, 'hf01', INTEGRATION_PATHS.criblAvailability));
    d.available = true;
    stageIntegration(w, 'cribl', 'criblAvailability', JSON.stringify(d));
    pollIntegration(w, 'cribl');
    pollIntegration(w, 'cribl');
  }
  if (n === 86) {
    stageIntegration(w, 'database', 'database', DATABASE_SOURCE);
    restartSplunk(w, resolveHost(w, 'sh01')!);
    pollIntegration(w, 'database');
    pollIntegration(w, 'database');
    appendDatabaseRow(w, { id: 4, service: 'checkout', status: 200 });
    pollIntegration(w, 'database');
  }
  if (n === 87) {
    stageServiceHealth(w, serviceHealthSource());
    activateServiceHealth(w);
    evaluateServiceHealth(w);
    tickWorld(w, 12);
    const fs = hostFs(w, resolveHost(w, 'idx01')!);
    uploadPracticeFile(w, 'idx01', HEALTH_INPUT, fs.readFile(HEALTH_INPUT, ROOT) + HEALTH_RECOVERY);
    tickWorld(w, 1);
    evaluateServiceHealth(w);
  }
  if (n === 88) {
    startSplunk(w, resolveHost(w, 'idx02')!);
    evaluateServiceHealth(w);
  }
  const search =
    n === 83
      ? 'index=cloud_logs | stats count'
      : n === 84
        ? 'index=traces OR index=app_logs | stats count dc(span_id) as spans by trace_id'
        : n === 85
          ? 'index=routed_logs | stats count'
          : n === 86
            ? 'index=db_logs | stats count dc(id) as ids'
            : n === 87
              ? 'index=service_logs service=checkout earliest=-1m | stats avg(status) as status'
              : 'index=service_logs | stats count';
  const r = runSearch(w, { search });
  expect(r.status).toBe('done');
  recordSearchEvidence(w, {
    id: 'integration-search',
    search,
    earliest: r.earliest,
    latest: r.latest,
    status: r.status,
    scanCount: r.scan?.scanned ?? 0,
    workUnits: r.workUnits,
    resultCount: r.results.length,
    inspected: true,
  });
}
for (let n = 83; n <= 88; n++) {
  const id = 'SP-' + String(n).padStart(3, '0');
  describe(id, () => {
    const d = definition(id),
      checks = d.checks as FoundationCheck[],
      fresh = () => {
        const w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
        setupFoundation(w, d.setup ?? []);
        w.lesson = { id, learner: 'Integration regression', startedTick: w.clock.tick, hints: 0, notes: '' };
        return w;
      },
      passed = (w: ReturnType<typeof fresh>) => checks.every((c) => foundationCheck(w, c));
    it(id + ':solution', () => {
      const w = fresh();
      expect(passed(w)).toBe(false);
      solve(w, id);
      expect(checks.map((c) => ({ label: c.label, passed: foundationCheck(w, c) }))).toEqual(
        checks.map((c) => ({ label: c.label, passed: true })),
      );
    });
    it(id + ':incorrect-action', () => {
      const w = fresh();
      restartSplunk(w, resolveHost(w, 'sh01')!);
      expect(passed(w)).toBe(false);
    });
    it(id + ':no-false-completion', () => {
      const a = fresh(),
        b = fresh();
      solve(a, id);
      expect(passed(a)).toBe(true);
      expect(passed(b)).toBe(false);
    });
    it(id + ':reset', () => {
      const w = fresh(),
        baseline = saveWorld(w);
      solve(w, id);
      expect(passed(w)).toBe(true);
      const reset = loadWorld(baseline, []);
      expect(passed(reset)).toBe(false);
      expect(saveWorld(reset).journal).toEqual(baseline.journal);
    });
    it(id + ':resume', () => {
      const w = fresh();
      solve(w, id);
      const resumed = loadWorld(saveWorld(w), []);
      expect(passed(resumed)).toBe(true);
      expect(resumed.integrations).toEqual(w.integrations);
      expect(resumed.serviceHealth).toEqual(w.serviceHealth);
    });
    it(id + ':isolation', () => {
      const a = fresh(),
        b = fresh(),
        before = saveWorld(b);
      solve(a, id);
      expect(saveWorld(b)).toEqual(before);
      expect(passed(b)).toBe(false);
    });
  });
}
it('does not poll, change a KV checkpoint or evaluate KPIs from passive grading', () => {
  for (let n = 83; n <= 88; n++) {
    const id = 'SP-' + String(n).padStart(3, '0'),
      d = definition(id),
      w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
    setupFoundation(w, d.setup ?? []);
    const before = saveWorld(w);
    for (const c of d.checks as FoundationCheck[]) foundationCheck(w, c);
    expect(saveWorld(w)).toEqual(before);
  }
});
