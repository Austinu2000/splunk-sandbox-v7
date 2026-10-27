import {
  HEALTH_STATES,
  type DeploymentClientStatus,
  type FleetFilter,
  type FleetSummary,
  type ForwarderRecord,
  type GroupSummary,
  type HealthCounts,
  type HealthState,
  type HostPage,
  type HostSortKey,
} from '@sandbox/shared';
import type { World } from '../world';
import { NO_CLASS, rowOutputs } from '../derive/state';
import { isPhoneHomeFrozen, lastPhoneHome, queueFillPct, throughputKBps } from './health';
import { HEALTH_CODE, WRONG_CLASS } from './tables';

export class FilterError extends Error {}

export function hostname(world: World, row: number): string {
  const f = world.fleet;
  const site = world.config.sites[f.site[row]!]!.id;
  const cls = world.config.serverClasses[f.serverClass[row]!]!.short;
  return `${site}-${cls}-${String(f.hostNum[row]).padStart(4, '0')}`;
}

export function ipAddress(world: World, row: number): string {
  const subnet = world.config.sites[world.fleet.site[row]!]!.subnet;
  // Rows are spread across 10.<site>.64.0 - 10.<site>.255.255, clear of the infra range.
  const n = row + 64 * 256;
  return `10.${subnet}.${(n >> 8) & 255}.${n & 255}`;
}

/** The forwarder's running output group (from its deployed or local outputs.conf). */
export function outputGroup(world: World, row: number): string {
  return rowOutputs(world, row).groups[0] ?? '(none)';
}

function deploymentClientStatus(health: number): DeploymentClientStatus {
  if (isPhoneHomeFrozen(health)) return 'not_phoning_home';
  if (health === WRONG_CLASS) return 'mismatched';
  return 'connected';
}

export function forwarderRecord(world: World, row: number): ForwarderRecord {
  const f = world.fleet;
  const cfg = world.config;
  const now = world.clock.now;
  const cls = cfg.serverClasses[f.serverClass[row]!]!;
  return {
    hostname: hostname(world, row),
    ip: ipAddress(world, row),
    os: cls.os,
    site: cfg.sites[f.site[row]!]!.id,
    serverClass: cls.id,
    assignedServerClass:
      f.assignedClass[row] === NO_CLASS ? '(none)' : cfg.serverClasses[f.assignedClass[row]!]!.id,
    version: world.versions[f.version[row]!]!,
    outputGroup: outputGroup(world, row),
    health: HEALTH_STATES[f.health[row]!]!,
    healthSince: f.healthSince[row]!,
    deploymentClientStatus: deploymentClientStatus(f.health[row]!),
    lastPhoneHome: lastPhoneHome(world, row, now),
    queueFillPct: queueFillPct(world, row, now),
    throughputKBps: throughputKBps(world, row, now),
  };
}

interface CompiledFilter {
  site: number;
  cls: number;
  health: number;
  /** Per-class flag for the OS filter, or null for any OS. */
  osClasses: boolean[] | null;
  q: string;
}

function compileFilter(world: World, filter: FleetFilter): CompiledFilter {
  const { sites, serverClasses } = world.config;
  const lookup = (kind: string, value: string | undefined, ids: string[]): number => {
    if (value === undefined || value === '') return -1;
    const i = ids.indexOf(value);
    if (i < 0) throw new FilterError(`Unknown ${kind} "${value}"`);
    return i;
  };
  if (filter.os !== undefined && filter.os !== 'windows' && filter.os !== 'linux')
    throw new FilterError(`Unknown os "${filter.os}"`);
  return {
    site: lookup(
      'site',
      filter.site,
      sites.map((s) => s.id),
    ),
    cls: lookup(
      'server class',
      filter.serverClass,
      serverClasses.map((c) => c.id),
    ),
    health: lookup('health state', filter.health, [...HEALTH_STATES]),
    osClasses: filter.os ? serverClasses.map((c) => c.os === filter.os) : null,
    q: (filter.q ?? '').trim().toLowerCase(),
  };
}

function isEmpty(c: CompiledFilter): boolean {
  return c.site < 0 && c.cls < 0 && c.health < 0 && !c.osClasses && !c.q;
}

