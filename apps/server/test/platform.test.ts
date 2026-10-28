import { describe, it, expect } from 'vitest';
import { createWorld, stopSplunk, resolveHost, loadWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
describe('V7 platform evidence API', () => {
  it('refreshes MC after a paused-clock service change and rejects observations from an old world', async () => {
    const store = new SessionStore(':memory:'),
      { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
      const initial = (await app.inject('/api/mc/indexing')).json();
      expect(initial.stats.find((s: { label: string }) => s.label === 'Indexers up').value).toBe('3 / 3');
      stopSplunk(live.world, resolveHost(live.world, 'idx02')!);
      const changed = (await app.inject('/api/mc/indexing')).json();
      expect(changed.generatedAt).toBe(initial.generatedAt);
      expect(changed.stats.find((s: { label: string }) => s.label === 'Indexers up').value).toBe('2 / 3');
      const view = (await app.inject('/api/platform')).json(),
        payload = { context: view.context, host: 'idx02' };
      expect(
        (await app.inject({ method: 'POST', url: '/api/platform/inspect', payload })).json().servicesDown,
      ).toEqual(['idx02']);
      const saved = store.resume()!;
      live.swap(loadWorld(saved, []));
      expect((await app.inject({ method: 'POST', url: '/api/platform/inspect', payload })).statusCode).toBe(
        400,
      );
      expect(live.world.platform?.observations).toHaveLength(1);
    } finally {
      await app.close();
      store.close();
    }
  });
});
