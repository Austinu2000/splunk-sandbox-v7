import type { World } from '../world';
import { runningConf } from '../hosts/running';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { ingestText } from './ingestion';
import { kvRead, kvWrite, kvStatus } from '../kvstore/engine';
import { OperationsError } from './access';
import { integrationReceipt, persistIntegrations } from './integration-state';
export const DBX_APP = 'splunk_app_db_connect';
export const DBX_COLLECTION = 'dbx_db_input';
export const DATABASE_SOURCE =
  '[v7_inventory]\nconnection=practice_db\nmode=rising\nquery=SELECT id, service, status FROM service_events WHERE id > ? ORDER BY id ASC\ntail_rising_column_name=id\ntail_rising_column_number=1\ncheckpoint_key=v7_inventory\ninterval=60\nindex=db_logs\nsourcetype=v7_database\ninput_type=event\ndisabled=0\n';
export function pollDatabase(w: World, force = false) {
  const a = w.integrations?.database;
  if (!a) throw new OperationsError('Database practice is not initialized');
  const p = resolveHost(w, a.host)!,
    conf = runningConf(w, p, 'db_inputs'),
    name = 'v7_inventory',
    get = (key: string) => setting(conf, name, key) ?? '',
    interval = Number(get('interval') || '60');
  if (!force && a.lastPoll !== undefined && w.clock.now - a.lastPoll < Math.max(10, interval) * 1000) return;
  a.lastPoll = w.clock.now;
  try {
    if (!splunkdRunning(w, p)) throw new OperationsError('DB Connect practice host is stopped');
    if (!conf.stanzas.has(name) || confBool(get('disabled')))
      throw new OperationsError('Activate the enabled native database input');
    if (get('connection') !== 'practice_db')
      throw new OperationsError('Fictional database connection is unavailable');
    if (!Number.isInteger(interval) || interval < 10 || interval > 3600)
      throw new OperationsError('Practice database polling supports 10–3600 second intervals');
    if (
      get('mode') !== 'rising' ||
      get('tail_rising_column_name') !== 'id' ||
      get('tail_rising_column_number') !== '1' ||
      get('input_type') !== 'event'
    )
      throw new OperationsError('Use the supplied numeric rising-id event input');
    if (
      !/^SELECT\s+id\s*,\s*service\s*,\s*status\s+FROM\s+service_events\s+WHERE\s+id\s*>\s*\?\s+ORDER\s+BY\s+id(?:\s+ASC)?\s*;?$/i.test(
        get('query'),
      )
    )
      throw new OperationsError(
        'This bounded SQL adapter requires SELECT id, service, status FROM service_events WHERE id > ? ORDER BY id ASC; arbitrary SQL is never executed',
      );
    const key = get('checkpoint_key');
    if (key !== 'v7_inventory') throw new OperationsError('Preserve the supplied native checkpoint_key');
    const kv = kvStatus(w, a.host);
    if (kv.status !== 'ready' || !kv.writable || kv.appliedRevision !== kv.latestRevision)
      throw new OperationsError('Database checkpoint KV Store is unavailable, read-only or stale');
    const checkpoint = kvRead(w, a.host, DBX_APP, DBX_COLLECTION, { _key: key })[0]?.checkpoint;
    if (typeof checkpoint !== 'number' || !Number.isSafeInteger(checkpoint) || checkpoint < 0)
      throw new OperationsError('Numeric database checkpoint is missing or malformed in KV Store');
    const prior = a.accepted.find((b) => b.key === key && b.from === checkpoint);
    if (prior) {
      kvWrite(w, a.host, DBX_APP, DBX_COLLECTION, [{ _key: key, checkpoint: prior.to }], 'upsert');
      integrationReceipt(w, 'database', key, 'duplicate', prior.eventIds, undefined, prior.to);
      return;
    }
    const rows = a.rows.filter((r) => r.id > checkpoint).sort((a, b) => a.id - b.id);
    if (!rows.length) {
      integrationReceipt(w, 'database', key, 'empty', [], undefined, checkpoint);
      return;
    }
    if (
      rows.length > 1000 ||
      new Set(rows.map((r) => r.id)).size !== rows.length ||
      rows.some(
        (r) =>
          !Number.isSafeInteger(r.id) ||
          r.id <= 0 ||
          !Number.isInteger(r.status) ||
          !/^[A-Za-z][\w-]{0,63}$/.test(r.service),
      )
    )
      throw new OperationsError('Use at most 1,000 uniquely rising numeric rows');
    const records = ingestText(
        w,
        a.host,
        'dbconnect:' + name,
        get('sourcetype'),
        get('index'),
        rows.map((r) => 'id=' + r.id + ' service=' + r.service + ' status=' + r.status).join('\n') + '\n',
      ),
      to = rows.at(-1)!.id;
    // A retained accepted batch allows checkpoint repair to retry without indexing the same rows twice.
    a.accepted.push({ key, from: checkpoint, to, eventIds: records.map((r) => r.id) });
    persistIntegrations(w);
    kvWrite(w, a.host, DBX_APP, DBX_COLLECTION, [{ _key: key, checkpoint: to }], 'upsert');
    integrationReceipt(
      w,
      'database',
      key,
      'delivered',
      records.map((r) => r.id),
      undefined,
      to,
    );
  } catch (e) {
    integrationReceipt(w, 'database', 'v7_inventory', 'failed', [], (e as Error).message);
  }
  persistIntegrations(w);
}
export function appendDatabaseRow(w: World, row: { id: number; service: string; status: number }) {
  const a = w.integrations?.database;
  if (!a) throw new OperationsError('Database practice is not initialized');
  if (
    a.rows.length >= 1000 ||
    !Number.isSafeInteger(row.id) ||
    row.id <= Math.max(0, ...a.rows.map((r) => r.id)) ||
    !Number.isInteger(row.status) ||
    row.status < 100 ||
    row.status > 599 ||
    !/^[A-Za-z][\w-]{0,63}$/.test(row.service)
  )
    throw new OperationsError(
      'Append a unique increasing numeric ID, a service name and HTTP status (100–599), up to 1,000 rows',
    );
  a.rows.push({ ...row });
  persistIntegrations(w);
}
