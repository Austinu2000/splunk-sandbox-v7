import { readFileSync, readdirSync, existsSync } from 'node:fs';
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
  tickWorld,
  resolveHost,
  restartSplunk,
  startSplunk,
  inspectPlatform,
  configureMonitor,
  runSearch,
  recordSearchEvidence,
  indexBuckets,
  thawPracticeBucket,
  saveReport,
  listReports,
  configureCimFixture,
  stageDataModel,
  buildDataModel,
  AUTH_MODEL_SOURCE,
  executeReport,
  reviewNotable,
  stageResponseAdapter,
  respondToNotable,
  RESPONSE_ADAPTER_SOURCE,
} from '../src';
import type { FoundationCheck } from '../src/engineering/foundations';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
import { applyClusterBundle } from '../src/hosts/cluster';
const dir = new URL('../../../lessons/v7/', import.meta.url),
  drafts = new URL('../../../lessons/v7-drafts/', import.meta.url),
  profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const lessons = readdirSync(existsSync(new URL('SP-069.json', dir)) ? dir : drafts)
  .filter((n) => /^SP-0(?:69|7\d|80)\.json$/.test(n))
  .map((n) =>
    engineeringLessonSchema.parse(
      JSON.parse(readFileSync(new URL(n, existsSync(new URL('SP-069.json', dir)) ? dir : drafts), 'utf8')),
    ),
  );
