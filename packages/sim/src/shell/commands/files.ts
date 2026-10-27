import { lsTime } from '../../logs/format';
import { basename, dirname, globToRegExp } from '../../vfs/path';
import { can, FsError, type FsNode } from '../../vfs/vfs';
import { columns } from '../columns';
import { fail, ok, type CmdCtx, type CmdResult, type CommandFn } from '../types';
import { getopt, humanSize } from './util';

const COLOR_DIR = '\x1b[01;34m';
const COLOR_EXEC = '\x1b[01;32m';
const COLOR_RESET = '\x1b[0m';

export function modeString(node: FsNode): string {
  const m = node.mode;
  const t = node.type === 'dir' ? 'd' : '-';
  const tri = (v: number, special: boolean, sChar: string) =>
    (v & 4 ? 'r' : '-') +
    (v & 2 ? 'w' : '-') +
    (special ? (v & 1 ? sChar : sChar.toUpperCase()) : v & 1 ? 'x' : '-');
  return t + tri(m >> 6, false, 's') + tri(m >> 3, false, 's') + tri(m, (m & 0o1000) !== 0, 't') + '.';
}

const pwd: CommandFn = ({ sh }) => ok(sh.cwd + '\n');

const ls: CommandFn = (ctx) => {
  const { sh, argv, tty, term } = ctx;
  const o = getopt(argv.slice(1));
  if (o.error) return fail(`ls: ${o.error}`, 2);
  const f = o.flags;
  const long = f.has('l');
  const all = f.has('a');
  const almost = f.has('A');
  const human = f.has('h');
  const color = tty && (f.get('color') === 'auto' || f.get('color') === 'always' || f.get('color') === true);
  const onePer = f.has('1') || !tty;
  const dirAsFile = f.has('d');

  const paint = (name: string, node: FsNode) => {
    if (!color) return name;
    if (node.type === 'dir') return `${COLOR_DIR}${name}${COLOR_RESET}`;
    if (node.mode & 0o111) return `${COLOR_EXEC}${name}${COLOR_RESET}`;
    return name;
  };
  const sortEntries = (entries: [string, FsNode][]) => {
    if (f.has('t')) entries.sort((a, b) => sh.fs.mtime(b[1]) - sh.fs.mtime(a[1]) || a[0].localeCompare(b[0]));
    else if (f.has('S')) entries.sort((a, b) => sh.fs.size(b[1]) - sh.fs.size(a[1]));
    if (f.has('r')) entries.reverse();
    return entries;
  };
  const longLine = (name: string, node: FsNode) => {
    const size = sh.fs.size(node);
    const sizeStr = human ? humanSize(size) : String(size);
    const links =
      node.type === 'dir' ? 2 + [...node.children.values()].filter((c) => c.type === 'dir').length : 1;
    return [
      modeString(node),
      String(links).padStart(2),
      node.owner.padEnd(6),
      node.group.padEnd(6),
      sizeStr.padStart(human ? 5 : 9),
      lsTime(sh.fs.mtime(node), sh.fs.clock),
      paint(name, node),
    ].join(' ');
  };
  const render = (entries: [string, FsNode][]) => {
    if (long) {
      const blocks = entries.reduce((s, [, n]) => s + Math.ceil(sh.fs.size(n) / 4096) * 4, 0);
      return (
        [
          `total ${human ? humanSize(blocks * 1024) : blocks}`,
          ...entries.map(([n, node]) => longLine(n, node)),
        ].join('\n') + '\n'
      );
    }
    if (!entries.length) return '';
    if (onePer) return entries.map(([n, node]) => paint(n, node)).join('\n') + '\n';
    // Pad on visible width, then paint.
    const names = entries.map(([n]) => n);
    const laid = columns(names, term.cols);
    if (!color) return laid + '\n';
    const byName = new Map(entries);
    return laid.replace(/\S+/g, (n) => (byName.has(n) ? paint(n, byName.get(n)!) : n)) + '\n';
  };

  const targets = o.operands.length ? o.operands : ['.'];
  let errors = '';
  let code = 0;
  const fileEntries: [string, FsNode][] = [];
  const dirs: [string, FsNode][] = [];
  for (const t of targets) {
    try {
      const node = sh.fs.lookup(sh.resolve(t), sh.cred);
      if (node.type === 'dir' && !dirAsFile) dirs.push([t, node]);
      else fileEntries.push([t, node]);
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      errors += `ls: cannot access '${t}': ${e.message}\n`;
      code = 2;
    }
  }
  let out = fileEntries.length ? render(sortEntries(fileEntries)) : '';
  dirs.sort((a, b) => a[0].localeCompare(b[0]));
  for (const [name, node] of dirs) {
    if (node.type !== 'dir') continue;
    if (!can(node, sh.cred, 4)) {
      errors += `ls: cannot open directory '${name}': Permission denied\n`;
      code = 2;
      continue;
    }
    let entries = [...node.children.entries()].filter(([n]) => all || almost || !n.startsWith('.'));
    entries.sort((a, b) => a[0].localeCompare(b[0]));
    entries = sortEntries(entries);
    if (all) {
      const parent = sh.fs.findNode(dirname(sh.resolve(name))) ?? node;
      entries = [['.', node], ['..', parent], ...entries];
    }
    if (targets.length > 1) out += `${out ? '\n' : ''}${name}:\n`;
    out += render(entries);
  }
  return { stdout: out, stderr: errors, code };
};

