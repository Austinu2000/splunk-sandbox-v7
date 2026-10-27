import type { World } from '../world';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { startSplunk, stopSplunk } from '../hosts/running';
import { clusterMembership } from './cluster-health';
import { clusterReceipt, persistClusterManagement } from './cluster-state';
import { OperationsError } from './access';
/** Explicit lab fault control. This is not a native Splunk management command. */
export function setClusterSiteOutage(world: World, site: string, unavailable: boolean) {
  const state = world.clusterManagement;
  if (!state) throw new OperationsError('Enable V7 cluster operations first');
  if (state.jobs.some((j) => ['running', 'paused'].includes(j.status)))
    throw new OperationsError('Finish the coordinated operation before injecting a site fault');
  const peers = clusterMembership(world).filter((m) => m.nativeSite === site);
  if (!peers.length) throw new OperationsError('Choose an existing native site containing indexers');
  const faults = (state.siteFaults ??= {}),
    existing = faults[site];
  if (unavailable) {
    if (existing && !existing.restored) throw new OperationsError('This site fault is already active');
    const hosts = peers.filter((m) => splunkdRunning(world, resolveHost(world, m.host)!)).map((m) => m.host);
    for (const host of hosts) stopSplunk(world, resolveHost(world, host)!);
    faults[site] = { hosts, started: world.clock.tick };
    clusterReceipt(
      world,
      'lab.site-outage',
      site,
      'Stopped only the previously running peers: ' + hosts.join(', '),
    );
  } else {
    if (!existing || existing.restored !== undefined)
      throw new OperationsError('No active injected site fault to restore');
    for (const host of existing.hosts) startSplunk(world, resolveHost(world, host)!);
    existing.restored = world.clock.tick;
    clusterReceipt(
      world,
      'lab.site-restored',
      site,
      'Restored only the peers stopped by this fault: ' + existing.hosts.join(', '),
    );
  }
  persistClusterManagement(world);
  return faults[site];
}
