import { deliveryConfForRow } from '../engineering/forwarders';
import { streamState } from '../operations';
import { mergeConf, type ConfSource, type MergedConf } from '../conf/merge';
import { confBool } from '../conf/parse';
import { deployedApps } from '../derive/state';
import {
  profileLog,
  appLog,
  debugLog,
  messagesLog,
  secureLog,
  winEventLog,
  type LogSource,
} from '../logs/sources';
import { globToRegExp } from '../vfs/path';
import { can, type NodeMeta } from '../vfs/vfs';
import type { World } from '../world';
import { deploymentServer, runningConf, runningVfs, vfsReader } from './running';
import type { HostProfile } from './profile';

/**
 * What a forwarder actually collects: its effective inputs.conf (the apps the deployment server
 * gave it, plus any local overrides after a restart) matched against the files on the host, minus
 * files the splunk user can't read. Search data, metrics and license usage all come from here.
 */

export interface DataFile {
  path: string;
  owner: string;
  group: string;
  mode: number;
  log: LogSource;
}

/** Log files that exist on a forwarder (independent of whether anything collects them). */
export function hostDataFiles(world: World, p: HostProfile): DataFile[] {
  if (world.config.profile) return profileDataFiles(world, p);
  if (p.fleetRow === undefined || p.os !== 'linux') return [];
  const cls = world.config.serverClasses[world.fleet.serverClass[p.fleetRow]!]!.id;
  const files: DataFile[] = [
    { path: '/var/log/messages', owner: 'root', group: 'splunk', mode: 0o640, log: messagesLog(world, p) },
    { path: '/var/log/secure', owner: 'root', group: 'splunk', mode: 0o640, log: secureLog(world, p) },
  ];
  const own = (path: string, owner: string) => ({
    path,
    owner,
    group: owner,
    mode: 0o644,
    log: appLog(world, p, cls),
  });
  if (cls === 'linux_app') {
    files.push(own('/var/log/app/app.log', 'app'));
    // The application's debug log exists everywhere but is normally excluded by the inputs blacklist.
    files.push({
      path: '/var/log/app/debug.log',
      owner: 'app',
      group: 'app',
      mode: 0o644,
      log: debugLog(world, p),
    });
  }
  if (cls === 'linux_web') files.push(own('/var/log/nginx/access.log', 'nginx'));
  if (cls === 'linux_db') files.push(own('/var/log/mysql/mysqld.log', 'mysql'));
  if (cls === 'syslog_relay') files.push(own('/data/syslog/edge-fw01/edge-fw01.log', 'root'));
  return files;
}

export interface CollectedInput {
  multiplier?: number;
  /** File path, or WinEventLog:<Log> for Windows event logs. */
  source: string;
  sourcetype: string;
  index: string;
  host?: string;
  log: LogSource;
}

export interface ForwarderInputs {
  collected: CollectedInput[];
  /** Monitored files the splunk user can't read (TailReader logs a warning for each). */
  unreadable: string[];
}

const SPLUNK = { user: 'splunk', groups: ['splunk'] };

/** Permission check against the host's file overlay (generated files are readable unless changed). */
export function readableBySplunk(world: World, p: HostProfile, file: DataFile): boolean {
  const overlay = world.hosts.fsOverlay.get(p.hostname);
  const meta = (path: string, fallback: NodeMeta | null): NodeMeta | null => {
    const e = overlay?.get(path);
    if (!e || e.kind === 'deleted') return fallback;
    return { owner: e.owner, group: e.group, mode: e.mode, mtime: 0 };
  };
  const f = meta(file.path, { owner: file.owner, group: file.group, mode: file.mode, mtime: 0 })!;
  if (!can(f, SPLUNK, 4)) return false;
  const parts = file.path.split('/').slice(1, -1);
  for (let i = 1; i <= parts.length; i++) {
    const d = meta('/' + parts.slice(0, i).join('/'), null);
    if (d && !can(d, SPLUNK, 1)) return false;
  }
  return overlay?.get(file.path)?.kind !== 'deleted';
}

const cache = new WeakMap<World, Map<string, MergedConf>>();

/** inputs.conf as the forwarder runs it. */
function effectiveInputs(world: World, p: HostProfile): MergedConf {
  // Hosts the user restarted have their own running config (local overrides included).
  if (world.hosts.restartSnapshot.has(p.hostname)) return runningConf(world, p, 'inputs');
  if (world.forwarders && p.fleetRow !== undefined) {
    const delivered = deliveryConfForRow(world, p.fleetRow, 'inputs');
    if (delivered) return delivered;
  }
  const apps = deployedApps(world, p);
  const key = `${apps.join(',')}|${world.hosts.confVersion}`;
  let perWorld = cache.get(world);
  if (!perWorld) cache.set(world, (perWorld = new Map()));
  let merged = perWorld.get(key);
  if (!merged) {
    const ds = deploymentServer(world);
    const reader = vfsReader(runningVfs(world, ds));
    const base = `${ds.splunk!.home}/etc/deployment-apps`;
    const sources: ConfSource[] = [];
    for (const layer of ['local', 'default'])
      for (const a of [...apps].sort()) {
        const path = `${base}/${a}/${layer}/inputs.conf`;
        if (reader.read(path) !== null) sources.push({ path, app: a });
      }
    merged = mergeConf('inputs', reader, sources);
    perWorld.set(key, merged);
  }
  return merged;
}

function pathMatches(spec: string, path: string): boolean {
  if (!/[*?]/.test(spec)) return path === spec || path.startsWith(spec.replace(/\/$/, '') + '/');
  const re = new RegExp(
    '^' +
      spec
        .split('/')
        .map((seg) => (seg === '...' ? '.*' : globToRegExp(seg).source.slice(1, -1)))
        .join('/') +
      '$',
  );
  return re.test(path);
}

