import type { FastifyInstance } from 'fastify';
import {
  resumeClusterJob,
  abortClusterJob,
  enableClusterManagement,
  shcHealth,
  inspectShcBundle,
  queueShcBundle,
  queueShcRestart,
  clusterSourceRevision,
  shcSourceFiles,
  shcBundleState,
  stageShcBundleFile,
  stageShcMemberSettings,
  shcMemberSettings,
  shcKnowledgeDifferences,
  practicePrincipal,
  OperationsError,
  resolveHost,
  stopSplunk,
  startSplunk,
  restartSplunk,
  tickWorld,
  kvStatus,
} from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
const text = { type: 'string', maxLength: 300 };
export function registerShc(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  app.get<{ Querystring: { principal?: string } }>('/api/shc', async (req) => {
    const w = live.world,
      health = shcHealth(w),
      node = w.infra.find((n) => n.role === 'deployer' && !n.retired),
      deployer = node && resolveHost(w, node.hostname);
    let bundle: ReturnType<typeof inspectShcBundle> | undefined,
      error = '';
    if (deployer) {
      try {
        bundle = inspectShcBundle(w, deployer);
      } catch (e) {
        error = (e as Error).message;
      }
    }
    return {
      context: live.context,
      enabled: !!w.clusterManagement,
      health,
      deployer: deployer?.hostname,
      sourceFiles: deployer ? shcSourceFiles(w, deployer.hostname) : {},
      bundleState: deployer && bundle ? shcBundleState(w, deployer.hostname) : null,
      bundle,
      bundleError: error,
      revisions: Object.fromEntries(
        [...(deployer ? [deployer.hostname] : []), ...health.members.map((m) => m.host)].map((h) => [
          h,
          clusterSourceRevision(w, h),
        ]),
      ),
      settings: Object.fromEntries(health.members.map((m) => [m.host, shcMemberSettings(w, m.host)])),
      objects: shcKnowledgeDifferences(w, practicePrincipal(req.query.principal)),
      kv: health.members.map((m) => kvStatus(w, m.host)),
      state: w.clusterManagement?.shc ?? null,
      jobs: w.clusterManagement?.jobs.filter((j) => j.kind.startsWith('shc-')) ?? [],
    };
  });
  app.post<{
    Body: {
      context: string;
      principal?: string;
      action: string;
      host?: string;
      revision?: string;
      path?: string;
      text?: string;
      operation?: string;
      jobId?: string;
      settings?: Record<string, string>;
    };
  }>(
    '/api/shc/action',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'action'],
          properties: {
            context: text,
            principal: { type: 'string', enum: ['admin', 'analyst', 'operator'] },
            action: {
              type: 'string',
              enum: [
                'enable',
                'stage',
                'stage-member',
                'publish',
                'rolling-restart',
                'service',
                'advance',
                'resume',
                'abort',
              ],
            },
            jobId: text,
            host: text,
            revision: text,
            path: text,
            text: { type: 'string', maxLength: 100000 },
            operation: { type: 'string', enum: ['stop', 'start', 'restart'] },
            settings: {
              type: 'object',
              maxProperties: 3,
              additionalProperties: { type: 'string', maxLength: 300 },
            },
          },
        },
      },
    },
    async (req) => {
      const b = req.body,
        w = live.world;
      const allowed: Record<string, string[]> = {
        resume: ['jobId'],
        abort: ['jobId'],
        enable: [],
        stage: ['host', 'revision', 'path', 'text'],
        'stage-member': ['host', 'revision', 'settings'],
        publish: ['host', 'revision'],
        'rolling-restart': ['host', 'revision'],
        service: ['host', 'revision', 'operation'],
        advance: [],
      };
      for (const key of Object.keys(b))
        if (!['context', 'principal', 'action', ...(allowed[b.action] ?? [])].includes(key))
          throw new OperationsError('Unsupported field for this SHC action: ' + key);
      if (b.context !== live.context)
        throw new OperationsError('The environment or lesson changed; review this page before writing');
      if (practicePrincipal(b.principal) !== 'admin')
        throw new OperationsError('SHC operations require the admin practice principal');
      let result: unknown;
      if (b.action === 'enable') result = enableClusterManagement(w);
      else {
        if (!w.clusterManagement) throw new OperationsError('Enable V7 operational practice first');
        if (['stage', 'stage-member', 'publish', 'rolling-restart', 'service'].includes(b.action)) {
          if (!b.host || !b.revision || clusterSourceRevision(w, b.host) !== b.revision)
            throw new OperationsError('Review the selected component and current source revision');
        }
        const p = b.host && resolveHost(w, b.host);
        if (b.action === 'resume' || b.action === 'abort') {
          const job = w.clusterManagement.jobs.find((j) => j.id === b.jobId && j.kind.startsWith('shc-'));
          if (!job) throw new OperationsError('Choose an existing SHC operation');
          result = b.action === 'resume' ? resumeClusterJob(w, job.id) : abortClusterJob(w, job.id);
        } else if (b.action === 'stage') result = stageShcBundleFile(w, b.host!, b.path ?? '', b.text ?? '');
        else if (b.action === 'stage-member') result = stageShcMemberSettings(w, b.host!, b.settings ?? {});
        else if (b.action === 'publish') {
          if (!p) throw new OperationsError('Choose the Deployer');
          result = queueShcBundle(w, p);
        } else if (b.action === 'rolling-restart') {
          if (!p) throw new OperationsError('Choose an SHC member');
          result = queueShcRestart(w, p);
        } else if (b.action === 'service') {
          if (!p || !shcHealth(w).members.some((m) => m.host === p.hostname))
            throw new OperationsError('Choose an SHC member');
          if (
            w.clusterManagement.jobs.some(
              (j) => j.kind.startsWith('shc-') && ['running', 'paused'].includes(j.status),
            )
          )
            throw new OperationsError(
              'Finish the coordinated SHC operation before a separate service change',
            );
          if (b.operation === 'stop') stopSplunk(w, p);
          else if (b.operation === 'start') startSplunk(w, p);
          else if (b.operation === 'restart') restartSplunk(w, p);
          else throw new OperationsError('Choose the service action');
          result = { host: p.hostname, operation: b.operation };
        } else if (b.action === 'advance') {
          tickWorld(w, 1);
          result = { now: w.clock.now };
        }
      }
      store?.checkpoint(w);
      return result;
    },
  );
}
