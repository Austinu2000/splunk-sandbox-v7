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
const fresh = () => {
  const w = createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
  setupFoundation(
    w,
    JSON.parse(readFileSync(new URL('../../../lessons/v7/SP-035.json', import.meta.url), 'utf8')).setup,
  );
  return w;
};
describe('report API and attempt safety', () => {
  it('shares saved-report configuration, real results and inspector evidence, then rejects a stale attempt context', async () => {
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(fresh(), { store, aiGrader: null });
    try {
      const post = (url: string, payload: object) => app.inject({ method: 'POST', url, payload });
      const view = (await app.inject('/api/reports?host=')).json();
      expect(view.host).toBe('sh01');
      const input = {
        context: view.context,
        host: view.host,
        app: 'search',
        owner: 'admin',
        sharing: 'Private',
        title: 'API report',
        search: 'index=source_logs | stats count by status',
        earliest: '-15m',
        latest: 'now',
        enabled: true,
        scheduled: false,
        create: true,
      };
      const saved = await post('/api/reports', input);
      expect(saved.statusCode).toBe(200);
      expect(saved.json().sourcePath).toContain('/users/admin/search/local/savedsearches.conf');
      const result = await post('/api/reports/run', { context: view.context, id: saved.json().id });
      expect(result.json()).toMatchObject({ status: 'succeeded', resultCount: 2 });
      const search = await post('/api/search/jobs', { search: 'index=source_logs | stats count' }),
        sid = search.json().job.sid;
      expect(
        (await post('/api/search/jobs/' + encodeURIComponent(sid) + '/inspect', {})).json().workUnits,
      ).toBeGreaterThan(0);
      expect(live.world.searchEvidence!.find((j) => j.id === sid)!.inspected).toBe(true);
      const all = (await app.inject('/api/reports')).json();
      expect(all.runs).toHaveLength(1);
      const query = await post('/api/search/jobs', {
        search: '| rest /services/saved/searches | search title="API report"',
      });
      expect(query.json().results.items).toHaveLength(1);
      expect((await post('/api/reports/advance', { context: view.context })).json().now).toBe(
        live.world.config.startTime + 60000,
      );
      store.checkpoint(live.world);
      expect(loadWorld(store.autosave('lab')!, []).reports).toEqual(live.world.reports);
      live.swap(loadWorld(saveWorld(live.world), []));
      const before = saveWorld(live.world);
      expect((await post('/api/reports', { ...input, title: 'Stale tab write' })).statusCode).toBe(400);
      expect((await post('/api/reports/advance', { context: view.context })).statusCode).toBe(400);
      expect(saveWorld(live.world)).toEqual(before);
      expect((await post('/api/search/jobs/' + encodeURIComponent(sid) + '/inspect', {})).statusCode).toBe(
        404,
      );
    } finally {
      await app.close();
      store.close();
    }
  });
  it('preserves multiline report SPL safely and does not activate legacy schedules during reviewed import', async () => {
    const world = fresh();
    world.uiState = {
      'splunk-sandbox-v3-knowledge-v1': JSON.stringify({
        objects: [
          {
            id: 'old',
            kind: 'report',
            title: 'Old report',
            description: 'kept',
            owner: 'admin',
            app: 'search',
            sharing: 'Private',
            search: 'index=source_logs | stats count',
            earliest: '-15m',
            latest: 'now',
            enabled: true,
            type: 'Classic',
            panels: [],
            updated: 'before',
            schedule: '* * * * *',
          },
        ],
      }),
    };
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(world, { store, aiGrader: null });
    try {
      const context = (await app.inject('/api/reports')).json().context;
      const payload = {
        context,
        host: 'sh01',
        app: 'search',
        owner: 'admin',
        sharing: 'Private',
        title: 'Multiline',
        search: 'index=source_logs\n| stats count',
        description: 'Two\nlines',
        earliest: '-15m',
        latest: 'now',
        create: true,
      };
      const saved = await app.inject({ method: 'POST', url: '/api/reports', payload });
      expect(saved.statusCode).toBe(200);
      expect(saved.json().search).toBe(payload.search);
      const changed = await app.inject({
        method: 'POST',
        url: '/api/reports',
        payload: {
          ...payload,
          create: false,
          search: 'index=source_logs\n| stats count by status',
          revision: saved.json().revision,
        },
      });
      expect(changed.statusCode).toBe(200);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/reports/run',
            payload: { context, id: changed.json().id },
          })
        ).json().resultCount,
      ).toBe(2);
      const raw = live.world.uiState!['splunk-sandbox-v3-knowledge-v1'];
      const old = (await app.inject('/api/reports/legacy')).json();
      expect(old.reports[0].imported).toBe(false);
      const imported = await app.inject({
        method: 'POST',
        url: '/api/reports/import',
        payload: {
          context,
          sourceId: 'old',
          host: 'sh01',
          app: 'search',
          owner: 'admin',
          sharing: 'Private',
        },
      });
      expect(imported.statusCode).toBe(200);
      const view = (await app.inject('/api/reports')).json();
      expect(view.reports.find((r: { title: string }) => r.title === 'Old report').scheduled).toBe(false);
      expect(live.world.uiState!['splunk-sandbox-v3-knowledge-v1']).toBe(raw);
      expect(store.list().some((s) => s.name === 'Before importing legacy report old')).toBe(true);
    } finally {
      await app.close();
      store.close();
    }
  });
});
