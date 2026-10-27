import type { Row } from './row';
import { parseTime, strftime, strptime } from './time';
import { SplError, isNumeric, toNumber, toStr, type Value } from './values';

/**
 * eval / where expressions: arithmetic, `.` concatenation, comparisons, AND/OR/NOT/XOR, and a
 * library of Splunk functions. Parsed into an AST and interpreted; nothing is compiled to JS.
 */

export type Expr =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'field'; name: string }
  | { k: 'un'; op: string; e: Expr }
  | { k: 'bin'; op: string; a: Expr; b: Expr }
  | { k: 'call'; name: string; args: Expr[] };

type Tok =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'id'; v: string }
  | { t: 'qid'; v: string }
  | { t: 'op'; v: string };

function lex(src: string, command: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      const m = /^\d*\.?\d+(?:[eE][-+]?\d+)?/.exec(src.slice(i))!;
      out.push({ t: 'num', v: Number(m[0]) });
      i += m[0].length;
    } else if (c === '"' || c === "'") {
      let s = '';
      let j = i + 1;
      for (; j < src.length && src[j] !== c; j++) {
        if (src[j] === '\\' && j + 1 < src.length) s += src[++j];
        else s += src[j];
      }
      if (j >= src.length) throw new SplError('Unbalanced quotes.', command);
      // Double quotes are string literals; single quotes name a field.
      out.push(c === '"' ? { t: 'str', v: s } : { t: 'qid', v: s });
      i = j + 1;
    } else if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))!;
      out.push({ t: 'id', v: m[0] });
      i += m[0].length;
    } else {
      const two = src.slice(i, i + 2);
      if (['==', '!=', '<=', '>='].includes(two)) {
        out.push({ t: 'op', v: two });
        i += 2;
      } else if ('+-*/%.<>=(),!'.includes(c)) {
        out.push({ t: 'op', v: c });
        i++;
      } else throw new SplError(`The expression is malformed. Unexpected character '${c}'.`, command);
    }
  }
  return out;
}

export function parseExpr(src: string, command: string): Expr {
  const toks = lex(src, command);
  let i = 0;
  const err = (msg = 'The expression is malformed.') => new SplError(msg, command);
  const isOp = (v: string) => toks[i]?.t === 'op' && (toks[i] as { v: string }).v === v;
  const isKw = (v: string) => toks[i]?.t === 'id' && (toks[i] as { v: string }).v.toUpperCase() === v;

  const primary = (): Expr => {
    const t = toks[i++];
    if (!t) throw err('The expression is malformed. An unexpected end was reached.');
    if (t.t === 'num') return { k: 'num', v: t.v };
    if (t.t === 'str') return { k: 'str', v: t.v };
    if (t.t === 'qid') return { k: 'field', name: t.v };
    if (t.t === 'op' && t.v === '(') {
      const e = or();
      if (!isOp(')')) throw err('The expression is malformed. Expected ).');
      i++;
      return e;
    }
    if (t.t === 'id') {
      if (isOp('(')) {
        i++;
        const args: Expr[] = [];
        if (!isOp(')')) {
          args.push(or());
          while (isOp(',')) {
            i++;
            args.push(or());
          }
        }
        if (!isOp(')')) throw err(`The arguments to the '${t.v}' function are malformed.`);
        i++;
        const name = t.v.toLowerCase();
        if (!FUNCTIONS[name]) throw err(`The '${t.v}' function is unsupported or undefined.`);
        return { k: 'call', name, args };
      }
      return { k: 'field', name: t.v };
    }
    throw err();
  };
  const unary = (): Expr => {
    if (isOp('-') || isOp('+') || isOp('!')) {
      const op = (toks[i++] as { v: string }).v;
      return { k: 'un', op: op === '!' ? 'NOT' : op, e: unary() };
    }
    return primary();
  };
  const mult = (): Expr => {
    let a = unary();
    while (isOp('*') || isOp('/') || isOp('%')) {
      const op = (toks[i++] as { v: string }).v;
      a = { k: 'bin', op, a, b: unary() };
    }
    return a;
  };
  const add = (): Expr => {
    let a = mult();
    while (isOp('+') || isOp('-') || isOp('.')) {
      const op = (toks[i++] as { v: string }).v;
      a = { k: 'bin', op, a, b: mult() };
    }
    return a;
  };
  const cmp = (): Expr => {
    const a = add();
    for (const op of ['=', '==', '!=', '<', '<=', '>', '>=']) {
      if (isOp(op)) {
        i++;
        return { k: 'bin', op: op === '==' ? '=' : op, a, b: add() };
      }
    }
    if (isKw('LIKE')) {
      i++;
      return { k: 'call', name: 'like', args: [a, add()] };
    }
    return a;
  };
  const not = (): Expr => {
    if (isKw('NOT')) {
      i++;
      return { k: 'un', op: 'NOT', e: not() };
    }
    return cmp();
  };
  const and = (): Expr => {
    let a = not();
    while (isKw('AND')) {
      i++;
      a = { k: 'bin', op: 'AND', a, b: not() };
    }
    return a;
  };
  const or = (): Expr => {
    let a = and();
    while (isKw('OR') || isKw('XOR')) {
      const op = (toks[i++] as { v: string }).v.toUpperCase();
      a = { k: 'bin', op, a, b: and() };
    }
    return a;
  };

  const e = or();
  if (i < toks.length) throw err();
  return e;
}

