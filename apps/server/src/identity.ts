import type { FastifyInstance } from 'fastify';
import {
  clusterSourceRevision,
  identityConfigurationRevision,
  probeIdentity,
  stageIdentitySource,
  practicePrincipal,
  requireCapability,
  resolveHost,
  OperationsError,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
import { hostFs } from '../../../packages/sim/src/vfs/build';
import { ROOT } from '../../../packages/sim/src/vfs/vfs';
const text = { type: 'string', minLength: 1, maxLength: 300 };
export function registerIdentity(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get<{ Querystring: { host?: string; principal?: string } }>('/api/identity', async (req) => {
    const hosts = live.world.infra
        .filter((h) => h.role === 'search_head' && !h.retired)
        .map((h) => h.hostname),
      host = req.query.host || hosts[0]!,
      principal = practicePrincipal(req.query.principal);
    if (!hosts.includes(host)) throw new OperationsError('Choose a search head');
    requireCapability(live.world, host, principal, 'edit_roles');
    const p = resolveHost(live.world, host)!,
      fs = hostFs(live.world, p),
      source = (name: string) => {
        const path = p.splunk!.home + '/etc/system/local/' + name + '.conf';
        return fs.exists(path) ? fs.readFile(path, ROOT) : '';
      };
    return {
      context: live.context,
      host,
      hosts,
      revision: clusterSourceRevision(live.world, host),
      configRevision: identityConfigurationRevision(live.world, host),
      authentication: source('authentication'),
      authorize: source('authorize'),
      probes: live.world.identity?.probes.filter((p) => p.host === host) ?? [],
    };
  });
  app.post<{
    Body: {
      context: string;
      host: string;
      revision: string;
      principal?: string;
      action: 'stage' | 'probe';
      conf?: 'authentication' | 'authorize';
      source?: string;
      sample?: 'saml-reader' | 'ldap-reader';
    };
  }>(
    '/api/identity/action',
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
            action: { type: 'string', enum: ['stage', 'probe'] },
            conf: { type: 'string', enum: ['authentication', 'authorize'] },
            source: { type: 'string', maxLength: 30000 },
            sample: { type: 'string', enum: ['saml-reader', 'ldap-reader'] },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        w = live.world;
      if (b.context !== live.context)
        throw new OperationsError('Environment or lesson changed; review this identity editor');
      if (b.revision !== clusterSourceRevision(w, b.host))
        throw new OperationsError('Host source changed; review before applying');
      const fields = b.action === 'stage' ? ['conf', 'source'] : ['sample'];
      for (const k of Object.keys(b))
        if (!['context', 'host', 'revision', 'principal', 'action', ...fields].includes(k))
          throw new OperationsError('Unsupported field for this identity action');
      let result: unknown;
      if (b.action === 'stage') {
        if (!b.conf || !b.source) throw new OperationsError('Supply the native configuration source');
        result = stageIdentitySource(w, b.host, b.conf, b.source, practicePrincipal(b.principal));
      } else {
        if (!b.sample) throw new OperationsError('Choose a fictional identity sample');
        result = probeIdentity(w, b.host, b.sample, practicePrincipal(b.principal));
      }
      store?.checkpoint(w);
      return result;
    },
  );
}
