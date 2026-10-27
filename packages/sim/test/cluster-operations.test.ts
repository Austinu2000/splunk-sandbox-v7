import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  resolveHost,
  restartSplunk,
  stopSplunk,
  startSplunk,
  tickWorld,
  enableClusterManagement,
  advancedClusterHealth,
  queueIndexerRestart,
  queueIndexerBundle,
  validateManagedClusterBundle,
  saveWorld,
  loadWorld,
  runSearch,
} from '../src';
import { applyClusterBundle } from '../src/hosts/cluster';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
import { buckets } from '../src/training/cluster';
const fresh = () => {
  const profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
  profile.infra.indexerCluster.indexers = 4;
  return createWorld(profileWorldConfig(profile));
};
function dataWorld() {
  const w = fresh(),
    cm = resolveHost(w, 'cm01')!,
    fs = hostFs(w, cm),
    path = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
  fs.writeFile(path, fs.readFile(path, ROOT) + '\n[cluster_events]\nrepFactor=auto\n', ROOT);
  applyClusterBundle(w, cm);
  const idx = resolveHost(w, 'idx01')!,
    f = hostFs(w, idx);
  f.mkdir('/var/log/practice', ROOT, { parents: true });
  f.writeFile(
    '/var/log/practice/cluster.log',
    'status=500 practice=cluster_one\nstatus=200 practice=cluster_two\n',
    ROOT,
  );
  f.writeFile(
    '/opt/splunk/etc/system/local/inputs.conf',
    '[monitor:///var/log/practice/cluster.log]\nindex=cluster_events\nsourcetype=app_log\ndisabled=0\n',
    ROOT,
  );
  restartSplunk(w, idx);
  enableClusterManagement(w);
  tickWorld(w, 1);
  return w;
}
const count = (w: ReturnType<typeof fresh>) =>
  runSearch(w, { search: 'index=cluster_events | stats count' }).results[0]?.get('count');
describe('V7 coordinated cluster operations', () => {
  it('uses running membership/factors, retains staged differences and refuses unsafe restart preflight', () => {
    const w = fresh();
    enableClusterManagement(w);
    expect(advancedClusterHealth(w).replicationMet).toBe(true);
    const p = resolveHost(w, 'idx04')!,
      fs = hostFs(w, p),
      path = '/opt/splunk/etc/system/local/server.conf';
    fs.writeFile(
      path,
      patchConf(fs.exists(path) ? fs.readFile(path, ROOT) : '', 'clustering', {
        manager_uri: 'https://unknown-manager:8089',
      }),
      ROOT,
    );
    expect(advancedClusterHealth(w).members.find((m) => m.host === p.hostname)?.joined).toBe(true);
    restartSplunk(w, p);
    expect(advancedClusterHealth(w).members.find((m) => m.host === p.hostname)?.reason).toContain(
      'manager_uri',
    );
    expect(() => queueIndexerRestart(w, resolveHost(w, 'cm01')!)).toThrow();
    expect(w.clusterManagement!.jobs).toHaveLength(0);
  });
  it('keeps real recorded data searchable while one peer drains/stops/rejoins and resumes the exact job phase', () => {
    const w = dataWorld();
    expect(count(w)).toBe(2);
    const job = queueIndexerRestart(w, resolveHost(w, 'cm01')!);
    tickWorld(w, 2);
    expect(job.phase).toBe('stopped');
    expect(advancedClusterHealth(w).members.filter((m) => !m.running)).toHaveLength(1);
    expect(count(w)).toBe(2);
    const restored = loadWorld(saveWorld(w), []);
    expect(restored.clusterManagement).toEqual(w.clusterManagement);
    expect(count(restored)).toBe(2);
    for (let n = 0; n < 20 && job.status === 'running'; n++) {
      tickWorld(w, 1);
      expect(advancedClusterHealth(w).members.filter((m) => !m.running).length).toBeLessThanOrEqual(1);
      expect(count(w)).toBe(2);
    }
    expect(job.status).toBe('completed');
    expect(job.completed).toHaveLength(4);
    expect(advancedClusterHealth(w).maintenance).toBe(false);
  });
  it('requires validation of the current artifact, pins a published bundle and rejects target drift before stopping it', () => {
    const w = fresh();
    enableClusterManagement(w);
    const cm = resolveHost(w, 'cm01')!,
      fs = hostFs(w, cm),
      path = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
    expect(() => queueIndexerBundle(w, cm)).toThrow('Validate');
    validateManagedClusterBundle(w, cm);
    fs.writeFile(path, fs.readFile(path, ROOT) + '\n[reviewed_index]\nrepFactor=auto\n', ROOT);
    expect(() => queueIndexerBundle(w, cm)).toThrow('Validate');
    const valid = validateManagedClusterBundle(w, cm),
      job = queueIndexerBundle(w, cm);
    fs.writeFile(path, fs.readFile(path, ROOT) + '\n[later_draft]\nrepFactor=auto\n', ROOT);
    tickWorld(w, 20);
    expect(job.status).toBe('completed');
    expect(Object.values(w.clusterManagement!.peerBundles).every((b) => b.checksum === valid.checksum)).toBe(
      true,
    );
    const next = queueIndexerRestart(w, cm),
      p = resolveHost(w, next.targets[0]!)!,
      f = hostFs(w, p);
    f.writeFile('/opt/splunk/etc/system/local/limits.conf', '[search]\nmax_count=123\n', ROOT);
    tickWorld(w, 1);
    expect(next.status).toBe('paused');
    expect(advancedClusterHealth(w).members.every((m) => m.running)).toBe(true);
  });
  it('fixes missing replicas only from surviving copies and never manufactures lost recorded buckets', () => {
    const w = dataWorld(),
      recorded = buckets(w).find((b) => b.index === 'cluster_events')!;
    expect(recorded.copies).toHaveLength(3);
    const names = recorded.copies.map((c) => c.host);
    for (const name of names) stopSplunk(w, resolveHost(w, name)!);
    tickWorld(w, 4);
    expect(count(w)).toBe(0);
    expect(recorded.copies.map((c) => c.host)).toEqual(names);
    startSplunk(w, resolveHost(w, names[0]!)!);
    tickWorld(w, 20);
    expect(count(w)).toBe(2);
    expect(recorded.copies.some((c) => !names.includes(c.host))).toBe(true);
  });
});

