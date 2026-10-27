import type { FastifyInstance } from 'fastify';
import {
  listDashboards,
  saveDashboard,
  renderDashboard,
  importLegacyDashboard,
  legacyReports,
  legacyReceiptKey,
  practicePrincipal,
  OperationsError,
  resolveHost,
  activateDashboardConf,
  type DashboardWrite,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
const text = { type: 'string', maxLength: 300 },
  principal = { type: 'string', enum: ['admin', 'analyst', 'operator'] };
export function registerDashboards(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  const context = (value: string) => {
    if (value !== live.context)
      throw new OperationsError('The active environment or lesson changed. Review this view before writing.');
  };
  app.get<{ Querystring: { host?: string; principal?: string } }>('/api/dashboards', async (req) => {
    const hosts = live.world.infra
        .filter((h) => h.role === 'search_head' && !h.retired)
        .map((h) => h.hostname),
      host = req.query.host || hosts[0] || '',
      p = practicePrincipal(req.query.principal),
      dashboards = listDashboards(live.world, host, p),
      ids = new Set(dashboards.map((d) => d.id));
    return {
      context: live.context,
      host,
      hosts,
      dashboards,
      declared: listDashboards(live.world, host, p, true),
      renders:
        live.world.dashboards?.renders.filter((r) => ids.has(r.dashboardId) && r.principal === p) ?? [],
      legacy: legacyReports(live.world)
        .knowledge.filter((c) => c.object.kind === 'dashboard')
        .map((c) => ({
          sourceId: c.object.id,
          title: c.object.title,
          app: c.object.app,
          owner: c.object.owner,
          sharing: c.object.sharing,
          status: c.status,
          imported: !!live.world.dashboards?.imports[legacyReceiptKey(c)],
        })),
    };
  });
  app.post<{
    Body: DashboardWrite & {
      context: string;
      principal?: string;
      revision?: string;
      id?: string;
      create?: boolean;
    };
  }>(
    '/api/dashboards',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'host', 'app', 'owner', 'sharing', 'name', 'format', 'source'],
          properties: {
            context: text,
            host: text,
            app: text,
            owner: text,
            sharing: { type: 'string', enum: ['Private', 'App', 'Global'] },
            name: text,
            format: { type: 'string', enum: ['classic', 'studio'] },
            source: { type: 'string', maxLength: 100000 },
            principal,
            revision: text,
            id: { type: 'string', maxLength: 1000 },
            create: { type: 'boolean' },
          },
        },
      },
    },
    async (req) => {
      const { context: c, principal: p, revision, id, create, ...input } = req.body;
      context(c);
      if (!create && (!id || !revision))
        throw new OperationsError('Review the dashboard and revision before editing');
      const result = saveDashboard(live.world, input, {
        principal: practicePrincipal(p),
        revision,
        id,
        create,
      });
      store?.checkpoint(live.world);
      return result;
    },
  );
  app.post<{
    Body: {
      context: string;
      id: string;
      revision: string;
      principal?: string;
      tokens?: Record<string, string>;
    };
  }>(
    '/api/dashboards/render',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'id', 'revision'],
          properties: {
            context: text,
            id: { type: 'string', maxLength: 1000 },
            revision: text,
            principal,
            tokens: {
              type: 'object',
              maxProperties: 8,
              additionalProperties: { type: 'string', maxLength: 500 },
            },
          },
        },
      },
    },
    async (req) => {
      context(req.body.context);
      const p = practicePrincipal(req.body.principal),
        current = live.world.infra
          .filter((h) => h.role === 'search_head' && !h.retired)
          .flatMap((h) => listDashboards(live.world, h.hostname, p))
          .find((d) => d.id === req.body.id);
      if (!current || current.revision !== req.body.revision)
        throw new OperationsError('Dashboard changed; review source before rendering');
      const result = renderDashboard(live.world, req.body.id, req.body.tokens, p);
      store?.checkpoint(live.world);
      return result;
    },
  );
  app.post<{ Body: { context: string; host: string; principal?: string } }>(
    '/api/dashboards/reload',
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
      context(req.body.context);
      if (practicePrincipal(req.body.principal) !== 'admin')
        throw new OperationsError('Only admin can reload all dashboard configuration');
      const p = resolveHost(live.world, req.body.host);
      if (!p?.splunk || p.role !== 'search_head') throw new OperationsError('Choose a search head');
      activateDashboardConf(live.world, p);
      store?.checkpoint(live.world);
      return { ok: true };
    },
  );
  app.post<{
    Body: {
      context: string;
      sourceId: string;
      host: string;
      app: string;
      owner: string;
      sharing: DashboardWrite['sharing'];
      principal?: string;
    };
  }>(
    '/api/dashboards/import',
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
            sharing: { type: 'string', enum: ['Private', 'App', 'Global'] },
            principal,
          },
        },
      },
    },
    async (req) => {
      const { context: c, sourceId, principal: p, ...scope } = req.body;
      context(c);
      if (practicePrincipal(p) !== 'admin')
        throw new OperationsError('Only admin can review legacy dashboard imports');
      store?.save(live.world, 'Before importing legacy dashboard ' + sourceId, 'manual', Date.now());
      const result = importLegacyDashboard(live.world, sourceId, scope);
      store?.checkpoint(live.world);
      return result;
    },
  );
}
