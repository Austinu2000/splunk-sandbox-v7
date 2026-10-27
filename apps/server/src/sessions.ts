import type { FastifyInstance } from 'fastify';
import type { SessionInfoDto } from '@sandbox/shared';
import {
  configureScenarios,
  createWorld,
  loadWorld,
  SaveError,
  worldInfo,
  type Scenario,
  type World,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';

/** Fleet sizes a reset may ask for. */
const FLEET_MIN = 1_000;
const FLEET_MAX = 50_000;

export function newWorld(definitions: Scenario[], seed: string, fleetSize?: number): World {
  const world = createWorld({ seed, ...(fleetSize ? { fleetSize } : {}) });
  configureScenarios(world, definitions);
  return world;
}

/** Save, load, reset and the cross-session interview history. */
export function registerSessions(
  app: FastifyInstance,
  live: LiveWorld,
  definitions: Scenario[],
  store: SessionStore | null,
): void {
  const need = (): SessionStore => {
    if (!store) throw new SaveError('Saving is unavailable: the server has no session database');
    return store;
  };
  const idParam = {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'integer', minimum: 1 } },
  } as const;

  app.get('/api/sessions', async (): Promise<SessionInfoDto> => ({
    persistence: !!store,
    changes: live.world.journal.log.length,
    saves: store?.list() ?? [],
    history: store?.interviewHistory() ?? [],
  }));

  app.post<{ Body: { name: string } }>(
    '/api/sessions',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['name'],
          properties: { name: { type: 'string', minLength: 1, maxLength: 80 } },
        },
      },
    },
    async (req) => ({ id: need().save(live.world, req.body.name.trim(), 'manual', Date.now()) }),
  );

  app.post<{ Params: { id: number } }>(
    '/api/sessions/:id/load',
    { schema: { params: idParam } },
    async (req, reply) => {
      const saved = need().get(req.params.id);
      if (!saved) return reply.code(404).send({ error: 'No such saved session' });
      const started = performance.now();
      const world = loadWorld(saved, definitions);
      if (live.world.config.profileId !== world.config.profileId) need().checkpointSwitch(live.world, world);
      live.swap(world);
      req.log.info(
        `Loaded session ${req.params.id} (${saved.journal.length} changes) in ${Math.round(performance.now() - started)} ms`,
      );
      return worldInfo(world);
    },
  );

  app.delete<{ Params: { id: number } }>(
    '/api/sessions/:id',
    { schema: { params: idParam } },
    async (req, reply) => {
      if (!need().delete(req.params.id)) return reply.code(404).send({ error: 'No such saved session' });
      return { ok: true };
    },
  );

  app.post<{ Body: { seed?: string; fleetSize?: number } }>(
    '/api/world/reset',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: {
            seed: { type: 'string', minLength: 1, maxLength: 64, pattern: '^[\\w.-]+$' },
            fleetSize: { type: 'integer', minimum: FLEET_MIN, maximum: FLEET_MAX },
          },
        },
      },
    },
    async (req) => {
      const current = live.world;
      if (current.config.profile) throw new SaveError('Use Environments → Start fresh to reset a profile');
      const world = newWorld(
        definitions,
        req.body.seed ?? current.config.seed,
        req.body.fleetSize ?? current.config.fleetSize,
      );
      live.swap(world);
      return worldInfo(world);
    },
  );
}
