import { testTerm } from './helpers';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  setupFoundation,
  stageEnterprisePackage,
  createConfigurationBackup,
  verifyConfigurationBackup,
  restoreConfigurationBackup,
  configurationFingerprint,
  configurationMatchesReview,
  persistMaintenance,
  sha256Text,
  resolveHost,
  stopSplunk,
  startSplunk,
  captureUpgradePreflight,
  inspectUpgrade,
  queueEnterpriseUpgrade,
  tickWorld,
  splunkVersion,
  saveWorld,
  loadWorld,
  MAINTENANCE_PACKAGE,
  MAINTENANCE_TARGET,
  acceptEnterpriseTrainingLicense,
  installEnterprisePackage,
  kvBackup,
  runSearch,
  resumeEnterpriseUpgrade,
  abortEnterpriseUpgrade,
  maintenanceView,
  maintenanceStorage,
  setClusterMaintenance,
  queueIndexerRestart,
} from '../src';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
const profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const fresh = () => createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
const prepare = (w: ReturnType<typeof fresh>, host: string) => {
  stageEnterprisePackage(w, host);
  const b = createConfigurationBackup(w, host, 'before_upgrade');
  verifyConfigurationBackup(w, host, b.id);
};
describe('verified configuration recovery and actual Enterprise package versions', () => {
  it('computes real SHA-256 and detects corrupt archives before changing source; restore preserves installed package/data', () => {
    for (const value of ['', 'abc', 'virtual configuration\n'])
      expect(sha256Text(value)).toBe(createHash('sha256').update(value).digest('hex'));
    const w = fresh(),
      host = 'hf01',
      fs = hostFs(w, resolveHost(w, host)!),
      conf = '/opt/splunk/etc/system/local/limits.conf';
    fs.writeFile(conf, '[thruput]\nmaxKBps=100\n', ROOT);
    const original = configurationFingerprint(w, host),
      backup = createConfigurationBackup(w, host, 'good');
    verifyConfigurationBackup(w, host, backup.id);
    fs.writeFile(conf, '[thruput]\nmaxKBps=1\n', ROOT);
    expect(() => restoreConfigurationBackup(w, host, backup.id)).toThrow('Stop');
    stopSplunk(w, resolveHost(w, host)!);
    restoreConfigurationBackup(w, host, backup.id);
    expect(configurationFingerprint(w, host)).toBe(original);
    expect(splunkVersion(w, resolveHost(w, host)!)).toBe('9.4.1');
    const before = configurationFingerprint(w, host);
    fs.writeFile(backup.path, 'corrupted', ROOT);
    expect(() => verifyConfigurationBackup(w, host, backup.id)).toThrow('SHA-256');
    expect(configurationFingerprint(w, host)).toBe(before);
  });
  it('upgrades a stopped reviewed host, requires the nonbinding training flag, and cannot use config restore as a package downgrade', () => {
    const w = fresh(),
      host = 'hf01';
    prepare(w, host);
    const before = w.maintenance!.backups[0]!;
    const f = captureUpgradePreflight(w, [host]);
    expect(f.issues).toEqual([]);
    expect(() => installEnterprisePackage(w, host)).toThrow('Stop');
    stopSplunk(w, resolveHost(w, host)!);
    expect(installEnterprisePackage(w, host)).toBe(true);
    expect(splunkVersion(w, resolveHost(w, host)!)).toBe(MAINTENANCE_TARGET);
    expect(() => startSplunk(w, resolveHost(w, host)!)).toThrow('training license');
    restoreConfigurationBackup(w, host, before.id);
    expect(splunkVersion(w, resolveHost(w, host)!)).toBe(MAINTENANCE_TARGET);
    acceptEnterpriseTrainingLicense(w, host);
    startSplunk(w, resolveHost(w, host)!);
    const old = stageEnterprisePackage(w, host, '9.4.1');
    stopSplunk(w, resolveHost(w, host)!);
    expect(() => installEnterprisePackage(w, host, old.path)).toThrow('downgrade');
    expect(loadWorld(saveWorld(w), []).maintenance).toEqual(w.maintenance);
  });
  it('orders LM/CM/SH/peers, preserves actual search through peer phases and resumes a partial upgrade without repeating completed hosts', () => {
    const w = fresh();
    setupFoundation(w, [{ kind: 'cluster-fixture', mode: 'baseline' }]);
    kvBackup(w, 'sh01', 'before_enterprise_upgrade');
    const hosts = ['idx03', 'sh01', 'cm01', 'idx01', 'lm01', 'idx02'];
    for (const host of hosts) prepare(w, host);
    const before = saveWorld(w);
    inspectUpgrade(w, hosts);
    expect(saveWorld(w)).toEqual(before);
    const f = captureUpgradePreflight(w, hosts);
    expect(f.issues).toEqual([]);
    expect(f.targets).toEqual(['lm01', 'cm01', 'sh01', 'idx01', 'idx02', 'idx03']);
    const job = queueEnterpriseUpgrade(w, f.id, true);
    tickWorld(w, 20);
    expect(w.maintenance!.jobs[0]!.completed).toEqual(['lm01', 'cm01', 'sh01', 'idx01']);
    const fs = hostFs(w, resolveHost(w, 'idx02')!),
      text = fs.readFile(MAINTENANCE_PACKAGE, ROOT);
    fs.writeFile(MAINTENANCE_PACKAGE, 'corrupt package', ROOT);
    tickWorld(w, 1);
    expect(w.maintenance!.jobs[0]!.status).toBe('paused');
    const saved = loadWorld(saveWorld(w), []);
    expect(saved.maintenance!.jobs[0]!.completed).toEqual(['lm01', 'cm01', 'sh01', 'idx01']);
    hostFs(saved, resolveHost(saved, 'idx02')!).writeFile(MAINTENANCE_PACKAGE, text, ROOT);
    resumeEnterpriseUpgrade(saved, job.id);
    for (let i = 0; i < 15; i++) {
      tickWorld(saved, 1);
      const r = runSearch(saved, { search: 'index=source_logs | stats count' });
      expect(r.results[0]?.get('count')).toBe(3);
    }
    expect(saved.maintenance!.jobs[0]!.status).toBe('completed');
    expect(hosts.every((h) => splunkVersion(saved, resolveHost(saved, h)!) === MAINTENANCE_TARGET)).toBe(
      true,
    );
    expect(
      saved.maintenance!.jobs[0]!.events.filter((e) => e.host === 'idx01' && e.phase === 'installed'),
    ).toHaveLength(1);
  });
});

