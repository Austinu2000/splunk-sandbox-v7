import { requireShcWritable } from './shc-health';
import { queueKnowledgeReplication, type ReplicatedKnowledgeFile } from './shc-knowledge';
import { alertConfiguration, validateAlert, evaluateAlert } from './alerts';
import type { SavedReport, ReportRun, ReportRuntime, PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { runningVfs, activateReportConf } from '../hosts/running';
import { vfsReader } from '../hosts/running';
import { mergeConf } from '../conf/merge';
import { parseConf, confBool } from '../conf/parse';
import { hostFs, buildHostTree } from '../vfs/build';
import { ROOT, Vfs } from '../vfs/vfs';
import { patchConf } from '../scenario/engine';
import { checksum, filesUnder } from '../hosts/cluster';
import { OperationsError } from './access';
import { parseCron, schedulerConfig } from '../scheduler';
import { parseTime } from '../spl/time';
import { runSearch } from '../spl/run';
import { collectSummary } from './summary';
import { journal } from '../journal';
import { planLegacyImport, LEGACY_KNOWLEDGE_KEY } from './migration';

export interface ReportInput {
  alert?: import('@sandbox/shared').AlertConfiguration | null;
  host: string;
  app: string;
  owner: string;
  sharing: 'Private' | 'App' | 'Global';
  title: string;
  description?: string;
  search: string;
  earliest?: string;
  latest?: string;
  enabled?: boolean;
  scheduled?: boolean;
  cron?: string;
  summaryIndex?: string;
}
const safeName = (value: string) =>
  /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(value) && !['constructor', 'prototype'].includes(value);
function hostFor(world: World, name: string) {
  const host = resolveHost(world, name);
  if (!host?.splunk || host.role !== 'search_head' || host.infra?.retired)
    throw new OperationsError('Choose an active search head');
  return host;
}
export function reportState(world: World): ReportRuntime {
  const state = (world.reports ??= { version: 1, runs: [], imports: {}, archives: {} });
  state.archives ??= {};
  return state;
}
export function persistReports(world: World) {
  journal(world, { k: 'reports.state', state: structuredClone(reportState(world)) });
}
const identity = (host: string, app: string, owner: string, sharing: string, title: string) =>
  [host, app, owner, sharing, title].map(encodeURIComponent).join(':');
const baselineTitles = new WeakMap<World, Map<string, Set<string>>>();
function inheritedTitle(world: World, hostName: string, path: string, title: string) {
  let cache = baselineTitles.get(world);
  if (!cache) baselineTitles.set(world, (cache = new Map()));
  const key = hostName + '|' + path;
  let names = cache.get(key);
  if (!names) {
    const base = new Vfs(
      buildHostTree(world, hostFor(world, hostName), []),
      new Map(),
      () => world.clock.now,
    );
    names = new Set(parseConf(base.exists(path) ? base.readFile(path, ROOT) : '').stanzas.keys());
    cache.set(key, names);
  }
  return names.has(title);
}
export function reportRevision(world: World, hostName: string) {
  const host = hostFor(world, hostName);
  return checksum(filesUnder(hostFs(world, host), host.splunk!.home + '/etc'));
}
const reportCache = new WeakMap<World, Map<string, { revision: number; reports: SavedReport[] }>>();
const copyReports = (reports: SavedReport[]) => structuredClone(reports);
export function listReports(
  world: World,
  hostName: string,
  principal: PracticePrincipal = 'admin',
  disk = false,
): SavedReport[] {
  hostFor(world, hostName);
  let cache = reportCache.get(world);
  if (!cache) reportCache.set(world, (cache = new Map()));
  const cacheKey = hostName + '|' + principal,
    hit = cache.get(cacheKey);
  if (!disk && hit?.revision === world.hosts.confVersion) return copyReports(hit.reports);
  const host = hostFor(world, hostName),
    fs = disk ? hostFs(world, host) : runningVfs(world, host),
    reader = vfsReader(fs),
    home = host.splunk!.home;
  const dirs = (path: string) => {
    try {
      return fs
        .readdir(path, ROOT)
        .filter(([, node]) => node.type === 'dir')
        .map(([name]) => name)
        .sort();
    } catch {
      return [];
    }
  };
  const scopes = [
    ...dirs(home + '/etc/apps').map((app) => ({ app, owner: 'nobody', private: false })),
    ...dirs(home + '/etc/users').flatMap((owner) =>
      dirs(home + '/etc/users/' + owner).map((app) => ({ app, owner, private: true })),
    ),
  ];
  const out: SavedReport[] = [];
  for (const scope of scopes) {
    const appDir = home + '/etc/apps/' + scope.app,
      privateDir = home + '/etc/users/' + scope.owner + '/' + scope.app;
    const primary = scope.private
      ? [privateDir + '/local/savedsearches.conf']
      : [appDir + '/local/savedsearches.conf', appDir + '/default/savedsearches.conf'];
    const paths = [
      ...primary,
      ...(scope.private
        ? [appDir + '/local/savedsearches.conf', appDir + '/default/savedsearches.conf']
        : []),
    ].filter((path) => reader.read(path) !== null);
    if (!paths.length) continue;
    const defined = new Set(
      primary.flatMap((path) => [...parseConf(reader.read(path) ?? '').stanzas.keys()]),
    );
    const merged = mergeConf(
      'savedsearches',
      reader,
      paths.map((path) => ({ path, app: scope.app })),
    );
    const meta = mergeConf('meta', reader, [
      { path: (scope.private ? privateDir : appDir) + '/metadata/local.meta' },
      { path: appDir + '/metadata/default.meta' },
    ]);
    for (const [title, stanza] of merged.stanzas) {
      if (title === 'default' || !defined.has(title)) continue;
      const get = (key: string, fallback: string) => stanza.settings.get(key)?.value ?? fallback;
      const m = meta.stanzas.get('savedsearches/' + title),
        owner = scope.private ? scope.owner : (m?.settings.get('owner')?.value ?? 'nobody');
      const sharing = scope.private
        ? 'Private'
        : m?.settings.get('export')?.value === 'system'
          ? 'Global'
          : 'App';
      if (sharing === 'Private' && owner !== principal && principal !== 'admin') continue;
      const issues: string[] = [];
      const cron = get('cron_schedule', '0 * * * *'),
        scheduled = confBool(get('enableSched', get('is_scheduled', '0')));
      if (scheduled && !parseCron(cron)) issues.push('Unsupported or invalid UTC cron expression');
      if (!get('search', '').trim()) issues.push('Search is empty');
      if (confBool(get('auto_summarize', '0')))
        issues.push(
          'Report acceleration is separate from summary indexing and is not implemented by this executor',
        );
      if (confBool(get('action.summary_index', '0')) && !get('action.summary_index._name', ''))
        issues.push('Summary destination index is missing from the report settings');
      const alert = alertConfiguration(get);
      if (alert && confBool(get('action.summary_index', '0')))
        issues.push('Use separate saved searches for alerts and summary writes in this executor');
      if (alert) {
        try {
          validateAlert(alert);
        } catch (e) {
          issues.push((e as Error).message);
        }
      }
      const sourcePath = stanza.settings.get('search')?.path ?? stanza.path;
      const managed = paths.some((path) => {
        const entry = world.hosts.restartSnapshot.get(hostName)?.get(path);
        return (
          entry?.kind === 'file' &&
          parseConf(entry.content).stanzas.has(title) &&
          (!inheritedTitle(world, hostName, path, title) || !!m?.settings.get('owner'))
        );
      });
      out.push({
        id: identity(hostName, scope.app, owner, sharing, title),
        host: hostName,
        app: scope.app,
        owner,
        sharing,
        title,
        description: get('description', ''),
        search: get('search', ''),
        earliest: get('dispatch.earliest_time', '-15m'),
        latest: get('dispatch.latest_time', 'now'),
        enabled: !confBool(get('disabled', '0')),
        scheduled,
        cron,
        summaryIndex: confBool(get('action.summary_index', '0'))
          ? get('action.summary_index._name', '')
          : undefined,
        sourcePath,
        revision: checksum(
          Object.fromEntries(
            paths
              .map((p) => [p, reader.read(p) ?? ''])
              .concat([
                [
                  'meta',
                  JSON.stringify(
                    [...meta.stanzas].map(([n, s]) => [n, [...s.settings].map(([k, v]) => [k, v.value])]),
                  ),
                ],
              ]),
          ),
        ),
        managed,
        alert,
        issues,
      });
    }
  }
  out.sort((a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id));
  if (!disk) cache.set(cacheKey, { revision: world.hosts.confVersion, reports: out });
  return copyReports(out);
}
function validate(world: World, input: ReportInput, principal: PracticePrincipal) {
  hostFor(world, input.host);
  if (input.alert) validateAlert(input.alert);
  if (input.alert && input.summaryIndex)
    throw new OperationsError('Use separate saved searches for alerts and summary writes in this executor');
  if (
    !safeName(input.app) ||
    !['admin', 'analyst', 'operator', 'nobody'].includes(input.owner) ||
    !['Private', 'App', 'Global'].includes(input.sharing)
  )
    throw new OperationsError('Invalid report namespace');
  if (
    !input.title.trim() ||
    input.title.length > 120 ||
    ['\r', '\n', '[', ']', '/'].some((character) => input.title.includes(character))
  )
    throw new OperationsError('Report titles must be nonempty and cannot contain stanza or path delimiters');
  if (principal !== 'admin' && (input.owner !== principal || input.sharing !== 'Private'))
    throw new OperationsError('Only admin can manage other owners or shared reports in this practice model');
  if (!input.search.trim() || input.search.length > 10000 || /\r/.test(input.search))
    throw new OperationsError('Use nonempty SPL of at most 10,000 characters');
  if ((input.description?.length ?? 0) > 2000 || /\r/.test(input.description ?? ''))
    throw new OperationsError('Description is too long or contains invalid carriage returns');
  if (input.scheduled && !parseCron(input.cron ?? ''))
    throw new OperationsError('Use a supported five-field UTC cron expression');
  const earliest = parseTime(input.earliest ?? '-15m', world.clock.now),
    latest = parseTime(input.latest ?? 'now', world.clock.now);
  if (earliest === null || latest === null || earliest >= latest)
    throw new OperationsError('Report time range is invalid');
  if (input.summaryIndex && !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(input.summaryIndex))
    throw new OperationsError('Invalid summary index name');
}
export function saveReport(
  world: World,
  input: ReportInput,
  options: { principal?: PracticePrincipal; revision?: string; create?: boolean; id?: string } = {},
) {
  const principal = options.principal ?? 'admin';
  validate(world, input, principal);
  requireShcWritable(world, input.host);
  const all = listReports(world, input.host, 'admin', true),
    existing = options.id
      ? all.find((r) => r.id === options.id)
      : all.find(
          (r) =>
            r.app === input.app &&
            r.title === input.title &&
            (r.sharing === 'Private') === (input.sharing === 'Private') &&
            (r.sharing !== 'Private' || r.owner === input.owner),
        );
  if (options.id && !existing) throw new OperationsError('Report no longer exists in the reviewed namespace');
  if (existing && options.id && existing.title !== input.title)
    throw new OperationsError('Create a copy to change the report title');
  if (existing && principal !== 'admin' && (existing.owner !== principal || existing.sharing !== 'Private'))
    throw new OperationsError('Permission denied for this report');
  if (options.create && existing)
    throw new OperationsError('A report with this title already exists in that namespace');
  if (options.revision && (!existing || existing.revision !== options.revision))
    throw new OperationsError('Report changed; reload before editing');
  const host = hostFor(world, input.host),
    fs = hostFs(world, host),
    dir =
      host.splunk!.home +
      (input.sharing === 'Private'
        ? '/etc/users/' + input.owner + '/' + input.app
        : '/etc/apps/' + input.app);
  const path = dir + '/local/savedsearches.conf';
  if (existing && existing.sourcePath !== path) {
    if (
      existing.sourcePath.includes('/default/') &&
      (existing.app !== input.app || existing.owner !== input.owner || existing.sharing !== input.sharing)
    )
      throw new OperationsError('Adopt the inherited report in its existing scope before moving it');
    if (
      all.some(
        (r) =>
          r.id !== existing.id &&
          r.app === input.app &&
          r.title === input.title &&
          (r.sharing === 'Private') === (input.sharing === 'Private') &&
          (r.sharing !== 'Private' || r.owner === input.owner),
      )
    )
      throw new OperationsError('Target report namespace already exists');
  }
  fs.mkdir(dir + '/local', ROOT, { parents: true });
  fs.mkdir(dir + '/metadata', ROOT, { parents: true });
  const values = {
    search: input.search,
    description: input.description ?? '',
    disabled: input.enabled === false ? '1' : '0',
    'dispatch.earliest_time': input.earliest ?? '-15m',
    'dispatch.latest_time': input.latest ?? 'now',
    enableSched: input.scheduled ? '1' : '0',
    cron_schedule: input.cron ?? '0 * * * *',
    'action.summary_index': input.summaryIndex ? '1' : '0',
    'action.summary_index._name': input.summaryIndex ?? '',
    auto_summarize: '0',
  };
  const alertValues: Record<string, string> = {};
  if (input.alert !== undefined) {
    const a = input.alert;
    Object.assign(alertValues, {
      counttype: a?.type === 'custom' ? '' : (a?.type ?? ''),
      relation: a?.type === 'custom' ? '' : (a?.relation ?? ''),
      quantity: a?.type === 'custom' ? '' : String(a?.threshold ?? 0),
      alert_condition: a?.condition ?? '',
      'alert.digest_mode': a?.digest === false ? '0' : '1',
      'alert.suppress': a?.suppress ? '1' : '0',
      'alert.suppress.period': a?.period ?? '0',
      'alert.suppress.fields': a?.fields.join(',') ?? '',
      'alert.track': a?.track ? '1' : '0',
      'alert.severity': String(a?.severity ?? 3),
      actions: a?.actions.join(',') ?? '',
    });
  }
  fs.writeFile(
    path,
    patchConf(fs.exists(path) ? fs.readFile(path, ROOT) : '', input.title, { ...values, ...alertValues }),
    ROOT,
  );
  fs.setMeta(path, { owner: 'splunk', group: 'splunk', mode: 0o640 }, ROOT);
  const metadata = dir + '/metadata/local.meta';
  fs.writeFile(
    metadata,
    patchConf(fs.exists(metadata) ? fs.readFile(metadata, ROOT) : '', 'savedsearches/' + input.title, {
      owner: input.owner,
      export: input.sharing === 'Global' ? 'system' : 'none',
    }),
    ROOT,
  );
  if (existing && existing.sourcePath !== path && !existing.sourcePath.includes('/default/')) {
    fs.writeFile(
      existing.sourcePath,
      removeReportStanza(fs.readFile(existing.sourcePath, ROOT), existing.title),
      ROOT,
    );
  }
  activateReportConf(world, host);
  const replicated: ReplicatedKnowledgeFile[] = [
    { path, text: fs.readFile(path, ROOT), stanza: input.title },
    { path: metadata, text: fs.readFile(metadata, ROOT), stanza: 'savedsearches/' + input.title },
  ];
  if (existing && existing.sourcePath !== path && !existing.sourcePath.includes('/default/'))
    replicated.push({
      path: existing.sourcePath,
      text: fs.readFile(existing.sourcePath, ROOT),
      stanza: existing.title,
    });
  queueKnowledgeReplication(world, input.host, replicated);
  return listReports(world, input.host, principal).find(
    (r) =>
      r.title === input.title &&
      r.app === input.app &&
      r.owner === input.owner &&
      r.sharing === input.sharing,
  )!;
}
export function executeReport(
  world: World,
  id: string,
  options: { principal?: PracticePrincipal; scheduledTime?: number; triggerActions?: boolean } = {},
): ReportRun {
  const caller = options.principal ?? 'admin';
  const report = world.infra
    .filter((h) => h.role === 'search_head' && !h.retired)
    .flatMap((h) => listReports(world, h.hostname, caller))
    .find((r) => r.id === id);
  if (!report) throw new OperationsError('Report is unavailable in this namespace');
  const principal: PracticePrincipal =
    report.owner === 'nobody'
      ? 'admin'
      : ['admin', 'analyst', 'operator'].includes(report.owner)
        ? (report.owner as PracticePrincipal)
        : caller;
  const state = reportState(world),
    at = options.scheduledTime ?? world.clock.now;
  const earliest = parseTime(report.earliest, at),
    latest = parseTime(report.latest, at);
  const sequence = state.nextRun ?? state.runs.length;
  state.nextRun = sequence + 1;
  const run: ReportRun = {
    id: `report-run-${world.clock.tick}-${sequence}-${report.id}`,
    reportId: id,
    revision: report.revision,
    host: report.host,
    title: report.title,
    sourcePath: report.sourcePath,
    tick: world.clock.tick,
    scheduledTime: options.scheduledTime,
    earliest: earliest ?? at,
    latest: latest ?? at,
    status: 'failed',
    principal,
    resultCount: 0,
    rows: [],
    summaryEventIds: [],
    workUnits: 0,
  };
  try {
    if (!report.enabled) throw new OperationsError('Report is disabled');
    if (!splunkdRunning(world, hostFor(world, report.host)))
      throw new OperationsError('Search head is unavailable');
    if (!['nobody', 'admin', 'analyst', 'operator'].includes(report.owner))
      throw new OperationsError('Unsupported report owner mapping; assign a practice principal explicitly');
    if (report.issues.length) throw new OperationsError(report.issues.join('; '));
    if (earliest === null || latest === null || earliest >= latest)
      throw new OperationsError('Invalid report dispatch window');
    const result = runSearch(
      world,
      {
        host: report.host,
        search: report.search,
        earliest: String(earliest / 1000),
        latest: String(latest / 1000),
        principal,
        readOnly: true,
      },
      { maxScan: 250000, maxMs: Infinity },
    );
    if (result.status !== 'done' || result.scan?.truncated)
      throw new OperationsError(
        result.messages.map((m) => m.text).join('; ') ||
          'Source search failed or exceeded its deterministic scan budget',
      );
    const rows = result.kind === 'events' ? result.events : result.results;
    if (rows.length > 1000) throw new OperationsError('Report result limit is 1,000 rows');
    run.earliest = result.earliest;
    run.latest = result.latest;
    run.rows = rows.map((r) => r.toObject());
    run.resultCount = rows.length;
    run.workUnits = result.workUnits;
    if (report.summaryIndex && options.triggerActions !== false)
      run.summaryEventIds = collectSummary(world, run.rows, {
        index: report.summaryIndex,
        host: report.host,
        principal,
        earliest: result.earliest,
        latest: result.latest,
        writer: report.id,
        source: report.title,
      });
    if (report.alert && options.triggerActions !== false) evaluateAlert(world, report, run);
    run.status = 'succeeded';
  } catch (error) {
    run.error = (error as Error).message;
  }
  state.runs.push(run);
  if (state.runs.length > 200) state.runs.shift();
  persistReports(world);
  return run;
}
export function tickReports(world: World) {
  if (
    ![...world.hosts.restartSnapshot.values()].some((overlay) =>
      [...overlay.keys()].some((path) => path.endsWith('/savedsearches.conf')),
    )
  )
    return;
  const from = world.clock.now - world.config.tickMs,
    first = Math.floor(from / 60000) * 60000 + 60000;
  for (let at = first; at <= world.clock.now; at += 60000)
    for (const host of world.infra.filter((h) => h.role === 'search_head' && !h.retired)) {
      const due = listReports(world, host.hostname)
        .filter((r) => r.managed && r.enabled && r.scheduled && (parseCron(r.cron)?.(at) ?? true))
        .sort((a, b) => a.id.localeCompare(b.id));
      let executed = 0;
      for (const report of due) {
        if (world.reports?.runs.some((r) => r.reportId === report.id && r.scheduledTime === at)) continue;
        if (executed++ >= Math.min(4, schedulerConfig(world, hostFor(world, host.hostname), at).limit)) {
          const state = reportState(world);
          state.runs.push({
            id: `report-skip-${world.clock.tick}-${report.id}`,
            reportId: report.id,
            revision: report.revision,
            host: host.hostname,
            title: report.title,
            sourcePath: report.sourcePath,
            tick: world.clock.tick,
            scheduledTime: at,
            earliest: at,
            latest: at,
            status: 'skipped',
            principal: 'admin',
            resultCount: 0,
            rows: [],
            summaryEventIds: [],
            error: 'Deterministic capacity: at most four report dispatches per search head per minute',
            workUnits: 0,
          });
          if (state.runs.length > 200) state.runs.shift();
          continue;
        }
        const principal: PracticePrincipal = ['admin', 'analyst', 'operator'].includes(report.owner)
          ? (report.owner as PracticePrincipal)
          : 'admin';
        executeReport(world, report.id, { principal, scheduledTime: at });
      }
    }
}
export function legacyReports(world: World) {
  return planLegacyImport(world.config.profileId, world.uiState ?? {});
}
export function legacyReceiptKey(candidate: ReturnType<typeof legacyReports>['knowledge'][number]) {
  return (
    candidate.sourceKey +
    ':' +
    encodeURIComponent(candidate.object.id) +
    ':' +
    checksum({ record: JSON.stringify(candidate.object) })
  );
}
export function importLegacyReport(
  world: World,
  sourceId: string,
  scope: { host: string; app: string; owner: string; sharing: SavedReport['sharing'] },
) {
  const plan = legacyReports(world),
    candidate = plan.knowledge.find(
      (item) => item.object.id === sourceId && ['report', 'alert'].includes(item.object.kind),
    );
  if (!candidate || candidate.status === 'conflict')
    throw new OperationsError('Legacy report is missing or conflicted; review the import preview');
  const receiptKey = legacyReceiptKey(candidate);
  const receipt = world.reports?.imports[receiptKey];
  if (receipt) return { reportId: receipt.reportId, alreadyImported: true };
  const old = candidate.object;
  const report = saveReport(
    world,
    {
      ...scope,
      alert:
        old.kind === 'alert'
          ? {
              type: 'number of events',
              relation: 'greater than',
              threshold: 0,
              condition: '',
              digest: true,
              suppress: false,
              period: '0',
              fields: [],
              track: true,
              severity: 3,
              actions: [],
            }
          : undefined,
      title: old.title,
      description: old.description,
      search: old.search,
      earliest: old.earliest,
      latest: old.latest,
      enabled: old.enabled,
      scheduled: false,
    },
    { create: true },
  );
  const raw = world.uiState?.[LEGACY_KNOWLEDGE_KEY] ?? '';
  const archive = checksum({ source: raw });
  reportState(world).archives[archive] ??= raw;
  reportState(world).imports[receiptKey] = {
    reportId: report.id,
    sourceKey: LEGACY_KNOWLEDGE_KEY,
    archive,
    tick: world.clock.tick,
  };
  persistReports(world);
  return { reportId: report.id, alreadyImported: false };
}

function removeReportStanza(source: string, title: string) {
  let removing = false;
  return source
    .split('\n')
    .filter((line) => {
      const m = /^\s*\[([^\]]+)\]/.exec(line);
      if (m) removing = m[1] === title;
      return !removing;
    })
    .join('\n');
}
