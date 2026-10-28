import type { FastifyInstance } from 'fastify';
import type { IntegrationKind } from '@sandbox/shared';
import {
  initializeIntegration,
  integrationRevision,
  INTEGRATION_PATHS,
  readIntegrationSource,
  stageIntegration,
  activateIntegration,
  pollIntegration,
  appendDatabaseRow,
  practicePrincipal,
  requireCapability,
  OperationsError,
  type IntegrationSource,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
const kinds = ['aws', 'otel', 'cribl', 'database'];
const text = { type: 'string', maxLength: 300 };
export function registerIntegrations(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get<{ Querystring: { kind?: IntegrationKind } }>('/api/integrations', async (req) => {
    const kind = req.query.kind ?? 'aws';
    if (!kinds.includes(kind)) throw new OperationsError('Choose a supported offline integration');
    const runtime = live.world.integrations?.[kind],
      host = runtime?.host ?? (kind === 'database' ? 'sh01' : 'hf01'),
      names =
        kind === 'aws' ? ['aws', 'awsPolicy'] : kind === 'cribl' ? ['cribl', 'criblAvailability'] : [kind];
    return {
      context: live.context,
      kind,
      host,
      initialized: !!runtime,
      revision: runtime ? integrationRevision(live.world, kind) : '',
      runtime: runtime ?? null,
      sources: Object.fromEntries(
        names.map((n) => [
          n,
          {
            path: INTEGRATION_PATHS[n as IntegrationSource],
            source: runtime
              ? readIntegrationSource(live.world, host, INTEGRATION_PATHS[n as IntegrationSource])
              : '',
          },
        ]),
      ),
      receipts: live.world.integrations?.receipts.filter((r) => r.kind === kind) ?? [],
    };
  });
  app.post<{
    Body: {
      context: string;
      kind: IntegrationKind;
      revision?: string;
      principal?: string;
      action: 'initialize' | 'stage' | 'activate' | 'poll' | 'append-row';
      sourceName?: IntegrationSource;
      source?: string;
      row?: { id: number; service: string; status: number };
    };
  }>(
    '/api/integrations/action',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'kind', 'action'],
          properties: {
            context: text,
            kind: { type: 'string', enum: kinds },
            revision: text,
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
            action: { type: 'string', enum: ['initialize', 'stage', 'activate', 'poll', 'append-row'] },
            sourceName: { type: 'string', enum: Object.keys(INTEGRATION_PATHS) },
            source: { type: 'string', maxLength: 50000 },
            row: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'service', 'status'],
              properties: {
                id: { type: 'integer', minimum: 1, maximum: 1000000000 },
                service: { type: 'string', maxLength: 64 },
                status: { type: 'integer', minimum: 100, maximum: 599 },
              },
            },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        w = live.world,
        p = practicePrincipal(b.principal);
      if (b.context !== live.context)
        throw new OperationsError('Environment or lesson changed; review this integration');
      if (b.action !== 'initialize' && b.revision !== integrationRevision(w, b.kind))
        throw new OperationsError('Source, pending data or delivery state changed; review before applying');
      const fields =
        b.action === 'stage' ? ['sourceName', 'source'] : b.action === 'append-row' ? ['row'] : [];
      for (const k of Object.keys(b))
        if (!['context', 'kind', 'revision', 'principal', 'action', ...fields].includes(k))
          throw new OperationsError('Unsupported field for this integration action');
      let result: unknown;
      if (b.action === 'initialize') {
        requireCapability(w, b.kind === 'database' ? 'sh01' : 'hf01', p, 'indexes_edit');
        result = initializeIntegration(w, b.kind);
      } else if (b.action === 'stage') {
        if (!b.sourceName || !b.source) throw new OperationsError('Supply the integration source');
        result = stageIntegration(w, b.kind, b.sourceName, b.source, p);
      } else if (b.action === 'activate') result = activateIntegration(w, b.kind, p);
      else if (b.action === 'poll') result = pollIntegration(w, b.kind, p);
      else {
        if (b.kind !== 'database' || !b.row)
          throw new OperationsError('Append a row only to the fictional database');
        requireCapability(w, w.integrations!.database!.host, p, 'indexes_edit');
        result = appendDatabaseRow(w, b.row);
      }
      store?.checkpoint(w);
      return { result };
    },
  );
}
