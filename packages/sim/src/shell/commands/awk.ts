import { fail, type CommandFn } from '../types';
import { getopt, lines, readInputs } from './util';

/**
 * A small awk: patterns (BEGIN, END, /re/, expressions), print/printf, assignments, ++/--,
 * associative arrays with `for (k in a)`, if/else, next, and the common built-ins.
 * It is an interpreter over parsed data; it never evaluates JavaScript.
 */

type Val = string | number;
type Tok =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 're'; v: string }
  | { t: 'name'; v: string }
  | { t: 'sym'; v: string }
  | { t: 'nl' };

class AwkError extends Error {}

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  const operand = () => {
    const last = out[out.length - 1];
    return (
      last &&
      (last.t === 'num' ||
        last.t === 'str' ||
        last.t === 'name' ||
        (last.t === 'sym' && (last.v === ')' || last.v === ']' || last.v === '$')))
    );
  };
  for (let i = 0; i < src.length;) {
    const c = src[i]!;
    if (c === ' ' || c === '\t' || c === '\r') {
      i++;
    } else if (c === '\n' || c === ';') {
      out.push({ t: 'nl' });
      i++;
    } else if (c === '#') {
      while (i < src.length && src[i] !== '\n') i++;
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = /^\d*\.?\d+(?:[eE][-+]?\d+)?/.exec(src.slice(i))!;
      out.push({ t: 'num', v: Number(m[0]) });
      i += m[0].length;
    } else if (c === '"') {
      let s = '';
      i++;
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\') {
          const n = src[++i];
          s += n === 'n' ? '\n' : n === 't' ? '\t' : (n ?? '');
        } else s += src[i];
        i++;
      }
      i++;
      out.push({ t: 'str', v: s });
    } else if (c === '/' && !operand()) {
      let s = '';
      i++;
      while (i < src.length && src[i] !== '/') {
        if (src[i] === '\\' && src[i + 1] === '/') {
          s += '/';
          i += 2;
          continue;
        }
        s += src[i++];
      }
      i++;
      out.push({ t: 're', v: s });
    } else if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_]\w*/.exec(src.slice(i))!;
      out.push({ t: 'name', v: m[0] });
      i += m[0].length;
    } else {
      const two = src.slice(i, i + 2);
      if (['==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '!~'].includes(two)) {
        out.push({ t: 'sym', v: two });
        i += 2;
      } else {
        out.push({ t: 'sym', v: c });
        i++;
      }
    }
  }
  return out;
}

type Expr =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 're'; v: string }
  | { k: 'field'; e: Expr }
  | { k: 'var'; name: string }
  | { k: 'idx'; name: string; e: Expr }
  | { k: 'bin'; op: string; a: Expr; b: Expr }
  | { k: 'un'; op: string; e: Expr }
  | { k: 'assign'; op: string; target: Expr; e: Expr }
  | { k: 'incdec'; op: string; prefix: boolean; target: Expr }
  | { k: 'call'; name: string; args: Expr[] }
  | { k: 'cond'; c: Expr; a: Expr; b: Expr }
  | { k: 'in'; key: Expr; name: string };

type Stmt =
  | { k: 'print'; args: Expr[] }
  | { k: 'printf'; args: Expr[] }
  | { k: 'expr'; e: Expr }
  | { k: 'if'; c: Expr; then: Stmt; else?: Stmt }
  | { k: 'forin'; v: string; arr: string; body: Stmt }
  | { k: 'block'; body: Stmt[] }
  | { k: 'next' };

interface Rule {
  pattern: 'BEGIN' | 'END' | Expr | null;
  body: Stmt[] | null;
}

class Parser {
  i = 0;
  constructor(private readonly toks: Tok[]) {}
  peek(): Tok | undefined {
    return this.toks[this.i];
  }
  isSym(v: string): boolean {
    const t = this.peek();
    return t?.t === 'sym' && t.v === v;
  }
  isName(v: string): boolean {
    const t = this.peek();
    return t?.t === 'name' && t.v === v;
  }
  expect(v: string): void {
    if (!this.isSym(v)) throw new AwkError(`syntax error near ${JSON.stringify(this.peek() ?? 'end')}`);
    this.i++;
  }
  skipNl(): void {
    while (this.peek()?.t === 'nl') this.i++;
  }

