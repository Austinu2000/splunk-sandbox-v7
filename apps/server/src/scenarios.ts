import type { LiveWorld } from './live';
import { readFileSync, readdirSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import { closeTicket, parseScenario, scenarioCatalog, startScenario, type Scenario } from '@sandbox/sim';

/** Trusted local scenario files only; request paths never reach the real filesystem. */
export function loadScenarioDefinitions(): Scenario[] {
  const dir = new URL('../../../scenarios/', import.meta.url);
  return readdirSync(dir)
    .filter((n) => n.endsWith('.yaml'))
    .sort()
    .map((n) => parseScenario(readFileSync(new URL(n, dir), 'utf8')));
}

export function registerScenarios(app: FastifyInstance, live: LiveWorld): void {
  app.get('/api/scenarios', async () => scenarioCatalog(live.world));
  // Ticket status is refreshed every tick. Refreshing here too would change state between ticks,
  // which a saved session's replay could not reproduce.
  app.get('/api/tickets', async () => live.world.scenarios.tickets);
  app.post<{ Params: { id: string } }>('/api/scenarios/:id/start', async (req) =>
    startScenario(live.world, req.params.id),
  );
  app.post<{ Params: { id: string }; Body: { note: string } }>(
    '/api/tickets/:id/close',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['note'],
          properties: { note: { type: 'string', minLength: 1, maxLength: 4000 } },
        },
      },
    },
    async (req) => closeTicket(live.world, req.params.id, req.body.note),
  );
}
