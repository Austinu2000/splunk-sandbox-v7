import { operationMetrics } from '../operations';
import { runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
import { infraName } from '../infra';
import {
  extractTime,
  MAX_SHIFT_MS,
  mergesWithPrevious as mergeRule,
  nullQueued,
  parseConfig,
} from '../ingest/parsing';
import { hostname as fleetHostname } from '../fleet/query';
import { BLOCKED, OFFLINE } from '../fleet/tables';
import { profileRelayInputs, forwarderInputs } from '../hosts/inputs';
import { resolveHost, type HostProfile } from '../hosts/profile';
import {
  notableLog,
  hostTimeline,
  metricsLog,
  receivingIndexer,
  licenseUsageLog,
  schedulerLog,
  smallLog,
  splunkdLog,
  statesIn,
  type LogSource,
  type Timeline,
} from '../logs/sources';
import type { World } from '../world';
import type { RunContext } from './commands';
import { Row, type SplEvent } from './row';
import { allowed, type Pushdown } from './search';

/**
 * The indexed-event view of the world. Events are generated on demand from the same log sources the
 * terminal reads, then filtered by what actually reached an indexer: nothing while a forwarder is
 * offline, and nothing from a blocked forwarder until it unblocks (then the backlog arrives).
 */

export const INDEXES = ['_internal', '_audit', 'os', 'app', 'network', 'main'] as const;

export interface ScanSource {
  index: string;
  sourcetype: string;
  source: string;
  log: LogSource;
  /** host override (syslog relays set host from the file path, like host_segment). */
  host?: string;
}

const isInternal = (idx: string) => idx.startsWith('_');

/** Indexes a search reads: explicit index= patterns, else the default (non-internal) indexes. */
export function indexAllowed(pd: Pushdown, idx: string): boolean {
  const pats = [...(pd.fields.get('index') ?? []), ...(pd.fields.get('index|or') ?? [])];
  if (!pats.length) return !isInternal(idx);
  // `index=*` means every non-internal index, as in Splunk; internal indexes need an explicit `_` pattern.
  if (isInternal(idx) && !pats.some((p) => p.startsWith('_'))) return false;
  return allowed(pd, 'index', idx);
}

export function hostSources(world: World, p: HostProfile, wantData: boolean): ScanSource[] {
  const out: ScanSource[] = [];
  if (p.splunk) {
    const win = p.splunk.home.includes('\\');
    const logDir = win ? `${p.splunk.home}\\var\\log\\splunk\\` : `${p.splunk.home}/var/log/splunk/`;
    out.push(
      {
        index: '_internal',
        sourcetype: 'splunkd',
        source: `${logDir}splunkd.log`,
        log: splunkdLog(world, p),
      },
      {
        index: '_internal',
        sourcetype: 'splunkd',
        source: `${logDir}metrics.log`,
        log: metricsLog(world, p),
      },
      {
        index: '_internal',
        sourcetype: 'splunkd',
        source: `${logDir}health.log`,
        log: smallLog(world, p, 'health'),
      },
      ...(p.role === 'search_head'
        ? [
            {
              index: '_internal',
              sourcetype: 'scheduler',
              source: `${logDir}scheduler.log`,
              log: schedulerLog(world, p),
            },
          ]
        : []),
      ...(p.role === 'license_manager'
        ? [
            {
              index: '_internal',
              sourcetype: 'splunkd',
              source: `${logDir}license_usage.log`,
              log: licenseUsageLog(world, p),
            },
          ]
        : []),
      {
        index: '_audit',
        sourcetype: 'audittrail',
        source: `${logDir}audit.log`,
        log: smallLog(world, p, 'audit'),
      },
    );
  }
  if (wantData && world.config.profile && p.hostname === 'es01')
    out.push({
      index: 'notable',
      sourcetype: 'stash',
      source: '/opt/splunk/var/log/splunk/notable.log',
      log: notableLog(world, p),
    });
  if (wantData && p.role === 'heavy_forwarder') out.push(...profileRelayInputs(world, p));
  if (!wantData || p.fleetRow === undefined) return out;

  // Business data: whatever this forwarder's effective inputs collect (see hosts/inputs.ts).
  for (const c of forwarderInputs(world, p).collected)
    out.push({ index: c.index, sourcetype: c.sourcetype, source: c.source, log: c.log, host: c.host });
  return out;
}

const fleetNames = new WeakMap<World, string[]>();

function allHostnames(world: World): string[] {
  let names = fleetNames.get(world);
  if (!names) {
    names = [];
    for (let r = 0; r < world.fleet.size; r++) names.push(fleetHostname(world, r));
    fleetNames.set(world, names);
  }
  return [...world.infra.map((n) => n.hostname), ...names];
}

/** Host profiles a search could touch, filtered by any host= constraint before profiles are built. */
export function candidateHosts(world: World, pd: Pushdown): HostProfile[] {
  const hostPats = pd.fields.has('host') || pd.fields.has('host|or');
  const out: HostProfile[] = [];
  for (const name of allHostnames(world)) {
    // Syslog relays stay candidates: their events carry the device's name as host (host_segment).
    if (hostPats && !allowed(pd, 'host', name) && !name.includes('-syslog-')) continue;
    const p = resolveHost(world, name);
    if (p) out.push(p);
  }
  return out;
}

/** Was the event at time t delivered to an indexer by now? */
export function delivered(tl: Timeline, t: number): boolean {
  const s = tl.stateAt(t);
  if (s === OFFLINE) return false;
  if (s !== BLOCKED) return true;
  return tl.transitions.some((tr) => tr.from === BLOCKED && tr.time > t);
}

/** Which indexer stored a host's event at time t (built once per host per scan). */
function indexerFor(world: World, p: HostProfile): (t: number) => string {
  if (p.role === 'indexer') return () => p.hostname;
  const site =
    world.infra.find((n) => n.role === 'indexer' && !n.retired && n.site === p.site)?.hostname ??
    infraName(world, 'indexer');
  let fwd: ((t: number) => string | null) | null = null;
  return (t) => {
    if (p.fleetRow === undefined) return site;
    fwd ??= receivingIndexer(world, p);
    return fwd(t)?.replace(/\..*$/, '') ?? site;
  };
}

export interface ScanLimits {
  maxScan: number;
  maxMs: number;
}

export interface ScanStats {
  scanned: number;
  hosts: number;
  sources: number;
  truncated: false | 'scan' | 'time';
}

/**
 * Generates and filters events for (earliest, latest]. Calls onRow for each event passing `filter`;
 * returning false from onRow stops the scan.
 */
export function scanEvents(
  ctx: RunContext,
  pd: Pushdown,
  filter: (row: Row) => boolean,
  onRow: (row: Row) => boolean | void,
  limits: ScanLimits,
  clock: () => number,
): ScanStats {
  const { world, earliest, latest } = ctx;
  const stats: ScanStats = { scanned: 0, hosts: 0, sources: 0, truncated: false };
  const started = clock();
  const wantData = (world.config.profile ? world.config.profile.indexes.map((i) => i.name) : INDEXES).some(
    (i) => !i.startsWith('_') && indexAllowed(pd, i),
  );
  const tokens = pd.tokens;
  const es = world.config.profile?.infra.esSearchHead ? resolveHost(world, 'es01') : null;
  const malwareMapped = es && operationMetrics(world, es).malwareMapped;
  const cutoffs = new Map<string, number>();
  const cutoff = (index: string, server: string) => {
    if (!world.config.profile || index.startsWith('_')) return -Infinity;
    const key = `${index}|${server}`;
    if (cutoffs.has(key)) return cutoffs.get(key)!;
    const p = resolveHost(world, server)!;
    const conf = runningConf(world, p, 'indexes');
    const days = Number(setting(conf, index, 'frozenTimePeriodInSecs') ?? 31536000) / 86400;
    const size =
      Number(
        setting(conf, index, 'maxTotalDataSizeMB') ??
          setting(conf, 'default', 'maxTotalDataSizeMB') ??
          1000000000,
      ) *
      1024 ** 2;
    const share = world.config.profile.dataSources
      .filter((d) => d.index === index)
      .reduce((n, d) => n + d.shareOfIngest, 0);
    const perPeer =
      (world.config.profile.scale.targetDailyIngestTB! * 1e12 * share) /
      world.config.profile.infra.indexerCluster.indexers;
    const from = world.clock.now - Math.min(days, perPeer ? size / perPeer : days) * 86400000;
    cutoffs.set(key, from);
    return from;
  };

  for (const p of candidateHosts(world, pd)) {
    const sources = hostSources(world, p, wantData).filter(
      (s) =>
        indexAllowed(pd, s.index) &&
        allowed(pd, 'sourcetype', s.sourcetype) &&
        allowed(pd, 'source', s.source) &&
        allowed(pd, 'host', s.host ?? p.hostname),
    );
    if (!sources.length) continue;
    const tl = hostTimeline(world, p, earliest);
    const states = statesIn(tl, earliest, latest);
    const serverAt = indexerFor(world, p);
    let touched = false;
    for (const s of sources) {
      // Gate pushdown: skip sources that cannot contain a required word given this host's states.
      if (
        s.log.gate &&
        tokens.some((tok) => {
          const mask = s.log.gate!(tok);
          return mask !== null && (mask & states) === 0;
        })
      )
        continue;
      touched = true;
      stats.sources++;
      // Forwarder file data is parsed on the receiving indexer; everything else arrives as written.
      const parse =
        (p.fleetRow !== undefined || (world.config.profile && p.role === 'heavy_forwarder')) &&
        s.source.startsWith('/') &&
        parsingActive(world);
      let entries: [eventTime: number, raw: string, indexTime: number][];
      if (!parse)
        entries = s.log.entries(earliest, Math.min(latest, world.clock.now)).map(([t, raw]) => [t, raw, t]);
      else {
        const shift = shiftPossible(world, s.sourcetype) ? MAX_SHIFT_MS : 0;
        entries = parsedEntries(
          world,
          s,
          s.log.entries(
            Math.floor((earliest - shift) / 120_000) * 120_000 - 1,
            Math.min(world.clock.now, Math.ceil((latest + shift) / 120_000) * 120_000),
          ),
          p.role === 'heavy_forwarder' ? () => p.hostname : serverAt,
        ).filter(([et]) => et > earliest && et <= latest);
      }
      stats.scanned += entries.length;
      for (const [et, raw, t] of entries) {
        if (p.fleetRow !== undefined && !delivered(tl, t)) continue;
        if (t < cutoff(s.index, serverAt(t))) continue;
        const ev: SplEvent = {
          time: et,
          indexTime: t,
          raw,
          host: s.host ?? p.hostname,
          source: s.source,
          sourcetype: s.sourcetype,
          index: s.index,
          splunk_server: () => serverAt(t),
        };
        const row = new Row(ev);
        if (malwareMapped && s.sourcetype.startsWith('symantec:ep:')) {
          row.set('tag', 'malware');
          row.set('eventtype', 'symantec_malware');
          row.set('datamodel', 'Malware');
        }
        if (filter(row) && onRow(row) === false) return stats;
      }
      if (stats.scanned > limits.maxScan) {
        stats.truncated = 'scan';
        return stats;
      }
      if (clock() - started > limits.maxMs) {
        stats.truncated = 'time';
        return stats;
      }
    }
    if (touched) stats.hosts++;
  }
  return stats;
}

/** Some receiver has restarted with its own config, so parsing may differ from how logs were written. */
function parsingActive(world: World): boolean {
  for (const host of world.hosts.revisions.keys()) {
    const p = resolveHost(world, host);
    if (p?.role === 'indexer' || p?.role === 'heavy_forwarder') return true;
  }
  return false;
}

/** Could any receiver's TZ setting (now or in a past revision) shift this sourcetype's timestamps? */
function shiftPossible(world: World, st: string): boolean {
  for (const [host, revisions] of world.hosts.revisions) {
    const p = resolveHost(world, host);
    if (!p?.splunk || (p.role !== 'indexer' && p.role !== 'heavy_forwarder')) continue;
    for (const r of revisions)
      if (parseConfig(world, p, st, Number.isFinite(r.time) ? r.time : 0).tzOffset !== null) return true;
  }
  return false;
}

/**
 * Whether the parsing tier (the receiving indexer's running props.conf at time t) would glue this
 * event onto the previous one: line merging on, and the LINE_BREAKER doesn't match before it.
 */
export function mergesWithPrevious(
  world: World,
  receiver: HostProfile | null,
  sourcetype: string,
  t: number,
  raw: string,
): boolean {
  return !!receiver?.splunk && mergeRule(parseConfig(world, receiver, sourcetype, t), raw);
}

/**
 * Index-time parsing on the receiver: nullQueue drops, timestamp extraction and line merging.
 * Merging uses fixed two-minute windows so changing the search range does not change boundaries.
 * Returns [eventTime, raw, indexTime].
 */
function parsedEntries(
  world: World,
  s: ScanSource,
  entries: [number, string][],
  serverAt: (t: number) => string,
): [number, string, number][] {
  const out: [number, string, number][] = [];
  const groups = new Map<string, number>();
  for (const [t, raw] of entries) {
    const receiverName = serverAt(t);
    const receiver = resolveHost(world, receiverName);
    if (!receiver?.splunk) {
      out.push([t, raw, t]);
      continue;
    }
    const cfg = parseConfig(world, receiver, s.sourcetype, t);
    if (nullQueued(cfg, raw)) continue;
    const merge = mergeRule(cfg, raw);
    const key = `${receiverName}:${Math.floor(t / 120_000)}`;
    const existing = groups.get(key);
    if (merge && existing !== undefined) out[existing]![1] += '\n' + raw;
    else {
      if (merge) groups.set(key, out.length);
      out.push([extractTime(cfg, raw) ?? t, raw, t]);
    }
  }
  return out;
}