// ---------------------------------------------------------------- evaluation

/** Booleans live only inside expressions; stored fields get "true"/"false"... but Splunk keeps them out entirely. */
type EVal = Value | boolean;

export interface EvalContext {
  now: number;
}

function truthy(v: EVal): boolean {
  if (typeof v === 'boolean') return v;
  return v !== null && v !== '' && v !== 0;
}

function cmpValues(a: EVal, b: EVal, op: string): boolean | null {
  if (a === null || b === null) return null;
  if (typeof a === 'boolean' || typeof b === 'boolean')
    return op === '=' ? a === b : op === '!=' ? a !== b : null;
  const an = typeof a === 'number' ? a : isNumeric(a) ? toNumber(a) : null;
  const bn = typeof b === 'number' ? b : isNumeric(b) ? toNumber(b) : null;
  if (an !== null && bn !== null) {
    switch (op) {
      case '=':
        return an === bn;
      case '!=':
        return an !== bn;
      case '<':
        return an < bn;
      case '<=':
        return an <= bn;
      case '>':
        return an > bn;
      case '>=':
        return an >= bn;
    }
  }
  const as = toStr(a as Value);
  const bs = toStr(b as Value);
  switch (op) {
    case '=':
      return as === bs;
    case '!=':
      return as !== bs;
    case '<':
      return as < bs;
    case '<=':
      return as <= bs;
    case '>':
      return as > bs;
    case '>=':
      return as >= bs;
  }
  return null;
}

const num = (v: EVal): number | null => (typeof v === 'boolean' ? null : toNumber(v));
const str = (v: EVal): string => (typeof v === 'boolean' ? String(v) : toStr(v));

type Fn = (args: Expr[], row: Row, ctx: EvalContext, ev: (e: Expr) => EVal) => EVal;

