import { tokenizeSpl } from '@sandbox/shared';
import type { PracticePrincipal } from '@sandbox/shared';
import { OperationsError } from '../engineering/access';
import { KvError } from '../kvstore/engine';
import { training } from '../training/engine';
import type { World } from '../world';
import { splitPipeline } from './args';
import { isGenerating, namesOf, parseCommand, type Command, type RunContext, type Sink } from './commands';
import { scanEvents, type ScanStats } from './data';
import { Row } from './row';
import { matches, parseSearch, pushdown } from './search';
import { autoSpanMs, parseTime } from './time';
import { SplError, isNumeric, toStr, type Value } from './values';

export interface SearchRequest {
  readOnly?: boolean;
  principal?: PracticePrincipal;
  search: string;
  /** Time modifiers; the search's own earliest=/latest= win. */
  earliest?: string;
  latest?: string;
}

export interface FieldSummary {
  name: string;
  count: number;
  distinct: number;
  numeric: boolean;
  top: { value: string; count: number }[];
}

export interface Phase {
  name: string;
  ms: number;
  rows: number;
}

export interface SearchOutcome {
  search: string;
  earliest: number;
  latest: number;
  status: 'done' | 'failed';
  kind: 'events' | 'statistics';
  /** Events (newest first) when kind is events; retained up to EVENT_RETENTION. */
  events: Row[];
  eventCount: number;
  results: Row[];
  columns: string[];
  timeline: { time: number; count: number }[];
  timelineSpan: number;
  fields: FieldSummary[];
  messages: RunContext['messages'];
  scan: ScanStats | null;
  runMs: number;
  workUnits: number;
  phases: Phase[];
}

export const LIMITS = { maxScan: 3_000_000, maxMs: 8_000 };
const EVENT_RETENTION = 100_000;

const clock = () => globalThis.performance.now();

function emptyOutcome(req: SearchRequest, now: number): SearchOutcome {
  return {
    search: req.search,
    earliest: now,
    latest: now,
    status: 'failed',
    kind: 'events',
    events: [],
    eventCount: 0,
    results: [],
    columns: [],
    timeline: [],
    timelineSpan: 0,
    fields: [],
    messages: [],
    scan: null,
    runMs: 0,
    workUnits: 0,
    phases: [],
  };
}

/** Runs an SPL search against the world, as of the world's current sim time. */
export function runSearch(world: World, req: SearchRequest, limits = LIMITS): SearchOutcome {
  const started = clock();
  const now = world.clock.now;
  const out = emptyOutcome(req, now);
  try {
    execute(world, req, limits, out);
    out.status = out.messages.some((m) => m.type === 'error') ? 'failed' : 'done';
  } catch (e) {
    if (!(e instanceof SplError) && !(e instanceof KvError) && !(e instanceof OperationsError)) throw e;
    out.status = 'failed';
    out.messages.push({ type: 'error', text: e instanceof SplError ? e.display : e.message });
  }
  out.workUnits = (out.scan?.scanned ?? 0) + out.phases.reduce((n, p) => n + p.rows, 0);
  out.runMs = Math.round(clock() - started);
  return out;
}

