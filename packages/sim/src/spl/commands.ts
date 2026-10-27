import { extendedCommand } from './extended';
import { indexBuckets } from '../engineering/lifecycle';
import { canSearchIndex } from '../engineering/access';
import { infraName } from '../infra';
import type { World } from '../world';
import type { PracticePrincipal } from '@sandbox/shared';
import { boolOpt, intOpt, splitTopLevel, takeOptions, tokenizeArgs, words, type ArgTok } from './args';
import { evaluate, isTrue, parseExpr, toFieldValue, type Expr } from './eval';
import { lookupTable, makeresults, metadata, rest } from './generators';
import { Row } from './row';
import { matches, parseSearch } from './search';
import { autoSpanMs, parseSpan } from './time';
import { SplError, compareValues, scalar, toNumber, toStr, wildcardRegex, type Value } from './values';

export interface RunContext {
  readOnly?: boolean;
  search?: string;
  effects?: Array<() => void>;
  principal?: PracticePrincipal;
  world: World;
  /** Sim now, epoch ms. */
  now: number;
  earliest: number;
  latest: number;
  messages: { type: 'info' | 'warn' | 'error'; text: string }[];
}

export interface Sink {
  push(row: Row): void;
  finish(): Row[];
}

/**
 * A parsed command. Streaming commands transform one row at a time and can run while events are
 * being scanned; sinks aggregate a stream without needing order; everything has an array form.
 */
export interface Command {
  name: string;
  text: string;
  /** Results belong on the Statistics tab (stats, timechart, table ...). */
  transforming: boolean;
  generate?: (ctx: RunContext) => Row[];
  stream?: (row: Row, ctx: RunContext) => Row | null;
  sink?: (ctx: RunContext) => Sink;
  run: (rows: Row[], ctx: RunContext) => Row[];
}

type Parser = (args: string, name: string) => Omit<Command, 'name' | 'text'>;

const streaming = (
  fn: (row: Row, ctx: RunContext) => Row | null,
  transforming = false,
): Omit<Command, 'name' | 'text'> => ({
  transforming,
  stream: fn,
  run: (rows, ctx) => rows.map((r) => fn(r, ctx)).filter((r): r is Row => r !== null),
});

const fromSink = (
  make: (ctx: RunContext) => Sink,
  transforming: boolean,
): Omit<Command, 'name' | 'text'> => ({
  transforming,
  sink: make,
  run: (rows, ctx) => {
    const s = make(ctx);
    rows.forEach((r) => s.push(r));
    return s.finish();
  },
});

// ---------------------------------------------------------------- field lists

function fieldList(toks: ArgTok[]): string[] {
  return words(toks).filter((w) => w !== '');
}

function expandFields(patterns: string[], available: string[]): string[] {
  const out: string[] = [];
  for (const p of patterns) {
    if (!p.includes('*')) {
      if (!out.includes(p)) out.push(p);
      continue;
    }
    const re = wildcardRegex(p, false);
    for (const f of available) if (re.test(f) && !out.includes(f)) out.push(f);
  }
  return out;
}

function namesOf(rows: Row[], limit = 200): string[] {
  const names: string[] = [];
  for (const r of rows.slice(0, limit)) for (const n of r.names()) if (!names.includes(n)) names.push(n);
  return names;
}

// ---------------------------------------------------------------- aggregation

interface AggSpec {
  fn: string;
  field: string | null;
  as: string;
}

const AGG_FUNCS =
  /^(count|c|dc|distinct_count|sum|avg|mean|min|max|range|median|mode|stdev|var|values|list|first|last|earliest|latest|earliest_time|latest_time|perc\d+|p\d+)$/;

