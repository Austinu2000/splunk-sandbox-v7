import type { World } from '../world';
import { setClock, tickWorld } from '../world';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { restartSplunk } from '../hosts/running';
import { patchConf } from '../scenario/engine';
import { applyClusterBundle } from '../hosts/cluster';
import { enableClusterManagement, persistClusterManagement } from './cluster-state';
import { advancedClusterHealth } from './cluster-health';
import { inspectClusterBundle } from './cluster-jobs';
import { shcHealth } from './shc-health';
import { stageShcBundleFile, shcKnowledgeDifferences } from './shc-admin';
import { queueShcBundle } from './shc-bundles';
import { smartStoreView } from './smartstore';
import {
  kvState,
  kvNode,
  kvCollections,
  kvConfigureCollection,
  kvWrite,
  kvRead,
  kvBackup,
  kvStatus,
  kvPersist,
  KV_APP,
} from '../kvstore/engine';

export type ClusterFixtureMode =
  | 'baseline'
  | 'peer-uri'
  | 'unhealthy'
  | 'multisite'
  | 'smartstore'
  | 'shc'
  | 'shc-drift'
  | 'kv'
  | 'kv-upgrade'
  | 'kv-sync'
  | 'kv-restore'
  | 'invalid-bundle';
export type ClusterFoundationCheck =
  | {
      kind: 'cluster-state';
      label: string;
      healthy?: boolean;
      joined?: string;
      maintenance?: boolean;
      siteCopies?: string[];
      restoredSite?: string;
    }
  | { kind: 'cluster-validation'; label: string; valid: boolean }
  | {
      kind: 'cluster-job';
      label: string;
      jobKind: 'indexer-restart' | 'indexer-bundle' | 'shc-bundle' | 'shc-restart';
      index?: string;
      minimumTargets?: number;
    }
  | {
      kind: 'shc-state';
      label: string;
      elected?: string;
      term?: number;
      title?: string;
      consistent?: boolean;
      runtimeReplicated?: boolean;
      majority?: boolean;
    }
  | {
      kind: 'smartstore-state';
      label: string;
      index: string;
      upload?: boolean;
      eviction?: boolean;
      fetch?: boolean;
    }
  | {
      kind: 'kv-state';
      label: string;
      host: string;
      app?: string;
      collection?: string;
      settings?: Record<string, string>;
      records?: Record<string, string | number | boolean>[];
      allMembers?: boolean;
      ready?: boolean;
      backup?: string;
      restored?: string;
      verifiedBackup?: boolean;
      action?: string;
    };

