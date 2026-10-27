import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { HEALTH_STATES } from '@sandbox/shared';
import {
  createWorld,
  FleetAggregates,
  hostname,
  listHosts,
  matchRows,
  summarizeFleet,
  tickWorld,
  type World,
} from '../src';
import { HEALTHY, STALE, OFFLINE, DRIFT, WRONG_CLASS } from '../src/fleet/tables';

function fingerprint(world: World): string {
  const h = createHash('sha256');
  const f = world.fleet;
  for (const col of [
    f.site,
    f.serverClass,
    f.assignedClass,
    f.hostNum,
    f.version,
    f.health,
    f.healthSince,
    f.phoneHomeFrozenAt,
  ])
    h.update(new Uint8Array(col.buffer, col.byteOffset, col.byteLength));
  return h.digest('hex');
}

function unhealthyFraction(world: World): number {
  let n = 0;
  for (let i = 0; i < world.fleet.size; i++) if (world.fleet.health[i] !== HEALTHY) n++;
  return n / world.fleet.size;
}

// One full-size world shared by the read-only tests.
const big = createWorld({ seed: 'test-seed' });

describe('fleet generation', () => {
  it('builds the configured number of forwarders (default 35,000)', () => {
    expect(big.fleet.size).toBe(35_000);
    expect(summarizeFleet(big).total).toBe(35_000);
  });

  it('is deterministic for a seed and differs across seeds', () => {
    expect(fingerprint(createWorld({ seed: 'test-seed' }))).toBe(fingerprint(big));
    expect(fingerprint(createWorld({ seed: 'other-seed' }))).not.toBe(fingerprint(big));
  });

  it('gives every forwarder a unique hostname', () => {
    const names = new Set<string>();
    for (let i = 0; i < big.fleet.size; i++) names.add(hostname(big, i));
    expect(names.size).toBe(big.fleet.size);
    expect(hostname(big, 0)).toMatch(/^(dal|ash|fra)-(win|dc|app|web|db|syslog)-\d{4}$/);
  });

  it('spreads forwarders across all sites and server classes close to the configured weights', () => {
    const s = summarizeFleet(big);
    for (const site of s.bySite) {
      const weight = big.config.sites.find((x) => x.id === site.id)!.weight;
      expect(site.total / s.total).toBeCloseTo(weight, 1);
    }
    for (const cls of s.byServerClass) expect(cls.total).toBeGreaterThan(0);
  });

  it('starts with a small background of unhealthy forwarders in every state', () => {
    const frac = unhealthyFraction(big);
    expect(frac).toBeGreaterThan(0.008);
    expect(frac).toBeLessThan(0.025);
    const s = summarizeFleet(big);
    for (const state of HEALTH_STATES) expect(s.byHealth[state]).toBeGreaterThan(0);
  });

  it('keeps per-state side effects consistent with health', () => {
    const f = big.fleet;
    const approved = big.config.approvedVersions.length;
    const bad: number[] = [];
    for (let i = 0; i < f.size; i++) {
      const h = f.health[i]!;
      if (
        f.version[i]! >= approved !== (h === DRIFT) ||
        (f.assignedClass[i] !== f.serverClass[i]) !== (h === WRONG_CLASS) ||
        Number.isNaN(f.phoneHomeFrozenAt[i]!) !== (h !== STALE && h !== OFFLINE)
      )
        bad.push(i);
    }
    expect(bad).toEqual([]);
  });

  it('places infrastructure nodes outside the forwarder fleet', () => {
    const roles = big.infra.map((n) => n.role);
    expect(big.infra.filter((n) => n.role === 'indexer' && !n.retired)).toHaveLength(6);
    expect(big.infra.find((n) => n.hostname === 'idx07')).toMatchObject({ retired: true, status: 'down' });
    for (const r of [
      'search_head',
      'deployment_server',
      'cluster_manager',
      'license_manager',
      'heavy_forwarder',
    ])
      expect(roles).toContain(r);
    expect(matchRows(big, { q: 'idx' })).toHaveLength(0);
  });
});