function parseAggs(toks: ArgTok[], command: string): { aggs: AggSpec[]; by: string[]; rest: ArgTok[] } {
  const aggs: AggSpec[] = [];
  let i = 0;
  const isWord = (t: ArgTok | undefined, v?: string) =>
    t?.t === 'word' && (v === undefined || t.v.toLowerCase() === v);
  while (i < toks.length) {
    const t = toks[i]!;
    if (t.t === 'punct' && t.v === ',') {
      i++;
      continue;
    }
    if (isWord(t, 'by') || isWord(t, 'over')) break;
    if (t.t !== 'word') throw new SplError(`The argument '${t.v}' is invalid.`, command);
    const fn = t.v.toLowerCase();
    if (!AGG_FUNCS.test(fn)) {
      if (aggs.length === 0) throw new SplError(`The argument '${t.v}' is invalid.`, command);
      break;
    }
    i++;
    let field: string | null = null;
    if (toks[i]?.t === 'punct' && toks[i]!.v === '(') {
      const f = toks[i + 1];
      if (f?.t !== 'word' || toks[i + 2]?.t !== 'punct' || toks[i + 2]!.v !== ')') {
        if (f?.t === 'word' && f.v.toLowerCase() === 'eval')
          throw new SplError('eval() inside aggregations is not supported in this sandbox.', command);
        throw new SplError(`The argument '${fn}(' is malformed.`, command);
      }
      field = f.v;
      i += 3;
    }
    if (fn !== 'count' && fn !== 'c' && field === null)
      throw new SplError(`The aggregation function '${fn}' requires a field.`, command);
    let as = field === null ? 'count' : `${fn}(${field})`;
    if (isWord(toks[i], 'as') && toks[i + 1]?.t === 'word') {
      as = (toks[i + 1] as { v: string }).v;
      i += 2;
    }
    aggs.push({
      fn: fn === 'c' ? 'count' : fn === 'distinct_count' ? 'dc' : fn === 'mean' ? 'avg' : fn,
      field,
      as,
    });
  }
  let by: string[] = [];
  if (i < toks.length && (isWord(toks[i], 'by') || isWord(toks[i], 'over'))) {
    i++;
    by = fieldList(toks.slice(i).filter((x) => !(x.t === 'punct' && x.v === ',')));
    i = toks.length;
  }
  return { aggs, by, rest: toks.slice(i) };
}

class Acc {
  count = 0;
  nums: number[] = [];
  sum = 0;
  strs: string[] = [];
  set = new Set<string>();
  min: Value = null;
  max: Value = null;
  first: { t: number; v: Value } | null = null;
  last: { t: number; v: Value } | null = null;

  constructor(readonly spec: AggSpec) {}

  push(row: Row): void {
    const { fn, field } = this.spec;
    if (field === null) {
      this.count++;
      return;
    }
    const raw = row.get(field);
    if (raw === null) return;
    const vals = Array.isArray(raw) ? raw : [raw];
    for (const v of vals) {
      this.count++;
      const n = toNumber(v);
      if (n !== null) {
        this.nums.push(n);
        this.sum += n;
      }
      if (fn === 'values' || fn === 'dc') this.set.add(toStr(v));
      if (fn === 'list' && this.strs.length < 100) this.strs.push(toStr(v));
      if (fn === 'mode') this.strs.push(toStr(v));
      if (this.min === null || compareValues(v, this.min) < 0) this.min = v;
      if (this.max === null || compareValues(v, this.max) > 0) this.max = v;
      const t = row.time ?? 0;
      if (this.first === null || t > this.first.t) this.first = { t, v };
      if (this.last === null || t < this.last.t) this.last = { t, v };
    }
  }

