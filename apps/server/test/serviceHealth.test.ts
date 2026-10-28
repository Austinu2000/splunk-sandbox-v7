import { it, expect } from 'vitest';
import { createWorld, serviceHealthSource, startSplunk, resolveHost, loadWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
it('derives service health through guarded current-source actions and preserves actual dependency impact across save/replay', async () => {
  const store = new SessionStore(':memory:'),
    { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    let v = (await app.inject('/api/service-health')).json();
    const init = { context: v.context, action: 'initialize', infrastructure: true };
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/service-health/action',
          payload: { ...init, principal: 'analyst' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (await app.inject({ method: 'POST', url: '/api/service-health/action', payload: init })).statusCode,
    ).toBe(200);
    v = (await app.inject('/api/service-health')).json();
    const pins = () => ({ context: v.context, revision: v.revision });
    expect(v.evaluations[0].services.find((s: { id: string }) => s.id === 'checkout').dependencyImpact).toBe(
      true,
    );
    const model = JSON.parse(serviceHealthSource(true));
    model.services[0].dependencies = ['checkout'];
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/service-health/action',
          payload: { ...pins(), action: 'stage', source: JSON.stringify(model) },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/service-health/action',
          payload: { ...pins(), action: 'evaluate', source: '{}' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/service-health/action',
          payload: { ...pins(), action: 'evaluate', principal: 'analyst' },
        })
      ).statusCode,
    ).toBe(400);
    startSplunk(live.world, resolveHost(live.world, 'idx02')!);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/service-health/action',
          payload: { ...pins(), action: 'evaluate' },
        })
      ).statusCode,
    ).toBe(400);
    v = (await app.inject('/api/service-health')).json();
    const evaluated = await app.inject({
      method: 'POST',
      url: '/api/service-health/action',
      payload: { ...pins(), action: 'evaluate' },
    });
    expect(evaluated.json().result.services.every((s: { score: number }) => s.score === 100)).toBe(true);
    expect(loadWorld(store.resume()!, []).serviceHealth).toEqual(live.world.serviceHealth);
    v = (await app.inject('/api/service-health')).json();
    await app.inject({ method: 'POST', url: '/api/profiles/apl/load' });
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/service-health/action',
          payload: { ...pins(), action: 'evaluate' },
        })
      ).statusCode,
    ).toBe(400);
  } finally {
    await app.close();
    store.close();
  }
});