import { testTerm } from './helpers';
describe('native-shaped cluster CLI', () => {
  it('uses the same staged configuration and phased restart, with practice principal checks', () => {
    const w = fresh();
    enableClusterManagement(w);
    const t = testTerm(w);
    t.run('ssh splunk@cm01');
    expect(t.run('splunk list cluster-config')).toContain('replication_factor');
    expect(
      t.run('splunk rolling-restart cluster-peers -searchable true -auth analyst:training-only'),
    ).toContain('Permission denied');
    expect(t.run('splunk rolling-restart cluster-peers -searchable true')).toContain('cluster-job-');
    tickWorld(w, 2);
    expect(t.run('splunk show cluster-status --verbose')).toContain('"running": false');
    tickWorld(w, 20);
    expect(t.run('splunk show cluster-bundle-status')).toContain('"status": "completed"');
    t.session.dispose();
  });
  it('reports the surviving search peer while retaining original ingestion provenance', () => {
    const w = dataWorld();
    stopSplunk(w, resolveHost(w, 'idx01')!);
    const result = runSearch(w, { search: 'index=cluster_events | stats count by splunk_server' });
    expect(result.status).toBe('done');
    expect(result.results[0]?.get('count')).toBe(2);
    expect(result.results[0]?.get('splunk_server')).not.toBe('idx01');
    expect(w.ingestion!.events.every((e) => e.receiver === 'idx01' && e.searchPeer === undefined)).toBe(true);
  });
});

import { setClusterSiteOutage } from '../src';
it('restores only previously running peers from an explicit site fault and persists that boundary', () => {
  const profile = parseProfile(
      readFileSync(new URL('../../../profiles/enterprise_lab_v1.yaml', import.meta.url), 'utf8'),
    ),
    w = createWorld(profileWorldConfig(profile));
  enableClusterManagement(w);
  stopSplunk(w, resolveHost(w, 'idx01')!);
  setClusterSiteOutage(w, 'site1', true);
  expect(
    advancedClusterHealth(w)
      .members.filter((m) => m.nativeSite === 'site1')
      .every((m) => !m.running),
  ).toBe(true);
  const restored = loadWorld(saveWorld(w), []);
  setClusterSiteOutage(restored, 'site1', false);
  const members = advancedClusterHealth(restored).members;
  expect(members.find((m) => m.host === 'idx01')?.running).toBe(false);
  expect(members.find((m) => m.host === 'idx02')?.running).toBe(true);
  expect(members.find((m) => m.host === 'idx04')?.running).toBe(true);
  expect(() => setClusterSiteOutage(restored, 'missing', true)).toThrow('existing native site');
});
