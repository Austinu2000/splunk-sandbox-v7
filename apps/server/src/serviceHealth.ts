import type { FastifyInstance } from 'fastify';
import {
  initializeServiceHealth,
  stageServiceHealth,
  activateServiceHealth,
  evaluateServiceHealth,
  serviceHealthRevision,
  SERVICE_HEALTH_PATH,
  readIntegrationSource,
  practicePrincipal,
  requireCapability,
  OperationsError,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
const text = { type: 'string', maxLength: 300 };
export function registerServiceHealth(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get('/api/service-health', async () => {
    const s = live.world.serviceHealth;
    return {
      context: live.context,
      initialized: !!s,
      revision: serviceHealthRevision(live.world),
      source: s ? readIntegrationSource(live.world, s.host, SERVICE_HEALTH_PATH) : '',
      sourcePath: SERVICE_HEALTH_PATH,
      host: s?.host ?? 'sh01',
      active: !!s?.activeSource,
      evaluations: s?.evaluations ?? [],
    };
  });
  app.post<{
    Body: {
      context: string;
      revision?: string;
      principal?: string;
      action: 'initialize' | 'stage' | 'activate' | 'evaluate';
      source?: string;
      infrastructure?: boolean;
    };
  }>(
    '/api/service-health/action',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'action'],
          properties: {
            context: text,
            revision: text,
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
            action: { type: 'string', enum: ['initialize', 'stage', 'activate', 'evaluate'] },
            source: { type: 'string', maxLength: 50000 },
            infrastructure: { type: 'boolean' },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        w = live.world,
        p = practicePrincipal(b.principal);
      if (b.context !== live.context)
        throw new OperationsError('Environment or lesson changed; review the service model');
      if (b.action !== 'initialize' && b.revision !== serviceHealthRevision(w))
        throw new OperationsError('Service source or operational evidence changed; review before applying');
      const fields = b.action === 'initialize' ? ['infrastructure'] : b.action === 'stage' ? ['source'] : [];
      for (const k of Object.keys(b))
        if (!['context', 'revision', 'principal', 'action', ...fields].includes(k))
          throw new OperationsError('Unsupported field for this service-health action');
      let result: unknown;
      if (b.action === 'initialize') {
        requireCapability(w, 'sh01', p, 'indexes_edit');
        result = initializeServiceHealth(w, b.infrastructure);
      } else if (b.action === 'stage') {
        if (!b.source) throw new OperationsError('Supply the teaching service model');
        result = stageServiceHealth(w, b.source, p);
      } else if (b.action === 'activate') result = activateServiceHealth(w, p);
      else result = evaluateServiceHealth(w, p);
      store?.checkpoint(w);
      return { result };
    },
  );
}