  value(): Value {
    const { fn } = this.spec;
    const nums = this.nums;
    const pct = (p: number) => {
      if (!nums.length) return null;
      const s = [...nums].sort((a, b) => a - b);
      return s[Math.min(s.length - 1, Math.max(0, Math.ceil((p / 100) * s.length) - 1))]!;
    };
    switch (fn) {
      case 'count':
        return this.count;
      case 'dc':
        return this.set.size;
      case 'sum':
        return nums.length ? this.sum : null;
      case 'avg':
        return nums.length ? this.sum / nums.length : null;
      case 'min':
        return this.min;
      case 'max':
        return this.max;
      case 'range':
        return nums.length ? Math.max(...nums) - Math.min(...nums) : null;
      case 'median':
        return pct(50);
      case 'stdev':
      case 'var': {
        if (nums.length < 2) return null;
        const mean = this.sum / nums.length;
        const v = nums.reduce((s, x) => s + (x - mean) ** 2, 0) / (nums.length - 1);
        return fn === 'var' ? v : Math.sqrt(v);
      }
      case 'mode': {
        const counts = new Map<string, number>();
        let best: string | null = null;
        for (const s of this.strs) {
          counts.set(s, (counts.get(s) ?? 0) + 1);
          if (best === null || counts.get(s)! > counts.get(best)!) best = s;
        }
        return best;
      }
      case 'values':
        return [...this.set].sort();
      case 'list':
        return this.strs;
      case 'first':
      case 'latest':
        return this.first?.v ?? null;
      case 'last':
      case 'earliest':
        return this.last?.v ?? null;
      case 'earliest_time':
        return this.last?.t ?? null;
      case 'latest_time':
        return this.first?.t ?? null;
    }
    const p = /^(?:perc|p)(\d+)$/.exec(fn);
    return p ? pct(Number(p[1])) : null;
  }
}

function groupKey(row: Row, by: string[]): string | null {
  const parts: string[] = [];
  for (const f of by) {
    const v = scalar(row.get(f));
    if (v === null) return null;
    parts.push(toStr(v));
  }
  return JSON.stringify(parts);
}

const stats: Parser = (args, name) => {
  const { aggs, by, rest } = parseAggs(tokenizeArgs(args, name), name);
  if (!aggs.length) throw new SplError('You must specify at least one aggregation.', name);
  if (rest.length) throw new SplError(`The argument '${(rest[0] as { v: string }).v}' is invalid.`, name);
  return fromSink(() => {
    const groups = new Map<string, { vals: string[]; accs: Acc[] }>();
    return {
      push(row) {
        const key = groupKey(row, by);
        if (key === null) return;
        let g = groups.get(key);
        if (!g) groups.set(key, (g = { vals: JSON.parse(key), accs: aggs.map((a) => new Acc(a)) }));
        g.accs.forEach((a) => a.push(row));
      },
      finish() {
        if (!by.length && groups.size === 0)
          groups.set('[]', { vals: [], accs: aggs.map((a) => new Acc(a)) });
        const out = [...groups.values()].map((g) => {
          const r = new Row();
          by.forEach((f, i) => r.set(f, g.vals[i]!));
          aggs.forEach((a, i) => r.set(a.as, g.accs[i]!.value()));
          return r;
        });
        if (by.length) out.sort((a, b) => by.reduce((c, f) => c || compareValues(a.get(f), b.get(f)), 0));
        return out;
      },
    };
  }, true);
};

