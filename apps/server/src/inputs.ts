import type { FastifyInstance } from 'fastify';
import {
  configureMonitor,
  uploadPracticeFile,
  practicePrincipal,
  resolveHost,
  tickWorld,
  OperationsError,
  configureHec,
  receiveHec,
} from '@sandbox/sim';
import { runningConf } from '@sandbox/sim';
import type { LiveWorld } from './live';
export function registerInputs(app: FastifyInstance, live: LiveWorld, checkpoint: () => void) {
  app.post<{
    Body: {
      host: string;
      name: string;
      index: string;
      indexes?: string;
      sourcetype: string;
      disabled?: boolean;
      principal?: string;
    };
  }>(
    '/api/inputs/hec',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['host', 'name', 'index', 'sourcetype'],
          properties: {
            host: { type: 'string', maxLength: 100 },
            name: { type: 'string', maxLength: 64 },
            index: { type: 'string', maxLength: 80 },
            indexes: { type: 'string', maxLength: 300 },
            sourcetype: { type: 'string', maxLength: 100 },
            disabled: { type: 'boolean' },
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        result = configureHec(live.world, b.host, b.name, b, practicePrincipal(b.principal));
      checkpoint();
      return result;
    },
  );
  app.post<{ Body: { host: string; token: string; event: unknown; index?: string; sourcetype?: string } }>(
    '/api/inputs/hec/event',
    {
      bodyLimit: 100000,
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['host', 'token', 'event'],
          properties: {
            host: { type: 'string', maxLength: 100 },
            token: { type: 'string', maxLength: 100 },
            event: {},
            index: { type: 'string', maxLength: 80 },
            sourcetype: { type: 'string', maxLength: 100 },
          },
        },
      },
    },
    async (req) => {
      const { host, token, ...event } = req.body;
      const result = receiveHec(
        live.world,
        host,
        'https://' + host + ':8088/services/collector/event',
        'Splunk ' + token,
        event,
      );
      checkpoint();
      return result;
    },
  );
  app.get<{ Querystring: { host?: string } }>('/api/inputs', async (req) => {
    const hosts = live.world.infra
      .filter((h) => !h.retired && h.role !== 'automation')
      .map((h) => h.hostname);
    const name = req.query.host || hosts.find((h) => resolveHost(live.world, h)?.role === 'indexer') || '';
    const host = resolveHost(live.world, name);
    if (!host?.splunk) throw new OperationsError('Choose a virtual Splunk host');
    const conf = runningConf(live.world, host, 'inputs');
    return {
      host: name,
      hosts,
      inputs: [...conf.stanzas]
        .filter(
          ([name]) =>
            name.startsWith('monitor://') ||
            name.startsWith('http://') ||
            name.startsWith('WinEventLog://') ||
            /^(tcp|udp):/.test(name),
        )
        .map(([stanza, value]) => ({
          stanza,
          sourcePath: value.path,
          settings: Object.fromEntries(
            [...value.settings].map(([key, val]) => [
              key,
              /token|password/i.test(key) ? '[redacted]' : val.value,
            ]),
          ),
        })),
      status: Object.values(live.world.ingestion?.status ?? {}).filter((s) => s.host === name),
      recordedEvents: live.world.ingestion?.events.filter((e) => e.host === name).length ?? 0,
    };
  });
  app.post<{
    Body: {
      host: string;
      path: string;
      index: string;
      sourcetype: string;
      content?: string;
      principal?: string;
    };
  }>(
    '/api/inputs/monitor',
    {
      bodyLimit: 300000,
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['host', 'path', 'index', 'sourcetype'],
          properties: {
            host: { type: 'string', maxLength: 100 },
            path: { type: 'string', maxLength: 300 },
            index: { type: 'string', maxLength: 80 },
            sourcetype: { type: 'string', maxLength: 100 },
            content: { type: 'string', maxLength: 250000 },
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        principal = practicePrincipal(b.principal);
      if (b.content !== undefined && (!b.path.startsWith('/var/log/practice/') || b.path.includes('..')))
        throw new OperationsError('Uploaded training files must use /var/log/practice/');
      configureMonitor(
        live.world,
        b.host,
        b.path,
        { index: b.index, sourcetype: b.sourcetype, disabled: 'false' },
        principal,
      );
      if (b.content !== undefined) uploadPracticeFile(live.world, b.host, b.path, b.content, principal);
      const before = live.world.ingestion?.events.length ?? 0;
      tickWorld(live.world, 1);
      checkpoint();
      return {
        ok: true,
        ingested: (live.world.ingestion?.events.length ?? 0) - before,
        status: Object.values(live.world.ingestion?.status ?? {}).filter((s) => s.host === b.host),
      };
    },
  );
}
