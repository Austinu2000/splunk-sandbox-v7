import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  indexCatalog,
  indexExists,
  changeIndex,
  removeIndex,
  runSearch,
  configureMonitor,
  uploadPracticeFile,
  tickWorld,
  recordedEvents,
  saveWorld,
  loadWorld,
  restartSplunk,
  resolveHost,
  TerminalSession,
  stripAnsi,
  validateClusterIndexes,
  appendRecordedEvents,
} from '../src/index';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
import { applyClusterBundle, managerBundle } from '../src/hosts/cluster';
const lab = () =>
  createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
function standalone(world: ReturnType<typeof lab>, name = 'idx01') {
  const host = resolveHost(world, name)!,
    fs = hostFs(world, host),
    path = '/opt/splunk/etc/system/local/server.conf';
  fs.writeFile(path, patchConf(fs.readFile(path, ROOT), 'clustering', { mode: 'disabled' }), ROOT);
  restartSplunk(world, host);
}
const count = (world: ReturnType<typeof lab>, index: string) => {
  const result = runSearch(world, { search: `index=${index} | stats count`, earliest: '-24h' });
  expect(result.status).toBe('done');
  return result.results[0]?.get('count') ?? 0;
};
describe('shared index administration', () => {
  it('creates an empty standalone index visible in CLI, REST-shaped SPL and catalog', () => {
    const world = lab();
    standalone(world);
    changeIndex(world, 'idx01', 'application_logs', { frozenTimePeriodInSecs: 2592000 }, { create: true });
    expect(indexExists(world, 'application_logs', 'idx01')).toBe(true);
    expect(indexCatalog(world, 'idx01').find((i) => i.name === 'application_logs')).toMatchObject({
      pending: false,
      currentDBSizeMB: 0,
      deployment: 'standalone',
    });
    expect(count(world, 'application_logs')).toBe(0);
    const result = runSearch(world, {
      search: '| rest /services/data/indexes splunk_server=idx01 | search title=application_logs',
    });
    expect(result.results).toHaveLength(1);
    let out = '';
    const term = new TerminalSession({ world });
    term.onOutput((s) => (out += s));
    term.start();
    term.input('ssh splunk@idx01\r');
    out = '';
    term.input('splunk list index application_logs\r');
    expect(stripAnsi(out)).toContain('frozenTimePeriodInSecs = 2592000');
    term.dispose();
  });
  it('enforces names, settings, capability checks and optimistic revisions without partial writes', () => {
    const world = lab();
    standalone(world);
    const before = saveWorld(world);
    for (const name of ['_bad', 'bad Name', 'UpperCase', 'has_kvstore', '../bad'])
      expect(() => changeIndex(world, 'idx01', name, {}, { create: true })).toThrow();
    expect(() => changeIndex(world, 'idx01', 'good', { unknownFlag: 'ignored' }, { create: true })).toThrow(
      /Unsupported/,
    );
    expect(() =>
      changeIndex(world, 'idx01', 'good', { frozenTimePeriodInSecs: -1 }, { create: true }),
    ).toThrow();
    expect(() => changeIndex(world, 'idx01', 'good', {}, { create: true, principal: 'analyst' })).toThrow(
      /Permission denied/,
    );
    expect(() =>
      changeIndex(world, 'idx01', 'good', {}, { create: true, expectedRevision: 'stale' }),
    ).toThrow(/changed/);
    expect(saveWorld(world)).toEqual(before);
  });
  it('keeps restart-required changes staged, including repeated edits and unrelated new indexes', () => {
    const world = lab();
    standalone(world);
    changeIndex(world, 'idx01', 'new_app', {}, { create: true });
    changeIndex(world, 'idx01', 'new_app', { homePath: '$SPLUNK_DB/new_app_v2/db' });
    expect(indexCatalog(world, 'idx01').find((i) => i.name === 'new_app')!.settings.homePath).toBe(
      '$SPLUNK_DB/new_app/db',
    );
    expect(changeIndex(world, 'idx01', 'new_app', { maxTotalDataSizeMB: 20 }).restartRequired).toBe(true);
    expect(changeIndex(world, 'idx01', 'second_app', {}, { create: true }).restartRequired).toBe(true);
    expect(indexExists(world, 'second_app')).toBe(false);
    restartSplunk(world, resolveHost(world, 'idx01')!);
    expect(indexExists(world, 'second_app')).toBe(true);
    expect(indexCatalog(world, 'idx01').find((i) => i.name === 'new_app')!.settings.homePath).toBe(
      '$SPLUNK_DB/new_app_v2/db',
    );
  });
  it('rejects direct cluster creation and validates before any bundle mutation', () => {
    const world = lab();
    expect(() => changeIndex(world, 'idx01', 'application_logs', {}, { create: true })).toThrow(
      /Cluster Manager/,
    );
    const cm = resolveHost(world, 'cm01')!,
      fs = hostFs(world, cm),
      path = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
    fs.writeFile(
      path,
      fs.readFile(path, ROOT) +
        '\n[application_logs]\nhomePath=$SPLUNK_DB/application_logs/db\ncoldPath=$SPLUNK_DB/application_logs/colddb\nthawedPath=$SPLUNK_DB/application_logs/thaweddb\n',
      ROOT,
    );
    const before = saveWorld(world);
    expect(() => applyClusterBundle(world, cm)).toThrow(/repFactor/);
    expect(saveWorld(world)).toEqual(before);
    fs.writeFile(path, patchConf(fs.readFile(path, ROOT), 'application_logs', { repFactor: 'auto' }), ROOT);
    expect(() => validateClusterIndexes(managerBundle(world, cm))).not.toThrow();
    applyClusterBundle(world, cm);
    for (const peer of ['idx01', 'idx02', 'idx03'])
      expect(indexExists(world, 'application_logs', peer)).toBe(true);
    expect(count(world, 'application_logs')).toBe(0);
  });
  it('does not write events until an effective input receives explicitly provided data', () => {
    const world = lab();
    standalone(world);
    changeIndex(world, 'idx01', 'application_logs', {}, { create: true });
    uploadPracticeFile(
      world,
      'idx01',
      '/var/log/practice/app.log',
      'status=500 service=checkout\nstatus=200 service=checkout\n',
    );
    tickWorld(world, 1);
    expect(count(world, 'application_logs')).toBe(0);
    configureMonitor(world, 'idx01', '/var/log/practice/app.log', {
      index: 'application_logs',
      sourcetype: 'app_log',
    });
    tickWorld(world, 1);
    expect(count(world, 'application_logs')).toBe(2);
    tickWorld(world, 3);
    expect(count(world, 'application_logs')).toBe(2);
    const rows = runSearch(world, { search: 'index=application_logs | stats count by status' }).results;
    expect(rows.map((r) => r.get('status')).sort()).toEqual(['200', '500']);
    expect(
      indexCatalog(world, 'idx01').find((i) => i.name === 'application_logs')!.currentDBSizeMB,
    ).toBeGreaterThan(0);
    expect(() => removeIndex(world, 'idx01', 'application_logs')).toThrow(/empty/);
  });
  it('holds unreadable/misrouted data as a diagnosable backlog and delivers after repair', () => {
    const world = lab();
    standalone(world);
    uploadPracticeFile(world, 'idx01', '/var/log/practice/blocked.log', 'status=500\n');
    configureMonitor(world, 'idx01', '/var/log/practice/blocked.log', {
      index: 'not_created',
      sourcetype: 'app_log',
    });
    tickWorld(world, 1);
    expect(Object.values(world.ingestion!.status)[0]!.error).toContain('missing');
    changeIndex(world, 'idx01', 'not_created', {}, { create: true });
    tickWorld(world, 1);
    expect(count(world, 'not_created')).toBe(1);
    const saved = saveWorld(world),
      loaded = loadWorld(saved, []);
    expect(recordedEvents(loaded)).toEqual(recordedEvents(world));
    tickWorld(loaded, 2);
    expect(count(loaded, 'not_created')).toBe(1);
  });
  it('respects event retention and size limits in both catalog and searches', () => {
    const world = lab();
    standalone(world);
    changeIndex(
      world,
      'idx01',
      'short_lived',
      { frozenTimePeriodInSecs: 20, maxTotalDataSizeMB: 1 },
      { create: true },
    );
    configureMonitor(world, 'idx01', '/var/log/practice/expire.log', {
      index: 'short_lived',
      sourcetype: 'app_log',
    });
    uploadPracticeFile(world, 'idx01', '/var/log/practice/expire.log', 'status=200\n');
    tickWorld(world, 1);
    expect(count(world, 'short_lived')).toBe(1);
    tickWorld(world, 3);
    expect(count(world, 'short_lived')).toBe(0);
    expect(indexCatalog(world, 'idx01').find((i) => i.name === 'short_lived')!.currentDBSizeMB).toBe(0);
    changeIndex(world, 'idx01', 'size_limited', { maxTotalDataSizeMB: 1 }, { create: true });
    appendRecordedEvents(
      world,
      Array.from({ length: 700 }, (_, n) => ({
        time: world.clock.now,
        indexTime: world.clock.now,
        raw: 'x'.repeat(2048),
        host: 'idx01',
        source: 'explicit teaching batch',
        sourcetype: 'raw',
        index: 'size_limited',
        receiver: 'idx01',
        fields: {},
        provenance: 'input' as const,
        operationId: 'size-test-' + n,
      })),
    );
    expect(count(world, 'size_limited')).toBe(512);
    expect(indexCatalog(world, 'idx01').find((i) => i.name === 'size_limited')!.currentDBSizeMB).toBe(1);
  });
  it('denies restricted principals across catalog, REST-shaped search and event search', () => {
    const world = lab();
    standalone(world);
    changeIndex(world, 'idx01', 'restricted_app', {}, { create: true });
    configureMonitor(world, 'idx01', '/var/log/practice/restricted.log', {
      index: 'restricted_app',
      sourcetype: 'app_log',
    });
    uploadPracticeFile(world, 'idx01', '/var/log/practice/restricted.log', 'status=500\n');
    tickWorld(world, 1);
    expect(indexCatalog(world, 'idx01', 'analyst').some((i) => i.name === 'restricted_app')).toBe(false);
    expect(
      runSearch(world, {
        search: 'index=restricted_app | stats count',
        principal: 'analyst',
      }).results[0]!.get('count'),
    ).toBe(0);
    expect(
      runSearch(world, {
        search: '| rest /services/data/indexes | search title=restricted_app',
        principal: 'analyst',
      }).results,
    ).toEqual([]);
    expect(count(world, 'restricted_app')).toBe(1);
  });
  it('supports genuine CLI and simulated REST creation using the same service', () => {
    const world = lab();
    standalone(world);
    let output = '';
    const term = new TerminalSession({ world });
    term.onOutput((s) => (output += s));
    term.start();
    term.input('ssh splunk@idx01\r');
    term.input('splunk add index cli_app -frozenTimePeriodInSecs 86400\r');
    expect(indexExists(world, 'cli_app')).toBe(true);
    term.input(
      'curl -k -u admin:training-only https://localhost:8089/services/data/indexes -d name=rest_app\r',
    );
    expect(indexExists(world, 'rest_app')).toBe(true);
    output = '';
    term.input(
      'curl -k -u analyst:training-only https://localhost:8089/services/data/indexes -d name=denied_app\r',
    );
    expect(stripAnsi(output)).toContain('Permission denied');
    expect(indexExists(world, 'denied_app')).toBe(false);
    term.dispose();
    removeIndex(world, 'idx01', 'rest_app');
    expect(indexExists(world, 'rest_app')).toBe(false);
  });
});
