import { extractFields } from './fields';
import type { Value } from './values';

/** An indexed event, before search-time field extraction. */
export interface SplEvent {
  /** Epoch ms: the extracted timestamp. */
  time: number;
  /** Epoch ms the event was indexed (defaults to time). */
  indexTime?: number;
  raw: string;
  host: string;
  source: string;
  sourcetype: string;
  index: string;
  /** Computed lazily: most searches never read it. */
  splunk_server: string | (() => string);
}

export const DEFAULT_FIELDS = [
  '_time',
  '_raw',
  'host',
  'source',
  'sourcetype',
  'index',
  'splunk_server',
  'linecount',
];

/**
 * A search result row. Rows that come from events extract fields lazily on first access, so a
 * `stats count by host` over a million events never runs the extractors.
 */
export class Row {
  readonly values = new Map<string, Value>();
  private extracted = false;

  constructor(readonly event?: SplEvent) {}

  static of(obj: Record<string, Value>): Row {
    const r = new Row();
    for (const [k, v] of Object.entries(obj)) r.values.set(k, v);
    return r;
  }

  private base(f: string): Value | undefined {
    const e = this.event!;
    switch (f) {
      case '_time':
        return e.time / 1000;
      case '_raw':
        return e.raw;
      case '_indextime':
        return Math.floor((e.indexTime ?? e.time) / 1000);
      case 'host':
        return e.host;
      case 'source':
        return e.source;
      case 'sourcetype':
        return e.sourcetype;
      case 'index':
        return e.index;
      case 'splunk_server':
        return typeof e.splunk_server === 'function' ? e.splunk_server() : e.splunk_server;
      case 'linecount':
        return e.raw.split('\n').length;
    }
    return undefined;
  }

  private extract(): void {
    if (this.extracted || !this.event) return;
    this.extracted = true;
    for (const [k, v] of extractFields(this.event)) if (!this.values.has(k)) this.values.set(k, v);
  }

  get(f: string): Value {
    if (this.values.has(f)) return this.values.get(f)!;
    if (!this.event) return null;
    const b = this.base(f);
    if (b !== undefined) return b;
    this.extract();
    return this.values.get(f) ?? null;
  }

  has(f: string): boolean {
    return this.get(f) !== null;
  }

  set(f: string, v: Value): void {
    this.values.set(f, v);
  }

  delete(f: string): void {
    // Shadow event fields with null so they read as absent.
    this.values.set(f, null);
  }

  /** Field names present on the row, defaults first. */
  names(): string[] {
    this.extract();
    const names: string[] = [];
    if (this.event)
      for (const f of DEFAULT_FIELDS) if (!this.values.has(f) || this.values.get(f) !== null) names.push(f);
    for (const [k, v] of this.values) if (v !== null && !names.includes(k)) names.push(k);
    return names;
  }

  /** A plain copy of every field (used when a command reshapes rows). */
  toObject(): Record<string, Value> {
    const out: Record<string, Value> = {};
    for (const n of this.names()) out[n] = this.get(n);
    return out;
  }

  get time(): number | null {
    const t = this.get('_time');
    return typeof t === 'number' ? t : t === null ? null : Number(t);
  }
}
