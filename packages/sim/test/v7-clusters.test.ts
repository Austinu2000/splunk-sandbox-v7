import { readFileSync, readdirSync } from 'node:fs';
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
  resolveHost,
  restartSplunk,
  stopSplunk,
  startSplunk,
  tickWorld,
  stageClusterSettings,
  stageClusterBundleFile,
  validateManagedClusterBundle,
  queueIndexerBundle,
  queueIndexerRestart,
  setClusterMaintenance,
  setClusterSiteOutage,
  evictSmartStoreBucket,
  smartStoreView,
  runSearch,
  recordSearchEvidence,
  stageShcBundleFile,
  queueShcBundle,
  saveReport,
  listReports,
  kvConfigureCollection,
  kvWrite,
  kvStage,
  kvInspect,
  kvResync,
  kvBackup,
  kvRestore,
  KV_APP,
} from '../src';
import type { FoundationCheck } from '../src/engineering/foundations';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
import { testTerm } from './helpers';
import { logAction } from '../src/interview/engine';
const directory = new URL('../../../lessons/v7/', import.meta.url);
const lessons = readdirSync(directory)
  .filter((n) => /^(?:SP-0(?:5[5-9]|6[0-8])|AU-(?:3[6-9]|4[0-3]))\.json$/.test(n))
  .map((n) => engineeringLessonSchema.parse(JSON.parse(readFileSync(new URL(n, directory), 'utf8'))));
