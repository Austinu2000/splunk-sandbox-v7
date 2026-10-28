import type { FastifyInstance } from 'fastify';
import {
  activeDataModels,
  buildDataModel,
  stageDataModel,
  clusterSourceRevision,
  practicePrincipal,
  requireCapability,
  OperationsError,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
const text = { type: 'string', maxLength: 300 };
export function registerDataModels(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get<{ Querystring: { host?: string } }>('/api/data-models', async (req) => {
    const hosts = live.world.infra
        .filter((n) => n.role === 'search_head' && !n.retired)
        .map((n) => n.hostname),
      host = req.query.host || hosts[0]!;
    if (!hosts.includes(host)) throw new OperationsError('Choose a search head');
    let models: ReturnType<typeof activeDataModels> = [],
      error = '';
    try {
      models = activeDataModels(live.world, host);
    } catch (e) {
      error = (e as Error).message;
    }
    return {
      context: live.context,
      host,
      hosts,
      revision: clusterSourceRevision(live.world, host),
      models,
      error,
      summaries:
        live.world.dataModels?.summaries
          .filter((s) => s.host === host)
          .map(({ rows, ...s }) => ({ ...s, rows: rows.length })) ?? [],
      builds: live.world.dataModels?.builds.filter((b) => b.host === host) ?? [],
    };
  });
  app.post<{
    Body: {
      context: string;
      host: string;
      revision: string;
      principal?: string;
      action: 'stage' | 'build';
      app?: string;
      source?: string;
      model?: string;
      enabled?: boolean;
      earliest?: string;
    };
  }>(
    '/api/data-models/action',
    {
      schema: {
        body: {
          type: 'object',
          required: ['context', 'host', 'revision', 'action'],
          additionalProperties: false,
          properties: {
            context: text,
            host: text,
            revision: text,
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
            action: { type: 'string', enum: ['stage', 'build'] },
            app: text,
            source: { type: 'string', maxLength: 100000 },
            model: text,
            enabled: { type: 'boolean' },
            earliest: { type: 'string', maxLength: 30 },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        w = live.world;
      if (b.context !== live.context)
        throw new OperationsError('The environment or lesson changed; review this editor');
      if (clusterSourceRevision(w, b.host) !== b.revision)
        throw new OperationsError('Dispatch source changed; review before applying');
      requireCapability(w, b.host, practicePrincipal(b.principal), 'indexes_edit');
      const allowed = b.action === 'stage' ? ['app', 'source', 'enabled', 'earliest'] : ['model'];
      for (const key of Object.keys(b))
        if (!['context', 'host', 'revision', 'principal', 'action', ...allowed].includes(key))
          throw new OperationsError('Unsupported field for this data model action');
      let result: unknown;
      if (b.action === 'stage') {
        if (!b.app || !b.source || b.enabled === undefined || !/^-[1-9]\d?(?:m|h|d)$/.test(b.earliest ?? ''))
          throw new OperationsError(
            'Supply app, JSON source, acceleration choice and a bounded relative summary range',
          );
        result = stageDataModel(w, b.host, b.app, b.source, { enabled: b.enabled, earliest: b.earliest! });
      } else result = buildDataModel(w, b.host, b.model ?? '', practicePrincipal(b.principal));
      store?.checkpoint(w);
      return result;
    },
  );
}
