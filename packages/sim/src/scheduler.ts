import { setting } from './conf/merge';
import { confBool } from './conf/parse';
import type { HostProfile } from './hosts/profile';
import { runningConfAt } from './hosts/running';
import { hashString, mix32 } from './rng';
import type { World } from './world';

/**
 * The search scheduler on a search head: savedsearches.conf cron schedules, run under the
 * scheduler's concurrency limit from limits.conf. A search due when the limit is reached waits
 * inside its schedule_window if it has one, and is otherwise skipped, as in Splunk. The run is a
 * pure function of running config and time, so scheduler.log, the Monitoring Console and fix
 * checks all agree.
 */

// ---------------------------------------------------------------- cron

type CronField = (n: number) => boolean;

function field(spec: string, min: number, max: number): CronField | null {
  const parts = spec.split(',');
  const tests: CronField[] = [];
  for (const part of parts) {
    const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part.trim());
    if (!m) return null;
    let lo = min;
    let hi = max;
    if (m[1] !== '*') {
      const [a, b] = m[1]!.split('-').map(Number);
      lo = a!;
      hi = b ?? (m[2] ? max : a!);
    }
    const step = m[2] ? Number(m[2]) : 1;
    if (lo < min || hi > max || step < 1) return null;
    tests.push((n) => n >= lo && n <= hi && (n - lo) % step === 0);
  }
  return (n) => tests.some((t) => t(n));
}

/** Parses a 5-field cron expression; returns a matcher for epoch-ms minute starts (UTC), or null. */
export function parseCron(expr: string): ((t: number) => boolean) | null {
  const f = expr.trim().split(/\s+/);
  if (f.length !== 5) return null;
  const [mi, h, dom, mon, dow] = [
    field(f[0]!, 0, 59),
    field(f[1]!, 0, 23),
    field(f[2]!, 1, 31),
    field(f[3]!, 1, 12),
    field(f[4]!, 0, 7),
  ];
  if (!mi || !h || !dom || !mon || !dow) return null;
  return (t) => {
    const d = new Date(t);
    const wd = d.getUTCDay();
    return (
      mi(d.getUTCMinutes()) &&
      h(d.getUTCHours()) &&
      dom(d.getUTCDate()) &&
      mon(d.getUTCMonth() + 1) &&
      (dow(wd) || (wd === 0 && dow(7)))
    );
  };
}

// ---------------------------------------------------------------- config

export interface ScheduledSearch {
  name: string;
  app: string;
  owner: string;
  matches: (t: number) => boolean;
  /** Seconds a run takes: longer time ranges take longer. */
  runSeconds: number;
  /** Minutes the scheduler may delay a run when busy (schedule_window). */
  windowMinutes: number;
}

interface SchedulerConfig {
  searches: ScheduledSearch[];
  limit: number;
}

function runSecondsFor(name: string, earliest: string | undefined): number {
  const span = /^-(\d+)([mhd])/.exec(earliest ?? '-15m');
  const minutes = span ? Number(span[1]) * { m: 1, h: 60, d: 1440 }[span[2] as 'm' | 'h' | 'd'] : 15;
  const base = minutes >= 1440 ? 170 : minutes >= 240 ? 90 : minutes >= 60 ? 45 : 20;
  return base + (hashString(name) % Math.round(base * 0.4));
}

// Merged configs are cached per running revision, so the objects identify a config.
const configCache = new WeakMap<object, WeakMap<object, SchedulerConfig>>();

export function schedulerConfig(world: World, sh: HostProfile, t: number): SchedulerConfig {
  const saved = runningConfAt(world, sh, 'savedsearches', t);
  const limits = runningConfAt(world, sh, 'limits', t);
  let byLimits = configCache.get(saved);
  if (!byLimits) configCache.set(saved, (byLimits = new WeakMap()));
  const hit = byLimits.get(limits);
  if (hit) return hit;
  const searches: ScheduledSearch[] = [];
  for (const [name, st] of [...saved.stanzas].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    if (name === 'default') continue;
    const v = (k: string) => st.settings.get(k)?.value;
    if (!confBool(v('enableSched')) || confBool(v('disabled'))) continue;
    const matches = parseCron(v('cron_schedule') ?? '');
    if (!matches) continue;
    const win = v('schedule_window');
    searches.push({
      name,
      app: 'search',
      owner: 'nobody',
      matches,
      runSeconds: runSecondsFor(name, v('dispatch.earliest_time')),
      windowMinutes: win === 'auto' ? 30 : Number(win) || 0,
    });
  }
  const num = (stanza: string, k: string, d: number) => Number(setting(limits, stanza, k)) || d;
  const maxHistorical =
    num('search', 'base_max_searches', 6) + num('search', 'max_searches_per_cpu', 1) * sh.cpus;
  const limit = Math.max(1, Math.floor((maxHistorical * num('scheduler', 'max_searches_perc', 50)) / 100));
  const cfg = { searches, limit };
  byLimits.set(limits, cfg);
  return cfg;
}

