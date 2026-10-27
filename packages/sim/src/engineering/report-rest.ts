import { alertConfiguration } from './alerts';
import type { PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { listReports, saveReport, executeReport } from './reports';
import { OperationsError } from './access';
import { activateReportConf } from '../hosts/running';
import { resolveHost } from '../hosts/profile';
import { confBool } from '../conf/parse';

export function reportRest(
  world: World,
  host: string,
  method: string,
  path: string,
  body: unknown,
  principal: PracticePrincipal = 'admin',
) {
  const url = new URL(path, 'https://localhost:8089'),
    match =
      /^\/servicesNS\/([^/]+)\/([^/]+)\/saved\/searches(?:\/([^/]+))?(?:\/(dispatch|_reload))?\/?$/.exec(
        url.pathname,
      );
  if (!match)
    throw new OperationsError('Supported saved-report REST namespace: /servicesNS/OWNER/APP/saved/searches');
  const owner = decodeURIComponent(match[1]!),
    app = decodeURIComponent(match[2]!),
    name = match[3] && decodeURIComponent(match[3]),
    action = match[4];
  const all = listReports(world, host, principal).filter(
    (r) =>
      (owner === '-' || r.owner === owner || (owner === 'nobody' && r.sharing !== 'Private')) &&
      (app === '-' || r.app === app) &&
      (!name || r.title === name),
  );
  if (method === 'GET')
    return {
      entry: all.map((r) => ({
        name: r.title,
        id: r.id,
        content: {
          search: r.search,
          description: r.description,
          disabled: r.enabled ? '0' : '1',
          is_scheduled: r.scheduled ? '1' : '0',
          cron_schedule: r.cron,
          'dispatch.earliest_time': r.earliest,
          'dispatch.latest_time': r.latest,
          'action.summary_index': r.summaryIndex ? '1' : '0',
          'action.summary_index._name': r.summaryIndex ?? '',
          ...(r.alert
            ? {
                alert_type: r.alert.type,
                alert_comparator: r.alert.relation,
                alert_threshold: String(r.alert.threshold),
                alert_condition: r.alert.condition,
                'alert.digest_mode': r.alert.digest ? '1' : '0',
                'alert.suppress': r.alert.suppress ? '1' : '0',
                'alert.suppress.period': r.alert.period,
                'alert.suppress.fields': r.alert.fields.join(','),
                'alert.track': r.alert.track ? '1' : '0',
                'alert.severity': String(r.alert.severity),
                actions: r.alert.actions.join(','),
              }
            : {}),
          sourcePath: r.sourcePath,
          revision: r.revision,
          'eai:acl': { owner: r.owner, app: r.app, sharing: r.sharing.toLowerCase() },
        },
      })),
    };
  if (method !== 'POST' || !body || typeof body !== 'object' || Array.isArray(body))
    throw new OperationsError('Supported saved-report operations: GET, POST create/edit, dispatch, _reload');
  if (owner === '-' || app === '-') throw new OperationsError('Writes need an explicit owner and app');
  if (name === '_reload' || action === '_reload') {
    if (principal !== 'admin') throw new OperationsError('Only admin can reload report configuration');
    const target = resolveHost(world, host);
    if (!target?.splunk || target.role !== 'search_head')
      throw new OperationsError('Reload reports on a search head');
    activateReportConf(world, target);
    return { ok: true };
  }
  const existing = all[0];
  if (action === 'dispatch') {
    if (!existing) throw new OperationsError('Report not found in this namespace');
    const args = body as Record<string, unknown>;
    if (Object.keys(args).some((key) => !['trigger_actions', 'output_mode'].includes(key)))
      throw new OperationsError('Supported dispatch option: trigger_actions=0|1');
    if (
      args.trigger_actions !== undefined &&
      !['0', '1', 0, 1, false, true].includes(args.trigger_actions as string)
    )
      throw new OperationsError('trigger_actions must be 0 or 1');
    return executeReport(world, existing.id, {
      principal,
      triggerActions: confBool(String(args.trigger_actions ?? '0')),
    });
  }
  const values = body as Record<string, unknown>,
    allowed = new Set([
      'name',
      'search',
      'description',
      'disabled',
      'is_scheduled',
      'cron_schedule',
      'dispatch.earliest_time',
      'dispatch.latest_time',
      'action.summary_index',
      'action.summary_index._name',
      'output_mode',
      'alert_type',
      'alert_comparator',
      'alert_threshold',
      'alert_condition',
      'alert.digest_mode',
      'alert.suppress',
      'alert.suppress.period',
      'alert.suppress.fields',
      'alert.track',
      'alert.severity',
      'actions',
    ]);
  for (const key of Object.keys(values))
    if (!allowed.has(key)) throw new OperationsError('Unsupported saved-report REST field: ' + key);
  const get = (key: string, fallback: string) => (values[key] === undefined ? fallback : String(values[key]));
  const summaryEnabled = confBool(get('action.summary_index', existing?.summaryIndex ? '1' : '0'));
  const old = existing?.alert,
    alertValues: Record<string, string> = old
      ? {
          alert_type: old.type,
          alert_comparator: old.relation,
          alert_threshold: String(old.threshold),
          alert_condition: old.condition,
          'alert.digest_mode': old.digest ? '1' : '0',
          'alert.suppress': old.suppress ? '1' : '0',
          'alert.suppress.period': old.period,
          'alert.suppress.fields': old.fields.join(','),
          'alert.track': old.track ? '1' : '0',
          'alert.severity': String(old.severity),
          actions: old.actions.join(','),
        }
      : {};
  const alert = alertConfiguration((key, fallback) => get(key, alertValues[key] ?? fallback));
  return saveReport(
    world,
    {
      alert,
      host,
      app,
      owner: existing?.owner ?? owner,
      sharing: existing?.sharing ?? (owner === 'nobody' ? 'App' : 'Private'),
      title: name ?? get('name', ''),
      search: get('search', existing?.search ?? ''),
      description: get('description', existing?.description ?? ''),
      enabled: !confBool(get('disabled', existing?.enabled === false ? '1' : '0')),
      scheduled: confBool(get('is_scheduled', existing?.scheduled ? '1' : '0')),
      cron: get('cron_schedule', existing?.cron ?? '0 * * * *'),
      earliest: get('dispatch.earliest_time', existing?.earliest ?? '-15m'),
      latest: get('dispatch.latest_time', existing?.latest ?? 'now'),
      summaryIndex: summaryEnabled
        ? get('action.summary_index._name', existing?.summaryIndex ?? 'summary')
        : undefined,
    },
    { principal, create: !name },
  );
}