const timechart: Parser = (args, name) => {
  const { opts, rest: toks } = takeOptions(tokenizeArgs(args, name), [
    'span',
    'limit',
    'useother',
    'usenull',
    'partial',
    'bins',
    'cont',
  ]);
  const { aggs, by, rest } = parseAggs(toks, name);
  if (!aggs.length) throw new SplError('You must specify at least one aggregation.', name);
  if (rest.length) throw new SplError(`The argument '${(rest[0] as { v: string }).v}' is invalid.`, name);
  if (by.length > 1) throw new SplError('Only one split-by field is supported.', name);
  const spanText = opts.get('span');
  const spanMs = spanText ? parseSpan(spanText) : null;
  if (spanText && !spanMs) throw new SplError(`Invalid span value: '${spanText}'.`, name);
  const limit = intOpt(opts, 'limit', name, 10);
  const useOther = boolOpt(opts, 'useother', true);
  const splitBy = by[0];
  return fromSink((ctx) => {
    const span = spanMs ?? autoSpanMs(ctx.latest - ctx.earliest);
    const buckets = new Map<number, Map<string, Acc[]>>();
    return {
      push(row) {
        const t = row.time;
        if (t === null) return;
        const b = Math.floor((t * 1000) / span) * span;
        const series = splitBy ? scalar(row.get(splitBy)) : '';
        if (series === null) return;
        let m = buckets.get(b);
        if (!m) buckets.set(b, (m = new Map()));
        let accs = m.get(toStr(series));
        if (!accs) m.set(toStr(series), (accs = aggs.map((a) => new Acc(a))));
        accs.forEach((a) => a.push(row));
      },
      finish() {
        // Rank series by total of the first aggregation; keep the top `limit`, fold the rest into OTHER.
        const totals = new Map<string, number>();
        for (const m of buckets.values())
          for (const [s, accs] of m) totals.set(s, (totals.get(s) ?? 0) + (toNumber(accs[0]!.value()) ?? 0));
        const ranked = [...totals.keys()].sort((a, b) => totals.get(b)! - totals.get(a)! || (a < b ? -1 : 1));
        const keep = splitBy && limit > 0 ? ranked.slice(0, limit) : ranked;
        const other = splitBy && useOther && ranked.length > keep.length;
        const start = Math.floor(ctx.earliest / span) * span;
        const out: Row[] = [];
        for (let b = start; b < ctx.latest; b += span) {
          const r = new Row();
          r.set('_time', b / 1000);
          const m = buckets.get(b);
          const isCount = (a: AggSpec) => a.fn === 'count' || a.fn === 'dc';
          if (!splitBy) {
            aggs.forEach((a, i) => r.set(a.as, m?.get('')?.[i]!.value() ?? (isCount(a) ? 0 : null)));
          } else {
            for (const s of [...keep].sort()) {
              aggs.forEach((a, i) => {
                const col = aggs.length > 1 ? `${a.as}: ${s}` : s;
                r.set(col, m?.get(s)?.[i]!.value() ?? (isCount(a) ? 0 : null));
              });
            }
            if (other) {
              const rest = ranked.slice(keep.length);
              const v = rest.reduce((sum, s) => sum + (toNumber(m?.get(s)?.[0]!.value() ?? 0) ?? 0), 0);
              r.set('OTHER', v);
            }
          }
          out.push(r);
        }
        return out;
      },
    };
  }, true);
};

function topRare(rare: boolean): Parser {
  return (args, name) => {
    const { opts, rest: toks } = takeOptions(tokenizeArgs(args, name), [
      'limit',
      'countfield',
      'percentfield',
      'showcount',
      'showperc',
      'useother',
    ]);
    const ws = fieldList(toks.filter((t) => !(t.t === 'punct')));
    const byIdx = ws.findIndex((w) => w.toLowerCase() === 'by');
    const fields = byIdx >= 0 ? ws.slice(0, byIdx) : ws;
    const by = byIdx >= 0 ? ws.slice(byIdx + 1) : [];
    if (!fields.length) throw new SplError('Missing fields.', name);
    const limit = intOpt(opts, 'limit', name, 10);
    const countField = opts.get('countfield') ?? 'count';
    const pctField = opts.get('percentfield') ?? 'percent';
    const showCount = boolOpt(opts, 'showcount', true);
    const showPerc = boolOpt(opts, 'showperc', true);
    return fromSink(() => {
      const groups = new Map<string, { byVals: string[]; total: number; counts: Map<string, number> }>();
      return {
        push(row) {
          const bk = groupKey(row, by);
          const fk = groupKey(row, fields);
          if (bk === null || fk === null) return;
          let g = groups.get(bk);
          if (!g) groups.set(bk, (g = { byVals: JSON.parse(bk), total: 0, counts: new Map() }));
          g.total++;
          g.counts.set(fk, (g.counts.get(fk) ?? 0) + 1);
        },
        finish() {
          const out: Row[] = [];
          for (const g of [...groups.values()].sort((a, b) =>
            JSON.stringify(a.byVals) < JSON.stringify(b.byVals) ? -1 : 1,
          )) {
            const entries = [...g.counts].sort(
              (a, b) => (rare ? a[1] - b[1] : b[1] - a[1]) || (a[0] < b[0] ? -1 : 1),
            );
            for (const [fk, n] of limit > 0 ? entries.slice(0, limit) : entries) {
              const r = new Row();
              by.forEach((f, i) => r.set(f, g.byVals[i]!));
              (JSON.parse(fk) as string[]).forEach((v, i) => r.set(fields[i]!, v));
              if (showCount) r.set(countField, n);
              if (showPerc) r.set(pctField, Math.round((n / g.total) * 100 * 1e6) / 1e6);
              out.push(r);
            }
          }
          return out;
        },
      };
    }, true);
  };
}

