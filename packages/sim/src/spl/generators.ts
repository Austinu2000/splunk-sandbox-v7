import { advancedClusterHealth } from '../engineering/cluster-health';
import { shcHealth } from '../engineering/shc-health';
import { activeIndexNames, indexCatalog } from '../engineering/indexes';
import { canSearchIndex } from '../engineering/access';
import { recordedEvents } from '../engineering/ingestion';
import { listReports } from '../engineering/reports';
import { setting } from '../conf/merge';
import { runningConf } from '../hosts/running';
import { kvLookup, kvRead, kvState, kvStatus, kvCollections } from '../kvstore/engine';
import { training, refreshTraining } from '../training/engine';
import { infraName } from '../infra';
import { dsClient } from '../ds/manage';
import { forwarderRecord } from '../fleet/query';
import { DOMAIN, ENTERPRISE_VERSION, resolveHost, splunkdRunning, type HostProfile } from '../hosts/profile';
import { hostTimeline, type Timeline } from '../logs/sources';
import { mix32 } from '../rng';
import type { RunContext } from './commands';
import { candidateHosts, delivered, hostSources, indexAllowed } from './data';
import { Row } from './row';
import { pushdown, parseSearch } from './search';
import { SplError, type Value } from './values';

// ---------------------------------------------------------------- lookups

export interface LookupTable {
  columns: string[];
  rows: Row[];
}

const SITE_CONTACTS: Record<string, [string, string]> = {
  dal: ['platform-dal', '#ops-dallas'],
  ash: ['platform-ash', '#ops-ashburn'],
  fra: ['platform-eu', '#ops-frankfurt'],
};

/** Lookup tables. forwarder_inventory is built from the live fleet, so lookups agree with dashboards. */
export function lookupTable(ctx: RunContext, rawName: string): LookupTable {
  const name = rawName.replace(/\.csv$/, '');
  if (['__proto__', 'constructor', 'prototype'].includes(name)) throw new SplError('Invalid lookup name');
  const { world } = ctx;
  const kv = rawName.endsWith('.csv') ? null : kvLookup(world, rawName, ctx.host);
  if (kv) {
    const records = kvRead(world, kv.host, kv.app, kv.collection);
    const columns = kv.fields.length ? kv.fields : [...new Set(records.flatMap((r) => Object.keys(r)))];
    return {
      columns,
      rows: records.map((r) =>
        Row.of(
          Object.fromEntries(
            Object.entries(r)
              .filter(([k]) => columns.includes(k))
              .map(([k, v]) => [k, typeof v === 'boolean' ? String(v) : v]),
          ),
        ),
      ),
    };
  }
  const practice = training(world);
  let stored = practice.lookups[name] ?? practice.summaries[name]?.rows;
  if (name === 'training_metrics') {
    refreshTraining(world);
    stored = practice.resources.flatMap((r) =>
      Object.entries(r.metrics).map(([metric, value]) => ({
        resource: r.id,
        metric,
        value: typeof value === 'boolean' ? String(value) : value,
      })),
    );
  }
  if (name === 'training_events')
    stored = practice.resources.flatMap((r) =>
      r.delivered.map((id) => ({ id, resource: r.id, index: String(r.running.index ?? 'network') })),
    );
  if (stored)
    return { columns: [...new Set(stored.flatMap((r) => Object.keys(r)))], rows: stored.map(Row.of) };

  if (name === 'forwarder_inventory') {
    const columns = ['host', 'site', 'site_name', 'server_class', 'os', 'version', 'output_group', 'health'];
    const rows: Row[] = [];
    for (let r = 0; r < world.fleet.size; r++) {
      const rec = forwarderRecord(world, r);
      rows.push(
        Row.of({
          host: rec.hostname,
          site: rec.site,
          site_name: world.config.sites.find((s) => s.id === rec.site)!.name,
          server_class: rec.serverClass,
          os: rec.os,
          version: rec.version,
          output_group: rec.outputGroup,
          health: rec.health,
        }),
      );
    }
    return { columns, rows };
  }
  if (name === 'site_contacts') {
    return {
      columns: ['site', 'site_name', 'oncall_team', 'slack_channel'],
      rows: world.config.sites.map((s) =>
        Row.of({
          site: s.id,
          site_name: s.name,
          oncall_team: SITE_CONTACTS[s.id]?.[0] ?? 'platform',
          slack_channel: SITE_CONTACTS[s.id]?.[1] ?? '#ops',
        }),
      ),
    };
  }
  if (name === 'indexer_inventory') {
    return {
      columns: ['host', 'role', 'site', 'ip', 'status'],
      rows: world.infra.map((n) =>
        Row.of({
          host: n.hostname,
          role: n.role,
          site: n.site,
          ip: n.ip,
          status: n.retired ? 'retired' : n.status,
        }),
      ),
    };
  }
  throw new SplError(
    `The lookup table '${rawName}' does not exist or is not available. Available: forwarder_inventory, site_contacts, indexer_inventory.`,
    'lookup',
  );
}

