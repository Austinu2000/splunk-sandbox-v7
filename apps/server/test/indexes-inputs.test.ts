import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  setupFoundation,
  saveWorld,
  loadWorld,
} from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
describe('index and input API coherence', () => {
  it('creates empty indexes, ingests real supplied data, rejects denied writes and persists through SQLite snapshots', async () => {
    const w = createWorld(
      profileWorldConfig(
        parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
      ),
    );
    setupFoundation(w, [
      {
        kind: 'file',
        host: 'idx01',
        path: '/opt/splunk/etc/system/local/server.conf',
        text: '[clustering]\nmode=disabled\n',
        apply: true,
      },
    ]);
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(w, { store, aiGrader: null });
    try {
      const post = (url: string, payload: object) => app.inject({ method: 'POST', url, payload });
      const before = saveWorld(w);
      expect(
        (
          await post('/api/indexes', {
            host: 'idx01',
            name: 'application_logs',
            settings: {},
            create: true,
            principal: 'analyst',
          })
        ).statusCode,
      ).toBe(400);
      expect(saveWorld(w)).toEqual(before);
      expect(
        (await post('/api/indexes', { host: 'idx02', name: 'application_logs', settings: {}, create: true }))
          .statusCode,
      ).toBe(400);
      expect(
        (await post('/api/indexes', { host: 'idx01', name: 'application_logs', settings: {}, create: true }))
          .statusCode,
      ).toBe(200);
      const catalog = (await app.inject('/api/indexes?host=idx01')).json();
      expect(
        catalog.indexes.find((i: { name: string }) => i.name === 'application_logs').currentDBSizeMB,
      ).toBe(0);
      expect(
        (
          await post('/api/inputs/monitor', {
            host: 'idx01',
            path: '/var/log/practice/api.log',
            index: 'application_logs',
            sourcetype: 'api_training',
            content: 'status=500\nstatus=200\n',
          })
        ).json().ingested,
      ).toBe(2);
      const search = await post('/api/search/jobs', { search: 'index=application_logs | stats count' });
      expect(search.json().results.items[0].count).toBe(2);
      const restricted = await app.inject({
        method: 'POST',
        url: '/api/search/jobs',
        headers: { 'x-sandbox-principal': 'analyst' },
        payload: { search: 'index=application_logs | stats count' },
      });
      expect(restricted.json().results.items[0].count).toBe(0);
      const token = (
        await post('/api/inputs/hec', {
          host: 'idx01',
          name: 'api',
          index: 'application_logs',
          sourcetype: 'api_training',
        })
      ).json().token;
      expect(
        (await post('/api/inputs/hec/event', { host: 'idx01', token, event: 'status=201' })).statusCode,
      ).toBe(200);
      expect(
        (await post('/api/inputs/hec/event', { host: 'idx01', token: 'invalid', event: 'status=201' }))
          .statusCode,
      ).toBe(400);
      expect((await app.inject('/api/indexes/buckets?host=idx01')).json().buckets.length).toBe(2);
      expect(
        (await app.inject('/api/inputs?host=idx01'))
          .json()
          .inputs.find((i: { stanza: string }) => i.stanza === 'http://api').settings.token,
      ).toBe('[redacted]');
      expect(
        (
          await app.inject({
            method: 'DELETE',
            url: '/api/indexes',
            payload: { host: 'idx01', name: 'application_logs' },
          })
        ).statusCode,
      ).toBe(400);
      expect(loadWorld(saveWorld(live.world), []).ingestion?.events).toHaveLength(3);
      store.checkpoint(live.world);
      expect(loadWorld(store.autosave('lab')!, []).ingestion?.events).toHaveLength(3);
    } finally {
      await app.close();
      store.close();
    }
  });
});
