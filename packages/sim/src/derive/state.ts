import { deploymentInterval, opSetting, operationMetrics } from '../operations';
import { loadConf, mergeConf, setting, type ConfSource, type MergedConf } from '../conf/merge';
import { confBool } from '../conf/parse';
import { HEALTHY, OFFLINE, BLOCKED, WRONG_CLASS, STALE } from '../fleet/tables';
import { setHealth } from '../fleet/health';
import { hostname as fleetHostname, ipAddress } from '../fleet/query';
import { classInputs } from '../hosts/apps';
import { DOMAIN, resolveHost, type HostProfile } from '../hosts/profile';
import {
  deploymentServer,
  runningConf,
  runningConfAt,
  runningVfs,
  runtimeHooks,
  serviceState,
  vfsReader,
} from '../hosts/running';
import { mix32, type Rng } from '../rng';
import { ROOT } from '../vfs/vfs';
import type { World } from '../world';

/**
 * Config → fleet behaviour. Everything here is recomputed from running config (never from files on
 * disk), so edits only matter after the right restart or reload. The 35,000 forwarders don't each
 * get a config: they share the deployment server's apps, matched by serverclass.conf.
 */

export const NO_CLASS = 255;

export interface OutputsConfig {
  key: string;
  groups: string[];
  servers: string[];
}

export interface ServerclassRule {
  name: string;
  whitelist: RegExp[];
  blacklist: RegExp[];
  /** The patterns as written in serverclass.conf. */
  specs: { whitelist: string[]; blacklist: string[] };
  apps: string[];
}

export interface DerivedState {
  rules: ServerclassRule[];
  /** Server class index each row's inputs app belongs to, from the DS mapping (NO_CLASS when none). */
  rowClass: Uint8Array;
  /** Index into `outputs` for each row's deployed outputs config. */
  rowOutputs: Uint16Array;
  outputs: OutputsConfig[];
  /** Forwarders with their own running outputs (local edits + restart). */
  rowLocal: Map<number, number>;
  /** Forwarder rows whose splunkd the user stopped. */
  stopped: Set<number>;
  /** Infra host → receiving (splunktcp) ports from its running inputs.conf. */
  listening: Map<string, number[]>;
  /** 1 when the row's current health was imposed by a constraint (background churn leaves it alone). */
  constrained: Uint8Array;
  /** Per-row check phase: constraints reach each forwarder at its next phone-home / reconnect. */
  phase: Uint32Array;
  /** Per outputs config: 1 if at least one server is reachable right now. */
  outputsOk: Uint8Array;
  outputsBlocked: Uint8Array;
  /** Clients matched by each server class at the last deployment recompute. */
  classCounts: Record<string, number>;
}

// ---------------------------------------------------------------- serverclass.conf

/** Splunk serverclass patterns are case-insensitive regexes where `.` means a literal dot and `*` means `.*`. */
export function serverclassPattern(p: string): RegExp {
  const source = p.trim().replace(/\./g, '\\.').replace(/\*/g, '.*');
  try {
    return new RegExp(`^${source}$`, 'i');
  } catch {
    return /(?!)/;
  }
}

function numbered(st: Map<string, { value: string }>, prefix: string): string[] {
  return [...st.entries()]
    .filter(([k]) => new RegExp(`^${prefix}\\.\\d+$`).test(k))
    .sort((a, b) => Number(a[0].split('.')[1]) - Number(b[0].split('.')[1]))
    .map(([, v]) => v.value);
}

export function parseServerclass(m: MergedConf, availableApps: Set<string>): ServerclassRule[] {
  const rules = new Map<string, ServerclassRule>();
  for (const [name, st] of m.stanzas) {
    const cls = /^serverClass:([^:]+)$/.exec(name);
    if (cls) {
      if (confBool(st.settings.get('disabled')?.value)) continue;
      const r = rules.get(cls[1]!) ?? {
        name: cls[1]!,
        whitelist: [],
        blacklist: [],
        specs: { whitelist: [], blacklist: [] },
        apps: [],
      };
      r.specs = {
        whitelist: numbered(st.settings, 'whitelist'),
        blacklist: numbered(st.settings, 'blacklist'),
      };
      r.whitelist = r.specs.whitelist.map(serverclassPattern);
      r.blacklist = r.specs.blacklist.map(serverclassPattern);
      rules.set(cls[1]!, r);
    }
  }
  for (const name of m.stanzas.keys()) {
    const app = /^serverClass:([^:]+):app:(.+)$/.exec(name);
    if (app && rules.has(app[1]!) && availableApps.has(app[2]!)) rules.get(app[1]!)!.apps.push(app[2]!);
  }
  return [...rules.values()].filter((r) => r.apps.length && r.whitelist.length);
}

