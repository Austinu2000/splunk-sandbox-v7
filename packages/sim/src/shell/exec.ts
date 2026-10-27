import { globToRegExp, hasGlob, segments } from '../vfs/path';
import { can, FsError } from '../vfs/vfs';
import { BUILTINS } from './builtins';
import { COMMANDS, STREAMABLE } from './commands';
import { fsMessage, type Shell } from './shell';
import {
  parseLine,
  ShellSyntaxError,
  wordText,
  type ListItem,
  type SimpleCommand,
  type Word,
} from './tokenize';
import type { CmdResult, CmdReturn, CommandFn, Program, Term } from './types';

/** What running a line produced. At most one of program / push / exitShell is set. */
export interface ExecResult {
  output: string;
  program?: Program;
  /** For `tail -f | grep x`: filter applied to the program's output. */
  pipeTail?: (chunk: string) => string;
  push?: Shell;
  exitShell?: { code: number };
  /** List items still to run once the program exits. */
  rest?: ListItem[];
}

export function runLine(sh: Shell, line: string, term: Term): ExecResult {
  let items: ListItem[];
  try {
    items = parseLine(line, { home: sh.home });
  } catch (e) {
    if (e instanceof ShellSyntaxError) {
      sh.lastExit = 2;
      return { output: e.message + '\n' };
    }
    throw e;
  }
  return runItems(sh, items, term);
}

export function runItems(sh: Shell, items: ListItem[], term: Term): ExecResult {
  let output = '';
  let skip = false;
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    if (!skip) {
      const r = runPipeline(sh, item.pipeline, term);
      output += r.output;
      if (r.program || r.push || r.exitShell) return { ...r, output, rest: items.slice(i + 1) };
    }
    // Decide whether the next pipeline runs, based on this one's status (bash semantics).
    skip = item.next === '&&' ? sh.lastExit !== 0 : item.next === '||' ? sh.lastExit === 0 : false;
  }
  return { output };
}

function isResult(r: CmdReturn): r is CmdResult {
  return !('program' in r) && !('push' in r) && !('exitShell' in r);
}

function runPipeline(sh: Shell, cmds: SimpleCommand[], term: Term): ExecResult {
  let stdin = '';
  let hasStdin = false;
  let errOut = '';
  let stdout = '';
  let code = 0;

  for (let i = 0; i < cmds.length; i++) {
    const cmd = cmds[i]!;
    const isLast = i === cmds.length - 1;
    let argv = expandWords(sh, cmd.words);

    const target = (r: { target?: Word }) => wordText(r.target!, (n) => sh.getVar(n));
    for (const r of cmd.redirects.filter((r) => r.op === '<')) {
      try {
        stdin = sh.fs.readFile(sh.resolve(target(r)), sh.cred);
        hasStdin = true;
      } catch (e) {
        errOut += fsMessage('bash', target(r), e);
        code = 1;
        argv = [];
      }
    }
    if (argv.length === 0) {
      stdout = '';
      continue;
    }

    const toFile = cmd.redirects.some((r) => r.op === '>' || r.op === '>>');
    const ret = dispatch(sh, argv, { stdin, hasStdin, term, tty: isLast && !toFile });

    if (!isResult(ret)) {
      if ('program' in ret) {
        const tail = cmds.slice(i + 1);
        sh.lastExit = 0;
        return {
          output: errOut,
          program: ret.program,
          pipeTail: tail.length ? streamingTail(sh, tail, term) : undefined,
        };
      }
      if (cmds.length === 1) {
        if ('push' in ret) return { output: errOut + (ret.output ?? ''), push: ret.push };
        return { output: errOut, exitShell: { code: ret.code ?? sh.lastExit } };
      }
      stdout = '';
      code = 0;
      continue;
    }

    let out = ret.stdout ?? '';
    let err = ret.stderr ?? '';
    code = ret.code ?? 0;
    for (const r of cmd.redirects) {
      if (r.op === '2>&1') {
        out += err;
        err = '';
      } else if (r.op === '2>' || r.op === '2>>') {
        const file = target(r);
        err = file === '/dev/null' ? '' : writeRedirect(sh, file, err, r.op === '2>>');
      } else if (r.op === '>' || r.op === '>>') {
        const file = target(r);
        if (file !== '/dev/null') {
          const e = writeRedirect(sh, file, out, r.op === '>>');
          if (e) {
            err += e;
            code = 1;
          }
        }
        out = '';
      }
    }
    errOut += err;
    stdin = out;
    hasStdin = true;
    stdout = out;
  }
  sh.lastExit = code;
  return { output: errOut + stdout };
}

/** Writes redirect output; returns an error message on failure, '' on success. */
function writeRedirect(sh: Shell, target: string, data: string, append: boolean): string {
  try {
    sh.fs.writeFile(sh.resolve(target), data, sh.cred, { append });
    return '';
  } catch (e) {
    return fsMessage('bash', target, e);
  }
}

