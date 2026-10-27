import { FsError } from '../../vfs/vfs';
import { followProgram } from '../programs/follow';
import { pagerProgram } from '../programs/pager';
import { fail, ok, type CommandFn } from '../types';
import { breToJs, getopt, joinLines, lines, readInputs } from './util';

const cat: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1));
  if (o.error) return fail(`cat: ${o.error}`);
  const { inputs, errors } = readInputs(ctx, 'cat', o.operands);
  let out = inputs.map((i) => i.content).join('');
  if (o.flags.has('n')) out = joinLines(lines(out).map((l, i) => `${String(i + 1).padStart(6)}\t${l}`));
  return { stdout: out, stderr: errors, code: errors ? 1 : 0 };
};

/** Normalises head/tail's "-20" shorthand into "-n 20". */
function countArgs(args: string[]): string[] {
  return args.map((a) => (/^-\d+$/.test(a) ? `-n${a.slice(1)}` : a));
}

const head: CommandFn = (ctx) => {
  const o = getopt(countArgs(ctx.argv.slice(1)), 'nc', ['lines', 'bytes']);
  if (o.error) return fail(`head: ${o.error}`);
  const n = Number(o.flags.get('n') ?? o.flags.get('lines') ?? 10);
  if (!Number.isFinite(n)) return fail(`head: invalid number of lines: '${o.flags.get('n')}'`);
  const { inputs, errors } = readInputs(ctx, 'head', o.operands);
  const multi = inputs.length > 1;
  const out = inputs
    .map((i, k) => {
      const body = o.flags.has('c')
        ? i.content.slice(0, Number(o.flags.get('c')))
        : joinLines(lines(i.content).slice(0, n));
      return multi ? `${k ? '\n' : ''}==> ${i.name} <==\n${body}` : body;
    })
    .join('');
  return {
    stdout: out,
    stderr: errors.replace(/^head: (.*): /gm, "head: cannot open '$1' for reading: "),
    code: errors ? 1 : 0,
  };
};

const tail: CommandFn = (ctx) => {
  const args = countArgs(ctx.argv.slice(1)).map((a) => (/^\+\d+$/.test(a) ? `-n${a}` : a));
  const o = getopt(args, 'n', ['lines']);
  if (o.error) return fail(`tail: ${o.error}`);
  const spec = String(o.flags.get('n') ?? o.flags.get('lines') ?? '10');
  const fromStart = spec.startsWith('+');
  const n = Math.abs(Number(spec));
  if (!Number.isFinite(n)) return fail(`tail: invalid number of lines: '${spec}'`);
  const follow = o.flags.has('f') || o.flags.has('F') || o.flags.has('follow');
  const pick = (ls: string[]) => (fromStart ? ls.slice(Math.max(0, n - 1)) : n === 0 ? [] : ls.slice(-n));

  if (follow && o.operands.length) {
    const { errors } = readInputs(ctx, 'tail', o.operands);
    if (errors) return fail(errors.replace(/^tail: (.*): /gm, "tail: cannot open '$1' for reading: "));
    return { program: followProgram(ctx, o.operands, pick) };
  }
  const { inputs, errors } = readInputs(ctx, 'tail', o.operands);
  const multi = inputs.length > 1;
  const out = inputs
    .map((i, k) => (multi ? `${k ? '\n' : ''}==> ${i.name} <==\n` : '') + joinLines(pick(lines(i.content))))
    .join('');
  return {
    stdout: out,
    stderr: errors.replace(/^tail: (.*): /gm, "tail: cannot open '$1' for reading: "),
    code: errors ? 1 : 0,
  };
};

