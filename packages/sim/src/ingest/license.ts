import { streamState } from '../operations';
import { profileInputRate } from './profileRates';
import { splunkdRunning } from '../hosts/profile';
import { profileRelayInputs } from '../hosts/inputs';
import { journal } from '../journal';
import { rowOutputs, targetStatus } from '../derive/state';
import { hostname as fleetHostname } from '../fleet/query';
import { BLOCKED, OFFLINE } from '../fleet/tables';
import { EXTRA_KBPS, forwarderInputs, type CollectedInput } from '../hosts/inputs';
import { resolveHost, type HostProfile } from '../hosts/profile';
import { runtimeHooks } from '../hosts/runtime-hooks';
import type { World } from '../world';
import { nullQueued, parseConfig } from './parsing';

/**
 * License usage: bytes indexed per (index, sourcetype). It follows what forwarders actually
 * collect and deliver (hosts/inputs.ts) and what receivers drop to nullQueue, using each class's
 * mean throughput. A snapshot is taken every simulated minute so history (license_usage.log, the
 * Monitoring Console) stays fixed after later changes.
 */

export interface LicenseSnapshot {
  /** Minute start, epoch ms. */
  from: number;
  /** "index|sourcetype" → bytes per second. */
  rates: Map<string, number>;
}

/** Daily quota scales with fleet size: 80,000 GB/day for the default 35,000 forwarders. */
export function licenseQuotaBytes(world: World): number {
  if (world.config.profile) return (world.config.profile.scale.targetDailyIngestTB! * 1e12) / 0.7; // Simulation allowance: normal target at 70%, not a claimed company quota.
  return Math.round((80_000 * world.config.fleetSize) / 35_000) * 1024 ** 3;
}
export const LICENSE_POOL = 'auto_generated_pool_enterprise';

/** Inputs plus a sample event per sourcetype (for nullQueue checks), cached per group. */
interface GroupInfo {
  inputs: CollectedInput[];
  samples: Map<string, string>;
}

function sampleRaw(c: CollectedInput, at: number): string {
  return c.log.entries(at - 10 * 60_000, at)[0]?.[1] ?? '';
}

function hostRates(
  world: World,
  p: HostProfile,
  info: GroupInfo,
  base: number,
  at: number,
  out: Map<string, number>,
  n: number,
): void {
  // Data reaches the receiver the forwarder is sending to; nullQueue there means it is never licensed.
  const servers = rowOutputs(world, p.fleetRow!)
    .servers.map((s) => targetStatus(world, s))
    .filter((t) => t.reachable);
  const receiver = servers[0]?.host;
  const keep = (c: CollectedInput) =>
    !receiver?.splunk ||
    !nullQueued(parseConfig(world, receiver, c.sourcetype, at), info.samples.get(c.sourcetype) ?? '');
  const regular = info.inputs.filter(
    (c, i, all) =>
      !(c.sourcetype in EXTRA_KBPS) &&
      all.findIndex((x) => x.sourcetype === c.sourcetype && x.index === c.index) === i,
  );
  regular.sort((a, b) => Number(a.index === 'os') - Number(b.index === 'os'));
  regular.forEach((c, i) => {
    if (!keep(c)) return;
    const share = regular.length === 1 ? 1 : i === 0 ? 0.7 : 0.3 / (regular.length - 1);
    const key = `${c.index}|${c.sourcetype}`;
    out.set(
      key,
      (out.get(key) ?? 0) +
        (world.config.profile
          ? profileInputRate(world, p, c.index, c.sourcetype, at) * (c.multiplier ?? 1)
          : base * share * 1024) *
          n,
    );
  });
  for (const c of info.inputs)
    if (c.sourcetype in EXTRA_KBPS && keep(c)) {
      const key = `${c.index}|${c.sourcetype}`;
      out.set(key, (out.get(key) ?? 0) + EXTRA_KBPS[c.sourcetype]! * 1024 * n);
    }
}

/** Current license rates. Forwarders are grouped by everything that shapes their inputs. */
export function computeLicenseRates(world: World, at = world.clock.now): Map<string, number> {
  const out = new Map<string, number>();
  const f = world.fleet;
  const d = world.derived;
  const classes = world.config.serverClasses;
  const delivering = (row: number) => f.health[row] !== BLOCKED && f.health[row] !== OFFLINE;

  // Hosts with their own running config, or whose files changed (permissions), are counted alone.
  const individual = new Set<number>(d.rowLocal.keys());
  for (const [host, overlay] of world.hosts.fsOverlay) {
    if (!overlay.size) continue;
    const p = resolveHost(world, host);
    if (p?.fleetRow !== undefined) individual.add(p.fleetRow);
  }
  const groups = new Map<string, { row: number; count: number }>();
  for (let row = 0; row < f.size; row++) {
    if (!delivering(row) || individual.has(row)) continue;
    const key = `${f.site[row]}|${f.serverClass[row]}|${f.assignedClass[row]}|${d.rowOutputs[row]}|${d.rowClass[row]}`;
    const g = groups.get(key);
    if (g) g.count++;
    else groups.set(key, { row, count: 1 });
  }
  const info = (p: HostProfile): GroupInfo => {
    const inputs = forwarderInputs(world, p).collected;
    return { inputs, samples: new Map(inputs.map((c) => [c.sourcetype, sampleRaw(c, at)])) };
  };
  const count = (row: number, n: number) => {
    const p = resolveHost(world, fleetHostname(world, row))!;
    hostRates(world, p, info(p), classes[f.serverClass[row]!]!.baseThroughputKBps, at, out, n);
  };
  for (const { row, count: n } of groups.values()) count(row, n);
  for (const row of individual) if (delivering(row)) count(row, 1);
  if (world.config.profile)
    for (const node of world.infra.filter((n) => n.role === 'heavy_forwarder')) {
      const p = resolveHost(world, node.hostname)!;
      if (!splunkdRunning(world, p)) continue;
      for (const c of profileRelayInputs(world, p)) {
        if (nullQueued(parseConfig(world, p, c.sourcetype, at), sampleRaw(c, at))) continue;
        const key = `${c.index}|${c.sourcetype}`;
        const d = world.config.profile.dataSources.find((d) => d.index === c.index && d.via === p.hostname)!;
        const state = streamState(world, p, d.id);
        const originalType =
          d.sourcetypes.find((st) => c.source.endsWith(st.replace(/:/g, '_') + '.log')) ?? c.sourcetype;
        out.set(
          key,
          (out.get(key) ?? 0) + profileInputRate(world, p, c.index, originalType, at) * state.multiplier,
        );
      }
    }
  return out;
}

