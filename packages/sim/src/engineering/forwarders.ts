import type { ForwarderRuntime, ForwarderClientState, DeploymentCatalog } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost, splunkVersion, splunkdRunning, type HostProfile } from '../hosts/profile';
import { runningVfs, runningConf, deploymentServer, runtimeHooks, stopSplunk } from '../hosts/running';
import { hostFs } from '../vfs/build';
import { vfsReader } from '../hosts/running';
import { ROOT } from '../vfs/vfs';
import { filesUnder, checksum } from '../hosts/cluster';
import { loadConf, mergeConf, setting } from '../conf/merge';
import { parseServerclass, appsFor, matchRules, applyRow } from '../derive/state';
import { lastPhoneHome } from '../fleet/health';
import { ipAddress, hostname } from '../fleet/query';
import { TrainingError } from '../training/engine';
import { journal } from '../journal';

export const UF_PACKAGES = Object.freeze({
  '/opt/staging/splunkforwarder-9.3.2-simulated.x86_64.rpm': '9.3.2',
  '/opt/staging/splunkforwarder-9.4.1-simulated.x86_64.rpm': '9.4.1',
});
export function forwarderPackageVersion(path: string): string | undefined {
  return Object.hasOwn(UF_PACKAGES, path) ? UF_PACKAGES[path as keyof typeof UF_PACKAGES] : undefined;
}
export function packageFixture(version: string) {
  return (
    JSON.stringify({
      format: 'sandbox-uf-package-v1',
      product: 'splunkforwarder',
      version,
      os: 'linux',
      architecture: 'x86_64',
      fixture: true,
    }) + '\n'
  );
}
export function applyForwarderState(world: World, state: ForwarderRuntime) {
  world.forwarders = structuredClone(state);
  for (const [name, c] of Object.entries(state.clients)) {
    const p = resolveHost(world, name),
      version = world.versions.indexOf(c.version);
    if (p?.fleetRow !== undefined && version >= 0) world.fleet.version[p.fleetRow] = version;
  }
  world.hosts.confVersion++;
}
function persist(world: World) {
  for (const [name, c] of Object.entries(world.forwarders?.clients ?? {})) {
    const row = resolveHost(world, name)?.fleetRow,
      index = world.versions.indexOf(c.version);
    if (row !== undefined && index >= 0) world.fleet.version[row] = index;
  }
  journal(world, { k: 'forwarders.state', state: structuredClone(world.forwarders!) });
  world.hosts.confVersion++;
}
function capture(world: World, id: number, disk = false): DeploymentCatalog {
  const ds = deploymentServer(world),
    fs = disk ? hostFs(world, ds) : runningVfs(world, ds),
    base = ds.splunk!.home + '/etc/deployment-apps',
    apps: Record<string, Record<string, string>> = {};
  for (const [app, node] of fs.readdir(base, ROOT)) {
    if (node.type === 'dir') apps[app] = filesUnder(fs, base + '/' + app);
  }
  const conf = disk
      ? loadConf(vfsReader(fs), ds.splunk!.home, 'serverclass')
      : runningConf(world, ds, 'serverclass'),
    serverclass = [...conf.stanzas]
      .map(
        ([name, s]) => '[' + name + ']\n' + [...s.settings].map(([k, v]) => k + ' = ' + v.value).join('\n'),
      )
      .join('\n\n');
  if (Object.keys(apps).length > 100 || JSON.stringify(apps).length > 2000000)
    throw new TrainingError('Deployment catalog limit: 100 apps / 2 MB');
  return {
    id,
    time: world.clock.now,
    apps,
    serverclass,
    revision: checksum({
      serverclass,
      ...Object.fromEntries(Object.entries(apps).map(([a, files]) => [a, JSON.stringify(files)])),
    }),
  };
}
/** Explicitly opts a saved world into versioned delivery; no prior source is discarded. */
export function enableForwarderOperations(world: World): ForwarderRuntime {
  if (!world.forwarders) {
    world.forwarders = { version: 1, nextCatalog: 1, clients: {}, catalogs: [capture(world, 0)] };
    persist(world);
  }
  return world.forwarders;
}
// loadConf expects a real configuration-layer path; build a single explicit merged source instead.
const ruleCache = new WeakMap<DeploymentCatalog, ReturnType<typeof parseServerclass>>();
function catalogRules(c: DeploymentCatalog) {
  const hit = ruleCache.get(c);
  if (hit) return hit;
  const parsed = parseServerclass(
    mergeConf('serverclass', { list: () => [], read: () => c.serverclass }, [
      { path: '/catalog/serverclass.conf' },
    ]),
    new Set(Object.keys(c.apps)),
  );
  ruleCache.set(c, parsed);
  return parsed;
}
type ClientIdentity = Pick<HostProfile, 'hostname' | 'fqdn' | 'ip' | 'fleetRow'>;
function names(world: World, p: ClientIdentity) {
  return [p.hostname, p.fqdn, p.ip, p.fleetRow === undefined ? '' : ipAddress(world, p.fleetRow)];
}
function catalog(world: World, id: number) {
  return world.forwarders?.catalogs.find((c) => c.id === id);
}
const restartFlags = new WeakMap<DeploymentCatalog, Uint8Array>();
const changedCatalogApps = new WeakMap<DeploymentCatalog, Set<string>>();
const catalogConfs = new WeakMap<DeploymentCatalog, ReturnType<typeof mergeConf>>();
function autoRestart(world: World, p: ClientIdentity, c: DeploymentCatalog) {
  let flags = restartFlags.get(c);
  if (!flags) restartFlags.set(c, (flags = new Uint8Array(world.fleet.size)));
  const cached = p.fleetRow === undefined ? 0 : flags[p.fleetRow];
  if (cached) return cached === 2;
  const previous = world.forwarders!.catalogs.find((other) => other.id === c.id - 1);
  if (!previous) return false;
  let changedApps = changedCatalogApps.get(c);
  if (!changedApps) {
    changedApps = new Set(Object.keys(c.apps).filter((app) => JSON.stringify(previous.apps[app]) !== JSON.stringify(c.apps[app])));
    changedCatalogApps.set(c, changedApps);
  }
  const priorApps = Object.keys(appsFromCatalog(world, p, previous));
  let m = catalogConfs.get(c);
  if (!m) {
    m = mergeConf('serverclass', { list: () => [], read: () => c.serverclass }, [
      { path: '/catalog/serverclass.conf' },
    ]);
    catalogConfs.set(c, m);
  }
  const changed = matchRules(catalogRules(c), names(world, p)).some((r) =>
    r.apps.some(
      (app) =>
        (!priorApps.includes(app) || changedApps.has(app)) &&
        ['true', '1'].includes(
          setting(m!, 'serverClass:' + r.name + ':app:' + app, 'restartSplunkd') ??
            setting(m!, 'serverClass:' + r.name, 'restartSplunkd') ??
            setting(m!, 'global', 'restartSplunkd') ??
            'false',
        ),
    ),
  );
  const currentApps = Object.keys(appsFromCatalog(world, p, c));
  let previousConf = catalogConfs.get(previous);
  if (!previousConf) {
    previousConf = mergeConf('serverclass', { list: () => [], read: () => previous.serverclass }, [
      { path: '/catalog/serverclass.conf' },
    ]);
    catalogConfs.set(previous, previousConf);
  }
  const removed = matchRules(catalogRules(previous), names(world, p)).some((r) =>
    r.apps.some(
      (app) =>
        !currentApps.includes(app) &&
        ['true', '1'].includes(
          setting(previousConf, 'serverClass:' + r.name + ':app:' + app, 'restartSplunkd') ??
            setting(previousConf, 'serverClass:' + r.name, 'restartSplunkd') ??
            setting(previousConf, 'global', 'restartSplunkd') ??
            'false',
        ),
    ),
  );
  const result = changed || removed;
  if (p.fleetRow !== undefined) flags[p.fleetRow] = result ? 2 : 1;
  return result;
}
const clientRows = new WeakMap<ForwarderRuntime, Map<number, string>>();
export function clientAtRow(world: World, row: number) {
  const state = world.forwarders!;
  let index = clientRows.get(state);
  if (!index) {
    index = new Map();
    for (const name of Object.keys(state.clients)) {
      const p = resolveHost(world, name);
      if (p?.fleetRow !== undefined) index.set(p.fleetRow, name);
    }
    clientRows.set(state, index);
  }
  const name = index.get(row);
  return name ? state.clients[name] : undefined;
}
function rowIdentity(world: World, row: number): ClientIdentity {
  const name = hostname(world, row);
  return { hostname: name, fqdn: name + '.corp.example', ip: ipAddress(world, row), fleetRow: row };
}
const rowCatalogs = new WeakMap<
  ForwarderRuntime,
  { known: Uint8Array; downloaded: Uint16Array; running: Uint16Array }