// ---------------------------------------------------------------- makeresults

export function makeresults(ctx: RunContext, count: number): Row[] {
  return Array.from({ length: Math.max(1, count) }, () => Row.of({ _time: Math.floor(ctx.now / 1000) }));
}

// ---------------------------------------------------------------- rest

const ROLES: Record<string, string[]> = {
  indexer: ['indexer', 'cluster_peer', 'license_peer'],
  search_head: ['search_head', 'cluster_search_head', 'license_peer'],
  deployment_server: ['deployment_server', 'license_peer'],
  cluster_manager: ['cluster_manager', 'license_peer'],
  license_manager: ['license_manager'],
  heavy_forwarder: ['heavy_forwarder', 'license_peer'],
};

function serverInfo(world: RunContext['world'], p: HostProfile): Row {
  return Row.of({
    splunk_server: p.hostname,
    serverName: setting(runningConf(world, p, 'server'), 'general', 'serverName') ?? p.hostname,
    host_fqdn: p.fqdn,
    version: ENTERPRISE_VERSION,
    os_name: 'Linux',
    numberOfCores: p.cpus,
    physicalMemoryMB: p.memMB,
    server_roles: ROLES[p.role] ?? [],
    guid: p.splunk!.guid,
    health_info: splunkdRunning(world, p) ? 'green' : 'red',
    startup_time: Math.floor(p.bootTime / 1000),
  });
}

