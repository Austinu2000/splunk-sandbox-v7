import { validateSmartStoreBundle } from './smartstore';
import type { ClusterOperationJob } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost, splunkdRunning, type HostProfile } from '../hosts/profile';
import { stopSplunk, startSplunk } from '../hosts/running';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { filesUnder, checksum, managerBundle, peerBundle } from '../hosts/cluster';
import { validateClusterIndexes } from './indexes';
import { parseConf } from '../conf/parse';
import { advancedClusterHealth, clusterManager } from './cluster-health';
import { enableClusterManagement, persistClusterManagement, clusterReceipt } from './cluster-state';
import { OperationsError } from './access';
export function clusterSourceRevision(world: World, host: string) {
  const p = resolveHost(world, host);
  if (!p?.splunk) throw new OperationsError('Choose a Splunk host');
  return checksum(filesUnder(hostFs(world, p), p.splunk.home + '/etc'));
}
export function inspectClusterBundle(world: World, manager: HostProfile) {
  if (manager.role !== 'cluster_manager')
    throw new OperationsError('Validate a manager-apps bundle on the Cluster Manager');
  const files = managerBundle(world, manager),
    issues: string[] = [];
  if (Object.keys(files).length > 500 || JSON.stringify(files).length > 2000000)
    issues.push('Bundle limit: 500 files / 2 MB');
  for (const [path, text] of Object.entries(files)) {
    if (!/^[A-Za-z0-9_.-]+\//.test(path) || path.split('/').includes('..'))
      issues.push('Invalid bundle path: ' + path);
    if (path.endsWith('.conf')) {
      const parsed = parseConf(text);
      if (parsed.errors.length) issues.push('Invalid configuration syntax: ' + path);
    }
  }
  try {
    validateClusterIndexes(files);
    validateSmartStoreBundle(files);
  } catch (e) {
    issues.push((e as Error).message);
  }
  return { checksum: checksum(files), valid: issues.length === 0, issues, files };
}
export function validateManagedClusterBundle(world: World, manager: HostProfile) {
  const state = enableClusterManagement(world),
    result = inspectClusterBundle(world, manager);
  const record = {
    id: 'validation-' + state.nextId++,
    tick: world.clock.tick,
    manager: manager.hostname,
    checksum: result.checksum,
    valid: result.valid,
    issues: result.issues,
  };
  state.validations.push(record);
  state.validations = state.validations.slice(-30);
  persistClusterManagement(world);
  return record;
}
export function createClusterJob(
  world: World,
  input: Pick<
    ClusterOperationJob,
    'kind' | 'manager' | 'targets' | 'files' | 'checksum' | 'priorMaintenance'
  >,
) {
  if (world.maintenance?.jobs.some((j) => j.status === 'running' || j.status === 'paused'))
    throw new OperationsError('Finish the Enterprise upgrade before a separate cluster operation');
  const state = enableClusterManagement(world);
  if (state.jobs.some((j) => j.status === 'running' || j.status === 'paused'))
    throw new OperationsError('Finish or abort the existing cluster operation first');
  const job: ClusterOperationJob = {
    ...input,
    id: 'cluster-job-' + state.nextId++,
    completed: [],
    cursor: 0,
    phase: 'queued',
    status: 'running',
    started: world.clock.tick,
    sourceRevisions: Object.fromEntries(input.targets.map((h) => [h, clusterSourceRevision(world, h)])),
    events: [],
  };
  state.jobs.push(job);
  state.jobs = state.jobs.slice(-10);
  clusterReceipt(world, 'job.queued', input.manager, job.id + ' ' + input.kind);
  persistClusterManagement(world);
  return job;
}
export function queueIndexerRestart(world: World, manager: HostProfile, siteOrder?: string[]) {
  if (manager.hostname !== clusterManager(world).hostname)
    throw new OperationsError('Initiate a coordinated restart on the Cluster Manager');
  enableClusterManagement(world);
  const health = advancedClusterHealth(world);
  if (
    !health.managerAvailable ||
    health.issues.length ||
    !health.searchFactorMet ||
    !health.allDataSearchable ||
    health.buckets.some((b) => b.copies.filter((c) => c.available && c.searchable).length < 2)
  )
    throw new OperationsError(
      'Restart rejected: restore search factor and at least two available searchable copies of every bucket',
    );
  if (health.members.some((m) => !m.joined))
    throw new OperationsError('Restore peer membership and services before the coordinated restart');
  if (
    siteOrder &&
    (new Set(siteOrder).size !== siteOrder.length ||
      siteOrder.some((site) => !health.members.some((m) => m.nativeSite === site)))
  )
    throw new OperationsError('Use unique configured native sites in site-order');
  const targets = health.members
    .filter((m) => !siteOrder || siteOrder.includes(m.nativeSite))
    .sort(
      (a, b) =>
        (siteOrder
          ? siteOrder.indexOf(a.nativeSite) - siteOrder.indexOf(b.nativeSite)
          : a.nativeSite.localeCompare(b.nativeSite)) || a.host.localeCompare(b.host),
    )
    .map((m) => m.host);
  return createClusterJob(world, {
    kind: 'indexer-restart',
    manager: manager.hostname,
    targets,
    priorMaintenance: health.maintenance,
  });
}
export function queueIndexerBundle(world: World, manager: HostProfile) {
  const state = enableClusterManagement(world),
    result = inspectClusterBundle(world, manager);
  if (!result.valid) throw new OperationsError(result.issues.join('; '));
  if (
    !state.validations.some(
      (v) => v.manager === manager.hostname && v.checksum === result.checksum && v.valid,
    )
  )
    throw new OperationsError('Validate the current manager bundle before publishing it');
  const health = advancedClusterHealth(world);
  if (
    !health.managerAvailable ||
    !health.searchFactorMet ||
    !health.allDataSearchable ||
    health.members.some((m) => !m.joined)
  )
    throw new OperationsError('Restore manager, peer membership and searchable data before publishing');
  return createClusterJob(world, {
    kind: 'indexer-bundle',
    manager: manager.hostname,
    targets: health.members.map((m) => m.host).sort(),
    files: result.files,
    checksum: result.checksum,
    priorMaintenance: health.maintenance,
  });
}
function event(world: World, j: ClusterOperationJob, host: string, phase: string, detail: string) {
  j.events.push({ tick: world.clock.tick, host, phase, detail });
  j.events = j.events.slice(-200);
}
/** One service transition per simulation tick; a stopped peer is observable by every other surface. */
export function tickIndexerJob(world: World, job: ClusterOperationJob) {
  if (job.status !== 'running' || !job.kind.startsWith('indexer-')) return;
  const name = job.targets[job.cursor];
  if (!name) {
    job.status = 'completed';
    job.finished = world.clock.tick;
    clusterReceipt(world, 'job.completed', job.manager, job.id);
    return;
  }
  const peer = resolveHost(world, name);
  if (!peer?.splunk) {
    job.status = 'paused';
    job.error = 'Target no longer exists';
    return;
  }
  try {
    const health = advancedClusterHealth(world);
    if (!health.managerAvailable) throw new OperationsError('Manager unavailable; operation paused');
    if (job.phase === 'queued') {
      if (!health.members.find((m) => m.host === name)?.joined)
        throw new OperationsError('Peer is not joined and running: ' + name);
      if (clusterSourceRevision(world, name) !== job.sourceRevisions[name])
        throw new OperationsError(
          'Target configuration changed after preflight; abort and review the new source',
        );
      if (
        health.buckets.some(
          (b) =>
            b.copies.some((c) => c.host === name) &&
            !b.copies.some((c) => c.host !== name && c.available && c.searchable),
        )
      )
        throw new OperationsError('No other searchable copy; repair bucket coverage first');
      job.phase = 'draining';
      event(world, job, name, 'draining', 'Other searchable replicas verified before service stop');
    } else if (job.phase === 'draining') {
      if (clusterSourceRevision(world, name) !== job.sourceRevisions[name])
        throw new OperationsError('Target configuration changed during drain');
      stopSplunk(world, peer);
      job.phase = 'stopped';
      event(world, job, name, 'stopped', 'Only this peer is stopped by the coordinator');
    } else if (job.phase === 'stopped') {
      if (clusterSourceRevision(world, name) !== job.sourceRevisions[name])
        throw new OperationsError('Stopped target source changed; review and recover the peer explicitly');
      if (job.kind === 'indexer-bundle') {
        const fs = hostFs(world, peer),
          base = peer.splunk.home + '/etc/peer-apps',
          files = job.files!;
        for (const old of Object.keys(filesUnder(fs, base)))
          if (!Object.hasOwn(files, old)) fs.remove(base + '/' + old, ROOT);
        for (const [path, text] of Object.entries(files)) {
          fs.mkdir((base + '/' + path).replace(/\/[^/]+$/, ''), ROOT, { parents: true });
          fs.writeFile(base + '/' + path, text, ROOT);
        }
      }
      startSplunk(world, peer);
      job.phase = 'verifying';
      event(world, job, name, 'verifying', 'Service restarted from the reviewed source');
    } else {
      if (!splunkdRunning(world, peer) || !health.members.find((m) => m.host === name)?.joined)
        throw new OperationsError('Peer failed to rejoin after restart');
      if (job.kind === 'indexer-bundle') {
        if (checksum(peerBundle(world, peer)) !== job.checksum)
          throw new OperationsError('Running peer bundle differs from the published artifact');
        world.clusterManagement!.peerBundles[name] = {
          checksum: job.checksum!,
          paths: Object.keys(job.files!),
        };
      }
      job.completed.push(name);
      job.cursor++;
      job.phase = 'queued';
      event(world, job, name, 'completed', 'Peer rejoined; continuing to the next peer');
    }
  } catch (e) {
    job.status = 'paused';
    job.error = (e as Error).message;
    event(world, job, name, 'paused', job.error);
  }
}
export function abortClusterJob(world: World, id: string) {
  const job = world.clusterManagement?.jobs.find((j) => j.id === id);
  if (!job || !['running', 'paused'].includes(job.status))
    throw new OperationsError('No active job to abort');
  if (job.kind === 'indexer-bundle' || job.kind === 'shc-bundle')
    throw new OperationsError(
      'Bundle-driven restarts must finish to avoid inconsistent members; restore the precondition and resume',
    );
  job.status = 'aborted';
  job.finished = world.clock.tick;
  clusterReceipt(
    world,
    'job.aborted',
    job.manager,
    job.id + '; inspect any stopped target before an explicit recovery start',
  );
  persistClusterManagement(world);
  return job;
}

export function resumeClusterJob(world: World, id: string) {
  const job = world.clusterManagement?.jobs.find((j) => j.id === id);
  if (!job || job.status !== 'paused') throw new OperationsError('Choose a paused operation');
  const host = job.targets[job.cursor];
  if (!host) throw new OperationsError('No pending target');
  if (job.phase !== 'verifying' && clusterSourceRevision(world, host) !== job.sourceRevisions[host])
    throw new OperationsError('Restore the target source that passed preflight before resuming');
  job.status = 'running';
  delete job.error;
  clusterReceipt(world, 'job.resumed', job.manager, job.id);
  persistClusterManagement(world);
  return job;
}