describe('maintenance readiness and recovery guards', () => {
  it('archives directory metadata and empty directories, removes new paths and preserves recorded events', () => {
    const w = fresh(),
      p = resolveHost(w, 'hf01')!,
      fs = hostFs(w, p),
      root = '/opt/splunk/etc';
    fs.mkdir(root + '/empty-practice', ROOT);
    fs.setMeta(root + '/empty-practice', { owner: 'splunk', group: 'splunk', mode: 0o700 }, ROOT);
    fs.mkdir('/var/backups/v7/hf01', ROOT, { parents: true });
    fs.writeFile('/var/backups/v7/hf01/occupied.json', 'retain original', ROOT);
    expect(() => createConfigurationBackup(w, p.hostname, 'occupied')).toThrow('already exists');
    expect(fs.readFile('/var/backups/v7/hf01/occupied.json', ROOT)).toBe('retain original');
    const b = createConfigurationBackup(w, p.hostname, 'directories');
    verifyConfigurationBackup(w, p.hostname, b.id);
    const hash = configurationFingerprint(w, p.hostname),
      events = JSON.stringify(w.ingestion ?? null);
    fs.setMeta(root + '/empty-practice', { mode: 0o777 }, ROOT);
    fs.mkdir(root + '/new-tree/local', ROOT, { parents: true });
    fs.writeFile(root + '/new-tree/local/inputs.conf', '[default]\ndisabled=true\n', ROOT);
    stopSplunk(w, p);
    restoreConfigurationBackup(w, p.hostname, b.id);
    expect(fs.exists(root + '/new-tree')).toBe(false);
    expect(fs.findNode(root + '/empty-practice')?.mode).toBe(0o700);
    expect(configurationFingerprint(w, p.hostname)).toBe(hash);
    expect(JSON.stringify(w.ingestion ?? null)).toBe(events);
  });
  it('requires current verified source, artifact manifest, availability, space and syntax', () => {
    const w = fresh(),
      host = 'hf01',
      p = resolveHost(w, host)!,
      fs = hostFs(w, p);
    expect(inspectUpgrade(w, [host]).valid).toBe(false);
    prepare(w, host);
    expect(inspectUpgrade(w, [host]).valid).toBe(true);
    fs.writeFile(MAINTENANCE_PACKAGE + '.sha256', 'wrong', ROOT);
    expect(inspectUpgrade(w, [host]).issues.join()).toContain('manifest');
    stageEnterprisePackage(w, host);
    fs.writeFile('/opt/splunk/etc/system/local/limits.conf', 'broken native syntax', ROOT);
    expect(inspectUpgrade(w, [host]).issues.join()).toContain('syntax');
    expect(inspectUpgrade(w, [host]).issues.join()).toContain('current configuration');
    fs.writeFile('/opt/splunk/etc/system/local/server.conf', '[diskUsage]\nminFreeSpace=999999999\n', ROOT);
    startSplunk(w, p); // Already running does not reload staged source.
    stopSplunk(w, p);
    startSplunk(w, p);
    expect(inspectUpgrade(w, [host]).issues.join()).toContain('space');
    stopSplunk(w, p);
    expect(inspectUpgrade(w, [host]).issues.join()).toContain('unavailable');
  });
  it('rejects stale reviewed sources and blocks simultaneous package or cluster work', () => {
    const w = fresh(),
      host = 'hf01';
    prepare(w, host);
    const f = captureUpgradePreflight(w, [host]),
      fs = hostFs(w, resolveHost(w, host)!);
    fs.writeFile('/opt/splunk/etc/system/local/limits.conf', '[thruput]\nmaxKBps=20\n', ROOT);
    expect(() => queueEnterpriseUpgrade(w, f.id, true)).toThrow('changed');
    const b = createConfigurationBackup(w, host, 'new_source');
    verifyConfigurationBackup(w, host, b.id);
    const next = captureUpgradePreflight(w, [host]),
      j = queueEnterpriseUpgrade(w, next.id, true);
    expect(() => queueEnterpriseUpgrade(w, next.id, true)).toThrow('current');
    tickWorld(w, 2);
    expect(w.maintenance!.jobs.find((x) => x.id === j.id)!.phase).toBe('stopped');
    expect(() => restoreConfigurationBackup(w, host, b.id)).toThrow('Finish');
  });
  it('requires the actual tier prerequisites and a separate current KV data backup', () => {
    const w = fresh();
    setupFoundation(w, [{ kind: 'cluster-fixture', mode: 'baseline' }]);
    prepare(w, 'sh01');
    const before = saveWorld(w);
    const issues = inspectUpgrade(w, ['sh01']).issues.join();
    expect(issues).toContain('lm01');
    expect(issues).toContain('cm01');
    expect(issues).toMatch(/KV Store|KV preflight/);
    expect(saveWorld(w)).toEqual(before);
  });
  it('aborts without inventing rollback, retains the stopped host and allows explicit service recovery', () => {
    const w = fresh(),
      host = 'hf01';
    prepare(w, host);
    const f = captureUpgradePreflight(w, [host]),
      j = queueEnterpriseUpgrade(w, f.id, true);
    tickWorld(w, 3);
    expect(splunkVersion(w, resolveHost(w, host)!)).toBe(MAINTENANCE_TARGET);
    abortEnterpriseUpgrade(w, j.id);
    expect(w.maintenance!.jobs[0]!.status).toBe('aborted');
    expect(splunkVersion(w, resolveHost(w, host)!)).toBe(MAINTENANCE_TARGET);
    expect(() => startSplunk(w, resolveHost(w, host)!)).toThrow('training license');
    acceptEnterpriseTrainingLicense(w, host);
    startSplunk(w, resolveHost(w, host)!);
    expect(() => resumeEnterpriseUpgrade(w, j.id)).toThrow('paused');
  });
});