function likeRegex(pattern: string): RegExp {
  const src = pattern
    .replace(/[.+?^${}()|[\]\\*]/g, '\\$&')
    .replace(/%/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${src}$`, 's');
}

function ipToInt(ip: string): number | null {
  const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(ip);
  if (!m) return null;
  return ((+m[1]! << 24) >>> 0) + (+m[2]! << 16) + (+m[3]! << 8) + +m[4]!;
}

const FUNCTIONS: Record<string, Fn> = {
  if: (a, _r, _c, ev) => (truthy(ev(a[0]!)) ? ev(a[1]!) : a[2] ? ev(a[2]) : null),
  case: (a, _r, _c, ev) => {
    for (let i = 0; i + 1 < a.length; i += 2) if (truthy(ev(a[i]!))) return ev(a[i + 1]!);
    return null;
  },
  coalesce: (a, _r, _c, ev) => {
    for (const x of a) {
      const v = ev(x);
      if (v !== null && v !== '') return v;
    }
    return null;
  },
  isnull: (a, _r, _c, ev) => ev(a[0]!) === null,
  isnotnull: (a, _r, _c, ev) => ev(a[0]!) !== null,
  isnum: (a, _r, _c, ev) => {
    const v = ev(a[0]!);
    return typeof v === 'number' || (typeof v === 'string' && isNumeric(v));
  },
  isstr: (a, _r, _c, ev) => typeof ev(a[0]!) === 'string',
  typeof: (a, _r, _c, ev) => {
    const v = ev(a[0]!);
    return v === null
      ? 'Invalid'
      : typeof v === 'boolean'
        ? 'Boolean'
        : typeof v === 'number' || isNumeric(v as Value)
          ? 'Number'
          : 'String';
  },
  null: () => null,
  true: () => true,
  false: () => false,
  len: (a, _r, _c, ev) => {
    const v = ev(a[0]!);
    return v === null ? null : str(v).length;
  },
  lower: (a, _r, _c, ev) => str(ev(a[0]!)).toLowerCase(),
  upper: (a, _r, _c, ev) => str(ev(a[0]!)).toUpperCase(),
  trim: (a, _r, _c, ev) => str(ev(a[0]!)).trim(),
  ltrim: (a, _r, _c, ev) => str(ev(a[0]!)).trimStart(),
  rtrim: (a, _r, _c, ev) => str(ev(a[0]!)).trimEnd(),
  substr: (a, _r, _c, ev) => {
    const s = str(ev(a[0]!));
    let start = num(ev(a[1]!)) ?? 1;
    if (start < 0) start = s.length + start + 1;
    const len = a[2] ? (num(ev(a[2])) ?? s.length) : s.length;
    return s.substr(Math.max(0, start - 1), len);
  },
  replace: (a, _r, _c, ev) => {
    const repl = str(ev(a[2]!)).replace(/\\(\d)/g, '$$$1');
    try {
      return str(ev(a[0]!)).replace(new RegExp(str(ev(a[1]!)), 'g'), repl);
    } catch {
      throw new SplError('The regex in the replace function is invalid.', 'eval');
    }
  },
  match: (a, _r, _c, ev) => {
    try {
      return new RegExp(str(ev(a[1]!))).test(str(ev(a[0]!)));
    } catch {
      throw new SplError('The regex in the match function is invalid.', 'eval');
    }
  },
  like: (a, _r, _c, ev) => likeRegex(str(ev(a[1]!))).test(str(ev(a[0]!))),
  round: (a, _r, _c, ev) => {
    const v = num(ev(a[0]!));
    if (v === null) return null;
    const d = a[1] ? (num(ev(a[1])) ?? 0) : 0;
    return Math.round(v * 10 ** d) / 10 ** d;
  },
  floor: (a, _r, _c, ev) => (num(ev(a[0]!)) === null ? null : Math.floor(num(ev(a[0]!))!)),
  ceil: (a, _r, _c, ev) => (num(ev(a[0]!)) === null ? null : Math.ceil(num(ev(a[0]!))!)),
  ceiling: (a, r, c, ev) => FUNCTIONS.ceil!(a, r, c, ev),
  abs: (a, _r, _c, ev) => (num(ev(a[0]!)) === null ? null : Math.abs(num(ev(a[0]!))!)),
  sqrt: (a, _r, _c, ev) => (num(ev(a[0]!)) === null ? null : Math.sqrt(num(ev(a[0]!))!)),
  pow: (a, _r, _c, ev) => (num(ev(a[0]!)) ?? 0) ** (num(ev(a[1]!)) ?? 1),
  exp: (a, _r, _c, ev) => Math.exp(num(ev(a[0]!)) ?? 0),
  ln: (a, _r, _c, ev) => Math.log(num(ev(a[0]!)) ?? 0),
  log: (a, _r, _c, ev) => Math.log(num(ev(a[0]!)) ?? 0) / Math.log(a[1] ? (num(ev(a[1])) ?? 10) : 10),
  max: (a, _r, _c, ev) => {
    const vals = a.map((x) => ev(x)).filter((v) => v !== null);
    if (!vals.length) return null;
    return vals.every((v) => num(v) !== null)
      ? Math.max(...vals.map((v) => num(v)!))
      : vals.map(str).sort().at(-1)!;
  },
  min: (a, _r, _c, ev) => {
    const vals = a.map((x) => ev(x)).filter((v) => v !== null);
    if (!vals.length) return null;
    return vals.every((v) => num(v) !== null)
      ? Math.min(...vals.map((v) => num(v)!))
      : vals.map(str).sort()[0]!;
  },
  tonumber: (a, _r, _c, ev) => {
    const s = str(ev(a[0]!)).trim();
    const base = a[1] ? (num(ev(a[1])) ?? 10) : 10;
    const n = base === 10 ? (isNumeric(s) ? Number(s) : NaN) : parseInt(s, base);
    return Number.isFinite(n) ? n : null;
  },
  tostring: (a, _r, _c, ev) => {
    const v = ev(a[0]!);
    if (v === null) return null;
    const fmt = a[1] ? str(ev(a[1])) : '';
    const n = num(v);
    if (fmt === 'commas' && n !== null) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (fmt === 'hex' && n !== null) return '0x' + Math.trunc(n).toString(16).toUpperCase();
    if (fmt === 'duration' && n !== null) {
      const s = Math.floor(n);
      const d = Math.floor(s / 86400);
      const hms = [Math.floor((s % 86400) / 3600), Math.floor((s % 3600) / 60), s % 60]
        .map((x) => String(x).padStart(2, '0'))
        .join(':');
      return d ? `${d}+${hms}` : hms;
    }
    return str(v);
  },
  now: (_a, _r, c) => Math.floor(c.now / 1000),
  time: (_a, _r, c) => c.now / 1000,
  relative_time: (a, _r, _c, ev) => {
    const t = num(ev(a[0]!));
    if (t === null) return null;
    const r = parseTime(str(ev(a[1]!)), t * 1000);
    return r === null ? null : r / 1000;
  },
  strftime: (a, _r, _c, ev) => {
    const t = num(ev(a[0]!));
    return t === null ? null : strftime(t, str(ev(a[1]!)));
  },
  strptime: (a, _r, _c, ev) => strptime(str(ev(a[0]!)), str(ev(a[1]!))),
  split: (a, _r, _c, ev) => {
    const v = ev(a[0]!);
    return v === null ? null : str(v).split(str(ev(a[1]!)));
  },
  mvcount: (a, _r, _c, ev) => {
    const v = ev(a[0]!);
    return v === null ? null : Array.isArray(v) ? v.length : 1;
  },
  mvindex: (a, _r, _c, ev) => {
    const v = ev(a[0]!);
    const list = Array.isArray(v) ? v : v === null ? [] : [str(v)];
    let i = num(ev(a[1]!)) ?? 0;
    if (i < 0) i += list.length;
    return list[i] ?? null;
  },
  mvjoin: (a, _r, _c, ev) => {
    const v = ev(a[0]!);
    return Array.isArray(v) ? v.join(str(ev(a[1]!))) : v === null ? null : str(v);
  },
  cidrmatch: (a, _r, _c, ev) => {
    const [net, bits] = str(ev(a[0]!)).split('/');
    const ip = ipToInt(str(ev(a[1]!)));
    const base = ipToInt(net ?? '');
    if (ip === null || base === null) return false;
    const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
    return (ip & mask) >>> 0 === (base & mask) >>> 0;
  },
};

export function evaluate(e: Expr, row: Row, ctx: EvalContext): EVal {
  const ev = (x: Expr): EVal => evaluate(x, row, ctx);
  switch (e.k) {
    case 'num':
      return e.v;
    case 'str':
      return e.v;
    case 'field':
      return row.get(e.name);
    case 'un': {
      const v = ev(e.e);
      if (e.op === 'NOT') return !truthy(v);
      const n = num(v);
      return n === null ? null : e.op === '-' ? -n : n;
    }
    case 'call':
      return FUNCTIONS[e.name]!(e.args, row, ctx, ev);
    case 'bin': {
      if (e.op === 'AND') return truthy(ev(e.a)) && truthy(ev(e.b));
      if (e.op === 'OR') return truthy(ev(e.a)) || truthy(ev(e.b));
      if (e.op === 'XOR') return truthy(ev(e.a)) !== truthy(ev(e.b));
      const a = ev(e.a);
      const b = ev(e.b);
      if (e.op === '.') return a === null || b === null ? null : str(a) + str(b);
      if (['=', '!=', '<', '<=', '>', '>='].includes(e.op)) return cmpValues(a, b, e.op) ?? false;
      if (
        e.op === '+' &&
        (typeof a === 'string' || typeof b === 'string') &&
        (num(a) === null || num(b) === null)
      )
        return a === null || b === null ? null : str(a) + str(b);
      const x = num(a);
      const y = num(b);
      if (x === null || y === null) return null;
      switch (e.op) {
        case '+':
          return x + y;
        case '-':
          return x - y;
        case '*':
          return x * y;
        case '/':
          return y === 0 ? null : x / y;
        case '%':
          return y === 0 ? null : x % y;
      }
      return null;
    }
  }
}

/** Result of an eval assignment as a stored field value (booleans aren't storable in Splunk). */
export function toFieldValue(v: EVal): Value {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  return v;
}

export function isTrue(v: EVal): boolean {
  return truthy(v) && v !== 'false';
}

/** Fields an expression reads (for job inspection and validation). */
export function exprFields(e: Expr): string[] {
  switch (e.k) {
    case 'field':
      return [e.name];
    case 'un':
      return exprFields(e.e);
    case 'bin':
      return [...exprFields(e.a), ...exprFields(e.b)];
    case 'call':
      return e.args.flatMap(exprFields);
    default:
      return [];
  }
}
