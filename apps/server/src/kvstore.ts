import type { FastifyInstance } from 'fastify';
import {
  kvState,
  kvNode,
  kvStatus,
  kvDefaultHost,
  kvCollections,
  kvConfigFiles,
  kvRead,
  kvWrite,
  kvDelete,
  kvDeleteCollection,
  kvInspect,
  kvBackup,
  kvRestore,
  kvFault,
  kvResync,
  kvConfigureCollection,
  kvStage,
  applyKvRestart,
  kvStartIncident,
  kvCloseIncident,
  KV_INCIDENTS,
  KV_APP,
  reloadAppConf,
  resolveHost,
  tickWorld,
  KvError,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
export function registerKvStore(app: FastifyInstance, live: LiveWorld, checkpoint: () => void) {
  app.get<{ Querystring: { host?: string; app?: string } }>('/api/kvstore', async (req) => {
    const w = live.world,
      s = kvState(w),
      host = req.query.host || kvDefaultHost(w),
      appName = req.query.app || KV_APP;
    kvNode(w, host);
    return {
      host,
      app: appName,
      nodes: s.nodes.map((n) => kvStatus(w, n.host)),
      collections: kvCollections(w, host, appName),
      files: kvConfigFiles(w, host, appName),
      backups: s.backups
        .filter((b) => b.domain === s.nodes.find((n) => n.host === host)?.domain)
        .map(({ rows, ...b }) => ({ ...b, records: Object.values(rows).reduce((n, r) => n + r.length, 0) })),
      evidence: s.evidence.slice(-100),
      incidents: s.incidents,
      catalog: KV_INCIDENTS.map(({ id, title, profile }) => ({ id, title, profile })),
    };
  });
  app.post<{
    Body: {
      action: string;
      host: string;
      app?: string;
      collection?: string;
      name?: string;
      text?: string;
      settings?: Record<string, string>;
      records?: unknown;
      query?: Record<string, unknown>;
      enabled?: boolean;
      mode?: 'insert' | 'upsert' | 'replace';
    };
  }>(
    '/api/kvstore/action',
    {
      schema: {
        body: {
          type: 'object',
          required: ['action', 'host'],
          additionalProperties: false,
          properties: {
            action: { type: 'string', maxLength: 30 },
            host: { type: 'string', maxLength: 100 },
            app: { type: 'string', maxLength: 64 },
            collection: { type: 'string', maxLength: 64 },
            name: { type: 'string', maxLength: 100 },
            text: { type: 'string', maxLength: 50000 },
            settings: { type: 'object', additionalProperties: { type: 'string', maxLength: 100 } },
            records: { type: 'array', maxItems: 10000 },
            query: { type: 'object' },
            enabled: { type: 'boolean' },
            mode: { type: 'string', enum: ['insert', 'upsert', 'replace'] },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        w = live.world,
        a = b.app ?? KV_APP,
        c = b.collection ?? 'assets';
      kvNode(w, b.host);
      let result: unknown = { ok: true };
      switch (b.action) {
        case 'inspect':
          result = kvInspect(w, b.host);
          break;
        case 'read':
          result = kvRead(w, b.host, a, c, b.query);
          break;
        case 'write':
          result = kvWrite(w, b.host, a, c, b.records, b.mode);
          break;
        case 'delete':
          result = kvDelete(w, b.host, a, c, b.query ?? {});
          break;
        case 'drop':
          kvDeleteCollection(w, b.host, a, c);
          break;
        case 'collection':
          kvConfigureCollection(w, b.host, a, c, b.settings ?? {});
          break;
        case 'stage':
          kvStage(w, b.host, a, b.name ?? '', b.text ?? '');
          break;
        case 'reload':
          reloadAppConf(w, resolveHost(w, b.host)!, a);
          break;
        case 'restart':
          applyKvRestart(w, b.host);
          break;
        case 'resync':
          kvResync(w, b.host);
          break;
        case 'backup':
          result = { archive: kvBackup(w, b.host, b.name ?? '') };
          break;
        case 'restore':
          kvRestore(w, b.host, b.name ?? '');
          break;
        case 'transport':
          kvFault(w, b.host, b.enabled === true);
          break;
        case 'advance':
          tickWorld(w, 1);
          break;
        case 'incident':
          result = kvStartIncident(w, b.name ?? '');
          break;
        case 'close':
          kvCloseIncident(w, b.name ?? '', b.text ?? '');
          break;
        default:
          throw new KvError('Unsupported KV Store action');
      }
      checkpoint();
      return result;
    },
  );
}
