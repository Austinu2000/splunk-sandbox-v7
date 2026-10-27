import { REGEX_FIELD_NAMES } from './fields';
import { DEFAULT_FIELDS, type Row } from './row';
import { SplError, toNumber, toStr, wildcardRegex, type Value } from './values';

/**
 * The `search` command's language: bare terms and "phrases" matched against _raw, field
 * comparisons (=, !=, <, <=, >, >=) with wildcards, AND / OR / NOT and parentheses.
 * As in Splunk, OR binds tighter than the implicit AND.
 */

export type SearchNode =
  | { k: 'and'; items: SearchNode[] }
  | { k: 'or'; items: SearchNode[] }
  | { k: 'not'; item: SearchNode }
  | { k: 'cmp'; field: string; op: string; value: string; quoted: boolean }
  | { k: 'term'; text: string; phrase: boolean }
  | { k: 'true' };

type Tok = { t: 'lp' } | { t: 'rp' } | { t: 'word'; text: string; quoted: boolean };

function lex(text: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i]!;
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (c === '(') {
      toks.push({ t: 'lp' });
      i++;
      continue;
    }
    if (c === ')') {
      toks.push({ t: 'rp' });
      i++;
      continue;
    }
    // A word runs to whitespace or a parenthesis, but quoted sections may contain either.
    let word = '';
    let quoted = false;
    while (i < text.length && !/[\s()]/.test(text[i]!)) {
      if (text[i] === '"') {
        const end = findQuote(text, i);
        word += text.slice(i, end + 1);
        quoted = true;
        i = end + 1;
      } else word += text[i++];
    }
    toks.push({ t: 'word', text: word, quoted });
  }
  return toks;
}

function findQuote(text: string, start: number): number {
  for (let j = start + 1; j < text.length; j++) {
    if (text[j] === '\\') j++;
    else if (text[j] === '"') return j;
  }
  throw new SplError('Unbalanced quotes.');
}

const unquote = (s: string) =>
  s.startsWith('"') && s.endsWith('"') && s.length >= 2 ? s.slice(1, -1).replace(/\\(.)/g, '$1') : s;

function classify(tok: { text: string }): SearchNode {
  const m = /^([A-Za-z_][\w.:-]*)(!=|<=|>=|==|=|<|>)(.*)$/s.exec(tok.text);
  if (m) {
    const raw = m[3]!;
    return {
      k: 'cmp',
      field: m[1]!,
      op: m[2] === '==' ? '=' : m[2]!,
      value: unquote(raw),
      quoted: raw.startsWith('"'),
    };
  }
  const isPhrase = tok.text.startsWith('"');
  return { k: 'term', text: unquote(tok.text), phrase: isPhrase };
}

export function parseSearch(text: string): SearchNode {
  const toks = lex(text);
  let i = 0;
  const peekWord = (w: string) => {
    const t = toks[i];
    return t?.t === 'word' && !t.quoted && t.text === w;
  };

  const primary = (): SearchNode => {
    const t = toks[i];
    if (!t) throw new SplError('Missing search term.', 'search');
    if (t.t === 'lp') {
      i++;
      const inner = and();
      if (toks[i]?.t !== 'rp') throw new SplError('Unbalanced parentheses.', 'search');
      i++;
      return inner;
    }
    if (t.t === 'rp') throw new SplError('Unbalanced parentheses.', 'search');
    i++;
    return classify(t);
  };
  const not = (): SearchNode => {
    if (peekWord('NOT')) {
      i++;
      return { k: 'not', item: not() };
    }
    return primary();
  };
  const or = (): SearchNode => {
    const items = [not()];
    while (peekWord('OR')) {
      i++;
      items.push(not());
    }
    return items.length === 1 ? items[0]! : { k: 'or', items };
  };
  const and = (): SearchNode => {
    const items: SearchNode[] = [];
    while (i < toks.length && toks[i]!.t !== 'rp') {
      if (peekWord('AND')) {
        i++;
        continue;
      }
      items.push(or());
    }
    if (items.length === 0) return { k: 'true' };
    return items.length === 1 ? items[0]! : { k: 'and', items };
  };

  const node = and();
  if (i < toks.length) throw new SplError('Unbalanced parentheses.', 'search');
  return node;
}

// ---------------------------------------------------------------- matching

const termCache = new Map<string, RegExp>();

/** A bare term matches whole tokens of _raw, case-insensitively; `*` is a wildcard. */
function termRegex(text: string, phrase: boolean): RegExp {
  const key = `${phrase ? 'p' : 't'}:${text}`;
  let re = termCache.get(key);
  if (!re) {
    const body = text.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^\\s]*');
    re = phrase ? new RegExp(body, 'i') : new RegExp(`(?<![A-Za-z0-9_])${body}(?![A-Za-z0-9_])`, 'i');
    if (termCache.size > 5000) termCache.clear();
    termCache.set(key, re);
  }
  return re;
}

