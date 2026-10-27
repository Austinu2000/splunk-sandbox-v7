import { afterAll, describe, expect, it } from 'vitest';
import { createWorld, tickWorld } from '@sandbox/sim';
import type {
  InterviewCatalogDto,
  InterviewDto,
  SessionInfoDto,
  TicketDto,
  WorldInfo,
} from '@sandbox/shared';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';

const store = new SessionStore(':memory:');
const { app, live } = buildApp(createWorld({ seed: 'sessions', fleetSize: 1000 }), { aiGrader: null, store });
afterAll(async () => {
  await app.close();
  store.close();
});
const post = (url: string, payload?: object) =>
  app.inject({ method: 'POST', url, ...(payload && { payload }) });
const info = async () => (await app.inject('/api/sessions')).json<SessionInfoDto>();

describe('sessions API', () => {
  it('saves, resets, loads back the same world, and keeps interview history across sessions', async () => {
    expect((await info()).persistence).toBe(true);
    tickWorld(live.world, 6);
    expect((await post('/api/scenarios/input-permissions/start')).statusCode).toBe(200);
    tickWorld(live.world, 3);
    await post('/api/actions/page', { page: 'fleet' });
    const iv = (await post('/api/interviews', {})).statusCode;
    expect(iv).toBe(400); // a sandbox ticket is open: one incident at a time
    tickWorld(live.world, 4);
    const before = {
      tickets: (await app.inject('/api/tickets')).json<TicketDto[]>(),
      world: (await app.inject('/api/world')).json<WorldInfo>(),
      health: Array.from(live.world.fleet.health),
    };
    expect((await info()).changes).toBe(2);
    const saved = await post('/api/sessions', { name: 'Permissions incident' });
    expect(saved.statusCode).toBe(200);
    const id = saved.json<{ id: number }>().id;

    // Reset to a fresh world with another seed.
    const reset = await post('/api/world/reset', { seed: 'other', fleetSize: 1500 });
    expect(reset.json<WorldInfo>()).toMatchObject({ seed: 'other', fleetSize: 1500, tick: 0 });
    expect((await app.inject('/api/tickets')).json()).toEqual([]);
    expect((await info()).changes).toBe(0);

    // Load the save: same tick, tickets and fleet as when it was saved.
    const loaded = await post(`/api/sessions/${id}/load`);
    expect(loaded.statusCode).toBe(200);
    expect(loaded.json<WorldInfo>()).toMatchObject({
      seed: 'sessions',
      fleetSize: 1000,
      tick: before.world.tick,
    });
    expect((await app.inject('/api/tickets')).json()).toEqual(before.tickets);
    expect(Array.from(live.world.fleet.health)).toEqual(before.health);

    // Run an interview in a fresh world, save, and it shows in history and steers the next pick.
    await post('/api/world/reset', {});
    const started = (
      await post('/api/interviews', { scenarioId: 'forwarder-retired-indexer' })
    ).json<InterviewDto>();
    const answer = {
      rootCause: 'idx07 in outputs.conf',
      fix: 'removed it',
      verification: 'search',
      prevention: 'DS only',
    };
    expect((await post(`/api/interviews/${started.id}/submit`, { answer })).statusCode).toBe(200);
    await post('/api/sessions', { name: 'Interview run' });
    const after = await info();
    expect(after.saves.map((s) => s.name)).toEqual(['Interview run', 'Permissions incident']);
    expect(after.saves[0]).toMatchObject({ interviews: 1, seed: 'sessions' });
    expect(after.history).toHaveLength(1);
    expect(after.history[0]).toMatchObject({
      scenarioId: 'forwarder-retired-indexer',
      session: 'Interview run',
    });
    await post('/api/world/reset', {});
    const cat = (await app.inject('/api/interview/catalog')).json<InterviewCatalogDto>();
    expect(cat.scenarios.find((s) => s.id === 'forwarder-retired-indexer')).toMatchObject({
      seen: false,
      practised: true,
    });
    const next = (await post('/api/interviews', { difficulty: 'easy' })).json<InterviewDto>();
    expect(next.scenarioId).toBe('input-permissions'); // the other easy one: not practised yet
  });

  it('autosave keeps a single slot; delete and bad ids', async () => {
    store.save(live.world, 'Autosave', 'autosave', 1);
    store.save(live.world, 'Autosave', 'autosave', 2);
    const saves = (await info()).saves;
    expect(saves.filter((s) => s.kind === 'autosave')).toHaveLength(1);
    expect(saves[0]!.kind).toBe('autosave');
    expect((await app.inject({ method: 'DELETE', url: `/api/sessions/${saves[0]!.id}` })).statusCode).toBe(
      200,
    );
    expect((await app.inject({ method: 'DELETE', url: `/api/sessions/${saves[0]!.id}` })).statusCode).toBe(
      404,
    );
    expect((await post('/api/sessions/9999/load')).statusCode).toBe(404);
    expect((await post('/api/sessions/abc/load')).statusCode).toBe(400);
    expect((await post('/api/world/reset', { fleetSize: 10 })).statusCode).toBe(400);
    expect((await post('/api/world/reset', { seed: '../x' })).statusCode).toBe(400);
    expect((await post('/api/sessions', { name: '' })).statusCode).toBe(400);
  });

  it('without a database, saving is reported as unavailable', async () => {
    const bare = buildApp(createWorld({ fleetSize: 1000 }), { aiGrader: null });
    expect((await bare.app.inject('/api/sessions')).json()).toMatchObject({ persistence: false, saves: [] });
    const res = await bare.app.inject({ method: 'POST', url: '/api/sessions', payload: { name: 'x' } });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toMatch(/unavailable/);
    await bare.app.close();
  });
});
