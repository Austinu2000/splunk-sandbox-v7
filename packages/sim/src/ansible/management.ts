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
  else if (target.pathname.startsWith('/services/data/indexes'))
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