function write(world: World, host: string, path: string, text: string) {
  const fs = hostFs(world, resolveHost(world, host)!);
  fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(path, text, ROOT);
}
function server(world: World, host: string, stanza: string, settings: Record<string, string>) {
  const fs = hostFs(world, resolveHost(world, host)!),
    path =
      stanza === 'kvstore'
        ? '/opt/splunk/etc/apps/kv_training/local/server.conf'
        : '/opt/splunk/etc/system/local/server.conf';
  write(world, host, path, patchConf(fs.exists(path) ? fs.readFile(path, ROOT) : '', stanza, settings));
  restartSplunk(world, resolveHost(world, host)!);
}
/** Explicit isolated fixtures. Existing profile topology and inherited bucket models are retained. */
export function setupClusterFixture(world: World, mode: ClusterFixtureMode) {
  const cm = world.infra.find((n) => n.role === 'cluster_manager')!.hostname,
    fs = hostFs(world, resolveHost(world, cm)!),
    path = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
  const smart = mode === 'smartstore';
  fs.writeFile(
    path,
    fs.readFile(path, ROOT) +
      '\n[source_logs]\nrepFactor=auto\n' +
      (smart
        ? 'maxHotIdleSecs=10\nremotePath=volume:remote_store/$_index_name\n[volume:remote_store]\nstorageType=remote\npath=s3://sandbox-v7-training/recorded\n'
        : ''),
    ROOT,
  );
  applyClusterBundle(world, resolveHost(world, cm)!);
  write(
    world,
    'idx01',
    '/var/log/practice/cluster.log',
    'status=500 service=checkout latency_ms=400\nstatus=200 service=auth latency_ms=25\nstatus=500 service=checkout latency_ms=300\n',
  );
  const input = '/opt/splunk/etc/system/local/inputs.conf',
    idxfs = hostFs(world, resolveHost(world, 'idx01')!);
  write(
    world,
    'idx01',
    input,
    (idxfs.exists(input) ? idxfs.readFile(input, ROOT) : '') +
      '\n[monitor:///var/log/practice/cluster.log]\nindex=source_logs\nsourcetype=app_log\n',
  );
  restartSplunk(world, resolveHost(world, 'idx01')!);
  enableClusterManagement(world);
  tickWorld(world, 15);
  if (mode === 'peer-uri' || mode === 'unhealthy')
    server(world, 'idx03', 'clustering', { manager_uri: 'https://wrong-manager.invalid:8089' });
  if (mode === 'unhealthy') world.clusterManagement!.manualMaintenance = true;
  if (mode === 'multisite')
    server(world, cm, 'clustering', {
      multisite: 'true',
      site_replication_factor: 'origin:1,site1:1,site2:1,total:3',
      site_search_factor: 'origin:1,site1:1,site2:1,total:2',
    });
  if (mode === 'invalid-bundle')
    fs.writeFile(path, fs.readFile(path, ROOT) + '\n[automation_orders]\nrepFactor=wrong\n', ROOT);
  if (mode === 'shc-drift') {
    const deployer = world.infra.find((n) => n.role === 'deployer')!.hostname;
    stageShcBundleFile(
      world,
      deployer,
      'v7_status/local/savedsearches.conf',
      '[V7 cluster status]\nsearch=index=source_logs | stats count\n',
    );
    queueShcBundle(world, resolveHost(world, deployer)!);
    tickWorld(world, 20);
    write(
      world,
      'sh02',
      '/opt/splunk/etc/apps/v7_status/local/savedsearches.conf',
      '[V7 cluster status]\nsearch=index=missing_cluster_data | stats count\n',
    );
    restartSplunk(world, resolveHost(world, 'sh02')!);
  }
  kvState(world);
  if (['kv-sync', 'kv-restore'].includes(mode)) {
    kvConfigureCollection(world, 'sh01', KV_APP, 'service_owners', {
      'field.service': 'string',
      'field.owner': 'string',
      enforceTypes: 'true',
    });
    kvWrite(world, 'sh01', KV_APP, 'service_owners', [
      { _key: 'checkout', service: 'checkout', owner: 'Platform' },
      { _key: 'auth', service: 'auth', owner: 'Identity' },
    ]);
    tickWorld(world, 3);
  }
  if (mode === 'kv-upgrade') server(world, 'sh01', 'kvstore', { storageEngine: 'mmapv1' });
  if (mode === 'kv-sync') {
    server(world, 'sh03', 'kvstore', { port: '8192' });
    kvWrite(world, 'sh01', KV_APP, 'service_owners', [
      { _key: 'marker', service: 'worker', owner: 'Operations' },
    ]);
    tickWorld(world, 2);
  }
  if (mode === 'kv-restore') {
    kvBackup(world, 'sh01', 'v7_verified');
    kvWrite(
      world,
      'sh01',
      KV_APP,
      'service_owners',
      [{ _key: 'checkout', service: 'checkout', owner: 'CORRUPTED' }],
      'replace',
    );
    tickWorld(world, 3);
  }
  kvPersist(world);
  persistClusterManagement(world);
  setClock(world, { paused: true });
}
export function clusterFoundationCheck(world: World, check: ClusterFoundationCheck): boolean {
  try {
    if (check.kind === 'cluster-state') {
      if (!world.clusterManagement) return false;
      const h = advancedClusterHealth(world);
      return (
        (check.healthy === undefined ||
          (h.replicationMet &&
            h.searchFactorMet &&
            h.allDataSearchable &&
            h.members.every((m) => m.joined)) === check.healthy) &&
        (!check.joined || h.members.some((m) => m.host === check.joined && m.joined)) &&
        (check.maintenance === undefined || h.maintenance === check.maintenance) &&
        (!check.siteCopies ||
          (h.buckets.length > 0 &&
            h.buckets.every((b) =>
              check.siteCopies!.every((site) =>
                b.copies.some((c) => c.site === site && c.searchable && c.available),
              ),
            ))) &&
        (!check.restoredSite ||
          world.clusterManagement.siteFaults?.[check.restoredSite]?.restored !== undefined)
      );
    }
    if (check.kind === 'cluster-validation') {
      const p = world.infra.find((n) => n.role === 'cluster_manager')!,
        artifact = inspectClusterBundle(world, resolveHost(world, p.hostname)!);
      return !!world.clusterManagement?.validations.some(
        (v) => v.checksum === artifact.checksum && v.valid === check.valid,
      );
    }
    if (check.kind === 'cluster-job')
      return !!world.clusterManagement?.jobs.some(
        (j) =>
          j.kind === check.jobKind &&
          j.status === 'completed' &&
          j.completed.length >= (check.minimumTargets ?? 1) &&
          j.completed.length === j.targets.length &&
          j.targets.every(
            (host) =>
              j.events.some((e) => e.host === host && e.phase === 'stopped') &&
              j.events.some((e) => e.host === host && e.phase === 'completed'),
          ) &&
          (!check.index ||
            Object.keys(j.files ?? {}).some(
              (path) => path.endsWith('/indexes.conf') && j.files![path]!.includes('[' + check.index + ']'),
            )),
      );
    if (check.kind === 'shc-state') {
      if (!world.clusterManagement) return false;
      const h = shcHealth(world),
        objects = shcKnowledgeDifferences(world).filter((o) => !check.title || o.title === check.title);
      return (
        h.configured &&
        (check.majority === undefined || h.majority === check.majority) &&
        (!check.elected || h.captain === check.elected) &&
        h.term >= (check.term ?? 0) &&
        (!check.title || objects.length > 0) &&
        (check.consistent === undefined || objects.every((o) => o.consistent) === check.consistent) &&
        (!check.runtimeReplicated ||
          world.clusterManagement.shc.replication.some(
            (r) =>
              r.targets.length > 0 &&
              r.targets.length === r.completed.length &&
              r.files.some((f) => f.text.includes(check.title ?? '')),
          ))
      );
    }
    if (check.kind === 'smartstore-state') {
      const view = smartStoreView(world),
        objects = view.objects.filter((o) =>
          world.training?.buckets?.some((b) => b.sourceBucketId === o.bucketId && b.index === check.index),
        );
      return (
        objects.length > 0 &&
        (!check.upload || objects.every((o) => o.uploaded >= 0)) &&
        (!check.eviction || objects.some((o) => view.evictions.some((e) => e.bucketId === o.bucketId))) &&
        (!check.fetch || objects.some((o) => view.fetches.some((e) => e.bucketId === o.bucketId)))
      );
    }
    const state = kvState(world),
      node = kvNode(world, check.host),
      members = check.allMembers ? state.nodes.filter((n) => n.domain === node.domain) : [node],
      app = check.app ?? KV_APP;
    if (
      check.ready !== undefined &&
      !members.every(
        (n) =>
          (kvStatus(world, n.host).status === 'ready' && kvStatus(world, n.host).membersInSync) ===
          check.ready,
      )
    )
      return false;
    if (
      check.collection &&
      check.settings &&
      !members.every((n) => {
        const def = kvCollections(world, n.host, app).find((c) => c.collection === check.collection);
        return !!def && Object.entries(check.settings!).every(([k, v]) => def.settings[k] === v);
      })
    )
      return false;
    if (
      check.collection &&
      check.records &&
      !members.every((n) => {
        const rows = kvRead(world, n.host, app, check.collection!);
        return (
          rows.length === check.records!.length &&
          check.records!.every((expected) =>
            rows.some((row) => Object.entries(expected).every(([k, v]) => row[k] === v)),
          )
        );
      })
    )
      return false;
    const backup =
      check.backup && state.backups.find((b) => b.name === check.backup && b.domain === node.domain);
    if (check.backup && !backup) return false;
    if (
      check.verifiedBackup &&
      (!backup || JSON.stringify(backup.rows) !== JSON.stringify(state.domains[node.domain]!.rows))
    )
      return false;
    if (
      check.restored &&
      (!state.evidence.some((e) => e.action === 'restore' && e.target === check.restored) ||
        !state.backups.some(
          (b) =>
            b.name.startsWith('before-restore-') &&
            b.domain === node.domain &&
            JSON.stringify(b.rows) !== JSON.stringify(state.domains[node.domain]!.rows),
        ))
    )
      return false;
    return !check.action || state.evidence.some((e) => e.action === check.action && e.host === check.host);
  } catch {
    return false;
  }
}
