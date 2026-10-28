import { registerMaintenance } from './maintenance';
import { registerServiceHealth } from './serviceHealth';
import { registerIntegrations } from './integrations';
import { registerIdentity } from './identity';
import { registerSecurity } from './security';
import { registerDataModels } from './dataModels';
import { registerPlatform } from './platform';
import { registerForwarders } from './forwarders';
import { registerKvStore } from './kvstore';
import { registerIndexes } from './indexes';
import { registerInputs } from './inputs';
import { KvError } from '@sandbox/sim';
import { registerLearn } from './learn';
import { registerTraining } from './training';
import { TrainingError } from '@sandbox/sim';
import { registerProfiles } from './profiles';
import { loadScenarioDefinitions, registerScenarios } from './scenarios';
import { LiveWorld } from './live';
import { registerSessions } from './sessions';
import type { SessionStore } from './store';
import Fastify, { type FastifyInstance } from 'fastify';
import { CLOCK_SPEEDS, HEALTH_STATES, type FleetFilter, type HostSortKey } from '@sandbox/shared';
import {
  configureScenarios,
  FilterError,
  ProfileError,
  SaveError,
  ScenarioError,
  listHosts,
  setClock,
  sshRoster,
  summarizeFleet,
  worldInfo,
  engineeringMigrationPreview,
  OperationsError,
  type World,
} from '@sandbox/sim';
import { aiGradingEnabled, createAiGrader, type AiGrader } from './aiGrader';
import { registerConsoles } from './consoles';
import { registerInterview } from './interview';
import { registerSearch } from './search';
import { registerTerminal } from './terminal';

const filterProps = {
  site: { type: 'string' },
  serverClass: { type: 'string' },
  health: { type: 'string', enum: [...HEALTH_STATES] },
  os: { type: 'string', enum: ['windows', 'linux'] },
  q: { type: 'string', maxLength: 64 },
} as const;

type FilterQuery = FleetFilter;
type HostsQuery = FilterQuery & { offset?: number; limit?: number; sort?: HostSortKey; dir?: 'asc' | 'desc' };

function toFilter(q: FilterQuery): FleetFilter {
  const { site, serverClass, health, os, q: text } = q;
  return { site, serverClass, health, os, q: text };
}

export interface SandboxApp {
  app: FastifyInstance;
  /** The current world (replaced by load and reset). */
  live: LiveWorld;
  /** Call after each simulation tick so live terminal programs (tail -f) update. */
  onTick(): void;
}

export interface AppOptions {
  logger?: boolean;
  /** Claude grading for interviews; defaults to on only when ANTHROPIC_API_KEY is set. */
  aiGrader?: AiGrader | null;
  /** Session database for save/load; null disables saving. */
  store?: SessionStore | null;
}

export function buildApp(world: World, opts: AppOptions = {}): SandboxApp {
  const app = Fastify({ logger: opts.logger ?? false });
  const definitions = loadScenarioDefinitions();
  if (!world.scenarios.definitions.length) configureScenarios(world, definitions);
  const live = new LiveWorld(world);
  const store = opts.store ?? null;
  const terminals = registerTerminal(app, live);
  registerSearch(app, live);
  registerScenarios(app, live);
  registerConsoles(app, live);
  registerPlatform(app, live, store);
  registerSecurity(app, live, store);
  registerIdentity(app, live, store);
  registerIntegrations(app, live, store);
  registerMaintenance(app, live, store);
  registerServiceHealth(app, live, store);
  registerDataModels(app, live, store);
  registerInterview(
    app,
    live,
    opts.aiGrader !== undefined ? opts.aiGrader : aiGradingEnabled() ? createAiGrader() : null,
    () => store?.practisedScenarios(live.world.config.profileId) ?? [],
  );
  registerSessions(app, live, definitions, store);
  registerProfiles(app, live, definitions, store);
  registerTraining(app, live, () => {
    store?.checkpoint(live.world);
  });
  registerLearn(app, live, store);
  registerKvStore(app, live, () => {
    store?.checkpoint(live.world);
  });
  registerForwarders(app, live, () => store?.checkpoint(live.world));
  registerIndexes(app, live, () => store?.checkpoint(live.world));
  registerInputs(app, live, () => store?.checkpoint(live.world));
  registerReports(app, live, store);
  registerDashboards(app, live, store);
  registerClusters(app, live, store);
  registerShc(app, live, store);

  app.setErrorHandler((err: Error & { validation?: unknown }, _req, reply) => {
    if (
      err instanceof KvError ||
      err instanceof OperationsError ||
      err instanceof TrainingError ||
      err instanceof ProfileError ||
      err instanceof ScenarioError ||
      err instanceof FilterError ||
      err instanceof SaveError ||
      err.validation
    )
      return reply.code(400).send({ error: err.message });
    app.log.error(err);
    return reply.code(500).send({ error: 'Internal error' });
  });

  app.get('/api/health', async () => ({ ok: true }));

  // Read-only Milestone 0 preflight; no settings or knowledge objects are activated.
  app.get('/api/engineering/migration', async () => engineeringMigrationPreview(live.world));

  app.get('/api/world', async () => worldInfo(live.world));

  app.get('/api/hosts/roster', async () => sshRoster(live.world));

  app.post<{ Body: { paused?: boolean; speed?: number } }>(
    '/api/world/clock',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          properties: { paused: { type: 'boolean' }, speed: { type: 'number', enum: [...CLOCK_SPEEDS] } },
        },
      },
    },
    async (req) => {
      setClock(live.world, req.body);
      return worldInfo(live.world);
    },
  );

  app.get<{ Querystring: FilterQuery }>(
    '/api/fleet/summary',
    { schema: { querystring: { type: 'object', properties: filterProps } } },
    async (req) => summarizeFleet(live.world, toFilter(req.query)),
  );

  app.get<{ Querystring: HostsQuery }>(
    '/api/fleet/hosts',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            ...filterProps,
            offset: { type: 'integer', minimum: 0, default: 0 },
            limit: { type: 'integer', minimum: 1, maximum: 500, default: 100 },
            sort: {
              type: 'string',
              enum: ['hostname', 'lastPhoneHome', 'health', 'site'],
              default: 'hostname',
            },
            dir: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        },
      },
    },
    async (req) => {
      const { offset, limit, sort, dir } = req.query;
      return listHosts(live.world, toFilter(req.query), { offset, limit, sort, dir });
    },
  );

  return { app, live, onTick: () => terminals.tickAll() };
}
import { registerReports } from './reports';

import { registerDashboards } from './dashboards';

import { registerClusters } from './clusters';

import { registerShc } from './shc';
