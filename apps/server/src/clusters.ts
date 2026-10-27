import type { FastifyInstance } from 'fastify';
import {
  setClusterSiteOutage,
  smartStoreView,
  evictSmartStoreBucket,
  setSmartStoreRemoteAvailability,
  enableClusterManagement,
  advancedClusterHealth,
  clusterManager,
  clusterSourceRevision,
  inspectClusterBundle,
  clusterConfigView,
  stageClusterBundleFile,
  validateManagedClusterBundle,
  queueIndexerBundle,
  queueIndexerRestart,
  abortClusterJob,
  resumeClusterJob,
  practicePrincipal,
  requireCapability,
  OperationsError,
  resolveHost,
  restartSplunk,
  tickWorld,
} from '@sandbox/sim';
import { stageClusterSettings, setClusterMaintenance } from '@sandbox/sim';
import type { LiveWorld } from './live';
import type { SessionStore } from './store';
const text = { type: 'string', maxLength: 300 },
  principal = { type: 'string', enum: ['admin', 'analyst', 'operator'] };
export function registerClusters(app: FastifyInstance, live: LiveWorld, store: SessionStore | null) {
  const guard = (c: string, p?: string) => {
    if (c !== live.context)
      throw new OperationsError('The active environment or lesson changed; review this view before writing');
    requireCapability(
      live.world,
      clusterManager(live.world).hostname,
      practicePrincipal(p),
      'edit_indexer_cluster',
    );
  };
  const current = (host: string, revision: string) => {
    if (clusterSourceRevision(live.world, host) !== revision)
      throw new OperationsError('Configuration source changed; review it before applying');
  };
  app.get('/api/clusters', async () => {
    const manager = clusterManager(live.world),
      health = advancedClusterHealth(live.world);
    return {
      context: live.context,
      enabled: !!live.world.clusterManagement,
      health,
      managerRevision: clusterSourceRevision(live.world, manager.hostname),
      revisions: Object.fromEntries(
        [manager.hostname, ...health.members.map((m) => m.host)].map((h) => [
          h,
          clusterSourceRevision(live.world, h),
        ]),
      ),
      smartstore: smartStoreView(live.world),
      bundle: inspectClusterBundle(live.world, manager),
      configs: Object.fromEntries(
        [manager.hostname, ...health.members.map((m) => m.host)].map((h) => [
          h,
          clusterConfigView(live.world, h),
        ]),
      ),
      state: live.world.clusterManagement ?? null,
      now: live.world.clock.now,
    };
  });
  app.post<{
    Body: {
      context: string;
      principal?: string;
      action: string;
      revision?: string;
      host?: string;
      settings?: Record<string, string>;
      jobId?: string;
      enabled?: boolean;
      siteOrder?: string[];
      path?: string;
      text?: string;
      bucketId?: string;
      site?: string;
    };
  }>(
    '/api/clusters/action',
    {
      schema: {
        body: {
          type: 'object',
          additionalProperties: false,
          required: ['context', 'action'],
          properties: {
            context: text,
            principal,
            site: text,
            bucketId: text,
            path: text,
            text: { type: 'string', maxLength: 100000 },
            action: {
              type: 'string',
              enum: [
                'enable',
                'validate',
                'publish',
                'rolling-restart',
                'abort',
                'maintenance',
                'stage',
                'restart-host',
                'advance',
                'stage-bundle',
                'resume',
                'cache-evict',
                'remote-availability',
                'site-outage',
              ],
            },
            revision: text,
            host: text,
            settings: {
              type: 'object',
              maxProperties: 8,
              additionalProperties: { type: 'string', maxLength: 300 },
            },
            jobId: text,
            enabled: { type: 'boolean' },
            siteOrder: { type: 'array', maxItems: 10, items: text },
          },
        },
      },
    },
    async (req) => {
      const b = req.body;
      const fields: Record<string, string[]> = {
        'site-outage': ['site', 'enabled'],
        enable: [],
        validate: ['revision'],
        publish: ['revision'],
        'rolling-restart': ['revision', 'siteOrder'],
        abort: ['jobId'],
        resume: ['jobId'],
        maintenance: ['enabled'],
        stage: ['host', 'revision', 'settings'],
        'restart-host': ['host', 'revision'],
        advance: [],
        'stage-bundle': ['host', 'revision', 'path', 'text'],
        'cache-evict': ['bucketId', 'host'],
        'remote-availability': ['enabled'],
      };
      for (const key of Object.keys(b))
        if (!['context', 'principal', 'action', ...(fields[b.action] ?? [])].includes(key))
          throw new OperationsError('Unsupported field for this cluster action: ' + key);
      guard(b.context, b.principal);
      const w = live.world,
        manager = clusterManager(w);
      let result: unknown;
      if (b.action === 'enable') result = enableClusterManagement(w);
      else {
        if (!w.clusterManagement) throw new OperationsError('Enable V7 operational practice first');
        if (
          ['validate', 'publish', 'rolling-restart', 'stage', 'restart-host', 'stage-bundle'].includes(
            b.action,
          )
        ) {
          const host = b.action === 'stage' || b.action === 'restart-host' ? b.host : manager.hostname;
          if (!host || !b.revision) throw new OperationsError('Review the selected host and source revision');
          current(host, b.revision);
        }
        if (b.action === 'site-outage') {
          if (typeof b.enabled !== 'boolean')
            throw new OperationsError('Choose whether the site is unavailable');
          result = setClusterSiteOutage(w, b.site ?? '', b.enabled);
        } else if (b.action === 'cache-evict') result = evictSmartStoreBucket(w, b.bucketId ?? '', b.host);
        else if (b.action === 'remote-availability') {
          if (typeof b.enabled !== 'boolean') throw new OperationsError('Choose the remote availability');
          setSmartStoreRemoteAvailability(w, b.enabled);
          result = { available: b.enabled };
        } else if (b.action === 'stage-bundle') {
          if (b.host && b.host !== manager.hostname)
            throw new OperationsError('Stage bundle files on the manager');
          result = stageClusterBundleFile(w, b.path ?? '', b.text ?? '');
        } else if (b.action === 'validate') result = validateManagedClusterBundle(w, manager);
        else if (b.action === 'publish') result = queueIndexerBundle(w, manager);
        else if (b.action === 'rolling-restart') result = queueIndexerRestart(w, manager, b.siteOrder);
        else if (b.action === 'resume') result = resumeClusterJob(w, b.jobId ?? '');
        else if (b.action === 'abort') result = abortClusterJob(w, b.jobId ?? '');
        else if (b.action === 'maintenance') {
          if (typeof b.enabled !== 'boolean') throw new OperationsError('Choose the maintenance state');
          result = setClusterMaintenance(w, b.enabled);
        } else if (b.action === 'stage') result = stageClusterSettings(w, b.host ?? '', b.settings ?? {});
        else if (b.action === 'restart-host') {
          const p = resolveHost(w, b.host ?? '');
          if (!p?.splunk || !['indexer', 'cluster_manager'].includes(p.role))
            throw new OperationsError('Choose a cluster manager or peer');
          if (w.clusterManagement.jobs.some((j) => ['running', 'paused'].includes(j.status)))
            throw new OperationsError(
              'Finish or abort the active coordinated job before a separate service restart',
            );
          restartSplunk(w, p);
          result = { host: p.hostname, running: true };
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
