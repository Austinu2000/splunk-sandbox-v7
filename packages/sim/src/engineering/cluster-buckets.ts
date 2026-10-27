import type { World } from '../world';
import { buckets, type PracticeBucket } from '../training/cluster';
import { clusterPolicy, clusterMembership, nativeSite, type SiteFactor } from './cluster-health';
import { indexBuckets } from './lifecycle';
import { resolveHost } from '../hosts/profile';
import { runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
import { clusterReceipt } from './cluster-state';
/** Bind real recorded-data buckets to the existing copy model; generated reference streams remain bounded fixtures. */
export function syncRecordedClusterBuckets(world: World) {
  if (!world.clusterManagement) return;
  const all = buckets(world);
  for (const source of indexBuckets(world)) {
    const p = resolveHost(world, source.host);
    if (
      !p ||
      !['peer', 'slave'].includes(setting(runningConf(world, p, 'server'), 'clustering', 'mode') ?? '') ||
      setting(runningConf(world, p, 'indexes'), source.index, 'repFactor') !== 'auto'
    )
      continue;
    const found = all.find((b) => b.sourceBucketId === source.id);
    if (found) {
      found.stage = source.state === 'thawed' ? 'cold' : source.state;
      continue;
    }
    if (all.length >= 500) continue;
    all.push({
      id: 'recorded:' + source.id,
      index: source.index,
      sourceBucketId: source.id,
      originSite: nativeSite(world, p),
      stage: source.state === 'thawed' ? 'cold' : source.state,
      ageDays: 0,
      copies: [{ host: p.hostname, searchable: true }],
    });
  }
}
/** Automatic manager fixup advances one damaged bucket per tick and never recreates a bucket with no surviving copy. */
export function repairClusterBucket(world: World) {
  if (!world.clusterManagement) return;
  const policy = clusterPolicy(world);
  if (policy.maintenance || !policy.managerAvailable || policy.issues.length) return;
  const members = clusterMembership(world).filter((m) => m.joined),
    byHost = new Map(members.map((m) => [m.host, m]));
  for (const b of buckets(world).filter((b) => b.stage !== 'frozen')) {
    if (b.sourceBucketId && world.clusterManagement.smartstore.objects[b.sourceBucketId]) continue;
    const live = () => b.copies.filter((c) => byHost.has(c.host));
    if (!live().length) continue;
    const before = JSON.stringify(b.copies),
      origin = b.originSite ?? byHost.get(b.copies[0]?.host ?? '')?.nativeSite ?? 'site1';
    const ensureSite = (site: string, count: number, searchable: boolean) => {
      const available = () =>
        live().filter((c) => (!searchable || c.searchable) && byHost.get(c.host)!.nativeSite === site);
      while (available().length < count) {
        if (searchable) {
          const copy = live().find((c) => !c.searchable && byHost.get(c.host)!.nativeSite === site);
          if (copy) {
            copy.searchable = true;
            continue;
          }
        }
        const next = members.find((m) => m.nativeSite === site && !b.copies.some((c) => c.host === m.host));
        if (!next) break;
        b.copies.push({ host: next.host, searchable });
      }
    };
    const satisfy = (factor: SiteFactor | undefined, searchable: boolean) => {
      if (factor) {
        ensureSite(origin, factor.origin, searchable);
        for (const [site, n] of Object.entries(factor.sites)) ensureSite(site, n, searchable);
      }
      const total = searchable ? policy.searchFactor : policy.replicationFactor;
      while (live().filter((c) => !searchable || c.searchable).length < total) {
        if (searchable) {
          const copy = live().find((c) => !c.searchable);
          if (copy) {
            copy.searchable = true;
            continue;
          }
        }
        const next = members.find((m) => !b.copies.some((c) => c.host === m.host));
        if (!next) break;
        b.copies.push({ host: next.host, searchable });
      }
    };
    satisfy(policy.replication, false);
    satisfy(policy.search, true);
    if (JSON.stringify(b.copies) !== before) {
      clusterReceipt(
        world,
        'bucket.fixup',
        policy.manager,
        b.id + ' copies/searchable placements updated from a surviving replica',
      );
      return;
    }
  }
}
export function recordedClusterCopies(world: World, sourceId: string) {
  return world.clusterManagement ? buckets(world).find((b) => b.sourceBucketId === sourceId) : undefined;
}
export function healthyCopyHosts(world: World, b: PracticeBucket) {
  const members = new Map(clusterMembership(world).map((m) => [m.host, m.joined]));
  return b.copies.filter((c) => c.searchable && members.get(c.host)).map((c) => c.host);
}
