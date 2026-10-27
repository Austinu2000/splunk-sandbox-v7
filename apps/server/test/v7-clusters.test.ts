import { describe, it, expect } from 'vitest';
import { createWorld, loadWorld, shcHealth, clusterSourceRevision } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';

describe('V7 coordinated operations API', () => {
  it('pins manager drafts, guards principals and environment swaps, and checkpoints queued phases', async () => {
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
      const view = async () => (await app.inject('/api/clusters')).json();
      let v = await view();
      const action = (payload: Record<string, unknown>) =>
        app.inject({
          method: 'POST',
          url: '/api/clusters/action',
          payload: { context: v.context, ...payload },
        });
      expect((await action({ action: 'enable', principal: 'analyst' })).statusCode).toBe(400);
      expect((await action({ action: 'enable' })).statusCode).toBe(200);
      v = await view();
      const revision = v.managerRevision;
      const stage = {
        action: 'stage-bundle',
        revision,
        path: '_cluster/local/v7_api.conf',
        text: '[api]\nvalue=reviewed\n',
      };
      expect((await action(stage)).statusCode).toBe(200);
      expect((await action({ ...stage, text: '[api]\nvalue=stale\n' })).statusCode).toBe(400);
      v = await view();
      expect((await action({ action: 'publish', revision: v.managerRevision })).statusCode).toBe(400);
      expect((await action({ action: 'validate', revision: v.managerRevision })).statusCode).toBe(200);
      expect((await action({ action: 'publish', revision: v.managerRevision })).statusCode).toBe(200);
      expect((await action({ action: 'advance', settings: { mode: 'peer' } })).statusCode).toBe(400);
      await action({ action: 'advance' });
      await action({ action: 'advance' });
      const saved = store.autosave('profile:lab') ?? store.resume();
      expect(saved).toBeTruthy();
      const retained = loadWorld(saved!, []);
      expect(retained.clusterManagement?.jobs.at(-1)?.phase).toBe('stopped');
      live.swap(retained);
      expect((await action({ action: 'maintenance', enabled: true })).statusCode).toBe(400);
      v = await view();
      for (let i = 0; i < 14; i++) expect((await action({ action: 'advance' })).statusCode).toBe(200);
      v = await view();
      expect(v.state.jobs.at(-1).status).toBe('completed');
      expect(v.health.members.every((m: { running: boolean }) => m.running)).toBe(true);
    } finally {
      await app.close();
      store.close();
    }
  });
  it('shares SHC services and elections while refusing stale source and unsupported fields', async () => {
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      await app.inject({ method: 'POST', url: '/api/profiles/apl/load' });
      let v = (await app.inject('/api/shc')).json();
      const action = (payload: Record<string, unknown>) =>
        app.inject({ method: 'POST', url: '/api/shc/action', payload: { context: v.context, ...payload } });
      expect((await action({ action: 'enable', principal: 'operator' })).statusCode).toBe(400);
      expect((await action({ action: 'enable' })).statusCode).toBe(200);
      await action({ action: 'advance' });
      v = (await app.inject('/api/shc')).json();
      expect(v.health.captain).toBe('sh01');
      const before = clusterSourceRevision(live.world, 'sh01');
      expect(
        (
          await action({
            action: 'service',
            host: 'sh01',
            revision: before,
            operation: 'stop',
            settings: { disabled: 'true' },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (await action({ action: 'service', host: 'sh01', revision: before, operation: 'stop' })).statusCode,
      ).toBe(200);
      await action({ action: 'advance' });
      expect(shcHealth(live.world).captain).toBe('sh02');
      expect(
        (
          await action({
            action: 'stage-member',
            host: 'sh03',
            revision: 'stale',
            settings: { replication_port: '8181' },
          })
        ).statusCode,
      ).toBe(400);
      expect(
        (
          await action({
            action: 'service',
            host: 'sh01',
            revision: clusterSourceRevision(live.world, 'sh01'),
            operation: 'start',
          })
        ).statusCode,
      ).toBe(200);
      await action({ action: 'advance' });
      v = (await app.inject('/api/shc')).json();
      expect(v.health.captain).toBe('sh02');
      expect(v.kv[0].primary).toBe('sh01');
    } finally {
      await app.close();
      store.close();
    }
  });
});

it('loads the optional Enterprise Automation Lab without changing or replacing the original Lab save', async () => {
  const store = new SessionStore(':memory:'),
    { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    const original = live.world.config;
    expect(
      (await app.inject({ method: 'POST', url: '/api/profiles/enterprise_lab_v1/load' })).statusCode,
    ).toBe(200);
    expect(live.world.infra.filter((n) => n.role === 'indexer' && !n.retired)).toHaveLength(6);
    expect(shcHealth(live.world).members).toHaveLength(3);
    expect(live.world.git?.checkouts.some((c) => c.host === 'ansible01')).toBe(true);
    const v = (await app.inject('/api/clusters')).json();
    expect(v.health.members.filter((m: { nativeSite: string }) => m.nativeSite === 'site2')).toHaveLength(3);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/clusters/action',
          payload: { context: v.context, action: 'enable' },
        })
      ).statusCode,
    ).toBe(200);
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    expect(live.world.config).toEqual(original);
    expect(live.world.clusterManagement).toBeUndefined();
  } finally {
    await app.close();
    store.close();
  }
});

it('returns from a Lab exercise to the separately saved launching environment, including resumed attempts', async () => {
  const store = new SessionStore(':memory:'),
    { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    const post = (url: string, payload?: unknown) =>
      app.inject({ method: 'POST', url, ...(payload ? { payload } : {}) });
    await post('/api/profiles/enterprise_lab_v1/load');
    live.world.uiState = { marker: 'enterprise-origin' };
    store.checkpoint(live.world);
    expect((await post('/api/learn/start', { id: 'SP-060', learner: 'Return boundary' })).statusCode).toBe(
      200,
    );
    expect(live.world.config.profileId).toBe('lab');
    expect((await post('/api/learn/leave')).statusCode).toBe(200);
    expect(live.world.config.profileId).toBe('enterprise_lab_v1');
    expect(live.world.uiState.marker).toBe('enterprise-origin');
    await post('/api/profiles/apl/load');
    await post('/api/learn/start', { id: 'SP-060', learner: 'Return boundary' });
    expect(live.world.lesson?.returnProfile).toBe('apl');
    const persisted = loadWorld(store.resume()!, []);
    live.swap(persisted);
    await post('/api/learn/leave');
    expect(live.world.config.profileId).toBe('apl');
  } finally {
    await app.close();
    store.close();
  }
});
