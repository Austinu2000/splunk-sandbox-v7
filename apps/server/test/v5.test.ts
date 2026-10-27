import { describe, it, expect } from 'vitest';
import { createWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
describe('v5 API', () => {
  it('keeps questions, incidents and PR state after an environment switch', async () => {
    const store = new SessionStore(':memory:');
    const { app } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
      const view = (await app.inject('/api/training')).json();
      expect(view.questions).toHaveLength(235);
      expect(view.cases).toHaveLength(14);
      expect(view.cases[0]).not.toHaveProperty('faults');
      expect(view.cases[0]).not.toHaveProperty('solution');
      const started = await app.inject({
        method: 'POST',
        url: '/api/training/action',
        payload: { action: 'start', target: 'v5-aws-backlog' },
      });
      expect(started.statusCode).toBe(200);
      const bad = await app.inject({
        method: 'POST',
        url: '/api/training/action',
        payload: { action: 'configure', target: 'aws', value: { readAllowed: 'yes' } },
      });
      expect(bad.statusCode).toBe(400);
      await app.inject({ method: 'POST', url: '/api/profiles/apl/load' });
      expect((await app.inject('/api/training')).json().state.attempts).toHaveLength(0);
      await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
      expect((await app.inject('/api/training')).json().state.attempts).toHaveLength(1);
      const comparison = await app.inject({
        method: 'POST',
        url: '/api/training/compare',
        payload: {
          left: '| inputlookup employee_lookup | search department=IT | stats count',
          right: '| inputlookup employee_lookup | where department="IT" | stats count',
        },
      });
      expect(comparison.json().equivalent).toBe(true);
    } finally {
      await app.close();
      store.close();
    }
  });
});

it('isolates and resumes learner lesson sessions without overwriting free practice', async () => {
  const store = new SessionStore(':memory:');
  const { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    const original = live.world;
    await app.inject({ method: 'POST', url: '/api/learn/start', payload: { id: 'G1', learner: 'Austin' } });
    expect(live.world.lesson?.id).toBe('G1');
    await app.inject({
      method: 'POST',
      url: '/api/learn/progress',
      payload: { notes: 'Saved lesson notes' },
    });
    await app.inject({ method: 'POST', url: '/api/learn/leave', payload: {} });
    expect(live.world.lesson).toBeUndefined();
    expect(live.world.config.seed).toBe(original.config.seed);
    await app.inject({ method: 'POST', url: '/api/learn/start', payload: { id: 'G1', learner: 'Austin' } });
    expect(live.world.lesson?.notes).toBe('Saved lesson notes');
    await app.inject({ method: 'POST', url: '/api/learn/start', payload: { id: 'G1', learner: 'Other' } });
    expect(live.world.lesson?.notes).toBe('');
    expect(store.resume()?.lesson?.learner).toBe('Other');
  } finally {
    await app.close();
    store.close();
  }
});
