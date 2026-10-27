import type { FastifyInstance } from 'fastify';
import {
  listReports,
  saveReport,
  executeReport,
  reportRevision,
  legacyReports,
  legacyReceiptKey,
  importLegacyReport,
  practicePrincipal,
  OperationsError,
  resolveHost,
  tickWorld,
  type ReportInput,
} from '@sandbox/sim';
import { activateReportConf } from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
const text = { type: 'string', maxLength: 300 };
const properties = {
  host: text,
  app: text,
  owner: text,
  sharing: { type: 'string', enum: ['Private', 'App', 'Global'] },
  title: { type: 'string', maxLength: 120 },
  description: { type: 'string', maxLength: 2000 },
  search: { type: 'string', maxLength: 10000 },
  earliest: text,
  latest: text,
  enabled: { type: 'boolean' },
  scheduled: { type: 'boolean' },
  cron: text,
  summaryIndex: { type: 'string', maxLength: 80 },
};
const principal = { type: 'string', enum: ['admin', 'analyst', 'operator'] };
export function registerReports(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  const check = (context: string) => {
    if (context !== live.context)
      throw new OperationsError('The active environment or lesson changed. Reload this view before writing.');
  };
  app.get<{ Querystring: { host?: string; principal?: string } }>('/api/reports', async (req) => {
    const hosts = live.world.infra
        .filter((h) => h.role === 'search_head' && !h.retired)
        .map((h) => h.hostname),
      host = req.query.host || hosts[0] || '',
      p = practicePrincipal(req.query.principal);
    const reports = listReports(live.world, host, p),
      visibleIds = new Set(reports.map((report) => report.id));
    return {
      context: live.context,
      now: live.world.clock.now,
      host,
      hosts,
      principal: p,
      revision: reportRevision(live.world, host),
      reports,
      declared: listReports(live.world, host, p, true),
      runs: live.world.reports?.runs.filter((r) => r.host === host && visibleIds.has(r.reportId)) ?? [],
    };
  });
  app.post<{ Body: { context: string } }>(
    '/api/reports/advance',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context'],
          properties: { context: text },
        },
      },
    },
    async (req) => {
      check(req.body.context);
      tickWorld(live.world, Math.ceil((60000 - (live.world.clock.now % 60000)) / live.world.config.tickMs));
      store?.checkpoint(live.world);
      return { now: live.world.clock.now };
    },
  );
  app.post<{
    Body: ReportInput & { context: string; principal?: string; revision?: string; create?: boolean };
  }>(
    '/api/reports',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'host', 'app', 'owner', 'sharing', 'title', 'search'],
          properties: {
            ...properties,
            context: text,
            principal,
            revision: text,
            create: { type: 'boolean' },
          },
        },
      },
    },
    async (req) => {
      const { context, principal: p, revision, create, ...input } = req.body;
      check(context);
      const result = saveReport(live.world, input, { principal: practicePrincipal(p), revision, create });
      store?.checkpoint(live.world);
      return result;
    },
  );
  app.post<{ Body: { context: string; id: string; principal?: string } }>(
    '/api/reports/run',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'id'],
          properties: { context: text, id: { type: 'string', maxLength: 1000 }, principal },
        },
      },
    },
    async (req) => {
      check(req.body.context);
      const result = executeReport(live.world, req.body.id, {
        principal: practicePrincipal(req.body.principal),
      });
      store?.checkpoint(live.world);
      return result;
    },
  );
  app.post<{ Body: { context: string; host: string; principal?: string } }>(
    '/api/reports/reload',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'host'],
          properties: { context: text, host: text, principal },
        },
      },
    },
    async (req) => {
      check(req.body.context);
      if (practicePrincipal(req.body.principal) !== 'admin')
        throw new OperationsError('Only admin can reload all saved-report configuration');
      const host = resolveHost(live.world, req.body.host);
      if (!host?.splunk || host.role !== 'search_head') throw new OperationsError('Choose a search head');
      activateReportConf(live.world, host);
      store?.checkpoint(live.world);
      return { ok: true };
    },
  );
  app.get('/api/reports/legacy', async () => {
    const plan = legacyReports(live.world);
    return {
      context: live.context,
      reports: plan.knowledge
        .filter((c) => c.object.kind === 'report')
        .map((c) => ({
          sourceId: c.object.id,
          title: c.object.title,
          app: c.object.app,
          owner: c.object.owner,
          sharing: c.object.sharing,
          search: c.object.search,
          status: c.status,
          imported: !!live.world.reports?.imports[legacyReceiptKey(c)],
        })),
      issues: plan.issues,
    };
  });
  app.post<{
    Body: {
      context: string;
      sourceId: string;
      host: string;
      app: string;
      owner: string;
      sharing: ReportInput['sharing'];
    };
  }>(
    '/api/reports/import',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'sourceId', 'host', 'app', 'owner', 'sharing'],
          properties: {
            context: text,
            sourceId: text,
            host: text,
            app: text,
            owner: text,
            sharing: properties.sharing,
          },
        },
      },
    },
    async (req) => {
      check(req.body.context);
      const { sourceId, context: _, ...scope } = req.body;
      void _;
      store?.save(live.world, 'Before importing legacy report ' + sourceId, 'manual', Date.now());
      const result = importLegacyReport(live.world, sourceId, scope);
      store?.checkpoint(live.world);
      return result;
    },
  );
}