const cmpCache = new Map<string, RegExp>();
function cmpRegex(value: string): RegExp {
  let re = cmpCache.get(value);
  if (!re) {
    re = wildcardRegex(value);
    if (cmpCache.size > 5000) cmpCache.clear();
    cmpCache.set(value, re);
  }
  return re;
}

function valuesOf(v: Value): string[] {
  if (v === null) return [];
  if (Array.isArray(v)) return v;
  return [toStr(v)];
}

function compare(field: Value, op: string, value: string): boolean {
  const vals = valuesOf(field);
  if (!vals.length) return false;
  if (op === '=') return vals.some((x) => cmpRegex(value).test(x));
  if (op === '!=') return !vals.some((x) => cmpRegex(value).test(x));
  const b = toNumber(value);
  return vals.some((x) => {
    const a = toNumber(x);
    if (a !== null && b !== null)
      return op === '<' ? a < b : op === '<=' ? a <= b : op === '>' ? a > b : a >= b;
    const sa = x.toLowerCase();
    const sb = value.toLowerCase();
    return op === '<' ? sa < sb : op === '<=' ? sa <= sb : op === '>' ? sa > sb : sa >= sb;
  });
}

export function matches(node: SearchNode, row: Row): boolean {
  switch (node.k) {
    case 'true':
      return true;
    case 'and':
      return node.items.every((n) => matches(n, row));
    case 'or':
      return node.items.some((n) => matches(n, row));
    case 'not':
      return !matches(node.item, row);
    case 'term': {
      const raw = row.get('_raw');
      if (raw === null) return false;
      return termRegex(node.text, node.phrase).test(toStr(raw));
    }
    case 'cmp': {
      if (node.field === 'earliest' || node.field === 'latest') return true;
      // Fast reject: an auto-extracted (key=value) field can only exist if "key=" appears in _raw.
      if (
        row.event &&
        node.op !== '!=' &&
        !DEFAULT_FIELDS.includes(node.field) &&
        !REGEX_FIELD_NAMES.has(node.field) &&
        !row.values.has(node.field)
      ) {
        if (!row.event.raw.includes(`${node.field}=`)) return false;
      }
      return compare(row.get(node.field), node.op, node.value);
    }
  }
}

// ---------------------------------------------------------------- pushdown

export interface Pushdown {
  /** Allowed patterns per indexed field (index, sourcetype, source, host); all must match one. */
  fields: Map<string, string[]>;
  /** Lowercase single-word tokens every matching event must contain literally. */
  tokens: string[];
  earliest?: string;
  latest?: string;
}

const INDEXED = new Set(['index', 'sourcetype', 'source', 'host']);

/**
 * What the event scan can use before generating events: indexed-field constraints, required
 * literal tokens, and time modifiers. Only top-level AND terms are safe to push down.
 */
export function pushdown(node: SearchNode): Pushdown {
  const fields = new Map<string, string[]>();
  const tokens: string[] = [];
  const out: Pushdown = { fields, tokens };
  const top = node.k === 'and' ? node.items : [node];
  const word = (s: string) => (/^[A-Za-z0-9_]+$/.test(s) ? s.toLowerCase() : null);
  for (const n of top) {
    if (n.k === 'cmp' && n.op === '=') {
      if (n.field === 'earliest') out.earliest = n.value;
      else if (n.field === 'latest') out.latest = n.value;
      else if (INDEXED.has(n.field)) fields.set(n.field, [...(fields.get(n.field) ?? []), n.value]);
      else {
        if (!REGEX_FIELD_NAMES.has(n.field)) {
          const f = word(n.field);
          if (f) tokens.push(f);
        }
        const v = word(n.value);
        if (v) tokens.push(v);
      }
    } else if (n.k === 'term' && !n.phrase) {
      const t = word(n.text);
      if (t) tokens.push(t);
    } else if (n.k === 'or' && n.items.every((x) => x.k === 'cmp' && x.op === '=' && INDEXED.has(x.field))) {
      const f = (n.items[0] as { field: string }).field;
      if (n.items.every((x) => (x as { field: string }).field === f))
        fields.set(
          `${f}|or`,
          n.items.map((x) => (x as { value: string }).value),
        );
    }
  }
  return out;
}

/** True if an indexed value satisfies the pushed-down constraints for that field. */
export function allowed(p: Pushdown, field: string, value: string): boolean {
  for (const key of [field, `${field}|or`]) {
    const pats = p.fields.get(key);
    if (!pats) continue;
    if (
      key === field
        ? !pats.every((pat) => cmpRegex(pat).test(value))
        : !pats.some((pat) => cmpRegex(pat).test(value))
    )
      return false;
  }
  return true;
}