/** For a program feeding a pipe, run the rest of the pipeline on each chunk it writes. */
function streamingTail(sh: Shell, tail: SimpleCommand[], term: Term): (chunk: string) => string {
  const names = tail.map((c) => (c.words[0] ? wordText(c.words[0], (n) => sh.getVar(n)) : ''));
  // Commands like sort or wc wait for end of input, which a following program never sends.
  if (!names.every((n) => STREAMABLE.has(n))) return () => '';
  return (chunk) => {
    let data = chunk;
    for (const cmd of tail) {
      const ret = dispatch(sh, expandWords(sh, cmd.words), {
        stdin: data,
        hasStdin: true,
        term,
        tty: cmd === tail.at(-1),
      });
      data = isResult(ret) ? (ret.stdout ?? '') : '';
    }
    return data;
  };
}

interface DispatchIo {
  stdin: string;
  hasStdin: boolean;
  term: Term;
  tty: boolean;
}

export function dispatch(sh: Shell, argv: string[], io: DispatchIo): CmdReturn {
  const name = argv[0]!;
  const alias = sh.kind === 'oneshot' ? undefined : sh.aliases.get(name);
  if (!alias) return run(sh, argv, io);
  // bash expands the first word of an alias once more if it is a different alias (ll → ls -l → ls --color=auto -l).
  let expanded = alias.split(/\s+/).filter(Boolean);
  const inner = expanded[0] !== name ? sh.aliases.get(expanded[0]!) : undefined;
  if (inner) expanded = [...inner.split(/\s+/).filter(Boolean), ...expanded.slice(1)];
  return run(sh, [...expanded, ...argv.slice(1)], io);
}

function run(sh: Shell, argv: string[], io: DispatchIo): CmdReturn {
  const name = argv[0]!;
  const builtin = BUILTINS[name];
  if (builtin) return builtin({ world: sh.world, sh, argv, ...io });

  let impl: CommandFn | undefined = COMMANDS[name];
  if (name.includes('/')) {
    const path = sh.resolve(name);
    try {
      const node = sh.fs.lookup(path, sh.cred);
      if (node.type === 'dir') return { stderr: `bash: ${name}: Is a directory\n`, code: 126 };
      if (!can(node, sh.cred, 1)) return { stderr: `bash: ${name}: Permission denied\n`, code: 126 };
      impl = node.exec ? (COMMANDS[node.exec] ?? BUILTINS[node.exec]) : undefined;
      if (!impl) return { stderr: `bash: ${name}: cannot execute: required file not found\n`, code: 126 };
    } catch (e) {
      if (e instanceof FsError)
        return { stderr: `bash: ${name}: ${e.message}\n`, code: e.code === 'ENOENT' ? 127 : 126 };
      throw e;
    }
  } else if (impl && (name === 'splunk' || name === 'splunkd')) {
    // Splunk's bin directory is only on PATH for the splunk account (via ~/.bash_profile).
    if (!sh.host.splunk || !sh.onPath(`${sh.host.splunk.home}/bin`)) impl = undefined;
  }
  if (!impl) return { stderr: `bash: ${name}: command not found\n`, code: 127 };
  return impl({ world: sh.world, sh, argv, ...io });
}

/** Expands unquoted globs against the virtual filesystem. Unmatched patterns stay literal, as in bash. */
export function expandWords(sh: Shell, words: Word[]): string[] {
  const out: string[] = [];
  for (const w of words) {
    const text = wordText(w, (n) => sh.getVar(n));
    if (!w.glob || !hasGlob(text)) {
      out.push(text);
      continue;
    }
    const matches = expandGlob(sh, text);
    if (matches.length) out.push(...matches);
    else out.push(text);
  }
  return out;
}

function expandGlob(sh: Shell, pattern: string): string[] {
  const absolute = pattern.startsWith('/');
  const segs = segments(pattern);
  const base = absolute ? '/' : sh.cwd;
  let results: string[] = [''];
  for (const seg of segs) {
    const next: string[] = [];
    for (const prefix of results) {
      const dir = absolute ? `/${prefix}` : prefix ? sh.resolve(prefix) : base;
      if (!hasGlob(seg)) {
        if (sh.fs.findNode(`${dir}/${seg}`) || seg === '..' || seg === '.')
          next.push(prefix ? `${prefix}/${seg}` : seg);
        continue;
      }
      const re = globToRegExp(seg);
      let entries: string[] = [];
      try {
        entries = sh.fs.readdir(dir, sh.cred).map(([n]) => n);
      } catch {
        entries = [];
      }
      for (const n of entries)
        if ((seg.startsWith('.') || !n.startsWith('.')) && re.test(n))
          next.push(prefix ? `${prefix}/${n}` : n);
    }
    results = next;
    if (!results.length) return [];
  }
  return results.map((r) => (absolute ? `/${r}` : r)).sort();
}