const wc: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1));
  const { inputs, errors } = readInputs(ctx, 'wc', o.operands);
  const want = { l: o.flags.has('l'), w: o.flags.has('w'), c: o.flags.has('c') || o.flags.has('m') };
  const all = !want.l && !want.w && !want.c;
  const count = (s: string) => [
    s.split('\n').length - 1,
    s.split(/\s+/).filter(Boolean).length,
    new TextEncoder().encode(s).length,
  ];
  const rows = inputs.map((i) => ({ name: o.operands.length ? i.name : '', counts: count(i.content) }));
  if (rows.length > 1)
    rows.push({ name: 'total', counts: [0, 1, 2].map((k) => rows.reduce((s, r) => s + r.counts[k]!, 0)) });
  const fields = (c: number[]) =>
    [all || want.l ? c[0] : null, all || want.w ? c[1] : null, all || want.c ? c[2] : null].filter(
      (v) => v !== null,
    ) as number[];
  const single = rows.length === 1 && fields(rows[0]!.counts).length === 1;
  const width = single
    ? 0
    : Math.max(...rows.flatMap((r) => fields(r.counts).map((v) => String(v).length)), all ? 7 : 1);
  const out =
    rows
      .map((r) =>
        [...fields(r.counts).map((v) => String(v).padStart(width)), r.name].filter((x) => x !== '').join(' '),
      )
      .join('\n') + '\n';
  return { stdout: out, stderr: errors, code: errors ? 1 : 0 };
};

const sort: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1), 'kto', ['key', 'field-separator']);
  if (o.error) return fail(`sort: ${o.error}`, 2);
  const { inputs, errors } = readInputs(ctx, 'sort', o.operands);
  let ls = inputs.flatMap((i) => lines(i.content));
  const sep = o.flags.get('t') as string | undefined;
  const keySpec = o.flags.get('k') as string | undefined;
  const keyField = keySpec ? Number(keySpec.split(/[,.]/)[0]) : 0;
  const keyNumeric = keySpec ? /n/.test(keySpec) : false;
  const key = (l: string) => {
    if (!keyField) return l;
    const parts = sep ? l.split(sep) : l.trim().split(/\s+/);
    return parts.slice(keyField - 1).join(sep ?? ' ');
  };
  const numeric = o.flags.has('n') || keyNumeric;
  const human = o.flags.has('h');
  const fold = o.flags.has('f');
  const toNum = (s: string) => {
    const m = /^\s*(-?[\d.]+)\s*([KMGT]?)/i.exec(s);
    if (!m) return 0;
    const mult = { '': 1, K: 1e3, M: 1e6, G: 1e9, T: 1e12 }[m[2]!.toUpperCase() as '' | 'K'] ?? 1;
    return parseFloat(m[1]!) * (human ? mult : 1);
  };
  ls.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (numeric || human) return toNum(ka) - toNum(kb) || (a < b ? -1 : a > b ? 1 : 0);
    const x = fold ? ka.toLowerCase() : ka;
    const y = fold ? kb.toLowerCase() : kb;
    return x < y ? -1 : x > y ? 1 : 0;
  });
  if (o.flags.has('r')) ls.reverse();
  if (o.flags.has('u')) ls = ls.filter((l, i) => i === 0 || key(l) !== key(ls[i - 1]!));
  return { stdout: joinLines(ls), stderr: errors, code: errors ? 2 : 0 };
};

const uniq: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1));
  const { inputs, errors } = readInputs(ctx, 'uniq', o.operands.slice(0, 1));
  const ls = lines(inputs[0]?.content ?? '');
  const groups: { line: string; n: number }[] = [];
  const same = (a: string, b: string) => (o.flags.has('i') ? a.toLowerCase() === b.toLowerCase() : a === b);
  for (const l of ls) {
    const last = groups[groups.length - 1];
    if (last && same(last.line, l)) last.n++;
    else groups.push({ line: l, n: 1 });
  }
  const kept = groups.filter((g) => (o.flags.has('d') ? g.n > 1 : o.flags.has('u') ? g.n === 1 : true));
  const out = kept.map((g) => (o.flags.has('c') ? `${String(g.n).padStart(7)} ${g.line}` : g.line));
  return { stdout: joinLines(out), stderr: errors, code: errors ? 1 : 0 };
};

function parseRanges(spec: string): ((n: number) => boolean) | null {
  const parts = spec.split(',').map((p) => {
    const m = /^(\d*)(-?)(\d*)$/.exec(p);
    if (!m || (!m[1] && !m[3])) return null;
    const lo = m[1] ? Number(m[1]) : 1;
    const hi = m[2] ? (m[3] ? Number(m[3]) : Infinity) : lo;
    return (n: number) => n >= lo && n <= hi;
  });
  if (parts.some((p) => !p)) return null;
  return (n) => parts.some((p) => p!(n));
}

