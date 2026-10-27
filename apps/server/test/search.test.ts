import { afterAll, describe, expect, it } from 'vitest';
import type { PageDto, ResultValue, SearchEventDto, SearchJobDto } from '@sandbox/shared';
import { createWorld, tickWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';

const world = createWorld({ seed: 'search-api', fleetSize: 2_000 });
tickWorld(world, 30);
const { app } = buildApp(world);
afterAll(() => app.close());

type JobResponse = {
  job: SearchJobDto;
  events: PageDto<SearchEventDto>;
  results: PageDto<Record<string, ResultValue>>;
};

async function search(body: object) {
  const res = await app.inject({ method: 'POST', url: '/api/search/jobs', payload: body });
  return { status: res.statusCode, body: res.json() as JobResponse };
}

describe('search API', () => {
  it('runs an event search and pages its events', async () => {
    const { body } = await search({
      search: 'index=_internal host=dal-app-0001',
      earliest: '-5m',
      latest: 'now',
    });
    expect(body.job.status).toBe('done');
    expect(body.job.kind).toBe('events');
    expect(body.events.total).toBe(body.job.eventCount);
    expect(body.events.items[0]).toMatchObject({ host: 'dal-app-0001', index: '_internal' });
    expect(body.job.fields.map((f) => f.name)).toContain('sourcetype');
    const page2 = await app.inject({ url: `/api/search/jobs/${body.job.sid}/events?offset=20&count=20` });
    expect((page2.json() as PageDto<SearchEventDto>).offset).toBe(20);
  });

  it('runs a transforming search and returns columns and results', async () => {
    const { body } = await search({
      search: '| inputlookup forwarder_inventory | stats count by site',
      earliest: '-15m',
      latest: 'now',
    });
    expect(body.job.kind).toBe('statistics');
    expect(body.job.columns).toEqual(['site', 'count']);
    expect(body.results.items.reduce((s, r) => s + (r.count as number), 0)).toBe(2_000);
  });

  it('reports SPL errors as failed jobs, and validates input', async () => {
    const { body } = await search({ search: 'index=_internal | nope' });
    expect(body.job.status).toBe('failed');
    expect(body.job.messages[0]).toEqual({ type: 'error', text: "Unknown search command 'nope'." });
    expect((await search({ earliest: '-5m' })).status).toBe(400);
    expect((await search({ search: 'x'.repeat(10_001) })).status).toBe(400);
    expect((await app.inject({ url: '/api/search/jobs/nope/results' })).statusCode).toBe(404);
  });
});
