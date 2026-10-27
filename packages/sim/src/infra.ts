import type { InfraRole } from '@sandbox/shared';
import type { World } from './world';
import { hostname } from './fleet/query';
import type { InfraNodeInfo } from '@sandbox/shared';
import type { WorldConfig } from './config';

export interface InfraNode extends InfraNodeInfo {
  retired?: boolean;
}

/**
 * Named infrastructure nodes. These are separate from the forwarder fleet and are not seeded:
 * every world has the same tier, laid out across the configured sites.
 */
export function generateInfra(cfg: WorldConfig): InfraNode[] {
  if (cfg.profile) return profileInfra(cfg);
  const nodes: InfraNode[] = [];
  const add = (hostname: string, role: InfraRole, siteIdx: number, hostOctet: number) => {
    const site = cfg.sites[siteIdx]!;
    nodes.push({ hostname, role, site: site.id, ip: `10.${site.subnet}.0.${hostOctet}`, status: 'up' });
  };

  // Two indexers per site.
  let idx = 1;
  cfg.sites.forEach((_, s) => {
    for (let k = 0; k < 2; k++, idx++) add(`idx${pad2(idx)}`, 'indexer', s, 20 + k);
  });
  for (let k = 1; k <= 3; k++) add(`sh${pad2(k)}`, 'search_head', 0, 30 + k);
  add('ds01', 'deployment_server', 0, 10);
  add('cm01', 'cluster_manager', 0, 11);
  add('lm01', 'license_manager', 0, 12);
  cfg.sites.forEach((_, s) => add(`hf${pad2(s + 1)}`, 'heavy_forwarder', s, 40));

  // A decommissioned indexer: the machine and its DNS name still exist, but Splunk was removed.
  // Old build images and stale outputs.conf files can still point at it.
  add('idx07', 'indexer', 0, 27);
  Object.assign(nodes[nodes.length - 1]!, { status: 'down', retired: true });

  return nodes;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function profileInfra(cfg: WorldConfig): InfraNode[] {
  const p = cfg.profile!;
  const nodes: InfraNode[] = [];
  const perSite = new Map<string, number>();
  const first = cfg.sites[0]!.id;
  const add = (hostname: string, role: InfraRole, site = first, enabled = true, retired = false) => {
    const slot = (perSite.get(site) ?? 19) + 1;
    perSite.set(site, slot);
    const subnet = cfg.sites.find((s) => s.id === site)!.subnet;
    nodes.push({
      hostname,
      role,
      site,
      ip: `10.${subnet}.0.${slot}`,
      status: enabled ? 'up' : 'down',
      ...(retired ? { retired: true } : {}),
    });
  };
  const cluster = p.infra.indexerCluster;
  // A single-site cluster resides at the first listed site; other sites forward to it.
  const placement = cluster.sitePlacement ?? { [first]: cluster.indexers };
  let i = 1;
  for (const site of cfg.sites)
    for (let n = 0; n < (placement[site.id] ?? 0); n++) add(`idx${pad2(i++)}`, 'indexer', site.id);
  for (let n = 1; n <= p.infra.searchHeadCluster.members; n++) add(`sh${pad2(n)}`, 'search_head');
  if (p.infra.esSearchHead) add('es01', 'search_head');
  if (p.infra.searchHeadCluster.deployer) add('deployer01', 'deployer');
  for (let n = 1; n <= p.infra.deploymentServers; n++) add(`ds${pad2(n)}`, 'deployment_server');
  add('cm01', 'cluster_manager');
  if (p.infra.licenseManager) add('lm01', 'license_manager');
  if (p.infra.monitoringConsole) add('mc01', 'monitoring_console');
  for (const hf of p.infra.heavyForwarders) add(hf.name, 'heavy_forwarder', hf.site);
  for (const extra of p.infra.extras) add(extra.name, extra.role, first, extra.enabled !== false);
  add(`idx${pad2(cluster.indexers + 1)}`, 'indexer', first, false, true);
  if (cfg.automationVersion === 1 && !nodes.some((n) => n.role === 'automation'))
    add('ansible01', 'automation');
  return nodes;
}

export function infraByRole(world: World, role: InfraRole): InfraNode[] {
  return world.infra.filter((n) => n.role === role && !n.retired);
}
export function infraName(world: World, role: InfraRole, ordinal = 1): string {
  const node = infraByRole(world, role)[ordinal - 1];
  if (!node) throw new Error(`No ${role} number ${ordinal} in environment ${world.config.profileId}`);
  return node.hostname;
}
/** Tokens also work inside config paths, regexes and explanatory text. Ordinals are one-based. */
export function resolveRoleTokens(world: World, value: string): string {
  return value.replace(
    /\{([a-z_]+)(?::([a-zA-Z0-9_-]+))?\}/g,
    (token, role: string, arg: string | undefined) => {
      if (role === 'retired_indexer') return world.infra.find((n) => n.retired)!.hostname;
      if (role === 'site') return world.config.sites[Number(arg ?? 1) - 1]?.id ?? world.config.sites[0]!.id;
      if (role === 'forwarder') {
        const cls = world.config.serverClasses.findIndex((c) => c.id === arg || c.short === arg);
        for (let row = 0; row < world.fleet.size; row++)
          if (
            cls < 0
              ? world.config.serverClasses[world.fleet.serverClass[row]!]!.os === 'linux'
              : world.fleet.serverClass[row] === cls
          )
            return hostname(world, row);
        throw new Error(`No forwarder for ${token}`);
      }
      if (world.infra.some((n) => n.role === role))
        return infraName(world, role as InfraRole, Number(arg ?? 1));
      return token;
    },
  );
}