/** Row indices matching the filter, in row order. */
export function matchRows(world: World, filter: FleetFilter): number[] {
  const c = compileFilter(world, filter);
  const f = world.fleet;
  const out: number[] = [];
  for (let row = 0; row < f.size; row++) {
    if (c.site >= 0 && f.site[row] !== c.site) continue;
    if (c.cls >= 0 && f.serverClass[row] !== c.cls) continue;
    if (c.health >= 0 && f.health[row] !== c.health) continue;
    if (c.osClasses && !c.osClasses[f.serverClass[row]!]) continue;
    if (c.q && !hostname(world, row).includes(c.q)) continue;
    out.push(row);
  }
  return out;
}

function emptyCounts(): HealthCounts {
  return Object.fromEntries(HEALTH_STATES.map((s) => [s, 0])) as HealthCounts;
}

/**
 * Health counts overall, by site and by server class.
 * With no filter this reads the incremental aggregates; with a filter it scans.
 * Tests assert both paths always agree.
 */
export function summarizeFleet(
  world: World,
  filter: FleetFilter = {},
  opts: { forceScan?: boolean } = {},
): FleetSummary {
  const cfg = world.config;
  const byHealth = emptyCounts();
  const bySite: GroupSummary[] = cfg.sites.map((s) => ({
    id: s.id,
    name: s.name,
    total: 0,
    byHealth: emptyCounts(),
  }));
  const byServerClass: GroupSummary[] = cfg.serverClasses.map((c) => ({
    id: c.id,
    name: c.id,
    total: 0,
    byHealth: emptyCounts(),
  }));
  let total = 0;
  const count = (site: number, cls: number, health: number, n: number) => {
    if (n === 0) return;
    const state = HEALTH_STATES[health]!;
    total += n;
    byHealth[state] += n;
    bySite[site]!.total += n;
    bySite[site]!.byHealth[state] += n;
    byServerClass[cls]!.total += n;
    byServerClass[cls]!.byHealth[state] += n;
  };

  const compiled = compileFilter(world, filter);
  if (isEmpty(compiled) && !opts.forceScan) {
    for (let s = 0; s < cfg.sites.length; s++)
      for (let c = 0; c < cfg.serverClasses.length; c++)
        for (let h = 0; h < HEALTH_STATES.length; h++) count(s, c, h, world.aggregates.get(s, c, h));
  } else {
    const f = world.fleet;
    for (const row of matchRows(world, filter)) count(f.site[row]!, f.serverClass[row]!, f.health[row]!, 1);
  }
  return { at: world.clock.now, total, byHealth, bySite, byServerClass };
}

export function listHosts(
  world: World,
  filter: FleetFilter,
  opts: { offset?: number; limit?: number; sort?: HostSortKey; dir?: 'asc' | 'desc' } = {},
): HostPage {
  const offset = Math.max(0, opts.offset ?? 0);
  const limit = Math.min(500, Math.max(1, opts.limit ?? 100));
  const rows = matchRows(world, filter);
  const sort = opts.sort ?? 'hostname';
  const sign = opts.dir === 'desc' ? -1 : 1;

  let sorted: number[];
  if (sort === 'lastPhoneHome') {
    const now = world.clock.now;
    const key = new Map(rows.map((r) => [r, lastPhoneHome(world, r, now)]));
    sorted = rows.sort((a, b) => sign * (key.get(a)! - key.get(b)!) || a - b);
  } else {
    const name = new Map(rows.map((r) => [r, hostname(world, r)]));
    const byName = (a: number, b: number) =>
      name.get(a)! < name.get(b)! ? -1 : name.get(a)! > name.get(b)! ? 1 : 0;
    const f = world.fleet;
    const primary =
      sort === 'health'
        ? (a: number, b: number) => f.health[a]! - f.health[b]!
        : sort === 'site'
          ? (a: number, b: number) => f.site[a]! - f.site[b]!
          : () => 0;
    sorted = rows.sort((a, b) => sign * (primary(a, b) || byName(a, b)));
  }

  return {
    total: rows.length,
    offset,
    limit,
    rows: sorted.slice(offset, offset + limit).map((r) => forwarderRecord(world, r)),
  };
}

export function healthCode(state: HealthState): number {
  return HEALTH_CODE[state];
}
