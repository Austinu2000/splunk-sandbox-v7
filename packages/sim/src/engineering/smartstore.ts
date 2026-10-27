import type { World } from '../world';
import { indexBuckets, type PracticeBucket } from './lifecycle';
import { clusterMembership } from './cluster-health';
import { resolveHost } from '../hosts/profile';
import { runningConf } from '../hosts/running';
import { setting, mergeConf } from '../conf/merge';
import { clusterReceipt, persistClusterManagement } from './cluster-state';
import { OperationsError } from './access';
export function smartStoreLocation(world: World, b: PracticeBucket) {
  const p = resolveHost(world, b.host)!;
  const conf = runningConf(world, p, 'indexes'),
    path = setting(conf, b.index, 'remotePath') ?? setting(conf, 'default', 'remotePath');
  if (!path) return undefined;
  const match = /^volume:([A-Za-z][A-Za-z0-9_-]{0,63})\/(.+)$/.exec(path);
  if (!match) throw new OperationsError('SmartStore remotePath needs volume:NAME/path');
  const volume = 'volume:' + match[1],
    root = setting(conf, volume, 'path');
  if (
    setting(conf, volume, 'storageType') !== 'remote' ||
    !root ||
    !/^s3:\/\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(root)
  )
    throw new OperationsError('Configure a remote volume with a fictional s3:// bucket path');
  return root.replace(/\/$/, '') + '/' + match[2]!.replace(/\$_index_name/g, b.index) + '/' + b.id;
}
function cacheLimit(world: World, host: string) {
  const p = resolveHost(world, host)!,
    server = runningConf(world, p, 'server'),
    policy = setting(server, 'cachemanager', 'eviction_policy') ?? 'lru',
    raw = Number(setting(server, 'cachemanager', 'max_cache_size') ?? 64);
  if (policy !== 'lru' || !Number.isSafeInteger(raw) || raw < 0 || raw > 1048576)
    throw new OperationsError('Bounded cache supports lru and a nonnegative integer max_cache_size');
  return (raw === 0 ? 64 : raw) * 1024 ** 2;
}
export function tickSmartStore(world: World) {
  const state = world.clusterManagement;
  if (
    !state ||
    state.jobs.some((j) => j.kind === 'indexer-bundle' && ['running', 'paused'].includes(j.status))
  )
    return;
  const smart = state.smartstore,
    buckets = indexBuckets(world);
  if (smart.remoteAvailable) {
    const retained = new Set(buckets.filter((b) => !['frozen', 'thawed'].includes(b.state)).map((b) => b.id));
    for (const id of Object.keys(smart.objects))
      if (!retained.has(id)) {
        delete smart.objects[id];
        clusterReceipt(
          world,
          'smartstore.retention',
          'remote store',
          id + ' removed after retention; archived/thawed data uses its separate local path',
        );
      }
    for (const bucket of buckets) {
      if (!['warm', 'cold'].includes(bucket.state)) continue;
      try {
        const key = smartStoreLocation(world, bucket);
        if (!key || smart.objects[bucket.id]) continue;
        if (Object.keys(smart.objects).length >= 500) break;
        const copies = world.training?.buckets?.find((b) => b.sourceBucketId === bucket.id)?.copies ?? [];
        if (!copies.length) continue;
        smart.objects[bucket.id] = {
          bucketId: bucket.id,
          key,
          uploaded: world.clock.tick,
          bytes: bucket.bytes,
          cached: copies.map((c) => c.host),
          accessed: Object.fromEntries(copies.map((c) => [c.host, world.clock.tick])),
        };
        clusterReceipt(
          world,
          'smartstore.upload',
          bucket.host,
          bucket.id + ' uploaded from recorded warm data',
        );
      } catch {
        /* Invalid source remains a visible location issue. */
      }
    }
  }
  for (const host of new Set(Object.values(smart.objects).flatMap((o) => o.cached))) {
    if (!clusterMembership(world).some((m) => m.host === host && m.joined)) continue;
    try {
      const limit = cacheLimit(world, host),
        objects = Object.values(smart.objects)
          .filter((o) => o.cached.includes(host))
          .sort(
            (a, b) =>
              (a.accessed?.[host] ?? a.uploaded) - (b.accessed?.[host] ?? b.uploaded) ||
              a.bucketId.localeCompare(b.bucketId),
          );
      let bytes = objects.reduce((n, o) => n + o.bytes, 0);
      for (const object of objects) {
        if (bytes <= limit) break;
        object.cached = object.cached.filter((h) => h !== host);
        bytes -= object.bytes;
        smart.evictions.push({ tick: world.clock.tick, bucketId: object.bucketId, host });
        clusterReceipt(
          world,
          'smartstore.capacity-eviction',
          host,
          object.bucketId + ' removed from local cache; remote object retained',
        );
      }
    } catch {
      /* Unsupported cache settings remain visible and fail matching reads. */
    }
  }
  smart.evictions = smart.evictions.slice(-100);
}
export function smartStoreServingPeer(world: World, bucket: PracticeBucket, fetch = false) {
  const state = world.clusterManagement;
  if (!state) return undefined;
  const object = state.smartstore.objects[bucket.id];
  if (!object) return undefined;
  let location: string | undefined;
  try {
    location = smartStoreLocation(world, bucket);
  } catch (e) {
    if (fetch) throw e;
    return null;
  }
  if (location !== object.key) {
    if (fetch)
      throw new OperationsError(
        'SmartStore location changed; review a data migration instead of reassigning the existing object',
      );
    return null;
  }
  const available = clusterMembership(world)
    .filter((m) => m.joined)
    .map((m) => m.host);
  let peer = available.find((h) => object.cached.includes(h));
  if (peer) {
    if (fetch && object.accessed?.[peer] !== world.clock.tick) {
      (object.accessed ??= {})[peer] = world.clock.tick;
      persistClusterManagement(world);
    }
    return peer;
  }
  if (!state.smartstore.remoteAvailable) {
    if (fetch) throw new OperationsError('Remote store unavailable and this recorded bucket is not cached');
    return null;
  }
  if (!available.length || !fetch) return null;
  peer = available[0]!;
  const limit = cacheLimit(world, peer);
  if (object.bytes > limit)
    throw new OperationsError('Recorded bucket exceeds the configured local cache limit');
  const cached = Object.values(state.smartstore.objects)
    .filter((o) => o.cached.includes(peer!))
    .sort(
      (a, b) =>
        (a.accessed?.[peer!] ?? a.uploaded) - (b.accessed?.[peer!] ?? b.uploaded) ||
        a.bucketId.localeCompare(b.bucketId),
    );
  let total = cached.reduce((n, o) => n + o.bytes, 0);
  for (const old of cached) {
    if (total + object.bytes <= limit) break;
    old.cached = old.cached.filter((h) => h !== peer);
    total -= old.bytes;
    state.smartstore.evictions.push({ tick: world.clock.tick, bucketId: old.bucketId, host: peer });
  }
  object.cached.push(peer);
  (object.accessed ??= {})[peer] = world.clock.tick;
  state.smartstore.fetches.push({
    tick: world.clock.tick,
    bucketId: bucket.id,
    host: peer,
    bytes: object.bytes,
  });
  state.smartstore.fetches = state.smartstore.fetches.slice(-100);
  state.smartstore.evictions = state.smartstore.evictions.slice(-100);
  clusterReceipt(world, 'smartstore.fetch', peer, bucket.id + ' localized from its recorded remote object');
  persistClusterManagement(world);
  return peer;
}
export function evictSmartStoreBucket(world: World, bucketId: string, host?: string) {
  const smart = world.clusterManagement?.smartstore,
    object = smart?.objects[bucketId];
  if (!smart || !object) throw new OperationsError('Only a successfully uploaded warm bucket can be evicted');
  const targets = host ? object.cached.filter((h) => h === host) : [...object.cached];
  for (const name of targets) {
    object.cached = object.cached.filter((h) => h !== name);
    smart.evictions.push({ tick: world.clock.tick, bucketId, host: name });
  }
  smart.evictions = smart.evictions.slice(-100);
  clusterReceipt(
    world,
    'smartstore.evict',
    host ?? 'all cached peers',
    bucketId + '; remote object retained',
  );
  persistClusterManagement(world);
  return object;
}
export function setSmartStoreRemoteAvailability(world: World, available: boolean) {
  if (!world.clusterManagement) throw new OperationsError('Enable V7 cluster operations first');
  world.clusterManagement.smartstore.remoteAvailable = available;
  clusterReceipt(world, 'smartstore.transport', 'remote store', available ? 'Available' : 'Unavailable');
  persistClusterManagement(world);
}
export function smartStoreView(world: World) {
  const state = world.clusterManagement?.smartstore;
  return {
    remoteAvailable: state?.remoteAvailable ?? false,
    objects: state ? Object.values(state.objects) : [],
    fetches: state?.fetches ?? [],
    evictions: state?.evictions ?? [],
    issues: indexBuckets(world).flatMap((b) => {
      try {
        smartStoreLocation(world, b);
        return [];
      } catch (e) {
        return [{ bucket: b.id, error: (e as Error).message }];
      }
    }),
  };
}
export function validateSmartStoreBundle(files: Record<string, string>) {
  const paths = Object.keys(files)
    .filter((p) => p.endsWith('/indexes.conf'))
    .sort((a, b) => Number(b.includes('/local/')) - Number(a.includes('/local/')) || a.localeCompare(b));
  const conf = mergeConf(
    'indexes',
    { list: () => [], read: (path) => files[path] ?? null },
    paths.map((path) => ({ path })),
  );
  for (const [name, stanza] of conf.stanzas) {
    if (name === 'default' || name.startsWith('volume:')) continue;
    const path = stanza.settings.get('remotePath')?.value ?? setting(conf, 'default', 'remotePath');
    if (!path) continue;
    const match = /^volume:([A-Za-z][A-Za-z0-9_-]{0,63})\/(.+)$/.exec(path);
    if (!match) throw new OperationsError('Invalid SmartStore remotePath in ' + name);
    const volume = 'volume:' + match[1],
      root = setting(conf, volume, 'path') ?? '';
    if (
      setting(conf, volume, 'storageType') !== 'remote' ||
      !/^s3:\/\/[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(root)
    )
      throw new OperationsError('SmartStore index ' + name + ' needs a defined remote S3 volume');
  }
}
