import { reviewAction } from '../src/git/code';
import { hostname } from '../src/fleet/query';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  saveWorld,
  loadWorld,
  tickWorld,
  summarizeFleet,
} from '../src';
import { resolveHost } from '../src/hosts/profile';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { head } from '../src/git/state';
import { mergeTrees } from '../src/git/merge';
import { testTerm } from './helpers';
function world(id = 'lab') {
  return createWorld({
    ...profileWorldConfig(
      parseProfile(readFileSync(new URL(`../../../profiles/${id}.yaml`, import.meta.url), 'utf8')),
    ),
    ...(id === 'apl' ? { fleetSize: 50 } : {}),
  });
}
function terminal(w = world(), deployer = false) {
  const t = testTerm(w);
  expect(t.run(`ssh ${deployer ? 'splunk@deployer01' : 'svc_ansible@ansible01'}`)).toContain('Last login');
  t.run('cd ~/splunk-automation');
  t.run('git config --global user.name "Practice Engineer"');
  t.run('git config --global user.email learner@example.test');
  return t;
}
function read(w: ReturnType<typeof world>, p: string, host = 'ansible01') {
  return hostFs(w, resolveHost(w, host)!).readFile(
    (host === 'ansible01' ? '/home/svc_ansible' : '/home/splunk') + '/splunk-automation/' + p,
    ROOT,
  );
}
function gitTree(w: ReturnType<typeof world>, host = 'ansible01') {
  const c = w.git!.checkouts.find((c) => c.host === host && c.repo === 'splunk-automation')!;
  return w.git!.repos[c.repo]!.commits[head(c)]!.tree;
}
describe('Lab and automation foundation', () => {
  it('has exactly one persistently offline UF, three indexers and no automation Splunk service', () => {
    const w = world();
    expect(w.infra.filter((n) => n.role === 'indexer' && !n.retired)).toHaveLength(3);
    expect(w.fleet.size).toBe(50);
    expect(testTerm(w).run(`ssh splunk@${hostname(w, 0)}`)).toContain('Connection timed out');
    expect(resolveHost(w, 'ansible01')!.splunk).toBeNull();
    expect(summarizeFleet(w).byHealth.offline).toBe(1);
    tickWorld(w, 1000);
    expect(summarizeFleet(w).byHealth.offline).toBe(1);
    expect(summarizeFleet(w).byHealth.healthy).toBe(49);
  });
  it('supports svc_ansible SSH and sudo while denying other users', () => {
    const t = testTerm(world());
    expect(t.run('ssh splunk@ansible01')).toContain('Permission denied');
    t.run('ssh svc_ansible@ansible01');
    expect(t.run('whoami')).toBe('svc_ansible\n');
    expect(t.run('sudo whoami')).toBe('root\n');
    expect(t.run('cat /etc/passwd')).toContain('svc_ansible');
    expect(t.run('/opt/splunk/bin/splunk status')).toContain('No such file');
  });
  it('gives independent repos on automation/deployer and leaves default/Erie alone', () => {
    const w = world('apl');
    expect(w.git!.checkouts).toHaveLength(4);
    expect(w.infra.filter((n) => n.role === 'indexer' && !n.retired)).toHaveLength(20);
    expect(world('erie').git).toBeUndefined();
    expect(createWorld({ fleetSize: 10 }).git).toBeUndefined();
    const t = terminal(w);
    expect(t.run('cat inventories/prod/hosts.yml')).toContain('idx20:');
    expect(t.run('ls roles/splunk_indexes/templates')).toContain('indexes.conf.j2');
  });
  it('migrates v2 APL without rewinding or rewriting host config and saves the migration once', () => {
    const old = world('apl');
    old.config.automationVersion = 0;
    delete old.git;
    old.infra = old.infra.filter((n) => n.role !== 'automation');
    tickWorld(old, 8);
    const fs = hostFs(old, resolveHost(old, 'idx01')!);
    fs.writeFile('/tmp/keep.txt', 'kept', ROOT);
    old.uiState.notes = 'keep me';
    const saved = { ...saveWorld(old), version: 2 as const };
    const upgraded = loadWorld(saved, []);
    expect(upgraded.clock.tick).toBe(8);
    expect(upgraded.uiState.notes).toBe('keep me');
    expect(upgraded.infra.filter((n) => n.role !== 'automation')).toEqual(old.infra);
    expect(hostFs(upgraded, resolveHost(upgraded, 'idx01')!).readFile('/tmp/keep.txt', ROOT)).toBe('kept');
    expect(upgraded.git?.version).toBe(1);
    expect(terminal(upgraded).run('git status')).toContain('working tree clean');
    const next = saveWorld(upgraded);
    expect(saveWorld(loadWorld(next, []))).toEqual(next);
  });
});
describe('simulated Git', () => {
  it('follows G1/G2 with real staged vs unstaged separation and author identity', () => {
    const t = testTerm(world());
    t.run('ssh svc_ansible@ansible01');
    t.run('cd ~/splunk-automation');
    expect(t.run('git status')).toContain('On branch main');
    expect(t.run('git log --oneline')).toContain('Initial practice repository');
    t.run('echo first >> README.md');
    expect(t.run('git diff')).toContain('+first');
    t.run('git add README.md');
    t.run('echo second >> README.md');
    expect(t.run('git diff --staged')).not.toContain('+second');
    expect(t.run('git commit -m "First edit"')).toContain('Please tell me who you are');
    t.run('git config --global user.name Learner');
    t.run('git config --global user.email learner@example.test');
    expect(t.run('git commit -m "First edit"')).toContain('First edit');
    expect(gitTree(t.world)['README.md']!.text).toContain('first');
    expect(gitTree(t.world)['README.md']!.text).not.toContain('second');
    expect(t.run('git diff')).toContain('+second');
    expect(t.run('git show')).toContain('Author: Learner');
  });
  it('isolates branches, pushes, stashes, restores, and rejects dirty switches', () => {
    const t = terminal();
    t.run('git switch -c topic');
    t.run('echo branch >> README.md');
    expect(t.run('git switch main')).toContain('local changes');
    expect(t.run('git stash')).toContain('Saved working');
    t.run('git switch main');
    expect(read(t.world, 'README.md')).not.toContain('branch\n');
    t.run('git switch topic');
    expect(t.run('git stash pop')).toContain('Dropped');
    expect(read(t.world, 'README.md')).toContain('branch\n');
    t.run('git add README.md');
    t.run('git commit -m topic');
    expect(t.run('git push -u origin topic')).toContain('git@github.apl.sim');
    t.run('echo temporary >> README.md');
    t.run('git restore README.md');
    expect(t.run('git status')).toContain('working tree clean');
    t.run('git switch main');
    expect(read(t.world, 'README.md')).not.toContain('branch\n');
  });
  it('tracks deletes and executable modes and preserves untracked files on reset', () => {
    const t = terminal();
    t.run('chmod +x README.md');
    t.run('git add README.md');
    t.run('git commit -m executable');
    expect(gitTree(t.world)['README.md']!.mode).toBe(0o755);
    t.run('rm README.md');
    t.run('git add -A');
    expect(t.run('git diff --staged')).toContain('deleted file');
    t.run('git reset --hard HEAD');
    expect(read(t.world, 'README.md')).toContain('splunk-automation');
    t.run('echo safe > untracked.txt');
    t.run('git reset --hard HEAD');
    expect(read(t.world, 'untracked.txt')).toContain('safe');
  });
  it('blocks force pushes to main and records unsafe evidence', () => {
    const t = terminal();
    const before = t.world.git!.repos['splunk-automation']!.branches.main;
    expect(t.run('git push --force origin main')).toContain('force-push to main is blocked');
    expect(t.world.git!.repos['splunk-automation']!.branches.main).toBe(before);
    expect(t.world.git!.unsafe).toHaveLength(1);
    expect(loadWorld(saveWorld(t.world), []).git!.unsafe).toEqual(t.world.git!.unsafe);
  });
  it('reverts using a new commit and supports blame, log count and reset modes', () => {
    const t = terminal();
    const original = head(t.world.git!.checkouts[0]!);
    t.run('echo practice >> README.md');
    t.run('git add .');
    t.run('git commit -m practice');
    const commit = head(t.world.git!.checkouts[0]!);
    expect(t.run('git blame README.md')).toContain('Practice Engineer');
    expect(t.run('git log --oneline -1').trim().split('\n')).toHaveLength(1);
    expect(t.run(`git revert ${commit.slice(0, 7)}`)).toContain('Revert');
    expect(gitTree(t.world)['README.md']!.text).not.toContain('practice\n');
    expect(head(t.world.git!.checkouts[0]!)).not.toBe(original);
    t.run('git reset --soft HEAD~1');
    expect(t.run('git status')).toContain('Changes to be committed');
    t.run('git reset --mixed HEAD');
    expect(t.run('git status')).toContain('Changes not staged');
  });
  it('fetches and merges divergent clones with markers, resolution and both parents', () => {
    const w = world('apl'),
      a = terminal(w),
      b = terminal(w, true);
    a.run('git switch -c ours');
    a.run('echo ours > group_vars/indexers.yml');
    a.run('git add .');
    a.run('git commit -m ours');
    a.run('git push -u origin ours');
    b.run('git switch -c teammate');
    b.run('echo theirs > group_vars/indexers.yml');
    b.run('git add .');
    b.run('git commit -m theirs');
    b.run('git push -u origin teammate');
    const pr = reviewAction(w,'open',undefined,{repo:'splunk-automation',branch:'teammate',title:'Teammate change'});
    reviewAction(w,'check',pr.id); reviewAction(w,'approve',pr.id); reviewAction(w,'merge',pr.id);
    expect(a.run('git pull origin main')).toContain('CONFLICT (content)');
    expect(read(w, 'group_vars/indexers.yml')).toContain('<<<<<<< HEAD');
    expect(a.run('git commit -m unresolved')).toContain('unmerged');
    a.run('echo both > group_vars/indexers.yml');
    a.run('git add group_vars/indexers.yml');
    expect(a.run('git commit -m resolved')).toContain('resolved');
    const c = w.git!.checkouts.find((c) => c.host === 'ansible01' && c.repo === 'splunk-automation')!;
    expect(w.git!.repos[c.repo]!.commits[head(c)]!.parents).toHaveLength(2);
    expect(a.run('git push')).toContain('ours -> ours');
    b.run('git fetch');
    expect(b.run('git switch ours')).toContain("Switched to branch 'ours'");
    expect(read(w, 'group_vars/indexers.yml', 'deployer01')).toBe('both\n');
  });
  it('merges separate line edits without losing either change', () => {
    const file = (text: string) => ({ a: { text, mode: 0o644 } });
    const result = mergeTrees(
      file('one\ntwo\nthree\n'),
      file('ONE\ntwo\nthree\n'),
      file('one\ntwo\nTHREE\n'),
    );
    expect(result.conflicts).toEqual([]);
    expect(result.tree.a!.text).toBe('ONE\ntwo\nTHREE\n');
  });
  it('keeps conflicting stash data and rejects untracked checkout overwrites', () => {
    const t = terminal();
    t.run('echo stashed > README.md');
    t.run('git stash');
    t.run('echo committed > README.md');
    t.run('git add .');
    t.run('git commit -m changed');
    expect(t.run('git stash pop')).toContain('CONFLICT');
    expect(t.world.git!.checkouts[0]!.stashes).toHaveLength(1);
    t.run('git reset --hard HEAD');
    t.run('git switch -c added');
    t.run('echo tracked > new.txt');
    t.run('git add .');
    t.run('git commit -m added');
    t.run('git switch main');
    t.run('echo preserve > new.txt');
    expect(t.run('git switch added')).toContain('would be overwritten');
    expect(read(t.world, 'new.txt')).toBe('preserve\n');
  });
  it('replays Git and VFS identically after edits, push, stash and reset', () => {
    const t = terminal();
    t.run('git switch -c saved');
    t.run('echo saved >> README.md');
    t.run('git add .');
    t.run('git commit -m Saved');
    t.run('git push -u origin saved');
    t.run('echo pending >> README.md');
    t.run('git stash');
    tickWorld(t.world, 3);
    const saved = saveWorld(t.world),
      w = loadWorld(JSON.parse(JSON.stringify(saved)), []);
    expect(w.git).toEqual(t.world.git);
    expect(read(w, 'README.md')).toBe(read(t.world, 'README.md'));
    expect(saveWorld(w)).toEqual(saved);
    expect(terminal(w).run('git stash pop')).toContain('Dropped');
    expect(read(w, 'README.md')).toContain('pending');
  });
  it('rejects external remotes, unsupported options and paths outside a repo', () => {
    const t = terminal();
    expect(t.run('git fetch https://example.com/repo')).toContain('only simulated remote');
    expect(t.run('git add ../../../../etc/passwd')).toContain('outside repository');
    expect(t.run('git switch --evil')).toContain('unsupported');
    expect(t.run('git branch __proto__')).toContain('invalid');
    expect(t.run('git rebase main')).toContain('not a supported');
  });
});
describe('Git edge cases and persistence size', () => {
  it('blocks alternate force refspecs and protects failed non-fast-forward pushes', () => {
    const t = terminal();
    for (const command of ['git push origin +main', 'git push --force-with-lease origin HEAD:main'])
      expect(t.run(command)).toContain('force-push to main is blocked');
    expect(t.world.git!.unsafe).toHaveLength(2);
    for (const command of ['git switch constructor', 'git show __proto__', 'git branch -D constructor'])
      expect(() => t.run(command)).not.toThrow();
    expect(t.run('git status')).toContain('On branch main');
  });
  it('journals only changed Git fields for a staged edit, not the fleet inventory', () => {
    const t = terminal(world('apl'));
    t.run('echo small >> README.md');
    const start = t.world.journal.log.length;
    t.run('git add README.md');
    const entries = t.world.journal.log.slice(start);
    expect(JSON.stringify(entries).length).toBeLessThan(2000);
    expect(entries.some((e) => e.k === 'git.patch')).toBe(true);
    expect(loadWorld(saveWorld(t.world), []).git).toEqual(t.world.git);
  });
});

describe('beginner editors', () => {
  it('supports the manual nano save/exit sequence and commits through the editor', () => {
    const t = terminal();
    expect(t.run('nano README.md')).toContain('^O');
    t.send('Practice edit\r');
    t.send('\x0f');
    t.send('\r');
    t.send('\x18');
    expect(read(t.world, 'README.md')).toContain('Practice edit');
    t.run('git add README.md');
    expect(t.run('git commit')).toContain('GNU nano');
    t.send('Message from editor');
    t.send('\x0f');
    t.send('\r');
    expect(t.send('\x18')).toContain('Message from editor');
    expect(t.run('git log --oneline -1')).toContain('Message from editor');
  });
  it('saves nano as a new filename and uses vi insert/write/quit', () => {
    const t = terminal();
    t.run('nano');
    t.send('New file');
    t.send('\x0f');
    t.send('new.txt');
    t.send('\r');
    t.send('\x18');
    expect(read(t.world, 'new.txt')).toBe('New file\n');
    t.run('vi new.txt');
    t.send('iVi ');
    t.send('\x1b');
    t.send(':wq\r');
    expect(read(t.world, 'new.txt')).toBe('Vi New file\n');
  });
});