it('uses virtual native checksum, package extraction and version commands against the same installation state', () => {
  const w = fresh(),
    host = 'hf01';
  prepare(w, host);
  captureUpgradePreflight(w, [host]);
  const t = testTerm(w);
  t.run('ssh splunk@hf01');
  expect(t.run('sha256sum -c ' + MAINTENANCE_PACKAGE + '.sha256')).toContain('OK');
  expect(t.run('tar -xzf ' + MAINTENANCE_PACKAGE + ' -C /opt')).toContain('Stop');
  t.run('splunk stop');
  expect(t.run('tar -xzf ' + MAINTENANCE_PACKAGE + ' -C /opt')).toContain('descriptor applied');
  expect(t.run('splunk version')).toContain('9.4.2');
  expect(t.run('splunk start')).toContain('training license');
  expect(t.run('splunk start --accept-license')).toContain('Starting splunk');
  expect(t.run('splunk status')).toContain('is running');
  expect(t.run('tar -xzf ' + MAINTENANCE_PACKAGE + ' -C /etc')).toContain('supports only');
});

it('keeps unchanged source reviews valid across background ticks while reserving the maintenance window', () => {
  const w = fresh();
  setupFoundation(w, [{ kind: 'cluster-fixture', mode: 'baseline' }]);
  kvBackup(w, 'sh01', 'before');
  prepare(w, 'hf01');
  const before = maintenanceView(w).revision;
  tickWorld(w, 1);
  expect(maintenanceView(w).revision).toBe(before);
  const f = captureUpgradePreflight(w, ['hf01']);
  queueEnterpriseUpgrade(w, f.id, true);
  expect(() => setClusterMaintenance(w, true)).toThrow('maintenance window');
  expect(() => queueIndexerRestart(w, resolveHost(w, 'cm01')!)).toThrow('Enterprise upgrade');
});
it('cannot use a full-tier preflight to manually skip unupgraded prerequisite tiers', () => {
  const w = fresh();
  setupFoundation(w, [{ kind: 'cluster-fixture', mode: 'baseline' }]);
  kvBackup(w, 'sh01', 'before');
  const targets = ['lm01', 'cm01', 'sh01', 'idx01', 'idx02', 'idx03'];
  for (const host of targets) prepare(w, host);
  const f = captureUpgradePreflight(w, targets);
  expect(f.valid).toBe(true);
  stopSplunk(w, resolveHost(w, 'idx03')!);
  expect(() => installEnterprisePackage(w, 'idx03')).toThrow('lm01');
  expect(splunkVersion(w, resolveHost(w, 'idx03')!)).toBe('9.4.1');
});

