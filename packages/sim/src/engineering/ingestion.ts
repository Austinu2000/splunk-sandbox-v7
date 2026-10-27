import type {
  InputCheckpoint,
  IngestionState,
  PracticePrincipal,
  RecordedEvent,
  ResultValue,
} from '@sandbox/shared';
import type { World } from '../world';
import { indexExists } from './indexes';
import { OperationsError, requireCapability } from './access';
import { resolveHost, splunkdRunning, type HostProfile } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { activateInputConf, runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { hostOutputs, rowOutputs, targetStatus } from '../derive/state';
import { ROOT } from '../vfs/vfs';
import { globToRegExp } from '../vfs/path';
import { patchConf } from '../scenario/engine';
import { parseConfig, extractTime, nullQueued, mergesWithPrevious } from '../ingest/parsing';
import { hashString } from '../rng';
import { journal } from '../journal';
import { searchableRecordedEvents } from './lifecycle';

export function ingestionState(world: World): IngestionState {
  return (world.ingestion ??= { version: 1, nextId: 1, events: [], checkpoints: {}, status: {} });
}
export function deliveryPath(world: World, source: HostProfile) {
  let host = source,
    parser: HostProfile | undefined;
  const seen = new Set<string>();
  for (let depth = 0; depth < 8; depth++) {
    if (seen.has(host.hostname) || !splunkdRunning(world, host))
      throw new OperationsError('Input delivery is blocked by a stopped service or routing loop');
    seen.add(host.hostname);
    if (host.role === 'indexer') return { receiver: host, parser: parser ?? host };
    if (host.role === 'heavy_forwarder') parser ??= host;
    const outputs = host.fleetRow === undefined ? hostOutputs(world, host) : rowOutputs(world, host.fleetRow);
    const target = outputs.servers.map((s) => targetStatus(world, s)).find((s) => s.reachable && s.host);
    if (!target?.host) throw new OperationsError('No reachable receiver from outputs.conf');
    host = target.host;
  }
  throw new OperationsError('Delivery hop limit');
}
export function routeEvent(
  world: World,
  parser: HostProfile,
  sourcetype: string,
  raw: string,
  initial: string,
) {
  let index = initial;
  const props = runningConf(world, parser, 'props').stanzas.get(sourcetype),
    transforms = runningConf(world, parser, 'transforms');
  for (const [key, value] of props?.settings ?? [])
    if (/^TRANSFORMS(?:-|$)/.test(key))
      for (const name of value.value.split(',').map((s) => s.trim())) {
        const stanza = transforms.stanzas.get(name);
        if (!stanza) continue;
        const dest = stanza.settings.get('DEST_KEY')?.value;
        if (dest !== '_MetaData:Index') continue;
        const pattern = stanza.settings.get('REGEX')?.value ?? '.';
        if (pattern.length > 500) throw new OperationsError('Routing regex limit');
        let re: RegExp;
        try {
          re = new RegExp(pattern);
        } catch {
          throw new OperationsError('Invalid routing REGEX');
        }
        if (re.test(raw)) index = stanza.settings.get('FORMAT')?.value ?? index;
      }
  return index;
}
type EventInput = Omit<RecordedEvent, 'id' | 'bytes'>;
export const eventMetadata = new Set([
  '_time',
  '_indextime',
  '_raw',
  'host',
  'source',
  'sourcetype',
  'index',
  'splunk_server',
  'linecount',
]);
export function appendRecordedEvents(
  world: World,
  events: EventInput[],
  checkpoints: Record<string, InputCheckpoint> = {},
) {
  const current = world.ingestion;
  if (events.length > 1000 || (current?.events.length ?? 0) + events.length > 20000)
    throw new OperationsError('Recorded-event limit: 20,000 per world, 1,000 per write');
  const records = events.map((event, index) => {
    if (event.raw.length > 65536 || !Number.isFinite(event.time) || !Number.isFinite(event.indexTime))
      throw new OperationsError('Invalid event size or timestamp');
    if (
      Object.keys(event.fields).some(
        (key) => eventMetadata.has(key) || ['__proto__', 'constructor', 'prototype'].includes(key),
      )
    )
      throw new OperationsError('Event fields cannot override reserved event metadata');
    if (!indexExists(world, event.index, event.receiver))
      throw new OperationsError(
        `Destination index ${event.index} is missing, disabled or unavailable on ${event.receiver}`,
      );
    if (
      setting(runningConf(world, resolveHost(world, event.receiver)!, 'indexes'), event.index, 'datatype') ===
      'metric'
    )
      throw new OperationsError(
        'Metric index ingestion and mstats are not yet supported; use an events index for this recorded-event workflow',
      );
    return {
      ...structuredClone(event),
      id: `event-${world.clock.tick}-${(current?.nextId ?? 1) + index}`,
      bytes: new TextEncoder().encode(event.raw).length,
    };
  });
  const state = ingestionState(world);
  state.nextId += records.length;
  state.events.push(...records);
  Object.assign(state.checkpoints, structuredClone(checkpoints));
  journal(world, {
    k: 'ingestion.append',
    records: structuredClone(records),
    checkpoints: structuredClone(checkpoints),
    nextId: state.nextId,
  });
  return records;
}
export function replayRecordedEvents(
  world: World,
  records: RecordedEvent[],
  checkpoints: Record<string, InputCheckpoint>,
  nextId: number,
) {
  const state = ingestionState(world);
  state.events.push(...structuredClone(records));
  Object.assign(state.checkpoints, structuredClone(checkpoints));
  state.nextId = nextId;
}
export function ingestText(
  world: World,
  hostName: string,
  source: string,
  sourcetype: string,
  index: string,
  text: string,
  provenance: RecordedEvent['provenance'] = 'input',
  fields: Record<string, ResultValue> = {},
) {
  const host = resolveHost(world, hostName);
  if (!host?.splunk) throw new OperationsError('Choose a host with Splunk');
  const path = deliveryPath(world, host),
    config = parseConfig(world, path.parser, sourcetype, world.clock.now);
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  const chunks: string[] = [];
  for (const line of lines) {
    if (chunks.length && mergesWithPrevious(config, line)) chunks[chunks.length - 1] += '\n' + line;
    else chunks.push(line);
  }
  const events = chunks
    .filter((raw) => !nullQueued(config, raw))
    .map((raw) => ({
      time: extractTime(config, raw) ?? world.clock.now,
      indexTime: world.clock.now,
      raw,
      host: host.hostname,
      source,
      sourcetype,
      index: routeEvent(world, path.parser, sourcetype, raw, index),
      receiver: path.receiver.hostname,
      fields,
      provenance,
      operationId: `${hostName}:${source}:${world.clock.tick}:${world.ingestion?.nextId ?? 1}`,
    }));
  return appendRecordedEvents(world, events);
}
export function configureMonitor(
  world: World,
  hostName: string,
  path: string,
  values: Record<string, string>,
  principal: PracticePrincipal = 'admin',
) {
  const host = resolveHost(world, hostName);
  if (!host?.splunk) throw new OperationsError('Choose a host with Splunk');
  requireCapability(world, hostName, principal, 'edit_monitor');
  if (!path.startsWith('/') || path.includes('..') || /[\r\n[\]]/.test(path))
    throw new OperationsError('Use an absolute virtual monitor path without traversal');
  for (const [key, value] of Object.entries(values)) {
    if (!['index', 'sourcetype', 'disabled', 'host', 'whitelist', 'blacklist'].includes(key))
      throw new OperationsError('Unsupported monitor setting: ' + key);
    if (value.length > 300 || /[\r\n]/.test(value)) throw new OperationsError('Invalid monitor value');
  }
  const fs = hostFs(world, host),
    file = host.splunk.home + '/etc/system/local/inputs.conf';
  fs.writeFile(
    file,
    patchConf(fs.exists(file) ? fs.readFile(file, ROOT) : '', `monitor://${path}`, values),
    ROOT,
  );
  fs.setMeta(file, { owner: 'splunk', group: 'splunk', mode: 0o644 }, ROOT);
  activateInputConf(world, host);
}
export function uploadPracticeFile(
  world: World,
  hostName: string,
  path: string,
  text: string,
  principal: PracticePrincipal = 'admin',
) {
  const host = resolveHost(world, hostName);
  if (!host?.splunk) throw new OperationsError('No Splunk installation');
  requireCapability(world, hostName, principal, 'edit_monitor');
  if (!path.startsWith('/var/log/practice/') || path.includes('..') || text.length > 250000)
    throw new OperationsError('Uploads use /var/log/practice/ and at most 250,000 characters');
  const fs = hostFs(world, host);
  fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(path, text, ROOT);
  fs.setMeta(path, { owner: 'splunk', group: 'splunk', mode: 0o644 }, ROOT);
}
export function tickInputs(world: World) {
  for (const [hostName, overlay] of world.hosts.fsOverlay) {
    const host = resolveHost(world, hostName);
    if (!host?.splunk || !splunkdRunning(world, host)) continue;
    const files = [...overlay].filter(
      ([path, entry]) =>
        entry.kind === 'file' &&
        !path.startsWith(host.splunk!.home + '/etc/') &&
        !path.endsWith('/.bash_history'),
    );
    if (!files.length) continue;
    const monitors = [...runningConf(world, host, 'inputs').stanzas]
      .filter(
        ([name, stanza]) =>
          name.startsWith('monitor://') && !confBool(stanza.settings.get('disabled')?.value),
      )
      .sort(([a], [b]) => b.length - a.length);
    for (const [path, entry] of files.slice(0, 100)) {
      if (entry.kind !== 'file') continue;
      const selected = monitors.find(([name]) => {
        const spec = name.slice(10).replaceAll('$SPLUNK_HOME', host.splunk!.home);
        return (
          path === spec || path.startsWith(spec.replace(/\/$/, '') + '/') || globToRegExp(spec).test(path)
        );
      });
      if (!selected) continue;
      const [name, stanza] = selected,
        key = `${hostName}|${name}|${path}`;
      const state = ingestionState(world),
        index = stanza.settings.get('index')?.value ?? 'main',
        sourcetype = stanza.settings.get('sourcetype')?.value ?? 'log';
      try {
        const text = hostFs(world, host).readFile(path, { user: 'splunk', groups: ['splunk'] });
        const previous = state.checkpoints[key];
        const offset =
          previous &&
          previous.offset <= text.length &&
          previous.prefixHash === hashString(text.slice(0, previous.offset))
            ? previous.offset
            : 0;
        const end = text.lastIndexOf('\n') + 1;
        if (end <= offset) continue;
        const whitelist = stanza.settings.get('whitelist')?.value,
          blacklist = stanza.settings.get('blacklist')?.value;
        if (
          (whitelist && !new RegExp(whitelist).test(path)) ||
          (blacklist && new RegExp(blacklist).test(path))
        )
          continue;
        const written = ingestText(world, hostName, path, sourcetype, index, text.slice(offset, end)).length;
        state.checkpoints[key] = { offset: end, prefixHash: hashString(text.slice(0, end)) };
        state.status[key] = {
          host: hostName,
          source: path,
          index,
          read: end - offset,
          written,
          tick: world.clock.tick,
        };
      } catch (e) {
        state.status[key] = {
          host: hostName,
          source: path,
          index,
          read: 0,
          written: 0,
          error: (e as Error).message,
          tick: world.clock.tick,
        };
      }
    }
  }
}
export function recordedEvents(world: World) {
  return searchableRecordedEvents(world);
}