/** A few REST endpoints, as seen from search head sh01 with the indexers as search peers. */
export function rest(ctx: RunContext, endpoint: string, opts: Map<string, string>, command: string): Row[] {
  const { world } = ctx;
  const path = endpoint.replace(/^\/?(services|servicesNS\/[^/]+\/[^/]+)\//, '').replace(/^\//, '');
  const server = opts.get('splunk_server');
  const sh = resolveHost(world, infraName(world, 'search_head'))!;
  const indexers = world.infra
    .filter((n) => n.role === 'indexer' && !n.retired)
    .map((n) => resolveHost(world, n.hostname)!);
  const peers = [sh, ...indexers.filter((p) => splunkdRunning(world, p))];
  const scope = (rows: Row[]) =>
    server && server !== '*'
      ? rows.filter(
          (r) => r.get('splunk_server') === (server === 'local' ? infraName(world, 'search_head') : server),
        )
      : rows;

  if (path === 'kvstore/status' || path === 'server/introspection/kvstore/serverstatus')
    return scope(
      kvState(world).nodes.map((n) =>
        Row.of({
          ...kvStatus(world, n.host),
          splunk_server: n.host,
          membersInSync: String(kvStatus(world, n.host).membersInSync),
          writable: String(kvStatus(world, n.host).writable),
        }),
      ),
    );
  if (path === 'storage/collections/config')
    return kvCollections(world, sh.hostname).map((c) =>
      Row.of({ title: c.collection, ...c.settings, count: c.count }),
    );
  switch (path) {
    case 'saved/searches':
      return listReports(world, sh.hostname, ctx.principal ?? 'admin').map((r) =>
        Row.of({
          title: r.title,
          search: r.search,
          'eai:acl.app': r.app,
          'eai:acl.owner': r.owner,
          'eai:acl.sharing': r.sharing.toLowerCase(),
          is_scheduled: r.scheduled ? '1' : '0',
          cron_schedule: r.cron,
          'dispatch.earliest_time': r.earliest,
          'dispatch.latest_time': r.latest,
          disabled: r.enabled ? '0' : '1',
          'action.summary_index._name': r.summaryIndex ?? '',
          sourcePath: r.sourcePath,
        }),
      );
    case 'server/info':
      return scope(peers.map((p) => serverInfo(world, p)));
    case 'search/distributed/peers':
      return indexers.map((p) =>
        Row.of({
          splunk_server: infraName(world, 'search_head'),
          title: `${p.fqdn}:8089`,
          peerName: p.hostname,
          status: splunkdRunning(world, p) ? 'Up' : 'Down',
          version: ENTERPRISE_VERSION,
        }),
      );
    case 'shcluster/status': {
      if (!world.clusterManagement) throw new Error('Enable V7 SHC operations to inspect this endpoint');
      const h = shcHealth(world);
      return h.members.map((m) =>
        Row.of({
          splunk_server: m.host,
          label: m.host,
          status: m.available ? 'Up' : 'Down',
          captain: h.captain ?? '',
          is_captain: m.host === h.captain ? '1' : '0',
          majority: h.majority ? '1' : '0',
          election_term: h.term,
        }),
      );
    }
    case 'cluster/manager/info': {
      if (!world.clusterManagement) throw new Error('Enable V7 cluster operations to inspect this endpoint');
      const h = advancedClusterHealth(world);
      return [
        Row.of({
          splunk_server: h.manager,
          label: h.manager,
          replication_factor: h.replicationFactor,
          search_factor: h.searchFactor,
          replication_factor_met: h.replicationMet ? '1' : '0',
          search_factor_met: h.searchFactorMet ? '1' : '0',
          all_data_searchable: h.allDataSearchable ? '1' : '0',
          maintenance_mode: h.maintenance ? '1' : '0',
        }),
      ];
    }
    case 'cluster/manager/peers':
    case 'cluster/master/peers':
      if (world.clusterManagement) {
        const h = advancedClusterHealth(world);
        return h.members.map((m) =>
          Row.of({
            splunk_server: h.manager,
            label: m.host,
            site: m.nativeSite,
            status: m.joined ? 'Up' : 'Down',
            is_searchable:
              m.joined &&
              h.buckets.some((b) => b.copies.some((c) => c.host === m.host && c.available && c.searchable))
                ? '1'
                : '0',
            bucket_count: h.buckets.filter((b) => b.copies.some((c) => c.host === m.host)).length,
            reason: m.reason,
          }),
        );
      }
      return indexers.map((p) =>
        Row.of({
          splunk_server: infraName(world, 'cluster_manager'),
          label: p.hostname,
          site: p.site,
          status: splunkdRunning(world, p) ? 'Up' : 'Down',
          is_searchable: splunkdRunning(world, p) ? '1' : '0',
          bucket_count: 4000 + (mix32(p.hash, 1) % 2000),
        }),
      );
    case 'data/indexes':
      return scope(
        indexers
          .filter((p) => splunkdRunning(world, p))
          .flatMap((p) =>
            indexCatalog(world, p.hostname, ctx.principal ?? 'admin').map((index) =>
              Row.of({
                splunk_server: p.hostname,
                title: index.name,
                ...index.settings,
                disabled: index.settings.disabled ? '1' : '0',
                currentDBSizeMB: index.currentDBSizeMB,
                sourcePath: index.sourcePath,
                owner: index.owner,
                app: index.app,
              }),
            ),
          ),
      );
    case 'deployment/server/clients': {
      if (server && server !== infraName(world, 'deployment_server'))
        throw new SplError(
          `Failed to fetch REST endpoint uri=https://${server}.${DOMAIN}:8089/services/deployment/server/clients status=404 (not a deployment server)`,
          command,
        );
      const rows: Row[] = [];
      const rules = world.derived.rules;
      for (let r = 0; r < world.fleet.size; r++) {
        const c = dsClient(world, r, rules);
        rows.push(
          Row.of({
            splunk_server: infraName(world, 'deployment_server'),
            hostname: c.hostname,
            clientName: c.hostname,
            dns: `${c.hostname}.${DOMAIN}`,
            ip: c.ip,
            utsname: c.os === 'windows' ? 'windows-x64' : 'linux-x86_64',
            build: c.build,
            lastPhoneHomeTime: Math.floor(c.lastPhoneHome / 1000),
            serverClasses: c.serverClasses,
            applications: c.apps,
          }),
        );
      }
      return rows;
    }
  }
  throw new SplError(
    `Failed to fetch REST endpoint uri=https://${infraName(world, 'search_head')}.${DOMAIN}:8089/services/${path} status=404 (not simulated in this sandbox)`,
    command,
  );
}

// ---------------------------------------------------------------- metadata

const STEP_BACK = [60_000, 60 * 60_000, 24 * 3_600_000];

/**
 * When a host stopped delivering events, or null if it is delivering at `now`. Uses the health
 * timeline (offline, or blocked without having recovered) and, for older outages, healthSince.
 */
function deliveryStoppedAt(
  world: RunContext['world'],
  p: HostProfile,
  tl: Timeline,
  now: number,
): number | null {
  if (delivered(tl, now) && splunkdRunning(world, p)) return null;
  const current = tl.stateAt(now);
  const into = tl.transitions.filter((t) => t.to === current && t.time <= now).at(-1);
  if (into) return into.time;
  if (p.fleetRow !== undefined) return world.fleet.healthSince[p.fleetRow]!;
  const stop = world.hosts.services
    .get(p.hostname)
    ?.events.filter((e) => e.kind === 'stop')
    .at(-1);
  return stop?.time ?? now;
}

/**
 * `| metadata`: first/last event times and counts per host, source or sourcetype. lastTime is exact
 * (found by walking back from now until a delivered event); totalCount is estimated from the rate
 * over the last ten minutes, scaled to the time range.
 */
export function metadata(ctx: RunContext, type: string, index: string | undefined, command: string): Row[] {
  if (!['hosts', 'sources', 'sourcetypes'].includes(type))
    throw new SplError('Invalid type. Use type=hosts, type=sources or type=sourcetypes.', command);
  const pd = pushdown(parseSearch(index ? `index=${index}` : ''));
  const { world, earliest } = ctx;
  const baselineEarliest = Math.max(earliest, world.clock.now - world.config.historyRetentionMs);
  const latest = Math.min(ctx.latest, world.clock.now);
  const wantData = activeIndexNames(world).some((i) => !i.startsWith('_') && indexAllowed(pd, i));
  const groups = new Map<string, { first: number; last: number; count: number }>();
  const add = (key: string, last: number, count: number, first = baselineEarliest) => {
    const g = groups.get(key) ?? { first, last: 0, count: 0 };
    g.first = Math.min(g.first, first);
    g.last = Math.max(g.last, last);
    g.count += count;
    groups.set(key, g);
  };
  const permitted = (name: string) =>
    canSearchIndex(world, infraName(world, 'search_head'), ctx.principal ?? 'admin', name, !index) &&
    indexAllowed(pd, name);
  for (const event of recordedEvents(world)) {
    if (event.time <= earliest || event.time > latest || !permitted(event.index)) continue;
    const key = type === 'hosts' ? event.host : type === 'sources' ? event.source : event.sourcetype;
    add(key, event.time, 1, event.time);
  }
  for (const p of candidateHosts(world, pd)) {
    const tl = hostTimeline(world, p, latest - STEP_BACK.at(-1)!);
    // Events stop at the moment delivery stopped (offline, or blocked and not yet recovered).
    const stoppedAt = p.fleetRow === undefined && !p.splunk ? null : deliveryStoppedAt(world, p, tl, latest);
    const until = Math.min(latest, stoppedAt ?? latest);
    if (until <= baselineEarliest) continue;
    for (const s of hostSources(world, p, wantData)) {
      if (!permitted(s.index)) continue;
      const deliveredTimes = (t0: number, t1: number) =>
        s.log
          .entries(t0, t1)
          .map((e) => e[0])
          .filter((t) => p.fleetRow === undefined || delivered(tl, t));
      // Last event: look back from when delivery stopped, widening the window until something turns up.
      // The same window gives the event rate for the (estimated) count.
      let last: number | null = null;
      let rate = 0;
      let lo = until;
      for (const back of STEP_BACK) {
        const t0 = Math.max(baselineEarliest, until - back);
        if (t0 >= lo) break;
        const times = deliveredTimes(t0, lo);
        if (times.length) {
          last = Math.max(...times);
          rate = times.length / (until - t0);
          break;
        }
        lo = t0;
      }
      if (last === null) continue;
      const count = Math.round(rate * (until - Math.max(baselineEarliest, p.bootTime)));
      const key = type === 'hosts' ? (s.host ?? p.hostname) : type === 'sources' ? s.source : s.sourcetype;
      add(key, last, Math.max(count, 1));
    }
  }
  const field = type === 'hosts' ? 'host' : type === 'sources' ? 'source' : 'sourcetype';
  return [...groups.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([k, g]) => {
      const row: Record<string, Value> = {
        firstTime: Math.floor(g.first / 1000),
        lastTime: Math.floor(g.last / 1000),
        recentTime: Math.floor(g.last / 1000),
        totalCount: g.count,
        type,
      };
      row[field] = k;
      return Row.of({ [field]: k, ...row });
    });
}
