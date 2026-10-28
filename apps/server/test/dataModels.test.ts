import { describe, it, expect } from 'vitest';
import {
  createWorld,
  resolveHost,
  restartSplunk,
  ingestText,
  tickWorld,
  runSearch,
  loadWorld,
} from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';

describe('bounded native data model administration', () => {
  it('stages source without activation, builds actual rows after restart, and guards stale context/revision/privilege', async () => {
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
      tickWorld(live.world, 1);
      ingestText(
        live.world,
        'idx01',
        '/var/log/practice/api-model.log',
        'v7_model_api',
        'os',
        'service=checkout status=500\nservice=auth status=200\n',
      );
      let view = (await app.inject('/api/data-models?host=')).json();
      expect(view.host).toBe('sh01');
      const source = JSON.stringify({
          modelName: 'ApiModel',
          objects: [
            {
              objectName: 'Events',
              parentName: 'BaseEvent',
              constraints: [{ search: 'index=os sourcetype=v7_model_api' }],
              fields: [
                { fieldName: 'service', type: 'string' },
                { fieldName: 'status', type: 'number' },
              ],
            },
          ],
        }),
        payload = {
          context: view.context,
          host: view.host,
          revision: view.revision,
          action: 'stage',
          app: 'v7_cim',
          source,
          enabled: true,
          earliest: '-15m',
        };
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/data-models/action',
            payload: { ...payload, principal: 'analyst' },
          })
        ).statusCode,
      ).toBe(400);
      for (const invalid of [
        'null',
        JSON.stringify({ modelName: 'Bad', objects: [null] }),
        JSON.stringify({
          modelName: 'Bad',
          objects: [{ objectName: 'Root', parentName: 'BaseEvent', constraints: [null], fields: [] }],
        }),
      ])
        expect(
          (
            await app.inject({
              method: 'POST',
              url: '/api/data-models/action',
              payload: { ...payload, source: invalid },
            })
          ).statusCode,
        ).toBe(400);
      expect((await app.inject({ method: 'POST', url: '/api/data-models/action', payload })).statusCode).toBe(
        200,
      );
      expect((await app.inject('/api/data-models')).json().models).toEqual([]);
      expect((await app.inject({ method: 'POST', url: '/api/data-models/action', payload })).statusCode).toBe(
        400,
      );
      restartSplunk(live.world, resolveHost(live.world, 'sh01')!);
      view = (await app.inject('/api/data-models')).json();
      expect(view.models[0].enabled).toBe(true);
      const build = {
        context: view.context,
        host: view.host,
        revision: view.revision,
        action: 'build',
        model: 'ApiModel',
      };
      expect(
        (await app.inject({ method: 'POST', url: '/api/data-models/action', payload: build })).statusCode,
      ).toBe(200);
      expect(
        runSearch(live.world, {
          search: '| tstats summariesonly=true count from datamodel=ApiModel.Events',
        }).results[0]?.get('count'),
      ).toBe(2);
      live.swap(loadWorld(store.resume()!, []));
      expect(
        (await app.inject({ method: 'POST', url: '/api/data-models/action', payload: build })).statusCode,
      ).toBe(400);
    } finally {
      await app.close();
      store.close();
    }
  });
});

it('dispatches Search on its selected host and requires a current world context for write-capable SPL', async () => {
  const store = new SessionStore(':memory:'),
    { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    tickWorld(live.world, 1);
    const scope = (await app.inject('/api/search/context')).json();
    const read = await app.inject({
      method: 'POST',
      url: '/api/search/jobs',
      payload: { host: 'sh01', context: scope.context, search: '| makeresults | eval checked=1' },
    });
    expect(read.json().job.host).toBe('sh01');
    const count = live.world.ingestion?.events.length ?? 0,
      write = '| makeresults | eval result=1 | collect index=os';
    const missing = await app.inject({ method: 'POST', url: '/api/search/jobs', payload: { search: write } });
    expect(missing.json().job.status).toBe('failed');
    expect(live.world.ingestion?.events.length ?? 0).toBe(count);
    const old = store.resume()!;
    live.swap(loadWorld(old, []));
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/search/jobs',
          payload: { context: scope.context, host: 'sh01', search: write },
        })
      ).statusCode,
    ).toBe(400);
    expect(live.world.ingestion?.events.length ?? 0).toBe(count);
    const current = (await app.inject('/api/search/context')).json();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/search/jobs',
          payload: { context: current.context, host: 'sh01', search: write },
        })
      ).json().job.status,
    ).toBe('done');
    expect(live.world.ingestion?.events.length).toBe(count + 1);
  } finally {
    await app.close();
    store.close();
  }
});
