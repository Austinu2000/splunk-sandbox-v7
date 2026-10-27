/** SPL values: strings and numbers, null, and multivalue lists of strings. */
export type Value = string | number | null | string[];

export class SplError extends Error {
  constructor(
    message: string,
    /** The command the error belongs to, for "Error in 'x' command:" messages. */
    readonly command?: string,
  ) {
    super(message);
  }

  /** Splunk-style message text. */
  get display(): string {
    return this.command ? `Error in '${this.command}' command: ${this.message}` : this.message;
  }
}

const NUMERIC = /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/;

export function isNumeric(v: Value): boolean {
  return typeof v === 'number' ? Number.isFinite(v) : typeof v === 'string' && NUMERIC.test(v);
}

export function toNumber(v: Value): number | null {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string' && NUMERIC.test(v)) return parseFloat(v);
  if (Array.isArray(v) && v.length) return toNumber(v[0]!);
  return null;
}

export function toStr(v: Value): string {
  if (v === null) return '';
  if (Array.isArray(v)) return v.join(' ');
  if (typeof v === 'number') return formatNumber(v);
  return v;
}

export function formatNumber(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Splunk shows floats without trailing noise.
  return String(Number(n.toPrecision(12)));
}

/** First value of a multivalue field, or the value itself. */
export function scalar(v: Value): string | number | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

/** Ordering used by sort and stats: numbers before strings, numbers numerically, strings lexically. */
export function compareValues(a: Value, b: Value): number {
  const an = toNumber(a);
  const bn = toNumber(b);
  if (an !== null && bn !== null) return an - bn;
  if (an !== null) return -1;
  if (bn !== null) return 1;
  const as = toStr(a);
  const bs = toStr(b);
  return as < bs ? -1 : as > bs ? 1 : 0;
}

/** Splunk wildcard match (case-insensitive) for search-time field comparisons. */
export function wildcardRegex(pattern: string, caseInsensitive = true): RegExp {
  const src = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${src}$`, caseInsensitive ? 'is' : 's');
}