describe('fleet evolution', () => {
  it('is deterministic across ticks', () => {
    const a = createWorld({ seed: 'evo', fleetSize: 5_000 });
    const b = createWorld({ seed: 'evo', fleetSize: 5_000 });
    tickWorld(a, 300);
    for (let i = 0; i < 300; i++) tickWorld(b);
    expect(fingerprint(a)).toBe(fingerprint(b));
    expect(a.clock.now).toBe(a.config.startTime + 300 * a.config.tickMs);
  });

  it('changes a small slice of the fleet each tick', () => {
    const w = createWorld({ seed: 'slice', fleetSize: 35_000 });
    const before = w.history.length;
    tickWorld(w, 60);
    const perTick = (w.history.length - before) / 60;
    expect(perTick).toBeGreaterThan(1);
    expect(perTick).toBeLessThan(40);
  });

  it('holds the background unhealthy rate in band over 1,000 ticks', () => {
    const w = createWorld({ seed: 'steady', fleetSize: 20_000 });
    for (let k = 0; k < 10; k++) {
      tickWorld(w, 100);
      const frac = unhealthyFraction(w);
      expect(frac).toBeGreaterThan(0.007);
      expect(frac).toBeLessThan(0.03);
    }
  }, 30_000); // ~2 s alone; slower when the whole suite runs in parallel

  it('keeps aggregates equal to a full scan after churn', () => {
    const w = createWorld({ seed: 'agg', fleetSize: 10_000 });
    tickWorld(w, 1_000);
    const scanned = FleetAggregates.fromScan(w.fleet, w.config.sites.length, w.config.serverClasses.length);
    expect(w.aggregates.equals(scanned)).toBe(true);
    expect(summarizeFleet(w)).toEqual(summarizeFleet(w, {}, { forceScan: true }));
  });

  it('records history that reconstructs past states', () => {
    const w = createWorld({ seed: 'hist', fleetSize: 5_000 });
    const snapshotTime = w.config.startTime + 200 * w.config.tickMs;
    tickWorld(w, 200);
    const snapshot = Uint8Array.from(w.fleet.health);
    tickWorld(w, 200);
    let changed = 0;
    for (let row = 0; row < w.fleet.size; row++) {
      expect(w.history.stateAt(row, snapshotTime, w.fleet.health[row]!)).toBe(snapshot[row]);
      if (snapshot[row] !== w.fleet.health[row]) changed++;
    }
    expect(changed).toBeGreaterThan(0);
  });

  it('prunes history older than the retention window', () => {
    const w = createWorld({ seed: 'prune', fleetSize: 2_000, historyRetentionMs: 10 * 60_000 });
    tickWorld(w, 500);
    expect(w.history.oldest).toBeGreaterThanOrEqual(w.clock.now - 10 * 60_000);
    expect(w.history.overflowed).toBe(0);
  });

  it('freezes phone-home for stale and offline forwarders and keeps it live otherwise', () => {
    const w = createWorld({ seed: 'phone', fleetSize: 5_000 });
    tickWorld(w, 30);
    const interval = w.config.phoneHomeIntervalMs;
    for (const r of listHosts(w, {}, { limit: 500 }).rows) {
      if (r.deploymentClientStatus === 'not_phoning_home') {
        expect(r.health === 'stale_phonehome' || r.health === 'offline').toBe(true);
      } else {
        expect(w.clock.now - r.lastPhoneHome).toBeLessThan(interval);
        expect(w.clock.now - r.lastPhoneHome).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('queries (single source of truth)', () => {
  it('summary counts equal host-list totals for the same filter', () => {
    const s = summarizeFleet(big);
    for (const health of HEALTH_STATES) expect(listHosts(big, { health }).total).toBe(s.byHealth[health]);
    for (const site of s.bySite) {
      expect(listHosts(big, { site: site.id }).total).toBe(site.total);
      expect(listHosts(big, { site: site.id, health: 'offline' }).total).toBe(site.byHealth.offline);
    }
    for (const cls of s.byServerClass) expect(listHosts(big, { serverClass: cls.id }).total).toBe(cls.total);
  });

  it('filtered summaries match the rows they summarise', () => {
    const filter = { site: 'dal', os: 'windows' as const };
    const s = summarizeFleet(big, filter);
    const rows = matchRows(big, filter);
    expect(s.total).toBe(rows.length);
    for (const r of listHosts(big, filter, { limit: 500 }).rows) {
      expect(r.site).toBe('dal');
      expect(r.os).toBe('windows');
    }
  });

  it('matches hostname substrings case-insensitively', () => {
    const page = listHosts(big, { q: 'DAL-WIN-00' }, { limit: 50 });
    expect(page.total).toBeGreaterThan(0);
    for (const r of page.rows) expect(r.hostname).toContain('dal-win-00');
  });

  it('pages and sorts', () => {
    const p1 = listHosts(big, {}, { offset: 0, limit: 100 });
    const p2 = listHosts(big, {}, { offset: 100, limit: 100 });
    expect(p1.rows).toHaveLength(100);
    expect(p1.rows[99]!.hostname < p2.rows[0]!.hostname).toBe(true);
    const desc = listHosts(big, { health: 'offline' }, { sort: 'lastPhoneHome', dir: 'asc', limit: 20 });
    for (let i = 1; i < desc.rows.length; i++)
      expect(desc.rows[i]!.lastPhoneHome).toBeGreaterThanOrEqual(desc.rows[i - 1]!.lastPhoneHome);
  });

  it('rejects unknown filter values', () => {
    expect(() => listHosts(big, { site: 'mars' })).toThrow(/Unknown site/);
    expect(() => summarizeFleet(big, { health: 'sad' as never })).toThrow(/Unknown health state/);
  });
});
