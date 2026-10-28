import { ingestionBufferView } from './ingestion-buffers';
import type { World } from '../world';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { serviceState } from '../hosts/running';
import { indexBuckets } from './lifecycle';
import { licenseStatus } from '../ingest/license';
import { advancedClusterHealth } from './cluster-health';
import { shcHealth } from './shc-health';
import { kvStatus } from '../kvstore/engine';
import { journal } from '../journal';
import { OperationsError } from './access';

/** Reads current services, actual inputs, recorded storage and scheduler receipts. */
export function platformSnapshot(world: World) {
  const buckets = indexBuckets(world),
    events = world.ingestion?.events ?? [],
    runs = world.reports?.runs ?? [];
  const services = world.infra
    .filter((n) => !n.retired && resolveHost(world, n.hostname)?.splunk)
    .map((n) => {
      const p = resolveHost(world, n.hostname)!;
      return {
        host: n.hostname,
        role: n.role,
        site: n.site,
        running: splunkdRunning(world, p),
        lastChange: serviceState(world, n.hostname)?.events.at(-1) ?? null,
      };
    });
  const indexes = new Map<
    string,
    {
      host: string;
      index: string;
      events: number;
      activeBytes: number;
      frozenBytes: number;
      archivedBuckets: number;
      states: Record<string, number>;
    }
  >();
  for (const bucket of buckets) {
    const key = bucket.host + '|' + bucket.index,
      row = indexes.get(key) ?? {
        host: bucket.host,
        index: bucket.index,
        events: 0,
        activeBytes: 0,
        frozenBytes: 0,
        archivedBuckets: 0,
        states: {},
      };
    row.events += bucket.events.length;
    row[bucket.state === 'frozen' ? 'frozenBytes' : 'activeBytes'] += bucket.bytes;
    row.archivedBuckets += Number(bucket.archived);
    row.states[bucket.state] = (row.states[bucket.state] ?? 0) + 1;
    indexes.set(key, row);
  }
  return {
    buffers: ingestionBufferView(world),
    tick: world.clock.tick,
    now: world.clock.now,
    services,
    inputStatus: Object.values(world.ingestion?.status ?? {}).slice(-100),
    recorded: {
      events: events.length,
      bytes: events.reduce((n, e) => n + e.bytes, 0),
      indexes: [...indexes.values()],
    },
    license: licenseStatus(world),
    scheduler: {
      succeeded: runs.filter((r) => r.status === 'succeeded').length,
      failed: runs.filter((r) => r.status === 'failed').length,
      skipped: runs.filter((r) => r.status === 'skipped').length,
      runs: runs.slice(-40),
    },
    cluster: world.clusterManagement ? advancedClusterHealth(world) : null,
    shc: world.clusterManagement ? shcHealth(world) : null,
    kv: world.kvstore?.nodes.map((n) => kvStatus(world, n.host)) ?? [],
    observations: world.platform?.observations ?? [],
  };
}
export function inspectPlatform(world: World, host?: string) {
  if (host && !resolveHost(world, host)) throw new OperationsError('Choose a known virtual host');
  const snapshot = platformSnapshot(world),
    state = (world.platform ??= { version: 1, nextId: 1, observations: [] });
  const observation = {
    id: 'platform-observation-' + state.nextId++,
    tick: world.clock.tick,
    ...(host ? { host } : {}),
    servicesDown: snapshot.services
      .filter((s) => !s.running && (!host || s.host === host))
      .map((s) => s.host),
    inputErrors: snapshot.inputStatus.filter((s) => s.error && (!host || s.host === host)).length,
    recordedEvents: snapshot.recorded.events,
    recordedBytes: snapshot.recorded.bytes,
    schedulerFailed: snapshot.scheduler.failed,
    schedulerSkipped: snapshot.scheduler.skipped,
  };
  state.observations.push(observation);
  state.observations = state.observations.slice(-100);
  journal(world, { k: 'platform.state', state: structuredClone(state) });
  return observation;
}
