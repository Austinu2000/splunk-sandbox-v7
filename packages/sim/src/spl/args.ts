import { SplError } from './values';

/** Token for command arguments: words (quotes kept), and the punctuation , ( ) = */
export type ArgTok = { t: 'word'; v: string; quoted: boolean } | { t: 'punct'; v: ',' | '(' | ')' | '=' };

export function tokenizeArgs(text: string, command: string): ArgTok[] {
  const out: ArgTok[] = [];
  let i = 0;
  while (i < text.length) {
    const c = text[i]!;
    if (/\s/.test(c)) {
      i++;
    } else if (c === ',' || c === '(' || c === ')' || c === '=') {
      out.push({ t: 'punct', v: c });
      i++;
    } else if (c === '"') {
      let s = '';
      let j = i + 1;
      for (; j < text.length && text[j] !== '"'; j++) {
        if (text[j] === '\\' && j + 1 < text.length) {
          // Keep regex escapes intact; only unescape \" and \\.
          const n = text[j + 1]!;
          s += n === '"' || n === '\\' ? n : '\\' + n;
          j++;
        } else s += text[j];
      }
      if (j >= text.length) throw new SplError('Unbalanced quotes.', command);
      out.push({ t: 'word', v: s, quoted: true });
      i = j + 1;
    } else {
      let s = '';
      while (i < text.length && !/[\s,()=]/.test(text[i]!) && text[i] !== '"') s += text[i++];
      out.push({ t: 'word', v: s, quoted: false });
    }
  }
  return out;
}

/** Splits text at top-level commas (outside quotes and parentheses). */
export function splitTopLevel(text: string, sep = ','): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let cur = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (quote) {
      if (c === '\\') {
        cur += c + (text[++i] ?? '');
        continue;
      }
      if (c === quote) quote = null;
      cur += c;
    } else if (c === '"' || c === "'") {
      quote = c;
      cur += c;
    } else if (c === '(') {
      depth++;
      cur += c;
    } else if (c === ')') {
      depth--;
      cur += c;
    } else if (c === sep && depth === 0) {
      parts.push(cur);
      cur = '';
    } else cur += c;
  }
  if (cur.trim()) parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Splits a full search into commands at `|` outside quotes and brackets.
 * Returns the raw command texts; an initial empty command means the search began with `|`.
 */
export function splitPipeline(search: string): string[] {
  const parts: string[] = [];
  let quote = false;
  let depth = 0;
  let cur = '';
  for (let i = 0; i < search.length; i++) {
    const c = search[i]!;
    if (quote) {
      if (c === '\\') {
        cur += c + (search[++i] ?? '');
        continue;
      }
      if (c === '"') quote = false;
      cur += c;
    } else if (c === '"') {
      quote = true;
      cur += c;
    } else if (c === '[') {
      depth++; cur += c;
    } else if (c === ']') {
      depth--; cur += c;
      if (depth < 0) throw new SplError('Unbalanced subsearch brackets.');
    } else if (c === '(') {
      depth++;
      cur += c;
    } else if (c === ')') {
      depth--;
      cur += c;
    } else if (c === '|' && depth <= 0) {
      parts.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  if (quote) throw new SplError('Unbalanced quotes.');
  parts.push(cur.trim());
  return parts;
}

/** Pulls `key=value` options off the front/anywhere in a token list (for options like limit=5). */
export function takeOptions(toks: ArgTok[], names: string[]): { opts: Map<string, string>; rest: ArgTok[] } {
  const opts = new Map<string, string>();
  const rest: ArgTok[] = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]!;
    const eq = toks[i + 1];
    const v = toks[i + 2];
    if (
      t.t === 'word' &&
      !t.quoted &&
      names.includes(t.v.toLowerCase()) &&
      eq?.t === 'punct' &&
      eq.v === '=' &&
      v?.t === 'word'
    ) {
      opts.set(t.v.toLowerCase(), v.v);
      i += 2;
    } else rest.push(t);
  }
  return { opts, rest };
}

export const words = (toks: ArgTok[]) =>
  toks.filter((t): t is Extract<ArgTok, { t: 'word' }> => t.t === 'word').map((t) => t.v);

export function intOpt(opts: Map<string, string>, name: string, command: string, fallback: number): number {
  const v = opts.get(name);
  if (v === undefined) return fallback;
  if (!/^\d+$/.test(v)) throw new SplError(`Invalid value for '${name}': '${v}'.`, command);
  return Number(v);
}

export function boolOpt(opts: Map<string, string>, name: string, fallback: boolean): boolean {
  const v = opts.get(name)?.toLowerCase();
  if (v === undefined) return fallback;
  return ['t', 'true', '1', 'yes'].includes(v);
}