function regexOk(pattern: string | undefined, path: string): boolean | null {
  if (pattern === undefined || pattern === '') return null;
  try {
    return new RegExp(pattern).test(path);
  } catch {
    return null;
  }
}

const WIN_LOGS = ['Security', 'System', 'Application', 'Directory Service'] as const;

export function forwarderInputs(world: World, p: HostProfile): ForwarderInputs {
  const out: ForwarderInputs = { collected: [], unreadable: [] };
  if (p.fleetRow === undefined) return out;
  const conf = effectiveInputs(world, p);
  const stanzas = [...conf.stanzas.values()].filter((s) => !confBool(s.settings.get('disabled')?.value));

  if (p.os === 'windows') {
    for (const s of stanzas) {
      const m = /^WinEventLog:\/\/(.+)$/.exec(s.name);
      if (!m || !(WIN_LOGS as readonly string[]).includes(m[1]!)) continue;
      const name = m[1] as (typeof WIN_LOGS)[number];
      out.collected.push({
        multiplier:
          world.config.profile &&
          !['4662', '5156'].every((code) => (s.settings.get('blacklist')?.value ?? '').includes(code))
            ? 2
            : 1,
        source: `WinEventLog:${name}`,
        sourcetype: s.settings.get('sourcetype')?.value ?? `WinEventLog:${name}`,
        index: s.settings.get('index')?.value ?? 'main',
        log: world.config.profile
          ? windowsProfileLog(world, p, s.settings.get('blacklist')?.value ?? '')
          : winEventLog(world, p, name),
      });
    }
    return out;
  }

  const monitors = stanzas
    .filter((s) => s.name.startsWith('monitor://'))
    .map((s) => ({ s, spec: s.name.slice('monitor://'.length) }))
    // A more specific stanza wins when two cover the same file.
    .sort((a, b) => b.spec.length - a.spec.length);
  for (const file of hostDataFiles(world, p)) {
    const hit = monitors.find(({ s, spec }) => {
      if (!pathMatches(spec, file.path)) return false;
      if (regexOk(s.settings.get('whitelist')?.value, file.path) === false) return false;
      if (regexOk(s.settings.get('blacklist')?.value, file.path) === true) return false;
      return true;
    });
    if (!hit) continue;
    if (!readableBySplunk(world, p, file)) {
      out.unreadable.push(file.path);
      continue;
    }
    const st = hit.s.settings;
    const segment = Number(st.get('host_segment')?.value);
    out.collected.push({
      source: file.path,
      sourcetype: st.get('sourcetype')?.value ?? file.path.replace(/^.*\//, '').replace(/\.\w+$/, ''),
      index: st.get('index')?.value ?? 'main',
      host: segment ? file.path.split('/')[segment] : undefined,
      log: file.log,
    });
  }
  return out;
}

/** Throughput a sourcetype adds on top of the host's base rate (the noisy debug log). */
export const EXTRA_KBPS: Record<string, number> = { 'app:debug': 60 };

export function profileDataFiles(world: World, p: HostProfile): DataFile[] {
  if (p.os !== 'linux') return [];
  const files: DataFile[] = (world.config.profile?.dataSources ?? [])
    .filter(
      (d) =>
        d.via === p.hostname ||
        (p.fleetRow !== undefined && d.via === 'forwarders' && !d.sourcetypes.includes('XmlWinEventLog')),
    )
    .flatMap((d) =>
      d.sourcetypes.map((st) => ({
        path: `/var/log/profile/${d.id}/${st.replace(/:/g, '_')}.log`,
        owner: 'root',
        group: 'splunk',
        mode: 0o640,
        log: profileLog(world, p, st),
      })),
    );
  if (
    p.fleetRow !== undefined &&
    world.config.serverClasses[world.fleet.serverClass[p.fleetRow]!]!.id === 'linux_app'
  )
    files.push({
      path: '/var/log/app/debug.log',
      owner: 'app',
      group: 'app',
      mode: 0o644,
      log: debugLog(world, p),
    });
  return files;
}
export function profileRelayInputs(world: World, p: HostProfile): CollectedInput[] {
  if (!world.config.profile || p.role !== 'heavy_forwarder') return [];
  const conf = runningConf(world, p, 'inputs');
  return profileDataFiles(world, p).flatMap((file) => {
    const st = conf.stanzas.get(`monitor://${file.path}`);
    if (!st || confBool(st.settings.get('disabled')?.value) || !readableBySplunk(world, p, file)) return [];
    const definition = world.config.profile!.dataSources.find((d) =>
      file.path.includes(`/profile/${d.id}/`),
    )!;
    const state = streamState(world, p, definition.id);
    if (!state.enabled) return [];
    return [
      {
        source: file.path,
        sourcetype: state.sourcetype ?? st.settings.get('sourcetype')!.value,
        index: st.settings.get('index')!.value,
        log: file.log,
      },
    ];
  });
}

function windowsProfileLog(world: World, p: HostProfile, blacklist: string): LogSource {
  const log = profileLog(world, p, 'XmlWinEventLog');
  const entries = (a: number, b: number) =>
    log
      .entries(a, b)
      .filter(
        ([, raw]) =>
          !['4662', '5156'].some(
            (code) => blacklist.includes(code) && raw.includes(`<EventID>${code}</EventID>`),
          ),
      );
  return { ...log, entries, lines: (a, b) => entries(a, b).map((e) => e[1]) };
}
