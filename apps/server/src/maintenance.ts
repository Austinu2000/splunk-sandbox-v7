import type { FastifyInstance } from 'fastify';
import {
  maintenanceView,
  tickWorld,
  stageEnterprisePackage,
  createConfigurationBackup,
  verifyConfigurationBackup,
  restoreConfigurationBackup,
  captureUpgradePreflight,
  queueEnterpriseUpgrade,
  resumeEnterpriseUpgrade,
  abortEnterpriseUpgrade,
  installEnterprisePackage,
  practicePrincipal,
  requireCapability,
  OperationsError,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
const text = { type: 'string', minLength: 1, maxLength: 300 };
export function registerMaintenance(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get('/api/maintenance', async () => ({ context: live.context, ...maintenanceView(live.world) }));
  app.post<{
    Body: {
      context: string;
      revision: string;
      principal?: string;
      action: string;
      host?: string;
      name?: string;
      id?: string;
      targets?: string[];
      acceptTrainingLicense?: boolean;
    };
  }>(
    '/api/maintenance/action',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'revision', 'action'],
          properties: {
            context: text,
            revision: text,
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
            action: {
              type: 'string',
              enum: [
                'stage-package',
                'backup',
                'verify',
                'restore',
                'preflight',
                'queue',
                'resume',
                'abort',
                'install',
                'advance',
              ],
            },
            host: text,
            name: text,
            id: text,
            targets: { type: 'array', minItems: 1, maxItems: 20, uniqueItems: true, items: text },
            acceptTrainingLicense: { type: 'boolean' },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        w = live.world;
      if (b.context !== live.context)
        throw new OperationsError('Environment or lesson changed; review maintenance again');
      if (b.revision !== maintenanceView(w).revision)
        throw new OperationsError('Source, service, backup or job state changed; review maintenance again');
      const fields: Record<string, string[]> = {
        'stage-package': ['host'],
        backup: ['host', 'name'],
        verify: ['host', 'id'],
        restore: ['host', 'id'],
        preflight: ['targets'],
        queue: ['id', 'acceptTrainingLicense'],
        resume: ['id'],
        abort: ['id'],
        install: ['host'],
        advance: ['id'],
      };
      for (const key of Object.keys(b))
        if (!['context', 'revision', 'principal', 'action', ...fields[b.action]!].includes(key))
          throw new OperationsError('Unsupported field for this maintenance action');
      const selected =
        b.host ??
        b.targets?.[0] ??
        w.maintenance?.jobs.find((j) => j.id === b.id)?.targets[0] ??
        w.maintenance?.preflights.find((f) => f.id === b.id)?.targets[0];
      if (!selected) throw new OperationsError('Choose a host, captured preflight or upgrade job');
      const guardedTargets = b.targets ??
        w.maintenance?.jobs.find((j) => j.id === b.id)?.targets ??
        w.maintenance?.preflights.find((f) => f.id === b.id)?.targets ?? [selected];
      for (const target of guardedTargets)
        requireCapability(w, target, practicePrincipal(b.principal), 'indexes_edit');
      const host = () => {
          if (!b.host) throw new OperationsError('Choose a virtual Enterprise host');
          return b.host;
        },
        id = () => {
          if (!b.id) throw new OperationsError('Choose the retained archive, preflight or job');
          return b.id;
        };
      let result: unknown;
      if (b.action === 'stage-package') result = stageEnterprisePackage(w, host());
      else if (b.action === 'backup') {
        if (!b.name) throw new OperationsError('Name the configuration archive');
        result = createConfigurationBackup(w, host(), b.name);
      } else if (b.action === 'verify') result = verifyConfigurationBackup(w, host(), id());
      else if (b.action === 'restore') result = restoreConfigurationBackup(w, host(), id());
      else if (b.action === 'preflight') {
        if (!b.targets) throw new OperationsError('Choose the maintenance targets');
        result = captureUpgradePreflight(w, b.targets);
      } else if (b.action === 'queue')
        result = queueEnterpriseUpgrade(w, id(), b.acceptTrainingLicense === true);
      else if (b.action === 'resume') result = resumeEnterpriseUpgrade(w, id());
      else if (b.action === 'abort') result = abortEnterpriseUpgrade(w, id());
      else if (b.action === 'advance') {
        const job = w.maintenance?.jobs.find((j) => j.id === id());
        if (!job || job.status !== 'running')
          throw new OperationsError('Choose a running upgrade before advancing the shared simulation');
        tickWorld(w, 1);
        result = job;
      } else result = installEnterprisePackage(w, host());
      store?.checkpoint(w);
      return { result };
    },
  );
}
