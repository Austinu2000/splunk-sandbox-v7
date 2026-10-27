import type { World } from '../world';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { clusterReceipt } from './cluster-state';
import { OperationsError } from './access';
export function shcHealth(world: World) {
  const configured = !!world.config.profile?.infra.searchHeadCluster.deployer;
  const members = world.infra
    .filter((n) => n.role === 'search_head' && !n.retired && n.hostname !== 'es01')
    .map((n) => {
      const p = resolveHost(world, n.hostname)!,
        c = runningConf(world, p, 'server'),
        enabled = configured && !confBool(setting(c, 'shclustering', 'disabled') ?? 'false'),
        uri = setting(c, 'shclustering', 'mgmt_uri') ?? 'https://' + p.fqdn + ':8089',
        replicationPort = Number(setting(c, 'shclustering', 'replication_port') ?? 8181);
      let reason = enabled ? '' : 'Search head clustering is disabled';
      try {
        const target = new URL(uri);
        if (
          target.protocol !== 'https:' ||
          target.port !== '8089' ||
          resolveHost(world, target.hostname)?.hostname !== p.hostname
        )
          reason = 'Member mgmt_uri does not identify this search head';
      } catch {
        reason = 'Invalid member mgmt_uri';
      }
      if (!splunkdRunning(world, p)) reason = 'splunkd is stopped';
      if (replicationPort !== 8181) reason = 'Practice SHC transport expects port 8181';
      return {
        host: p.hostname,
        running: splunkdRunning(world, p),
        enabled,
        available: enabled && !reason,
        reason,
        mgmtUri: uri,
        replicationPort,
      };
    });
  const available = members.filter((m) => m.available),
    majority = configured && members.length >= 3 && available.length > members.length / 2,
    state = world.clusterManagement?.shc,
    captain = majority && available.some((m) => m.host === state?.captain) ? state!.captain : null;
  return {
    configured,
    members,
    available: available.length,
    majority,
    captain,
    term: state?.term ?? 0,
    electionPending: majority && !captain,
    quorumRequired: Math.floor(members.length / 2) + 1,
  };
}
export function tickShcElection(world: World) {
  if (!world.clusterManagement) return;
  const health = shcHealth(world),
    state = world.clusterManagement.shc;
  if (!health.configured) return;
  const next = health.majority
    ? (health.captain ??
      health.members
        .filter((m) => m.available)
        .map((m) => m.host)
        .sort()[0] ??
      null)
    : null;
  if (next !== state.captain) {
    state.captain = next;
    state.term++;
    state.elections.push({ tick: world.clock.tick, captain: next, term: state.term });
    state.elections = state.elections.slice(-50);
    clusterReceipt(
      world,
      'shc.election',
      next ?? 'none',
      'Term ' + state.term + '; ' + (next ? 'captain selected from available members' : 'no majority'),
    );
  }
}
export function requireShcWritable(world: World, host: string) {
  if (!world.clusterManagement || !shcHealth(world).configured) return;
  const h = shcHealth(world);
  if (!h.members.some((m) => m.host === host)) return;
  if (
    world.clusterManagement.shc.replication.filter((r) => r.completed.length < r.targets.length).length >= 30
  )
    throw new OperationsError('SHC replication backlog is full; advance or repair members first');
  if (
    world.clusterManagement.jobs.some(
      (j) => j.kind.startsWith('shc-') && ['running', 'paused'].includes(j.status),
    )
  )
    throw new OperationsError('Finish the coordinated SHC operation before editing replicated knowledge');
  if (!h.majority || !h.captain || !h.members.find((m) => m.host === host)?.available)
    throw new OperationsError(
      'Restore an available SHC captain, a majority and the writing member before changing replicated knowledge',
    );
}
