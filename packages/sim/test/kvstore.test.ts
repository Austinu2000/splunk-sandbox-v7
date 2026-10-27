import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { createWorld, tickWorld } from '../src/world';
import { parseProfile, profileWorldConfig } from '../src/profile';
import { saveWorld, loadWorld } from '../src/save';
import {
  kvState,
  kvStatus,
  kvRead,
  kvWrite,
  kvDelete,
  kvBackup,
  kvRestore,
  kvFault,
  kvResync,
  kvConfigureCollection,
  kvDeleteCollection,
  kvCollections,
  kvStage,
  kvStartIncident,
  kvCloseIncident,
  applyKvRestart,
  KV_APP,
} from '../src/kvstore/engine';
import { kvRest } from '../src/kvstore/rest';
import { resolveHost } from '../src/hosts/profile';
import { reloadAppConf, stopSplunk } from '../src/hosts/running';
import { runSearch } from '../src/spl/run';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { testTerm } from './helpers';
const world = (id = 'lab') =>
  createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL(`../../../profiles/${id}.yaml`, import.meta.url), 'utf8')),
    ),
  );
describe('V6 KV Store', () => {
  it('has consistent defaults, version/status, records and SPL lookups', () => {
    const w = world();
    expect(kvStatus(w, 'sh01')).toMatchObject({
      status: 'ready',
      serverVersion: '7.0.0',
      splunkVersion: '9.4.1',
      replicationStatus: 'standalone',
    });
    expect(kvRead(w, 'sh01', KV_APP, 'assets')).toHaveLength(2);
    const r = runSearch(w, { search: '| inputlookup assets_lookup | stats count' });
    expect(r.status).toBe('done');
    expect(r.results[0]!.get('count')).toBe(2);
    const t = testTerm(w);
    t.run('ssh splunk@sh01');
    expect(t.run('splunk show kvstore-status --verbose')).toContain('serverVersion : 7.0.0');
    expect(t.run('splunk btool collections list assets --debug')).toContain(
      'kv_training/default/collections.conf',
    );
  });
  it('validates the whole write atomically and rejects duplicate keys', () => {
    const w = world();
    const before = structuredClone(kvState(w));
    expect(() =>
      kvWrite(w, 'sh01', KV_APP, 'assets', [
        { _key: 'one', criticality: 3 },
        { _key: 'two', criticality: 'bad' },
      ]),
    ).toThrow('Type validation');
    expect(kvState(w)).toEqual(before);
    expect(() => kvWrite(w, 'sh01', KV_APP, 'assets', [{ _key: 'asset-1' }])).toThrow('Duplicate');
    kvWrite(w, 'sh01', KV_APP, 'assets', [{ _key: 'asset-1', owner: 'New owner', criticality: 4 }], 'upsert');
    expect(kvRead(w, 'sh01', KV_APP, 'assets', { _key: 'asset-1' })[0]!.owner).toBe('New owner');
  });
  it('separates staged config from applied app reload and server restart', () => {
    const w = world();
    kvStage(w, 'sh01', KV_APP, 'collections', '[services]\nenforceTypes = true\nfield.name = string\n');
    expect(() => kvRead(w, 'sh01', KV_APP, 'services')).toThrow('not configured');
    reloadAppConf(w, resolveHost(w, 'sh01')!, KV_APP);
    kvWrite(w, 'sh01', KV_APP, 'services', [{ name: 'payments' }]);
    kvStage(w, 'sh01', KV_APP, 'server', '[kvstore]\ndisabled = true\n');
    reloadAppConf(w, resolveHost(w, 'sh01')!, KV_APP);
    expect(kvStatus(w, 'sh01').status).toBe('ready');
    applyKvRestart(w, 'sh01');
    expect(kvStatus(w, 'sh01').status).toBe('disabled');
    expect(() => kvRead(w, 'sh01', KV_APP, 'assets')).toThrow();
    expect(runSearch(w, { search: '| inputlookup assets_lookup' }).status).toBe('failed');
  });
  it('honors system/local precedence over the app editor', () => {
    const w = world();
    const fs = hostFs(w, resolveHost(w, 'sh01')!);
    fs.writeFile('/opt/splunk/etc/system/local/server.conf', '[kvstore]\ndisabled = true\n', ROOT);
    kvStage(w, 'sh01', KV_APP, 'server', '[kvstore]\ndisabled = false\n');
    applyKvRestart(w, 'sh01');
    expect(kvStatus(w, 'sh01').status).toBe('disabled');
  });
  it('maintains stale reads and prevents writes without replica majority', () => {
    const w = world('apl'),
      members = kvState(w).nodes.filter((n) => n.domain === 'search-head-cluster');
    expect(members.length).toBeGreaterThanOrEqual(3);
    const primary = members[0]!.host,
      secondary = members.at(-1)!.host;
    kvFault(w, secondary, false);
    kvWrite(w, primary, KV_APP, 'assets', [{ _key: 'new', hostname: 'new01' }]);
    tickWorld(w, 2);
    expect(kvState(w).nodes.find((n) => n.host === secondary)!.appliedRevision).toBe(1);
    expect(() => kvResync(w, secondary)).toThrow();
    kvFault(w, secondary, true);
    expect(kvRead(w, secondary, KV_APP, 'assets')).toHaveLength(2);
    kvResync(w, secondary);
    expect(kvRead(w, secondary, KV_APP, 'assets')).toHaveLength(3);
    for (const n of members.slice(1)) kvFault(w, n.host, false);
    expect(() => kvWrite(w, primary, KV_APP, 'assets', [{ hostname: 'no-quorum' }])).toThrow('majority');
  });
  it('elects a current replica independently of SHC captain and avoids stale primary promotion', () => {
    const w = world('apl'),
      members = kvState(w).nodes.filter((n) => n.domain === 'search-head-cluster');
    const first = members[0]!.host;
    kvWrite(w, first, KV_APP, 'assets', [{ hostname: 'new' }]);
    stopSplunk(w, resolveHost(w, first)!);
    expect(kvStatus(w, members[1]!.host).primary).toBeNull();
    // Restart the authoritative member; replicas can then catch up before failover.
    applyKvRestart(w, first);
    tickWorld(w, 1);
    stopSplunk(w, resolveHost(w, first)!);
    expect(kvStatus(w, members[1]!.host).writable).toBe(true);
  });
  it('backs up, deletes, restores and durably replays data without losing later changes', () => {
    const w = world();
    kvBackup(w, 'sh01', 'baseline');
    kvDelete(w, 'sh01', KV_APP, 'assets', {});
    expect(kvRead(w, 'sh01', KV_APP, 'assets')).toEqual([]);
    kvRestore(w, 'sh01', 'baseline');
    expect(kvRead(w, 'sh01', KV_APP, 'assets')).toHaveLength(2);
    expect(kvState(w).backups).toHaveLength(2);
    kvConfigureCollection(w, 'sh01', KV_APP, 'services', { 'field.name': 'string', enforceTypes: 'true' });
    kvWrite(w, 'sh01', KV_APP, 'services', [{ name: 'api' }]);
    tickWorld(w, 3);
    const r = loadWorld(saveWorld(w), []);
    expect(r.kvstore).toEqual(w.kvstore);
    expect(kvRead(r, 'sh01', KV_APP, 'services')).toHaveLength(1);
  });
  it('REST and simulated curl use the same collection data', () => {
    const w = world(),
      t = testTerm(w);
    t.run('ssh splunk@sh01');
    expect(
      t.run(
        `curl -k https://localhost:8089/servicesNS/nobody/kv_training/storage/collections/config -d name=services -d field.name=string`,
      ),
    ).toContain('services');
    expect(
      t.run(
        `curl -k https://localhost:8089/servicesNS/nobody/kv_training/storage/collections/data/services -H 'Content-Type: application/json' -d '{"name":"api"}'`,
      ),
    ).toContain('saved');
    expect(kvRead(w, 'sh01', KV_APP, 'services')[0]!.name).toBe('api');
    expect(t.run('curl https://example.com:443/')).toContain('simulated');
    expect(() =>
      kvRest(
        w,
        'sh01',
        'GET',
        '/servicesNS/nobody/kv_training/storage/collections/data/services?query=%7B%22%24where%22%3A%22x%22%7D',
      ),
    ).toThrow('equality');
  });
  it('writes KV lookups with overwrite/append and honors lookup definitions', () => {
    const w = world();
    kvStage(
      w,
      'sh01',
      KV_APP,
      'transforms',
      '[service_lookup]\nexternal_type = kvstore\ncollection = services\nfields_list = _key,name\n',
    );
    kvConfigureCollection(w, 'sh01', KV_APP, 'services', { 'field.name': 'string' });
    const result = runSearch(w, {
      search: '| makeresults | eval name="api" | table name | outputlookup service_lookup',
    });
    expect(result.status).toBe('done');
    expect(kvRead(w, 'sh01', KV_APP, 'services')).toHaveLength(1);
    expect(
      runSearch(w, { search: '| inputlookup service_lookup | outputlookup append=true service_lookup' })
        .status,
    ).toBe('done');
    expect(kvRead(w, 'sh01', KV_APP, 'services')).toHaveLength(1);
  });
  it('removes custom definitions and records, protects defaults, and replays the deletion', () => {
    const w = world();
    kvConfigureCollection(w, 'sh01', KV_APP, 'temporary', {});
    kvWrite(w, 'sh01', KV_APP, 'temporary', [{ name: 'test' }]);
    kvDeleteCollection(w, 'sh01', KV_APP, 'temporary');
    expect(kvCollections(w, 'sh01').map((c) => c.collection)).not.toContain('temporary');
    expect(() => kvRead(loadWorld(saveWorld(w), []), 'sh01', KV_APP, 'temporary')).toThrow('not configured');
    expect(() => kvDeleteCollection(w, 'sh01', KV_APP, 'assets')).toThrow('Shipped default');
  });
  it('keeps process/port diagnostics and search logs consistent with service configuration', () => {
    const w = world(),
      t = testTerm(w);
    t.run('ssh splunk@sh01');
    expect(t.run('ps aux')).toContain('mongod');
    expect(t.run('ss -lntp')).toContain(':8191');
    kvFault(w, 'sh01', false);
    expect(t.run('ps aux')).toContain('mongod');
    kvFault(w, 'sh01', true);
    kvStage(w, 'sh01', KV_APP, 'server', '[kvstore]\ndisabled = true\n');
    applyKvRestart(w, 'sh01');
    expect(t.run('ps aux')).not.toContain('mongod');
    expect(t.run('ss -lntp')).not.toContain(':8191');
    tickWorld(w, 1);
    expect(t.run('cat /opt/splunk/var/log/splunk/splunkd.log')).toContain('KVStorePractice');
  });
  it('preserves boolean types through SPL and respects fields_list projection', () => {
    const w = world();
    kvStage(
      w,
      'sh01',
      KV_APP,
      'transforms',
      '[flags_lookup]\nexternal_type = kvstore\ncollection = flags\nfields_list = _key,enabled\n',
    );
    kvConfigureCollection(w, 'sh01', KV_APP, 'flags', { 'field.enabled': 'bool', enforceTypes: 'true' });
    kvWrite(w, 'sh01', KV_APP, 'flags', [{ _key: 'flag', enabled: true, hidden: 'private' }]);
    const r = runSearch(w, { search: '| inputlookup flags_lookup' });
    expect(r.results[0]!.toObject()).not.toHaveProperty('hidden');
    expect(
      runSearch(w, { search: '| inputlookup flags_lookup | outputlookup append=true flags_lookup' }).status,
    ).toBe('done');
    expect(kvRead(w, 'sh01', KV_APP, 'flags')[0]!.enabled).toBe(true);
  });
  it('does not treat incorrect replacement values as a recovered backup', () => {
    const w = world(),
      incident = kvStartIncident(w, 'recovery');
    kvWrite(w, 'sh01', KV_APP, 'assets', [{ _key: 'asset-1' }, { _key: 'asset-2' }]);
    expect(() =>
      kvCloseIncident(w, incident.id, 'I inserted matching IDs without recovering the original values.'),
    ).toThrow('Recovery criteria');
  });
  for (const kind of ['service', 'recovery', 'replication'])
    it(`solves ${kind} incident and rejects premature closure`, () => {
      const w = world(kind === 'replication' ? 'apl' : 'lab');
      const attempt = kvStartIncident(w, kind);
      expect(() => kvCloseIncident(w, attempt.id, 'Detailed cause and verification explanation.')).toThrow(
        'Recovery criteria',
      );
      if (kind === 'service') {
        kvStage(w, attempt.host, KV_APP, 'server', '[kvstore]\ndisabled = false\n');
        applyKvRestart(w, attempt.host);
      }
      if (kind === 'replication') {
        kvFault(w, attempt.host, true);
        kvResync(w, attempt.host);
        tickWorld(w, 1);
      }
      if (kind === 'recovery') kvRestore(w, attempt.host, kvState(w).backups[0]!.name);
      kvCloseIncident(
        w,
        attempt.id,
        'Scoped repair followed by verification of restored records and current revision.',
      );
      expect(attempt.closed).toBeDefined();
      expect(loadWorld(saveWorld(w), []).kvstore).toEqual(w.kvstore);
    });
});
