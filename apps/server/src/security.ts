import type { FastifyInstance } from 'fastify';
import {
  securityView,
  securityRevision,
  reviewNotable,
  respondToNotable,
  stageResponseAdapter,
  practicePrincipal,
  OperationsError,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
const text = { type: 'string', minLength: 1, maxLength: 300 };
export function registerSecurity(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get<{ Querystring: { host?: string; principal?: string } }>('/api/security', async (req) => {
    const hosts = live.world.infra
        .filter((h) => h.role === 'search_head' && !h.retired)
        .map((h) => h.hostname),
      host = req.query.host || hosts[0]!;
    if (!hosts.includes(host)) throw new OperationsError('Choose a search head');
    return {
      context: live.context,
      hosts,
      ...securityView(live.world, host, practicePrincipal(req.query.principal)),
    };
  });
  app.post<{
    Body: {
      context: string;
      host: string;
      revision: string;
      principal?: string;
      action: string;
      id?: string;
      source?: string;
      status?: 'new' | 'in-progress' | 'resolved';
      owner?: 'unassigned' | 'admin' | 'analyst' | 'operator';
      note?: string;
    };
  }>(
    '/api/security/action',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'host', 'revision', 'action'],
          properties: {
            context: text,
            host: text,
            revision: text,
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
            action: { type: 'string', enum: ['stage-response', 'review', 'respond'] },
            id: text,
            source: { type: 'string', maxLength: 5000 },
            status: { type: 'string', enum: ['new', 'in-progress', 'resolved'] },
            owner: { type: 'string', enum: ['unassigned', 'admin', 'analyst', 'operator'] },
            note: { type: 'string', maxLength: 2000 },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        w = live.world;
      if (b.context !== live.context)
        throw new OperationsError('Environment or lesson changed; review current security evidence');
      if (b.revision !== securityRevision(w, b.host))
        throw new OperationsError('Security evidence or adapter source changed; review before applying');
      const fields =
        b.action === 'stage-response'
          ? ['source']
          : b.action === 'review'
            ? ['id', 'status', 'owner', 'note']
            : ['id'];
      for (const k of Object.keys(b))
        if (!['context', 'host', 'revision', 'principal', 'action', ...fields].includes(k))
          throw new OperationsError('Unsupported field for this security action');
      const principal = practicePrincipal(b.principal);
      let result: unknown;
      if (b.action === 'stage-response') {
        if (!b.source) throw new OperationsError('Supply the fictional adapter source');
        result = stageResponseAdapter(w, b.host, b.source, principal);
      } else if (b.action === 'review') {
        if (!b.id || !b.status || !b.owner || !b.note)
          throw new OperationsError('Choose a notable, status, owner and note');
        result = reviewNotable(
          w,
          b.host,
          b.id,
          { status: b.status, owner: b.owner, note: b.note },
          principal,
        );
      } else {
        if (!b.id) throw new OperationsError('Choose a notable to respond to');
        result = respondToNotable(w, b.host, b.id, principal);
      }
      store?.checkpoint(w);
      return { result, revision: securityRevision(w, b.host) };
    },
  );
}