const cut: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1), 'dfc', ['delimiter', 'fields', 'characters']);
  if (o.error) return fail(`cut: ${o.error}`);
  const fieldSpec = (o.flags.get('f') ?? o.flags.get('fields')) as string | undefined;
  const charSpec = (o.flags.get('c') ?? o.flags.get('characters')) as string | undefined;
  if (!fieldSpec && !charSpec)
    return fail(
      "cut: you must specify a list of bytes, characters, or fields\nTry 'cut --help' for more information.",
    );
  const sel = parseRanges((fieldSpec ?? charSpec)!);
  if (!sel) return fail(`cut: invalid field value '${fieldSpec ?? charSpec}'`);
  const delim = String(o.flags.get('d') ?? o.flags.get('delimiter') ?? '\t');
  const { inputs, errors } = readInputs(ctx, 'cut', o.operands);
  const out = inputs.flatMap((i) =>
    lines(i.content).map((l) => {
      if (charSpec) return [...l].filter((_, k) => sel(k + 1)).join('');
      if (!l.includes(delim)) return l;
      return l
        .split(delim)
        .filter((_, k) => sel(k + 1))
        .join(delim);
    }),
  );
  return { stdout: joinLines(out), stderr: errors, code: errors ? 1 : 0 };
};

const GREP_COLOR = '\x1b[01;31m\x1b[K';
const GREP_RESET = '\x1b[m\x1b[K';

const grep: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1), 'eABCm', ['regexp', 'color', 'colour']);
  if (o.error) return fail(`grep: ${o.error}\nUsage: grep [OPTION]... PATTERNS [FILE]...`, 2);
  const f = o.flags;
  const operands = [...o.operands];
  const pattern =
    (f.get('e') as string | undefined) ?? (f.get('regexp') as string | undefined) ?? operands.shift();
  if (pattern === undefined)
    return fail("Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.", 2);
  const ignoreCase = f.has('i');
  let source = f.has('F')
    ? pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    : f.has('E')
      ? pattern
      : breToJs(pattern);
  if (f.has('w')) source = `\\b(?:${source})\\b`;
  if (f.has('x')) source = `^(?:${source})$`;
  let re: RegExp;
  try {
    re = new RegExp(source, ignoreCase ? 'gi' : 'g');
  } catch {
    return fail('grep: Unmatched ( or \\(', 2);
  }
  const color =
    ctx.tty && (f.get('color') === 'auto' || f.get('color') === 'always' || f.get('colour') === 'auto');
  const recursive = f.has('r') || f.has('R');

  // Expand directories for -r.
  let files = operands;
  let errors = '';
  if (recursive) {
    files = [];
    for (const op of operands.length ? operands : ['.']) {
      try {
        const node = ctx.sh.fs.lookup(ctx.sh.resolve(op), ctx.sh.cred);
        if (node.type === 'file') files.push(op);
        else {
          const denied = ctx.sh.fs.walk(ctx.sh.resolve(op), ctx.sh.cred, (path, n) => {
            if (n.type === 'file')
              files.push(
                op === '.'
                  ? path.replace(ctx.sh.cwd + '/', '')
                  : op.replace(/\/$/, '') + path.slice(ctx.sh.resolve(op).length),
              );
          });
          for (const d of denied) errors += `grep: ${d}: Permission denied\n`;
        }
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        errors += `grep: ${op}: ${e.message}\n`;
      }
    }
  } else {
    for (const op of operands) {
      const node = ctx.sh.fs.findNode(ctx.sh.resolve(op));
      if (node?.type === 'dir') errors += `grep: ${op}: Is a directory\n`;
    }
    files = operands.filter((op) => ctx.sh.fs.findNode(ctx.sh.resolve(op))?.type !== 'dir');
  }
  const read = readInputs(ctx, 'grep', files);
  if (!f.has('s')) errors += read.errors;
  const showNames = (files.length > 1 || recursive) && !f.has('h') ? true : f.has('H');
  const after = Number(f.get('A') ?? f.get('C') ?? 0);
  const before = Number(f.get('B') ?? f.get('C') ?? 0);
  const maxCount = f.has('m') ? Number(f.get('m')) : Infinity;

  let out = '';
  let matchedAny = false;
  for (const input of read.inputs) {
    const ls = lines(input.content);
    const hits: number[] = [];
    for (let i = 0; i < ls.length && hits.length < maxCount; i++) {
      re.lastIndex = 0;
      if (re.test(ls[i]!) !== f.has('v')) hits.push(i);
    }
    if (hits.length) matchedAny = true;
    if (f.has('q')) continue;
    const prefix = showNames ? `${input.name}:` : '';
    if (f.has('l')) {
      if (hits.length) out += input.name + '\n';
      continue;
    }
    if (f.has('L')) {
      if (!hits.length) out += input.name + '\n';
      continue;
    }
    if (f.has('c')) {
      out += `${prefix}${hits.length}\n`;
      continue;
    }
    const paint = (l: string) =>
      color && !f.has('v') ? l.replace(re, (m) => `${GREP_COLOR}${m}${GREP_RESET}`) : l;
    if (f.has('o')) {
      for (const i of hits)
        for (const m of ls[i]!.matchAll(re))
          out += `${prefix}${f.has('n') ? `${i + 1}:` : ''}${color ? GREP_COLOR + m[0] + GREP_RESET : m[0]}\n`;
      continue;
    }
    const show = new Set<number>();
    for (const i of hits)
      for (let k = Math.max(0, i - before); k <= Math.min(ls.length - 1, i + after); k++) show.add(k);
    let last = -2;
    for (const i of [...show].sort((a, b) => a - b)) {
      if ((after || before) && last >= 0 && i > last + 1) out += '--\n';
      const isHit = hits.includes(i);
      out += `${showNames ? input.name + (isHit ? ':' : '-') : ''}${f.has('n') ? `${i + 1}${isHit ? ':' : '-'}` : ''}${isHit ? paint(ls[i]!) : ls[i]}\n`;
      last = i;
    }
  }
  const code = errors && !matchedAny ? 2 : matchedAny ? 0 : 1;
  return { stdout: out, stderr: errors, code };
};

