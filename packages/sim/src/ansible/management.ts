import { kvRest } from '../kvstore/rest';
import { advancedClusterHealth } from '../engineering/cluster-health';
import { shcHealth } from '../engineering/shc-health';
import { kvStatus } from '../kvstore/engine';
import type { World } from '../world';
import { resolveHost, splunkdRunning, splunkVersion } from '../hosts/profile';
import { runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
import { indexRest, fixturePrincipal } from '../engineering/index-commands';
import { TrainingError } from '../training/engine';

/** Read-only virtual management. Never performs network I/O. */
export function inspectManagement(world: World, localHost: string, url: string, auth?: string) {
  let target: URL;
  try {
    target = new URL(url);
  } catch {
    throw new TrainingError('Invalid virtual management URL');
  }
  const host = resolveHost(
    world,
    ['localhost', '127.0.0.1'].includes(target.hostname) ? localHost : target.hostname,
  );
  if (target.protocol !== 'https:' || !host?.splunk || Number(target.port) !== host.splunk.mgmtPort)
    throw new TrainingError('Use a known virtual Splunk host and its HTTPS management port');
  if (!splunkdRunning(world, host))
    throw new TrainingError('Management endpoint unavailable: service is stopped');
  const principal = fixturePrincipal(auth);
  let json: unknown;
  if (target.pathname === '/services/server/info')
    json = {
      entry: [
        {
          name: host.hostname,
          content: {
            serverName: setting(runningConf(world, host, 'server'), 'general', 'serverName') ?? host.hostname,
            version: splunkVersion(world, host),
            server_roles: [host.role],
          },
        },
      ],
    };
  else if (target.pathname === '/services/kvstore/status') json = kvStatus(world, host.hostname);
  else if (target.pathname === '/services/shcluster/status') {
    if (!shcHealth(world).members.some((m) => m.host === host.hostname))
      throw new TrainingError('Query SHC status on a member');
    json = shcHealth(world);
  } else if (target.pathname === '/services/cluster/manager/info') {
    if (host.role !== 'cluster_manager') throw new TrainingError('Query cluster manager info on the manager');
    json = advancedClusterHealth(world);
  } else if (target.pathname.startsWith('/services/data/indexes'))
    json = indexRest(world, host.hostname, 'GET', target.pathname + target.search, {}, principal);
  else if (target.pathname === '/services/data/inputs/monitor')
    json = {
      entry: [...runningConf(world, host, 'inputs').stanzas]
        .filter(([name]) => name.startsWith('monitor://'))
        .map(([name, s]) => ({
          name,
          content: Object.fromEntries([...s.settings].map(([k, v]) => [k, v.value])),
        })),
    };
  else
    throw new TrainingError(
      'Unsupported management endpoint; supported URI checks: server/info, data/indexes, data/inputs/monitor',
    );
  return { status: 200, json, content: JSON.stringify(json) };
}
/** Executes only bounded virtual KV REST writes. No HTTP client, redirects or external I/O. */
export function executeManagement(
  world: World,
  localHost: string,
  url: string,
  method = 'GET',
  body: unknown = {},
  auth?: string,
) {
  if (method === 'GET') {
    const parsed = new URL(url);
    if (!/\/storage\/collections\/(data|config)/.test(parsed.pathname))
      return { ...inspectManagement(world, localHost, url, auth), changed: false };
  }
  const parsed = new URL(url),
    host = resolveHost(
      world,
      ['localhost', '127.0.0.1'].includes(parsed.hostname) ? localHost : parsed.hostname,
    );
  if (parsed.protocol !== 'https:' || parsed.port !== '8089' || !host?.splunk || !splunkdRunning(world, host))
    throw new TrainingError('Use an available virtual HTTPS management endpoint');
  if (
    !['GET', 'POST', 'DELETE'].includes(method) ||
    !/^\/servicesNS\/[^/]+\/[^/]+\/storage\/collections\/(config|data)(?:\/|$)/.test(parsed.pathname)
  )
    throw new TrainingError('URI writes support bounded native KV collection config/data endpoints only');
  const principal = fixturePrincipal(auth);
  if (method !== 'GET' && principal !== 'admin')
    throw new TrainingError('KV management writes require the admin practice principal');
  const before = world.journal.log.length,
    json = kvRest(world, host.hostname, method, parsed.pathname + parsed.search, body);
  return { status: 200, json, content: JSON.stringify(json), changed: world.journal.log.length !== before };
}
