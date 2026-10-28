import type { UpgradeJob } from '@sandbox/shared';
import type { World } from '../world';
import { splunkVersion, splunkdRunning, resolveHost } from '../hosts/profile';
import { stopSplunk, startSplunk } from '../hosts/running';
import { configurationFingerprint } from './config-backup';
import { inspectUpgrade, upgradePrerequisites, maintenanceStorage } from './upgrade-preflight';
import { advancedClusterHealth } from './cluster-health';
import { shcHealth } from './shc-health';
import { persistClusterManagement } from './cluster-state';
import { requireCapability, OperationsError } from './access';
import {
  maintenanceHost,
  maintenanceState,
  MAINTENANCE_PACKAGE,
  enterpriseArtifact,
  maintenanceReceipt,
  persistMaintenance,
} from './maintenance-state';
export function installEnterprisePackage(w: World, host: string, path = MAINTENANCE_PACKAGE) {
  const p = maintenanceHost(w, host),
    artifact = enterpriseArtifact(w, host, path),
    current = splunkVersion(w, p)!;
  if (current.localeCompare(artifact.version, undefined, { numeric: true }) > 0)
    throw new OperationsError(
      'Package downgrade is unsupported; configuration restore does not revert installed binaries',
    );
  if (current === artifact.version) return false;
  if (
    w.maintenance?.jobs.some(
      (j) =>
        (j.status === 'running' || j.status === 'paused') &&
        !(j.status === 'running' && j.targets[j.cursor] === host && j.phase === 'stopped'),
    )
  )
    throw new OperationsError(
      'Finish the active Enterprise upgrade before a separate manual package installation',
    );
  if (splunkdRunning(w, p))
    throw new OperationsError('Stop this virtual Enterprise service before unpacking the verified package');
  for (const required of upgradePrerequisites(w, host))
    if (
      splunkVersion(w, resolveHost(w, required)!) !== artifact.version ||
      !splunkdRunning(w, resolveHost(w, required)!)
    )
      throw new OperationsError('Upgrade and restore ' + required + ' before installing ' + host);
  if (
    ['indexer', 'search_head'].includes(p.role) &&
    !w.maintenance?.jobs.some(
      (j) => j.status === 'running' && j.targets[j.cursor] === host && j.phase === 'stopped',
    )
  )
    throw new OperationsError(
      'Use the reviewed coordinator for cluster peer/search-head package maintenance',
    );
  const capacity = maintenanceStorage(w, host);
  if (!Number.isFinite(capacity.minimumMB) || capacity.availableMB < capacity.minimumMB)
    throw new OperationsError('Insufficient modeled space at package installation');
  const source = configurationFingerprint(w, host);
  if (
    !w.maintenance?.preflights.some(
      (f) =>
        f.valid &&
        f.targetVersion === artifact.version &&
        f.targets.includes(host) &&
        f.sourceRevisions[host] === source &&
        f.artifactDigests[host] === artifact.digest,
    )
  )
    throw new OperationsError(
      'Capture a valid current upgrade preflight before applying this teaching package',
    );
  const s = maintenanceState(w);
  s.installations[host] = { version: artifact.version, licenseAccepted: false, installedTick: w.clock.tick };
  maintenanceReceipt(
    w,
    host,
    'package-upgrade',
    current + ' → ' + artifact.version + '; actual configuration and recorded data retained',
  );
  return true;
}
export function acceptEnterpriseTrainingLicense(w: World, host: string) {
  const installed = w.maintenance?.installations[host];
  if (!installed || installed.licenseAccepted) return false;
  installed.licenseAccepted = true;
  maintenanceReceipt(
    w,
    host,
    'training-license',
    'Nonbinding simulation flag accepted; no real license agreement',
  );
  return true;
}
function activeClusterJob(w: World) {
  return w.clusterManagement?.jobs.some((j) => j.status === 'running' || j.status === 'paused');
}
export function queueEnterpriseUpgrade(w: World, preflightId: string, acceptTrainingLicense: boolean) {
  const s = maintenanceState(w),
    preflight = s.preflights.find((p) => p.id === preflightId);
  if (!preflight?.valid) throw new OperationsError('Choose a captured valid upgrade preflight');
  if (!acceptTrainingLicense)
    throw new OperationsError(
      'Acknowledge the nonbinding teaching package flag before this simulated workflow',
    );
  for (const host of preflight.targets) requireCapability(w, host, 'admin', 'indexes_edit');
  if (s.jobs.some((j) => j.status === 'running' || j.status === 'paused') || activeClusterJob(w))
    throw new OperationsError('Finish the current maintenance or cluster job first');
  const now = inspectUpgrade(w, preflight.targets, preflight.targetVersion);
  if (
    !now.valid ||
    JSON.stringify(now.sourceRevisions) !== JSON.stringify(preflight.sourceRevisions) ||
    JSON.stringify(now.artifactDigests) !== JSON.stringify(preflight.artifactDigests) ||
    JSON.stringify(now.backupIds) !== JSON.stringify(preflight.backupIds)
  )
    throw new OperationsError(
      'Preflight source, artifact, backup or operational readiness changed; review again: ' +
        now.issues.join('; '),
    );
  const targets = preflight.targets.filter(
    (host) => splunkVersion(w, resolveHost(w, host)!) !== preflight.targetVersion,
  );
  if (!targets.length)
    throw new OperationsError('All reviewed hosts are already at the target; no upgrade job created');
  const job: UpgradeJob = {
    id: 'enterprise-upgrade-' + s.nextId++,
    targets,
    targetVersion: preflight.targetVersion,
    preflightId,
    cursor: 0,
    phase: 'queued',
    status: 'running',
    started: w.clock.tick,
    completed: [],
    sourceRevisions: { ...preflight.sourceRevisions },
    artifactDigests: { ...preflight.artifactDigests },
    acceptTrainingLicense,
    priorMaintenance: w.clusterManagement?.manualMaintenance ?? false,
    events: [],
  };
  s.jobs.push(job);
  s.jobs = s.jobs.slice(-20);
  persistMaintenance(w);
  return structuredClone(job);
}
function sourceGuard(w: World, job: UpgradeJob) {
  for (const host of job.targets) {
    if (configurationFingerprint(w, host) !== job.sourceRevisions[host])
      throw new OperationsError(
        'Native configuration changed on ' + host + '; restore the reviewed source before resuming',
      );
    if (!job.completed.includes(host) && enterpriseArtifact(w, host).digest !== job.artifactDigests[host])
      throw new OperationsError(
        'Package artifact changed on ' + host + '; restore the verified staged artifact',
      );
  }
  if (activeClusterJob(w))
    throw new OperationsError('An independent cluster operation blocks package maintenance');
}
function safeToStop(w: World, host: string) {
  const p = maintenanceHost(w, host);
  if (p.role === 'indexer') {
    if (!w.clusterManagement)
      throw new OperationsError('Enable V7 recorded cluster operations before a peer upgrade');
    const h = advancedClusterHealth(w),
      others = h.members.filter((peer) => peer.joined && peer.host !== host);
    if (others.length < 2 || !h.allDataSearchable || !h.searchFactorMet)
      throw new OperationsError('Restore healthy searchable peer capacity before stopping another indexer');
    for (const bucket of h.buckets)
      if (!bucket.copies.some((copy) => copy.available && copy.searchable && copy.host !== host))
        throw new OperationsError('A recorded bucket has no available search copy outside ' + host);
  }
  if (p.role === 'search_head' && w.config.profile?.infra.searchHeadCluster.deployer) {
    const h = shcHealth(w);
    if (h.members.filter((m) => m.available && m.host !== host).length <= h.members.length / 2)
      throw new OperationsError('The next SHC member would remove the available majority');
  }
}
function releaseMaintenance(w: World, job: UpgradeJob) {
  if (w.clusterManagement) {
    w.clusterManagement.manualMaintenance = job.priorMaintenance;
    persistClusterManagement(w);
  }
}
export function tickEnterpriseUpgrades(w: World) {
  for (const job of w.maintenance?.jobs ?? []) {
    if (job.status !== 'running') continue;
    const host = job.targets[job.cursor]!;
    try {
      sourceGuard(w, job);
      const p = maintenanceHost(w, host);
      if (job.phase === 'queued') {
        safeToStop(w, host);
        if (p.role === 'indexer' && w.clusterManagement) {
          w.clusterManagement.manualMaintenance = true;
          persistClusterManagement(w);
        }
        job.phase = 'draining';
        job.events.push({
          tick: w.clock.tick,
          host,
          phase: 'draining',
          detail: 'Reviewed source/artifact and surviving search capacity',
        });
      } else if (job.phase === 'draining') {
        safeToStop(w, host);
        stopSplunk(w, p);
        job.phase = 'stopped';
        job.events.push({
          tick: w.clock.tick,
          host,
          phase: 'stopped',
          detail: 'Only this reviewed host stopped',
        });
      } else if (job.phase === 'stopped') {
        installEnterprisePackage(w, host);
        job.phase = 'installed';
        job.events.push({
          tick: w.clock.tick,
          host,
          phase: 'installed',
          detail: 'Verified target version installed; configuration/data preserved',
        });
      } else if (job.phase === 'installed') {
        if (job.acceptTrainingLicense) acceptEnterpriseTrainingLicense(w, host);
        startSplunk(w, p);
        job.phase = 'verifying';
        job.events.push({
          tick: w.clock.tick,
          host,
          phase: 'started',
          detail: 'Virtual service restarted on the actual target version',
        });
      } else {
        if (!splunkdRunning(w, p) || splunkVersion(w, p) !== job.targetVersion)
          throw new OperationsError('Post-upgrade service/version verification failed');
        if (p.role === 'indexer') {
          const h = advancedClusterHealth(w);
          if (!h.allDataSearchable)
            throw new OperationsError('Recorded data is not searchable after peer recovery');
        }
        job.completed.push(host);
        job.cursor++;
        job.phase = 'queued';
        job.events.push({
          tick: w.clock.tick,
          host,
          phase: 'verified',
          detail: 'Actual version/service verified',
        });
        if (job.cursor === job.targets.length) {
          job.status = 'completed';
          releaseMaintenance(w, job);
        }
      }
    } catch (e) {
      job.status = 'paused';
      job.error = (e as Error).message;
      job.events.push({ tick: w.clock.tick, host, phase: 'paused', detail: job.error });
    }
    persistMaintenance(w);
  }
}
export function resumeEnterpriseUpgrade(w: World, id: string) {
  const job = w.maintenance?.jobs.find((j) => j.id === id);
  if (!job || job.status !== 'paused') throw new OperationsError('Choose a paused Enterprise upgrade');
  sourceGuard(w, job);
  job.status = 'running';
  delete job.error;
  job.events.push({
    tick: w.clock.tick,
    host: job.targets[job.cursor]!,
    phase: 'resumed',
    detail: 'Reviewed source and verified package restored; completed hosts retained',
  });
  persistMaintenance(w);
  return structuredClone(job);
}
export function abortEnterpriseUpgrade(w: World, id: string) {
  const job = w.maintenance?.jobs.find((j) => j.id === id);
  if (!job || !['running', 'paused'].includes(job.status))
    throw new OperationsError('Choose an active Enterprise upgrade');
  job.status = 'aborted';
  releaseMaintenance(w, job);
  job.events.push({
    tick: w.clock.tick,
    host: job.targets[job.cursor]!,
    phase: 'aborted',
    detail: 'Workflow stopped; installed versions and current service state retained for explicit recovery',
  });
  persistMaintenance(w);
  return structuredClone(job);
}