// ---------------------------------------------------------------- streaming commands

const searchCmd: Parser = (args) => {
  const node = parseSearch(args);
  return streaming((row) => (matches(node, row) ? row : null));
};

const where: Parser = (args, name) => {
  if (!args.trim()) throw new SplError('The expression is malformed. An unexpected end was reached.', name);
  const expr = parseExpr(args, name);
  return streaming((row, ctx) => (isTrue(evaluate(expr, row, ctx)) ? row : null));
};

const evalCmd: Parser = (args, name) => {
  const assigns: [string, Expr][] = splitTopLevel(args).map((part) => {
    const m = /^\s*('([^']+)'|"([^"]+)"|[A-Za-z_][\w.:]*)\s*=(?!=)([\s\S]*)$/.exec(part);
    if (!m)
      throw new SplError(
        'The expression is malformed. Expected an assignment like field = expression.',
        name,
      );
    return [m[2] ?? m[3] ?? m[1]!, parseExpr(m[4]!, name)];
  });
  if (!assigns.length) throw new SplError('The expression is malformed.', name);
  return streaming((row, ctx) => {
    for (const [f, e] of assigns) row.set(f, toFieldValue(evaluate(e, row, ctx)));
    return row;
  });
};

const rex: Parser = (args, name) => {
  const { opts, rest } = takeOptions(tokenizeArgs(args, name), [
    'field',
    'max_match',
    'mode',
    'offset_field',
  ]);
  if (opts.get('mode') === 'sed') throw new SplError('mode=sed is not supported in this sandbox.', name);
  const pattern = rest.find((t) => t.t === 'word' && t.quoted) as { v: string } | undefined;
  if (!pattern)
    throw new SplError('The regex is missing. Put it in double quotes, e.g. rex "(?<user>\\w+)".', name);
  let re: RegExp;
  try {
    re = new RegExp(pattern.v.replace(/\(\?P</g, '(?<'), 'g');
  } catch (e) {
    throw new SplError(
      `Encountered the following error while compiling the regex '${pattern.v}': ${(e as Error).message}`,
      name,
    );
  }
  const groups = [...pattern.v.matchAll(/\(\?P?<([A-Za-z_]\w*)>/g)].map((m) => m[1]!);
  if (!groups.length) throw new SplError('The regex must contain at least one named capturing group.', name);
  const field = opts.get('field') ?? '_raw';
  const maxMatch = intOpt(opts, 'max_match', name, 1);
  return streaming((row) => {
    const text = row.get(field);
    if (text === null) return row;
    re.lastIndex = 0;
    const found: Record<string, string>[] = [];
    for (const m of toStr(text).matchAll(re)) {
      found.push(m.groups ?? {});
      if (maxMatch !== 0 && found.length >= maxMatch) break;
    }
    for (const g of groups) {
      const vals = found.map((f) => f[g]).filter((v): v is string => v !== undefined);
      if (vals.length) row.set(g, vals.length === 1 ? vals[0]! : vals);
    }
    return row;
  });
};

const rename: Parser = (args, name) => {
  const pairs = splitTopLevel(args).map((p) => {
    const m = /^("?)([^"\s]+)\1\s+as\s+("?)([^"]+?)\3$/i.exec(p.trim());
    if (!m) throw new SplError(`Syntax: rename <field> AS <newname>. Could not parse '${p}'.`, name);
    return [m[2]!, m[4]!] as const;
  });
  return streaming((row) => {
    for (const [from, to] of pairs) {
      const v = row.get(from);
      if (v === null) continue;
      row.set(to, v);
      row.delete(from);
    }
    return row;
  });
};

