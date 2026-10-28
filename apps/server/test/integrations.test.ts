import { it, expect } from 'vitest';
import { createWorld, AWS_POLICY_SOURCE, loadWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
it('guards offline adapter actions by context/source/privilege and checkpoints actual pending and delivered records', async () => {
  const store = new SessionStore(':memory:'),
    { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    let v = (await app.inject('/api/integrations?kind=aws')).json();
    expect(v.initialized).toBe(false);
    const init = { context: v.context, kind: 'aws', action: 'initialize' };
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/integrations/action',
          payload: { ...init, principal: 'analyst' },
        })
      ).statusCode,
    ).toBe(400);
    expect(
      (await app.inject({ method: 'POST', url: '/api/integrations/action', payload: init })).statusCode,
    ).toBe(200);
    v = (await app.inject('/api/integrations?kind=aws')).json();
    const pins = () => ({ context: v.context, kind: v.kind, revision: v.revision });
    const denied = await app.inject({
      method: 'POST',
      url: '/api/integrations/action',
      payload: { ...pins(), action: 'poll' },
    });
    expect(denied.json().result.at(-1).error).toContain('s3:GetObject');
    v = (await app.inject('/api/integrations?kind=aws')).json();
    const source = { ...pins(), action: 'stage', sourceName: 'awsPolicy', source: AWS_POLICY_SOURCE };
    for (const payload of [
      { ...source, principal: 'analyst' },
      { ...source, context: 'stale' },
      { ...source, row: { id: 4, service: 'invalid', status: 200 } },
      { ...source, sourceName: 'otel' },
    ])
      expect(
        (await app.inject({ method: 'POST', url: '/api/integrations/action', payload })).statusCode,
      ).toBe(400);
    expect(
      (await app.inject({ method: 'POST', url: '/api/integrations/action', payload: source })).statusCode,
    ).toBe(200);
    expect(
      (await app.inject({ method: 'POST', url: '/api/integrations/action', payload: source })).statusCode,
    ).toBe(400);
    v = (await app.inject('/api/integrations?kind=aws')).json();
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/integrations/action',
          payload: { ...pins(), action: 'poll' },
        })
      ).statusCode,
    ).toBe(200);
    expect(live.world.ingestion!.events).toHaveLength(3);
    expect(live.world.integrations!.aws!.messages.every((m) => m.acknowledged)).toBe(true);
    expect(loadWorld(store.resume()!, []).integrations).toEqual(live.world.integrations);
    v = (await app.inject('/api/integrations?kind=aws')).json();
    await app.inject({ method: 'POST', url: '/api/profiles/apl/load' });
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/integrations/action',
          payload: { ...pins(), action: 'poll' },
        })
      ).statusCode,
    ).toBe(400);
    expect(live.world.integrations).toBeUndefined();
  } finally {
    await app.close();
    store.close();
  }
});
