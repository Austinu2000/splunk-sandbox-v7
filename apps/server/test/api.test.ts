import { afterAll, describe, expect, it } from 'vitest';
import { HEALTH_STATES, type FleetSummary, type HostPage, type WorldInfo } from '@sandbox/shared';
import { createWorld, tickWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';

const world = createWorld({ seed: 'api-test', fleetSize: 8_000 });
tickWorld(world, 50);
const { app } = buildApp(world);
afterAll(() => app.close());

async function get<T>(url: string): Promise<{ status: number; body: T }> {
  const res = await app.inject({ method: 'GET', url });
  return { status: res.statusCode, body: res.json() as T };
}

describe('fleet API', () => {
  it('reports world info', async () => {
    const { body } = await get<WorldInfo>('/api/world');
    expect(body.seed).toBe('api-test');
    expect(body.fleetSize).toBe(8_000);
    expect(body.tick).toBe(50);
    expect(body.sites.map((s) => s.id)).toEqual(['dal', 'ash', 'fra']);
    expect(body.infra.length).toBeGreaterThan(10);
  });

  it('summary counts equal /hosts totals for the same filter (consistency rule)', async () => {
    const { body: summary } = await get<FleetSummary>('/api/fleet/summary');
    expect(summary.total).toBe(8_000);
    for (const health of HEALTH_STATES) {
      const { body } = await get<HostPage>(`/api/fleet/hosts?health=${health}&limit=1`);
      expect(body.total).toBe(summary.byHealth[health]);
    }
    const { body: filtered } = await get<FleetSummary>('/api/fleet/summary?site=ash&health=offline');
    const { body: hosts } = await get<HostPage>('/api/fleet/hosts?site=ash&health=offline');
    expect(filtered.total).toBe(hosts.total);
    expect(filtered.total).toBe(summary.bySite.find((s) => s.id === 'ash')!.byHealth.offline);
  });

  it('pages hosts and caps the page size', async () => {
    const { body } = await get<HostPage>('/api/fleet/hosts?offset=10&limit=25');
    expect(body.rows).toHaveLength(25);
    expect(body.offset).toBe(10);
    expect((await get('/api/fleet/hosts?limit=5000')).status).toBe(400);
  });

  it('rejects unknown filter values with 400', async () => {
    expect((await get('/api/fleet/summary?site=mars')).status).toBe(400);
    expect((await get('/api/fleet/hosts?health=sad')).status).toBe(400);
    expect((await get<{ error: string }>('/api/fleet/hosts?serverClass=nope')).body.error).toMatch(
      /Unknown server class/,
    );
  });

  it('pauses and changes speed', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/world/clock',
      payload: { paused: true, speed: 30 },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ paused: true, speed: 30 });
    const bad = await app.inject({ method: 'POST', url: '/api/world/clock', payload: { speed: 7 } });
    expect(bad.statusCode).toBe(400);
  });
});