const config = (
  w: ReturnType<typeof createWorld>,
  host: string,
  conf: string,
  stanza: string,
  values: Record<string, string>,
) => {
  const fs = hostFs(w, resolveHost(w, host)!),
    path = '/opt/splunk/etc/system/local/' + conf + '.conf';
  fs.writeFile(path, patchConf(fs.exists(path) ? fs.readFile(path, ROOT) : '', stanza, values), ROOT);
  restartSplunk(w, resolveHost(w, host)!);
};
const bundle = (w: ReturnType<typeof createWorld>, index: string, settings: Record<string, string>) => {
  const cm = resolveHost(w, 'cm01')!,
    fs = hostFs(w, cm),
    path = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
  fs.writeFile(path, patchConf(fs.readFile(path, ROOT), index, settings), ROOT);
  applyClusterBundle(w, cm);
};
function solve(w: ReturnType<typeof createWorld>, id: string) {
  const n = Number(id.slice(3));
  let seq = 0;
  const search = (q: string) => {
    const r = runSearch(w, { host: 'sh01', search: q, earliest: '-15m', latest: 'now' });
    expect(r.status).toBe('done');
    recordSearchEvidence(w, {
      id: 'monitoring-job-' + seq++,
      search: q,
      earliest: r.earliest,
      latest: r.latest,
      status: r.status,
      scanCount: r.scan?.scanned ?? 0,
      workUnits: r.workUnits,
      resultCount: r.kind === 'events' ? r.events.length : r.results.length,
      inspected: true,
    });
    return r;
  };
  if (n === 69) {
    startSplunk(w, resolveHost(w, 'idx02')!);
    inspectPlatform(w, 'idx02');
    search('index=ops_logs | stats count');
  }
  if (n === 70) {
    config(w, 'hf01', 'limits', 'thruput', { maxKBps: '0' });
    tickWorld(w, 1);
    search('index=ops_logs | stats count');
  }
  if (n === 71) {
    configureMonitor(w, 'hf01', '/var/log/practice/operations.log', {
      index: 'ops_logs',
      sourcetype: 'v7_operations',
    });
    tickWorld(w, 1);
    search('index=ops_logs | stats count');
  }
  if (n === 72) {
    configureMonitor(w, 'idx01', '/var/log/practice/noise.log', {
      index: 'ops_logs',
      sourcetype: 'v7_noise',
      disabled: '1',
    });
    tickWorld(w, 7);
    search('index=_internal source=*license_usage.log type=Usage st=v7_noise | stats sum(b) as bytes');
  }
  if (n === 73) {
    bundle(w, 'ops_logs', {
      repFactor: 'auto',
      coldToFrozenDir: '/var/archive/ops_logs',
      frozenTimePeriodInSecs: '1',
      maxHotIdleSecs: '1',
    });
    tickWorld(w, 2);
    const bucket = indexBuckets(w).find((b) => b.index === 'ops_logs')!;
    expect(bucket.archived).toBe(true);
    thawPracticeBucket(w, bucket.id);
    search('index=ops_logs | stats count');
  }
  if (n === 74) {
    for (let i = 1; i <= 5; i++) {
      const r = listReports(w, 'sh01').find((r) => r.title === 'Capacity report ' + i)!;
      saveReport(w, { ...r, cron: i + 4 + ' * * * *' }, { id: r.id, revision: r.revision });
    }
    tickWorld(w, 60);
    inspectPlatform(w);
  }
  if (n === 75) {
    saveReport(
      w,
      {
        host: 'sh01',
        app: 'search',
        owner: 'admin',
        sharing: 'App',
        title: 'Evidence report',
        search: 'index=ops_logs | stats count',
        scheduled: true,
        cron: '* * * * *',
      },
      { create: true },
    );
    tickWorld(w, Math.ceil((60000 - (w.clock.now % 60000)) / w.config.tickMs));
    search(
      'index=_internal source=*scheduler.log savedsearch_name="Evidence report" status=success | stats count',
    );
  }
  if (n === 76) {
    const a = search('index=ops_logs | sort service | stats count by status'),
      b = search('index=ops_logs | stats count by status');
    expect(a.workUnits).toBeGreaterThan(b.workUnits);
    expect(a.results.map((r) => JSON.stringify(r.toObject())).sort()).toEqual(
      b.results.map((r) => JSON.stringify(r.toObject())).sort(),
    );
  }
  if (n === 77) {
    configureCimFixture(w);
    search('index=ops_logs tag=authentication action=failure | stats count by user src action');
  }
  if (n === 78) {
    stageDataModel(w, 'sh01', 'v7_cim', AUTH_MODEL_SOURCE, { enabled: true, earliest: '-15m' });
    restartSplunk(w, resolveHost(w, 'sh01')!);
    buildDataModel(w, 'sh01', 'Authentication');
    search('| tstats summariesonly=true count from datamodel=Authentication.Authentication');
  }
  if (n === 79) {
    bundle(w, 'notable', { repFactor: 'auto' });
    const r = saveReport(
      w,
      {
        host: 'sh01',
        app: 'search',
        owner: 'admin',
        sharing: 'App',
        title: 'Authentication failure detection',
        search: 'index=ops_logs tag=authentication action=failure | stats count by user',
        alert: {
          type: 'custom',
          condition: 'search count > 1',
          relation: 'greater than',
          threshold: 0,
          digest: false,
          suppress: true,
          period: '5m',
          fields: ['user'],
          track: true,
          severity: 4,
          actions: ['notable'],
        },
      },
      { create: true },
    );
    expect(executeReport(w, r.id).status).toBe('succeeded');
    executeReport(w, r.id);
    reviewNotable(w, 'sh01', w.security!.notables[0]!.id, {
      status: 'in-progress',
      owner: 'admin',
      note: 'Source authentication results independently verified.',
    });
  }
  if (n === 80) {
    const id = w.security!.notables[0]!.id;
    stageResponseAdapter(w, 'sh01', RESPONSE_ADAPTER_SOURCE);
    expect(respondToNotable(w, 'sh01', id).status).toBe('created');
    expect(respondToNotable(w, 'sh01', id).status).toBe('existing');
    reviewNotable(w, 'sh01', id, {
      status: 'in-progress',
      owner: 'admin',
      note: 'Authentication failure repaired; one stable ticket across retry.',
    });
  }
}
for (const d of lessons)
  describe(d.id, () => {
    const fresh = () => {
        const w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
        setupFoundation(w, d.setup ?? []);
        w.lesson = {
          id: d.id,
          learner: 'Monitoring regression',
          startedTick: w.clock.tick,
          hints: 0,
          notes: '',
        };
        return w;
      },
      checks = d.checks as FoundationCheck[],
      passed = (w: ReturnType<typeof fresh>) => checks.every((c) => foundationCheck(w, c));
    it(d.id + ':solution', () => {
      const w = fresh();
      expect(passed(w)).toBe(false);
      solve(w, d.id);
      expect(checks.map((c) => ({ label: c.label, passed: foundationCheck(w, c) }))).toEqual(
        checks.map((c) => ({ label: c.label, passed: true })),
      );
    });
    it(d.id + ':incorrect-action', () => {
      const w = fresh();
      config(w, 'idx02', 'limits', 'thruput', { maxKBps: '0' });
      expect(passed(w)).toBe(false);
    });
    it(d.id + ':no-false-completion', () => {
      const a = fresh(),
        b = fresh();
      solve(a, d.id);
      expect(passed(a)).toBe(true);
      expect(passed(b)).toBe(false);
    });
    it(d.id + ':reset', () => {
      const w = fresh(),
        baseline = saveWorld(w);
      solve(w, d.id);
      expect(passed(w)).toBe(true);
      const reset = loadWorld(baseline, []);
      expect(passed(reset)).toBe(false);
      expect(saveWorld(reset).journal).toEqual(baseline.journal);
    });
    it(d.id + ':resume', () => {
      const w = fresh();
      solve(w, d.id);
      const resumed = loadWorld(saveWorld(w), []);
      expect(passed(resumed)).toBe(true);
      expect(resumed.security).toEqual(w.security);
      expect(resumed.dataModels).toEqual(w.dataModels);
      expect(resumed.ingestionBuffers).toEqual(w.ingestionBuffers);
    });
    it(d.id + ':isolation', () => {
      const a = fresh(),
        b = fresh(),
        baseline = saveWorld(b);
      solve(a, d.id);
      expect(saveWorld(b)).toEqual(baseline);
      expect(passed(b)).toBe(false);
    });
  });