>();
function selectedCatalog(world: World, row: number, running: boolean) {
  const state = world.forwarders;
  if (!state) return undefined;
  const client = clientAtRow(world, row);
  if (client) return catalog(world, running ? client.runningCatalog : client.downloadedCatalog);
  let cache = rowCatalogs.get(state);
  if (!cache)
    rowCatalogs.set(
      state,
      (cache = {
        known: new Uint8Array(world.fleet.size),
        downloaded: new Uint16Array(world.fleet.size),
        running: new Uint16Array(world.fleet.size),
      }),
    );
  const latest = state.catalogs.at(-1)!;
  if (cache.known[row] && cache.downloaded[row] === latest.id)
    return catalog(world, running ? cache.running[row]! : cache.downloaded[row]!);
  const at = lastPhoneHome(world, row, world.clock.now),
    download = state.catalogs.filter((c) => c.id === 0 || c.time < at).at(-1) ?? state.catalogs[0]!;
  const identity = rowIdentity(world, row),
    active =
      state.catalogs
        .filter((c) => c.id <= download.id && (c.id === 0 || autoRestart(world, identity, c)))
        .at(-1) ?? state.catalogs[0]!;
  cache.known[row] = 1;
  cache.downloaded[row] = download.id;
  cache.running[row] = active.id;
  return running ? active : download;
}
export function deliveryCatalog(
  world: World,
  p: ClientIdentity,
  running = false,
): DeploymentCatalog | undefined {
  return p.fleetRow === undefined ? undefined : selectedCatalog(world, p.fleetRow, running);
}
const appCohorts = new WeakMap<
  DeploymentCatalog,
  { rows: Uint16Array; sets: Record<string, Record<string, string>>[]; keys: Map<string, number> }
