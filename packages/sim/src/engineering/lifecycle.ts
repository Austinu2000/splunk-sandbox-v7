import { smartStoreServingPeer } from './smartstore';
import { recordedClusterCopies, healthyCopyHosts } from './cluster-buckets';
import type { RecordedEvent, PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { runningConf } from '../hosts/running';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { journal } from '../journal';
import { OperationsError, requireCapability } from './access';

export interface PracticeBucket {
  id: string;
  host: string;
  index: string;
  state: 'hot' | 'warm' | 'cold' | 'frozen' | 'thawed';
  archived: boolean;
  path: string;
  bytes: number;
  earliest: number;
  latest: number;
  lastWrite: number;
  events: RecordedEvent[];
}
/** Small, explicit buckets: at most 64 recorded events per ingestion operation. Generated baseline is not materialized. */
export function indexBuckets(world: World): PracticeBucket[] {
  const buckets: PracticeBucket[] = [];
  const grouped = new Map<string, RecordedEvent[]>();
  for (const event of world.ingestion?.events ?? []) {
    const key = JSON.stringify([event.receiver, event.index, event.operationId]);
    const group = grouped.get(key) ?? [];
    group.push(event);
    grouped.set(key, group);
  }
  for (const events of grouped.values())
    for (let offset = 0; offset < events.length; offset += 64) {
      const batch = events.slice(offset, offset + 64),
        first = batch[0]!,
        host = resolveHost(world, first.receiver);
      if (!host?.splunk) continue;
      const id = 'bucket-' + first.id,
        conf = runningConf(world, host, 'indexes'),
        get = (key: string, fallback: string) => setting(conf, first.index, key) ?? fallback;
      const frozen = world.ingestion?.frozen?.[id],
        thawed = world.ingestion?.thawed?.includes(id);
      const bucket: PracticeBucket = {
        id,
        host: first.receiver,
        index: first.index,
        state: thawed ? 'thawed' : frozen ? 'frozen' : 'hot',
        archived: frozen?.archived ?? false,
        path: '',
        bytes: batch.reduce((n, e) => n + e.bytes, 0),
        earliest: Math.min(...batch.map((e) => e.time)),
        latest: Math.max(...batch.map((e) => e.time)),
        lastWrite: Math.max(...batch.map((e) => e.indexTime)),
        events: batch,
      };
      const idle = Number(get('maxHotIdleSecs', '0')) * 1000;
      if (bucket.state === 'hot' && idle > 0 && world.clock.now - bucket.lastWrite >= idle)
        bucket.state = 'warm';
      buckets.push(bucket);
    }
  const sizes = new Map<string, number>(),
    warm = new Map<string, number>();
  for (const b of [...buckets].sort((a, z) => z.lastWrite - a.lastWrite || z.id.localeCompare(a.id))) {
    const host = resolveHost(world, b.host)!,
      conf = runningConf(world, host, 'indexes'),
      get = (key: string, fallback: string) => setting(conf, b.index, key) ?? fallback,
      key = b.host + '|' + b.index;
    if (b.state !== 'thawed' && b.state !== 'frozen') {
      const bytes = (sizes.get(key) ?? 0) + b.bytes;
      if (
        b.latest < world.clock.now - Number(get('frozenTimePeriodInSecs', '188697600')) * 1000 ||
        bytes > Number(get('maxTotalDataSizeMB', '500000')) * 1024 ** 2
      ) {
        b.state = 'frozen';
        b.archived = !!get('coldToFrozenDir', '');
      } else {
        sizes.set(key, bytes);
        if (b.state === 'warm') {
          const n = (warm.get(key) ?? 0) + 1;
          warm.set(key, n);
          if (n > Number(get('maxWarmDBCount', '300'))) b.state = 'cold';
        }
      }
    }
    const base =
      b.state === 'frozen'
        ? get('coldToFrozenDir', '[deleted]')
        : b.state === 'thawed'
          ? get('thawedPath', `$SPLUNK_DB/${b.index}/thaweddb`)
          : b.state === 'cold'
            ? get('coldPath', `$SPLUNK_DB/${b.index}/colddb`)
            : get('homePath', `$SPLUNK_DB/${b.index}/db`);
    b.path = base + '/' + b.id;
  }
  return buckets;
}
export function tickIndexLifecycle(world: World) {
  if (!world.ingestion) return;
  for (const b of indexBuckets(world))
    if (b.state === 'frozen')
      (world.ingestion.frozen ??= {})[b.id] ??= { archived: b.archived, tick: world.clock.tick };
}
export function searchableRecordedEvents(
  world: World,
  fetchRemote = false,
  select?: (index: string, earliest: number, latest: number) => boolean,
) {
  return indexBuckets(world)
    .filter((b) => {
      if (select && !select(b.index, b.earliest, b.latest)) return false;
      if (b.state === 'frozen') return false;
      const remote = smartStoreServingPeer(world, b, fetchRemote);
      if (remote !== undefined) return !!remote;
      const copies = recordedClusterCopies(world, b.id);
      if (copies)
        return healthyCopyHosts(world, copies).some((name) => {
          const p = resolveHost(world, name)!;
          return (
            runningConf(world, p, 'indexes').stanzas.has(b.index) &&
            !confBool(setting(runningConf(world, p, 'indexes'), b.index, 'disabled'))
          );
        });
      const host = resolveHost(world, b.host);
      return (
        !!host?.splunk &&
        splunkdRunning(world, host) &&
        runningConf(world, host, 'indexes').stanzas.has(b.index) &&
        !confBool(setting(runningConf(world, host, 'indexes'), b.index, 'disabled'))
      );
    })
    .flatMap((b) => {
      const copies = recordedClusterCopies(world, b.id);
      const peer =
        smartStoreServingPeer(world, b, fetchRemote) ??
        (copies ? healthyCopyHosts(world, copies)[0] : undefined);
      return peer ? b.events.map((e) => ({ ...e, searchPeer: peer })) : b.events;
    })
    .reverse();
}
export function thawPracticeBucket(world: World, id: string, principal: PracticePrincipal = 'admin') {
  const bucket = indexBuckets(world).find((b) => b.id === id);
  if (!bucket) throw new OperationsError('Unknown recorded-data bucket');
  requireCapability(world, bucket.host, principal, 'indexes_edit');
  if (bucket.state !== 'frozen' || !bucket.archived || !world.ingestion?.frozen?.[id])
    throw new OperationsError('Only an archived frozen bucket can be restored into thawed storage');
  (world.ingestion.thawed ??= []).push(id);
  journal(world, { k: 'index.thaw', id });
  return { id, path: indexBuckets(world).find((b) => b.id === id)!.path };
}