  program(): Rule[] {
    const rules: Rule[] = [];
    this.skipNl();
    while (this.peek()) {
      let pattern: Rule['pattern'] = null;
      if (this.isName('BEGIN') || this.isName('END'))
        pattern = (this.toks[this.i++] as { v: string }).v as 'BEGIN' | 'END';
      else if (!this.isSym('{')) pattern = this.expr();
      const body = this.isSym('{') ? this.block() : null;
      rules.push({ pattern, body });
      this.skipNl();
    }
    return rules;
  }

  block(): Stmt[] {
    this.expect('{');
    const body: Stmt[] = [];
    this.skipNl();
    while (!this.isSym('}')) {
      if (!this.peek()) throw new AwkError('unexpected end of program');
      body.push(this.stmt());
      this.skipNl();
    }
    this.i++;
    return body;
  }

  stmt(): Stmt {
    if (this.isSym('{')) return { k: 'block', body: this.block() };
    if (this.isName('print') || this.isName('printf')) {
      const kind = (this.toks[this.i++] as { v: string }).v as 'print' | 'printf';
      const args: Expr[] = [];
      const paren = this.isSym('(');
      if (paren) this.i++;
      while (this.peek() && this.peek()!.t !== 'nl' && !this.isSym('}') && !(paren && this.isSym(')'))) {
        args.push(this.expr(true));
        if (this.isSym(',')) this.i++;
        else break;
      }
      if (paren) this.expect(')');
      return { k: kind, args };
    }
    if (this.isName('next')) {
      this.i++;
      return { k: 'next' };
    }
    if (this.isName('if')) {
      this.i++;
      this.expect('(');
      const c = this.expr();
      this.expect(')');
      this.skipNl();
      const then = this.stmt();
      const save = this.i;
      this.skipNl();
      if (this.isName('else')) {
        this.i++;
        this.skipNl();
        return { k: 'if', c, then, else: this.stmt() };
      }
      this.i = save;
      return { k: 'if', c, then };
    }
    if (this.isName('for')) {
      this.i++;
      this.expect('(');
      const v = this.peek();
      if (v?.t !== 'name') throw new AwkError('only "for (key in array)" loops are supported');
      this.i++;
      if (!this.isName('in')) throw new AwkError('only "for (key in array)" loops are supported');
      this.i++;
      const arr = this.peek();
      if (arr?.t !== 'name') throw new AwkError('expected array name');
      this.i++;
      this.expect(')');
      this.skipNl();
      return { k: 'forin', v: v.v, arr: arr.v, body: this.stmt() };
    }
    return { k: 'expr', e: this.expr() };
  }