>();
function appsFromCatalog(world: World, p: ClientIdentity, c: DeploymentCatalog) {
  let cache = appCohorts.get(c);
  if (!cache)
    appCohorts.set(c, (cache = { rows: new Uint16Array(world.fleet.size), sets: [{}], keys: new Map() }));
  const found = p.fleetRow === undefined ? 0 : cache.rows[p.fleetRow];
  if (found) return cache.sets[found]!;
  const selected = appsFor(catalogRules(c), names(world, p)),
    key = selected.join(',');
  let id = cache.keys.get(key);
  if (id === undefined) {
    id = cache.sets.length;
    cache.keys.set(key, id);
    cache.sets.push(
      Object.fromEntries(selected.map((app) => [app, c.apps[app]!]).filter(([, files]) => files)),
    );
  }
  if (p.fleetRow !== undefined) cache.rows[p.fleetRow] = id;
  return cache.sets[id]!;
}
export function deliveryApps(
  world: World,
  p: ClientIdentity,
  running = false,
): Record<string, Record<string, string>> | undefined {
  const c = deliveryCatalog(world, p, running);
  if (!c) return undefined;
  if (world.forwarders?.clients[p.hostname]?.installed === false) return {};
  return appsFromCatalog(world, p, c);
}
export function deliverySignature(world: World, p: ClientIdentity, running = false) {
  return deliveryCatalog(world, p, running)?.id ?? 'legacy';
}
export function trackForwarder(world: World, name: string): ForwarderClientState {
  const p = resolveHost(world, name);
  if (!p || p.fleetRow === undefined) throw new TrainingError('Select an existing Universal Forwarder');
  const state = enableForwarderOperations(world);
  if (state.clients[p.hostname]) return state.clients[p.hostname]!;
  if (Object.keys(state.clients).length >= 1000)
    throw new TrainingError(
      'Detailed lifecycle limit: 1000 explicitly managed clients; the fleet remains columnar',
    );
  const d = deliveryCatalog(world, p),
    active = deliveryCatalog(world, p, true),
    at = lastPhoneHome(world, p.fleetRow, world.clock.now);
  const client: ForwarderClientState = {
    installed: true,
    version: splunkVersion(world, p) ?? '9.3.2',
    licenseAccepted: true,
    bootStart: true,
    owner: 'splunk',
    lastPhoneHome: at,
    nextPhoneHome: world.clock.now,
    downloadedCatalog: d?.id ?? 0,
    runningCatalog: active?.id ?? 0,
    changes: [],
  };
  state.clients[p.hostname] = client;
  clientRows.get(state)?.set(p.fleetRow, p.hostname);
  persist(world);
  return client;
}
export function setForwarderFixture(
  world: World,
  name: string,
  patch: Partial<Pick<ForwarderClientState, 'installed' | 'version' | 'licenseAccepted' | 'bootStart'>>,
) {
  const c = trackForwarder(world, name);
  Object.assign(c, patch);
  persist(world);
  if (!c.installed) stopSplunk(world, resolveHost(world, name)!);
}
function note(world: World, c: ForwarderClientState, kind: string, detail: string) {
  c.changes.push({ time: world.clock.now, kind, detail });
  c.changes = c.changes.slice(-100);
  persist(world);
}
export function installForwarderPackage(
  world: World,
  name: string,
  path: string,
  text: string,
  upgrade: boolean,
) {
  const p = resolveHost(world, name);
  if (!p || p.role !== 'universal_forwarder' || p.os !== 'linux')
    throw new TrainingError('This training package targets an existing Linux UF host');
  const expected = forwarderPackageVersion(path);
  if (!expected || text !== packageFixture(expected))
    throw new TrainingError('Package is not a verified local teaching artifact; no installation performed');
  const c = trackForwarder(world, name),
    wasInstalled = c.installed;
  if (c.installed && !upgrade)
    throw new TrainingError('Package already installed; use rpm -Uvh for an upgrade');
  if (c.installed && c.version === expected) return false;
  if (c.installed && splunkdRunning(world, p))
    throw new TrainingError('Stop SplunkForwarder before upgrading; preserve the existing etc configuration');
  if (c.installed && c.version.localeCompare(expected, undefined, { numeric: true }) > 0)
    throw new TrainingError('Package downgrade is unsupported; use the recovery workflow');
  c.installed = true;
  c.version = expected;
  c.licenseAccepted = false;
  if (!wasInstalled) c.bootStart = false;
  const version = world.versions.indexOf(expected);
  if (version >= 0) world.fleet.version[p.fleetRow!] = version;
  note(
    world,
    c,
    wasInstalled ? 'package-upgrade' : 'package-install',
    expected + ' verified fixture; configuration and instance identity retained',
  );
  return true;
}
export function acceptForwarderLicense(world: World, name: string) {
  const c = trackForwarder(world, name);
  if (!c.installed) throw new TrainingError('Install the forwarder first');
  if (!c.licenseAccepted) {
    c.licenseAccepted = true;
    note(world, c, 'license', 'Training acceptance flag; no real license agreement');
  }
}
export function setForwarderBoot(world: World, name: string, enabled: boolean, user = 'splunk') {
  const c = trackForwarder(world, name);
  if (!c.installed || user !== 'splunk')
    throw new TrainingError('Install the forwarder and select the splunk service account');
  if (c.bootStart !== enabled) {
    c.bootStart = enabled;
    note(world, c, 'boot-start', String(enabled));
    return true;
  }
  return false;
}
export function phoneHomeStatus(world: World, p: HostProfile) {
  if (!p.splunk || !splunkdRunning(world, p)) return 'Forwarder service is stopped or not installed';
  const conf = runningConf(world, p, 'deploymentclient');
  if (['1', 'true'].includes(setting(conf, 'deployment-client', 'disabled') ?? 'false'))
    return 'Deployment client is disabled';
  const raw = setting(conf, 'target-broker:deploymentServer', 'targetUri') ?? '',
    match = /^(?:https:\/\/)?([^/:]+):(\d+)$/.exec(raw),
    ds = match && resolveHost(world, match[1]!);
  if (!ds || ds.role !== 'deployment_server' || Number(match![2]) !== ds.splunk?.mgmtPort)
    return 'targetUri does not identify a known Deployment Server management port';
  if (!splunkdRunning(world, ds)) return 'Deployment Server management service is unavailable';
  return '';
}
export function tickForwarders(world: World) {
  if (!world.forwarders) return;
  let changed = false;
  for (const [name, c] of Object.entries(world.forwarders.clients)) {
    if (world.clock.now < c.nextPhoneHome) continue;
    const p = resolveHost(world, name)!;
    const conf = runningConf(world, p, 'deploymentclient');
    const interval = Number(setting(conf, 'deployment-client', 'phoneHomeIntervalInSecs') ?? 60);
    c.nextPhoneHome = world.clock.now + Math.max(10, Number.isFinite(interval) ? interval : 60) * 1000;
    c.error = phoneHomeStatus(world, p);
    if (!c.error) {
      c.lastPhoneHome = world.clock.now;
      const d = world.forwarders.catalogs.at(-1)!;
      c.downloadedCatalog = d.id;
      if (autoRestart(world, p, d)) c.runningCatalog = d.id;
    }
    applyRow(
      world,
      p.fleetRow!,
      world.rng.fork('managed-phonehome', world.clock.now, p.fleetRow!),
      world.clock.now,
    );
    changed = true;
  }
  if (changed) world.hosts.confVersion++;
}
export function forwarderDetail(world: World, name: string) {
  const p = resolveHost(world, name);
  if (!p || p.fleetRow === undefined) throw new TrainingError('Select a forwarder hostname');
  const c = world.forwarders?.clients[p.hostname];
  return {
    host: p.hostname,
    os: p.os,
    installed: c?.installed ?? true,
    version: splunkVersion(world, p),
    running: splunkdRunning(world, p),
    bootStart: c?.bootStart ?? true,
    owner: c?.owner ?? 'splunk',
    lastPhoneHome: c?.lastPhoneHome ?? lastPhoneHome(world, p.fleetRow, world.clock.now),
    error: phoneHomeStatus(world, p),
    downloadedCatalog: deliverySignature(world, p),
    runningCatalog: deliverySignature(world, p, true),
    apps: Object.keys(deliveryApps(world, p) ?? {}),
    changes: c?.changes ?? [],
  };
}