function eachPath(
  ctx: CmdCtx,
  cmd: string,
  paths: string[],
  fn: (path: string, shown: string) => void,
): CmdResult {
  if (!paths.length) return fail(`${cmd}: missing operand\nTry '${cmd} --help' for more information.`);
  let errors = '';
  for (const p of paths) {
    try {
      fn(ctx.sh.resolve(p), p);
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      errors += `${cmd}: ${messageFor(cmd, p, e)}\n`;
    }
  }
  return { stdout: '', stderr: errors, code: errors ? 1 : 0 };
}

function messageFor(cmd: string, p: string, e: FsError): string {
  if (cmd === 'mkdir' && e.code === 'EEXIST') return `cannot create directory '${p}': File exists`;
  if (cmd === 'mkdir') return `cannot create directory '${p}': ${e.message}`;
  if (cmd === 'rm' && e.code === 'EISDIR') return `cannot remove '${p}': Is a directory`;
  if (cmd === 'rm') return `cannot remove '${p}': ${e.message}`;
  if (cmd === 'touch') return `cannot touch '${p}': ${e.message}`;
  if (cmd === 'chmod' || cmd === 'chown' || cmd === 'chgrp')
    return `changing ${{ chmod: 'permissions', chown: 'ownership', chgrp: 'group' }[cmd]} of '${p}': ${e.message}`;
  return `${p}: ${e.message}`;
}

const touch: CommandFn = (ctx) =>
  eachPath(ctx, 'touch', getopt(ctx.argv.slice(1)).operands, (path) => {
    const node = ctx.sh.fs.findNode(path);
    if (!node) ctx.sh.fs.writeFile(path, '', ctx.sh.cred);
    else if (node.type === 'file' && !node.source)
      ctx.sh.fs.writeFile(path, ctx.sh.fs.readFile(path, ctx.sh.cred), ctx.sh.cred);
  });

const mkdir: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1), 'm');
  return eachPath(ctx, 'mkdir', o.operands, (path) =>
    ctx.sh.fs.mkdir(path, ctx.sh.cred, { parents: o.flags.has('p') }),
  );
};

const rm: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1));
  const recursive = o.flags.has('r') || o.flags.has('R') || o.flags.has('recursive');
  const force = o.flags.has('f') || o.flags.has('force');
  const targets = o.operands;
  if (targets.some((t) => ctx.sh.resolve(t) === '/'))
    return fail(
      "rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe",
    );
  const r = eachPath(ctx, 'rm', targets, (path) => {
    if (force && !ctx.sh.fs.findNode(path)) return;
    ctx.sh.fs.remove(path, ctx.sh.cred, { recursive });
  });
  return force && targets.length === 0 ? ok() : r;
};

function copyTree(ctx: CmdCtx, src: string, dst: string, recursive: boolean): void {
  const { fs, cred } = ctx.sh;
  const node = fs.lookup(src, cred);
  if (node.type === 'dir') {
    if (!recursive) throw new FsError('EISDIR', src);
    if (!fs.findNode(dst)) fs.mkdir(dst, cred);
    for (const [name] of fs.readdir(src, cred)) copyTree(ctx, `${src}/${name}`, `${dst}/${name}`, true);
  } else fs.writeFile(dst, fs.readFile(src, cred), cred);
}

