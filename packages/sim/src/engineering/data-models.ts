import { parseCron } from '../scheduler';
import type { World } from '../world';
import type { PracticePrincipal } from '@sandbox/shared';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { runningConf, runningVfs } from '../hosts/running';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { filesUnder, checksum } from '../hosts/cluster';
import { patchConf } from '../scenario/engine';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { parseSearch } from '../spl/search';
import { parseTime } from '../spl/time';
import { runSearch } from '../spl/run';
import { Row } from '../spl/row';
import { canSearchIndex, requireCapability, OperationsError } from './access';
import { journal } from '../journal';
const safe = (name: string) =>
  typeof name === 'string' &&
  /^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(name) &&
  !['constructor', 'prototype'].includes(name);
interface Model {
  modelName: string;
  objects: {
    objectName: string;
    parentName: string;
    constraints: { search: string }[];
    fields: { fieldName: string; type: string }[];
  }[];
}
export function parseDataModel(source: string): Model {
  if (source.length > 100000) throw new OperationsError('Data model source limit: 100 KB');
  let value: Model;
  try {
    value = JSON.parse(source) as Model;
  } catch {
    throw new OperationsError('Invalid data model JSON');
  }
  if (!value || !safe(value.modelName) || !Array.isArray(value.objects) || value.objects.length !== 1)
    throw new OperationsError('This executor supports one named root event dataset per data model');
  const object = value.objects[0]!;
  if (!object || typeof object !== 'object')
    throw new OperationsError('Expected a root event dataset object');
  if (
    Array.isArray((object as unknown as Record<string, unknown>).calculations) &&
    ((object as unknown as Record<string, unknown>).calculations as unknown[]).length
  )
    throw new OperationsError(
      'Data model calculations are not supported here; use native props aliases or calculated fields',
    );
  if (
    !safe(object.objectName) ||
    object.parentName !== 'BaseEvent' ||
    !Array.isArray(object.constraints) ||
    !object.constraints.length ||
    object.constraints.length > 8 ||
    !Array.isArray(object.fields) ||
    object.fields.length > 64
  )
    throw new OperationsError('Use a BaseEvent dataset, up to eight constraints and 64 fields');
  for (const constraint of object.constraints) {
    if (
      !constraint ||
      typeof constraint !== 'object' ||
      typeof constraint.search !== 'string' ||
      constraint.search.length > 2000 ||
      constraint.search.includes('|')
    )
      throw new OperationsError('Data model constraints support bounded event predicates only');
    try {
      parseSearch(constraint.search);
    } catch {
      throw new OperationsError('Invalid data model constraint predicate');
    }
  }
  for (const field of object.fields)
    if (
      !field ||
      typeof field !== 'object' ||
      !safe(field.fieldName) ||
      !['string', 'number', 'boolean', 'timestamp', 'ipv4'].includes(field.type)
    )
      throw new OperationsError('Unsupported data model field name or type');
  if (new Set(object.fields.map((f) => f.fieldName)).size !== object.fields.length)
    throw new OperationsError('Data model field names must be unique');
  return value;
}
export function activeDataModels(world: World, host: string, name?: string) {
  const p = resolveHost(world, host);
  if (!p?.splunk) throw new OperationsError('Choose a search dispatch host');
  const fs = runningVfs(world, p),
    files = filesUnder(fs, p.splunk.home + '/etc/apps');
  return Object.entries(files)
    .filter(
      ([path]) =>
        (!name || path.endsWith('/' + name + '.json')) &&
        /^[^/]+\/(default|local)\/data\/models\/[^/]+\.json$/.test(path),
    )
    .sort(([a], [b]) => Number(b.includes('/local/')) - Number(a.includes('/local/')) || a.localeCompare(b))
    .filter(
      ([path], i, list) =>
        list.findIndex(
          ([other]) => other.replace('/default/', '/local/') === path.replace('/default/', '/local/'),
        ) === i,
    )
    .map(([path, source]) => {
      const model = parseDataModel(source),
        app = path.split('/')[0]!,
        dataset = model.objects[0]!,
        conf = runningConf(world, p, 'datamodels');
      return {
        host,
        app,
        name: model.modelName,
        dataset: dataset.objectName,
        fields: dataset.fields.map((f) => f.fieldName),
        search: dataset.constraints.map((c) => '(' + c.search + ')').join(' '),
        enabled: confBool(setting(conf, model.modelName, 'acceleration')),
        earliest: setting(conf, model.modelName, 'acceleration.earliest_time') ?? '-24h',
        cron: setting(conf, model.modelName, 'acceleration.cron_schedule') ?? '*/5 * * * *',
        sourcePath: p.splunk!.home + '/etc/apps/' + path,
        source,
        revision: checksum({
          source,
          settings: JSON.stringify(
            [...(conf.stanzas.get(model.modelName)?.settings ?? [])].map(([k, v]) => [k, v.value]),
          ),
          knowledge: checksum(
            Object.fromEntries(
              Object.entries(files).filter(([path]) =>
                /\/(props|eventtypes|tags|transforms)\.conf$/.test(path),
              ),
            ),
          ),
        }),
      };
    });
}
function modelFor(world: World, host: string, name: string, dataset?: string) {
  const models = activeDataModels(world, host, name).filter(
    (m) => m.name === name && (!dataset || m.dataset === dataset),
  );
  if (models.length !== 1)
    throw new OperationsError('Choose one unambiguous active model and its root dataset');
  return models[0]!;
}
function sourceRows(
  world: World,
  model: ReturnType<typeof modelFor>,
  earliest: number,
  latest: number,
  principal: PracticePrincipal,
) {
  const result = runSearch(
    world,
    {
      host: model.host,
      search: model.search,
      earliest: String(earliest / 1000),
      latest: String(latest / 1000),
      principal,
      readOnly: true,
    },
    { maxScan: 250000, maxMs: Infinity },
  );
  if (
    result.status !== 'done' ||
    result.scan?.truncated ||
    result.kind !== 'events' ||
    result.eventCount > 10000
  )
    throw new OperationsError(
      'Model source failed or exceeds the bounded 10,000-row/250,000-event build limit',
    );
  return {
    result,
    rows: result.events.map((event) => {
      const row: Record<string, import('@sandbox/shared').ResultValue> = {
        _time: event.get('_time'),
        index: event.get('index'),
        nodename: model.dataset,
      };
      for (const field of model.fields) row[model.dataset + '.' + field] = event.get(field);
      return row;
    }),
  };
}
export function buildDataModel(
  world: World,
  host: string,
  name: string,
  principal: PracticePrincipal = 'admin',
) {
  requireCapability(world, host, principal, 'indexes_edit');
  const model = modelFor(world, host, name),
    p = resolveHost(world, host)!;
  if (!splunkdRunning(world, p) || !model.enabled)
    throw new OperationsError('Activate data model acceleration and restore the dispatch host first');
  const budget = Number(setting(runningConf(world, p, 'limits'), 'scheduler', 'auto_summary_perc') ?? 50);
  if (!Number.isFinite(budget) || budget <= 0 || budget > 100)
    throw new OperationsError('Restore supported auto_summary_perc capacity before rebuilding acceleration');
  const earliest = parseTime(model.earliest, world.clock.now);
  if (earliest === null || earliest >= world.clock.now)
    throw new OperationsError('Use a valid past acceleration summary range');
  const state = (world.dataModels ??= { version: 1, nextId: 1, summaries: [], builds: [] }),
    id = 'data-model-build-' + state.nextId++;
  try {
    const { result, rows } = sourceRows(world, model, earliest, world.clock.now, principal),
      summary = {
        id,
        host,
        app: model.app,
        model: name,
        dataset: model.dataset,
        revision: model.revision,
        inputRevision: world.ingestion?.nextId ?? 1,
        earliest,
        latest: world.clock.now,
        built: world.clock.tick,
        rows,
        sourceIndexes: [...new Set(result.events.map((e) => String(e.get('index'))))],
        sourceScan: result.scan?.scanned ?? 0,
      };
    state.summaries = state.summaries.filter(
      (s) => !(s.host === host && s.app === model.app && s.model === name),
    );
    if (state.summaries.length >= 20) throw new OperationsError('Data model summary limit: 20');
    state.summaries.push(summary);
    state.builds.push({
      id,
      tick: world.clock.tick,
      host,
      model: name,
      status: 'completed',
      rows: rows.length,
    });
    return summary;
  } catch (e) {
    state.builds.push({
      id,
      tick: world.clock.tick,
      host,
      model: name,
      status: 'failed',
      rows: 0,
      error: (e as Error).message,
    });
    throw e;
  } finally {
    state.builds = state.builds.slice(-100);
    journal(world, { k: 'data-models.state', state: structuredClone(state) });
  }
}
export function dataModelRows(
  world: World,
  host: string,
  name: string,
  dataset: string | undefined,
  earliest: number,
  latest: number,
  summariesOnly: boolean,
  principal: PracticePrincipal = 'admin',
) {
  const model = modelFor(world, host, name, dataset),
    summary = world.dataModels?.summaries.find(
      (s) => s.host === host && s.app === model.app && s.model === name && s.revision === model.revision,
    );
  if (summariesOnly && !summary)
    throw new OperationsError(
      'No compatible acceleration summary exists; activate settings and build the model',
    );
  if (summary && summary.sourceIndexes.some((index) => !canSearchIndex(world, host, principal, index)))
    throw new OperationsError('The current principal cannot read all source indexes in this summary');
  if (
    summary &&
    (summariesOnly ||
      (summary.inputRevision === (world.ingestion?.nextId ?? 1) &&
        earliest >= summary.earliest &&
        latest <= summary.latest))
  )
    return {
      rows: summary.rows
        .filter((r) => Number(r._time) * 1000 > earliest && Number(r._time) * 1000 <= latest)
        .map(Row.of),
      workUnits: summary.rows.length,
      accelerated: true,
      partial: earliest < summary.earliest || latest > summary.latest,
    };
  const source = sourceRows(world, model, earliest, latest, principal);
  return {
    rows: source.rows.map(Row.of),
    workUnits: source.result.workUnits,
    accelerated: false,
    partial: false,
  };
}
export function stageDataModel(
  world: World,
  host: string,
  app: string,
  source: string,
  options?: { enabled: boolean; earliest: string },
) {
  if (options && (!/^-[1-9]\d?(?:m|h|d)$/.test(options.earliest) || typeof options.enabled !== 'boolean'))
    throw new OperationsError('Use a bounded relative summary range and explicit acceleration choice');
  const model = parseDataModel(source),
    p = resolveHost(world, host);
  if (!p?.splunk || p.role !== 'search_head' || !safe(app))
    throw new OperationsError('Choose a virtual dispatch host and simple app name');
  const fs = hostFs(world, p),
    path = p.splunk.home + '/etc/apps/' + app + '/local/data/models/' + model.modelName + '.json';
  fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(path, source, ROOT);
  if (options) {
    const conf = p.splunk.home + '/etc/apps/' + app + '/local/datamodels.conf';
    fs.writeFile(
      conf,
      patchConf(fs.exists(conf) ? fs.readFile(conf, ROOT) : '', model.modelName, {
        acceleration: String(options.enabled),
        'acceleration.earliest_time': options.earliest,
      }),
      ROOT,
    );
  }
  return { path, activation: 'restart-required' };
}

