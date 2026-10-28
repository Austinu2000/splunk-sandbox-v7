import { modeledOptStorage } from './storage-capacity';
import type { UpgradePreflight } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost, splunkVersion, splunkdRunning } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { filesUnder } from '../hosts/cluster';
import { parseConf } from '../conf/parse';
import { advancedClusterHealth } from './cluster-health';
import { shcHealth } from './shc-health';
import { kvStatus, kvNode } from '../kvstore/engine';
import { OperationsError } from './access';
import { configurationFingerprint } from './config-backup';
import {
  maintenanceState,
  maintenanceHost,
  MAINTENANCE_TARGET,
  enterpriseArtifact,
  persistMaintenance,
  sha256Text,
} from './maintenance-state';
export function upgradePrerequisites(w: World, host: string) {
  const p = maintenanceHost(w, host),
    needed =
      p.role === 'cluster_manager'
        ? ['license_manager']
        : p.role === 'deployer'
          ? ['license_manager', 'cluster_manager']
          : p.role === 'search_head'
            ? ['license_manager', 'cluster_manager', 'deployer']
            : p.role === 'indexer'
              ? ['license_manager', 'cluster_manager', 'deployer', 'search_head']
              : [];
  return upgradeOrder(
    w,
    w.infra.filter((n) => needed.includes(n.role) && !n.retired).map((n) => n.hostname),
  );
}
export function upgradeOrder(w: World, hosts: string[]) {
  const rank: Record<string, number> = {
    license_manager: 0,
    cluster_manager: 1,
    deployer: 2,
    search_head: 3,
    indexer: 4,
  };
  const captain = w.clusterManagement?.shc.captain;
  return [...hosts].sort(
    (a, b) =>
      (rank[resolveHost(w, a)!.role] ?? 5) - (rank[resolveHost(w, b)!.role] ?? 5) ||
      (resolveHost(w, a)!.role === 'search_head' && resolveHost(w, b)!.role === 'search_head'
        ? Number(a === captain) - Number(b === captain)
        : 0) ||
      a.localeCompare(b),
  );
}
export function maintenanceStorage(w: World, host: string) {
  return modeledOptStorage(w, maintenanceHost(w, host));
}
/** Pure bounded preflight; capture/queue are separate operations. */
export function inspectUpgrade(w: World, targets: string[], targetVersion = MAINTENANCE_TARGET) {
  if (!targets.length || targets.length > 20 || new Set(targets).size !== targets.length)
    throw new OperationsError('Choose 1–20 unique Enterprise hosts');
  for (const host of targets) maintenanceHost(w, host);
  const ordered = upgradeOrder(w, targets),
    issues: string[] = [],
    sourceRevisions: Record<string, string> = {},
    artifactDigests: Record<string, string> = {},
    backupIds: Record<string, string> = {};
  if (targetVersion !== MAINTENANCE_TARGET)
    issues.push('Only the explicit 9.4.1 → 9.4.2 teaching patch upgrade is supported');
  if (w.clusterManagement?.jobs.some((j) => j.status === 'running' || j.status === 'paused'))
    issues.push('Finish the active cluster/SHC operation before package maintenance');
  const planned = new Set<string>();
  for (const host of ordered) {
    const p = maintenanceHost(w, host),
      fs = hostFs(w, p),
      current = splunkVersion(w, p)!;
    if (current !== '9.4.1' && current !== targetVersion)
      issues.push(host + ': unsupported starting version ' + current);
    if (!splunkdRunning(w, p)) issues.push(host + ': service is unavailable before the maintenance window');
    sourceRevisions[host] = configurationFingerprint(w, host);
    try {
      const artifact = enterpriseArtifact(w, host);
      if (artifact.version !== targetVersion)
        throw new OperationsError('Artifact version differs from planned target');
      const manifest = fs.readFile(artifact.path + '.sha256', { user: 'splunk', groups: ['splunk'] }).trim();
      if (manifest !== artifact.digest + '  ' + artifact.path)
        throw new OperationsError('Package SHA-256 manifest differs from the verified teaching artifact');
      artifactDigests[host] = artifact.digest;
    } catch (e) {
      issues.push(host + ': ' + (e as Error).message);
    }
    const backup = w.maintenance?.backups
      .slice()
      .reverse()
      .find(
        (b) =>
          b.host === host &&
          b.sourceRevision === sourceRevisions[host] &&
          b.packageVersion === current &&
          b.verified !== undefined,
      );
    if (!backup) issues.push(host + ': verify a current configuration archive before upgrading');
    else {
      try {
        if (backup.digest !== sha256Text(fs.readFile(backup.path, { user: 'splunk', groups: ['splunk'] })))
          throw new Error('Configuration backup integrity changed');
        backupIds[host] = backup.id;
      } catch (e) {
        issues.push(host + ': ' + (e as Error).message);
      }
    }
    const storage = maintenanceStorage(w, host);
    if (!Number.isFinite(storage.minimumMB) || storage.availableMB < storage.minimumMB)
      issues.push(
        host + ': insufficient modeled free space for active minFreeSpace / teaching upgrade reserve',
      );
    const syntax = Object.entries(filesUnder(fs, p.splunk!.home + '/etc'))
      .filter(([name]) => name.endsWith('.conf'))
      .filter(([, text]) => parseConf(text).errors.length);
    if (syntax.length)
      issues.push(
        host + ': invalid native configuration syntax in ' + syntax.map(([name]) => name).join(', '),
      );
    for (const required of upgradePrerequisites(w, host))
      if (splunkVersion(w, resolveHost(w, required)!) !== targetVersion && !planned.has(required))
        issues.push(host + ': upgrade ' + required + ' first (LM → CM → Deployer/SH → indexers)');
    if (p.role === 'search_head') {
      if (!w.kvstore) issues.push(host + ': initialize KV Store and take an independent data backup');
      else
        try {
          const status = kvStatus(w, host),
            node = kvNode(w, host),
            domain = w.kvstore!.domains[node.domain]!;
          if (status.status !== 'ready' || !status.writable || !status.membersInSync)
            issues.push(host + ': KV Store is not healthy and synchronized');
          if (
            !w.kvstore!.backups.some(
              (b) => b.domain === node.domain && JSON.stringify(b.rows) === JSON.stringify(domain.rows),
            )
          )
            issues.push(host + ': take a current independent KV Store data backup');
        } catch (e) {
          issues.push(host + ': KV preflight ' + (e as Error).message);
        }
      if (w.config.profile?.infra.searchHeadCluster.deployer && !shcHealth(w).majority)
        issues.push(host + ': SHC quorum is unavailable');
    }
    planned.add(host);
  }
  if (ordered.some((host) => resolveHost(w, host)!.role === 'indexer')) {
    if (!w.clusterManagement)
      issues.push('Enable and inspect V7 cluster operations before a controlled indexer upgrade');
    else {
      const health = advancedClusterHealth(w);
      if (!health.searchFactorMet || !health.replicationMet || !health.allDataSearchable)
        issues.push('Restore recorded-bucket replication/search factors before upgrading indexers');
      if (health.members.filter((p) => p.joined).length < 3)
        issues.push('A controlled peer upgrade requires at least three available peers');
    }
  }
  return {
    targets: ordered,
    targetVersion,
    valid: issues.length === 0,
    issues,
    sourceRevisions,
    artifactDigests,
    backupIds,
  };
}
export function captureUpgradePreflight(w: World, targets: string[], targetVersion = MAINTENANCE_TARGET) {
  const result = inspectUpgrade(w, targets, targetVersion),
    s = maintenanceState(w),
    record: UpgradePreflight = { ...result, id: 'upgrade-preflight-' + s.nextId++, tick: w.clock.tick };
  s.preflights.push(record);
  s.preflights = s.preflights.slice(-50);
  persistMaintenance(w);
  return structuredClone(record);
}