function twoPathCmd(name: 'cp' | 'mv'): CommandFn {
  return (ctx) => {
    const o = getopt(ctx.argv.slice(1));
    const ops = o.operands;
    if (ops.length < 2) return fail(`${name}: missing destination file operand after '${ops[0] ?? ''}'`);
    const dest = ops[ops.length - 1]!;
    const destPath = ctx.sh.resolve(dest);
    const destIsDir = ctx.sh.fs.findNode(destPath)?.type === 'dir';
    if (ops.length > 2 && !destIsDir) return fail(`${name}: target '${dest}' is not a directory`);
    let errors = '';
    for (const src of ops.slice(0, -1)) {
      const srcPath = ctx.sh.resolve(src);
      const target = destIsDir ? `${destPath}/${basename(srcPath)}` : destPath;
      try {
        copyTree(
          ctx,
          srcPath,
          target,
          name === 'mv' || o.flags.has('r') || o.flags.has('R') || o.flags.has('a'),
        );
        if (name === 'mv') ctx.sh.fs.remove(srcPath, ctx.sh.cred, { recursive: true });
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        errors +=
          e.code === 'EISDIR' && name === 'cp'
            ? `cp: -r not specified; omitting directory '${src}'\n`
            : `${name}: cannot ${name === 'cp' ? 'create regular file' : 'move'} '${e.path === srcPath ? src : dest}': ${e.message}\n`;
      }
    }
    return { stdout: '', stderr: errors, code: errors ? 1 : 0 };
  };
}

function applyChmod(spec: string, mode: number): number | null {
  if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec, 8);
  let m = mode;
  for (const clause of spec.split(',')) {
    const r = /^([ugoa]*)([+\-=])([rwxt]*)$/.exec(clause);
    if (!r) return null;
    const who = r[1] || 'a';
    let bits = 0;
    for (const w of who === 'a' ? 'ugo' : who) {
      const shift = w === 'u' ? 6 : w === 'g' ? 3 : 0;
      for (const p of r[3]!) if (p !== 't') bits |= (p === 'r' ? 4 : p === 'w' ? 2 : 1) << shift;
    }
    if (r[3]!.includes('t')) bits |= 0o1000;
    if (r[2] === '+') m |= bits;
    else if (r[2] === '-') m &= ~bits;
    else m = (m & ~0o777) | bits;
  }
  return m;
}

const chmod: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1));
  const [spec, ...paths] = o.operands;
  if (!spec) return fail("chmod: missing operand\nTry 'chmod --help' for more information.");
  const recursive = o.flags.has('R');
  return eachPath(ctx, 'chmod', paths, (path) => {
    const apply = (p: string) => {
      const node = ctx.sh.fs.lookup(p, ctx.sh.cred);
      const mode = applyChmod(spec, node.mode);
      if (mode === null) throw new FsError('EINVAL', p);
      ctx.sh.fs.setMeta(p, { mode }, ctx.sh.cred);
      if (recursive && node.type === 'dir')
        for (const [name] of ctx.sh.fs.readdir(p, ctx.sh.cred)) apply(`${p}/${name}`);
    };
    apply(path);
  });
};

/** Users and groups that exist on every host (each user has a group of the same name). */
const KNOWN_USERS = ['root', 'splunk', 'engineer', 'nobody', 'app', 'nginx', 'mysql'];

const chown: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1));
  const [spec, ...paths] = o.operands;
  if (!spec) return fail("chown: missing operand\nTry 'chown --help' for more information.");
  const [owner, group] = spec.split(/[:.]/);
  const known = KNOWN_USERS;
  if (owner && !known.includes(owner)) return fail(`chown: invalid user: '${spec}'`);
  if (group && !known.includes(group)) return fail(`chown: invalid group: '${spec}'`);
  const recursive = o.flags.has('R');
  return eachPath(ctx, 'chown', paths, (path) => {
    const apply = (p: string) => {
      const node = ctx.sh.fs.lookup(p, ctx.sh.cred);
      ctx.sh.fs.setMeta(
        p,
        { owner: owner || node.owner, group: group ?? (spec.includes(':') && owner ? owner : node.group) },
        ctx.sh.cred,
      );
      if (recursive && node.type === 'dir')
        for (const [name] of ctx.sh.fs.readdir(p, ctx.sh.cred)) apply(`${p}/${name}`);
    };
    apply(path);
  });
};

const chgrp: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1));
  const [group, ...paths] = o.operands;
  if (!group) return fail("chgrp: missing operand\nTry 'chgrp --help' for more information.");
  if (!KNOWN_USERS.includes(group)) return fail(`chgrp: invalid group: '${group}'`);
  const recursive = o.flags.has('R');
  return eachPath(ctx, 'chgrp', paths, (path) => {
    const apply = (p: string) => {
      const node = ctx.sh.fs.lookup(p, ctx.sh.cred);
      ctx.sh.fs.setMeta(p, { group }, ctx.sh.cred);
      if (recursive && node.type === 'dir')
        for (const [name] of ctx.sh.fs.readdir(p, ctx.sh.cred)) apply(`${p}/${name}`);
    };
    apply(path);
  });
};

