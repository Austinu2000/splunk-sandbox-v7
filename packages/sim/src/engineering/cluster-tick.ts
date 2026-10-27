import { tickSmartStore } from './smartstore';
import { tickShcElection } from './shc-health';
import { tickShcJob } from './shc-bundles';
import { tickKnowledgeReplication } from './shc-knowledge';
import type { World } from '../world';
import { syncRecordedClusterBuckets, repairClusterBucket } from './cluster-buckets';
import { tickIndexerJob } from './cluster-jobs';
export function tickClusterManagement(world: World) {
  if (!world.clusterManagement) return;
  syncRecordedClusterBuckets(world);
  tickShcElection(world);
  for (const job of world.clusterManagement.jobs) {
    tickIndexerJob(world, job);
    tickShcJob(world, job);
  }
  tickShcElection(world);
  tickKnowledgeReplication(world);
  repairClusterBucket(world);
  tickSmartStore(world);
}
