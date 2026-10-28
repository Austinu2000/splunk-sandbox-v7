import type { FastifyInstance } from 'fastify';
import { platformSnapshot, inspectPlatform, OperationsError } from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
export function registerPlatform(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get('/api/platform', async () => ({ context: live.context, ...platformSnapshot(live.world) }));
  app.post<{ Body: { context: string; host?: string } }>(
    '/api/platform/inspect',
    {
      schema: {
        body: {
          type: 'object',
          required: ['context'],
          additionalProperties: false,
          properties: {
            context: { type: 'string', maxLength: 300 },
            host: { type: 'string', maxLength: 100 },
          },
        },
      },
    },
    async (req) => {
      if (req.body.context !== live.context)
        throw new OperationsError('The environment or lesson changed; inspect the current platform');
      const result = inspectPlatform(live.world, req.body.host);
      store?.checkpoint(live.world);
      return result;
    },
  );
}
