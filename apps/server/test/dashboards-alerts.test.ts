import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  setupFoundation,
  classicSource,
  saveWorld,
  loadWorld,
} from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
function fresh() {
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
}
describe('dashboard and alert API persistence and stale-form safety', () => {
  it('renders actual data, enforces scoped edits, persists SQLite receipts and rejects a swapped-world form', async () => {
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(fresh(), { store, aiGrader: null });
    try {
      const post = (url: string, payload: object) => app.inject({ method: 'POST', url, payload }),
        view = (await app.inject('/api/dashboards')).json();
      const source = classicSource(
        'API dashboard',
        '',
        [],
        [
          {
            id: 'count',
            title: 'Events',
            type: 'single',
            search: 'index=source_logs | stats count',
            earliest: '-15m',
            latest: 'now',
          },
        ],
      );
      const payload = {
        context: view.context,
        host: 'sh01',
        app: 'search',
        owner: 'admin',
        sharing: 'Private',
        name: 'api_dashboard',
        format: 'classic',
        source,
        create: true,
      };
      const saved = await post('/api/dashboards', payload);
      expect(saved.statusCode, saved.body).toBe(200);
      const d = saved.json();
      const render = await post('/api/dashboards/render', {
        context: view.context,
        id: d.id,
        revision: d.revision,
      });
      expect(render.statusCode, render.body).toBe(200);
      expect(render.json().panels[0]).toMatchObject({ status: 'done', rows: [{ count: 3 }] });
      expect(
        (
          await post('/api/dashboards', {
            ...payload,
            id: d.id,
            revision: d.revision,
            create: false,
            principal: 'analyst',
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (await post('/api/dashboards', { ...payload, id: d.id, revision: 'stale', create: false }))
          .statusCode,
      ).toBe(400);
      const before = saveWorld(live.world);
      live.swap(loadWorld(before, []));
      expect((await post('/api/dashboards', { ...payload, name: 'stale_tab' })).statusCode).toBe(400);
      expect(saveWorld(live.world)).toEqual(before);
      const loaded = loadWorld(store.autosave('lab')!, []);
      expect(loaded.dashboards?.renders[0]?.panels[0]?.rows).toEqual([{ count: 3 }]);
    } finally {
      await app.close();
      store.close();
    }
  });
  it('runs a scheduled alert from its actual results and exposes local notifications with suppression evidence', async () => {
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(fresh(), { store, aiGrader: null });
    try {
      const post = (url: string, payload: object) => app.inject({ method: 'POST', url, payload }),
        view = (await app.inject('/api/reports')).json();
      const payload = {
        context: view.context,
        host: 'sh01',
        app: 'search',
        owner: 'admin',
        sharing: 'Private',
        title: 'API scheduled alert',
        search: 'index=source_logs status=500 | stats count',
        earliest: '-15m',
        latest: 'now',
        scheduled: true,
        cron: '* * * * *',
        create: true,
        alert: {
          type: 'custom',
          condition: 'search count > 1',
          relation: 'greater than',
          threshold: 0,
          digest: true,
          suppress: true,
          period: '5m',
          fields: [],
          track: true,
          severity: 4,
          actions: ['notification'],
        },
      };
      expect((await post('/api/reports', payload)).statusCode).toBe(200);
      await post('/api/reports/advance', { context: view.context });
      await post('/api/reports/advance', { context: view.context });
      const all = (await app.inject('/api/reports')).json();
      expect(all.notifications).toHaveLength(1);
      expect(all.runs.at(-1).alert).toMatchObject({ triggered: 0, suppressed: 1 });
      expect(
        (
          await post('/api/reports', {
            ...payload,
            title: 'Unsupported action',
            alert: { ...payload.alert, actions: ['webhook'] },
          })
        ).statusCode,
      ).toBe(400);
      expect(loadWorld(store.autosave('lab')!, []).reports).toEqual(live.world.reports);
    } finally {
      await app.close();
      store.close();
    }
  });
});
