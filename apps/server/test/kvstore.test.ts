import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { createWorld, loadWorld, kvRead, KV_APP } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
describe('V6 KV API and durable lessons', () => {
  it('validates requests, persists records through SQLite reopen and keeps profiles isolated', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'v6-kv-')),
      path = join(dir, 'sessions.db');
    let store = new SessionStore(path);
    const { app } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
      expect((await app.inject('/api/kvstore?host=missing')).statusCode).toBe(400);
      const action = async (payload: Record<string, unknown>) => {
        const v = (await app.inject('/api/kvstore?host=sh01')).json();
        return app.inject({
          method: 'POST',
          url: '/api/kvstore/action',
          payload: { host: 'sh01', context: v.context, revision: v.revision, ...payload },
        });
      };
      expect(
        (
          await action({
            action: 'write',
            records: [{ _key: 'retained', hostname: 'api01', criticality: 4 }],
          })
        ).statusCode,
      ).toBe(200);
      expect((await action({ action: 'backup', name: 'api-backup' })).json()).toEqual({
        archive: 'api-backup',
      });
      expect((await action({ action: 'restore', name: 'api-backup' })).json()).toEqual({ ok: true });
      expect((await action({ action: 'write', records: [{ criticality: 'wrong' }] })).statusCode).toBe(400);
      expect(
        (await action({ action: 'stage', name: 'server', text: '[general]\nserverName = no' })).statusCode,
      ).toBe(400);
      await app.inject({ method: 'POST', url: '/api/profiles/apl/load' });
      expect((await action({ action: 'read' })).json()).toHaveLength(2);
      await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
      expect((await action({ action: 'read' })).json()).toHaveLength(3);
      await app.close();
      store.close();
      store = new SessionStore(path);
      const reopened = loadWorld(store.resume()!, []);
      expect(kvRead(reopened, 'sh01', KV_APP, 'assets', { _key: 'retained' })).toHaveLength(1);
    } finally {
      await app.close();
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('grades collection schema and data, resumes learner progress, and initializes all recovery fixtures', async () => {
    const store = new SessionStore(':memory:');
    const { app } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      const start = (id: string) =>
        app.inject({ method: 'POST', url: '/api/learn/start', payload: { id, learner: 'KV test' } });
      const action = async (payload: Record<string, unknown>) => {
        const v = (await app.inject('/api/kvstore?host=sh01')).json();
        return app.inject({
          method: 'POST',
          url: '/api/kvstore/action',
          payload: { host: 'sh01', context: v.context, revision: v.revision, ...payload },
        });
      };
      const progress = async () => (await app.inject('/api/learn')).json().progress;
      expect((await start('K1')).statusCode).toBe(200);
      expect((await progress()).completed).toBe(false);
      await action({ action: 'collection', collection: 'services', settings: {} });
      await action({ action: 'write', collection: 'services', records: [{ name: 'api' }, { name: 'web' }] });
      await action({ action: 'inspect' });
      expect((await progress()).completed).toBe(false);
      await action({
        action: 'collection',
        collection: 'services',
        settings: { 'field.name': 'string', 'field.owner': 'string', enforceTypes: 'true' },
      });
      expect((await progress()).completed).toBe(true);
      for (const id of ['K2', 'K3', 'K4']) {
        expect((await start(id)).statusCode).toBe(200);
        const view = (await app.inject('/api/kvstore')).json();
        expect(view.incidents).toHaveLength(1);
        expect((await progress()).completed).toBe(false);
      }
      await start('K1');
      expect((await progress()).completed).toBe(true);
    } finally {
      await app.close();
      store.close();
    }
  });
});

describe('V7 KV editor revision guards', () => {
  it('rejects stale data revisions and a form retained across an environment swap', async () => {
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      const old = (await app.inject('/api/kvstore')).json(),
        payload = {
          host: old.host,
          context: old.context,
          revision: old.revision,
          action: 'write',
          records: [{ _key: 'guarded', hostname: 'guarded01', criticality: 2 }],
        };
      expect((await app.inject({ method: 'POST', url: '/api/kvstore/action', payload })).statusCode).toBe(
        200,
      );
      const retained = store.autosave('default')!;
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/kvstore/action',
            payload: { ...payload, records: [{ _key: 'stale', hostname: 'stale01' }] },
          })
        ).statusCode,
      ).toBe(400);
      live.swap(loadWorld(retained, []));
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/kvstore/action',
            payload: { ...payload, action: 'restore', name: 'old' },
          })
        ).statusCode,
      ).toBe(400);
      expect(kvRead(live.world, old.host, KV_APP, 'assets', { _key: 'stale' })).toHaveLength(0);
    } finally {
      await app.close();
      store.close();
    }
  });
});
