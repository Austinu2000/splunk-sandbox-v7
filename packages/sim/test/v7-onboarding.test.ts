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
  changeIndex,
  configureMonitor,
  uploadPracticeFile,
  tickWorld,
  configureHec,
  receiveHec,
  indexBuckets,
  thawPracticeBucket,
  restartSplunk,
  resolveHost,
  saveWorld,
  loadWorld,
  TerminalSession,
  logAction,
} from '../src/index';
import type { FoundationCheck } from '../src/engineering/foundations';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
const dir = new URL('../../../lessons/v7/', import.meta.url),
  profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const lessons = readdirSync(dir)
  .filter((n) => /^SP-0(?:0[6-9]|1\d|2[0-5])\.json$/.test(n))
  .map((n) => engineeringLessonSchema.parse(JSON.parse(readFileSync(new URL(n, dir), 'utf8'))));
function setConf(
  w: ReturnType<typeof createWorld>,
  host: string,
  conf: string,
  stanza: string,
  values: Record<string, string>,
  file?: string,
) {
  const h = resolveHost(w, host)!,
    fs = hostFs(w, h),
    path = file ?? h.splunk!.home + '/etc/system/local/' + conf + '.conf';
  fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(path, patchConf(fs.exists(path) ? fs.readFile(path, ROOT) : '', stanza, values), ROOT);
}
function solve(w: ReturnType<typeof createWorld>, id: string) {
  const n = Number(id.slice(3)),
    create = (name = 'application_logs', values: Record<string, unknown> = {}) =>
      changeIndex(w, 'idx01', name, values, { create: true });
  const monitor = (path: string, index = 'application_logs', st = 'app_log', host = 'idx01') =>
    configureMonitor(w, host, path, { index, sourcetype: st, disabled: 'false' });
  const upload = (path: string, text: string, host = 'idx01') => uploadPracticeFile(w, host, path, text);
  const restart = (host = 'idx01') => restartSplunk(w, resolveHost(w, host)!);
  const terminal = (commands: string[]) => {
    const t = new TerminalSession({
      world: w,
      onCommand: (e) =>
        logAction(w, { kind: 'cmd', host: e.host, user: e.user, text: e.line, success: e.success }, 0),
    });
    t.start();
    for (const command of commands) t.input(command + '\r');
    t.dispose();
  };
  const grant = () => {
    setConf(w, 'sh01', 'authorize', 'role_user', { srchIndexesAllowed: 'main;os;application_logs' });
    restart('sh01');
  };
  const output = () => {
    setConf(w, 'hf01', 'outputs', 'tcpout', { defaultGroup: 'practice' });
    setConf(w, 'hf01', 'outputs', 'tcpout:practice', { server: 'idx01:9997' });
    restart('hf01');
  };
  switch (n) {
    case 6:
      create();
      grant();
      break;
    case 7:
      create('application_logs', { frozenTimePeriodInSecs: 2592000 });
      break;
    case 8:
      terminal([
        'ssh splunk@idx01',
        'splunk add index application_logs -frozenTimePeriodInSecs 2592000',
        'splunk list index application_logs',
        'splunk btool indexes list application_logs --debug',
      ]);
      break;
    case 9:
      create('application_events');
      create('application_metrics', { datatype: 'metric' });
      create('application_summary');
      break;
    case 10:
      setConf(
        w,
        'idx01',
        'indexes',
        'application_logs',
        {
          homePath: '$SPLUNK_DB/application_logs/db',
          coldPath: '$SPLUNK_DB/application_logs/colddb',
          thawedPath: '$SPLUNK_DB/application_logs/thaweddb',
        },
        '/opt/splunk/etc/apps/application_indexes/local/indexes.conf',
      );
      restart();
      break;
    case 11:
      create('application_logs', { frozenTimePeriodInSecs: 20, maxTotalDataSizeMB: 1 });
      upload('/var/log/practice/retention.log', 'status=200\n');
      monitor('/var/log/practice/retention.log');
      tickWorld(w, 1);
      tickWorld(w, 3);
      break;
    case 12:
      create('lifecycle_logs', {
        maxHotIdleSecs: 10,
        maxWarmDBCount: 1,
        frozenTimePeriodInSecs: 60,
        coldToFrozenDir: '/archive/lifecycle_logs',
      });
      monitor('/var/log/practice/life.log', 'lifecycle_logs');
      upload('/var/log/practice/life.log', 'status=200\n');
      tickWorld(w, 1);
      upload('/var/log/practice/life.log', 'status=200\nstatus=500\n');
      tickWorld(w, 1);
      tickWorld(w, 8);
      thawPracticeBucket(w, indexBuckets(w)[0]!.id);
      break;
    case 13:
    case 14:
      setConf(
        w,
        'cm01',
        'indexes',
        'application_logs',
        {
          homePath: '$SPLUNK_DB/application_logs/db',
          coldPath: '$SPLUNK_DB/application_logs/colddb',
          thawedPath: '$SPLUNK_DB/application_logs/thaweddb',
          repFactor: 'auto',
        },
        '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf',
      );
      terminal(['ssh splunk@cm01', 'splunk validate cluster-bundle', 'splunk apply cluster-bundle', 'y']);
      break;
    case 15:
      create();
      upload(
        '/var/log/practice/application.log',
        'status=500 service=checkout\nstatus=200 service=checkout\n',
      );
      monitor('/var/log/practice/application.log');
      tickWorld(w, 1);
      break;
    case 16:
      create();
      upload('/var/log/practice/access.log', 'status=500\n');
      monitor('/var/log/practice/access.log');
      tickWorld(w, 1);
      grant();
      break;
    case 17:
      create('linux_logs');
      upload('/var/log/practice/linux.log', 'status=200\nstatus=500\n');
      monitor('/var/log/practice/linux.log', 'linux_logs', 'linux_training');
      tickWorld(w, 1);
      break;
    case 18: {
      create();
      monitor('/var/log/practice/blocked.log');
      tickWorld(w, 1);
      const fs = hostFs(w, resolveHost(w, 'idx01')!);
      fs.setMeta('/var/log/practice/blocked.log', { owner: 'splunk', group: 'splunk', mode: 0o640 }, ROOT);
      tickWorld(w, 1);
      break;
    }
    case 19: {
      create('hec_logs');
      const input = configureHec(w, 'idx01', 'application', {
        index: 'hec_logs',
        sourcetype: 'hec_training',
      });
      receiveHec(w, 'idx01', 'https://idx01:8088/services/collector/event', 'Splunk ' + input.token, {
        event: 'status=201 service=checkout',
        source: 'hec-training',
      });
      break;
    }
    case 20:
      create('pipeline_logs');
      output();
      monitor('/var/log/practice/pipeline.log', 'pipeline_logs', 'pipeline_training', 'hf01');
      tickWorld(w, 1);
      break;
    case 21:
      create();
      setConf(w, 'idx01', 'props', 'timestamp_training', {
        TIME_PREFIX: 'logged=',
        TIME_FORMAT: '%Y-%m-%dT%H:%M:%SZ',
        TZ: 'UTC',
      });
      restart();
      monitor('/var/log/practice/timestamp.log', 'application_logs', 'timestamp_training');
      tickWorld(w, 1);
      break;
    case 22:
      create();
      setConf(w, 'idx01', 'props', 'stack_training', {
        SHOULD_LINEMERGE: 'true',
        LINE_BREAKER: '([\\r\\n]+)(?=START)',
      });
      restart();
      monitor('/var/log/practice/stack.log', 'application_logs', 'stack_training');
      tickWorld(w, 1);
      break;
    case 23:
      create();
      monitor('/var/log/practice/orders.log', 'application_logs', 'orders_training');
      tickWorld(w, 1);
      setConf(w, 'sh01', 'props', 'orders_training', { 'EXTRACT-order': 'order:(?<order_id>[A-Z0-9]+)' });
      restart('sh01');
      break;
    case 24:
      create('checkout_logs');
      setConf(w, 'idx01', 'props', 'route_training', { 'TRANSFORMS-route': 'checkout_route' });
      setConf(w, 'idx01', 'transforms', 'checkout_route', {
        REGEX: 'service=checkout',
        DEST_KEY: '_MetaData:Index',
        FORMAT: 'checkout_logs',
      });
      restart();
      monitor('/var/log/practice/route.log', 'main', 'route_training');
      tickWorld(w, 1);
      break;
    case 25: {
      create('pipeline_logs');
      tickWorld(w, 1);
      output();
      monitor('/var/log/practice/broken.log', 'pipeline_logs', 'pipeline_training', 'hf01');
      hostFs(w, resolveHost(w, 'hf01')!).setMeta(
        '/var/log/practice/broken.log',
        { owner: 'splunk', group: 'splunk', mode: 0o640 },
        ROOT,
      );
      tickWorld(w, 1);
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
      w.lesson = { id: definition.id, learner: 'Onboarding regression', startedTick: 0, hints: 0, notes: '' };
      return w;
    };
    const passed = (w: ReturnType<typeof fresh>) => checks.every((check) => foundationCheck(w, check));
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
      if (!['SP-013', 'SP-014'].includes(definition.id))
        changeIndex(w, 'idx01', 'wrong_destination', {}, { create: true });
      expect(passed(w)).toBe(false);
    });
    it(`${definition.id}:no-false-completion`, () => {
      const w = fresh();
      complete(w);
      const untouched = fresh();
      untouched.lesson!.answers = w.lesson!.answers;
      untouched.actions = [...w.actions];
      expect(passed(untouched)).toBe(false);
    });
    it(`${definition.id}:reset`, () => {
      const w = fresh(),
        before = saveWorld(w);
      complete(w);
      const reset = loadWorld(before, []);
      expect(passed(reset)).toBe(false);
      expect(saveWorld(reset)).toEqual(before);
    });
    it(`${definition.id}:resume`, () => {
      const w = fresh();
      complete(w);
      const loaded = loadWorld(saveWorld(w), []);
      expect(passed(loaded)).toBe(true);
      expect(loaded.ingestion).toEqual(w.ingestion);
      tickWorld(loaded, 1);
      expect(loaded.ingestion?.events.length).toBe(w.ingestion?.events.length);
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
