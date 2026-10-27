import type { PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { listDashboards, saveDashboard } from './dashboards';
import { dashboardDocument, studioWrapper } from './dashboard-source';
import { OperationsError } from './access';
import { resolveHost } from '../hosts/profile';
import { activateDashboardConf } from '../hosts/running';
export function dashboardRest(
  world: World,
  host: string,
  method: string,
  path: string,
  body: unknown,
  principal: PracticePrincipal = 'admin',
) {
  const url = new URL(path, 'https://localhost:8089'),
    match = /^\/servicesNS\/([^/]+)\/([^/]+)\/data\/ui\/views(?:\/([^/]+))?\/?$/.exec(url.pathname);
  if (!match) throw new OperationsError('Use /servicesNS/OWNER/APP/data/ui/views');
  const owner = decodeURIComponent(match[1]!),
    app = decodeURIComponent(match[2]!),
    name = match[3] && decodeURIComponent(match[3]);
  const views = listDashboards(world, host, principal).filter(
    (d) =>
      (owner === '-' || d.owner === owner || (owner === 'nobody' && d.sharing !== 'Private')) &&
      (app === '-' || d.app === app) &&
      (!name || d.name === name),
  );
  if (method === 'GET')
    return {
      entry: views.map((d) => ({
        name: d.name,
        id: d.id,
        content: {
          'eai:data': d.format === 'studio' ? studioWrapper(d.source, d.title) : d.source,
          definition: d.format === 'studio' ? d.source : undefined,
          format: d.format,
          title: d.title,
          sourcePath: d.sourcePath,
          revision: d.revision,
          'eai:acl': { owner: d.owner, app: d.app, sharing: d.sharing.toLowerCase() },
        },
      })),
    };
  if (
    method !== 'POST' ||
    owner === '-' ||
    app === '-' ||
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body)
  )
    throw new OperationsError('View writes need POST, explicit owner/app and local source');
  const input = body as Record<string, unknown>;
  for (const key of Object.keys(input))
    if (!['name', 'eai:data', 'output_mode'].includes(key))
      throw new OperationsError('Unsupported view REST field: ' + key);
  if (name === '_reload') {
    if (principal !== 'admin') throw new OperationsError('Only admin can reload views');
    const p = resolveHost(world, host);
    if (!p?.splunk || p.role !== 'search_head') throw new OperationsError('Choose a search head');
    activateDashboardConf(world, p);
    return { ok: true };
  }
  if (typeof input['eai:data'] !== 'string')
    throw new OperationsError('Supply eai:data with supported Classic XML or Studio XML wrapper');
  const doc = dashboardDocument(input['eai:data']),
    existing = views[0];
  return saveDashboard(
    world,
    {
      host,
      app,
      owner: existing?.owner ?? owner,
      sharing: existing?.sharing ?? (owner === 'nobody' ? 'App' : 'Private'),
      name: name ?? String(input.name ?? ''),
      ...doc,
    },
    { principal, create: !name, id: existing?.id, revision: existing?.revision },
  );
}
