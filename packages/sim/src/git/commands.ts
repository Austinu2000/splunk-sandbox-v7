import { reviewAction } from './code';
import { gitPatches } from './journal';
import { journal } from '../journal';
import { dirname } from '../vfs/path';
import { can, FsError } from '../vfs/vfs';
import type { Shell } from '../shell/shell';
import { fail, ok, type CommandFn, type CmdResult } from '../shell/types';
import { nanoProgram } from '../shell/programs/editor';
import { ancestor, commitObject, head, mergeBase, same, type Checkout, type Repo, type Tree } from './state';
import { blameLines, diff, lineCount, mergeTrees } from './merge';

class GitError extends Error {}
function error(s: string): never {
  throw new GitError(s);
}
const unsafeKey = (s: string) =>
  s.split('/').some((p) => ['__proto__', 'constructor', 'prototype', '.git'].includes(p));
const validBranch = (s: string) =>
  /^[A-Za-z0-9][A-Za-z0-9_./-]*$/.test(s) &&
  !s.includes('..') &&
  !s.includes('//') &&
  !s.endsWith('/') &&
  !s.endsWith('.lock') &&
  !s.endsWith('.') &&
  !unsafeKey(s);
function current(sh: Shell): Checkout {
  const c = sh.world.git?.checkouts.find(
    (c) => c.host === sh.host.hostname && (sh.cwd === c.root || sh.cwd.startsWith(c.root + '/')),
  );
  if (!c || !sh.fs.exists(c.root + '/.git'))
    return error('fatal: not a git repository (or any of the parent directories): .git');
  sh.fs.lookup(c.root, sh.cred);
  return c;
}
function working(sh: Shell, c: Checkout): Tree {
  const out: Tree = {};
  let bytes = 0;
  function visit(path: string) {
    for (const [name, n] of sh.fs.readdir(path, sh.cred)) {
      if (name === '.git') continue;
      const absolute = path + '/' + name,
        rel = absolute.slice(c.root.length + 1);
      if (unsafeKey(rel)) error('fatal: unsupported reserved path');
      if (Object.keys(out).length >= 15000) error('fatal: repository file limit exceeded');
      if (n.type === 'dir') visit(absolute);
      else {
        const text = sh.fs.readFile(absolute, sh.cred);
        bytes += text.length;
        if (bytes > 8_000_000) error('fatal: repository content limit exceeded');
        out[rel] = { text, mode: n.mode & 0o111 ? 0o755 : 0o644 };
      }
    }
  }
  visit(c.root);
  return out;
}
function applyTree(sh: Shell, c: Checkout, from: Tree, to: Tree) {
  // Preflight every changed path before mutating anything, including untracked obstructions.
  for (const p of new Set([...Object.keys(from), ...Object.keys(to)])) {
    if (same(from[p], to[p])) continue;
    const abs = c.root + '/' + p,
      n = sh.fs.findNode(abs);
    if (to[p] && !from[p] && n) error(`error: untracked working tree file '${p}' would be overwritten`);
    if (n && n.type !== 'file') error(`error: '${p}' is not a regular file`);
    if (n && !can(n, sh.cred, 2)) error(`error: unable to write '${p}': Permission denied`);
    let parent = dirname(abs);
    while (!sh.fs.exists(parent)) parent = dirname(parent);
    const pn = sh.fs.lookup(parent, sh.cred);
    if (pn.type !== 'dir' || !can(pn, sh.cred, 2)) error(`error: unable to update '${p}': Permission denied`);
  }
  for (const p of Object.keys(from))
    if (!to[p] && sh.fs.exists(c.root + '/' + p)) sh.fs.remove(c.root + '/' + p, sh.cred);
  for (const [p, f] of Object.entries(to)) {
    if (same(from[p], f)) continue;
    const abs = c.root + '/' + p;
    sh.fs.mkdir(dirname(abs), sh.cred, { parents: true });
    sh.fs.writeFile(abs, f.text, sh.cred);
    sh.fs.setMeta(abs, { mode: f.mode }, sh.cred);
  }
}
function revision(repo: Repo, c: Checkout, input = 'HEAD'): string {
  if (unsafeKey(input)) error('fatal: invalid revision');
  const match = /^(.*?)([~^])(\d*)$/.exec(input);
  if (match) {
    let id = revision(repo, c, match[1] || 'HEAD');
    const count = Number(match[3] || 1);
    if (count > 10000) return error('fatal: revision depth limit exceeded');
    if (match[2] === '^') id = repo.commits[id]?.parents[count - 1] ?? '';
    else for (let i = 0; i < count; i++) id = repo.commits[id]?.parents[0] ?? '';
    return id || error(`fatal: bad revision '${input}'`);
  }
  const found =
    input === 'HEAD'
      ? head(c)
      : (c.branches[input] ?? (input.startsWith('origin/') ? c.tracking[input.slice(7)] : undefined));
  if (found) return found;
  const visible = new Set<string>(),
    queue = [...Object.values(c.branches), ...Object.values(c.tracking), ...(c.detached ? [c.detached] : [])];
  while (queue.length) {
    const id = queue.pop()!;
    if (visible.has(id)) continue;
    visible.add(id);
    queue.push(...(repo.commits[id]?.parents ?? []));
  }
  const ids = [...visible].filter((id) => /^[a-f0-9]{4,40}$/.test(input) && id.startsWith(input));
  if (ids.length === 1) return ids[0]!;
  return error(`fatal: ambiguous argument '${input}': unknown revision or path not in the working tree.`);
}
const changed = (a: Tree, b: Tree) =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((p) => !same(a[p], b[p])).sort();
const trackedWork = (work: Tree, index: Tree) =>
  Object.fromEntries(Object.entries(work).filter(([p]) => Object.hasOwn(index, p)));
