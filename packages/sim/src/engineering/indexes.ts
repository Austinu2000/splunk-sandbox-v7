import { indexBuckets } from './lifecycle';
import { recordedClusterCopies } from './cluster-buckets';
import type { IndexCatalogEntry, IndexSettings, PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { hostFs } from '../vfs/build';
import { resolveHost, splunkdRunning, type HostProfile } from '../hosts/profile';
import { loadConf, mergeConf, setting, type MergedConf } from '../conf/merge';
import { confBool, parseConf } from '../conf/parse';
import { runningConf, vfsReader, activateIndexConf } from '../hosts/running';
import { patchConf } from '../scenario/engine';
import { ROOT } from '../vfs/vfs';
import { checksum, filesUnder } from '../hosts/cluster';
import { requireCapability, canSearchIndex, OperationsError } from './access';
import { mix32 } from '../rng';
import { recordedEvents } from './ingestion';

const keys = new Set([
  'homePath',
  'coldPath',
  'thawedPath',
  'datatype',
  'frozenTimePeriodInSecs',
  'maxTotalDataSizeMB',
  'disabled',
  'repFactor',
  'remotePath',
  'maxHotIdleSecs',
  'maxWarmDBCount',
  'coldToFrozenDir',
]);
const requiresRestart = new Set([
  'homePath',
  'coldPath',
  'thawedPath',
  'datatype',
  'repFactor',
  'remotePath',
  'disabled',
  'coldToFrozenDir',
]);
export function validateIndexName(name: string) {
  if (
    !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(name) ||
    name.includes('kvstore') ||
    ['constructor', 'prototype'].includes(name)
  )
    throw new OperationsError(
      'Index names use lowercase letters, numbers, underscores or hyphens; cannot start with _ or - or contain kvstore',
    );
  return name;
}
export function indexHost(world: World, name: string): HostProfile {
  const host = resolveHost(world, name);
  if (!host?.splunk || host.role !== 'indexer' || host.infra?.retired)
    throw new OperationsError('Choose an active simulated indexer');
  return host;
}
export function clusteredIndexer(world: World, host: HostProfile) {
  return ['peer', 'slave'].includes(setting(runningConf(world, host, 'server'), 'clustering', 'mode') ?? '');
}
function readSettings(conf: MergedConf, name: string): IndexSettings {
  const get = (key: string, fallback: string) => setting(conf, name, key) ?? fallback;
  return {
    homePath: get('homePath', `$SPLUNK_DB/${name}/db`),
    coldPath: get('coldPath', `$SPLUNK_DB/${name}/colddb`),
    thawedPath: get('thawedPath', `$SPLUNK_DB/${name}/thaweddb`),
    datatype: get('datatype', 'event') as 'event' | 'metric',
    frozenTimePeriodInSecs: Number(get('frozenTimePeriodInSecs', '188697600')),
    maxTotalDataSizeMB: Number(get('maxTotalDataSizeMB', '500000')),
    disabled: confBool(get('disabled', 'false')),
    remotePath: get('remotePath', ''),
    repFactor: get('repFactor', '0') as '0' | 'auto',
    maxHotIdleSecs: Number(get('maxHotIdleSecs', '0')),
    maxWarmDBCount: Number(get('maxWarmDBCount', '300')),
    coldToFrozenDir: get('coldToFrozenDir', ''),
  };
}
export function validateIndexSettings(
  values: Record<string, unknown>,
  complete = false,
): Partial<IndexSettings> {
  for (const key of Object.keys(values))
    if (!keys.has(key)) throw new OperationsError(`Unsupported index setting: ${key}`);
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(values)) {
    if (['frozenTimePeriodInSecs', 'maxTotalDataSizeMB', 'maxHotIdleSecs', 'maxWarmDBCount'].includes(key)) {
      const value = Number(raw);
      if (
        !Number.isSafeInteger(value) ||
        value < (['maxHotIdleSecs', 'maxWarmDBCount'].includes(key) ? 0 : 1) ||
        value > 4294967295
      )
        throw new OperationsError(
          `${key} must be a valid nonnegative integer (retention and size must be positive), no greater than 4294967295`,
        );
      out[key] = value;
    } else if (key === 'disabled') {
      if (![true, false, 'true', 'false', '0', '1', 0, 1].includes(raw as string))
        throw new OperationsError('disabled must be true or false');
      out[key] = [true, 'true', '1', 1].includes(raw as string);
    } else if (['homePath', 'coldPath', 'thawedPath', 'coldToFrozenDir'].includes(key)) {
      const value = String(raw);
      if (key === 'coldToFrozenDir' && value === '') {
        out[key] = '';
        continue;
      }
      if (
        value.length > 300 ||
        !/^(?:\/|\$SPLUNK_DB\/)/.test(value) ||
        /[\r\n;&|`]/.test(value) ||
        value.includes(String.fromCharCode(0)) ||
        value.split('/').includes('..') ||
        /\$(?!SPLUNK_DB|_index_name)/.test(value)
      )
        throw new OperationsError(
          `Invalid virtual ${key}; use an absolute path or $SPLUNK_DB path without traversal`,
        );
      out[key] = value;
    } else if (key === 'datatype') {
      if (!['event', 'metric'].includes(String(raw)))
        throw new OperationsError('datatype must be event or metric');
      out[key] = raw;
    } else if (key === 'remotePath') {
      const value = String(raw);
      if (
        value !== '' &&
        (!/^volume:[A-Za-z][A-Za-z0-9_-]{0,63}\/[A-Za-z0-9_.$/-]+$/.test(value) ||
          value.split('/').includes('..') ||
          /\$(?!_index_name)/.test(value))
      )
        throw new OperationsError('Use volume:NAME/path with the optional $_index_name token');
      out[key] = value;
    } else if (key === 'repFactor') {
      if (!['auto', '0'].includes(String(raw))) throw new OperationsError('repFactor must be auto or 0');
      out[key] = String(raw);
    }
  }
  if (complete && ['homePath', 'coldPath', 'thawedPath'].some((key) => !out[key]))
    throw new OperationsError('All three storage paths are required');
  const paths = ['homePath', 'coldPath', 'thawedPath'].flatMap((key) => (out[key] ? [String(out[key])] : []));
  if (new Set(paths).size !== paths.length)
    throw new OperationsError('Home, cold and thawed paths must be distinct');
  return out;
}
export function indexCatalog(
  world: World,
  hostName: string,
  principal: PracticePrincipal = 'admin',
  disk = false,
): IndexCatalogEntry[] {
  const host = indexHost(world, hostName),
    fs = hostFs(world, host);
  const declared = loadConf(vfsReader(fs), host.splunk!.home, 'indexes'),
    effective = runningConf(world, host, 'indexes');
  const conf = disk ? declared : effective;
  return [...conf.stanzas.entries()]
    .filter(([name]) => name !== 'default' && !name.startsWith('volume:'))
    .filter(([name]) => canSearchIndex(world, hostName, principal, name))
    .map(([name, stanza]) => {
      const settings = readSettings(conf, name),
        source = stanza.settings.get('homePath')?.path ?? stanza.path;
      const issues: string[] = [];
      try {
        validateIndexSettings({ ...settings }, true);
      } catch (e) {
        issues.push((e as Error).message);
      }
      const sourceApp = /\/etc\/(?:apps|peer-apps)\/([^/]+)\//.exec(source)?.[1] ?? 'system';
      const baseline = [
        '_internal',
        '_audit',
        'main',
        ...(world.config.profile?.indexes.map((i) => i.name) ?? ['os', 'app', 'network']),
      ].includes(name);
      const recorded =
        (world.clusterManagement
          ? indexBuckets(world)
              .filter(
                (b) =>
                  b.index === name &&
                  b.state !== 'frozen' &&
                  (recordedClusterCopies(world, b.id)?.copies.some((c) => c.host === hostName) ??
                    b.host === hostName),
              )
              .reduce((total, b) => total + b.bytes, 0)
          : recordedEvents(world)
              .filter((event) => event.receiver === hostName && event.index === name)
              .reduce((total, event) => total + event.bytes, 0)) /
        1024 ** 2;
      return {
        name,
        host: hostName,
        app: sourceApp,
        owner: 'nobody',
        sourcePath: source,
        deployment: clusteredIndexer(world, host) ? ('cluster-peer' as const) : ('standalone' as const),
        settings,
        pending:
          JSON.stringify(readSettings(declared, name)) !== JSON.stringify(readSettings(effective, name)) ||
          !effective.stanzas.has(name),
        currentDBSizeMB:
          (baseline
            ? Math.min(settings.maxTotalDataSizeMB, 1000 + (mix32(host.hash, name.length) % 90000))
            : 0) + recorded,
        issues,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}
export function indexExists(world: World, name: string, hostName?: string): boolean {
  const hosts = hostName
    ? [indexHost(world, hostName)]
    : world.infra
        .filter((h) => h.role === 'indexer' && !h.retired)
        .map((h) => resolveHost(world, h.hostname)!);
  return hosts.some(
    (host) =>
      splunkdRunning(world, host) &&
      runningConf(world, host, 'indexes').stanzas.has(name) &&
      !confBool(setting(runningConf(world, host, 'indexes'), name, 'disabled')),
  );
}
export function activeIndexNames(world: World): string[] {
  const names = new Set<string>();
  for (const target of world.infra.filter((h) => h.role === 'indexer' && !h.retired)) {
    const host = resolveHost(world, target.hostname)!;
    if (!splunkdRunning(world, host)) continue;
    for (const [name] of runningConf(world, host, 'indexes').stanzas)
      if (
        name !== 'default' &&
        !name.startsWith('volume:') &&
        !confBool(setting(runningConf(world, host, 'indexes'), name, 'disabled'))
      )
        names.add(name);
  }
  return [...names];
}
export function indexRevision(world: World, hostName: string) {
  const host = indexHost(world, hostName);
  return checksum(filesUnder(hostFs(world, host), host.splunk!.home + '/etc'));
}
export function changeIndex(
  world: World,
  hostName: string,
  name: string,
  values: Record<string, unknown>,
  options: { principal?: PracticePrincipal; create?: boolean; expectedRevision?: string } = {},
) {
  validateIndexName(name);
  const host = indexHost(world, hostName),
    principal = options.principal ?? 'admin';
  requireCapability(world, hostName, principal, 'indexes_edit');
  if (clusteredIndexer(world, host))
    throw new OperationsError(
      'Cluster peer indexes are managed through the Cluster Manager manager-apps/_cluster/local/indexes.conf and a validated configuration bundle',
    );
  if (options.expectedRevision && options.expectedRevision !== indexRevision(world, hostName))
    throw new OperationsError('Configuration changed; reload before saving');
  const current = indexCatalog(world, hostName, 'admin', true).find((i) => i.name === name);
  if (options.create && current) throw new OperationsError('Index already exists');
  if (!options.create && !current) throw new OperationsError('Index does not exist');
  const settings = {
    ...(current?.settings ?? {
      homePath: `$SPLUNK_DB/${name}/db`,
      coldPath: `$SPLUNK_DB/${name}/colddb`,
      thawedPath: `$SPLUNK_DB/${name}/thaweddb`,
      datatype: 'event',
      frozenTimePeriodInSecs: 188697600,
      maxTotalDataSizeMB: 500000,
      disabled: false,
      repFactor: '0',
    }),
    ...validateIndexSettings(values),
  };
  validateIndexSettings(settings, true);
  if (settings.remotePath)
    throw new OperationsError(
      'SmartStore execution is supported through an opted-in indexer cluster, not standalone index administration',
    );
  const all = indexCatalog(world, hostName, 'admin', true);
  const active = indexCatalog(world, hostName, 'admin');
  for (const other of all.filter((i) => i.name !== name))
    for (const path of [settings.homePath, settings.coldPath, settings.thawedPath])
      if ([other.settings.homePath, other.settings.coldPath, other.settings.thawedPath].includes(path))
        throw new OperationsError('Storage path conflicts with another index');
  const file = host.splunk!.home + '/etc/system/local/indexes.conf',
    fs = hostFs(world, host);
  const old = fs.exists(file) ? fs.readFile(file, ROOT) : '';
  fs.writeFile(
    file,
    patchConf(old, name, Object.fromEntries(Object.entries(settings).map(([k, v]) => [k, String(v)]))),
    ROOT,
  );
  fs.setMeta(file, { owner: 'splunk', group: 'splunk', mode: 0o644 }, ROOT);
  const activeCurrent = active.find((i) => i.name === name);
  const differs = (left: IndexSettings, right: IndexSettings) =>
    [...requiresRestart].some(
      (key) => String(left[key as keyof IndexSettings]) !== String(right[key as keyof IndexSettings]),
    );
  const restartRequired =
    (!!activeCurrent && differs(settings, activeCurrent.settings)) ||
    all.some(
      (i) => i.name !== name && active.some((a) => a.name === i.name && differs(i.settings, a.settings)),
    ) ||
    active.some((a) => !all.some((i) => i.name === a.name));
  if (!restartRequired) activateIndexConf(world, host);
  return {
    index: indexCatalog(world, hostName, 'admin', true).find((i) => i.name === name)!,
    restartRequired,
  };
}
export function removeIndex(
  world: World,
  hostName: string,
  name: string,
  principal: PracticePrincipal = 'admin',
) {
  validateIndexName(name);
  const host = indexHost(world, hostName);
  requireCapability(world, hostName, principal, 'indexes_edit');
  if (clusteredIndexer(world, host))
    throw new OperationsError('Remove clustered definitions through the Cluster Manager workflow');
  if (
    ['main', ...(world.config.profile?.indexes.map((i) => i.name) ?? ['os', 'app', 'network'])].includes(name)
  )
    throw new OperationsError('Shipped teaching indexes cannot be deleted');
  const existing = indexCatalog(world, hostName, 'admin', true).find((i) => i.name === name);
  if (!existing) throw new OperationsError('Index does not exist');
  if (
    existing.currentDBSizeMB > 0 ||
    world.ingestion?.events.some((e) => e.index === name && e.receiver === hostName)
  )
    throw new OperationsError('Only empty custom indexes can be deleted through this practice workflow');
  if (indexCatalog(world, hostName, 'admin', true).some((i) => i.name !== name && i.pending))
    throw new OperationsError('Activate or revert other pending index changes before deleting an index');
  const fs = hostFs(world, host),
    conf = loadConf(vfsReader(fs), host.splunk!.home, 'indexes');
  const definitions = conf.sources.filter((source) =>
    parseConf(fs.readFile(source.path, ROOT)).stanzas.has(name),
  );
  if (definitions.length !== 1)
    throw new OperationsError(
      'Multiple definition files exist; remove the definition at its configuration source',
    );
  const path = definitions[0]!.path;
  let omit = false;
  const text = fs
    .readFile(path, ROOT)
    .split('\n')
    .filter((line) => {
      const match = /^\s*\[([^\]]+)\]/.exec(line);
      if (match) omit = match[1] === name;
      return !omit;
    })
    .join('\n');
  fs.writeFile(path, text, ROOT);
  activateIndexConf(world, host);
}
export function validateClusterIndexes(files: Record<string, string>) {
  const paths = Object.keys(files)
    .filter((p) => p.endsWith('/indexes.conf'))
    .sort((a, b) => {
      const local = (path: string) => (path.includes('/local/') ? 0 : 1);
      return local(a) - local(b) || (a < b ? -1 : a > b ? 1 : 0);
    });
  for (const path of paths) {
    const text = files[path]!;
    const conf = parseConf(text);
    if (conf.errors.length) throw new OperationsError(`Invalid indexes.conf syntax: ${path}`);
  }
  const conf = mergeConf(
    'indexes',
    { read: (path) => files[path] ?? null, list: () => [] },
    paths.map((path) => ({ path })),
  );
  for (const [name, stanza] of conf.stanzas) {
    if (name === 'default' || name.startsWith('volume:')) continue;
    if (stanza.settings.get('repFactor')?.value !== 'auto')
      throw new OperationsError(`Cluster index ${name} requires repFactor = auto in ${stanza.path}`);
    for (const [key, value] of stanza.settings)
      if (keys.has(key)) validateIndexSettings({ [key]: value.value });
  }
}
