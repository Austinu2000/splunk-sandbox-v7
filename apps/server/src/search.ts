import type { LiveWorld } from './live';
import type { FastifyInstance } from 'fastify';
import type { PageDto, ResultValue, SearchEventDto, SearchJobDto } from '@sandbox/shared';
import {
  OperationsError,
  eventToPlain,
  logAction,
  rowToPlain,
  runSearch,
  practicePrincipal,
  recordSearchEvidence,
  type SearchOutcome,
} from '@sandbox/sim';

const MAX_JOBS = 20;

/** Search jobs run synchronously in-process and are kept in memory for paging (most recent 20). */
export function registerSearch(app: FastifyInstance, live: LiveWorld): void {
  const jobs = new Map<string, SearchOutcome>();
  let seq = 0;
  live.onSwap(() => jobs.clear());

  app.get('/api/search/context', async () => ({
    context: live.context,
    host: live.world.infra.find((n) => n.role === 'search_head' && !n.retired)?.hostname,
    hosts: live.world.infra.filter((n) => n.role === 'search_head' && !n.retired).map((n) => n.hostname),
  }));
  const toDto = (sid: string, o: SearchOutcome): SearchJobDto => ({
    sid,
    host: o.host,
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

  app.post<{ Body: { search: string; earliest?: string; latest?: string; host?: string; context?: string } }>(
    '/api/search/jobs',
    {
      schema: {
        body: {
          type: 'object',
          required: ['search'],
          additionalProperties: false,
          properties: {
            host: { type: 'string', minLength: 1, maxLength: 100 },
            context: { type: 'string', minLength: 1, maxLength: 300 },
            search: { type: 'string', maxLength: 10_000 },
            earliest: { type: 'string', maxLength: 64 },
            latest: { type: 'string', maxLength: 64 },
          },
        },
      },
    },
    async (req) => {
      if (req.body.context && req.body.context !== live.context)
        throw new OperationsError(
          'The environment or lesson changed; review Search before running this draft',
        );
      const { search, earliest = '-15m', latest = 'now' } = req.body;
      const outcome = runSearch(live.world, {
        ...req.body,
        readOnly: !req.body.context,
        principal: practicePrincipal(req.headers['x-sandbox-principal'] as string | undefined),
      });
      logAction(
        live.world,
        {
          kind: 'search',
          host: outcome.host,
          success: outcome.status === 'done',
          text: `${search} [earliest=${earliest} latest=${latest}]`,
        },
        Date.now(),
      );
      const sid = `${Math.floor(live.world.clock.now / 1000)}.${++seq}`;
      jobs.set(sid, outcome);
      recordSearchEvidence(live.world, {
        id: sid,
        host: outcome.host,
        principal: practicePrincipal(req.headers['x-sandbox-principal'] as string | undefined),
        search: outcome.search,
        earliest: outcome.earliest,
        latest: outcome.latest,
        status: outcome.status,
        scanCount: outcome.scan?.scanned ?? 0,
        workUnits: outcome.workUnits,
        resultCount: outcome.kind === 'events' ? outcome.events.length : outcome.results.length,
        inspected: false,
      });
      while (jobs.size > MAX_JOBS) jobs.delete(jobs.keys().next().value!);
      return {
        job: toDto(sid, outcome),
        events: eventsPage(outcome, 0, 50),
        results: resultsPage(outcome, 0, 50),
      };
    },
  );

  app.post<{ Params: { sid: string } }>('/api/search/jobs/:sid/inspect', async (req, reply) => {
    const job = jobs.get(req.params.sid),
      evidence = live.world.searchEvidence?.find((r) => r.id === req.params.sid);
    if (!job || !evidence) return reply.code(404).send({ error: 'Unknown or expired search job.' });
    recordSearchEvidence(live.world, { ...evidence, inspected: true });
    return toDto(req.params.sid, job);
  });
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