function execute(world: World, req: SearchRequest, limits: typeof LIMITS, out: SearchOutcome): void {
  const now = world.clock.now;
  let text = req.search.trim();
  const first = tokenizeSpl(text).find((t) => t.kind !== 'space');
  for (let depth = 0; depth <= 5; depth++) {
    let expanded = false;
    text = tokenizeSpl(text)
      .map((token) => {
        if (token.kind === 'comment') {
          if (!token.closed) throw new SplError('Unclosed SPL comment. Close it with three backticks (```).');
          return ' ';
        }
        if (token.kind !== 'macro') return token.text;
        if (!token.closed || !/^`[\w-]+`$/.test(token.text)) throw new SplError('Unsupported macro syntax.');
        if (depth === 5) throw new SplError('Unsupported or recursive macro');
        const key = token.text.slice(1, -1),
          macro = training(world).macros[key];
        if (!macro) throw new SplError('Unknown macro: ' + key);
        expanded = true;
        return macro;
      })
      .join('')
      .trim();
    if (!expanded) break;
  }
  if (first?.kind === 'comment' && text.startsWith('|'))
    throw new SplError('Place the comment after the first generating command, not before it.');
  if (!text) throw new SplError('Search is empty.');
  const parts = splitPipeline(text);
  const leadingPipe = parts[0] === '';
  const baseText = leadingPipe ? null : parts[0]!.replace(/^search\s+/i, '');
  if (baseText?.includes('['))
    throw new SplError('Subsearches are not supported in the base search; use append or join.');
  const cmds: Command[] = parts.slice(1).map(parseCommand);
  if (leadingPipe && (!cmds[0] || !isGenerating(cmds[0].name)))
    throw new SplError(
      `Error in '${cmds[0]?.name ?? 'search'}' command: This command must be the first command of a search.`,
    );
  if (!leadingPipe && cmds.some((c) => isGenerating(c.name)))
    throw new SplError(
      `Error in '${cmds.find((c) => isGenerating(c.name))!.name}' command: This command must be the first command of a search.`,
    );

  const baseNode = baseText !== null ? parseSearch(baseText) : null;
  const pd = baseNode ? pushdown(baseNode) : null;

  // Time range: picker values, overridden by earliest=/latest= in the search.
  const retention = world.config.historyRetentionMs;
  const parse = (spec: string | undefined, fallback: number) => {
    if (spec === undefined) return fallback;
    const t = parseTime(spec, now);
    if (t === null) throw new SplError(`Invalid time modifier '${spec}'.`);
    return t;
  };
  let earliest = parse(pd?.earliest ?? req.earliest, now - 15 * 60_000);
  let latest = parse(pd?.latest ?? req.latest, now);
  if (earliest === 0)
    earliest = Math.min(now - retention, ...(world.ingestion?.events.map((event) => event.time - 1) ?? []));
  if (earliest < now - retention)
    out.messages.push({
      type: 'info',
      text: 'Generated fleet history covers the last 24 hours. Persisted recorded data follows its index retention and can be queried over this longer range.',
    });
  // Future events exist only when timestamps were extracted wrongly; allow looking 2 days ahead (MAX_DAYS_HENCE).
  latest = Math.min(latest, now + 2 * 86_400_000);
  if (earliest >= latest) throw new SplError('The earliest time is after the latest time.');
  out.earliest = earliest;
  out.latest = latest;

  const ctx: RunContext = {
    world,
    now,
    earliest,
    latest,
    messages: out.messages,
    principal: req.principal,
    readOnly: req.readOnly,
    search: text,
    effects: [],
  };
  out.kind = cmds.some((c) => c.transforming) || leadingPipe ? 'statistics' : 'events';
  const span = Math.max(1000, Math.floor(autoSpanMs(latest - earliest)));
  out.timelineSpan = span;

  let rows: Row[];
  let i = 0;
  const phaseStart = clock();
  if (leadingPipe) {
    rows = cmds[0]!.generate!(ctx);
    out.phases.push({ name: cmds[0]!.name, ms: Math.round(clock() - phaseStart), rows: rows.length });
    i = 1;
  } else {
    // Streaming commands run while scanning; the next sink (stats, timechart, top...) consumes the stream.
    const chain: Command[] = [];
    while (i < cmds.length && cmds[i]!.stream) chain.push(cmds[i++]!);
    const next = cmds[i];
    const sink: Sink | null = next?.sink ? next.sink(ctx) : null;
    if (sink) i++;
    const buckets = new Map<number, number>();
    const retained: Row[] = [];
    let count = 0;
    const isStar = baseNode!.k === 'term' && baseNode!.text === '*';
    out.scan = scanEvents(
      ctx,
      pd!,
      (row) => isStar || matches(baseNode!, row),
      (row) => {
        let r: Row | null = row;
        for (const c of chain) {
          r = c.stream!(r, ctx);
          if (!r) return;
        }
        count++;
        const t = r.time;
        if (t !== null) {
          const b = Math.floor((t * 1000) / span) * span;
          buckets.set(b, (buckets.get(b) ?? 0) + 1);
        }
        if (sink) sink.push(r);
        else if (retained.length < EVENT_RETENTION) retained.push(r);
      },
      limits,
      clock,
    );
    out.eventCount = count;
    out.phases.push({
      name: chain.length ? `search | ${chain.map((c) => c.name).join(' | ')}` : 'search',
      ms: Math.round(clock() - phaseStart),
      rows: count,
    });
    if (out.scan.truncated)
      out.messages.push({
        type: 'warn',
        text: `Search results may be incomplete: the sandbox stopped after ${out.scan.truncated === 'scan' ? `scanning ${out.scan.scanned.toLocaleString('en-US')} events` : `${limits.maxMs / 1000} seconds`}. Narrow the time range or add host=, sourcetype= or source= terms.`,
      });
    if (!sink && count > EVENT_RETENTION)
      out.messages.push({
        type: 'info',
        text: `Only the first ${EVENT_RETENTION.toLocaleString('en-US')} events are kept for display and further commands.`,
      });
    const start = Math.floor(earliest / span) * span;
    for (let b = start; b < latest; b += span) out.timeline.push({ time: b, count: buckets.get(b) ?? 0 });
    if (sink) {
      const t = clock();
      rows = sink.finish();
      out.phases.push({ name: next!.name, ms: Math.round(clock() - t), rows: rows.length });
    } else {
      // Newest first; events with the same timestamp keep reverse write order, as Splunk shows them.
      rows = retained.reverse().sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
    }
  }

  for (; i < cmds.length; i++) {
    const t = clock();
    rows = cmds[i]!.run(rows, ctx);
    out.phases.push({ name: cmds[i]!.name, ms: Math.round(clock() - t), rows: rows.length });
  }

  if (out.kind === 'events') {
    out.events = rows;
    out.fields = summarizeFields(rows.slice(0, 2000));
  } else {
    out.results = rows;
    // Internal fields stay hidden on event rows, but a command that built new rows (table, stats)
    // chose its fields explicitly, so keep them.
    out.columns = namesOf(rows, 500).filter((c) => !c.startsWith('_') || c === '_time' || !rows[0]?.event);
  }
  if (ctx.effects?.length) {
    if (out.scan?.truncated || out.messages.some((m) => m.type === 'error'))
      throw new SplError('Write refused because the source search was incomplete');
    if (ctx.effects.length > 1) throw new SplError('Only one summary write is supported per search');
    ctx.effects.forEach((effect) => effect());
  }
}