it('reports the same current modeled /opt capacity in native virtual df and upgrade preflight', () => {
  const w = fresh();
  setupFoundation(w, [{ kind: 'cluster-fixture', mode: 'baseline' }]);
  const capacity = maintenanceStorage(w, 'idx01');
  expect(capacity.recordedBytes).toBeGreaterThan(0);
  const t = testTerm(w);
  t.run('ssh splunk@idx01');
  const output = t.run('df -k /opt').trim().split('\n').at(-1)!.trim().split(/\s+/);
  expect(Number(output[3])).toBe(Math.round(capacity.availableMB * 1024));
});

it('reverifies legacy full-etc archives and retains old plan pins without restoring vendor version/default files', () => {
  const w = fresh(),
    host = 'hf01',
    p = resolveHost(w, host)!,
    fs = hostFs(w, p),
    root = '/opt/splunk/etc';
  stageEnterprisePackage(w, host);
  const b = createConfigurationBackup(w, host, 'legacy');
  verifyConfigurationBackup(w, host, b.id);
  const body = JSON.parse(fs.readFile(b.path, ROOT));
  body.format = 'sandbox-configuration-archive-v1';
  body.files = {};
  body.directories = {};
  fs.walk(root, ROOT, (path, n) => {
    if (n.type === 'dir')
      body.directories[path.slice(root.length)] = { owner: n.owner, group: n.group, mode: n.mode };
    else
      body.files[path.slice(root.length + 1)] = {
        text: fs.readFile(path, ROOT),
        owner: n.owner,
        group: n.group,
        mode: n.mode,
      };
  });
  const legacyPin = sha256Text(
      JSON.stringify([
        body.directories,
        Object.entries(body.files)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([name, value]) => {
            const f = value as { text: string; owner: string; group: string; mode: number };
            return [name, f.text, f.owner, f.group, f.mode];
          }),
      ]),
    ),
    text = JSON.stringify(body),
    stored = w.maintenance!.backups[0]!;
  stored.sourceRevision = legacyPin;
  stored.digest = sha256Text(text);
  delete stored.scopeVersion;
  fs.writeFile(stored.path, text, ROOT);
  fs.writeFile(stored.path + '.sha256', stored.digest + '  ' + stored.path + '\n', ROOT);
  persistMaintenance(w);
  stopSplunk(w, p);
  expect(() => restoreConfigurationBackup(w, host, stored.id)).toThrow('Verify this legacy archive again');
  verifyConfigurationBackup(w, host, stored.id);
  expect(stored.originalSourceRevision).toBe(legacyPin);
  expect(stored.scopeVersion).toBe(2);
  startSplunk(w, p);
  const f = captureUpgradePreflight(w, [host]);
  expect(f.valid).toBe(true);
  w.maintenance!.preflights.at(-1)!.sourceRevisions[host] = legacyPin;
  persistMaintenance(w);
  stopSplunk(w, p);
  installEnterprisePackage(w, host);
  acceptEnterpriseTrainingLicense(w, host);
  startSplunk(w, p);
  expect(hostFs(w, p).readFile(root + '/splunk.version', ROOT)).toContain('VERSION=9.4.2');
  expect(hostFs(w, p).readFile(root + '/system/default/server.conf', ROOT)).toContain('Version 9.4.2');
  expect(configurationMatchesReview(w, host, legacyPin, stored.id)).toBe(true);
  stopSplunk(w, p);
  restoreConfigurationBackup(w, host, stored.id);
  expect(hostFs(w, p).readFile(root + '/splunk.version', ROOT)).toContain('VERSION=9.4.2');
  expect(hostFs(w, p).readFile(root + '/system/default/server.conf', ROOT)).toContain('Version 9.4.2');
  startSplunk(w, p);
  const resumed = loadWorld(saveWorld(w), []);
  expect(configurationFingerprint(resumed, host)).toBe(configurationFingerprint(w, host));
  expect(configurationMatchesReview(resumed, host, legacyPin, stored.id)).toBe(true);
});
