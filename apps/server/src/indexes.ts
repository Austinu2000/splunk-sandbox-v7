import { indexBuckets, thawPracticeBucket } from '@sandbox/sim';
import type { FastifyInstance } from 'fastify';
import {
  changeIndex,
  indexCatalog,
  indexRevision,
  indexHost,
  clusteredIndexer,
  practicePrincipal,
  requireCapability,
  restartSplunk,
  removeIndex,
  OperationsError,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
export function registerIndexes(app: FastifyInstance, live: LiveWorld, checkpoint: () => void) {
  app.get<{ Querystring: { host?: string; index?: string } }>('/api/indexes/buckets', async (req) => ({
    buckets: indexBuckets(live.world)
      .filter(
        (b) =>
          (!req.query.host || b.host === req.query.host) && (!req.query.index || b.index === req.query.index),
      )
      .map(({ events, ...bucket }) => ({ ...bucket, eventCount: events.length })),
    scope: 'Recorded teaching data only; buckets contain at most 64 events per input operation.',
  }));
  app.post<{ Body: { id: string; principal?: string } }>(
    '/api/indexes/thaw',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['id'],
          properties: {
            id: { type: 'string', maxLength: 100 },
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
          },
        },
      },
    },
    async (req) => {
      const result = thawPracticeBucket(live.world, req.body.id, practicePrincipal(req.body.principal));
      checkpoint();
      return result;
    },
  );
  app.get<{ Querystring: { host?: string; principal?: string } }>(
    '/api/indexes',
    {
      schema: {
        querystring: {
          type: 'object',
          additionalProperties: false,
          properties: {
            host: { type: 'string', maxLength: 100 },
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
          },
        },
      },
    },
    async (req) => {
      const hosts = live.world.infra
        .filter((h) => h.role === 'indexer' && !h.retired)
        .map((h) => ({
          host: h.hostname,
          clustered: clusteredIndexer(live.world, indexHost(live.world, h.hostname)),
        }));
      const host = req.query.host || hosts[0]?.host || '';
      const principal = practicePrincipal(req.query.principal);
      return {
        host,
        hosts,
        principal,
        revision: indexRevision(live.world, host),
        indexes: indexCatalog(live.world, host, principal),
        declared: indexCatalog(live.world, host, principal, true),
      };
    },
  );
  app.post<{
    Body: {
      host: string;
      name: string;
      settings: Record<string, unknown>;
      create: boolean;
      principal?: string;
      revision?: string;
    };
  }>(
    '/api/indexes',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['host', 'name', 'settings', 'create'],
          properties: {
            host: { type: 'string', maxLength: 100 },
            name: { type: 'string', maxLength: 80 },
            settings: {
              type: 'object',
              maxProperties: 20,
              additionalProperties: {
                anyOf: [{ type: 'string', maxLength: 300 }, { type: 'number' }, { type: 'boolean' }],
              },
            },
            create: { type: 'boolean' },
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
            revision: { type: 'string', maxLength: 128 },
          },
        },
      },
    },
    async (req) => {
      const body = req.body;
      const result = changeIndex(live.world, body.host, body.name, body.settings, {
        create: body.create,
        principal: practicePrincipal(body.principal),
        expectedRevision: body.revision,
      });
      checkpoint();
      return result;
    },
  );
  app.post<{ Body: { host: string; principal?: string } }>(
    '/api/indexes/apply',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['host'],
          properties: {
            host: { type: 'string', maxLength: 100 },
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
          },
        },
      },
    },
    async (req) => {
      requireCapability(live.world, req.body.host, practicePrincipal(req.body.principal), 'indexes_edit');
      const host = indexHost(live.world, req.body.host);
      if (clusteredIndexer(live.world, host))
        throw new OperationsError('Apply clustered indexes through a manager bundle');
      restartSplunk(live.world, host);
      checkpoint();
      return { ok: true };
    },
  );
  app.delete<{ Body: { host: string; name: string; principal?: string } }>(
    '/api/indexes',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['host', 'name'],
          properties: {
            host: { type: 'string', maxLength: 100 },
            name: { type: 'string', maxLength: 80 },
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
          },
        },
      },
    },
    async (req) => {
      removeIndex(live.world, req.body.host, req.body.name, practicePrincipal(req.body.principal));
      checkpoint();
      return { ok: true };
    },
  );
}