export function matchRules(rules: ServerclassRule[], names: string[]): ServerclassRule[] {
  return rules.filter(
    (r) =>
      r.whitelist.some((re) => names.some((n) => re.test(n))) &&
      !r.blacklist.some((re) => names.some((n) => re.test(n))),
  );
}

export function appsFor(rules: ServerclassRule[], names: string[]): string[] {
  const apps = new Set<string>();
  for (const r of matchRules(rules, names)) r.apps.forEach((a) => apps.add(a));
  return [...apps].sort();
}

function rowNames(world: World, row: number): string[] {
  const h = fleetHostname(world, row);
  return [h, `${h}.${DOMAIN}`, ipAddress(world, row)];
}

// ---------------------------------------------------------------- outputs.conf

function outputsFromMerged(m: MergedConf): OutputsConfig {
  const groups = (setting(m, 'tcpout', 'defaultGroup') ?? '')
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean);
  const servers: string[] = [];
  for (const g of groups) {
    const st = m.stanzas.get(`tcpout:${g}`);
    if (!st || confBool(st.settings.get('disabled')?.value)) continue;
    for (const s of (st.settings.get('server')?.value ?? '').split(','))
      if (s.trim()) servers.push(s.trim().toLowerCase());
  }
  return { key: `${groups.join(',')}|${servers.join(',')}`, groups, servers };
}

function internOutputs(d: DerivedState, cfg: OutputsConfig): number {
  const i = d.outputs.findIndex((o) => o.key === cfg.key);
  if (i >= 0) return i;
  d.outputs.push(cfg);
  return d.outputs.length - 1;
}

/** outputs.conf as a forwarder would merge it from these deployed apps (ASCII app precedence). */
function outputsForApps(world: World, apps: string[]): OutputsConfig {
  const ds = deploymentServer(world);
  const reader = vfsReader(runningVfs(world, ds));
  const base = `${ds.splunk!.home}/etc/deployment-apps`;
  const sorted = [...apps].sort();
  const sources: ConfSource[] = [];
  for (const layer of ['local', 'default'])
    for (const a of sorted) {
      const path = `${base}/${a}/${layer}/outputs.conf`;
      if (reader.read(path) !== null) sources.push({ path, app: a });
    }
  return outputsFromMerged(mergeConf('outputs', reader, sources));
}

/** Running outputs of any Splunk host (used for hot forwarders and `splunk list forward-server`). */
export function hostOutputs(world: World, p: HostProfile): OutputsConfig {
  return outputsFromMerged(runningConf(world, p, 'outputs'));
}

export interface TargetStatus {
  server: string;
  host: HostProfile | null;
  port: number;
  reachable: boolean;
}

export function targetStatus(world: World, server: string): TargetStatus {
  const [name = '', portStr = ''] = server.split(':');
  const port = Number(portStr) || 9997;
  const host = resolveHost(world, name);
  const ports = host ? world.derived.listening.get(host.hostname) : undefined;
  const up = host?.infra ? host.infra.status === 'up' : false;
  return {
    server,
    host,
    port,
    reachable:
      !!host &&
      up &&
      !!ports?.includes(port) &&
      !(world.config.profile && host.role === 'indexer' && operationMetrics(world, host).diskFull),
  };
}

// ---------------------------------------------------------------- receivers

function receivingPorts(world: World, p: HostProfile): number[] {
  const m = runningConf(world, p, 'inputs');
  const ports: number[] = [];
  for (const [name, st] of m.stanzas) {
    const r = /^splunktcp(?:-ssl)?:\/\/(?:[^:]*:)?(\d+)$/.exec(name);
    if (r && !confBool(st.settings.get('disabled')?.value)) ports.push(Number(r[1]));
  }
  return ports;
}

// ---------------------------------------------------------------- state

export function initDerived(world: World): DerivedState {
  const n = world.fleet.size;
  const interval = world.config.phoneHomeIntervalMs;
  const phase = new Uint32Array(n);
  for (let r = 0; r < n; r++) phase[r] = mix32(world.seedHash, r, 0x9407) % interval;
  const d: DerivedState = {
    rules: [],
    rowClass: new Uint8Array(n),
    rowOutputs: new Uint16Array(n),
    outputs: [],
    rowLocal: new Map(),
    stopped: new Set(),
    listening: new Map(),
    constrained: new Uint8Array(n),
    phase,
    outputsOk: new Uint8Array(0),
    outputsBlocked: new Uint8Array(0),
    classCounts: {},
  };
  world.derived = d;
  for (const node of world.infra) {
    const p = resolveHost(world, node.hostname)!;
    d.listening.set(node.hostname, p.splunk ? receivingPorts(world, p) : []);
  }
  recomputeDeployment(world);
  return d;
}

