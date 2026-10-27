import { advancedClusterHealth } from '../engineering/cluster-health';
import type { World } from '../world';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
import { training, getResource, persistTraining, recordEvidence, TrainingError } from './engine';
export interface BucketCopy {
  host: string;
  searchable: boolean;
}
export interface PracticeBucket {
  index?: string;
  sourceBucketId?: string;
  originSite?: string;
  id: string;
  copies: BucketCopy[];
  stage: 'hot' | 'warm' | 'cold' | 'frozen';
  ageDays: number;
}
export function buckets(world: World): PracticeBucket[] {
  const s = training(world);
  if (s.buckets) return s.buckets;
  const peers = world.infra.filter((n) => n.role === 'indexer' && !n.retired);
  const rf = world.config.profile?.infra.indexerCluster.replicationFactor ?? 3,
    sf = world.config.profile?.infra.indexerCluster.searchFactor ?? 2;
  s.buckets = Array.from({ length: 12 }, (_, i) => ({
    id: `bucket-${i + 1}`,
    ageDays: i * 10,
    stage: i === 0 ? 'hot' : i < 3 ? 'warm' : i < 9 ? 'cold' : 'frozen',
    copies: Array.from({ length: Math.min(rf, peers.length) }, (_, j) => ({
      host: peers[(i + j) % peers.length]!.hostname,
      searchable: j < sf,
    })),
  }));
  return s.buckets;
}
export function clusterHealth(world: World) {
  if (world.clusterManagement) return advancedClusterHealth(world);
  const peers = world.infra.filter((n) => n.role === 'indexer' && !n.retired);
  const rf = world.config.profile?.infra.indexerCluster.replicationFactor ?? 3,
    sf = world.config.profile?.infra.indexerCluster.searchFactor ?? 2;
  const manager = world.infra.find((n) => n.role === 'cluster_manager');
  const p = manager && resolveHost(world, manager.hostname);
  const maintenance = p
    ? setting(runningConf(world, p, 'server'), 'clustering', 'maintenance_mode') === 'true'
    : false;
  const healthy = (host: string) => {
    const n = peers.find((n) => n.hostname === host),
      p = resolveHost(world, host);
    return !!n && !!p && splunkdRunning(world, p);
  };
  const active = buckets(world).filter((b) => b.stage !== 'frozen');
  return {
    replicationFactor: rf,
    searchFactor: sf,
    maintenance,
    replicationMet: active.every((b) => b.copies.filter((c) => healthy(c.host)).length >= rf),
    searchFactorMet: active.every(
      (b) => b.copies.filter((c) => c.searchable && healthy(c.host)).length >= sf,
    ),
    buckets: active.map((b) => ({
      id: b.id,
      stage: b.stage,
      copies: b.copies.map((c) => ({ ...c, available: healthy(c.host) })),
    })),
    managerAvailable: !!p && splunkdRunning(world, p),
  };
}
export function retirePeer(world: World, host: string) {
  const n = world.infra.find((n) => n.hostname === host && n.role === 'indexer');
  if (!n) throw new TrainingError('Run offline on an indexer');
  const health = clusterHealth(world);
  const others = world.infra.filter(
    (n) =>
      n.role === 'indexer' &&
      !n.retired &&
      n.hostname !== host &&
      splunkdRunning(world, resolveHost(world, n.hostname)!),
  );
  if (others.length < health.replicationFactor)
    throw new TrainingError('Retirement blocked: insufficient replacement peers to preserve replication');
  if (health.maintenance || !health.managerAvailable)
    throw new TrainingError('Retirement requires an available manager and maintenance disabled');
  for (const b of buckets(world)) {
    const copy = b.copies.find((c) => c.host === host);
    if (copy) {
      const replacement = others.find((n) => !b.copies.some((c) => c.host === n.hostname));
      if (!replacement) throw new TrainingError('No replacement peer');
      copy.host = replacement.hostname;
    }
  }
  training(world).retiredPeers ??= [];
  training(world).retiredPeers!.push(host);
  recordEvidence(world, 'peer.drain', host, 0, true, 'Copies relocated before offline');
  persistTraining(world);
}
export function refreshClusterPractice(world: World) {
  const s = world.training;
  if (!s) return;
  const r = getResource(world, 'cluster');
  const live = clusterHealth(world);
  const unavailable = r.running.peerDown
    ? world.infra.find((n) => n.role === 'indexer' && !n.retired)?.hostname
    : undefined;
  const active = buckets(world).filter((b) => b.stage !== 'frozen');
  const available = (c: BucketCopy) =>
    c.host !== unavailable &&
    !s.retiredPeers?.includes(c.host) &&
    splunkdRunning(world, resolveHost(world, c.host)!);
  Object.assign(r.metrics, {
    replicationMet: active.every(
      (b) => b.copies.filter(available).length >= Number(r.running.replicationFactor),
    ),
    searchFactorMet: active.every(
      (b) => b.copies.filter((c) => c.searchable && available(c)).length >= Number(r.running.searchFactor),
    ),
    buckets: active.length,
    managerAvailable: live.managerAvailable,
  });
}