  expr(noGt = false): Expr {
    return this.assign(noGt);
  }
  assign(noGt: boolean): Expr {
    const left = this.cond(noGt);
    const t = this.peek();
    if (
      t?.t === 'sym' &&
      ['=', '+=', '-=', '*=', '/='].includes(t.v) &&
      (left.k === 'var' || left.k === 'field' || left.k === 'idx')
    ) {
      this.i++;
      return { k: 'assign', op: t.v, target: left, e: this.assign(noGt) };
    }
    return left;
  }
  cond(noGt: boolean): Expr {
    const c = this.or(noGt);
    if (this.isSym('?')) {
      this.i++;
      const a = this.cond(noGt);
      this.expect(':');
      return { k: 'cond', c, a, b: this.cond(noGt) };
    }
    return c;
  }
  or(noGt: boolean): Expr {
    let a = this.and(noGt);
    while (this.isSym('||')) {
      this.i++;
      a = { k: 'bin', op: '||', a, b: this.and(noGt) };
    }
    return a;
  }
  and(noGt: boolean): Expr {
    let a = this.inExpr(noGt);
    while (this.isSym('&&')) {
      this.i++;
      a = { k: 'bin', op: '&&', a, b: this.inExpr(noGt) };
    }
    return a;
  }
  inExpr(noGt: boolean): Expr {
    const a = this.match(noGt);
    if (this.isName('in')) {
      this.i++;
      const n = this.peek();
      if (n?.t !== 'name') throw new AwkError('expected array name after in');
      this.i++;
      return { k: 'in', key: a, name: n.v };
    }
    return a;
  }
  match(noGt: boolean): Expr {
    let a = this.compare(noGt);
    while (this.isSym('~') || this.isSym('!~')) {
      const op = (this.toks[this.i++] as { v: string }).v;
      a = { k: 'bin', op, a, b: this.compare(noGt) };
    }
    return a;
  }
  compare(noGt: boolean): Expr {
    const a = this.concat();
    const t = this.peek();
    if (t?.t === 'sym' && ['<', '<=', '>=', '==', '!=', ...(noGt ? [] : ['>'])].includes(t.v)) {
      this.i++;
      return { k: 'bin', op: t.v, a, b: this.concat() };
    }
    return a;
  }
  concat(): Expr {
    let a = this.additive();
    for (;;) {
      const t = this.peek();
      const startsOperand =
        t &&
        (t.t === 'num' ||
          t.t === 'str' ||
          (t.t === 'name' && !['in', 'else'].includes(t.v)) ||
          (t.t === 'sym' && (t.v === '$' || t.v === '(' || t.v === '!')));
      if (!startsOperand) return a;
      a = { k: 'bin', op: 'concat', a, b: this.additive() };
    }
  }
  additive(): Expr {
    let a = this.mult();
    while (this.isSym('+') || this.isSym('-')) {
      const op = (this.toks[this.i++] as { v: string }).v;
      a = { k: 'bin', op, a, b: this.mult() };
    }
    return a;
  }
  mult(): Expr {
    let a = this.unary();
    while (this.isSym('*') || this.isSym('/') || this.isSym('%')) {
      const op = (this.toks[this.i++] as { v: string }).v;
      a = { k: 'bin', op, a, b: this.unary() };
    }
    return a;
  }
  unary(): Expr {
    if (this.isSym('!') || this.isSym('-') || this.isSym('+')) {
      const op = (this.toks[this.i++] as { v: string }).v;
      return { k: 'un', op, e: this.unary() };
    }
    if (this.isSym('++') || this.isSym('--')) {
      const op = (this.toks[this.i++] as { v: string }).v;
      return { k: 'incdec', op, prefix: true, target: this.postfix() };
    }
    return this.postfix();
  }
  postfix(): Expr {
    const e = this.primary();
    if ((this.isSym('++') || this.isSym('--')) && (e.k === 'var' || e.k === 'field' || e.k === 'idx')) {
      const op = (this.toks[this.i++] as { v: string }).v;
      return { k: 'incdec', op, prefix: false, target: e };
    }
    return e;
  }
  primary(): Expr {
    const t = this.toks[this.i++];
    if (!t) throw new AwkError('unexpected end of program');
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'str') return { k: 'str', v: t.v };
    if (t.t === 're') return { k: 're', v: t.v };
    if (t.t === 'sym' && t.v === '$') return { k: 'field', e: this.primary() };
    if (t.t === 'sym' && t.v === '(') {
      const e = this.expr();
      this.expect(')');
      return e;
    }
    if (t.t === 'name') {
      if (this.isSym('(') && FUNCS.has(t.v)) {
        this.i++;
        const args: Expr[] = [];
        while (!this.isSym(')')) {
          args.push(this.expr());
          if (this.isSym(',')) this.i++;
        }
        this.i++;
        return { k: 'call', name: t.v, args };
      }
      if (t.v === 'length') return { k: 'call', name: 'length', args: [] };
      if (this.isSym('[')) {
        this.i++;
        const e = this.expr();
        this.expect(']');
        return { k: 'idx', name: t.v, e };
      }
      return { k: 'var', name: t.v };
    }
    throw new AwkError(`syntax error at source line 1`);
  }
}

const FUNCS = new Set(['length', 'substr', 'tolower', 'toupper', 'int', 'index', 'sprintf', 'split']);

const isNumStr = (s: string) => /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(s);
const num = (v: Val) => (typeof v === 'number' ? v : parseFloat(v) || 0);
const str = (v: Val) =>
  typeof v === 'number' ? (Number.isInteger(v) ? String(v) : String(Number(v.toPrecision(6)))) : v;
const truthy = (v: Val) => (typeof v === 'number' ? v !== 0 : v !== '');

export function sprintf(fmt: string, args: Val[]): string {
  let i = 0;
  return fmt.replace(
    /%([-0 +]*)(\d*)(?:\.(\d+))?([sdifgcx%])/g,
    (_, flags: string, width: string, prec: string | undefined, conv: string) => {
      if (conv === '%') return '%';
      const a = args[i++] ?? '';
      let s: string;
      if (conv === 's') s = prec !== undefined ? str(a).slice(0, Number(prec)) : str(a);
      else if (conv === 'd' || conv === 'i') s = String(Math.trunc(num(a)));
      else if (conv === 'f') s = num(a).toFixed(prec !== undefined ? Number(prec) : 6);
      else if (conv === 'g') s = String(Number(num(a).toPrecision(prec ? Number(prec) : 6)));
      else if (conv === 'x') s = Math.trunc(num(a)).toString(16);
      else s = str(a).charAt(0);
      const w = Number(width || 0);
      if (s.length >= w) return s;
      return flags.includes('-')
        ? s.padEnd(w)
        : s.padStart(w, flags.includes('0') && conv !== 's' ? '0' : ' ');
    },
  );
}

