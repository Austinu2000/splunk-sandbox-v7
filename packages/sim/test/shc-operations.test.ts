import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  enableClusterManagement,
  shcHealth,
  tickWorld,
  resolveHost,
  stopSplunk,
  startSplunk,
  queueShcBundle,
  saveWorld,
  loadWorld,
  saveReport,
  listReports,
  saveDashboard,
  listDashboards,
  classicSource,
} from '../src';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { kvStatus } from '../src/kvstore/engine';
const fresh = () => {
  const p = parseProfile(readFileSync(new URL('../../../profiles/apl.yaml', import.meta.url), 'utf8'));
  const w = createWorld({ ...profileWorldConfig(p), fleetSize: 50 });
  enableClusterManagement(w);
  tickWorld(w, 1);
  return w;
};
describe('coordinated SHC and replicated knowledge', () => {
  it('elects an available captain only with majority and keeps KV primary identity separate', () => {
    const w = fresh(),
      first = shcHealth(w);
    expect(first.majority).toBe(true);
    expect(first.captain).toBe('sh01');
    stopSplunk(w, resolveHost(w, 'sh01')!);
    expect(shcHealth(w).captain).toBeNull();
    tickWorld(w, 1);
    expect(shcHealth(w).captain).toBe('sh02');
    startSplunk(w, resolveHost(w, 'sh01')!);
    tickWorld(w, 1);
    expect(shcHealth(w).captain).toBe('sh02');
    expect(kvStatus(w, 'sh01').primary).toBe('sh01');
    stopSplunk(w, resolveHost(w, 'sh01')!);
    stopSplunk(w, resolveHost(w, 'sh03')!);
    tickWorld(w, 1);
    expect(shcHealth(w)).toMatchObject({ majority: false, captain: null });
  });
  it('publishes merged defaults in phases, preserves runtime local overrides/lookups and resumes stopped state', () => {
    const w = fresh(),
      deployer = resolveHost(w, 'deployer01')!,
      fs = hostFs(w, deployer),
      root = '/opt/splunk/etc/shcluster/apps/v7_cluster';
    fs.mkdir(root + '/local', ROOT, { parents: true });
    fs.mkdir(root + '/lookups', ROOT, { parents: true });
    fs.writeFile(root + '/local/savedsearches.conf', '[SHC report]\nsearch=index=os | stats count\n', ROOT);
    fs.writeFile(root + '/lookups/owners.csv', 'host,owner\nnew,Default\n', ROOT);
    const member = hostFs(w, resolveHost(w, 'sh02')!);
    member.mkdir('/opt/splunk/etc/apps/v7_cluster/local', ROOT, { parents: true });
    member.mkdir('/opt/splunk/etc/apps/v7_cluster/lookups', ROOT, { parents: true });
    member.writeFile(
      '/opt/splunk/etc/apps/v7_cluster/local/savedsearches.conf',
      '[SHC report]\nsearch=index=app | stats count\n',
      ROOT,
    );
    member.writeFile(
      '/opt/splunk/etc/apps/v7_cluster/lookups/owners.csv',
      'host,owner\nruntime,Operations\n',
      ROOT,
    );
    const job = queueShcBundle(w, deployer);
    tickWorld(w, 2);
    expect(job.phase).toBe('stopped');
    expect(shcHealth(w).majority).toBe(true);
    const restored = loadWorld(saveWorld(w), []);
    expect(restored.clusterManagement).toEqual(w.clusterManagement);
    tickWorld(w, 15);
    expect(job.status).toBe('completed');
    expect(listReports(w, 'sh01').find((r) => r.title === 'SHC report')?.search).toBe(
      'index=os | stats count',
    );
    expect(listReports(w, 'sh02').find((r) => r.title === 'SHC report')?.search).toBe(
      'index=app | stats count',
    );
    expect(
      hostFs(w, resolveHost(w, 'sh02')!).readFile('/opt/splunk/etc/apps/v7_cluster/lookups/owners.csv', ROOT),
    ).toContain('runtime,Operations');
  });
  it('replicates canonical reports/views on ticks, respects scope moves and rejects writes without quorum', () => {
    const w = fresh(),
      scope = { host: 'sh01', app: 'search', owner: 'admin', sharing: 'Private' as const };
    const report = saveReport(
      w,
      { ...scope, title: 'Runtime object', search: 'index=os | stats count' },
      { create: true },
    );
    expect(listReports(w, 'sh02').some((r) => r.title === report.title)).toBe(false);
    tickWorld(w, 2);
    expect(listReports(w, 'sh02').some((r) => r.title === report.title)).toBe(true);
    expect(listReports(w, 'sh03').some((r) => r.title === report.title)).toBe(true);
    const d = saveDashboard(
      w,
      {
        ...scope,
        name: 'runtime_view',
        format: 'classic',
        source: classicSource(
          'Runtime view',
          '',
          [],
          [
            {
              id: 'count',
              title: 'Count',
              type: 'single',
              search: 'index=os | stats count',
              earliest: '-15m',
              latest: 'now',
            },
          ],
        ),
      },
      { create: true },
    );
    tickWorld(w, 2);
    const moved = saveDashboard(
      w,
      { ...scope, name: d.name, format: d.format, source: d.source, sharing: 'App' },
      { id: d.id, revision: d.revision },
    );
    tickWorld(w, 2);
    expect(listDashboards(w, 'sh02').filter((v) => v.name === d.name)).toHaveLength(1);
    expect(listDashboards(w, 'sh02', 'analyst').some((v) => v.name === moved.name)).toBe(true);
    stopSplunk(w, resolveHost(w, 'sh02')!);
    stopSplunk(w, resolveHost(w, 'sh03')!);
    const before = saveWorld(w);
    expect(() =>
      saveReport(w, { ...scope, title: 'No quorum', search: 'index=os | stats count' }, { create: true }),
    ).toThrow('Restore');
    expect(saveWorld(w)).toEqual(before);
  });
});

it('adopts a deployed default report into replicated local runtime configuration without deleting the provider', () => {
  const w = fresh(),
    p = resolveHost(w, 'deployer01')!,
    fs = hostFs(w, p),
    base = '/opt/splunk/etc/shcluster/apps/runtime_provider';
  fs.mkdir(base + '/local', ROOT, { parents: true });
  fs.writeFile(
    base + '/local/savedsearches.conf',
    '[Provider report]\nsearch=index=os | stats count\n',
    ROOT,
  );
  queueShcBundle(w, p);
  tickWorld(w, 15);
  const inherited = listReports(w, 'sh01').find((r) => r.title === 'Provider report')!;
  expect(inherited.sourcePath).toContain('/default/');
  const changed = saveReport(
    w,
    { ...inherited, search: 'index=app | stats count' },
    { id: inherited.id, revision: inherited.revision },
  );
  expect(changed.sourcePath).toContain('/local/');
  tickWorld(w, 2);
  expect(listReports(w, 'sh02').find((r) => r.title === changed.title)?.search).toBe(changed.search);
  expect(hostFs(w, resolveHost(w, 'sh01')!).exists(inherited.sourcePath)).toBe(true);
});