const history = new WeakMap<World, LicenseSnapshot[]>();

/**
 * History starts the first time anything needs it: just before the first config/service change
 * (so the pre-change state is captured) or at the first query. Worlds nobody asks about never pay.
 */
let hooked = false;
/** Registered from createWorld (not at import time, which would race the circular module graph). */
export function installLicenseHooks(): void {
  if (hooked) return;
  hooked = true;
  runtimeHooks.beforeChange.push((world) => void snapshots(world));
}

function snapshots(world: World): LicenseSnapshot[] {
  let list = history.get(world);
  if (!list) {
    // History starts lazily; when a query starts it, journal that so a replay starts it at the same tick.
    journal(world, { k: 'license.start' });
    list = [{ from: -Infinity, rates: computeLicenseRates(world) }];
    history.set(world, list);
  }
  return list;
}

/** Called each simulated minute by the world tick; a no-op until history has started. */
/** Start license history now (replay of a journaled start). */
export function startLicenseHistory(world: World): void {
  snapshots(world);
}

export function recordLicense(world: World): void {
  const list = history.get(world);
  if (!list) return;
  const minute = Math.floor(world.clock.now / 60_000) * 60_000;
  if (list.at(-1)!.from === minute) return;
  list.push({ from: minute, rates: computeLicenseRates(world) });
  // Keep a little over a day.
  while (list.length > 1600) list.splice(1, 1);
}

export function licenseRatesAt(world: World, t: number): Map<string, number> {
  const list = snapshots(world);
  let lo = 0;
  for (let i = list.length - 1; i >= 0; i--)
    if (list[i]!.from <= t) {
      lo = i;
      break;
    }
  return list[lo]!.rates;
}

export function totalRate(rates: Map<string, number>): number {
  let s = 0;
  for (const v of rates.values()) s += Math.max(0, v);
  return s;
}

/** Actual indexed input/HEC bytes. Summary-generated stash records are not billed. */
export function recordedLicenseUsage(world: World, t0: number, t1: number): Map<string, number> {
  const out = new Map<string, number>();
  for (const event of world.ingestion?.events ?? [])
    if (event.provenance !== 'summary' && event.indexTime > t0 && event.indexTime <= t1) {
      const key = event.index + '|' + event.sourcetype;
      out.set(key, (out.get(key) ?? 0) + event.bytes);
    }
  return out;
}
/** Bytes indexed between t0 and t1 (piecewise-constant per minute). */
export function bytesBetween(world: World, t0: number, t1: number): number {
  let total = 0;
  for (let t = Math.floor(t0 / 60_000) * 60_000; t < t1; t += 60_000) {
    const a = Math.max(t, t0);
    const b = Math.min(t + 60_000, t1);
    total += (totalRate(licenseRatesAt(world, t)) * (b - a)) / 1000;
  }
  return total + [...recordedLicenseUsage(world, t0, t1).values()].reduce((n, v) => n + v, 0);
}

export interface LicenseStatus {
  quotaBytes: number;
  todayBytes: number;
  /** Today's usage so far as a percentage of the quota. */
  todayPct: number;
  /** A full day at the current rate, as a percentage of the quota. */
  projectedPct: number;
  bySourcetype: { index: string; sourcetype: string; bytesPerDay: number }[];
}

export function licenseStatus(world: World): LicenseStatus {
  const now = world.clock.now;
  const midnight = Math.floor(now / 86_400_000) * 86_400_000;
  const quota = licenseQuotaBytes(world);
  const today = bytesBetween(world, midnight, now);
  const rates = new Map(licenseRatesAt(world, now));
  for (const [key, bytes] of recordedLicenseUsage(world, now - 60000, now))
    rates.set(key, (rates.get(key) ?? 0) + bytes / 60);
  return {
    quotaBytes: quota,
    todayBytes: today,
    todayPct: (today / quota) * 100,
    projectedPct: ((totalRate(rates) * 86_400) / quota) * 100,
    bySourcetype: [...rates.entries()]
      .map(([k, v]) => ({
        index: k.split('|')[0]!,
        sourcetype: k.split('|')[1]!,
        bytesPerDay: Math.max(0, v) * 86_400,
      }))
      .sort((a, b) => b.bytesPerDay - a.bytesPerDay),
  };
}
