import { it, expect } from 'vitest';
import {
  createWorld,
  setupFoundation,
  tickWorld,
  ingestText,
  saveReport,
  executeReport,
  RESPONSE_ADAPTER_SOURCE,
  loadWorld,
} from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
it('guards security scope, stale revisions, action fields and practice privileges while persisting response evidence', async () => {
  const store = new SessionStore(':memory:'),
    { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    tickWorld(live.world, 1);
    setupFoundation(live.world, [
      {
        kind: 'file',
        host: 'idx01',
        path: '/opt/splunk/etc/system/local/indexes.conf',
        text: '[notable]\nhomePath=$SPLUNK_DB/notable/db\n',
        apply: true,
      },
    ]);
    ingestText(
      live.world,
      'idx01',
      '/var/log/practice/api-detection.log',
      'v7_api_security',
      'os',
      'user=alice action=failure\n',
    );
    const r = saveReport(
      live.world,
      {
        host: 'sh01',
        app: 'search',
        owner: 'admin',
        sharing: 'App',
        title: 'API authentication detection',
        search: 'index=os sourcetype=v7_api_security',
        alert: {
          type: 'number of events',
          relation: 'greater than',
          threshold: 0,
          condition: '',
          digest: true,
          suppress: false,
          period: '0',
          fields: [],
          track: true,
          severity: 4,
          actions: ['notable'],
        },
      },
      { create: true },
    );
    expect(executeReport(live.world, r.id).status).toBe('succeeded');
    let view = (await app.inject('/api/security')).json();
    expect(view.notables).toHaveLength(1);
    expect((await app.inject('/api/security?principal=analyst')).json().notables).toEqual([]);
    const pins = () => ({ context: view.context, host: view.host, revision: view.revision });
    const source = { ...pins(), action: 'stage-response', source: RESPONSE_ADAPTER_SOURCE };
    for (const payload of [
      { ...source, context: 'stale' },
      { ...source, principal: 'analyst' },
      { ...source, id: view.notables[0].id },
      { ...source, source: RESPONSE_ADAPTER_SOURCE + 'password: no\n' },
    ])
      expect((await app.inject({ method: 'POST', url: '/api/security/action', payload })).statusCode).toBe(
        400,
      );
    expect(
      (await app.inject({ method: 'POST', url: '/api/security/action', payload: source })).statusCode,
    ).toBe(200);
    expect(
      (await app.inject({ method: 'POST', url: '/api/security/action', payload: source })).statusCode,
    ).toBe(400);
    view = (await app.inject('/api/security')).json();
    const id = view.notables[0].id;
    const result = await app.inject({
      method: 'POST',
      url: '/api/security/action',
      payload: { ...pins(), action: 'respond', id },
    });
    expect(result.json().result.status).toBe('created');
    view = (await app.inject('/api/security')).json();
    const retry = await app.inject({
      method: 'POST',
      url: '/api/security/action',
      payload: { ...pins(), action: 'respond', id },
    });
    expect(retry.json().result.status).toBe('existing');
    expect(live.world.security!.tickets).toHaveLength(1);
    const saved = store.save(live.world, 'Security evidence', 'manual', Date.now());
    expect(loadWorld(store.get(saved)!, []).security).toEqual(live.world.security);
    view = (await app.inject('/api/security')).json();
    await app.inject({ method: 'POST', url: '/api/profiles/apl/load' });
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/security/action',
          payload: { ...pins(), action: 'respond', id },
        })
      ).statusCode,
    ).toBe(400);
    expect(live.world.security).toBeUndefined();
  } finally {
    await app.close();
    store.close();
  }
});