const fillnull: Parser = (args, name) => {
  const { opts, rest } = takeOptions(tokenizeArgs(args, name), ['value']);
  const value = opts.get('value') ?? '0';
  const fields = fieldList(rest);
  return {
    transforming: false,
    run: (rows) => {
      const targets = fields.length ? fields : namesOf(rows).filter((f) => !f.startsWith('_'));
      for (const r of rows) for (const f of targets) if (r.get(f) === null) r.set(f, value);
      return rows;
    },
  };
};

const lookup: Parser = (args, name) => {
  const ws = words(tokenizeArgs(args, name).filter((t) => !(t.t === 'punct' && t.v === ',')));
  const table = ws.shift();
  if (!table) throw new SplError('Missing lookup table name.', name);
  const outIdx = ws.findIndex((w) => /^output(new)?$/i.test(w));
  const inputPart = outIdx >= 0 ? ws.slice(0, outIdx) : ws;
  const outputPart = outIdx >= 0 ? ws.slice(outIdx + 1) : [];
  const outputNew = outIdx >= 0 && ws[outIdx]!.toLowerCase() === 'outputnew';
  const pairs = (list: string[]) => {
    const out: [string, string][] = [];
    for (let i = 0; i < list.length; i++) {
      const src = list[i]!;
      if (list[i + 1]?.toLowerCase() === 'as' && list[i + 2]) {
        out.push([src, list[i + 2]!]);
        i += 2;
      } else out.push([src, src]);
    }
    return out;
  };
  const inputs = pairs(inputPart);
  if (!inputs.length) throw new SplError('Missing the lookup input field.', name);
  const outputs = pairs(outputPart);
  let index: { map: Map<string, Row>; columns: string[] } | null = null;
  return {
    transforming: false,
    run: (rows, ctx) => {
      if (!index) {
        const t = lookupTable(ctx, table);
        const map = new Map<string, Row>();
        for (const r of t.rows) {
          const key = JSON.stringify(inputs.map(([col]) => toStr(r.get(col)).toLowerCase()));
          if (!map.has(key)) map.set(key, r);
        }
        index = { map, columns: t.columns };
      }
      const { map, columns } = index;
      const outs = outputs.length
        ? outputs
        : columns.filter((c) => !inputs.some(([col]) => col === c)).map((c) => [c, c] as [string, string]);
      for (const r of rows) {
        const key = JSON.stringify(inputs.map(([, ev]) => toStr(r.get(ev)).toLowerCase()));
        const hit = map.get(key);
        for (const [col, as] of outs) {
          if (outputNew && r.get(as) !== null) continue;
          r.set(as, hit ? hit.get(col) : null);
        }
      }
      return rows;
    },
  };
};

// ---------------------------------------------------------------- reshaping and ordering

const table: Parser = (args, name) => {
  const pats = fieldList(tokenizeArgs(args, name).filter((t) => t.t === 'word'));
  if (!pats.length) throw new SplError('Missing fields.', name);
  return {
    transforming: true,
    run: (rows) => {
      const cols = expandFields(pats, namesOf(rows));
      return rows.map((r) => {
        const out = new Row();
        for (const c of cols) out.set(c, r.get(c));
        return out;
      });
    },
  };
};