const echo: CommandFn = ({ argv }) => {
  let args = argv.slice(1);
  let newline = true;
  let escapes = false;
  while (args[0] && /^-[neE]+$/.test(args[0])) {
    if (args[0].includes('n')) newline = false;
    if (args[0].includes('e')) escapes = true;
    args = args.slice(1);
  }
  let text = args.join(' ');
  if (escapes) text = text.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
  return ok(text + (newline ? '\n' : ''));
};

const tee: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1));
  let errors = '';
  for (const file of o.operands) {
    try {
      ctx.sh.fs.writeFile(ctx.sh.resolve(file), ctx.stdin, ctx.sh.cred, { append: o.flags.has('a') });
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      errors += `tee: ${file}: ${e.message}\n`;
    }
  }
  return { stdout: ctx.stdin, stderr: errors, code: errors ? 1 : 0 };
};

const less: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1));
  const file = o.operands[0];
  if (!file && !ctx.hasStdin) return fail('Missing filename ("less --help" for help)');
  const { inputs, errors } = readInputs(ctx, ctx.argv[0]!, file ? [file] : []);
  if (errors) return fail(errors);
  const content = inputs[0]!.content;
  // Not a terminal: behave like cat.
  if (!ctx.tty) return ok(content);
  return { program: pagerProgram(content, file ?? '(standard input)', o.flags.has('N')) };
};

export const TEXT_COMMANDS: Record<string, CommandFn> = {
  cat,
  head,
  tail,
  wc,
  sort,
  uniq,
  cut,
  grep,
  egrep: (c) => grep({ ...c, argv: ['grep', '-E', ...c.argv.slice(1)] }),
  echo,
  tee,
  less,
  more: less,
};

/** Commands that can sit after `tail -f |` and process input line by line. */
export const LINE_FILTERS = ['grep', 'egrep', 'cut', 'awk', 'cat', 'tee'];