function summarizeFields(rows: Row[]): FieldSummary[] {
  const acc = new Map<string, { count: number; values: Map<string, number>; numeric: number }>();
  for (const r of rows)
    for (const name of r.names()) {
      if (name === '_raw' || name === '_time' || name === 'linecount') continue;
      const v = r.get(name);
      if (v === null) continue;
      let a = acc.get(name);
      if (!a) acc.set(name, (a = { count: 0, values: new Map(), numeric: 0 }));
      a.count++;
      for (const x of Array.isArray(v) ? v : [v]) {
        const s = toStr(x);
        a.values.set(s, (a.values.get(s) ?? 0) + 1);
        if (isNumeric(x as Value)) a.numeric++;
      }
    }
  return [...acc.entries()]
    .map(([name, a]) => ({
      name,
      count: a.count,
      distinct: a.values.size,
      numeric: a.numeric >= a.count * 0.8,
      top: [...a.values.entries()]
        .sort((x, y) => y[1] - x[1] || (x[0] < y[0] ? -1 : 1))
        .slice(0, 10)
        .map(([value, count]) => ({ value, count })),
    }))
    .sort((x, y) => (x.name < y.name ? -1 : 1));
}

// ---------------------------------------------------------------- serialisation helpers

export type PlainValue = string | number | null | string[];

export function rowToPlain(row: Row, columns?: string[]): Record<string, PlainValue> {
  const names = columns ?? row.names();
  const out: Record<string, PlainValue> = {};
  for (const n of names) out[n] = row.get(n);
  return out;
}

export interface EventPlain {
  time: number;
  raw: string;
  host: string;
  source: string;
  sourcetype: string;
  index: string;
  fields: Record<string, PlainValue>;
}

export function eventToPlain(row: Row): EventPlain {
  const fields: Record<string, PlainValue> = {};
  for (const n of row.names()) if (n !== '_raw' && n !== '_time') fields[n] = row.get(n);
  return {
    time: row.time ?? 0,
    raw: toStr(row.get('_raw')),
    host: toStr(row.get('host')),
    source: toStr(row.get('source')),
    sourcetype: toStr(row.get('sourcetype')),
    index: toStr(row.get('index')),
    fields,
  };
}
