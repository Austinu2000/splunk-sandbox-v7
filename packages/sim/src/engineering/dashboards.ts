import { requireShcWritable } from './shc-health';
import { queueKnowledgeReplication, type ReplicatedKnowledgeFile } from './shc-knowledge';
import type { SavedDashboard, DashboardRender, DashboardRuntime, PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { runningVfs, activateDashboardConf, vfsReader } from '../hosts/running';
import { mergeConf } from '../conf/merge';
import { checksum } from '../hosts/cluster';
import { patchConf } from '../scenario/engine';
import { OperationsError } from './access';
import {
  dashboardDocument,
  parseDashboardSource,
  studioWrapper,
  substituteDashboardTokens,
  classicSource,
  studioSource,
} from './dashboard-source';
import { listReports, legacyReports, legacyReceiptKey } from './reports';
import { LEGACY_KNOWLEDGE_KEY } from './migration';
import { runSearch } from '../spl/run';
import { journal } from '../journal';
export interface DashboardWrite {
  host: string;
  app: string;
  owner: string;
  sharing: SavedDashboard['sharing'];
  name: string;
  format: SavedDashboard['format'];
  source: string;
}
const safe = (v: string) =>
  /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(v) && !['constructor', 'prototype'].includes(v);
const id = (host: string, app: string, owner: string, sharing: string, name: string) =>
  [host, app, owner, sharing, name].map(encodeURIComponent).join(':');
function target(world: World, name: string) {
  const p = resolveHost(world, name);
  if (!p?.splunk || p.role !== 'search_head' || p.infra?.retired)
    throw new OperationsError('Choose an active search head');
  return p;
}
export function dashboardState(world: World): DashboardRuntime {
  return (world.dashboards ??= { version: 1, renders: [], imports: {}, archives: {} });
}
export function persistDashboards(world: World) {
  journal(world, { k: 'dashboards.state', state: structuredClone(dashboardState(world)) });
}
export function listDashboards(
  world: World,
  host: string,
  principal: PracticePrincipal = 'admin',
  disk = false,
): SavedDashboard[] {
  const p = target(world, host),
    fs = disk ? hostFs(world, p) : runningVfs(world, p),
    home = p.splunk!.home;
  const dirs = (path: string) => {
    try {
      return fs
        .readdir(path, ROOT)
        .filter(([, n]) => n.type === 'dir')
        .map(([n]) => n);
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
  const out: SavedDashboard[] = [];
  for (const scope of scopes) {
    if (scope.private && scope.owner !== principal && principal !== 'admin') continue;
    const appDir = home + '/etc/apps/' + scope.app,
      dir = scope.private ? home + '/etc/users/' + scope.owner + '/' + scope.app : appDir;
    const meta = mergeConf('meta', vfsReader(fs), [
      { path: dir + '/metadata/local.meta' },
      { path: appDir + '/metadata/default.meta' },
    ]);
    const paths = new Map<string, string>();
    for (const layer of ['local', 'default']) {
      if (scope.private && layer === 'default') continue;
      const base = dir + '/' + layer + '/data/ui/views';
      try {
        for (const [file, node] of fs.readdir(base, ROOT))
          if (node.type === 'file' && file.endsWith('.xml') && !paths.has(file))
            paths.set(file, base + '/' + file);
      } catch {
        /* An empty scope has no views directory. */
      }
    }
    for (const [file, path] of paths) {
      if (out.length >= 100) throw new OperationsError('Dashboard catalog limit: 100 views per search head');
      const name = file.slice(0, -4),
        m = meta.stanzas.get('views/' + name),
        owner = scope.private ? scope.owner : (m?.settings.get('owner')?.value ?? 'nobody'),
        sharing = scope.private
          ? 'Private'
          : m?.settings.get('export')?.value === 'system'
            ? 'Global'
            : 'App';
      const raw = fs.readFile(path, ROOT);
      let format: SavedDashboard['format'] = 'classic',
        source = raw,
        parsed = {
          title: name,
          description: '',
          inputs: [] as SavedDashboard['inputs'],
          panels: [] as SavedDashboard['panels'],
        };
      const issues: string[] = [];
      try {
        const doc = dashboardDocument(raw);
        format = doc.format;
        source = doc.source;
        parsed = parseDashboardSource(source, format);
      } catch (e) {
        issues.push((e as Error).message);
      }
      out.push({
        id: id(host, scope.app, owner, sharing, name),
        host,
        app: scope.app,
        owner,
        sharing,
        name,
        format,
        source,
        sourcePath: path,
        revision: checksum({
          source: raw,
          meta: JSON.stringify(m ? [...m.settings].map(([k, v]) => [k, v.value]) : []),
        }),
        ...parsed,
        issues,
      });
    }
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}
export function saveDashboard(
  world: World,
  input: DashboardWrite,
  options: { principal?: PracticePrincipal; revision?: string; id?: string; create?: boolean } = {},
) {
  requireShcWritable(world, input.host);
  const principal = options.principal ?? 'admin',
    p = target(world, input.host);
  if (
    !safe(input.app) ||
    !safe(input.name) ||
    !['admin', 'analyst', 'operator', 'nobody'].includes(input.owner) ||
    !['Private', 'App', 'Global'].includes(input.sharing) ||
    !['classic', 'studio'].includes(input.format)
  )
    throw new OperationsError('Invalid dashboard namespace or format');
  if (principal !== 'admin' && (input.owner !== principal || input.sharing !== 'Private'))
    throw new OperationsError('Only admin can manage shared dashboards or other owners');
  const parsed = parseDashboardSource(input.source, input.format),
    all = listDashboards(world, input.host, 'admin', true),
    existing = options.id
      ? all.find((d) => d.id === options.id)
      : all.find(
          (d) =>
            d.app === input.app &&
            d.name === input.name &&
            (d.sharing === 'Private') === (input.sharing === 'Private') &&
            (d.sharing !== 'Private' || d.owner === input.owner),
        );
  if (options.id && !existing)
    throw new OperationsError('Dashboard no longer exists in the reviewed namespace');
  if (options.create && existing) throw new OperationsError('A dashboard already exists in that namespace');
  if (options.revision && (!existing || existing.revision !== options.revision))
    throw new OperationsError('Dashboard changed; review current source before saving');
  if (existing && principal !== 'admin' && (existing.owner !== principal || existing.sharing !== 'Private'))
    throw new OperationsError('Permission denied for this dashboard');
  const fs = hostFs(world, p),
    dir =
      p.splunk!.home +
      (input.sharing === 'Private'
        ? '/etc/users/' + input.owner + '/' + input.app
        : '/etc/apps/' + input.app),
    path = dir + '/local/data/ui/views/' + input.name + '.xml';
  if (existing && existing.sourcePath !== path) {
    if (
      existing.sourcePath.includes('/default/') &&
      (existing.app !== input.app ||
        existing.owner !== input.owner ||
        existing.sharing !== input.sharing ||
        existing.name !== input.name)
    )
      throw new OperationsError('Adopt the inherited dashboard in its existing scope before moving it');
    if (
      all.some(
        (d) =>
          d.id !== existing.id &&
          d.app === input.app &&
          d.name === input.name &&
          (d.sharing === 'Private') === (input.sharing === 'Private') &&
          (d.sharing !== 'Private' || d.owner === input.owner),
      )
    )
      throw new OperationsError('Target dashboard namespace already exists');
  }
  fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
  fs.mkdir(dir + '/metadata', ROOT, { parents: true });
  fs.writeFile(
    path,
    input.format === 'studio' ? studioWrapper(input.source, parsed.title) : input.source,
    ROOT,
  );
  fs.setMeta(path, { owner: 'splunk', group: 'splunk', mode: 0o640 }, ROOT);
  const metadata = dir + '/metadata/local.meta';
  fs.writeFile(
    metadata,
    patchConf(fs.exists(metadata) ? fs.readFile(metadata, ROOT) : '', 'views/' + input.name, {
      owner: input.owner,
      export: input.sharing === 'Global' ? 'system' : 'none',
    }),
    ROOT,
  );
  if (existing && existing.sourcePath !== path && !existing.sourcePath.includes('/default/'))
    fs.remove(existing.sourcePath, ROOT);
  activateDashboardConf(world, p);
  const replicated: ReplicatedKnowledgeFile[] = [
    { path, text: fs.readFile(path, ROOT) },
    { path: metadata, text: fs.readFile(metadata, ROOT), stanza: 'views/' + input.name },
  ];
  if (existing && existing.sourcePath !== path && !existing.sourcePath.includes('/default/'))
    replicated.push({ path: existing.sourcePath, text: '', deleted: true });
  queueKnowledgeReplication(world, input.host, replicated);
  return listDashboards(world, input.host, principal).find(
    (d) => d.id === id(input.host, input.app, input.owner, input.sharing, input.name),
  )!;
}
export function renderDashboard(
  world: World,
  dashboardId: string,
  values: Record<string, string> = {},
  principal: PracticePrincipal = 'admin',
) {
  const d = world.infra
    .filter((h) => h.role === 'search_head' && !h.retired)
    .flatMap((h) => listDashboards(world, h.hostname, principal))
    .find((d) => d.id === dashboardId);
  if (!d) throw new OperationsError('Dashboard is unavailable in this namespace');
  if (d.issues.length) throw new OperationsError(d.issues.join('; '));
  if (!splunkdRunning(world, target(world, d.host))) throw new OperationsError('Search head is unavailable');
  const tokens: Record<string, string> = {};
  for (const key of Object.keys(values))
    if (!d.inputs.some((i) => i.token === key)) throw new OperationsError('Unknown dashboard token: ' + key);
  for (const input of d.inputs) {
    const value = values[input.token] ?? input.defaultValue;
    if (
      typeof value !== 'string' ||
      value.length > 500 ||
      (input.type === 'dropdown' && !input.choices.some((c) => c.value === value))
    )
      throw new OperationsError('Invalid value for ' + input.token);
    tokens[input.token] = value;
  }
  const state = dashboardState(world),
    sequence = state.nextRender ?? state.renders.length;
  state.nextRender = sequence + 1;
  const render: DashboardRender = {
    id: 'dashboard-render-' + world.clock.tick + '-' + sequence,
    dashboardId: d.id,
    revision: d.revision,
    tick: world.clock.tick,
    principal,
    tokens,
    panels: [],
  };
  const results = new Map<string, DashboardRender['panels'][number]>();
  let budget = 1000000;
  for (const panel of d.panels) {
    let search = '';
    try {
      let earliest = panel.earliest,
        latest = panel.latest;
      if (panel.report) {
        const report = listReports(world, d.host, principal).find(
          (r) => r.app === d.app && r.title === panel.report,
        );
        if (!report || !report.enabled || report.issues.length)
          throw new OperationsError('Referenced report is unavailable or invalid');
        search = report.search;
        earliest = report.earliest;
        latest = report.latest;
      } else search = panel.search!;
      search = substituteDashboardTokens(search, tokens);
      earliest = substituteDashboardTokens(earliest, tokens);
      latest = substituteDashboardTokens(latest, tokens);
      const key = JSON.stringify([search, earliest, latest]);
      let result = results.get(key);
      if (!result) {
        if (budget <= 0) throw new OperationsError('Dashboard scan budget exhausted');
        const query = runSearch(
          world,
          { search, earliest, latest, principal, readOnly: true },
          { maxScan: Math.min(250000, budget), maxMs: Infinity },
        );
        budget -= query.scan?.scanned ?? 0;
        if (query.status !== 'done' || query.scan?.truncated)
          throw new OperationsError(
            query.messages.map((m) => m.text).join('; ') || 'Search exceeded its scan budget',
          );
        const rows = query.kind === 'events' ? query.events : query.results;
        if (rows.length > 1000) throw new OperationsError('Panel result limit: 1000 rows');
        result = {
          id: panel.id,
          search,
          status: 'done',
          rows: rows.map((r) => r.toObject()),
          workUnits: query.workUnits,
        };
        results.set(key, result);
      }
      render.panels.push({ ...structuredClone(result), id: panel.id });
    } catch (e) {
      render.panels.push({
        id: panel.id,
        search,
        status: 'failed',
        rows: [],
        workUnits: 0,
        error: (e as Error).message,
      });
    }
  }
  state.renders.push(render);
  state.renders = state.renders.slice(-30);
  persistDashboards(world);
  return render;
}
export function importLegacyDashboard(
  world: World,
  sourceId: string,
  scope: Pick<DashboardWrite, 'host' | 'app' | 'owner' | 'sharing'>,
) {
  const candidate = legacyReports(world).knowledge.find(
    (c) => c.object.id === sourceId && c.object.kind === 'dashboard',
  );
  if (!candidate || candidate.status === 'conflict')
    throw new OperationsError('Missing or conflicted legacy dashboard');
  const state = dashboardState(world),
    key = legacyReceiptKey(candidate),
    receipt = state.imports[key];
  if (receipt) return { dashboardId: receipt.dashboardId, alreadyImported: true };
  const old = candidate.object;
  const panels = old.panels.map((p, i) => ({
    id: 'panel_' + i,
    title: p.title,
    type: p.type,
    search: p.search,
    earliest: old.earliest,
    latest: old.latest,
  }));
  if (!panels.length)
    throw new OperationsError(
      'Legacy dashboard has no executable panels; preserve and edit its source before importing',
    );
  const format = old.type === 'Dashboard Studio' ? 'studio' : 'classic';
  const source =
    format === 'studio'
      ? studioSource(old.title, old.description, [], panels)
      : classicSource(old.title, old.description, [], panels);
  const dashboard = saveDashboard(
    world,
    { ...scope, name: 'import_' + checksum({ source: sourceId }), format, source },
    { create: true },
  );
  const raw = world.uiState?.[LEGACY_KNOWLEDGE_KEY] ?? '',
    archive = checksum({ source: raw });
  state.archives[archive] ??= raw;
  state.imports[key] = { dashboardId: dashboard.id, archive };
  persistDashboards(world);
  return { dashboardId: dashboard.id, alreadyImported: false };
}