/** Validate before restart stops a healthy service; rejected publication leaves it running. */
export function validateForwarderStart(world: World, p: HostProfile) {
  if (p.role !== 'deployment_server' || !world.forwarders) return;
  const next = capture(world, world.forwarders.nextCatalog, true);
  if (world.forwarders.catalogs.length >= 32 && next.revision !== world.forwarders.catalogs.at(-1)!.revision)
    throw new TrainingError('Deployment history limit: 32 catalogs; save a checkpoint and start a new practice attempt');
}

let hooksInstalled = false;
export function installForwarderHooks() {
  if (hooksInstalled) return;
  hooksInstalled = true;
  runtimeHooks.beforeChange.push((world, p, action) => {
    if (world.forwarders && p.fleetRow !== undefined && !world.forwarders.clients[p.hostname])
      trackForwarder(world, p.hostname);
    if (action !== 'stop') validateForwarderStart(world, p);
  });
  runtimeHooks.changed.push((world, p) => {
    if (!world.forwarders) return;
    if (p.role === 'deployment_server') {
      const next = capture(world, world.forwarders.nextCatalog);
      if (next.revision !== world.forwarders.catalogs.at(-1)?.revision) {
        world.forwarders.nextCatalog++;
        world.forwarders.catalogs.push(next);
        persist(world);
      }
    } else if (p.fleetRow !== undefined) {
      const c = world.forwarders.clients[p.hostname];
      if (c && splunkdRunning(world, p)) {
        c.runningCatalog = c.downloadedCatalog;
        c.nextPhoneHome = world.clock.now;
        persist(world);
      }
    }
  });
}

