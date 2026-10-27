import type { AlertConfiguration, ReportRun, SavedReport, ResultValue } from '@sandbox/shared';
import type { World } from '../world';
import { confBool } from '../conf/parse';
import { OperationsError } from './access';
import { parseSearch, matches } from '../spl/search';
import { Row } from '../spl/row';
import { checksum } from '../hosts/cluster';
const countTypes = ['number of events', 'number of hosts', 'number of sources', 'custom', 'always'];
const relations = ['greater than', 'less than', 'equal to', 'not equal to'];
export function alertConfiguration(
  get: (key: string, fallback: string) => string,
): AlertConfiguration | undefined {
  const nativeType = get('counttype', get('alert_type', '')),
    condition = get('alert_condition', '');
  if (!nativeType && !condition) return undefined;
  return {
    type: (condition ? 'custom' : nativeType) as AlertConfiguration['type'],
    relation: (condition
      ? 'greater than'
      : get('relation', get('alert_comparator', 'greater than'))) as AlertConfiguration['relation'],
    threshold: condition ? 0 : Number(get('quantity', get('alert_threshold', '0'))),
    condition,
    digest: confBool(get('alert.digest_mode', '1')),
    suppress: confBool(get('alert.suppress', '0')),
    period: get('alert.suppress.period', '0'),
    fields: get('alert.suppress.fields', '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    track: confBool(get('alert.track', '1')),
    severity: Number(get('alert.severity', '3')),
    actions: get('actions', '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
export function suppressionMs(value: string) {
  const m = /^(\d+)(s|m|h)?$/.exec(value);
  return m ? Number(m[1]) * { s: 1000, m: 60000, h: 3600000 }[m[2] ?? 's']! : NaN;
}
export function validateAlert(a: AlertConfiguration) {
  if (
    !countTypes.includes(a.type) ||
    !relations.includes(a.relation) ||
    !Number.isFinite(a.threshold) ||
    a.threshold < 0 ||
    a.threshold > 1e9 ||
    !Number.isInteger(a.severity) ||
    a.severity < 1 ||
    a.severity > 6
  )
    throw new OperationsError('Invalid alert type, threshold, comparator or severity');
  if (
    !Array.isArray(a.actions) ||
    a.actions.some((s) => !['notification', 'audit'].includes(s)) ||
    a.actions.length > 2
  )
    throw new OperationsError('Supported alert actions are local notification and audit only');
  if (
    typeof a.condition !== 'string' ||
    a.condition.length > 2000 ||
    !Array.isArray(a.fields) ||
    a.fields.length > 8 ||
    a.fields.some((s) => !/^[A-Za-z_][A-Za-z0-9_.-]{0,63}$/.test(s))
  )
    throw new OperationsError('Invalid alert condition or suppression fields');
  const duration = suppressionMs(a.period);
  if (!Number.isFinite(duration) || duration > 7 * 86400000 || (a.suppress && duration <= 0))
    throw new OperationsError('Use a suppression period in seconds, m or h, up to seven days');
  if (a.suppress && !a.digest && !a.fields.length)
    throw new OperationsError('Per-result suppression requires at least one result field');
  if (a.type === 'custom') {
    if (!/^search\s+\S/.test(a.condition) || a.condition.includes('|'))
      throw new OperationsError(
        'Custom alert condition supports a single search predicate over the completed result rows',
      );
    parseSearch(a.condition.replace(/^search\s+/, ''));
  } else if (a.condition) throw new OperationsError('Use a custom alert type for alert_condition');
}
function compare(value: number, a: AlertConfiguration) {
  return a.relation === 'greater than'
    ? value > a.threshold
    : a.relation === 'less than'
      ? value < a.threshold
      : a.relation === 'equal to'
        ? value === a.threshold
        : value !== a.threshold;
}
function asRow(value: Record<string, ResultValue>) {
  return Row.of(value);
}
export function evaluateAlert(world: World, report: SavedReport, run: ReportRun) {
  const a = report.alert;
  if (!a) return;
  validateAlert(a);
  const now = run.scheduledTime ?? world.clock.now;
  const matched =
    a.type === 'custom'
      ? run.rows.filter((r) => matches(parseSearch(a.condition.replace(/^search\s+/, '')), asRow(r)))
      : run.rows;
  const n =
    a.type === 'number of hosts'
      ? new Set(run.rows.map((r) => r.host).filter((v) => v !== undefined)).size
      : a.type === 'number of sources'
        ? new Set(run.rows.map((r) => r.source).filter((v) => v !== undefined)).size
        : run.rows.length;
  const satisfied = a.type === 'always' || (a.type === 'custom' ? matched.length > 0 : compare(n, a));
  run.alert = { matched: satisfied, triggered: 0, suppressed: 0, notificationIds: [] };
  if (!satisfied) return;
  const state = world.reports!;
  state.alerts ??= { notifications: [], suppression: {} };
  const groups = a.digest ? [matched] : matched.map((r) => [r]);
  if (!a.digest && a.suppress && matched.some((row) => a.fields.some((field) => !Object.hasOwn(row, field))))
    throw new OperationsError('Suppression field is absent from results');
  for (const rows of groups) {
    const values = a.digest
      ? []
      : a.fields.map((f) => {
          if (!Object.hasOwn(rows[0] ?? {}, f))
            throw new OperationsError('Suppression field is absent from results: ' + f);
          return rows[0]![f];
        });
    const key = checksum({
        report: report.id,
        definition: JSON.stringify({
          search: report.search,
          earliest: report.earliest,
          latest: report.latest,
          alert: a,
        }),
        fields: JSON.stringify(values),
      }),
      prior = state.alerts.suppression[key];
    if (a.suppress && prior !== undefined && now - prior < suppressionMs(a.period)) {
      run.alert.suppressed++;
      continue;
    }
    run.alert.triggered++;
    if (a.suppress) state.alerts.suppression[key] = now;
    if (a.track || a.actions.length) {
      const notification = {
        id: 'alert-' + run.id + '-' + run.alert.triggered,
        reportId: report.id,
        runId: run.id,
        title: report.title,
        time: now,
        severity: a.severity,
        actions: [...a.actions],
        resultCount: rows.length,
        tracked: a.track,
      };
      state.alerts.notifications.push(notification);
      run.alert.notificationIds.push(notification.id);
    }
  }
  state.alerts.notifications = state.alerts.notifications.slice(-500);
  const cutoff = now - 7 * 86400000;
  state.alerts.suppression = Object.fromEntries(
    Object.entries(state.alerts.suppression)
      .filter(([, t]) => t >= cutoff)
      .slice(-500),
  );
}
