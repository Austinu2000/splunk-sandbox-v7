import {
  deliverySignature,
  enableForwarderOperations,
  validateForwarderStart,
} from '../engineering/forwarders';
import { infraName } from '../infra';
import { op } from '../journal';
import { loadConf, type ConfReader, type MergedConf } from '../conf/merge';
import { buildHostTree } from '../vfs/build';
import { FsError, ROOT, Vfs, type Cred, type OverlayEntry } from '../vfs/vfs';
import type { World } from '../world';
import { resolveHost, type HostProfile } from './profile';

/**
 * What splunkd is actually running with. Files on disk (the host's overlay) change the moment you
 * save; the running config only changes when splunkd (re)starts or a reload re-reads part of it.
 * We store that as a snapshot of the overlay taken at the last start/reload.
 */

export interface ServiceEvent {
  time: number;
  kind: 'stop' | 'start' | 'reload';
  detail?: string;
  /** For deployment-server reloads: clients matched per server class afterwards. */
  matches?: Record<string, number>;
}

export interface ServiceState {
  running: boolean;
  events: ServiceEvent[];
}

export function vfsReader(vfs: Vfs, cred: Cred = ROOT): ConfReader {
  return {
    list(dir) {
      try {
        return vfs
          .readdir(dir, cred)
          .filter(([, n]) => n.type === 'dir')
          .map(([name]) => name);
      } catch (e) {
        if (e instanceof FsError) return null;
        throw e;
      }
    },
    read(path) {
      try {
        const node = vfs.findNode(path);
        if (!node || node.type !== 'file') return null;
        return vfs.readFile(path, cred);
      } catch (e) {
        if (e instanceof FsError) return null;
        throw e;
      }
    },
  };
}

const viewCache = new WeakMap<World, Map<string, { key: string; vfs: Vfs }>>();

/** The filesystem as splunkd last loaded it: generated tree + overlay snapshot from the last start. */
export function runningVfs(world: World, p: HostProfile): Vfs {
  let perWorld = viewCache.get(world);
  if (!perWorld) viewCache.set(world, (perWorld = new Map()));
  const signature =
    p.fleetRow === undefined
      ? ''
      : `${world.fleet.assignedClass[p.fleetRow]}:${world.fleet.version[p.fleetRow]}`;
  const key = `${world.hosts.confVersion}:${signature}:${deliverySignature(world, p, true)}`;
  const hit = perWorld.get(p.hostname);
  if (hit?.key === key) return hit.vfs;
  const snapshot = new Map(world.hosts.restartSnapshot.get(p.hostname) ?? []);
  const vfs = new Vfs(buildHostTree(world, p, [], true), snapshot, () => world.clock.now);
  perWorld.set(p.hostname, { key, vfs });
  return vfs;
}

const mergedRunning = new WeakMap<Vfs, Map<string, MergedConf>>();
/** Merged running config for one conf type, invalidated with the running filesystem snapshot. */
export function runningConf(world: World, p: HostProfile, conf: string): MergedConf {
  const fs = runningVfs(world, p);
  let cache = mergedRunning.get(fs);
  if (!cache) {
    cache = new Map();
    mergedRunning.set(fs, cache);
  }
  let merged = cache.get(conf);
  if (!merged) {
    merged = loadConf(vfsReader(fs), p.splunk!.home, conf);
    cache.set(conf, merged);
  }
  return merged;
}

export function activateDashboardConf(world: World, p: HostProfile): void {
  op(world, { k: 'dashboards.activate', host: p.hostname }, () => {
    ensureFs(world, p);
    snapshotOverlay(
      world,
      p.hostname,
      (path) => /\/data\/ui\/views\/[^/]+\.xml$/.test(path) || path.endsWith('/metadata/local.meta'),
    );
  });
}

export function serviceState(world: World, host: string): ServiceState | undefined {
  return world.hosts.services.get(host);
}

function state(world: World, host: string): ServiceState {
  let s = world.hosts.services.get(host);
  if (!s) world.hosts.services.set(host, (s = { running: true, events: [] }));
  return s;
}

function snapshotOverlay(world: World, host: string, filter?: (path: string) => boolean): void {
  const overlay = world.hosts.fsOverlay.get(host) ?? new Map<string, OverlayEntry>();
  const prev = world.hosts.restartSnapshot.get(host) ?? new Map<string, OverlayEntry>();
  const next = filter
    ? new Map([...prev].filter(([path]) => !filter(path)))
    : new Map<string, OverlayEntry>();
  const selected = filter ? [...overlay.keys()].filter(filter) : [];
  for (const [path, entry] of overlay)
    if (
      !filter ||
      filter(path) ||
      (entry.kind === 'dir' && selected.some((file) => file.startsWith(path + '/')))
    )
      next.set(path, structuredClone(entry));
  let revisions = world.hosts.revisions.get(host);
  if (!revisions)
    world.hosts.revisions.set(host, (revisions = [{ time: -Infinity, overlay: structuredClone(prev) }]));
  revisions.push({ time: world.clock.now, overlay: structuredClone(next) });
  world.hosts.restartSnapshot.set(host, next);
  world.hosts.confVersion++;
}

/** Hooks run after a host's running state changes (the derivation layer registers here). */
export const runtimeHooks: {
  changed: ((world: World, p: HostProfile) => void)[];
  beforeChange: ((world: World, p: HostProfile, action: 'stop' | 'start' | 'reload') => void)[];
} = { changed: [], beforeChange: [] };
const notify = (world: World, p: HostProfile) => runtimeHooks.changed.forEach((h) => h(world, p));
const announce = (world: World, p: HostProfile, action: 'stop' | 'start' | 'reload') =>
  runtimeHooks.beforeChange.forEach((h) => h(world, p, action));

