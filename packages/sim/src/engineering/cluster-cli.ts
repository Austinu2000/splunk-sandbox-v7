import type { CommandFn } from '../shell/types';
import { ok, fail } from '../shell/types';
import { clusterPolicy, clusterMembership, advancedClusterHealth, clusterManager } from './cluster-health';
import { validateManagedClusterBundle, queueIndexerRestart, abortClusterJob } from './cluster-jobs';
import { persistClusterManagement, clusterReceipt, enableClusterManagement } from './cluster-state';
import { fixturePrincipal } from './index-commands';
import { requireCapability, OperationsError } from './access';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { patchConf } from '../scenario/engine';
import { runningConf, vfsReader } from '../hosts/running';
import { loadConf, setting } from '../conf/merge';
import { resolveHost } from '../hosts/profile';
import type { World } from '../world';
export function setClusterMaintenance(world: World, enabled: boolean) {
  if (world.maintenance?.jobs.some((j) => j.status === 'running' || j.status === 'paused'))
    throw new OperationsError(
      'The active Enterprise upgrade owns its maintenance window; finish or abort it first',
    );
  const state = enableClusterManagement(world);
  state.manualMaintenance = enabled;
  clusterReceipt(world, 'maintenance', clusterManager(world).hostname, String(enabled));
  persistClusterManagement(world);
  return clusterPolicy(world);
}
export function stageClusterSettings(world: World, host: string, settings: Record<string, string>) {
  const p = resolveHost(world, host);
  if (!p?.splunk || !['cluster_manager', 'indexer', 'search_head'].includes(p.role))
    throw new OperationsError('Choose an indexer cluster manager, peer or search head');
  const allowed =
    p.role === 'cluster_manager'
      ? [
          'mode',
          'replication_factor',
          'search_factor',
          'multisite',
          'site_replication_factor',
          'site_search_factor',
          'rolling_restart',
        ]
      : ['mode', 'manager_uri', 'master_uri'];
  if (!Object.keys(settings).length) throw new OperationsError('Provide supported clustering settings');
  for (const [key, value] of Object.entries(settings)) {
    if (!allowed.includes(key) || typeof value !== 'string' || value.length > 300 || /[\r\n]/.test(value))
      throw new OperationsError('Unsupported cluster setting: ' + key);
    if (
      ['replication_factor', 'search_factor'].includes(key) &&
      (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 100)
    )
      throw new OperationsError('Factors must be integers from 1 to 100');
    if (key === 'multisite' && !['true', 'false', '0', '1'].includes(value))
      throw new OperationsError('multisite must be a boolean');
    if (
      key === 'mode' &&
      !(
        p.role === 'cluster_manager'
          ? ['manager', 'master']
          : p.role === 'indexer'
            ? ['peer', 'slave']
            : ['searchhead']
      ).includes(value)
    )
      throw new OperationsError('Mode does not match this component');
    if (key === 'rolling_restart' && value !== 'searchable')
      throw new OperationsError('Only searchable coordinated restart is implemented by this model');
  }
  const fs = hostFs(world, p),
    path = p.splunk.home + '/etc/system/local/server.conf';
  fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(path, patchConf(fs.exists(path) ? fs.readFile(path, ROOT) : '', 'clustering', settings), ROOT);
  return { host: p.hostname, path, activation: 'restart-required' };
}
export const clusterCli: CommandFn = (ctx) => {
  const { world, sh, argv } = ctx,
    [verb, subject, ...raw] = argv.slice(1);
  try {
    if (!world.clusterManagement)
      return fail('Enable V7 cluster operations from Settings → Indexer Clustering before this workflow');
    const args = [...raw],
      values: Record<string, string> = {};
    let auth: string | undefined;
    for (let n = 0; n < args.length; n++) {
      const key = args[n]!;
      if (key === '--verbose' || key === '--answer-yes') continue;
      if (!key.startsWith('-') || args[n + 1] === undefined)
        throw new OperationsError('Use named cluster options and explicit values');
      const value = args[++n]!;
      if (key === '-auth') auth = value;
      else values[key.slice(1)] = value;
    }
    const principal = fixturePrincipal(auth);
    if (['show', 'list', 'validate', 'abort'].includes(verb ?? '') && Object.keys(values).length)
      throw new OperationsError('Unsupported option for this cluster operation');
    if (verb === 'show' && subject === 'cluster-status')
      return ok(JSON.stringify(advancedClusterHealth(world), null, 2) + '\n');
    if (verb === 'list' && subject === 'cluster-peers')
      return ok(JSON.stringify(clusterMembership(world), null, 2) + '\n');
    if (verb === 'list' && subject === 'cluster-config')
      return ok(
        JSON.stringify(
          {
            running: Object.fromEntries(
              [...(runningConf(world, sh.host, 'server').stanzas.get('clustering')?.settings ?? [])].map(
                ([k, v]) => [k, v.value],
              ),
            ),
            declared: Object.fromEntries(
              [
                ...(loadConf(vfsReader(hostFs(world, sh.host)), sh.host.splunk!.home, 'server').stanzas.get(
                  'clustering',
                )?.settings ?? []),
              ].map(([k, v]) => [k, v.value]),
            ),
          },
          null,
          2,
        ) + '\n',
      );
    if (verb === 'show' && subject === 'cluster-bundle-status')
      return ok(
        JSON.stringify(
          { jobs: world.clusterManagement.jobs, peers: world.clusterManagement.peerBundles },
          null,
          2,
        ) + '\n',
      );
    requireCapability(world, clusterManager(world).hostname, principal, 'edit_indexer_cluster');
    if (verb === 'edit' && subject === 'cluster-config') {
      return ok(JSON.stringify(stageClusterSettings(world, sh.host.hostname, values), null, 2) + '\n');
    }
    if (verb === 'validate' && subject === 'cluster-bundle')
      return ok(JSON.stringify(validateManagedClusterBundle(world, sh.host), null, 2) + '\n');
    if (['enable', 'disable'].includes(verb ?? '') && subject === 'maintenance-mode') {
      if (sh.host.role !== 'cluster_manager')
        throw new OperationsError('Manage maintenance on the Cluster Manager');
      if (Object.keys(values).length)
        throw new OperationsError('Maintenance mode does not accept these options');
      return ok(JSON.stringify(setClusterMaintenance(world, verb === 'enable'), null, 2) + '\n');
    }
    if (verb === 'rolling-restart' && subject === 'cluster-peers') {
      for (const key of Object.keys(values))
        if (!['searchable', 'site-order'].includes(key))
          throw new OperationsError('Supported restart options: -searchable true and -site-order');
      if (values.searchable !== undefined && values.searchable !== 'true')
        throw new OperationsError('Only -searchable true is supported');
      if (
        values.searchable === undefined &&
        setting(runningConf(world, sh.host, 'server'), 'clustering', 'rolling_restart') !== 'searchable'
      )
        throw new OperationsError('Specify -searchable true; standard/forced restart modes are not modeled');
      return ok(
        JSON.stringify(queueIndexerRestart(world, sh.host, values['site-order']?.split(',')), null, 2) + '\n',
      );
    }
    if (verb === 'abort' && subject === 'rolling-restart') {
      const job = world.clusterManagement.jobs.find(
        (j) => j.kind === 'indexer-restart' && ['running', 'paused'].includes(j.status),
      );
      if (!job) throw new OperationsError('No user-initiated rolling restart to abort');
      return ok(JSON.stringify(abortClusterJob(world, job.id), null, 2) + '\n');
    }
    throw new OperationsError('Unsupported cluster operation');
  } catch (e) {
    return fail((e as Error).message);
  }
};
export function clusterConfigView(world: World, host: string) {
  const p = resolveHost(world, host);
  if (!p?.splunk) throw new OperationsError('Choose a Splunk host');
  const values = (conf: ReturnType<typeof runningConf>) =>
    Object.fromEntries(
      [...(conf.stanzas.get('clustering')?.settings ?? [])]
        .filter(([k]) => !['pass4SymmKey'].includes(k))
        .map(([k, v]) => [k, v.value]),
    );
  return {
    running: values(runningConf(world, p, 'server')),
    declared: values(loadConf(vfsReader(hostFs(world, p)), p.splunk.home, 'server')),
  };
}
export function stageClusterBundleFile(world: World, path: string, text: string) {
  if (!/^[A-Za-z0-9_-]+\/(local|default)\/[A-Za-z][A-Za-z0-9_-]*\.conf$/.test(path) || text.length > 100000)
    throw new OperationsError('Use APP/local|default/NAME.conf, up to 100 KB');
  const p = clusterManager(world),
    fs = hostFs(world, p),
    full = p.splunk!.home + '/etc/manager-apps/' + path;
  fs.mkdir(full.slice(0, full.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(full, text, ROOT);
  return { path: full, activation: 'validate-and-publish-required' };
}