class NextSignal {}

function run(rules: Rule[], inputLines: string[], fs: string, presets: Map<string, Val>): string {
  const vars = new Map<string, Val>([['FS', fs], ['OFS', ' '], ['NR', 0], ['NF', 0], ...presets]);
  const arrays = new Map<string, Map<string, Val>>();
  let fields: string[] = [''];
  let out = '';
  const arr = (name: string) => {
    let a = arrays.get(name);
    if (!a) arrays.set(name, (a = new Map()));
    return a;
  };
  const split = (line: string) => {
    const sep = str(vars.get('FS')!);
    const parts =
      sep === ' '
        ? line.trim().split(/\s+/).filter(Boolean)
        : line.split(sep.length === 1 ? sep : new RegExp(sep));
    fields = [line, ...parts];
    vars.set('NF', parts.length);
  };
  const regex = (e: Expr): RegExp => new RegExp(e.k === 're' ? e.v : str(ev(e)));

  const get = (e: Expr): Val => ev(e);
  const set = (target: Expr, v: Val) => {
    if (target.k === 'var') vars.set(target.name, v);
    else if (target.k === 'idx') arr(target.name).set(str(ev(target.e)), v);
    else if (target.k === 'field') {
      const n = Math.trunc(num(ev(target.e)));
      fields[n] = str(v);
      if (n === 0) split(str(v));
      else fields[0] = fields.slice(1).join(str(vars.get('OFS')!));
    }
  };

  function ev(e: Expr): Val {
    switch (e.k) {
      case 'num':
        return e.v;
      case 'str':
        return e.v;
      case 're':
        return new RegExp(e.v).test(fields[0]!) ? 1 : 0;
      case 'field':
        return fields[Math.trunc(num(ev(e.e)))] ?? '';
      case 'var':
        return vars.get(e.name) ?? '';
      case 'idx':
        return arr(e.name).get(str(ev(e.e))) ?? '';
      case 'in':
        return arr(e.name).has(str(ev(e.key))) ? 1 : 0;
      case 'cond':
        return truthy(ev(e.c)) ? ev(e.a) : ev(e.b);
      case 'un': {
        const v = ev(e.e);
        return e.op === '!' ? (truthy(v) ? 0 : 1) : e.op === '-' ? -num(v) : num(v);
      }
      case 'assign': {
        const v = ev(e.e);
        const cur = num(get(e.target));
        const next =
          e.op === '='
            ? v
            : e.op === '+='
              ? cur + num(v)
              : e.op === '-='
                ? cur - num(v)
                : e.op === '*='
                  ? cur * num(v)
                  : cur / num(v);
        set(e.target, next);
        return next;
      }
      case 'incdec': {
        const cur = num(get(e.target));
        const next = e.op === '++' ? cur + 1 : cur - 1;
        set(e.target, next);
        return e.prefix ? next : cur;
      }
      case 'call': {
        const a = e.args;
        switch (e.name) {
          case 'length':
            return a.length ? str(ev(a[0]!)).length : fields[0]!.length;
          case 'substr': {
            const s = str(ev(a[0]!));
            const start = Math.max(1, Math.trunc(num(ev(a[1]!))));
            return a[2] ? s.substr(start - 1, Math.trunc(num(ev(a[2])))) : s.slice(start - 1);
          }
          case 'tolower':
            return str(ev(a[0]!)).toLowerCase();
          case 'toupper':
            return str(ev(a[0]!)).toUpperCase();
          case 'int':
            return Math.trunc(num(ev(a[0]!)));
          case 'index':
            return str(ev(a[0]!)).indexOf(str(ev(a[1]!))) + 1;
          case 'sprintf':
            return sprintf(str(ev(a[0]!)), a.slice(1).map(ev));
          case 'split': {
            const target = a[1];
            if (target?.k !== 'var') throw new AwkError('split: second argument must be an array');
            const parts = str(ev(a[0]!)).split(a[2] ? str(ev(a[2])) : /\s+/);
            const m = new Map<string, Val>();
            parts.forEach((p, i) => m.set(String(i + 1), p));
            arrays.set(target.name, m);
            return parts.length;
          }
        }
        return '';
      }
      case 'bin': {
        if (e.op === '&&') return truthy(ev(e.a)) && truthy(ev(e.b)) ? 1 : 0;
        if (e.op === '||') return truthy(ev(e.a)) || truthy(ev(e.b)) ? 1 : 0;
        if (e.op === '~' || e.op === '!~') {
          const hit = regex(e.b).test(str(ev(e.a)));
          return hit === (e.op === '~') ? 1 : 0;
        }
        const a = ev(e.a);
        const b = ev(e.b);
        switch (e.op) {
          case 'concat':
            return str(a) + str(b);
          case '+':
            return num(a) + num(b);
          case '-':
            return num(a) - num(b);
          case '*':
            return num(a) * num(b);
          case '/':
            if (num(b) === 0) throw new AwkError('division by zero');
            return num(a) / num(b);
          case '%':
            return num(a) % num(b);
        }
        const numeric = (typeof a === 'number' || isNumStr(a)) && (typeof b === 'number' || isNumStr(b));
        const x = numeric ? num(a) : str(a);
        const y = numeric ? num(b) : str(b);
        const r =
          e.op === '<'
            ? x < y
            : e.op === '<='
              ? x <= y
              : e.op === '>'
                ? x > y
                : e.op === '>='
                  ? x >= y
                  : e.op === '=='
                    ? x === y
                    : x !== y;
        return r ? 1 : 0;
      }
    }
  }

  const exec = (s: Stmt): void => {
    switch (s.k) {
      case 'print':
        out += (s.args.length ? s.args.map((a) => str(ev(a))).join(str(vars.get('OFS')!)) : fields[0]) + '\n';
        return;
      case 'printf':
        if (!s.args.length) throw new AwkError('printf: no format');
        out += sprintf(str(ev(s.args[0]!)), s.args.slice(1).map(ev));
        return;
      case 'expr':
        ev(s.e);
        return;
      case 'if':
        if (truthy(ev(s.c))) exec(s.then);
        else if (s.else) exec(s.else);
        return;
      case 'forin':
        for (const key of [...arr(s.arr).keys()]) {
          vars.set(s.v, key);
          exec(s.body);
        }
        return;
      case 'block':
        s.body.forEach(exec);
        return;
      case 'next':
        throw new NextSignal();
    }
  };

  for (const r of rules) if (r.pattern === 'BEGIN') r.body?.forEach(exec);
  const main = rules.filter((r) => r.pattern !== 'BEGIN' && r.pattern !== 'END');
  for (const line of inputLines) {
    vars.set('NR', num(vars.get('NR')!) + 1);
    split(line);
    try {
      for (const r of main) {
        const p = r.pattern as Expr | null;
        if (p && !truthy(ev(p))) continue;
        if (r.body) r.body.forEach(exec);
        else out += fields[0] + '\n';
      }
    } catch (e) {
      if (!(e instanceof NextSignal)) throw e;
    }
  }
  for (const r of rules) if (r.pattern === 'END') r.body?.forEach(exec);
  return out;
}