const fields: Parser = (args, name) => {
  const toks = tokenizeArgs(args, name).filter((t) => t.t === 'word');
  let ws = words(toks);
  let remove = false;
  if (ws[0] === '-' || ws[0] === '+') {
    remove = ws[0] === '-';
    ws = ws.slice(1);
  } else if (ws[0]?.startsWith('-') && ws[0].length > 1) {
    remove = true;
    ws[0] = ws[0].slice(1);
  }
  if (!ws.length) throw new SplError('Missing fields.', name);
  return {
    transforming: false,
    run: (rows) => {
      const names = namesOf(rows);
      const cols = expandFields(ws, names);
      if (remove) {
        for (const r of rows) for (const c of cols) r.delete(c);
        return rows;
      }
      return rows.map((r) => {
        const out = r.event ? new Row(r.event) : new Row();
        // Internal fields stay unless explicitly removed.
        const keep = [...cols, ...names.filter((n) => n.startsWith('_'))];
        if (r.event) for (const n of r.names()) if (!keep.includes(n)) out.delete(n);
        for (const c of keep) if (r.get(c) !== null) out.set(c, r.get(c));
        return out;
      });
    },
  };
};

const sort: Parser = (args, name) => {
  const { opts, rest } = takeOptions(tokenizeArgs(args, name), ['limit']);
  const ws = words(rest);
  let limit = intOpt(opts, 'limit', name, 10000);
  if (ws[0] && /^\d+$/.test(ws[0])) limit = Number(ws.shift());
  const keys: { field: string; desc: boolean }[] = [];
  let pendingDesc = false;
  for (let w of ws) {
    if (w === '-' || w === '+') {
      pendingDesc = w === '-';
      continue;
    }
    let desc = pendingDesc;
    if (w.startsWith('-')) {
      desc = true;
      w = w.slice(1);
    } else if (w.startsWith('+')) w = w.slice(1);
    const fn = /^(?:num|str|auto|ip)\((.+)\)$/.exec(w);
    keys.push({ field: fn ? fn[1]! : w, desc });
    pendingDesc = false;
  }
  if (!keys.length) throw new SplError('Missing sort fields.', name);
  return {
    transforming: false,
    run: (rows) => {
      const sorted = [...rows].sort((a, b) => {
        for (const k of keys) {
          const av = a.get(k.field);
          const bv = b.get(k.field);
          // Missing values sort last either way.
          if (av === null && bv === null) continue;
          if (av === null) return 1;
          if (bv === null) return -1;
          const c = compareValues(scalar(av), scalar(bv));
          if (c) return k.desc ? -c : c;
        }
        return 0;
      });
      return limit > 0 ? sorted.slice(0, limit) : sorted;
    },
  };
};

function headTail(fromEnd: boolean): Parser {
  return (args, name) => {
    const { opts, rest } = takeOptions(tokenizeArgs(args, name), ['limit']);
    const ws = words(rest);
    const n = ws[0] && /^\d+$/.test(ws[0]) ? Number(ws[0]) : intOpt(opts, 'limit', name, 10);
    if (ws[0] && !/^\d+$/.test(ws[0])) throw new SplError(`The argument '${ws[0]}' is invalid.`, name);
    return {
      transforming: false,
      run: (rows) => (fromEnd ? rows.slice(Math.max(0, rows.length - n)).reverse() : rows.slice(0, n)),
    };
  };
}

