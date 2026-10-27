import { readFileSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';
import {
  defaultProfile,
  parseProfile,
  profileWorldConfig,
  createWorld,
  configureScenarios,
  loadWorld,
  worldInfo,
  ProfileError,
  SaveError,
  type Scenario,
  operationMetrics,
  resolveHost,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
export function loadProfiles() {
  return [
    defaultProfile(),
    ...['lab', 'apl', 'erie'].map((id) =>
      parseProfile(readFileSync(new URL(`../../../profiles/${id}.yaml`, import.meta.url), 'utf8')),
    ),
  ];
}
export function registerProfiles(
  app: FastifyInstance,
  live: LiveWorld,
  definitions: Scenario[],
  store: SessionStore | null,
) {
  const catalog = loadProfiles();
  const need = () => {
    if (!store) throw new SaveError('A session database is required to switch environments');
    return store;
  };
  app.get('/api/profiles', async () => ({
    activeId: live.world.config.profileId,
    profiles: catalog.map((p) => {
      const saved = store?.list().find((s) => s.slot === `autosave:${p.id}`);
      return { ...p, lastPlayed: saved?.savedAt ?? null, hasAutosave: !!saved };
    }),
  }));
  app.get('/api/operations', async () =>
    live.world.infra
      .filter((n) => !n.retired)
      .map((n) => ({
        host: n.hostname,
        role: n.role,
        metrics: operationMetrics(live.world, resolveHost(live.world, n.hostname)!),
      })),
  );
  app.get('/api/profile', async () => ({
    profile: live.world.config.profile ?? defaultProfile(),
    uiState: live.world.uiState,
  }));
  app.post<{ Body: { profileId: string; state: Record<string, string> } }>(
    '/api/profile/ui',
    {
      bodyLimit: 8 * 1024 * 1024,
      schema: {
        body: {
          type: 'object',
          required: ['profileId', 'state'],
          additionalProperties: false,
          properties: {
            profileId: { type: 'string' },
            state: { type: 'object', additionalProperties: { type: 'string' } },
          },
        },
      },
    },
    async (req, reply) => {
      if (req.body.profileId !== live.world.config.profileId)
        return reply.code(409).send({ error: 'Environment changed; reload before saving' });
      live.world.uiState = { ...req.body.state };
      return { ok: true };
    },
  );
  for (const operation of ['load', 'reset'] as const)
    app.post<{ Params: { id: string } }>(`/api/profiles/:id/${operation}`, async (req) => {
      const persistence = need();
      const profile = catalog.find((p) => p.id === req.params.id);
      if (!profile) throw new ProfileError('Unknown environment');
      const previous = live.world;
      // Loading the active environment should not rewind unsaved progress.
      if (operation === 'load' && profile.id === previous.config.profileId) {
        persistence.checkpoint(previous);
        return worldInfo(previous);
      }
      const saved = persistence.autosave(profile.id);
      const next =
        operation === 'load' && saved
          ? loadWorld(saved, definitions)
          : createWorld(profileWorldConfig(profile));
      if (!(operation === 'load' && saved)) configureScenarios(next, definitions);
      const backup =
        operation === 'reset'
          ? previous.config.profileId === profile.id
            ? previous
            : saved
              ? loadWorld(saved, definitions)
              : undefined
          : undefined;
      persistence.checkpointSwitch(previous, next, backup);
      live.swap(next);
      return worldInfo(next);
    });
}
