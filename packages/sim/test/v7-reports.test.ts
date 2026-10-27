import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  setupFoundation,
  foundationCheck,
  foundationAnswer,
  engineeringLessonSchema,
  saveWorld,
  loadWorld,
  runSearch,
  recordSearchEvidence,
  saveReport,
  executeReport,
  changeIndex,
  tickWorld,
  resolveHost,
  restartSplunk,
  TerminalSession,
} from '../src/index';
import type { FoundationCheck } from '../src/engineering/foundations';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
const dir = new URL('../../../lessons/v7/', import.meta.url),
  profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const lessons = readdirSync(dir)
  .filter((n) => /^SP-0(?:3[5-9]|4[0-6])\.json$/.test(n))
  .map((n) => engineeringLessonSchema.parse(JSON.parse(readFileSync(new URL(n, dir), 'utf8'))));
function solve(w: ReturnType<typeof createWorld>, id: string) {
  let seq = 0;
  const search = (text: string, inspected = false) => {
    const outcome = runSearch(w, { search: text, earliest: '-15m', latest: 'now' });
    expect(outcome.status).toBe('done');
    recordSearchEvidence(w, {
      id: 'exercise-job-' + seq++,
      search: text,
      earliest: outcome.earliest,
      latest: outcome.latest,
      status: outcome.status,
      scanCount: outcome.scan?.scanned ?? 0,
      workUnits: outcome.workUnits,
      resultCount: outcome.kind === 'events' ? outcome.events.length : outcome.results.length,
      inspected,
    });
  };
  const summaryIndex = () =>
    changeIndex(w, 'idx01', 'source_stats', { frozenTimePeriodInSecs: 2592000 }, { create: true });
  const report = (title: string, summary = false, scheduled = false) =>
    saveReport(w, {
      host: 'sh01',
      app: 'search',
      owner: 'admin',
      sharing: 'Private',
      title,
      search: 'index=source_logs | stats count by status',
      earliest: scheduled ? '-1m@m' : '-15m',
      latest: scheduled ? '@m' : 'now',
      scheduled,
      cron: '* * * * *',
      summaryIndex: summary ? 'source_stats' : undefined,
    });
  switch (Number(id.slice(3))) {
    case 35:
      search('index=source_logs status=500 | table status service');
      search('index=source_logs status=200 | table status service');
      break;
    case 36:
      search('index=source_logs | stats count by status', true);
      search('index=source_logs | timechart span=1m count', true);
      break;
    case 37:
      search(
        'index=source_logs | rex "service=(?<service_name>\\w+)" | eval is_error=if(status>=500,1,0) | stats sum(is_error) as errors by service_name',
      );
      break;
    case 38:
      search(
        '| makeresults | eval service="checkout", owner="platform" | fields service owner | outputlookup service_owners.csv',
      );
      search('index=source_logs | lookup service_owners.csv service OUTPUT owner | stats count by owner');
      break;
    case 39:
      search('index=source_logs | table status service', true);
      search('index=source_logs status=200 | table status service', true);
      break;
    case 40:
      executeReport(w, report('Errors by status').id);
      break;
    case 41: {
      const t = new TerminalSession({ world: w });
      t.start();
      t.input('ssh splunk@sh01\r');
      t.input(
        "curl -k -u admin:training-only https://localhost:8089/servicesNS/nobody/search/saved/searches -d name='Configuration report' -d 'search=index=source_logs | stats count by status' -d dispatch.earliest_time=-15m -d dispatch.latest_time=now\r",
      );
      t.input(
        'curl -k -u admin:training-only https://localhost:8089/servicesNS/nobody/search/saved/searches/Configuration%20report/dispatch -d trigger_actions=0\r',
      );
      t.dispose();
      break;
    }
    case 42:
      saveReport(w, {
        host: 'sh01',
        app: 'search',
        owner: 'admin',
        sharing: 'Private',
        title: 'Minute errors',
        search: 'index=source_logs status=500 | stats count',
        earliest: '-1m@m',
        latest: '@m',
        scheduled: true,
        cron: '* * * * *',
      });
      tickWorld(w, 5);
      break;
    case 43:
      summaryIndex();
      executeReport(w, report('Summary comparison', true).id);
      break;
    case 44:
      summaryIndex();
      break;
    case 45:
      summaryIndex();
      report('Minute status summary', true, true);
      tickWorld(w, 5);
      tickWorld(w, 6);
      break;
    case 46: {
      tickWorld(w, 5);
      expect(w.reports!.runs.at(-1)!.status).toBe('failed');
      summaryIndex();
      const sh = resolveHost(w, 'sh01')!,
        fs = hostFs(w, sh),
        path = '/opt/splunk/etc/apps/search/local/savedsearches.conf';
      fs.writeFile(
        path,
        patchConf(fs.readFile(path, ROOT), 'Configuration summary', {
          'action.summary_index._name': 'source_stats',
        }),
        ROOT,
      );
      restartSplunk(w, sh);
      const logs = hostFs(w, resolveHost(w, 'idx01')!),
        source = '/var/log/practice/reports.log';
      logs.writeFile(source, logs.readFile(source, ROOT) + logs.readFile(source, ROOT), ROOT);
      tickWorld(w, 1);
      tickWorld(w, 5);
      break;
    }
  }
}
for (const definition of lessons)
  describe(definition.id, () => {
    const checks = definition.checks as FoundationCheck[];
    const fresh = () => {
      const w = createWorld(profileWorldConfig(profile));
      setupFoundation(w, definition.setup ?? []);
      w.lesson = {
        id: definition.id,
        learner: 'Reports regression',
        startedTick: w.clock.tick,
        hints: 0,
        notes: '',
      };
      return w;
    };
    const passed = (w: ReturnType<typeof fresh>) => checks.every((c) => foundationCheck(w, c));
    const answers = (w: ReturnType<typeof fresh>) => {
      w.lesson!.answers = Object.fromEntries(
        checks.filter((c) => c.kind === 'answer').map((c) => [c.id, foundationAnswer(w, c)!]),
      );
    };
    const complete = (w: ReturnType<typeof fresh>) => {
      solve(w, definition.id);
      answers(w);
    };
    it(`${definition.id}:solution`, () => {
      const w = fresh();
      expect(passed(w)).toBe(false);
      complete(w);
      expect(checks.map((c) => ({ label: c.label, passed: foundationCheck(w, c) }))).toEqual(
        checks.map((c) => ({ label: c.label, passed: true })),
      );
    });
    it(`${definition.id}:incorrect-action`, () => {
      const w = fresh();
      answers(w);
      const wrong = runSearch(w, { search: 'index=wrong_destination | stats count' });
      recordSearchEvidence(w, {
        id: 'wrong',
        search: wrong.search,
        earliest: wrong.earliest,
        latest: wrong.latest,
        status: wrong.status,
        scanCount: 0,
        workUnits: wrong.workUnits,
        resultCount: 1,
        inspected: true,
      });
      expect(passed(w)).toBe(false);
    });
    it(`${definition.id}:no-false-completion`, () => {
      const w = fresh();
      complete(w);
      const untouched = fresh();
      untouched.lesson!.answers = w.lesson!.answers;
      expect(passed(untouched)).toBe(false);
    });
    it(`${definition.id}:reset`, () => {
      const w = fresh(),
        baseline = saveWorld(w);
      complete(w);
      const reset = loadWorld(baseline, []);
      expect(passed(reset)).toBe(false);
      expect(saveWorld(reset)).toEqual(baseline);
    });
    it(`${definition.id}:resume`, () => {
      const w = fresh();
      complete(w);
      const loaded = loadWorld(saveWorld(w), []);
      expect(passed(loaded)).toBe(true);
      expect(loaded.reports).toEqual(w.reports);
      expect(loaded.searchEvidence).toEqual(w.searchEvidence);
    });
    it(`${definition.id}:isolation`, () => {
      const free = fresh(),
        other = fresh(),
        before = saveWorld(free);
      complete(other);
      expect(passed(other)).toBe(true);
      expect(saveWorld(free)).toEqual(before);
    });
  });