// ---------------------------------------------------------------- run

export interface SchedulerRecord {
  name: string;
  app: string;
  owner: string;
  status: 'success' | 'skipped';
  /** Epoch ms of the cron slot. */
  scheduledTime: number;
  dispatchTime?: number;
  runSeconds?: number;
  resultCount?: number;
  concurrencyLimit: number;
  /** When the scheduler logs it: completion for runs, the decision for skips. */
  logTime: number;
}

const WARMUP_MIN = 40;

/**
 * Simulates minutes [fromMin, toMin) (epoch-ms minute starts). Starts WARMUP_MIN minutes early so
 * runs in flight and waiting searches at the start are accounted for.
 */
export function simulateScheduler(
  world: World,
  sh: HostProfile,
  from: number,
  to: number,
): SchedulerRecord[] {
  const start = Math.floor(from / 60_000) * 60_000 - WARMUP_MIN * 60_000;
  const running: { until: number }[] = [];
  const waiting: { s: ScheduledSearch; slot: number; deadline: number }[] = [];
  const out: SchedulerRecord[] = [];
  for (let t = start; t < to; t += 60_000) {
    const cfg = schedulerConfig(world, sh, t);
    for (let i = running.length - 1; i >= 0; i--) if (running[i]!.until <= t) running.splice(i, 1);
    const due = [
      ...waiting.splice(0),
      ...cfg.searches
        .filter((s) => s.matches(t))
        .map((s) => ({ s, slot: t, deadline: t + s.windowMinutes * 60_000 })),
    ];
    for (const d of due) {
      const record = (
        r: Omit<SchedulerRecord, 'name' | 'app' | 'owner' | 'scheduledTime' | 'concurrencyLimit'>,
      ) => {
        if (d.slot >= from || r.logTime >= from)
          out.push({
            name: d.s.name,
            app: d.s.app,
            owner: d.s.owner,
            scheduledTime: d.slot,
            concurrencyLimit: cfg.limit,
            ...r,
          });
      };
      if (running.length < cfg.limit) {
        const dispatch = t + 1000 + (mix32(hashString(d.s.name), t / 60_000) % 4000);
        running.push({ until: dispatch + d.s.runSeconds * 1000 });
        record({
          status: 'success',
          dispatchTime: dispatch,
          runSeconds: d.s.runSeconds + (mix32(hashString(d.s.name), t / 60_000, 1) % 1000) / 1000,
          resultCount: mix32(hashString(d.s.name), t / 60_000, 2) % 250,
          logTime: dispatch + d.s.runSeconds * 1000,
        });
      } else if (t + 60_000 <= d.deadline) {
        waiting.push(d);
      } else {
        record({ status: 'skipped', logTime: t + 500 });
      }
    }
  }
  return out.filter((r) => r.logTime >= from && r.logTime < to);
}

/** Skipped runs scheduled in the next `minutes` minutes under the current config. */
export function projectedSkips(world: World, sh: HostProfile, minutes: number): number {
  // From the next minute: a slot that already passed can't be changed by a fix.
  const next = Math.floor(world.clock.now / 60_000) * 60_000 + 60_000;
  return simulateScheduler(world, sh, next, next + minutes * 60_000 + 10 * 60_000).filter(
    (r) => r.status === 'skipped' && r.scheduledTime >= next && r.scheduledTime < next + minutes * 60_000,
  ).length;
}

export const SKIP_REASON =
  'The maximum number of concurrent historical scheduled searches on this instance has been reached';