const find: CommandFn = (ctx) => {
  const { sh } = ctx;
  const args = ctx.argv.slice(1);
  const roots: string[] = [];
  let i = 0;
  while (i < args.length && !args[i]!.startsWith('-')) roots.push(args[i++]!);
  if (!roots.length) roots.push('.');
  const tests: ((path: string, node: FsNode, depth: number) => boolean)[] = [];
  let maxDepth = Infinity;
  let minDepth = 0;
  for (; i < args.length; i++) {
    const a = args[i]!;
    const v = args[i + 1];
    if ((a === '-name' || a === '-iname') && v !== undefined) {
      const re = globToRegExp(a === '-iname' ? v.toLowerCase() : v);
      tests.push((p) => re.test(a === '-iname' ? basename(p).toLowerCase() : basename(p)));
      i++;
    } else if (a === '-type' && v !== undefined) {
      if (v !== 'f' && v !== 'd') return fail(`find: Unknown argument to -type: ${v}`);
      tests.push((_, n) => (v === 'd' ? n.type === 'dir' : n.type === 'file'));
      i++;
    } else if (a === '-maxdepth' && v !== undefined) {
      maxDepth = Number(v);
      i++;
    } else if (a === '-mindepth' && v !== undefined) {
      minDepth = Number(v);
      i++;
    } else if (a === '-user' && v !== undefined) {
      tests.push((_, n) => n.owner === v);
      i++;
    } else if (a === '-mmin' && v !== undefined) {
      const n = Number(v);
      tests.push((_, node) => {
        const age = (sh.fs.clock - sh.fs.mtime(node)) / 60_000;
        return v.startsWith('-') ? age < -n : v.startsWith('+') ? age > n : Math.floor(age) === n;
      });
      i++;
    } else if (a === '-mtime' && v !== undefined) {
      const n = Number(v);
      tests.push((_, node) => {
        const age = (sh.fs.clock - sh.fs.mtime(node)) / 86_400_000;
        return v.startsWith('-') ? age < -n : v.startsWith('+') ? age > n : Math.floor(age) === n;
      });
      i++;
    } else if (a === '-print' || a === '-ls') {
      continue;
    } else return fail(`find: unknown predicate \`${a}'`);
  }
  let out = '';
  let errors = '';
  for (const root of roots) {
    try {
      const denied = sh.fs.walk(
        sh.resolve(root),
        sh.cred,
        (path, node, depth) => {
          if (depth < minDepth) return;
          if (tests.every((t) => t(path, node, depth))) {
            const shown = root.startsWith('/')
              ? path
              : root === '.'
                ? depth === 0
                  ? '.'
                  : `./${path.slice(sh.cwd.length).replace(/^\//, '')}`
                : root + path.slice(sh.resolve(root).length);
            out += shown + '\n';
          }
        },
        maxDepth,
      );
      for (const d of denied) errors += `find: ‘${d}’: Permission denied\n`;
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      errors += `find: ‘${root}’: ${e.message}\n`;
    }
  }
  return { stdout: out, stderr: errors, code: errors ? 1 : 0 };
};

const stat: CommandFn = (ctx) => {
  const paths = ctx.argv.slice(1);
  if (!paths.length) return fail("stat: missing operand\nTry 'stat --help' for more information.");
  let out = '';
  let errors = '';
  for (const p of paths) {
    try {
      const node = ctx.sh.fs.lookup(ctx.sh.resolve(p), ctx.sh.cred);
      const iso = new Date(ctx.sh.fs.mtime(node))
        .toISOString()
        .replace('T', ' ')
        .replace('Z', '000000 +0000');
      out += `  File: ${p}\n  Size: ${ctx.sh.fs.size(node)}\t\tBlocks: ${Math.ceil(ctx.sh.fs.size(node) / 512)}\tIO Block: 4096   ${node.type === 'dir' ? 'directory' : 'regular file'}\nAccess: (${(node.mode & 0o7777).toString(8).padStart(4, '0')}/${modeString(node).slice(0, 10)})  Uid: (${node.owner === 'root' ? '    0' : ' 1001'}/${node.owner.padStart(8)})   Gid: (${node.group === 'root' ? '    0' : ' 1001'}/${node.group.padStart(8)})\nModify: ${iso}\n`;
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      errors += `stat: cannot statx '${p}': ${e.message}\n`;
    }
  }
  return { stdout: out, stderr: errors, code: errors ? 1 : 0 };
};

export const FILE_COMMANDS: Record<string, CommandFn> = {
  pwd,
  ls,
  touch,
  mkdir,
  rm,
  cp: twoPathCmd('cp'),
  mv: twoPathCmd('mv'),
  chmod,
  chown,
  chgrp,
  find,
  stat,
};
