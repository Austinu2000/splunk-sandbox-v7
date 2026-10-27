import { indexBuckets } from './lifecycle';
import { smartStoreLocation } from './smartstore';
import type { World } from '../world';
import { resolveHost, splunkdRunning, type HostProfile } from '../hosts/profile';
import { runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { buckets } from '../training/cluster';
import { OperationsError } from './access';
export function clusterManager(world: World) {
  const n = world.infra.find((n) => n.role === 'cluster_manager' && !n.retired),
    p = n && resolveHost(world, n.hostname);
  if (!p?.splunk) throw new OperationsError('No active Cluster Manager in this environment');
  return p;
}
export function nativeSite(world: World, p: HostProfile) {
  return (
    setting(runningConf(world, p, 'server'), 'general', 'site') ??
    'site' + (world.config.sites.findIndex((s) => s.id === p.site) + 1)
  );
}
export function clusterMembership(world: World) {
  const manager = clusterManager(world),
    cm = runningConf(world, manager, 'server'),
    managerSecret = setting(cm, 'clustering', 'pass4SymmKey');
  return world.infra
    .filter((n) => n.role === 'indexer' && !n.retired && !world.training?.retiredPeers?.includes(n.hostname))
    .map((n) => {
      const p = resolveHost(world, n.hostname)!,
        c = runningConf(world, p, 'server'),
        mode = setting(c, 'clustering', 'mode') ?? 'disabled',
        uri = setting(c, 'clustering', 'manager_uri') ?? setting(c, 'clustering', 'master_uri') ?? '',
        secret = setting(c, 'clustering', 'pass4SymmKey');
      let reason = '';
      if (!['peer', 'slave'].includes(mode)) reason = 'Node is not configured as a cluster peer';
      else {
        try {
          const url = new URL(uri),
            target = resolveHost(world, url.hostname);
          if (url.protocol !== 'https:' || url.port !== '8089' || target?.hostname !== manager.hostname)
            reason = 'manager_uri does not identify the active manager';
        } catch {
          reason = 'Invalid manager_uri';
        }
      }
      if (
        !reason &&
        secret &&
        !secret.startsWith('$7$') &&
        managerSecret &&
        !managerSecret.startsWith('$7$') &&
        secret !== managerSecret
      )
        reason = 'Explicit teaching shared secrets do not match';
      if (!reason && !splunkdRunning(world, p)) reason = 'splunkd is stopped';
      return {
        host: p.hostname,
        site: p.site,
        nativeSite: nativeSite(world, p),
        mode,
        managerUri: uri,
        joined: !reason,
        running: splunkdRunning(world, p),
        reason,
      };
    });
}
export interface SiteFactor {
  origin: number;
  total: number;
  sites: Record<string, number>;
}
export function parseSiteFactor(value: string): SiteFactor {
  const out: SiteFactor = { origin: 0, total: 0, sites: {} };
  const seen = new Set<string>();
  for (const item of value.split(',')) {
    const m = /^\s*(origin|total|site[1-9]\d?):(\d+)\s*$/.exec(item);
    if (!m || seen.has(m[1]!))
      throw new OperationsError('Use unique origin:N,siteN:N,total:N replication terms');
    seen.add(m[1]!);
    const count = Number(m[2]);
    if (count < 1 || count > 100) throw new OperationsError('Site factors must be integers from 1 to 100');
    if (m[1] === 'origin' || m[1] === 'total') out[m[1]] = count;
    else out.sites[m[1]!] = count;
  }
  if (
    !out.total ||
    !out.origin ||
    out.origin > out.total ||
    Object.values(out.sites).some((n) => n > out.total) ||
    Object.values(out.sites).reduce((n, v) => n + v, 0) > out.total
  )
    throw new OperationsError('Site totals cannot exceed total; origin and total are required');
  return out;
}
export function clusterPolicy(world: World) {
  const manager = clusterManager(world),
    c = runningConf(world, manager, 'server'),
    get = (k: string, fallback: string) => setting(c, 'clustering', k) ?? fallback;
  const replicationFactor = Number(
      get('replication_factor', String(world.config.profile?.infra.indexerCluster.replicationFactor ?? 3)),
    ),
    searchFactor = Number(
      get('search_factor', String(world.config.profile?.infra.indexerCluster.searchFactor ?? 2)),
    ),
    multisite = confBool(
      get('multisite', world.config.profile?.infra.indexerCluster.multisite ? 'true' : 'false'),
    ),
    issues: string[] = [];
  if (!['manager', 'master'].includes(get('mode', 'disabled')))
    issues.push('Manager clustering mode is not enabled');
  if (
    !Number.isInteger(replicationFactor) ||
    replicationFactor < 1 ||
    replicationFactor > 100 ||
    !Number.isInteger(searchFactor) ||
    searchFactor < 1 ||
    searchFactor > replicationFactor
  )
    issues.push('Use positive RF and SF, with SF no greater than RF');
  let replication: SiteFactor | undefined, search: SiteFactor | undefined;
  if (multisite) {
    try {
      replication = parseSiteFactor(get('site_replication_factor', `origin:1,total:${replicationFactor}`));
      search = parseSiteFactor(get('site_search_factor', `origin:1,total:${searchFactor}`));
      if (search.total > replication.total) issues.push('Site search total exceeds the replication total');
      for (const factor of [replication, search])
        for (let i = 0; i < world.config.sites.length; i++) {
          const site = 'site' + (i + 1),
            required =
              Math.max(factor.origin, factor.sites[site] ?? 0) +
              Object.entries(factor.sites)
                .filter(([name]) => name !== site)
                .reduce((n, [, v]) => n + v, 0);
          if (required > factor.total)
            issues.push('Site total cannot satisfy origin and explicit placements for ' + site);
        }
      for (const [site, count] of Object.entries(search.sites))
        if (count > (replication.sites[site] ?? replication.total))
          issues.push('Site search factor exceeds replication for ' + site);
    } catch (e) {
      issues.push((e as Error).message);
    }
  }
  return {
    manager: manager.hostname,
    managerAvailable: splunkdRunning(world, manager),
    replicationFactor: replication?.total ?? replicationFactor,
    searchFactor: search?.total ?? searchFactor,
    multisite,
    replication,
    search,
    maintenance:
      (world.clusterManagement?.manualMaintenance ?? confBool(get('maintenance_mode', 'false'))) ||
      !!world.clusterManagement?.jobs.some(
        (j) => j.kind.startsWith('indexer-') && ['running', 'paused'].includes(j.status),
      ),
    issues,
  };
}
export function advancedClusterHealth(world: World) {
  const policy = clusterPolicy(world),
    members = clusterMembership(world),
    active = buckets(world).filter((b) => b.stage !== 'frozen'),
    member = new Map(members.map((m) => [m.host, m]));
  const states = active.map((b) => {
    const origin = b.originSite ?? member.get(b.copies[0]?.host ?? '')?.nativeSite ?? 'site1';
    const copies = b.copies.map((c) => ({
      ...c,
      available: member.get(c.host)?.joined ?? false,
      site: member.get(c.host)?.nativeSite ?? 'unknown',
    }));
    const meets = (factor: SiteFactor | undefined, searchable: boolean) => {
      const live = copies.filter((c) => c.available && (!searchable || c.searchable));
      if (live.length < (searchable ? policy.searchFactor : policy.replicationFactor)) return false;
      if (!factor) return true;
      return (
        live.filter((c) => c.site === origin).length >= factor.origin &&
        Object.entries(factor.sites).every(([site, n]) => live.filter((c) => c.site === site).length >= n)
      );
    };
    const remote = b.sourceBucketId
      ? world.clusterManagement?.smartstore.objects[b.sourceBucketId]
      : undefined;
    let remoteSearchable = false;
    if (remote) {
      const source = indexBuckets(world).find((x) => x.id === b.sourceBucketId);
      try {
        remoteSearchable =
          !!source &&
          smartStoreLocation(world, source) === remote.key &&
          members.some((m) => m.joined) &&
          (world.clusterManagement!.smartstore.remoteAvailable ||
            remote.cached.some((host) => member.get(host)?.joined));
      } catch {
        /* Invalid location remains unavailable. */
      }
    }
    return {
      id: b.id,
      stage: b.stage,
      index: b.index,
      sourceBucketId: b.sourceBucketId,
      originSite: origin,
      copies,
      storage: remote ? 'remote' : 'local',
      replicationMet: remote ? true : meets(policy.replication, false),
      searchFactorMet: remote ? remoteSearchable : meets(policy.search, true),
      searchable: remote ? remoteSearchable : copies.some((c) => c.available && c.searchable),
    };
  });
  return {
    ...policy,
    replicationMet: policy.issues.length === 0 && states.every((b) => b.replicationMet),
    searchFactorMet: policy.issues.length === 0 && states.every((b) => b.searchFactorMet),
    allDataSearchable: policy.issues.length === 0 && states.every((b) => b.searchable),
    members,
    buckets: states,
  };
}