const dedup: Parser = (args, name) => {
  const { opts, rest } = takeOptions(tokenizeArgs(args, name), ['keepempty', 'consecutive', 'sortby']);
  const ws = words(rest);
  let keepN = 1;
  if (ws[0] && /^\d+$/.test(ws[0])) keepN = Number(ws.shift());
  if (!ws.length) throw new SplError('Missing fields.', name);
  const keepEmpty = boolOpt(opts, 'keepempty', false);
  return {
    transforming: false,
    run: (rows) => {
      const seen = new Map<string, number>();
      return rows.filter((r) => {
        const key = groupKey(r, ws);
        if (key === null) return keepEmpty;
        const n = (seen.get(key) ?? 0) + 1;
        seen.set(key, n);
        return n <= keepN;
      });
    },
  };
};

// ---------------------------------------------------------------- generating commands

function generating(
  fn: (args: Map<string, string>, words: string[], ctx: RunContext, name: string) => Row[],
  optNames: string[],
): Parser {
  return (args, name) => {
    const { opts, rest } = takeOptions(tokenizeArgs(args, name), optNames);
    const ws = words(rest);
    return { transforming: true, generate: (ctx) => fn(opts, ws, ctx, name), run: () => [] };
  };
}

const COMMANDS: Record<string, Parser> = {
  dbinspect: generating(
    (o, ws, ctx, name) => {
      if (ws.length || !o.has('index'))
        throw new SplError('Supported: dbinspect index=NAME (recorded teaching buckets only)', name);
      return indexBuckets(ctx.world)
        .filter(
          (b) =>
            b.index === o.get('index') &&
            b.state !== 'frozen' &&
            canSearchIndex(ctx.world, infraName(ctx.world, 'search_head'), ctx.principal ?? 'admin', b.index),
        )
        .map((b) =>
          Row.of({
            bucketId: b.id,
            state: b.state,
            path: b.path,
            index: b.index,
            splunk_server: b.host,
            eventCount: b.events.length,
            sizeOnDiskMB: b.bytes / 1024 ** 2,
            startEpoch: b.earliest / 1000,
            endEpoch: b.latest / 1000,
          }),
        );
    },
    ['index'],
  ),
  search: searchCmd,
  where,
  eval: evalCmd,
  stats,
  timechart,
  top: topRare(false),
  rare: topRare(true),
  table,
  fields,
  rename,
  rex,
  sort,
  head: headTail(false),
  tail: headTail(true),
  dedup,
  fillnull,
  lookup,
  inputlookup: generating(
    (_o, ws, ctx, name) => {
      if (!ws[0]) throw new SplError('Missing lookup table name.', name);
      return lookupTable(ctx, ws[0]).rows.map((r) => Row.of(r.toObject()));
    },
    ['max', 'start', 'append'],
  ),
  rest: generating(
    (o, ws, ctx, name) => rest(ctx, ws[0] ?? '', o, name),
    ['splunk_server', 'count', 'timeout', 'splunk_server_group', 'f'],
  ),
  metadata: generating(
    (o, _ws, ctx, name) => metadata(ctx, o.get('type') ?? '', o.get('index'), name),
    ['type', 'index', 'splunk_server'],
  ),
  makeresults: generating(
    (o, _ws, ctx, name) => makeresults(ctx, intOpt(o, 'count', name, 1)),
    ['count', 'annotate'],
  ),
};

const GENERATING = new Set(['inputlookup', 'rest', 'metadata', 'makeresults', 'tstats', 'dbinspect']);

export function isGenerating(name: string): boolean {
  return GENERATING.has(name);
}

export function parseCommand(text: string): Command {
  const m = /^\s*([A-Za-z_][\w-]*)([\s\S]*)$/.exec(text);
  if (!m) throw new SplError('Search pipeline contains an empty command.');
  const name = m[1]!.toLowerCase();
  const parser = COMMANDS[name];
  if (!parser) {
    const extension = extendedCommand(name, m[2]!.trim());
    if (extension) return { name, text: text.trim(), ...extension };
    throw new SplError(`Unknown search command '${m[1]}'.`);
  }
  return { name, text: text.trim(), ...parser(m[2]!.trim(), name) };
}

export { expandFields, namesOf };
