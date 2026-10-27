import type { LiveWorld } from './live';
import type { FastifyInstance } from 'fastify';
import type { PageDto, ResultValue, SearchEventDto, SearchJobDto } from '@sandbox/shared';
import { eventToPlain, logAction, rowToPlain, runSearch, type SearchOutcome } from '@sandbox/sim';

const MAX_JOBS = 20;

/** Search jobs run synchronously in-process and are kept in memory for paging (most recent 20). */
export function registerSearch(app: FastifyInstance, live: LiveWorld): void {
  const jobs = new Map<string, SearchOutcome>();
  let seq = 0;
  live.onSwap(() => jobs.clear());

  const toDto = (sid: string, o: SearchOutcome): SearchJobDto => ({
    sid,
    search: o.search,
    earliest: o.earliest,
    latest: o.latest,
    status: o.status,
    kind: o.kind,
    eventCount: o.eventCount,
    resultCount: o.kind === 'events' ? o.events.length : o.results.length,
    scanCount: o.scan?.scanned ?? 0,
    hostsScanned: o.scan?.hosts ?? 0,
    truncated: !!o.scan?.truncated,
    runMs: o.runMs,
    workUnits: o.workUnits,
    messages: o.messages,
    timeline: o.timeline,
    timelineSpanMs: o.timelineSpan,
    fields: o.fields,
    columns: o.columns,
    phases: o.phases,
  });
  const eventsPage = (o: SearchOutcome, offset: number, count: number): PageDto<SearchEventDto> => ({
    offset,
    total: o.events.length,
    items: o.events.slice(offset, offset + count).map((r) => eventToPlain(r)),
  });
  const resultsPage = (
    o: SearchOutcome,
    offset: number,
    count: number,
  ): PageDto<Record<string, ResultValue>> => ({
    offset,
    total: o.results.length,
    items: o.results.slice(offset, offset + count).map((r) => rowToPlain(r, o.columns)),
  });

  app.post<{ Body: { search: string; earliest?: string; latest?: string } }>(
    '/api/search/jobs',
    {
      schema: {
        body: {
          type: 'object',
          required: ['search'],
          additionalProperties: false,
          properties: {
            search: { type: 'string', maxLength: 10_000 },
            earliest: { type: 'string', maxLength: 64 },
            latest: { type: 'string', maxLength: 64 },
          },
        },
      },
    },
    async (req) => {
      const { search, earliest = '-15m', latest = 'now' } = req.body;
      const outcome = runSearch(live.world, req.body);
      logAction(
        live.world,
        { kind: 'search', success: outcome.status === 'done', text: `${search} [earliest=${earliest} latest=${latest}]` },
        Date.now(),
      );
      const sid = `${Math.floor(live.world.clock.now / 1000)}.${++seq}`;
      jobs.set(sid, outcome);
      while (jobs.size > MAX_JOBS) jobs.delete(jobs.keys().next().value!);
      return {
        job: toDto(sid, outcome),
        events: eventsPage(outcome, 0, 50),
        results: resultsPage(outcome, 0, 50),
      };
    },
  );

  const pageQuery = {
    type: 'object',
    properties: {
      offset: { type: 'integer', minimum: 0, default: 0 },
      count: { type: 'integer', minimum: 1, maximum: 500, default: 50 },
    },
  } as const;

  app.get<{ Params: { sid: string }; Querystring: { offset: number; count: number } }>(
    '/api/search/jobs/:sid/events',
    { schema: { querystring: pageQuery } },
    async (req, reply) => {
      const o = jobs.get(req.params.sid);
      if (!o) return reply.code(404).send({ error: 'Unknown or expired search job.' });
      return eventsPage(o, req.query.offset, req.query.count);
    },
  );

  app.get<{ Params: { sid: string }; Querystring: { offset: number; count: number } }>(
    '/api/search/jobs/:sid/results',
    { schema: { querystring: pageQuery } },
    async (req, reply) => {
      const o = jobs.get(req.params.sid);
      if (!o) return reply.code(404).send({ error: 'Unknown or expired search job.' });
      return resultsPage(o, req.query.offset, req.query.count);
    },
  );
}