/** Re-matches every forwarder against the deployment server's running serverclass.conf. */
export function recomputeDeployment(world: World): void {
  const d = world.derived;
  const ds = deploymentServer(world);
  const reader = vfsReader(runningVfs(world, ds));
  const available = new Set(reader.list(`${ds.splunk!.home}/etc/deployment-apps`) ?? []);
  d.rules = parseServerclass(loadConf(reader, ds.splunk!.home, 'serverclass'), available);
  d.outputs = [];
  const bySet = new Map<string, { cls: number; outputs: number }>();
  const classes = world.config.serverClasses;
  const counts: Record<string, number> = Object.fromEntries(d.rules.map((r) => [r.name, 0]));
  for (let row = 0; row < world.fleet.size; row++) {
    const matched = matchRules(d.rules, rowNames(world, row));
    const apps = new Set<string>();
    for (const r of matched) {
      counts[r.name]!++;
      r.apps.forEach((a) => apps.add(a));
    }
    const key = [...apps].sort().join(',');
    let hit = bySet.get(key);
    if (!hit) {
      const intended = world.fleet.serverClass[row]!;
      const matches = classes
        .map((c, i) => (apps.has(classInputs(world, c.id).app) ? i : -1))
        .filter((i) => i >= 0);
      const cls = matches.includes(intended) ? intended : (matches[0] ?? NO_CLASS);
      hit = { cls, outputs: internOutputs(d, outputsForApps(world, [...apps])) };
      // The intended class only matters when it's ambiguous; cache per (apps, intended).
      if (matches.length <= 1) bySet.set(key, hit);
    }
    d.rowClass[row] = hit.cls;
    d.rowOutputs[row] = hit.outputs;
  }
  d.classCounts = counts;
  for (const row of [...d.rowLocal.keys()]) refreshLocal(world, row);
  refreshReachability(world);
}

function refreshLocal(world: World, row: number): void {
  const d = world.derived;
  const p = resolveHost(world, fleetHostname(world, row))!;
  if (!world.hosts.restartSnapshot.has(p.hostname)) {
    d.rowLocal.delete(row);
    return;
  }
  d.rowLocal.set(row, internOutputs(d, hostOutputs(world, p)));
}

/** Per outputs config: can at least one server accept data right now? */
export function refreshReachability(world: World): void {
  const d = world.derived;
  d.outputsOk = new Uint8Array(d.outputs.length);
  d.outputsBlocked = new Uint8Array(d.outputs.length);
  d.outputs.forEach((o, i) => {
    const targets = o.servers.map((s) => targetStatus(world, s));
    d.outputsOk[i] = targets.some((t) => t.reachable) ? 1 : 0;
    d.outputsBlocked[i] = targets.some(
      (t) => t.reachable && t.host && parsingQueueBlocked(world, t.host, world.clock.now),
    )
      ? 1
      : 0;
  });
}

export function rowOutputsIndex(world: World, row: number): number {
  return world.derived.rowLocal.get(row) ?? world.derived.rowOutputs[row]!;
}

export function rowOutputs(world: World, row: number): OutputsConfig {
  return world.derived.outputs[rowOutputsIndex(world, row)]!;
}

interface Constraint {
  state: number;
  assigned?: number;
}

const pressureCache = new WeakMap<World, { version: number; storm: boolean; tls: boolean }>();
function profilePressure(world: World) {
  let cached = pressureCache.get(world);
  if (!cached || cached.version !== world.hosts.confVersion) {
    cached = {
      version: world.hosts.confVersion,
      storm: deploymentInterval(world) < 60,
      tls: world.infra.some(
        (n) =>
          n.role === 'indexer' &&
          !n.retired &&
          !opSetting(
            world,
            resolveHost(world, n.hostname)!,
            'server',
            'sslConfig',
            'sslVersions',
            'tls1.2',
          ).includes('tls1.2'),
      ),
    };
    pressureCache.set(world, cached);
  }
  return cached;
}
function constraintFor(world: World, row: number): Constraint | null {
  const d = world.derived;
  if (world.config.permanentOfflineRows?.includes(row)) return { state: OFFLINE };
  if (d.stopped.has(row)) return { state: OFFLINE };
  if (world.config.profile) {
    const pressure = profilePressure(world);
    if (pressure.storm || (pressure.tls && world.fleet.version[row]! >= 2)) return { state: STALE };
  }
  if (!d.outputsOk[rowOutputsIndex(world, row)]) return { state: BLOCKED };
  // Backpressure from a saturated receiver can fill its upstream output group.
  if (d.outputsBlocked[rowOutputsIndex(world, row)]) return { state: BLOCKED };
  if (d.rowClass[row] !== world.fleet.serverClass[row])
    return { state: WRONG_CLASS, assigned: d.rowClass[row] };
  return null;
}

