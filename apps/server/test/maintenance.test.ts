import { hostFs } from '../../../packages/sim/src/vfs/build';
import { ROOT } from '../../../packages/sim/src/vfs/vfs';
import { it, expect } from 'vitest';
import { createWorld, loadWorld, resolveHost, restartSplunk } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
it('keeps maintenance review passive, rejects stale/unauthorized actions and persists a real standalone upgrade', async () => {
  const store = new SessionStore(':memory:'),
    { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    const get = async () => (await app.inject('/api/maintenance')).json();
    let v = await get();
    expect(v.state).toBeNull();
    expect(live.world.maintenance).toBeUndefined();
    expect(live.world.kvstore).toBeUndefined();
    const send = async (
      action: string,
      fields: Record<string, unknown>,
      override: Record<string, unknown> = {},
    ) =>
      app.inject({
        method: 'POST',
        url: '/api/maintenance/action',
        payload: { context: v.context, revision: v.revision, action, ...fields, ...override },
      });
    for (const override of [
      { principal: 'analyst' },
      { context: 'stale' },
      { revision: 'stale' },
      { targets: ['hf01'] },
    ])
      expect((await send('stage-package', { host: 'hf01' }, override)).statusCode).toBe(400);
    expect((await send('stage-package', { host: 'hf01' })).statusCode).toBe(200);
    expect((await send('backup', { host: 'hf01', name: 'before' })).statusCode).toBe(400);
    v = await get();
    expect((await send('backup', { host: 'hf01', name: 'before' })).statusCode).toBe(200);
    v = await get();
    const b = v.state.backups[0];
    expect((await send('verify', { host: 'hf01', id: b.id })).statusCode).toBe(200);
    v = await get();
    expect((await send('preflight', { targets: ['hf01'] })).statusCode).toBe(200);
    v = await get();
    const f = v.state.preflights.at(-1);
    expect(f.valid).toBe(true);
    expect((await send('queue', { id: f.id, acceptTrainingLicense: false })).statusCode).toBe(400);
    expect((await send('queue', { id: f.id, acceptTrainingLicense: true })).statusCode).toBe(200);
    for (let i = 0; i < 5; i++) {
      v = await get();
      expect((await send('advance', { id: v.state.jobs.at(-1).id })).statusCode).toBe(200);
    }
    v = await get();
    expect(v.hosts.find((p: { host: string }) => p.host === 'hf01').version).toBe('9.4.2');
    expect(v.state.jobs.at(-1).status).toBe('completed');
    expect((await send('restore', { host: 'hf01', id: b.id })).statusCode).toBe(400);
    // Persist actual phase/version changes through the normal server action checkpoint.
    expect((await send('backup', { host: 'hf01', name: 'after' })).statusCode).toBe(200);
    expect(loadWorld(store.resume()!, []).maintenance).toEqual(live.world.maintenance);
    const old = v;
    await app.inject({ method: 'POST', url: '/api/profiles/apl/load' });
    expect(
      (await send('stage-package', { host: 'hf01' }, { context: old.context, revision: old.revision }))
        .statusCode,
    ).toBe(400);
    expect(live.world.maintenance).toBeUndefined();
  } finally {
    await app.close();
    store.close();
  }
});

it('checks administrative scope on every selected maintenance target', async () => {
  const { app, live } = buildApp(createWorld({ fleetSize: 50 }), { aiGrader: null });
  try {
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    const p = resolveHost(live.world, 'ds01')!,
      fs = hostFs(live.world, p);
    fs.writeFile(
      '/opt/splunk/etc/system/local/authorize.conf',
      '[role_admin]\nindexes_edit=disabled\n',
      ROOT,
    );
    restartSplunk(live.world, p);
    const v = (await app.inject('/api/maintenance')).json();
    const r = await app.inject({
      method: 'POST',
      url: '/api/maintenance/action',
      payload: { context: v.context, revision: v.revision, action: 'preflight', targets: ['hf01', 'ds01'] },
    });
    expect(r.statusCode).toBe(400);
    expect(r.json().error).toContain('Permission denied');
    expect(live.world.maintenance).toBeUndefined();
  } finally {
    await app.close();
  }
});