function commands(w: ReturnType<typeof createWorld>, host: string, lines: string[], user = 'splunk') {
  const t = testTerm(w, undefined, (e) =>
    logAction(w, { kind: 'cmd', text: e.line, host: e.host, user: e.user, success: e.success }, 0),
  );
  try {
    t.run('ssh ' + user + '@' + host);
    if (user === 'svc_ansible') t.run('cd ~/splunk-automation');
    for (const line of lines) t.run(line);
  } finally {
    t.session.dispose();
  }
}
function actualSearch(w: ReturnType<typeof createWorld>, search = 'index=source_logs | stats count') {
  const r = runSearch(w, { search });
  expect(r.status).toBe('done');
  recordSearchEvidence(w, {
    id: 'verified-search-' + w.clock.tick,
    search,
    earliest: r.earliest,
    latest: r.latest,
    status: r.status,
    scanCount: r.scan?.scanned ?? 0,
    workUnits: r.workUnits,
    resultCount: r.results.length,
    inspected: true,
  });
  return r;
}
function solve(w: ReturnType<typeof createWorld>, id: string) {
  const cm = resolveHost(w, 'cm01')!;
  if (id.startsWith('AU-')) {
    const n = Number(id.slice(3)),
      path = {
        36: 'cluster_preflight',
        37: 'cluster_indexes',
        38: 'cluster_restart',
        39: 'shc_stage',
        40: 'shc_deploy',
        41: 'kv_collection',
        42: 'kv_backup',
        43: 'kv_restore',
      }[n]!;
    const limit = n <= 38 ? 'cm01' : n <= 40 ? 'deployer01' : 'sh01',
      line = 'ansible-playbook playbooks/v7_' + path + '.yml --limit ' + limit;
    if (n === 36) {
      commands(w, 'ansible01', [line], 'svc_ansible');
      const fs = hostFs(w, cm),
        p = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
      fs.writeFile(p, patchConf(fs.readFile(p, ROOT), 'automation_orders', { repFactor: 'auto' }), ROOT);
    }
    commands(w, 'ansible01', [line], 'svc_ansible');
    if ([37, 38, 40, 43].includes(n)) tickWorld(w, 20);
    if ([37, 40, 41].includes(n)) commands(w, 'ansible01', [line], 'svc_ansible');
    return;
  }
  const n = Number(id.slice(3));
  if (n === 55) commands(w, 'cm01', ['splunk show cluster-status --verbose', 'splunk list cluster-peers']);
  if (n === 56 || n === 61) {
    stageClusterSettings(w, 'idx03', { manager_uri: 'https://cm01:8089' });
    restartSplunk(w, resolveHost(w, 'idx03')!);
    if (n === 61) setClusterMaintenance(w, false);
    tickWorld(w, 20);
    if (n === 61) commands(w, 'cm01', ['splunk show cluster-status']);
  }
  if (n === 57) {
    const fs = hostFs(w, cm),
      p = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
    stageClusterBundleFile(
      w,
      '_cluster/local/indexes.conf',
      fs.readFile(p, ROOT) + '\n[cluster_orders]\nrepFactor=auto\n',
    );
    validateManagedClusterBundle(w, cm);
    queueIndexerBundle(w, cm);
    tickWorld(w, 20);
  }
  if (n === 58) {
    queueIndexerRestart(w, cm);
    tickWorld(w, 2);
    expect(actualSearch(w).results[0]?.get('count')).toBe(3);
    tickWorld(w, 20);
  }
  if (n === 59) {
    tickWorld(w, 20);
    setClusterSiteOutage(w, 'site1', true);
    expect(actualSearch(w).results[0]?.get('count')).toBe(3);
    setClusterSiteOutage(w, 'site1', false);
    tickWorld(w, 20);
  }
  if (n === 60) {
    const object = smartStoreView(w).objects[0]!;
    evictSmartStoreBucket(w, object.bucketId);
    expect(smartStoreView(w).fetches).toHaveLength(0);
    expect(actualSearch(w).results[0]?.get('count')).toBe(3);
  }
  if (n === 62) {
    stopSplunk(w, resolveHost(w, 'sh01')!);
    tickWorld(w, 1);
    startSplunk(w, resolveHost(w, 'sh01')!);
    tickWorld(w, 2);
  }
  if (n === 63) {
    stageShcBundleFile(
      w,
      'deployer01',
      'v7_status/local/savedsearches.conf',
      '[V7 cluster status]\nsearch=index=source_logs | stats count\n',
    );
    queueShcBundle(w, resolveHost(w, 'deployer01')!);
    tickWorld(w, 20);
  }
  if (n === 64) {
    const r = listReports(w, 'sh02').find((r) => r.title === 'V7 cluster status')!;
    saveReport(w, { ...r, search: 'index=source_logs | stats count' }, { id: r.id, revision: r.revision });
    tickWorld(w, 3);
  }
  if (n === 65) {
    kvConfigureCollection(w, 'sh01', KV_APP, 'service_owners', {
      'field.service': 'string',
      'field.owner': 'string',
      enforceTypes: 'true',
    });
    kvWrite(w, 'sh01', KV_APP, 'service_owners', [
      { _key: 'checkout', service: 'checkout', owner: 'Platform' },
      { _key: 'auth', service: 'auth', owner: 'Identity' },
    ]);
    kvStage(
      w,
      'sh01',
      KV_APP,
      'transforms',
      '[service_owners]\nexternal_type=kvstore\ncollection=service_owners\nfields_list=service,owner\n',
    );
    commands(w, 'sh01', ['splunk reload transforms']);
  }
  if (n === 66) {
    kvStage(w, 'sh01', KV_APP, 'server', '[kvstore]\nstorageEngine=wiredTiger\n');
    restartSplunk(w, resolveHost(w, 'sh01')!);
    kvInspect(w, 'sh01');
    kvBackup(w, 'sh01', 'v7_upgrade_ready');
  }
  if (n === 67) {
    kvStage(w, 'sh03', KV_APP, 'server', '[kvstore]\nport=8191\n');
    restartSplunk(w, resolveHost(w, 'sh03')!);
    tickWorld(w, 3);
    kvResync(w, 'sh01');
  }
  if (n === 68) {
    kvRestore(w, 'sh01', 'v7_verified');
    tickWorld(w, 3);
  }
}
describe('V7 cluster and KV lesson outcomes', () => {
  for (const definition of lessons)
    describe(definition.id, () => {
      const fresh = () => {
        const profile = parseProfile(
          readFileSync(
            new URL('../../../profiles/' + definition.environments[0] + '.yaml', import.meta.url),
            'utf8',
          ),
        );
        const w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
        setupFoundation(w, definition.setup ?? []);
        w.lesson = {
          id: definition.id,
          learner: 'Cluster regression',
          startedTick: w.clock.tick,
          hints: 0,
          notes: '',
        };
        return w;
      };
      const checks = definition.checks as FoundationCheck[],
        passed = (w: ReturnType<typeof fresh>) => checks.every((c) => foundationCheck(w, c));
      const complete = (w: ReturnType<typeof fresh>) => solve(w, definition.id);
      it(definition.id + ':solution', () => {
        const w = fresh();
        expect(passed(w)).toBe(false);
        complete(w);
        expect(checks.map((c) => ({ label: c.label, passed: foundationCheck(w, c) }))).toEqual(
          checks.map((c) => ({ label: c.label, passed: true })),
        );
      });
      it(definition.id + ':incorrect-action', () => {
        const w = fresh();
        stageClusterSettings(w, 'idx01', { manager_uri: 'https://unrelated.invalid:8089' });
        expect(passed(w)).toBe(false);
      });
      it(definition.id + ':no-false-completion', () => {
        const solved = fresh(),
          other = fresh();
        complete(solved);
        expect(passed(solved)).toBe(true);
        expect(passed(other)).toBe(false);
      });
      it(definition.id + ':reset', () => {
        const w = fresh(),
          baseline = saveWorld(w);
        complete(w);
        expect(passed(w)).toBe(true);
        const reset = loadWorld(baseline, []);
        expect(passed(reset)).toBe(false);
        expect(saveWorld(reset).journal).toEqual(baseline.journal);
      });
      it(definition.id + ':resume', () => {
        const w = fresh();
        complete(w);
        const restored = loadWorld(saveWorld(w), []);
        expect(passed(restored)).toBe(true);
        expect(restored.clusterManagement).toEqual(w.clusterManagement);
        expect(restored.kvstore).toEqual(w.kvstore);
      });
      it(definition.id + ':isolation', () => {
        const w = fresh(),
          other = fresh(),
          baseline = saveWorld(other);
        complete(w);
        expect(saveWorld(other)).toEqual(baseline);
        expect(passed(other)).toBe(false);
      });
    });
});

it('does not localize SmartStore data merely by evaluating every lesson check', () => {
  const definition = lessons.find((l) => l.id === 'SP-060')!,
    profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    w = createWorld(profileWorldConfig(profile));
  setupFoundation(w, definition.setup ?? []);
  const object = smartStoreView(w).objects[0]!;
  evictSmartStoreBucket(w, object.bucketId);
  for (let i = 0; i < 3; i++)
    for (const check of definition.checks as FoundationCheck[]) foundationCheck(w, check);
  expect(object.cached).toEqual([]);
  expect(smartStoreView(w).fetches).toEqual([]);
  const result = actualSearch(w);
  expect(result.results[0]?.get('count')).toBe(3);
  expect(result.scan?.hosts).toBe(1);
  expect(result.scan?.sources).toBe(1);
  expect(smartStoreView(w).fetches).toHaveLength(1);
});