export function applyRow(world: World, row: number, rng: Rng, at: number): void {
  const d = world.derived;
  const f = world.fleet;
  const c = constraintFor(world, row);
  if (c) {
    const sameAssign = c.assigned === undefined || f.assignedClass[row] === c.assigned;
    if (f.health[row] !== c.state || !sameAssign) {
      if (f.health[row] === c.state && !sameAssign) f.assignedClass[row] = c.assigned!;
      else setHealth(world, row, c.state, at, rng, c.assigned);
    }
    d.constrained[row] = 1;
  } else if (d.constrained[row]) {
    setHealth(world, row, HEALTHY, at, rng);
    d.constrained[row] = 0;
  }
}

/**
 * Each tick, forwarders whose check time (phone-home / reconnect) falls in (prev, now] pick up the
 * current constraints, so a config change rolls across the fleet over about a minute.
 */
export function applyConstraints(world: World, rng: Rng, prev: number, now: number): void {
  if (now <= prev) return;
  const d = world.derived;
  refreshReachability(world);
  const interval = world.config.phoneHomeIntervalMs;
  for (let row = 0; row < world.fleet.size; row++) {
    const ph = d.phase[row]!;
    if (Math.floor((now - ph) / interval) === Math.floor((prev - ph) / interval)) continue;
    applyRow(world, row, rng, now);
  }
}

runtimeHooks.changed.push((world, p) => {
  if (!world.derived) return;
  const d = world.derived;
  if (p.role === 'deployment_server') recomputeDeployment(world);
  if (p.infra && p.splunk) d.listening.set(p.hostname, receivingPorts(world, p));
  if (p.fleetRow !== undefined) {
    const s = serviceState(world, p.hostname);
    if (s && !s.running) d.stopped.add(p.fleetRow);
    else d.stopped.delete(p.fleetRow);
    refreshLocal(world, p.fleetRow);
  }
  refreshReachability(world);
  // The host the user acted on reflects the change immediately; the rest of the fleet catches up on its own schedule.
  if (p.fleetRow !== undefined)
    applyRow(world, p.fleetRow, world.rng.fork('action', world.clock.now, p.fleetRow), world.clock.now);
});

// ---------------------------------------------------------------- what a forwarder has installed

/** Apps on a forwarder: what the DS maps it to, with the inputs app of its current (assigned) class. */
export function deployedApps(world: World, p: HostProfile): string[] {
  if (p.fleetRow === undefined) return [];
  const row = p.fleetRow;
  const inputsApps = new Set(world.config.serverClasses.map((c) => classInputs(world, c.id).app));
  const apps = appsFor(world.derived.rules, rowNames(world, row)).filter((a) => !inputsApps.has(a));
  const assigned = world.fleet.assignedClass[row]!;
  if (assigned !== NO_CLASS) apps.push(classInputs(world, world.config.serverClasses[assigned]!.id).app);
  return apps.sort();
}

/** An app's files as the deployment server is currently serving them (relative paths). */
export function deployedAppFiles(world: World, app: string): Record<string, string> | null {
  const ds = deploymentServer(world);
  const vfs = runningVfs(world, ds);
  const dir = `${ds.splunk!.home}/etc/deployment-apps/${app}`;
  if (vfs.findNode(dir)?.type !== 'dir') return null;
  const files: Record<string, string> = {};
  vfs.walk(dir, ROOT, (path, node) => {
    if (node.type === 'file') files[path.slice(dir.length + 1)] = vfs.readFile(path, ROOT);
  });
  return files;
}

/** Small queues saturate under the sandbox's steady indexing load. Sizes accept KB/MB/GB. */
export function parsingQueueKB(world: World, p: HostProfile, at: number): number {
  const value = setting(runningConfAt(world, p, 'server', at), 'queue=parsingQueue', 'maxSize') ?? '6MB';
  const m = /^(\d+(?:\.\d+)?)\s*(KB|MB|GB)?$/i.exec(value);
  return m ? Number(m[1]) * ({ KB: 1, MB: 1024, GB: 1048576 }[m[2]?.toUpperCase() ?? 'KB'] ?? 1) : 6144;
}
export function parsingQueueBlocked(world: World, p: HostProfile, at: number): boolean {
  return p.role === 'indexer' && parsingQueueKB(world, p, at) < 512;
}