function clean(sh: Shell, c: Checkout, repo: Repo) {
  if (
    c.conflicts.length ||
    changed(repo.commits[head(c)]!.tree, c.index).length ||
    changed(c.index, trackedWork(working(sh, c), c.index)).length
  )
    error(
      'error: Your local changes would be overwritten. Please commit your changes or stash them before you switch branches.',
    );
}
function setHead(c: Checkout, id: string) {
  if (c.branch) c.branches[c.branch] = id;
  else c.detached = id;
}
function identity(sh: Shell, c: Checkout) {
  const i = { ...sh.world.git!.identities[sh.host.hostname + ':' + sh.user], ...c.identity };
  if (!i.name || !i.email)
    error(
      'Author identity unknown\n\n*** Please tell me who you are.\n\nRun\n  git config --global user.email "you@example.com"\n  git config --global user.name "Your Name"',
    );
  return { name: i.name!, email: i.email! };
}
function makeCommit(sh: Shell, c: Checkout, repo: Repo, message: string, extra?: string): string {
  if (c.conflicts.length) error('error: Committing is not possible because you have unmerged files.');
  if (!message.trim()) error('Aborting commit due to empty commit message.');
  const i = identity(sh, c),
    old = head(c);
  if (!changed(repo.commits[old]!.tree, c.index).length && !extra && !c.mergeParent)
    error(`On branch ${c.branch ?? 'HEAD (detached)'}\nnothing to commit, working tree clean`);
  const next = commitObject(
    repo,
    c.index,
    [old, ...(extra || c.mergeParent ? [extra ?? c.mergeParent!] : [])],
    message.trim(),
    i.name,
    i.email,
    sh.world.clock.tick,
  );
  setHead(c, next.id);
  delete c.mergeParent;
  delete c.mergeOriginal;
  return `[${c.branch ?? 'detached HEAD'} ${next.id.slice(0, 7)}] ${message.trim().split('\n')[0]}\n`;
}
function scope(sh: Shell, c: Checkout, arg: string): string {
  const p = sh.resolve(arg);
  if (p !== c.root && !p.startsWith(c.root + '/')) return error(`fatal: '${arg}' is outside repository`);
  const rel = p === c.root ? '' : p.slice(c.root.length + 1);
  if (unsafeKey(rel)) error('fatal: invalid pathspec');
  return rel;
}
function pathMatches(path: string, prefix: string) {
  return !prefix || path === prefix || path.startsWith(prefix + '/');
}
function ignored(work: Tree, path: string) {
  const patterns = (work['.gitignore']?.text ?? '').split('\n').filter((s) => s && !s.startsWith('#'));
  return patterns.some((p) =>
    p.startsWith('*.') ? path.endsWith(p.slice(1)) : path === p || path.endsWith('/' + p),
  );
}
function status(sh: Shell, c: Checkout, r: Repo, short: boolean): string {
  const work = working(sh, c),
    base = r.commits[head(c)]!.tree;
  const staged = changed(base, c.index),
    unstaged = changed(c.index, trackedWork(work, c.index)),
    untracked = Object.keys(work).filter(
      (p) => !Object.hasOwn(c.index, p) && !Object.hasOwn(base, p) && !ignored(work, p),
    );
  const letter = (before: Tree, after: Tree, p: string) => (!before[p] ? 'A' : !after[p] ? 'D' : 'M');
  if (short)
    return [...new Set([...staged, ...unstaged, ...untracked, ...c.conflicts])]
      .sort()
      .map(
        (p) =>
          `${c.conflicts.includes(p) ? 'UU' : untracked.includes(p) ? '??' : (staged.includes(p) ? letter(base, c.index, p) : ' ') + (unstaged.includes(p) ? letter(c.index, work, p) : ' ')} ${p}\n`,
      )
      .join('');
  let out = c.branch ? `On branch ${c.branch}\n` : `HEAD detached at ${head(c).slice(0, 7)}\n`;
  const upstream = c.branch && c.upstream[c.branch],
    remote = upstream && c.tracking[upstream];
  if (remote)
    out +=
      remote === head(c)
        ? `Your branch is up to date with 'origin/${upstream}'.\n`
        : ancestor(r, remote, head(c))
          ? `Your branch is ahead of 'origin/${upstream}'.\n`
          : ancestor(r, head(c), remote)
            ? `Your branch is behind 'origin/${upstream}'.\n`
            : `Your branch and 'origin/${upstream}' have diverged.\n`;
  if (c.conflicts.length)
    out += '\nUnmerged paths:\n' + c.conflicts.map((p) => '\tboth modified:   ' + p + '\n').join('');
  if (staged.length)
    out +=
      '\nChanges to be committed:\n' +
      staged
        .map((p) => `\t${!base[p] ? 'new file' : !c.index[p] ? 'deleted' : 'modified'}:   ${p}\n`)
        .join('');
  if (unstaged.length)
    out +=
      '\nChanges not staged for commit:\n' +
      unstaged.map((p) => `\t${work[p] ? 'modified' : 'deleted'}:   ${p}\n`).join('');
  if (untracked.length) out += '\nUntracked files:\n' + untracked.map((p) => '\t' + p + '\n').join('');
  if (!staged.length && !unstaged.length && !untracked.length && !c.conflicts.length)
    out += 'nothing to commit, working tree clean\n';
  return out;
}
/** Pure interpreter over simulated state/VFS. All accepted changes are journaled as state plus VFS entries. */
export function executeGit(sh: Shell, args: string[]): CmdResult {
  const before = sh.world.git ? structuredClone(sh.world.git) : undefined;
  try {
    const output = run(sh, args);
    if (args[0] === 'push') for (const pr of sh.world.code?.reviews ?? []) if (pr.status === 'open') reviewAction(sh.world, 'check', pr.id);
    return ok(output);
  } catch (e) {
    if (e instanceof GitError || e instanceof FsError)
      return fail(e instanceof FsError ? `fatal: ${e.path}: ${e.message}` : e.message, 128);
    throw e;
  } finally {
    if (sh.world.git && before) {
      const patches = gitPatches(before, sh.world.git);
      if (patches.length) journal(sh.world, { k: 'git.patch', patches });
    }
  }
}
function run(sh: Shell, args: string[]): string {
  if (!sh.world.git) error('git: command not available in this environment');
  const [cmd, ...a] = args;
  if (cmd === 'config' && a.includes('--global')) {
    const vals = a.filter((v) => v !== '--global');
    const key = vals[0];
    if (!['user.name', 'user.email'].includes(key ?? '') || vals.length > 2)
      error('error: supported config keys: user.name, user.email');
    const slot = sh.host.hostname + ':' + sh.user;
    const i = (sh.world.git!.identities[slot] ??= {});
    const field = key === 'user.name' ? 'name' : 'email';
    if (vals.length === 1) return (i[field] ?? '') + '\n';
    i[field] = vals[1]!;
    return '';
  }
  const c = current(sh),
    r = sh.world.git!.repos[c.repo]!;
  if (!can(sh.fs.lookup(c.root, sh.cred), sh.cred, 2)) error('fatal: insufficient permission for repository');
  const base = () => r.commits[head(c)]!.tree;
  if (cmd === 'status') {
    if (a.some((v) => !['--short', '-s'].includes(v))) error('error: unsupported status option');
    return status(sh, c, r, a.length > 0);
  }
  if (cmd === 'config') {
    if (!['user.name', 'user.email'].includes(a[0] ?? '') || a.length > 2)
      error('error: supported config keys: user.name, user.email');
    const k = a[0] === 'user.name' ? 'name' : 'email';
    if (a.length === 1) return (c.identity[k] ?? '') + '\n';
    c.identity[k] = a[1]!;
    return '';
  }
  if (cmd === 'diff') {
    const staged = a.includes('--staged') || a.includes('--cached');
    const vals = a.filter((v) => !['--staged', '--cached', '--'].includes(v));
    if (vals.some((v) => v.startsWith('-'))) error('error: unsupported diff option');
    let left = staged ? base() : c.index,
      right = staged ? c.index : trackedWork(working(sh, c), c.index);
    if (
      vals.length &&
      (vals[0] === 'HEAD' || c.branches[vals[0]!] || c.tracking[vals[0]!.replace(/^origin\//, '')])
    ) {
      left = r.commits[revision(r, c, vals.shift())]!.tree;
      right = working(sh, c);
    }
    if (vals.length) {
      const scopes = vals.map((v) => scope(sh, c, v));
      left = Object.fromEntries(Object.entries(left).filter(([p]) => scopes.some((s) => pathMatches(p, s))));
      right = Object.fromEntries(
        Object.entries(right).filter(([p]) => scopes.some((s) => pathMatches(p, s))),
      );
    }
    return diff(left, right);
  }
  if (cmd === 'add') {
    if (!a.length) return 'Nothing specified, nothing added.\n';
    if (a.some((v) => v.startsWith('-') && !['--', '-A', '--all'].includes(v)))
      error('error: unsupported add option');
    const work = working(sh, c),
      all = a.includes('-A') || a.includes('--all'),
      specs = a.filter((v) => !['--', '-A', '--all'].includes(v));
    const scopes = all ? [''] : specs.map((p) => scope(sh, c, p));
    for (const s of scopes)
      if (![...Object.keys(work), ...Object.keys(c.index)].some((p) => pathMatches(p, s)))
        error(`fatal: pathspec '${s}' did not match any files`);
    for (const p of new Set([...Object.keys(work), ...Object.keys(c.index)]))
      if (scopes.some((s) => pathMatches(p, s)) && (Object.hasOwn(c.index, p) || !ignored(work, p))) {
        if (work[p]) c.index[p] = work[p]!;
        else delete c.index[p];
        c.conflicts = c.conflicts.filter((x) => x !== p);
      }
    return '';
  }
  if (cmd === 'commit') {
    if (a[0] !== '-m' || a.length !== 2) error('usage: git commit -m <message>');
    return makeCommit(sh, c, r, a[1]!);
  }
  if (cmd === 'log') {
    let count = 20;
    for (let i = 0; i < a.length; i++) {
      if (a[i] === '--oneline') continue;
      if (a[i] === '-n') {
        count = Number(a[++i]);
        continue;
      }
      if (/^-\d+$/.test(a[i]!)) {
        count = Number(a[i]!.slice(1));
        continue;
      }
      error('error: unsupported log option');
    }
    if (!Number.isInteger(count) || count < 0 || count > 1000) error('fatal: invalid log count');
    let out = '';
    const queue = [head(c)];
    const seen = new Set<string>();
    while (queue.length && seen.size < count) {
      const id = queue.shift()!;
      if (seen.has(id)) continue;
      seen.add(id);
      const co = r.commits[id]!;
      out += a.includes('--oneline')
        ? `${id.slice(0, 7)} ${co.message.split('\n')[0]}\n`
        : `commit ${id}\nAuthor: ${co.name} <${co.email}>\n\n    ${co.message}\n\n`;
      queue.unshift(...co.parents);
    }
    return out;
  }
  if (cmd === 'branch') {
    if (!a.length || a[0] === '-a' || a[0] === '-r') {
      const local =
        a[0] === '-r'
          ? ''
          : Object.keys(c.branches)
              .sort()
              .map((b) => (b === c.branch ? '* ' : '  ') + b + '\n')
              .join('');
      return (
        local +
        (a.length
          ? Object.keys(c.tracking)
              .sort()
              .map((b) => '  ' + (a[0] === '-a' ? 'remotes/' : '') + 'origin/' + b + '\n')
              .join('')
          : '')
      );
    }
    if (a[0] === '-d' || a[0] === '-D') {
      const b = a[1]!;
      if (a.length !== 2 || !validBranch(b) || !c.branches[b] || b === c.branch)
        error('error: cannot delete branch');
      if (a[0] === '-d' && !ancestor(r, c.branches[b]!, head(c)))
        error(`error: The branch '${b}' is not fully merged.`);
      delete c.branches[b];
      delete c.upstream[b];
      return `Deleted branch ${b}.\n`;
    }
    const b = a[0]!;
    if (a.length > 2 || !validBranch(b) || c.branches[b]) error('fatal: invalid or existing branch name');
    c.branches[b] = revision(r, c, a[1]);
    return '';
  }
  if (cmd === 'switch' || cmd === 'checkout') {
    const create = a[0] === '-c' || a[0] === '-b';
    const vals = create ? a.slice(1) : a;
    if (!vals.length || vals.length > (create ? 2 : 1) || vals.some((v) => v.startsWith('-')))
      error('error: unsupported checkout/switch options');
    const b = vals[0]!;
    if (!validBranch(b)) error('fatal: invalid branch or revision name');
    if (create && (!validBranch(b) || c.branches[b])) error('fatal: invalid or existing branch name');
    clean(sh, c, r);
    const id = create
      ? revision(r, c, vals[1])
      : (c.branches[b] ??
        c.tracking[b] ??
        (cmd === 'checkout' ? revision(r, c, b) : error(`fatal: invalid reference: ${b}`)));
    const before = base();
    applyTree(sh, c, before, r.commits[id]!.tree);
    if (create || (!c.branches[b] && c.tracking[b])) {
      c.branches[b] = id;
      if (c.tracking[b]) c.upstream[b] = b;
    }
    c.branch = c.branches[b] ? b : null;
    if (!c.branch) c.detached = id;
    c.index = structuredClone(r.commits[id]!.tree);
    return c.branch
      ? `Switched to ${create ? 'a new branch' : 'branch'} '${b}'\n`
      : `HEAD is now at ${id.slice(0, 7)}\n`;
  }
  if (cmd === 'fetch') {
    if (a.length > 1 || (a[0] && a[0] !== 'origin')) error('fatal: only simulated remote origin exists');
    c.tracking = { ...r.branches };
    return `From github.apl.sim:splunk/${c.repo}\nFetched remote branches.\n`;
  }
  if (cmd === 'push') {
    let force = a.includes('--force') || a.includes('-f') || a.includes('--force-with-lease');
    const upstream = a.includes('-u') || a.includes('--set-upstream');
    if (
      a.some(
        (v) =>
          v.startsWith('-') && !['--force', '--force-with-lease', '-f', '-u', '--set-upstream'].includes(v),
      )
    )
      error('error: unsupported push option');
    const vals = a.filter((v) => !v.startsWith('-'));
    if (vals.length > 2 || (vals[0] && vals[0] !== 'origin'))
      error('fatal: only simulated remote origin exists');
    const ref =
      vals[1] ?? (c.branch && c.upstream[c.branch] ? `${c.branch}:${c.upstream[c.branch]}` : undefined);
    if (!ref) error('fatal: The current branch has no upstream branch.\nUse git push -u origin <branch>.');
    if (ref.startsWith('+')) force = true;
    const [source, target = source] = ref.replace(/^\+/, '').split(':');
    if (!source || !target || !validBranch(target)) error('fatal: invalid refspec');
    if (force && target === 'main') {
      sh.world.git!.unsafe.push({
        tick: sh.world.clock.tick,
        host: sh.host.hostname,
        command: 'git ' + args.join(' '),
        reason: 'force-push to main is blocked',
      });
      error('force-push to main is blocked');
    }
    if (target === 'main' && revision(r,c,source) !== r.branches.main) error('protected main: push a feature branch and merge a reviewed PR');
    const id = revision(r, c, source),
      prev = r.branches[target];
    if (a.includes('--force-with-lease') && prev !== c.tracking[target])
      error('! [rejected] stale info: remote branch changed since your last fetch');
    if (prev && !force && !ancestor(r, prev, id))
      error(
        '! [rejected] ' +
          target +
          ' -> ' +
          target +
          ' (non-fast-forward)\nUpdates were rejected because the remote contains work that you do not have locally.',
      );
    r.branches[target] = id;
    c.tracking[target] = id;
    if (upstream && c.branch) c.upstream[c.branch] = target;
    return prev === id
      ? 'Everything up-to-date\n'
      : `To git@github.apl.sim:splunk/${c.repo}.git\n   ${prev?.slice(0, 7) ?? '[new branch]'}..${id.slice(0, 7)} ${source} -> ${target}\n`;
  }
  if (cmd === 'pull') {
    if (a.length > 2 || (a[0] && a[0] !== 'origin')) error('fatal: only simulated remote origin exists');
    clean(sh, c, r);
    const target = a[1] ?? (c.branch ? c.upstream[c.branch] : undefined);
    if (!target || !r.branches[target]) error('There is no tracking information for the current branch.');
    c.tracking = { ...r.branches };
    const ours = head(c),
      theirs = r.branches[target]!;
    if (ancestor(r, theirs, ours)) return 'Already up to date.\n';
    if (ancestor(r, ours, theirs)) {
      applyTree(sh, c, base(), r.commits[theirs]!.tree);
      setHead(c, theirs);
      c.index = structuredClone(r.commits[theirs]!.tree);
      return `Updating ${ours.slice(0, 7)}..${theirs.slice(0, 7)}\nFast-forward\n`;
    }
    const common = mergeBase(r, ours, theirs);
    if (!common) error('fatal: refusing to merge unrelated histories');
    const merged = mergeTrees(r.commits[common]!.tree, base(), r.commits[theirs]!.tree);
    if (!merged.conflicts.length) identity(sh, c);
    applyTree(sh, c, base(), merged.tree);
    c.mergeOriginal = structuredClone(base());
    c.index = merged.tree;
    c.conflicts = merged.conflicts;
    c.mergeParent = theirs;
    if (c.conflicts.length)
      error(
        c.conflicts.map((p) => `CONFLICT (content): Merge conflict in ${p}`).join('\n') +
          '\nAutomatic merge failed; fix conflicts and then commit the result.',
      );
    return makeCommit(sh, c, r, `Merge branch '${target}' from origin`);
  }
  if (cmd === 'restore') {
    const staged = a.includes('--staged');
    if (a.some((v) => v.startsWith('-') && !['--staged', '--'].includes(v)))
      error('error: unsupported restore option');
    const specs = a.filter((v) => !['--staged', '--'].includes(v));
    if (!specs.length) error('fatal: you must specify path(s) to restore');
    const src = staged ? base() : c.index,
      work = working(sh, c),
      dest = staged ? structuredClone(c.index) : structuredClone(work),
      scopes = specs.map((v) => scope(sh, c, v));
    for (const s of scopes)
      if (![...Object.keys(src), ...Object.keys(c.index)].some((p) => pathMatches(p, s)))
        error(`error: pathspec '${s}' did not match any file(s) known to git`);
    for (const p of new Set([...Object.keys(src), ...Object.keys(c.index)]))
      if (scopes.some((s) => pathMatches(p, s))) {
        if (src[p]) dest[p] = src[p]!;
        else delete dest[p];
      }
    if (staged) c.index = dest;
    else applyTree(sh, c, work, dest);
    return '';
  }
  if (cmd === 'reset') {
    if (
      a.some((v) => v.startsWith('-') && !['--hard', '--soft', '--mixed'].includes(v)) ||
      a.filter((v) => v.startsWith('--')).length > 1
    )
      error('error: unsupported reset option');
    const vals = a.filter((v) => !v.startsWith('--'));
    if (vals.length > 1) error('usage: git reset [--soft|--mixed|--hard] [commit]');
    const id = revision(r, c, vals[0]),
      tree = r.commits[id]!.tree;
    if (a.includes('--hard')) {
      const work = working(sh, c),
        from = { ...base(), ...c.index };
      const actual = Object.fromEntries(
        Object.keys(from)
          .filter((p) => work[p])
          .map((p) => [p, work[p]!]),
      );
      applyTree(sh, c, actual, tree);
    }
    setHead(c, id);
    if (!a.includes('--soft')) c.index = structuredClone(tree);
    c.conflicts = [];
    delete c.mergeParent;
    delete c.mergeOriginal;
    return `HEAD is now at ${id.slice(0, 7)} ${r.commits[id]!.message}\n`;
  }
  if (cmd === 'stash') {
    if (a.length > 1 || (a[0] && !['pop', 'list'].includes(a[0])))
      error('error: supported stash operations: stash, stash pop, stash list');
    if (a[0] === 'list')
      return c.stashes.map((_, i) => `stash@{${i}}: WIP on ${c.branch ?? 'HEAD'}\n`).join('');
    if (a[0] === 'pop') {
      if (!c.stashes.length) error('No stash entries found.');
      clean(sh, c, r);
      const saved = c.stashes[0]!,
        merged = mergeTrees(saved.base, base(), saved.work);
      applyTree(sh, c, base(), merged.tree);
      c.conflicts = merged.conflicts;
      if (c.conflicts.length) {
        c.index = merged.tree;
        error(
          c.conflicts.map((p) => `CONFLICT (content): Merge conflict in ${p}`).join('\n') +
            '\nThe stash entry is kept in case you need it again.',
        );
      }
      c.index = structuredClone(base());
      c.stashes.shift();
      return 'Dropped stash@{0}\n';
    }
    if (c.conflicts.length) error('error: needs merge');
    const work = trackedWork(working(sh, c), { ...base(), ...c.index });
    if (!changed(base(), work).length && !changed(base(), c.index).length)
      return 'No local changes to save\n';
    const saved = { base: structuredClone(base()), index: structuredClone(c.index), work };
    applyTree(sh, c, work, base());
    c.stashes.unshift(saved);
    c.index = structuredClone(base());
    return `Saved working directory and index state WIP on ${c.branch ?? 'HEAD'}\n`;
  }
  if (cmd === 'revert') {
    if (a.length !== 1 || a[0]!.startsWith('-')) error('usage: git revert <commit>');
    clean(sh, c, r);
    identity(sh, c);
    const co = r.commits[revision(r, c, a[0])]!;
    if (co.parents.length > 1)
      error('error: reverting a merge commit requires unsupported -m parent selection');
    const inverse = mergeTrees(co.tree, base(), co.parents[0] ? r.commits[co.parents[0]]!.tree : {});
    if (inverse.conflicts.length)
      error(
        'error: revert conflicts; no changes applied. Resolve the overlapping change on a branch before retrying.',
      );
    applyTree(sh, c, base(), inverse.tree);
    c.index = inverse.tree;
    return makeCommit(sh, c, r, `Revert "${co.message.split('\n')[0]}"\n\nThis reverts commit ${co.id}.`);
  }
  if (cmd === 'show') {
    if (a.length > 1) error('usage: git show [commit]');
    const co = r.commits[revision(r, c, a[0])]!;
    return (
      `commit ${co.id}\nAuthor: ${co.name} <${co.email}>\n\n    ${co.message}\n\n` +
      diff(co.parents[0] ? r.commits[co.parents[0]]!.tree : {}, co.tree)
    );
  }
  if (cmd === 'blame') {
    if (a.length !== 1) error('usage: git blame <file>');
    const p = scope(sh, c, a[0]!);
    if (!base()[p]) error(`fatal: no such path '${p}' in HEAD`);
    const chain = [];
    let id: string | undefined = head(c);
    while (id) {
      const co: import('./state').Commit = r.commits[id]!;
      chain.unshift(co);
      id = co.parents[0];
    }
    let prev = '',
      ids: string[] = [];
    for (const co of chain) {
      const next = co.tree[p]?.text ?? '';
      ids = blameLines(prev, next, ids, co.id);
      prev = next;
    }
    return prev
      .split('\n')
      .slice(0, lineCount(prev))
      .map((l, i) => `${ids[i]!.slice(0, 7)} (${r.commits[ids[i]!]!.name} ${i + 1}) ${l}\n`)
      .join('');
  }
  error(`git: '${cmd ?? ''}' is not a supported git command. See the Milestone 1 command guide.`);
}
export const gitCommand: CommandFn = ({ sh, argv }) => {
  if (argv[1] === 'commit' && argv.length === 2) {
    try {
      const c = current(sh);
      const path = c.root + '/.git/COMMIT_EDITMSG';
      sh.fs.writeFile(
        path,
        '\n# Write the commit message. Save and exit to commit; an empty message cancels.\n',
        sh.cred,
      );
      const program = nanoProgram(sh, path);
      return {
        program: {
          ...program,
          start(host) {
            program.start({
              ...host,
              exit(code) {
                const message = sh.fs
                  .readFile(path, sh.cred)
                  .split('\n')
                  .filter((l) => !l.startsWith('#'))
                  .join('\n')
                  .trim();
                const result = executeGit(sh, ['commit', '-m', message]);
                host.write((result.stdout ?? '') + (result.stderr ?? ''));
                host.exit(result.code ?? code);
              },
            });
          },
        },
      };
    } catch (e) {
      if (e instanceof GitError || e instanceof FsError) return fail(e.message);
      throw e;
    }
  }
  return executeGit(sh, argv.slice(1));
};
