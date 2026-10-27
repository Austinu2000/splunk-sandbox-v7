import type { KvState, KvNode, KvRecord, KvStatus } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost, splunkdRunning, splunkVersion } from '../hosts/profile';
import { runningVfs, runningConf, reloadAppConf, restartSplunk } from '../hosts/running';
import { setting } from '../conf/merge';
import { parseConf } from '../conf/parse';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { journal } from '../journal';
export class KvError extends Error {}
export const KV_APP = 'kv_training';
const safe = (s: string) =>
  /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(s) && !['constructor', 'prototype', '__proto__'].includes(s);
function name(s: string) {
  if (!safe(s))
    throw new KvError('Use a name beginning with a letter, then letters, digits, underscores or hyphens');
  return s;
}
export function kvState(w: World): KvState {
  if (w.kvstore) return w.kvstore;
  const heads = w.infra.filter((n) => n.role === 'search_head');
  const clustered = !!w.config.profile?.infra.searchHeadCluster.deployer;
  const state: KvState = {
    version: 1,
    nextId: 1,
    nodes: [],
    domains: {},
    backups: [],
    evidence: [],
    incidents: [],
  };
  for (const h of heads) {
    const domain = clustered && h.hostname !== 'es01' ? 'search-head-cluster' : h.hostname;
    const rows = {
      [`${KV_APP}/assets`]: [
        { _key: 'asset-1', hostname: 'payments01', owner: 'Platform', criticality: 5 },
        { _key: 'asset-2', hostname: 'web01', owner: 'Web', criticality: 2 },
      ],
    };
    state.domains[domain] ??= { revision: 1, rows: structuredClone(rows) };
    state.nodes.push({
      host: h.hostname,
      domain,
      serverVersion: '7.0.0',
      networkOpen: true,
      appliedRevision: 1,
      rows: structuredClone(rows),
    });
  }
  w.kvstore = state;
  return state;
}
export function kvNode(w: World, host: string): KvNode {
  const node = kvState(w).nodes.find((n) => n.host === host);
  if (!node) throw new KvError('KV Store administration is modeled on search heads only');
  return node;
}
export function kvDefaultHost(w: World) {
  const n = kvState(w).nodes[0];
  if (!n) throw new KvError('No search head in this environment');
  return n.host;
}
export function kvPersist(w: World) {
  journal(w, { k: 'kv.state', state: structuredClone(kvState(w)) });
}
function evidence(w: World, action: string, host: string, target: string, detail: string) {
  const s = kvState(w);
  s.evidence.push({ id: s.nextId++, tick: w.clock.tick, action, host, target, detail });
}
function config(w: World, host: string) {
  const p = resolveHost(w, host)!;
  const c = runningConf(w, p, 'server');
  return {
    disabled: ['1', 'true'].includes(setting(c, 'kvstore', 'disabled') ?? 'false'),
    port: Number(setting(c, 'kvstore', 'port') ?? '8191'),
    storageEngine: setting(c, 'kvstore', 'storageEngine') ?? 'wiredTiger',
  };
}
/** Local process state is independent of the injected transport fault. */
export function kvRuntime(w: World, host: string) {
  const c = config(w, host);
  return {
    ...c,
    running:
      splunkdRunning(w, resolveHost(w, host)!) &&
      !c.disabled &&
      c.storageEngine === 'wiredTiger' &&
      Number.isInteger(c.port) &&
      c.port > 0 &&
      c.port <= 65535,
  };
}
function configMembers(w: World, host: string) {
  const nodes = kvState(w).nodes.filter((n) => n.domain === kvNode(w, host).domain);
  if (nodes.some((n) => kvStatus(w, n.host).status !== 'ready'))
    throw new KvError(
      'Restore all members before distributing collection definitions in this practice model',
    );
  return nodes;
}
function writeAppConfig(w: World, host: string, app: string, conf: string, text: string) {
  const fs = hostFs(w, resolveHost(w, host)!),
    dir = `/opt/splunk/etc/apps/${app}/local`,
    path = `${dir}/${conf}.conf`;
  fs.mkdir(dir, ROOT, { parents: true });
  fs.setMeta(dir, { owner: 'splunk', group: 'splunk' }, ROOT);
  fs.writeFile(path, text, ROOT);
  fs.setMeta(path, { owner: 'splunk', group: 'splunk' }, ROOT);
}
export function kvStatus(w: World, host: string): KvStatus {
  const n = kvNode(w, host),
    d = kvState(w).domains[n.domain]!,
    c = config(w, host);
  const live = (m: KvNode) => {
    const mc = config(w, m.host);
    return (
      splunkdRunning(w, resolveHost(w, m.host)!) &&
      !mc.disabled &&
      mc.storageEngine === 'wiredTiger' &&
      mc.port === 8191 &&
      m.networkOpen
    );
  };
  const members = kvState(w).nodes.filter((m) => m.domain === n.domain),
    available = members.filter(live);
  const primary =
    available.filter((m) => m.appliedRevision === d.revision).sort((a, b) => a.host.localeCompare(b.host))[0]
      ?.host ?? null;
  const healthy = live(n),
    majority = available.length > members.length / 2;
  return {
    host,
    splunkVersion: splunkVersion(w, resolveHost(w, host)!)!,
    serverVersion: n.serverVersion,
    storageEngine: c.storageEngine,
    status: c.disabled ? 'disabled' : healthy ? 'ready' : 'failed',
    port: c.port,
    replicationStatus: !healthy
      ? 'disconnected'
      : members.length === 1
        ? 'standalone'
        : host === primary
          ? 'primary'
          : 'secondary',
    primary,
    appliedRevision: n.appliedRevision,
    latestRevision: d.revision,
    membersInSync: members.every((m) => live(m) && m.appliedRevision === d.revision),
    writable: healthy && majority && !!primary,
    reason: c.disabled
      ? 'KV Store disabled in running server.conf'
      : !splunkdRunning(w, resolveHost(w, host)!)
        ? 'splunkd is stopped'
        : !n.networkOpen
          ? 'Replication transport unavailable'
          : c.port !== 8191
            ? 'Practice peer transport expects port 8191'
            : c.storageEngine !== 'wiredTiger'
              ? 'Unsupported storage engine'
              : !majority
                ? 'No replica-set majority'
                : !primary
                  ? 'No current primary available'
                  : n.appliedRevision !== d.revision
                    ? 'Local collection data is stale'
                    : 'Healthy',
  };
}
function ready(w: World, host: string, write = false) {
  const s = kvStatus(w, host);
  if (s.status !== 'ready' || (write && !s.writable)) throw new KvError(s.reason);
  return s;
}
function appConfig(
  w: World,
  host: string,
  app: string,
  conf: string,
): Record<string, Record<string, string>> {
  name(app);
  const fs = runningVfs(w, resolveHost(w, host)!);
  const result: Record<string, Record<string, string>> = {};
  for (const level of ['default', 'local']) {
    const path = `/opt/splunk/etc/apps/${app}/${level}/${conf}.conf`;
    if (!fs.exists(path)) continue;
    const parsed = parseConf(fs.readFile(path, ROOT));
    if (parsed.errors.length) throw new KvError(`${path}:${parsed.errors[0]!.line}: invalid configuration`);
    for (const [stanza, value] of parsed.stanzas) {
      if (!safe(stanza)) throw new KvError('Invalid collection or lookup stanza name');
      const target = (result[stanza] ??= {});
      for (const [k, v] of value.settings) target[k] = v.value;
    }
  }
  const defaults = result.default ?? {};
  delete result.default;
  return Object.fromEntries(Object.entries(result).map(([k, v]) => [k, { ...defaults, ...v }]));
}
export function kvCollections(w: World, host: string, app = KV_APP) {
  return Object.entries(appConfig(w, host, app, 'collections')).map(([collection, settings]) => ({
    collection,
    settings,
    count: kvNode(w, host).rows[`${app}/${collection}`]?.length ?? 0,
  }));
}
function definition(w: World, host: string, app: string, collection: string) {
  name(collection);
  const c = appConfig(w, host, app, 'collections')[collection];
  if (!c) throw new KvError(`Collection ${app}/${collection} is not configured on ${host}`);
  if (
    Object.entries(c).some(
      ([k, v]) => k.startsWith('field.') && !['string', 'number', 'bool', 'time', 'cidr'].includes(v),
    )
  )
    throw new KvError('Unsupported schema type in collection configuration');
  if (['true', '1'].includes(c.disabled ?? 'false')) throw new KvError('Collection is disabled');
  return c;
}
function validRows(rows: unknown, settings: Record<string, string>): Omit<KvRecord, '_key'>[] {
  if (!Array.isArray(rows) || rows.length > 10000)
    throw new KvError('Supply an array of at most 10,000 records');
  const enforce = ['1', 'true'].includes(settings.enforceTypes ?? 'false');
  return rows.map((row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row))
      throw new KvError('Each record must be a JSON object');
    const out: Record<string, string | number | boolean | null> = {};
    for (const [k, v] of Object.entries(row)) {
      if (
        !/^_key$|^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(k) ||
        ['constructor', 'prototype', '__proto__'].includes(k)
      )
        throw new KvError('Invalid record field');
      if (v !== null && !['string', 'number', 'boolean'].includes(typeof v))
        throw new KvError('This model supports scalar record fields only');
      if (typeof v === 'number' && !Number.isFinite(v)) throw new KvError('Invalid numeric value');
      if (k === '_key' && (typeof v !== 'string' || !v || v.length > 100))
        throw new KvError('_key must be a nonempty string');
      const t = settings[`field.${k}`];
      if (
        enforce &&
        v !== null &&
        t &&
        ((t === 'number' && typeof v !== 'number') ||
          (t === 'bool' && typeof v !== 'boolean') ||
          (['string', 'cidr'].includes(t) && typeof v !== 'string') ||
          (t === 'time' && typeof v !== 'number'))
      )
        throw new KvError(`Type validation failed for ${k}: expected ${t}`);
      out[k] = v as string | number | boolean | null;
    }
    return out;
  });
}
export function kvRead(
  w: World,
  host: string,
  app: string,
  collection: string,
  query: Record<string, unknown> = {},
) {
  ready(w, host);
  definition(w, host, app, collection);
  if (
    Object.keys(query).some((k) => k.startsWith('$')) ||
    Object.values(query).some((v) => typeof v === 'object' && v !== null)
  )
    throw new KvError('Only equality queries on scalar fields are supported');
  return structuredClone(
    (kvNode(w, host).rows[`${app}/${collection}`] ?? []).filter((row) =>
      Object.entries(query).every(([k, v]) => row[k] === v),
    ),
  );
}
export function kvWrite(
  w: World,
  host: string,
  app: string,
  collection: string,
  rows: unknown,
  mode: 'insert' | 'upsert' | 'replace' = 'insert',
) {
  const status = ready(w, host, true),
    settings = definition(w, host, app, collection),
    input = validRows(rows, settings);
  const n = kvNode(w, host),
    d = kvState(w).domains[n.domain]!,
    key = `${app}/${collection}`;
  const next = mode === 'replace' ? [] : structuredClone(d.rows[key] ?? []);
  let nextId = kvState(w).nextId;
  for (const row of input) {
    const record = { ...row, _key: typeof row._key === 'string' ? row._key : `kv-${nextId++}` } as KvRecord;
    const i = next.findIndex((r) => r._key === record._key);
    if (i >= 0 && mode === 'insert') throw new KvError('Duplicate _key');
    if (i >= 0) next[i] = record;
    else next.push(record);
  }
  if (next.length > 10000) throw new KvError('Collection record limit exceeded');
  // Atomic: validation completes before any live data or counters change.
  kvState(w).nextId = nextId;
  d.rows[key] = next;
  d.revision++;
  const primary = kvNode(w, status.primary!);
  primary.rows = structuredClone(d.rows);
  primary.appliedRevision = d.revision;
  evidence(w, 'write', host, key, `${mode}: ${input.length} records; revision ${d.revision}`);
  kvPersist(w);
  return input.length;
}
export function kvDelete(
  w: World,
  host: string,
  app: string,
  collection: string,
  query: Record<string, unknown>,
) {
  ready(w, host, true);
  definition(w, host, app, collection);
  // Validate query independently of which replica receives the write.
  kvRead(w, host, app, collection, query);
  const n = kvNode(w, host),
    d = kvState(w).domains[n.domain]!,
    key = `${app}/${collection}`;
  const before = d.rows[key] ?? [];
  const remaining = before.filter((r) => !Object.entries(query).every(([k, v]) => r[k] === v));
  kvWrite(w, host, app, collection, remaining, 'replace');
  evidence(w, 'delete', host, key, `${before.length - remaining.length} records deleted`);
  kvPersist(w);
  return before.length - remaining.length;
}
export function tickKv(w: World) {
  if (!w.kvstore) return;
  for (const n of w.kvstore.nodes) {
    if (kvStatus(w, n.host).status !== 'ready') continue;
    const d = w.kvstore.domains[n.domain]!;
    // A healthy current primary is required to transfer data to a replica.
    if (kvStatus(w, n.host).primary && n.appliedRevision !== d.revision) {
      n.rows = structuredClone(d.rows);
      n.appliedRevision = d.revision;
    }
  }
}
export function kvResync(w: World, host: string) {
  const s = ready(w, host);
  if (!s.primary) throw new KvError('No healthy current primary to synchronize from');
  const n = kvNode(w, host),
    d = kvState(w).domains[n.domain]!;
  n.rows = structuredClone(d.rows);
  n.appliedRevision = d.revision;
  evidence(w, 'resync', host, n.domain, `Synchronized revision ${d.revision}`);
  kvPersist(w);
}
export function kvBackup(w: World, host: string, archive: string) {
  name(archive);
  ready(w, host);
  const s = kvState(w),
    n = kvNode(w, host);
  if (s.backups.some((b) => b.name === archive && b.domain === n.domain))
    throw new KvError('Backup already exists; choose a new name');
  if (s.backups.length >= 30) throw new KvError('Practice backup limit reached');
  if (n.appliedRevision !== s.domains[n.domain]!.revision)
    throw new KvError('Back up a current replica, not stale data');
  s.backups.push({ name: archive, domain: n.domain, tick: w.clock.tick, rows: structuredClone(n.rows) });
  evidence(w, 'backup', host, archive, 'Collection data snapshot created');
  kvPersist(w);
  return archive;
}
export function kvRestore(w: World, host: string, archive: string) {
  const st = ready(w, host, true),
    s = kvState(w),
    n = kvNode(w, host),
    d = s.domains[n.domain]!;
  const backup = s.backups.find((b) => b.domain === n.domain && b.name === archive);
  if (!backup) throw new KvError('Backup not found in this deployment');
  for (const [key, rows] of Object.entries(backup.rows)) {
    const [app, c] = key.split('/');
    validRows(rows, definition(w, host, app!, c!));
  }
  // Preserve a recoverable pre-restore snapshot as part of this simulator's restore operation.
  if (s.backups.length >= 30) throw new KvError('Practice backup limit reached');
  s.backups.push({
    name: `before-restore-${s.nextId++}`,
    domain: n.domain,
    tick: w.clock.tick,
    rows: structuredClone(d.rows),
  });
  d.rows = structuredClone(backup.rows);
  d.revision++;
  const primary = kvNode(w, st.primary!);
  primary.rows = structuredClone(d.rows);
  primary.appliedRevision = d.revision;
  evidence(w, 'restore', host, archive, `Restored to revision ${d.revision}; previous data retained`);
  kvPersist(w);
}
export function kvFault(w: World, host: string, networkOpen: boolean) {
  kvNode(w, host).networkOpen = networkOpen;
  evidence(w, 'transport', host, 'replication', networkOpen ? 'Transport restored' : 'Transport interrupted');
  kvPersist(w);
}
export function kvInspect(w: World, host: string) {
  const s = kvStatus(w, host);
  evidence(w, 'inspect', host, 'status', JSON.stringify(s));
  kvPersist(w);
  return s;
}
export function kvConfigureCollection(
  w: World,
  host: string,
  app: string,
  collection: string,
  settings: Record<string, string>,
) {
  name(app);
  name(collection);
  ready(w, host, true);
  for (const [k, v] of Object.entries(settings)) {
    if (
      !/^(field\.[A-Za-z][A-Za-z0-9_]*|enforceTypes|replicate|disabled)$/.test(k) ||
      typeof v !== 'string' ||
      /[\r\n]/.test(v)
    )
      throw new KvError('Supported collection settings: field.*, enforceTypes, replicate, disabled');
    if (k.startsWith('field.') && !['string', 'number', 'bool', 'time', 'cidr'].includes(v))
      throw new KvError('Unsupported schema type');
    if (!k.startsWith('field.') && !['true', 'false', '0', '1'].includes(v))
      throw new KvError('Use a boolean value');
  }
  // The bounded model requires all members for configuration distribution.
  for (const node of configMembers(w, host)) {
    const p = resolveHost(w, node.host)!,
      fs = hostFs(w, p),
      path = `/opt/splunk/etc/apps/${app}/local/collections.conf`;
    const old = fs.exists(path) ? fs.readFile(path, ROOT) : '';
    writeAppConfig(
      w,
      node.host,
      app,
      'collections',
      old +
        `\n[${collection}]\n` +
        Object.entries(settings)
          .map(([k, v]) => `${k} = ${v}\n`)
          .join(''),
    );
    reloadAppConf(w, p, app);
  }
  evidence(w, 'collection', host, `${app}/${collection}`, 'Collection configuration applied');
  kvPersist(w);
}
/** Remove locally created definitions and their records; shipped defaults are managed by disabling them. */
export function kvDeleteCollection(w: World, host: string, app: string, collection: string) {
  name(app);
  name(collection);
  const status = ready(w, host, true),
    members = configMembers(w, host);
  const edits = members.map((node) => {
    const fs = hostFs(w, resolveHost(w, node.host)!),
      base = `/opt/splunk/etc/apps/${app}`;
    if (
      fs.exists(`${base}/default/collections.conf`) &&
      parseConf(fs.readFile(`${base}/default/collections.conf`, ROOT)).stanzas.has(collection)
    )
      throw new KvError(
        'Shipped default collections cannot be deleted; disable them or delete their records',
      );
    const path = `${base}/local/collections.conf`,
      old = fs.exists(path) ? fs.readFile(path, ROOT) : '';
    let omit = false;
    const text = old
      .split('\n')
      .filter((line) => {
        const match = /^\s*\[([^\]]+)\]/.exec(line);
        if (match) omit = match[1] === collection;
        return !omit;
      })
      .join('\n');
    return { host: node.host, text };
  });
  if (!kvCollections(w, host, app).some((c) => c.collection === collection))
    throw new KvError('Collection not found');
  for (const edit of edits) {
    writeAppConfig(w, edit.host, app, 'collections', edit.text);
    reloadAppConf(w, resolveHost(w, edit.host)!, app);
  }
  const d = kvState(w).domains[kvNode(w, host).domain]!;
  delete d.rows[`${app}/${collection}`];
  d.revision++;
  const primary = kvNode(w, status.primary!);
  primary.rows = structuredClone(d.rows);
  primary.appliedRevision = d.revision;
  evidence(w, 'collection-delete', host, `${app}/${collection}`, 'Definition and records removed');
  kvPersist(w);
}
export function kvLookup(w: World, rawName: string, host = kvDefaultHost(w), app = KV_APP) {
  if (!safe(rawName)) return null;
  const t = appConfig(w, host, app, 'transforms')[rawName];
  if (!t || t.external_type !== 'kvstore') return null;
  if (!t.collection) throw new KvError('KV lookup requires collection');
  return {
    host,
    app,
    collection: t.collection,
    fields: (t.fields_list ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
export function kvConfigFiles(w: World, host: string, app = KV_APP) {
  name(app);
  const fs = hostFs(w, resolveHost(w, host)!);
  return Object.fromEntries(
    ['collections', 'transforms', 'server'].map((c) => {
      const path = `/opt/splunk/etc/apps/${c === 'server' ? KV_APP : app}/local/${c}.conf`;
      return [
        c,
        fs.exists(path)
          ? fs.readFile(path, ROOT)
          : fs.exists(path.replace('/local/', '/default/'))
            ? fs.readFile(path.replace('/local/', '/default/'), ROOT)
            : '',
      ];
    }),
  );
}
export function kvStage(w: World, host: string, app: string, conf: string, text: string) {
  name(app);
  kvNode(w, host);
  if (!['collections', 'transforms', 'server'].includes(conf) || text.length > 50000)
    throw new KvError('Invalid configuration');
  const parsed = parseConf(text);
  if (parsed.errors.length) throw new KvError(`Invalid configuration at line ${parsed.errors[0]!.line}`);
  if (conf === 'server' && [...parsed.stanzas.keys()].some((s) => s !== 'kvstore'))
    throw new KvError(
      'This editor accepts only the kvstore stanza; use the terminal for other server settings',
    );
  const path =
    conf === 'server'
      ? '/opt/splunk/etc/apps/kv_training/local/server.conf'
      : `/opt/splunk/etc/apps/${app}/local/${conf}.conf`;
  writeAppConfig(w, host, conf === 'server' ? KV_APP : app, conf, text);
  evidence(
    w,
    'stage',
    host,
    path,
    'Saved on disk; apply with reload (collections/lookups) or restart (server settings)',
  );
  kvPersist(w);
}
export const KV_INCIDENTS = [
  {
    id: 'replication',
    title: 'A search head serves stale asset ownership',
    profile: 'apl',
    fault: 'network',
    check: 'sync',
  },
  {
    id: 'service',
    title: 'KV-backed lookups fail after a service configuration change',
    profile: 'lab',
    fault: 'disabled',
    check: 'ready',
  },
  {
    id: 'recovery',
    title: 'Asset records were deleted during a bulk update',
    profile: 'lab',
    fault: 'delete',
    check: 'restored',
  },
] as const;
export function kvStartIncident(w: World, id: string) {
  const def = KV_INCIDENTS.find((d) => d.id === id);
  if (!def) throw new KvError('Unknown KV incident');
  const s = kvState(w);
  if (s.incidents.some((i) => i.closed === undefined))
    throw new KvError('Finish the active KV incident first');
  let host = kvDefaultHost(w);
  if (def.fault === 'network') {
    const candidates = s.nodes.filter((n) => s.nodes.filter((m) => m.domain === n.domain).length >= 3);
    if (!candidates.length) throw new KvError('Use APL for the replication incident');
    host = candidates.at(-1)!.host;
    kvFault(w, host, false);
    const primary = candidates.find((n) => n.host !== host)!.host;
    kvWrite(
      w,
      primary,
      KV_APP,
      'assets',
      [{ _key: 'asset-1', hostname: 'payments01', owner: 'Incident Team', criticality: 5 }],
      'upsert',
    );
  } else if (def.fault === 'disabled') {
    kvStage(w, host, KV_APP, 'server', '[kvstore]\ndisabled = true\n');
    // Apply a fixture fault with the same restart semantics as a learner's fix.
    applyKvRestart(w, host);
  } else {
    kvBackup(w, host, `incident-${s.nextId}`);
    kvDelete(w, host, KV_APP, 'assets', {});
  }
  const attempt: KvState['incidents'][number] = {
    id: `kv-incident-${s.nextId++}`,
    kind: id,
    host,
    started: w.clock.tick,
    recoveryArchive: def.fault === 'delete' ? s.backups.at(-1)!.name : undefined,
  };
  s.incidents.push(attempt);
  kvPersist(w);
  return attempt;
}
export function applyKvRestart(w: World, host: string) {
  kvNode(w, host);
  restartSplunk(w, resolveHost(w, host)!);
  evidence(w, 'restart', host, 'kvstore', 'Restarted Splunk and reloaded service configuration');
  kvPersist(w);
}
export function kvCloseIncident(w: World, id: string, notes: string) {
  const s = kvState(w),
    a = s.incidents.find((i) => i.id === id);
  if (!a || a.closed !== undefined) throw new KvError('No open incident');
  const d = KV_INCIDENTS.find((i) => i.id === a.kind)!,
    status = kvStatus(w, a.host);
  const recovered =
    d.check === 'sync'
      ? status.membersInSync
      : d.check === 'ready'
        ? status.status === 'ready'
        : JSON.stringify(kvRead(w, a.host, KV_APP, 'assets')) ===
          JSON.stringify(
            s.backups.find((b) => b.name === a.recoveryArchive && b.domain === kvNode(w, a.host).domain)
              ?.rows[`${KV_APP}/assets`],
          );
  if (!recovered) throw new KvError('Recovery criteria have not been met');
  if (notes.trim().length < 30) throw new KvError('Describe root cause, change and verification');
  a.closed = w.clock.tick;
  a.notes = notes;
  kvPersist(w);
}