/** Bounded native cron acceleration; no scheduler runs in worlds without activated model files. */
export function tickDataModels(world: World) {
  const from = world.clock.now - world.config.tickMs,
    at = Math.floor(world.clock.now / 60000) * 60000;
  if (at <= from) return;
  for (const [host, overlay] of world.hosts.restartSnapshot) {
    if (![...overlay.keys()].some((path) => /\/data\/models\/[^/]+\.json$/.test(path))) continue;
    const p = resolveHost(world, host);
    if (!p?.splunk || !splunkdRunning(world, p)) continue;
    let models: ReturnType<typeof activeDataModels>;
    try {
      models = activeDataModels(world, host);
    } catch {
      continue;
    }
    const percentage = Number(
        setting(runningConf(world, p, 'limits'), 'scheduler', 'auto_summary_perc') ?? 50,
      ),
      slots =
        Number.isFinite(percentage) && percentage > 0 && percentage <= 100
          ? Math.max(1, Math.floor((4 * percentage) / 100))
          : 0;
    let dispatched = 0;
    for (const model of models) {
      if (!model.enabled || !(parseCron(model.cron)?.(at) ?? false)) continue;
      if (dispatched++ >= slots) {
        const state = (world.dataModels ??= { version: 1, nextId: 1, summaries: [], builds: [] });
        state.builds.push({
          id: 'data-model-build-' + state.nextId++,
          tick: world.clock.tick,
          host,
          model: model.name,
          status: 'skipped',
          rows: 0,
          error: 'Bounded acceleration scheduler capacity unavailable',
        });
        state.builds = state.builds.slice(-100);
        continue;
      }
      try {
        buildDataModel(world, host, model.name);
      } catch {
        /* Failed builds remain explicit receipts; next cron opportunity can retry. */
      }
    }
  }
}
