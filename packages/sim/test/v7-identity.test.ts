import { readFileSync, existsSync } from 'node:fs';
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
  stageIdentitySource,
  SAML_AUTH_SOURCE,
  LDAP_AUTH_SOURCE,
  READER_ROLE_SOURCE,
  probeIdentity,
  resolveHost,
  restartSplunk,
  runSearch,
  recordSearchEvidence,
  tickWorld,
} from '../src';
import type { FoundationCheck } from '../src/engineering/foundations';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
const profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const definition = (id: string) => {
  const live = new URL('../../../lessons/v7/' + id + '.json', import.meta.url),
    draft = new URL('../../../lessons/v7-drafts/' + id + '.json', import.meta.url);
  return engineeringLessonSchema.parse(JSON.parse(readFileSync(existsSync(live) ? live : draft, 'utf8')));
};
function solve(w: ReturnType<typeof createWorld>, id: string) {
  const activate = () => restartSplunk(w, resolveHost(w, 'sh01')!);
  if (id === 'SP-081') {
    stageIdentitySource(w, 'sh01', 'authentication', SAML_AUTH_SOURCE);
    stageIdentitySource(w, 'sh01', 'authorize', READER_ROLE_SOURCE);
    activate();
    expect(probeIdentity(w, 'sh01', 'saml-reader').authenticated).toBe(true);
    stageIdentitySource(w, 'sh01', 'authentication', LDAP_AUTH_SOURCE);
    activate();
    expect(probeIdentity(w, 'sh01', 'ldap-reader').authenticated).toBe(true);
  } else {
    const uf = resolveHost(w, 'lab-lnx-0001')!,
      fs = hostFs(w, uf),
      path = '/opt/splunkforwarder/etc/auth/v7/ca.pem';
    fs.writeFile(path, fs.readFile('/opt/staging/v7-correct-ca.pem', ROOT), ROOT);
    fs.setMeta(path, { owner: 'splunk', group: 'splunk', mode: 0o600 }, ROOT);
    restartSplunk(w, uf);
    const shfs = hostFs(w, resolveHost(w, 'sh01')!),
      auth = '/opt/splunk/etc/system/local/authorize.conf';
    shfs.writeFile(
      auth,
      patchConf(shfs.readFile(auth, ROOT), 'role_user', { indexes_edit: 'disabled' }),
      ROOT,
    );
    activate();
    tickWorld(w, 1);
  }
  const search =
      id === 'SP-081' ? 'index=ops_logs | stats count' : 'index=os sourcetype=v7_secure | stats count',
    r = runSearch(w, { host: 'sh01', principal: 'analyst', search });
  expect(r.status).toBe('done');
  recordSearchEvidence(w, {
    id: 'identity-search',
    host: 'sh01',
    principal: 'analyst',
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
for (const id of ['SP-081', 'SP-082'])
  describe(id, () => {
    const d = definition(id),
      checks = d.checks as FoundationCheck[],
      fresh = () => {
        const w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
        setupFoundation(w, d.setup ?? []);
        w.lesson = { id, learner: 'Identity regression', startedTick: w.clock.tick, hints: 0, notes: '' };
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
      stageIdentitySource(
        w,
        'sh01',
        'authentication',
        SAML_AUTH_SOURCE.replace('SocReaders', 'WrongReaders'),
      );
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
      const r = loadWorld(saveWorld(w), []);
      expect(passed(r)).toBe(true);
      expect(r.identity).toEqual(w.identity);
    });
    it(id + ':isolation', () => {
      const a = fresh(),
        b = fresh(),
        baseline = saveWorld(b);
      solve(a, id);
      expect(saveWorld(b)).toEqual(baseline);
      expect(passed(b)).toBe(false);
    });
  });
it('rejects stale identity proof and never creates new probe receipts while grading', () => {
  const d = definition('SP-081'),
    w = createWorld({ ...profileWorldConfig(profile), fleetSize: 50 });
  setupFoundation(w, d.setup ?? []);
  solve(w, d.id);
  const checks = d.checks as FoundationCheck[],
    before = saveWorld(w);
  for (const c of checks) foundationCheck(w, c);
  expect(saveWorld(w)).toEqual(before);
  stageIdentitySource(w, 'sh01', 'authentication', LDAP_AUTH_SOURCE.replace('SocReaders', 'WrongReaders'));
  restartSplunk(w, resolveHost(w, 'sh01')!);
  expect(checks.every((c) => foundationCheck(w, c))).toBe(false);
});
