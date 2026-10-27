import type { World } from '../world';
import type { ClusterManagementState } from '@sandbox/shared';
import { journal } from '../journal';
import { buckets } from '../training/cluster';
import { resolveHost } from '../hosts/profile';
import { nativeSite } from './cluster-health';
import { persistTraining } from '../training/engine';
export function enableClusterManagement(world: World): ClusterManagementState {
  if (!world.clusterManagement) {
    world.clusterManagement = {
      version: 1,
      nextId: 1,
      jobs: [],
      validations: [],
      receipts: [],
      peerBundles: {},
      shc: { captain: null, term: 0, elections: [], bundles: {}, replication: [] },
      smartstore: { objects: {}, remoteAvailable: true, fetches: [], evictions: [] },
    };
    for (const b of buckets(world)) {
      const p = resolveHost(world, b.copies[0]?.host ?? '');
      if (p) b.originSite ??= nativeSite(world, p);
    }
    persistTraining(world);
    persistClusterManagement(world);
  }
  return world.clusterManagement;
}
export function persistClusterManagement(world: World) {
  journal(world, { k: 'cluster.management', state: structuredClone(world.clusterManagement!) });
}
export function clusterReceipt(world: World, kind: string, host: string, detail: string) {
  const s = world.clusterManagement!;
  s.receipts.push({ id: 'cluster-receipt-' + s.nextId++, tick: world.clock.tick, kind, host, detail });
  s.receipts = s.receipts.slice(-100);
}