const mergedCatalog = new WeakMap<DeploymentCatalog, Map<string, ReturnType<typeof mergeConf>>>();
/** Cohort cache: matching app sets share one merged config, without per-host filesystems. */
export function deliveryConfForRow(world: World, row: number, conf: string) {
  const c = selectedCatalog(world, row, true);
  if (!c) return undefined;
  const absent = clientAtRow(world, row)?.installed === false;
  let group = appCohorts.get(c)?.rows[row] ?? 0;
  if (!group && !absent) {
    appsFromCatalog(world, rowIdentity(world, row), c);
    group = appCohorts.get(c)!.rows[row]!;
  }
  const apps = absent ? {} : appCohorts.get(c)!.sets[group]!,
    key = conf + '|' + (absent ? 'absent' : group);
  let cache = mergedCatalog.get(c);
  if (!cache) mergedCatalog.set(c, (cache = new Map()));
  const hit = cache.get(key);
  if (hit) return hit;
  const files = Object.fromEntries(
    Object.entries(apps).flatMap(([app, tree]) =>
      Object.entries(tree).map(([path, text]) => ['/catalog/' + app + '/' + path, text]),
    ),
  );
  const sources = ['local', 'default']
    .flatMap((layer) =>
      Object.keys(apps)
        .sort()
        .map((app) => ({ path: '/catalog/' + app + '/' + layer + '/' + conf + '.conf', app })),
    )
    .filter((s) => files[s.path] !== undefined);
  const merged = mergeConf(conf, { list: () => [], read: (path) => files[path] ?? null }, sources);
  cache.set(key, merged);
  return merged;
}
