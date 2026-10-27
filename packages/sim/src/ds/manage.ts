import type { DsAppDto, DsClientDto, DsOverviewDto, DsServerClassDto, PageDto } from '@sandbox/shared';
import { appsFor, matchRules, type ServerclassRule } from '../derive/state';
import { forwarderRecord, hostname, ipAddress } from '../fleet/query';
import { filesUnder } from '../hosts/cluster';
import { DOMAIN } from '../hosts/profile';
import { deploymentServer, runningVfs } from '../hosts/running';
import { ROOT } from '../vfs/vfs';
import { hostFs } from '../vfs/build';
import type { World } from '../world';

/**
 * Forwarder Management, as the deployment server sees it: the serverclass rules it is running
 * (world.derived.rules, so an unreloaded edit shows nothing until `splunk reload deploy-server`),
 * the clients they match and the deployment apps on disk. The REST endpoint
 * deployment/server/clients is built from the same records.
 */

function clientNames(world: World, row: number): string[] {
  const h = hostname(world, row);
  return [h, `${h}.${DOMAIN}`, ipAddress(world, row)];
}

export function dsClient(world: World, row: number, rules = world.derived.rules): DsClientDto {
  const rec = forwarderRecord(world, row);
  const names = clientNames(world, row);
  return {
    hostname: rec.hostname,
    ip: rec.ip,
    os: rec.os,
    build: rec.version,
    lastPhoneHome: rec.lastPhoneHome,
    health: rec.health,
    serverClasses: matchRules(rules, names).map((r) => r.name),
    apps: appsFor(rules, names),
  };
}

export interface DsClientQuery {
  offset: number;
  limit: number;
  q?: string;
  serverClass?: string;
  /** Only clients matching no server class. */
  unmatched?: boolean;
}

export function dsClients(world: World, query: DsClientQuery): PageDto<DsClientDto> {
  const rules = world.derived.rules;
  const q = query.q?.toLowerCase();
  const items: DsClientDto[] = [];
  let total = 0;
  for (let row = 0; row < world.fleet.size; row++) {
    if (q && !hostname(world, row).toLowerCase().includes(q)) continue;
    if (query.serverClass !== undefined || query.unmatched) {
      const matched = matchRules(rules, clientNames(world, row));
      if (query.unmatched && matched.length) continue;
      if (query.serverClass !== undefined && !matched.some((r) => r.name === query.serverClass)) continue;
    }
    if (total >= query.offset && items.length < query.limit) items.push(dsClient(world, row, rules));
    total++;
  }
  return { offset: query.offset, total, items };
}

interface Counts {
  byClass: Map<string, number>;
  byApp: Map<string, number>;
  unmatched: number;
}
// Matching depends only on the running rules (names are fixed), so counts are cached per rules object.
const countCache = new WeakMap<ServerclassRule[], Counts>();

function counts(world: World): Counts {
  const rules = world.derived.rules;
  const hit = countCache.get(rules);
  if (hit) return hit;
  const c: Counts = { byClass: new Map(), byApp: new Map(), unmatched: 0 };
  for (let row = 0; row < world.fleet.size; row++) {
    const matched = matchRules(rules, clientNames(world, row));
    if (!matched.length) c.unmatched++;
    for (const r of matched) c.byClass.set(r.name, (c.byClass.get(r.name) ?? 0) + 1);
    for (const a of new Set(matched.flatMap((r) => r.apps))) c.byApp.set(a, (c.byApp.get(a) ?? 0) + 1);
  }
  countCache.set(rules, c);
  return c;
}

export function dsOverview(world: World): DsOverviewDto {
  const ds = deploymentServer(world);
  const rules = world.derived.rules;
  const c = counts(world);
  const serverClasses: DsServerClassDto[] = rules.map((r) => ({
    name: r.name,
    whitelist: [...r.specs.whitelist],
    blacklist: [...r.specs.blacklist],
    apps: [...r.apps],
    clients: c.byClass.get(r.name) ?? 0,
  }));
  const base = `${ds.splunk!.home}/etc/deployment-apps`;
  const disk = hostFs(world, ds);
  const running = runningVfs(world, ds);
  const names = new Set<string>();
  for (const fs of [disk, running])
    if (fs.findNode(base)?.type === 'dir') for (const [n] of fs.readdir(base, ROOT)) names.add(n);
  const apps: DsAppDto[] = [...names].sort().map((name) => {
    const a = JSON.stringify(filesUnder(disk, `${base}/${name}`));
    const b = JSON.stringify(filesUnder(running, `${base}/${name}`));
    return {
      name,
      serverClasses: rules.filter((r) => r.apps.includes(name)).map((r) => r.name),
      clients: c.byApp.get(name) ?? 0,
      pendingReload: a !== b,
    };
  });
  return {
    server: ds.hostname,
    phoneHomeIntervalSeconds: world.config.phoneHomeIntervalMs / 1000,
    totalClients: world.fleet.size,
    unmatchedClients: c.unmatched,
    serverClasses,
    apps,
  };
}
