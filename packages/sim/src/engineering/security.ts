import { parse } from 'yaml';
import type {
  AlertNotification,
  PracticePrincipal,
  ReportRun,
  ResultValue,
  SavedReport,
} from '@sandbox/shared';
import type { World } from '../world';
import { requireCapability, canSearchIndex, OperationsError } from './access';
import { appendRecordedEvents, eventMetadata } from './ingestion';
import { indexExists } from './indexes';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { checksum } from '../hosts/cluster';
import { journal } from '../journal';
export const RESPONSE_ADAPTER_PATH = '/etc/v7-adapters/response.yaml';
export const RESPONSE_ADAPTER_SOURCE =
  'version: 1\nendpoint: https://servicenow.practice.invalid\ncredentialAlias: training_valid\nallowed: true\n';
const state = (w: World) =>
  (w.security ??= { version: 1, nextId: 1, notables: [], attempts: [], tickets: [] });
function persist(w: World) {
  journal(w, { k: 'security.state', state: structuredClone(w.security!) });
}
/** Invoked only after the common alert condition matches real completed search rows. */
export function createSecurityNotable(
  w: World,
  report: SavedReport,
  run: ReportRun,
  notification: AlertNotification,
  rows: Record<string, ResultValue>[],
) {
  const old = w.security?.notables.find((n) => n.notificationId === notification.id);
  if (old) return old;
  requireCapability(w, report.host, run.principal, 'edit_monitor');
  if (!canSearchIndex(w, report.host, run.principal, 'notable'))
    throw new OperationsError('Notable action requires access to the notable destination index');
  if ((w.security?.notables.length ?? 0) >= 500)
    throw new OperationsError('Retained notable limit: 500; use another isolated practice attempt');
  const receiver = w.infra.find(
    (h) => h.role === 'indexer' && !h.retired && indexExists(w, 'notable', h.hostname),
  )?.hostname;
  if (!receiver)
    throw new OperationsError(
      'Activate the notable events index on an available indexer before running this detection',
    );
  const settings = report.alert?.notable,
    title = settings?.title || report.title,
    description = settings?.description || '',
    securityDomain = settings?.securityDomain || 'access',
    severity =
      settings?.severity ||
      ['unknown', 'info', 'low', 'medium', 'high', 'critical', 'critical'][notification.severity]!,
    id = 'notable-' + (w.security?.nextId ?? 1),
    fields: Record<string, ResultValue> = {
      event_id: id,
      rule_name: report.title,
      rule_title: title,
      rule_description: description,
      security_domain: securityDomain,
      severity,
      source_run_id: run.id,
      source_notification_id: notification.id,
      result_count: rows.length,
    };
  // Preserve original metadata with orig_* keys; never let a result replace notable provenance.
  for (const [key, value] of Object.entries(rows[0] ?? {})) {
    const dest = eventMetadata.has(key) ? 'orig_' + key.replace(/^_+/, '') : key;
    if (!['__proto__', 'prototype', 'constructor'].includes(dest) && !Object.hasOwn(fields, dest))
      fields[dest] = value;
  }
  const events = appendRecordedEvents(w, [
    {
      time: notification.time,
      indexTime: w.clock.now,
      raw: JSON.stringify(fields),
      host: report.host,
      source: report.title,
      sourcetype: 'stash',
      index: 'notable',
      receiver,
      fields,
      provenance: 'summary',
      operationId: notification.id,
    },
  ]);
  const s = state(w);
  s.nextId++;
  const notable = {
    id,
    host: report.host,
    reportId: report.id,
    revision: report.revision,
    runId: run.id,
    notificationId: notification.id,
    tick: w.clock.tick,
    title,
    description,
    securityDomain,
    severity,
    rows: structuredClone(rows),
    eventId: events[0]!.id,
    status: 'new' as const,
    owner: 'unassigned' as const,
    notes: [],
  };
  s.notables.push(notable);
  persist(w);
  return notable;
}
export function securityRevision(w: World, host: string) {
  const p = resolveHost(w, host);
  if (!p?.splunk || p.role !== 'search_head') throw new OperationsError('Choose a search head');
  const fs = hostFs(w, p);
  return checksum({
    state: JSON.stringify(w.security ?? null),
    source: fs.exists(RESPONSE_ADAPTER_PATH) ? fs.readFile(RESPONSE_ADAPTER_PATH, ROOT) : '',
    running: String(w.hosts.confVersion),
  });
}
function requireNotable(w: World, host: string, id: string, principal: PracticePrincipal) {
  requireCapability(w, host, principal, 'edit_monitor');
  const p = resolveHost(w, host);
  if (!p?.splunk || p.role !== 'search_head' || !splunkdRunning(w, p))
    throw new OperationsError('Choose an available search head');
  if (!canSearchIndex(w, host, principal, 'notable'))
    throw new OperationsError('Notable index access is required');
  const n = w.security?.notables.find((n) => n.id === id && n.host === host);
  if (!n) throw new OperationsError('Notable is not in this dispatch scope');
  return n;
}
export function reviewNotable(
  w: World,
  host: string,
  id: string,
  update: {
    status: 'new' | 'in-progress' | 'resolved';
    owner: 'unassigned' | 'admin' | 'analyst' | 'operator';
    note: string;
  },
  principal: PracticePrincipal = 'admin',
) {
  const n = requireNotable(w, host, id, principal);
  if (
    !['new', 'in-progress', 'resolved'].includes(update.status) ||
    !['unassigned', 'admin', 'analyst', 'operator'].includes(update.owner) ||
    !update.note.trim() ||
    update.note.length > 2000
  )
    throw new OperationsError('Choose a valid status/owner and an investigation note up to 2,000 characters');
  n.status = update.status;
  n.owner = update.owner;
  n.notes.push({ tick: w.clock.tick, principal, note: update.note, status: update.status });
  n.notes = n.notes.slice(-100);
  persist(w);
  return structuredClone(n);
}
/** Teaching adapter schema. Native SOAR apps/ServiceNow REST credentials are intentionally not accepted. */
export function stageResponseAdapter(
  w: World,
  host: string,
  source: string,
  principal: PracticePrincipal = 'admin',
) {
  requireCapability(w, host, principal, 'indexes_edit');
  validateAdapter(source);
  const p = resolveHost(w, host);
  if (!p?.splunk || p.role !== 'search_head') throw new OperationsError('Choose a search head');
  const fs = hostFs(w, p);
  fs.mkdir('/etc/v7-adapters', ROOT, { parents: true });
  fs.writeFile(RESPONSE_ADAPTER_PATH, source, ROOT);
}
function validateAdapter(source: string) {
  if (source.length > 5000) throw new OperationsError('Response adapter source limit: 5 KB');
  let value: unknown;
  try {
    value = parse(source, { maxAliasCount: 0 });
  } catch {
    throw new OperationsError('Invalid response adapter YAML');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new OperationsError('Response adapter must be a YAML mapping');
  const v = value as Record<string, unknown>;
  if (
    Object.keys(v).some((k) => !['version', 'endpoint', 'credentialAlias', 'allowed'].includes(k)) ||
    v.version !== 1 ||
    v.endpoint !== 'https://servicenow.practice.invalid' ||
    typeof v.allowed !== 'boolean' ||
    !['training_valid', 'training_expired', 'missing'].includes(String(v.credentialAlias))
  )
    throw new OperationsError(
      'Use version 1, the fixed fictional endpoint, allowed, and a training credential alias; real URLs/secrets are not supported',
    );
  return v;
}
export function respondToNotable(w: World, host: string, id: string, principal: PracticePrincipal = 'admin') {
  const n = requireNotable(w, host, id, principal),
    s = state(w),
    revision = securityRevision(w, host),
    attempt: import('@sandbox/shared').ResponseAttempt = {
      id: 'response-' + s.nextId++,
      notableId: id,
      tick: w.clock.tick,
      sourceRevision: revision,
      status: 'failed',
    };
  try {
    const fs = hostFs(w, resolveHost(w, host)!);
    if (!fs.exists(RESPONSE_ADAPTER_PATH)) throw new OperationsError('Response adapter source is missing');
    const adapter = validateAdapter(fs.readFile(RESPONSE_ADAPTER_PATH, ROOT));
    if (adapter.credentialAlias !== 'training_valid')
      throw new OperationsError('Authentication failed for the fictional response adapter');
    if (!adapter.allowed)
      throw new OperationsError('Authorization denied by the fictional ticket service policy');
    const existing = s.tickets.find((t) => t.notableId === id);
    if (existing) {
      attempt.status = 'existing';
      attempt.ticketId = existing.id;
    } else {
      if (s.tickets.length >= 500) throw new OperationsError('Practice ticket limit: 500');
      const ticket = {
        id: 'INC-PRACTICE-' + String(s.nextId++).padStart(6, '0'),
        notableId: id,
        createdTick: w.clock.tick,
        summary: n.title,
        severity: n.severity,
        sourceNotificationId: n.notificationId,
      };
      s.tickets.push(ticket);
      attempt.status = 'created';
      attempt.ticketId = ticket.id;
    }
  } catch (e) {
    attempt.error = (e as Error).message;
  }
  s.attempts.push(attempt);
  s.attempts = s.attempts.slice(-500);
  persist(w);
  return structuredClone(attempt);
}
export function securityView(w: World, host: string, principal: PracticePrincipal = 'admin') {
  const revision = securityRevision(w, host),
    allowed = canSearchIndex(w, host, principal, 'notable'),
    notables = allowed ? (w.security?.notables.filter((n) => n.host === host) ?? []) : [],
    ids = new Set(notables.map((n) => n.id)),
    fs = hostFs(w, resolveHost(w, host)!);
  return {
    host,
    revision,
    principal,
    allowed,
    sourcePath: RESPONSE_ADAPTER_PATH,
    source:
      principal === 'admin' && fs.exists(RESPONSE_ADAPTER_PATH)
        ? fs.readFile(RESPONSE_ADAPTER_PATH, ROOT)
        : '',
    notables: structuredClone(notables),
    attempts: structuredClone(w.security?.attempts.filter((a) => ids.has(a.notableId)) ?? []),
    tickets: structuredClone(w.security?.tickets.filter((t) => ids.has(t.notableId)) ?? []),
  };
}
