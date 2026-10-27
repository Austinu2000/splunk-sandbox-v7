import { afterAll, describe, expect, it } from 'vitest';
import { createWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';
const { app } = buildApp(createWorld({ fleetSize: 1000 }));
afterAll(() => app.close());
describe('incident API', () => {
  it('lists the catalog, starts tickets, rejects unknown/duplicate starts and premature closure', async () => {
    expect((await app.inject('/api/scenarios')).json()).toHaveLength(8);
    expect((await app.inject('/api/tickets')).json()).toEqual([]);
    const start = await app.inject({ method: 'POST', url: '/api/scenarios/ds-serverclass-typo/start' });
    expect(start.statusCode).toBe(200);
    expect(start.json()).toMatchObject({ id: 'INC-0001', status: 'open' });
    expect(
      (await app.inject({ method: 'POST', url: '/api/scenarios/ds-serverclass-typo/start' })).statusCode,
    ).toBe(400);
    expect((await app.inject({ method: 'POST', url: '/api/scenarios/missing/start' })).statusCode).toBe(400);
    expect(
      (await app.inject({ method: 'POST', url: '/api/tickets/INC-0001/close', payload: { note: 'fixed' } }))
        .statusCode,
    ).toBe(400);
    expect(
      (await app.inject({ method: 'POST', url: '/api/tickets/INC-0001/close', payload: {} })).statusCode,
    ).toBe(400);
  });
});
