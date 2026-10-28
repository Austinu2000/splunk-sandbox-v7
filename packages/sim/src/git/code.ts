import labProfile from '../training/lab-profile.json';
import { createWorld } from '../world';
import { validateProfile, profileWorldConfig } from '../profile';
import type { CodeState, CodeReview } from '@sandbox/shared';
import type { World } from '../world';
import { commitObject, mergeBase, type Tree } from './state';
import { mergeTrees, diff } from './merge';
import { journal } from '../journal';
import { TrainingError } from '../training/engine';
import { runAnsible, yaml, type AnsibleOptions } from '../ansible/runner';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { applyClusterBundle } from '../hosts/cluster';
import { applyShcBundle } from '../operations';
import { reloadDeployServer } from '../hosts/running';
export function codeState(world: World): CodeState {
  return (world.code ??= { nextId: 1, reviews: [], runs: [] });
}
function persist(world: World) {
  journal(world, { k: 'code.state', state: structuredClone(codeState(world)) });
  if (world.git) journal(world, { k: 'git.state', state: structuredClone(world.git) });
}
export function codeView(world: World) {
  const state = codeState(world);
  return {
    state,
    repos: Object.values(world.git?.repos ?? {}).map((repo) => ({
      id: repo.id,
      branches: repo.branches,
      commits: repo.commits,
    })),
    diffs: Object.fromEntries(
      state.reviews.map((pr) => {
        const r = world.git?.repos[pr.repo];
        return [
          pr.id,
          r ? diff(r.commits[r.branches.main!]!.tree, r.commits[r.branches[pr.branch]!]!.tree) : '',
        ];
      }),
    ),
  };
}
export function codeCommit(
  world: World,
  repoId: string,
  branch: string,
  path: string,
  text: string,
  message: string,
) {
  return codeCommitFiles(world, repoId, branch, { [path]: text }, message);
}
export function codeCommitFiles(
  world: World,
  repoId: string,
  branch: string,
  files: Record<string, string>,
  message: string,
) {
  const repo = world.git?.repos[repoId];
  if (!repo) throw new TrainingError('Choose Lab or APL for Code and Ansible');
  if (
    !/^[\w/-]{1,80}$/.test(branch) ||
    ['main', 'master'].includes(branch) ||
    branch.includes('..') ||
    branch.split('/').some((p) => ['constructor', 'prototype', '__proto__'].includes(p))
  )
    throw new TrainingError('Use a feature branch');
  const entries = Object.entries(files);
  if (
    !entries.length ||
    entries.length > 200 ||
    entries.reduce((sum, [, text]) => sum + text.length, 0) > 2000000 ||
    message.trim().length < 3
  )
    throw new TrainingError('Enter a commit message and 1–200 bounded source files');
  for (const [path] of entries)
    if (
      !/^[\w./-]{1,250}$/.test(path) ||
      path.split('/').some((p) => ['..', '.git', 'constructor', 'prototype', '__proto__'].includes(p)) ||
      path.startsWith('/')
    )
      throw new TrainingError('Invalid repository path');
  const parent = repo.branches[branch] ?? repo.branches.main!,
    tree: Tree = structuredClone(repo.commits[parent]!.tree);
  for (const [path, text] of entries) tree[path] = { text, mode: 0o644 };
  const commit = commitObject(
    repo,
    tree,
    [parent],
    message,
    'Learner',
    'learner@example.test',
    world.clock.tick,
  );
  repo.branches[branch] = commit.id;
  persist(world);
  return commit;
}
export function checkTree(tree: Tree): string[] {
  const errors: string[] = [];
  for (const [path, file] of Object.entries(tree)) {
    const credentialSource = file.text.replace(
      /(^\s*url_password\s*:\s*)(['"]?)training-only\2\s*$/gm,
      '$1${V7_FIXTURE_PASSWORD}',
    );
    if (/^(<<<<<<<|=======|>>>>>>>)/m.test(file.text)) errors.push(`${path}: unresolved merge markers`);
    if (
      /(?:password|api_key|secret)\s*[:=]\s*[^\s${#][^\n]+/i.test(credentialSource) &&
      !file.text.includes('$ANSIBLE_VAULT') &&
      !/simulated|placeholder|lookup\(/i.test(file.text)
    )
      errors.push(`${path}: possible plaintext credential; use a training vault/placeholder`);
    if (/\.ya?ml$/.test(path)) {
      try {
        yaml(file.text);
      } catch (e) {
        errors.push(`${path}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (/\.conf$/.test(path)) {
      let section = false;
      for (const [i, line] of file.text.split('\n').entries()) {
        const s = line.trim();
        if (!s || s.startsWith('#') || s.startsWith(';')) continue;
        if (/^\[[^\]]+\]$/.test(s)) section = true;
        else if (!section || !s.includes('=')) errors.push(`${path}:${i + 1}: expected stanza/key=value`);
      }
    }
  }
  return errors;
}
export function reviewAction(
  world: World,
  action: string,
  id: number | undefined,
  input: Record<string, string> = {},
) {
  const state = codeState(world);
  if (action === 'open') {
    const repo = world.git?.repos[input.repo!];
    if (!repo || !repo.branches[input.branch!] || input.branch === 'main')
      throw new TrainingError('Push a feature branch first');
    if (!input.title?.trim()) throw new TrainingError('PR title required');
    const pr: CodeReview = {
      id: state.nextId++,
      repo: repo.id,
      branch: input.branch!,
      title: input.title,
      status: 'open',
      head: repo.branches[input.branch!]!,
      base: repo.branches.main!,
      comments: [],
    };
    state.reviews.push(pr);
    persist(world);
    return pr;
  }
  const pr = state.reviews.find((p) => p.id === id);
  if (!pr) throw new TrainingError('PR not found');
  const repo = world.git!.repos[pr.repo]!;
  const head = repo.branches[pr.branch]!,
    base = repo.branches.main!;
  if (action === 'comment') {
    if (!input.text?.trim()) throw new TrainingError('Comment required');
    pr.comments.push(input.text.slice(0, 5000));
  } else if (action === 'check') {
    if (pr.status !== 'open') throw new TrainingError('PR already merged');
    const errors = checkTree(repo.commits[head]!.tree);
    const common = mergeBase(repo, base, head);
    if (!common) errors.push('No merge base');
    else {
      const merge = mergeTrees(
        repo.commits[common]!.tree,
        repo.commits[base]!.tree,
        repo.commits[head]!.tree,
      );
      errors.push(...merge.conflicts.map((p) => `Merge conflict: ${p}`));
    }
    const policy = repo.commits[head]!.tree['.sandbox-ci.yml'];
    if (policy) {
      try {
        const config = yaml(policy.text) as {
          playbook?: string;
          limit?: string;
          expectedChangedPaths?: string[];
        };
        if (
          !config.playbook ||
          !Array.isArray(config.expectedChangedPaths) ||
          config.expectedChangedPaths.some((p) => typeof p !== 'string')
        )
          throw new TrainingError('CI requires playbook and expectedChangedPaths');
        const lab = createWorld(profileWorldConfig(validateProfile(labProfile)));
        const labRepo = lab.git!.repos['splunk-automation']!;
        const tree = structuredClone(repo.commits[head]!.tree);
        tree['inventories/lab/hosts.yml'] =
          labRepo.commits[labRepo.branches.main!]!.tree['inventories/lab/hosts.yml']!;
        const preview = runAnsible(lab, tree, config.playbook, {
          check: true,
          diff: true,
          inventory: 'inventories/lab/hosts.yml',
          limit: config.limit ?? 'idx01',
        });
        const paths = [
          ...new Set(
            preview.hosts.flatMap((h) =>
              h.messages
                .filter((m) => m.startsWith('DIFF '))
                .map((m) => h.host + ':' + m.split('\n')[0]!.slice(5)),
            ),
          ),
        ].sort();
        if (
          preview.failed ||
          preview.unreachable ||
          JSON.stringify(paths) !== JSON.stringify([...config.expectedChangedPaths].sort())
        )
          errors.push('Lab dry run differs from expectedChangedPaths or has failures');
        pr.comments.push(
          `CI dry run ${head.slice(0, 8)} on disposable Lab: ${preview.hosts.flatMap((h) => h.messages).join('\n')}`,
        );
      } catch (e) {
        errors.push(`Dry-run CI: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    pr.check = {
      head,
      base,
      passed: !errors.length,
      messages: errors.length ? errors : ['YAML, configuration, conflict and fixture-secret checks passed'],
    };
    pr.head = head;
    pr.base = base;
  } else if (action === 'approve') {
    if (pr.status !== 'open') throw new TrainingError('PR already merged');
    pr.approved = head;
  } else if (action === 'merge') {
    if (
      pr.status !== 'open' ||
      pr.approved !== head ||
      !pr.check?.passed ||
      pr.check.head !== head ||
      pr.check.base !== base
    )
      throw new TrainingError('Merge requires a current approval and passing checks for current head/base');
    const common = mergeBase(repo, base, head)!;
    const merged = mergeTrees(repo.commits[common]!.tree, repo.commits[base]!.tree, repo.commits[head]!.tree);
    if (merged.conflicts.length) throw new TrainingError('Resolve merge conflicts');
    const c = commitObject(
      repo,
      merged.tree,
      [base, head],
      `Merge PR #${pr.id}: ${pr.title}`,
      'Reviewer',
      'reviewer@example.test',
      world.clock.tick,
    );
    repo.branches.main = c.id;
    pr.status = 'merged';
    pr.head = c.id;
  } else if (action === 'deploy') {
    if (pr.status !== 'merged' || pr.repo !== 'splunk-apps')
      throw new TrainingError('Deploy a merged apps PR; automation merges require a playbook run');
    const tree = repo.commits[pr.head]!.tree;
    const errors = checkTree(tree);
    if (errors.length) throw new TrainingError(errors.join('\n'));
    const scopes: [string, string][] = [
      ['manager-apps/', 'cluster_manager'],
      ['deployment-apps/', 'deployment_server'],
      ['shcluster/apps/', 'deployer'],
    ];
    const previous = repo.commits[repo.commits[pr.head]!.parents[0]!]!.tree;
    const changedScopes = scopes.filter(([prefix]) =>
      [...new Set([...Object.keys(previous), ...Object.keys(tree)])].some(
        (path) => path.startsWith(prefix) && previous[path]?.text !== tree[path]?.text,
      ),
    );
    // Validate every target before staging any files, including profiles without a deployer.
    for (const [, role] of changedScopes)
      if (!world.infra.some((n) => n.role === role))
        throw new TrainingError(`Deployment target ${role} unavailable`);
    for (const [prefix, role] of changedScopes) {
      const files = Object.entries(tree).filter(([p]) => p.startsWith(prefix));
      const node = world.infra.find((n) => n.role === role)!;
      const host = resolveHost(world, node.hostname)!;
      const fs = hostFs(world, host);
      for (const [path, file] of files) {
        const dst = `/opt/splunk/etc/${path}`;
        fs.mkdir(dst.slice(0, dst.lastIndexOf('/')), ROOT, { parents: true });
        fs.writeFile(dst, file.text, ROOT);
      }
      if (role === 'cluster_manager') applyClusterBundle(world, host);
      if (role === 'deployment_server') reloadDeployServer(world, host);
      if (role === 'deployer') applyShcBundle(world, host);
    }
    pr.deployed = pr.head;
    pr.comments.push(`Deployment completed at tick ${world.clock.tick}. Safe to retry this revision.`);
  } else throw new TrainingError('Unknown PR action');
  persist(world);
  return pr;
}
export function executePlaybook(
  world: World,
  repoId: string,
  branch: string,
  path: string,
  options: AnsibleOptions = {},
) {
  const repo = world.git?.repos[repoId];
  const c = repo?.commits[repo.branches[branch]!];
  if (!c) throw new TrainingError('Repository branch not found');
  const result = runAnsible(world, c.tree, path, options);
  result.commit = c.id;
  codeState(world).runs.push(result);
  persist(world);
  return result;
}