export const awk: CommandFn = (ctx) => {
  const o = getopt(ctx.argv.slice(1), 'Fv');
  if (o.error) return fail(`awk: ${o.error}`, 2);
  const [program, ...files] = o.operands;
  if (program === undefined) return fail('usage: awk [-F fs][-v var=value][prog | -f progfile][file ...]', 2);
  const presets = new Map<string, Val>();
  const v = o.flags.get('v');
  if (typeof v === 'string' && v.includes('='))
    presets.set(v.slice(0, v.indexOf('=')), v.slice(v.indexOf('=') + 1));
  let fsArg = (o.flags.get('F') as string | undefined) ?? ' ';
  if (fsArg === 't' || fsArg === '\\t') fsArg = '\t';
  try {
    const rules = new Parser(lex(program)).program();
    const { inputs, errors } = readInputs(ctx, 'awk', files);
    const out = run(
      rules,
      inputs.flatMap((i) => lines(i.content)),
      fsArg,
      presets,
    );
    return {
      stdout: out,
      stderr: errors.replace(
        /^awk: (.*): /gm,
        "awk: cmd. line:1: fatal: cannot open file `$1' for reading: ",
      ),
      code: errors ? 2 : 0,
    };
  } catch (e) {
    if (e instanceof AwkError) return fail(`awk: cmd. line:1: ${e.message}`, 2);
    if (e instanceof SyntaxError) return fail(`awk: cmd. line:1: invalid regular expression`, 2);
    throw e;
  }
};
