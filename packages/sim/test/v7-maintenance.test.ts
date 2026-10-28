import { readFileSync, existsSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  engineeringLessonSchema,
  setupFoundation,
  foundationCheck,
  saveWorld,
  loadWorld,
  stageEnterprisePackage,
  createConfigurationBackup,
  verifyConfigurationBackup,
  captureUpgradePreflight,
  kvBackup,
  queueEnterpriseUpgrade,
  tickWorld,
  restoreConfigurationBackup,
  startSplunk,
  restartSplunk,
  resolveHost,
  runSearch,
  recordSearchEvidence,
  uploadPracticeFile,
  certificateRelationship,
} from '../src';
import type { FoundationCheck } from '../src/engineering/foundations';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { testTerm } from './helpers';
const profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const definition = (id: string) => {
  const live = new URL('../../../lessons/v7/' + id + '.json', import.meta.url),
    draft = new URL('../../../lessons/v7-drafts/' + id + '.json', import.meta.url);
  return engineeringLessonSchema.parse(JSON.parse(readFileSync(existsSync(live) ? live : draft, 'utf8')));
};
const prepare = (w: ReturnType<typeof createWorld>, host: string) => {
  stageEnterprisePackage(w, host);
  const b = createConfigurationBackup(w, host, 'before_upgrade');
  verifyConfigurationBackup(w, host, b.id);
};
function cli(w: ReturnType<typeof createWorld>, host: string, commands: string[]) {
  const t = testTerm(w);
  expect(t.run('ssh splunk@' + host)).not.toContain('Permission denied');
  for (const c of commands) {
    const out = t.run(c);
    expect(out, c).not.toMatch(/command not found|Permission denied|No such file|not supported/);
  }
  return t;
}
function search(w: ReturnType<typeof createWorld>, q: string) {
  const r = runSearch(w, { search: q });
  expect(r.status).toBe('done');
  recordSearchEvidence(w, {
    id: 'maintenance-verification',
    search: q,
    earliest: r.earliest,
    latest: r.latest,
    status: r.status,
    scanCount: r.scan?.scanned ?? 0,
    workUnits: r.workUnits,
    resultCount: r.results.length,
    inspected: true,
  });
}
function solve(w: ReturnType<typeof createWorld>, id: string) {
  if (id === 'SP-089') {
    for (const h of ['lm01', 'cm01', 'sh01', 'idx01', 'idx02', 'idx03']) prepare(w, h);
    kvBackup(w, 'sh01', 'before_enterprise');
    const f = captureUpgradePreflight(w, ['idx03', 'sh01', 'idx02', 'cm01', 'lm01', 'idx01']);
    expect(f.issues).toEqual([]);
  }
  if (id === 'SP-090') {
    prepare(w, 'hf01');
    const f = captureUpgradePreflight(w, ['hf01']);
    expect(f.issues).toEqual([]);
    queueEnterpriseUpgrade(w, f.id, true);
    tickWorld(w, 5);
  }
  if (id === 'SP-091') {
    restoreConfigurationBackup(w, 'hf01', 'known_good');
    startSplunk(w, resolveHost(w, 'hf01')!);
  }
  if (id === 'SP-092') {
    cli(w, 'idx01', [
      'cp /opt/staging/v7-old-server.pem /opt/splunk/etc/auth/v7/server.pem',
      'splunk restart',
    ]);
    tickWorld(w, 1);
    cli(w, 'lab-lnx-0001', [
      'cp /opt/staging/v7-overlap-ca.pem /opt/splunkforwarder/etc/auth/v7/ca.pem',
      'chmod 600 /opt/splunkforwarder/etc/auth/v7/ca.pem',
      'splunk restart',
    ]);
    cli(w, 'idx01', [
      'cp /opt/staging/v7-next-server.pem /opt/splunk/etc/auth/v7/server.pem',
      'chmod 600 /opt/splunk/etc/auth/v7/server.pem',
      'splunk restart',
    ]);
    cli(w, 'lab-lnx-0001', [
      'cp /opt/staging/v7-next-ca.pem /opt/splunkforwarder/etc/auth/v7/ca.pem',
      'splunk restart',
    ]);
    const fs = hostFs(w, resolveHost(w, 'lab-lnx-0001')!),
      path = '/var/log/practice/forwarder.log';
    uploadPracticeFile(
      w,
      'lab-lnx-0001',
      path,
      fs.readFile(path, ROOT) +
        'practice_id=rotation-final-001 status=200 service=ops\npractice_id=rotation-final-002 status=200 service=ops\n',
    );
    tickWorld(w, 1);
    expect(certificateRelationship(w, 'lab-lnx-0001', 'idx01.corp.example:9998')).toMatchObject({
      reachable: true,
      verified: true,
      issuer: 'training-ca-next',
      caIssuers: ['training-ca-next'],
    });
  }
  search(
    w,
    id === 'SP-092'
      ? 'index=os sourcetype=v7_rotation | stats count dc(practice_id) as ids'
      : 'index=source_logs | stats count',
  );
}
for (let n = 89; n <= 92; n++) {
  const id = 'SP-' + String(n).padStart(3, '0'),
    d = definition(id),
    checks = d.checks as FoundationCheck[],
    fresh = () => {
      const w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
      setupFoundation(w, d.setup ?? []);
      w.lesson = { id, learner: 'Maintenance regression', startedTick: w.clock.tick, hints: 0, notes: '' };
      return w;
    },
    passed = (w: ReturnType<typeof fresh>) => checks.every((c) => foundationCheck(w, c));
  describe(id, () => {
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
      restartSplunk(w, resolveHost(w, 'hf01')!);
      if (id === 'SP-092') {
        const p = resolveHost(w, 'lab-lnx-0001')!,
          fs = hostFs(w, p),
          path = '/opt/splunkforwarder/etc/system/local/outputs.conf';
        fs.writeFile(
          path,
          fs.readFile(path, ROOT).replace('sslVerifyServerCert=true', 'sslVerifyServerCert=false'),
          ROOT,
        );
        restartSplunk(w, p);
        tickWorld(w, 1);
        expect(certificateRelationship(w, p.hostname, 'idx01.corp.example:9998')).toMatchObject({
          reachable: true,
          verified: false,
        });
      }
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
        before = saveWorld(w);
      solve(w, id);
      expect(passed(w)).toBe(true);
      const reset = loadWorld(before, []);
      expect(passed(reset)).toBe(false);
      expect(saveWorld(reset).journal).toEqual(before.journal);
    });
    it(id + ':resume', () => {
      const w = fresh();
      solve(w, id);
      const resumed = loadWorld(saveWorld(w), []);
      expect(passed(resumed)).toBe(true);
      expect(resumed.maintenance).toEqual(w.maintenance);
    });
    it(id + ':isolation', () => {
      const a = fresh(),
        b = fresh(),
        before = saveWorld(b);
      solve(a, id);
      expect(saveWorld(b)).toEqual(before);
      expect(passed(b)).toBe(false);
    });
    it(id + ':passive-grading', () => {
      const w = fresh(),
        before = saveWorld(w);
      for (const c of checks) foundationCheck(w, c);
      expect(saveWorld(w)).toEqual(before);
    });
  });
}

it('retains a failed metadata activation without throwing through virtual service recovery', () => {
  const d = definition('SP-092'),
    w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
  setupFoundation(w, d.setup ?? []);
  const p = resolveHost(w, 'lab-lnx-0001')!,
    fs = hostFs(w, p);
  fs.writeFile('/opt/splunkforwarder/etc/auth/v7/ca.pem', 'null', ROOT);
  expect(() => restartSplunk(w, p)).not.toThrow();
  const probe = w.maintenance!.tlsProbes!.at(-1)!;
  expect(probe.reachable).toBe(false);
  expect(probe.error).not.toMatch(/Cannot read|TypeError/);
});
