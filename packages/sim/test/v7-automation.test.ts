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
  TerminalSession,
  codeCommit,
  reviewAction,
  executePlaybook,
  V7_STARTER_FILES,
  previewStarterPack,
  installStarterPack,
} from '../src/index';
import type { FoundationCheck } from '../src/engineering/foundations';
import { resolveHost } from '../src/hosts/profile';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
const directory = new URL('../../../lessons/v7/', import.meta.url),
  profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const lessons = readdirSync(directory)
  .filter((n) => /^AU-(?:1[5-9]|2[0-7])\.json$/.test(n))
  .map((n) => engineeringLessonSchema.parse(JSON.parse(readFileSync(new URL(n, directory), 'utf8'))));
const tpl = 'roles/v7_inputs/templates/inputs.conf.j2',
  input = 'playbooks/v7_inputs.yml',
  root = '/home/svc_ansible/splunk-automation/';
function commands(w: ReturnType<typeof createWorld>, lines: string[]) {
  const results: { line: string; success?: boolean }[] = [];
  const t = new TerminalSession({ world: w, onCommand: (e) => results.push(e) });
  t.start();
  for (const l of ['ssh svc_ansible@ansible01', 'cd ~/splunk-automation', ...lines]) t.input(l + '\r');
  t.dispose();
  return results;
}
function edit(w: ReturnType<typeof createWorld>, path: string, text: string) {
  hostFs(w, resolveHost(w, 'ansible01')!).writeFile(root + path, text, ROOT);
}
function solve(w: ReturnType<typeof createWorld>, id: string) {
  const n = Number(id.slice(3));
  if (n === 15) {
    edit(w, 'playbooks/v7_connectivity.yml', V7_STARTER_FILES['playbooks/v7_connectivity.yml']!);
    commands(w, ['ansible-playbook playbooks/v7_connectivity.yml --syntax-check']);
  }
  if (n === 16) commands(w, ['ansible-playbook ' + input + ' --limit ds01']);
  if (n === 17) {
    edit(
      w,
      'roles/v7_inputs/defaults/main.yml',
      V7_STARTER_FILES['roles/v7_inputs/defaults/main.yml']!.replace('v7_automation', 'v7_variables'),
    );
    commands(w, ['ansible-playbook ' + input + ' --limit ds01']);
  }
  if (n === 18) {
    edit(w, input, V7_STARTER_FILES[input]!);
    commands(w, [
      'ansible-playbook ' + input + ' --syntax-check',
      'ansible-playbook ' + input + ' --limit ds01',
    ]);
  }
  if (n === 19) {
    edit(w, 'roles/v7_inputs/tasks/main.yml', V7_STARTER_FILES['roles/v7_inputs/tasks/main.yml']!);
    commands(w, ['ansible-playbook ' + input + ' --limit ds01']);
  }
  if (n === 20)
    commands(w, [
      'ansible-playbook ' + input + ' --limit ds01',
      'ansible-playbook ' + input + ' --limit ds01',
    ]);
  if (n === 21) commands(w, ['ansible-playbook ' + input + ' --check --diff --limit ds01']);
  if (n === 22) {
    commands(w, ['ansible-playbook ' + input + ' --limit ds01']);
    edit(w, tpl, V7_STARTER_FILES[tpl]!);
    commands(w, [
      'ansible-playbook ' + input + ' --limit ds01',
      'ansible-playbook playbooks/v7_validate.yml --limit ds01',
    ]);
  }
  if (n >= 23) {
    let branch = 'feature/v7-change';
    if (n === 27) {
      branch = 'recovery/v7-input';
      const bad = w.git!.repos['splunk-automation']!.branches.main!;
      expect(
        commands(w, [
          'git config user.name Learner',
          'git config user.email learner@example.test',
          'git checkout -b ' + branch,
          'git revert ' + bad,
          'git push -u origin ' + branch,
        ])
          .filter((e) => e.line.startsWith('git '))
          .every((e) => e.success),
      ).toBe(true);
    } else
      codeCommit(
        w,
        'splunk-automation',
        branch,
        tpl,
        V7_STARTER_FILES[tpl]!.replace('{{ practice_sourcetype }}', 'v7_reviewed'),
        'Scope reviewed input sourcetype',
      );
    if (n >= 24) {
      const pr = reviewAction(w, 'open', undefined, {
        repo: 'splunk-automation',
        branch,
        title: 'Reviewed V7 input change',
      });
      if (n >= 25) reviewAction(w, 'check', pr.id);
      if (n >= 26) {
        expect(pr.check?.messages).toEqual([
          'YAML, configuration, conflict and fixture-secret checks passed',
        ]);
        reviewAction(w, 'approve', pr.id);
        reviewAction(w, 'merge', pr.id);
        expect(
          foundationCheck(w, {
            kind: 'configuration',
            label: 'not deployed',
            host: 'ds01',
            conf: 'inputs',
            stanza: 'monitor:///var/log/practice/automation.log',
            key: 'sourcetype',
            equals: n === 27 ? 'v7_broken' : 'v7_reviewed',
            effective: true,
          }),
        ).toBe(n === 27);
        const r = executePlaybook(w, 'splunk-automation', 'main', input, { limit: 'ds01' });
        expect(r.failed).toBe(0);
      }
    }
  }
}
for (const d of lessons)
  describe(d.id, () => {
    const checks = d.checks as FoundationCheck[];
    const fresh = () => {
      const w = createWorld(profileWorldConfig(profile));
      setupFoundation(w, d.setup ?? []);
      w.lesson = { id: d.id, learner: 'Regression', startedTick: 0, hints: 0, notes: '' };
      return w;
    };
    const passes = (w: ReturnType<typeof fresh>) => checks.every((c) => foundationCheck(w, c));
    const complete = (w: ReturnType<typeof fresh>) => {
      solve(w, d.id);
      w.lesson!.answers = Object.fromEntries(
        checks.filter((c) => c.kind === 'answer').map((c) => [c.id, foundationAnswer(w, c)!]),
      );
    };
    it(d.id + ':solution', () => {
      const w = fresh();
      expect(passes(w)).toBe(false);
      complete(w);
      expect(checks.map((c) => ({ label: c.label, pass: foundationCheck(w, c) }))).toEqual(
        checks.map((c) => ({ label: c.label, pass: true })),
      );
    });
    it(d.id + ':incorrect-action', () => {
      const w = fresh();
      commands(w, ['ansible-playbook playbooks/v7_connectivity.yml --limit idx01']);
      w.lesson!.answers = { activation: 'separate deployment' };
      expect(passes(w)).toBe(false);
    });
    it(d.id + ':no-false-completion', () => {
      const w = fresh();
      complete(w);
      if (Number(d.id.slice(3)) >= 23)
        w.git!.repos['splunk-automation']!.branches['feature/v7-change'] = 'missing';
      w.code!.runs = [];
      if (Number(d.id.slice(3)) >= 24) w.code!.reviews = [];
      expect(passes(w)).toBe(false);
    });
    it(d.id + ':reset', () => {
      const w = fresh(),
        baseline = saveWorld(w);
      complete(w);
      const reset = loadWorld(baseline, []);
      expect(passes(reset)).toBe(false);
      expect(saveWorld(reset)).toEqual(baseline);
    });
    it(d.id + ':resume', () => {
      const w = fresh();
      complete(w);
      const loaded = loadWorld(saveWorld(w), []);
      expect(passes(loaded)).toBe(true);
      expect(loaded.lesson).toEqual(w.lesson);
    });
    it(d.id + ':isolation', () => {
      const free = fresh(),
        other = fresh(),
        baseline = saveWorld(free);
      complete(other);
      expect(saveWorld(free)).toEqual(baseline);
    });
  });
describe('V7 starter additions', () => {
  it('adds untracked sources without rewriting commits, refuses stale/conflicting trees', () => {
    const w = createWorld(profileWorldConfig(profile)),
      before = structuredClone(w.git!.repos),
      p = previewStarterPack(w);
    expect(p.files.every((f) => f.status === 'missing')).toBe(true);
    const added = installStarterPack(w, p.revision);
    expect(added.files.every((f) => f.status === 'present')).toBe(true);
    expect(w.git!.repos).toEqual(before);
    expect(() => installStarterPack(w, p.revision)).toThrow('changed');
    expect(installStarterPack(w, added.revision)).toEqual(added);
    edit(w, input, 'custom content');
    const conflict = previewStarterPack(w);
    expect(conflict.files.find((f) => f.path === input)?.status).toBe('conflict');
    expect(() => installStarterPack(w, conflict.revision)).toThrow('conflict');
    expect(hostFs(w, resolveHost(w, 'ansible01')!).readFile(root + input, ROOT)).toBe('custom content');
  });
});
