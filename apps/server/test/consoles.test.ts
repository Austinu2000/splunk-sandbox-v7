import { afterAll, describe, expect, it } from 'vitest';
import { createWorld } from '@sandbox/sim';
import type { DsClientDto, DsOverviewDto, McViewDto, PageDto } from '@sandbox/shared';
import { buildApp } from '../src/app';
const { app } = buildApp(createWorld({ fleetSize: 1000 }));
afterAll(() => app.close());

describe('Monitoring Console and Forwarder Management API', () => {
  it('serves each console view with stats and panels, and rejects unknown views', async () => {
    for (const view of ['indexing', 'forwarders', 'license', 'scheduler']) {
      const res = await app.inject(`/api/mc/${view}`);
      expect(res.statusCode).toBe(200);
      const dto = res.json<McViewDto>();
      expect(dto.view).toBe(view);
      expect(dto.stats.length).toBeGreaterThan(0);
      for (const p of dto.panels) expect(p.search.length).toBeGreaterThan(0);
    }
    expect((await app.inject('/api/mc/nope')).statusCode).toBe(400);
  });

  it('lists server classes, apps and paged clients', async () => {
    const o = (await app.inject('/api/ds/overview')).json<DsOverviewDto>();
    expect(o.server).toBe('ds01');
    expect(o.totalClients).toBe(1000);
    const web = o.serverClasses.find((c) => c.name === 'linux_web')!;
    expect(web.whitelist).toContain('dal-web-*');
    expect(o.apps.find((a) => a.name === 'org_linux_web_inputs')!.clients).toBe(web.clients);
    const page = (await app.inject('/api/ds/clients?serverClass=linux_web&limit=5')).json<
      PageDto<DsClientDto>
    >();
    expect(page.total).toBe(web.clients);
    expect(page.items).toHaveLength(5);
    expect(page.items.every((c) => c.serverClasses.includes('linux_web'))).toBe(true);
    expect((await app.inject('/api/ds/clients?limit=9999')).statusCode).toBe(400);
  });
});