export function stopSplunk(world: World, p: HostProfile): void {
  op(world, { k: 'svc', host: p.hostname, op: 'stop' }, () => stop(world, p));
}

function stop(world: World, p: HostProfile): void {
  announce(world, p, 'stop');
  const s = state(world, p.hostname);
  if (!s.running) return;
  s.running = false;
  s.events.push({ time: world.clock.now, kind: 'stop' });
  if (p.infra) p.infra.status = 'down';
  notify(world, p);
}

export function startSplunk(world: World, p: HostProfile): void {
  if (p.role === 'deployment_server' && !world.forwarders && world.journal.depth === 0)
    enableForwarderOperations(world);
  op(world, { k: 'svc', host: p.hostname, op: 'start' }, () => start(world, p));
}

function start(world: World, p: HostProfile): void {
  const client = world.forwarders?.clients[p.hostname];
  if (client && (!client.installed || !client.licenseAccepted))
    throw new Error('Install the forwarder and accept the training license flag before starting');
  announce(world, p, 'start');
  const s = state(world, p.hostname);
  if (s.running) return;
  // Every start re-reads all config from disk.
  ensureFs(world, p);
  snapshotOverlay(world, p.hostname);
  s.running = true;
  s.events.push({ time: world.clock.now, kind: 'start' });
  if (p.infra) p.infra.status = 'up';
  notify(world, p);
}

export function restartSplunk(world: World, p: HostProfile): void {
  if (p.role === 'deployment_server' && !world.forwarders && world.journal.depth === 0)
    enableForwarderOperations(world);
  validateForwarderStart(world, p);
  op(world, { k: 'svc', host: p.hostname, op: 'restart' }, () => {
    stop(world, p);
    start(world, p);
  });
}

/** True for paths `splunk reload deploy-server` re-reads on a deployment server. */
export function isDeploymentPath(p: HostProfile, path: string): boolean {
  const home = p.splunk!.home;
  return path.startsWith(`${home}/etc/deployment-apps/`) || /\/serverclass\.conf$/.test(path);
}

export function reloadDeployServer(world: World, p: HostProfile, cls?: string): void {
  if (p.role === 'deployment_server' && !world.forwarders && world.journal.depth === 0)
    enableForwarderOperations(world);
  op(world, { k: 'svc', host: p.hostname, op: 'reload', ...(cls !== undefined && { cls }) }, () =>
    reload(world, p, cls),
  );
}

function reload(world: World, p: HostProfile, cls?: string): void {
  announce(world, p, 'reload');
  ensureFs(world, p);
  snapshotOverlay(world, p.hostname, (path) => isDeploymentPath(p, path));
  const event: ServiceEvent = { time: world.clock.now, kind: 'reload', detail: cls };
  state(world, p.hostname).events.push(event);
  notify(world, p);
  event.matches = { ...world.derived.classCounts };
}

/** Make sure the host's overlay map exists (it is created lazily with the host's filesystem). */
function ensureFs(world: World, p: HostProfile): void {
  if (!world.hosts.fsOverlay.has(p.hostname)) world.hosts.fsOverlay.set(p.hostname, new Map());
}

export function deploymentServer(world: World): HostProfile {
  return resolveHost(world, infraName(world, 'deployment_server'))!;
}

/** Historical running config: re-indexing a past time range must not rewrite old events after a fix. */
const historical = new WeakMap<World, Map<string, MergedConf>>();
export function runningConfAt(world: World, p: HostProfile, conf: string, at: number): MergedConf {
  const revision = world.hosts.revisions
    .get(p.hostname)
    ?.filter((r) => r.time <= at)
    .at(-1);

  let cache = historical.get(world);
  if (!cache) historical.set(world, (cache = new Map()));
  const key = `${p.hostname}:${conf}:${revision?.time ?? 'current'}:${world.hosts.confVersion}`;
  let merged = cache.get(key);
  if (!merged) {
    merged = revision
      ? loadConf(
          vfsReader(new Vfs(buildHostTree(world, p, [], true), revision.overlay, () => at)),
          p.splunk!.home,
          conf,
        )
      : runningConf(world, p, conf);
    cache.set(key, merged);
  }
  return merged;
}

/** KV app configuration REST/reload: service-level server.conf still requires restart. */
export function reloadAppConf(world: World, p: HostProfile, app: string): void {
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(app)) throw new Error('Invalid app');
  op(world, { k: 'config.reload', host: p.hostname, app }, () => {
    ensureFs(world, p);
    snapshotOverlay(
      world,
      p.hostname,
      (path) =>
        path.startsWith(`${p.splunk!.home}/etc/apps/${app}/`) &&
        /\/(collections|transforms)\.conf$/.test(path),
    );
  });
}

/** Standalone index creation/online-edit activation; raw disk edits still need a supported apply. */
export function activateIndexConf(world: World, p: HostProfile): void {
  op(world, { k: 'indexes.activate', host: p.hostname }, () => {
    ensureFs(world, p);
    snapshotOverlay(world, p.hostname, (path) => path.endsWith('/indexes.conf'));
  });
}
export function activateInputConf(world: World, p: HostProfile): void {
  op(world, { k: 'inputs.activate', host: p.hostname }, () => {
    ensureFs(world, p);
    snapshotOverlay(world, p.hostname, (path) => path.endsWith('/inputs.conf'));
    notify(world, p);
  });
}
export function activateReportConf(world: World, p: HostProfile): void {
  op(world, { k: 'reports.activate', host: p.hostname }, () => {
    ensureFs(world, p);
    snapshotOverlay(
      world,
      p.hostname,
      (path) => path.endsWith('/savedsearches.conf') || path.endsWith('/metadata/local.meta'),
    );
  });
}
