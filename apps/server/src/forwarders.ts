import type { FastifyInstance } from 'fastify';
import {
  deploymentDraft,
  stageDeploymentApp,
  stageServerClass,
  publishDeployment,
  forwarderDetail,
  trackForwarder,
  installForwarderPackage,
  acceptForwarderLicense,
  setForwarderBoot,
  forwarderPackageVersion,
  packageFixture,
  resolveHost,
  startSplunk,
  stopSplunk,
  restartSplunk,
  tickWorld,
  requireCapability,
  practicePrincipal,
  OperationsError,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
const text = { type: 'string', maxLength: 300 },
  principal = { type: 'string', enum: ['admin', 'analyst', 'operator'] };
export function registerForwarders(app: FastifyInstance, live: LiveWorld, checkpoint: () => void) {
  const context = (value: string) => {
    if (value !== live.context)
      throw new OperationsError('Active environment or lesson changed; reload before modifying deployment');
  };
  app.get('/api/ds/config', async () => ({
    ...deploymentDraft(live.world),
    context: live.context,
    catalog: live.world.forwarders?.catalogs.at(-1)?.id ?? null,
  }));
  app.post<{
    Body: {
      context: string;
      revision: string;
      name: string;
      files: Record<string, string>;
      principal?: string;
    };
  }>(
    '/api/ds/apps',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'revision', 'name', 'files'],
          properties: {
            context: text,
            revision: text,
            name: text,
            principal,
            files: {
              type: 'object',
              minProperties: 1,
              maxProperties: 20,
              additionalProperties: { type: 'string', maxLength: 100000 },
            },
          },
        },
      },
    },
    async (req) => {
      context(req.body.context);
      const r = stageDeploymentApp(live.world, {
        ...req.body,
        principal: practicePrincipal(req.body.principal),
      });
      checkpoint();
      return r;
    },
  );
  app.post<{
    Body: {
      context: string;
      revision: string;
      name: string;
      whitelist: string[];
      blacklist: string[];
      apps: string[];
      restart: boolean;
      principal?: string;
    };
  }>(
    '/api/ds/serverclasses',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'revision', 'name', 'whitelist', 'blacklist', 'apps', 'restart'],
          properties: {
            context: text,
            revision: text,
            name: text,
            principal,
            whitelist: { type: 'array', minItems: 1, maxItems: 20, items: text },
            blacklist: { type: 'array', maxItems: 20, items: text },
            apps: { type: 'array', minItems: 1, maxItems: 30, items: text },
            restart: { type: 'boolean' },
          },
        },
      },
    },
    async (req) => {
      context(req.body.context);
      const r = stageServerClass(live.world, {
        ...req.body,
        principal: practicePrincipal(req.body.principal),
      });
      checkpoint();
      return r;
    },
  );
  app.post<{ Body: { context: string; revision: string; principal?: string } }>(
    '/api/ds/publish',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'revision'],
          properties: { context: text, revision: text, principal },
        },
      },
    },
    async (req) => {
      context(req.body.context);
      const r = publishDeployment(live.world, req.body.revision, practicePrincipal(req.body.principal));
      checkpoint();
      return r;
    },
  );
  app.get<{ Querystring: { host: string } }>(
    '/api/forwarders/detail',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          required: ['host'],
          properties: { host: text },
        },
      },
    },
    async (req) => ({ context: live.context, ...forwarderDetail(live.world, req.query.host) }),
  );
  app.post<{ Body: { context: string; host: string; action: string; package?: string; principal?: string } }>(
    '/api/forwarders/action',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'host', 'action'],
          properties: {
            context: text,
            host: text,
            action: {
              type: 'string',
              enum: ['track', 'stop', 'restart', 'install', 'upgrade', 'accept-start', 'enable-boot'],
            },
            package: text,
            principal,
          },
        },
      },
    },
    async (req) => {
      context(req.body.context);
      const w = live.world,
        p = resolveHost(w, req.body.host);
      if (!p || p.fleetRow === undefined) throw new OperationsError('Select a forwarder');
      requireCapability(
        w,
        w.infra.find((h) => h.role === 'deployment_server')!.hostname,
        practicePrincipal(req.body.principal),
        'edit_deployment_server',
      );
      if (['install', 'upgrade'].includes(req.body.action)) {
        const path = req.body.package ?? '',
          version = forwarderPackageVersion(path);
        if (!version) throw new OperationsError('Choose a verified local teaching package');
        installForwarderPackage(w, p.hostname, path, packageFixture(version), req.body.action === 'upgrade');
      } else {
        trackForwarder(w, p.hostname);
        if (req.body.action === 'stop') stopSplunk(w, p);
        if (req.body.action === 'restart') restartSplunk(w, p);
        if (req.body.action === 'accept-start') {
          acceptForwarderLicense(w, p.hostname);
          startSplunk(w, p);
        }
        if (req.body.action === 'enable-boot') setForwarderBoot(w, p.hostname, true);
      }
      checkpoint();
      return forwarderDetail(w, p.hostname);
    },
  );
  app.post<{ Body: { context: string } }>(
    '/api/forwarders/advance',
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
      context(req.body.context);
      tickWorld(live.world, Math.ceil(60000 / live.world.config.tickMs));
      checkpoint();
      return { now: live.world.clock.now };
    },
  );
}
