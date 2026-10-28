import type { World } from '../world';
import { setClock, tickWorld } from '../world';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { applyClusterBundle } from '../hosts/cluster';
import { restartSplunk, stopSplunk } from '../hosts/running';
import { patchConf } from '../scenario/engine';
import { configureMonitor, uploadPracticeFile } from './ingestion';
import { registerIngestionBuffer, ingestionBufferView } from './ingestion-buffers';
import { inspectPlatform } from './platform';
import { saveReport, executeReport } from './reports';
import { activeDataModels, stageDataModel } from './data-models';
import { stageResponseAdapter, respondToNotable, RESPONSE_ADAPTER_SOURCE } from './security';
export type MonitoringFixtureMode =
  | 'health'
  | 'queue'
  | 'missing'
  | 'license'
  | 'storage'
  | 'scheduler'
  | 'logs'
  | 'performance'
  | 'cim'
  | 'acceleration'
  | 'detection'
  | 'response';
export type MonitoringFoundationCheck =
  | {
      kind: 'platform-observation';
      label: string;
      host?: string;
      recovered?: boolean;
      priorDown?: string;
      priorSkipped?: boolean;
    }
  | {
      kind: 'input-buffer';
      label: string;
      host: string;
      source: string;
      delivered: number;
      pending: number;
      minimumHighWater: number;
    }
  | { kind: 'data-model'; label: string; host: string; model: string; rows: number; sourceScan: number }
  | {
      kind: 'security-state';
      label: string;
      host: string;
      notables?: number;
      investigated?: boolean;
      ticket?: boolean;
      priorFailure?: boolean;
      idempotent?: boolean;
    };
export const CIM_PROPS =
  '[v7_auth]\nFIELDALIAS-user=account AS user\nFIELDALIAS-src=src_ip AS src\nEVAL-action=if(outcome="denied","failure","success")\n';
export const CIM_EVENTTYPES = '[v7_authentication]\nsearch=sourcetype=v7_auth\n';
export const CIM_TAGS = '[eventtype=v7_authentication]\nauthentication=enabled\n';
export const AUTH_MODEL_SOURCE = JSON.stringify(
  {
    modelName: 'Authentication',
    objects: [
      {
        objectName: 'Authentication',
        parentName: 'BaseEvent',
        constraints: [{ search: 'index=ops_logs sourcetype=v7_auth tag=authentication' }],
        fields: [
          { fieldName: 'user', type: 'string' },
          { fieldName: 'src', type: 'string' },
          { fieldName: 'action', type: 'string' },
        ],
      },
    ],
  },
  null,
  2,
);
function write(w: World, host: string, path: string, text: string) {
  const fs = hostFs(w, resolveHost(w, host)!);
  fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(path, text, ROOT);
}
export function configureCimFixture(w: World) {
  for (const [name, text] of Object.entries({ props: CIM_PROPS, eventtypes: CIM_EVENTTYPES, tags: CIM_TAGS }))
    write(w, 'sh01', '/opt/splunk/etc/apps/v7_cim/local/' + name + '.conf', text);
  restartSplunk(w, resolveHost(w, 'sh01')!);
}
export function setupMonitoringFixture(w: World, mode: MonitoringFixtureMode) {
  const auth = ['cim', 'acceleration', 'detection', 'response'].includes(mode),
    inputHost = mode === 'queue' || mode === 'missing' ? 'hf01' : 'idx01',
    source = '/var/log/practice/operations.log';
  const cm = resolveHost(w, 'cm01')!,
    cmfs = hostFs(w, cm),
    bundle = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
  write(w, 'cm01', bundle, patchConf(cmfs.readFile(bundle, ROOT), 'ops_logs', { repFactor: 'auto' }));
  applyClusterBundle(w, cm);
  const rows = auth
    ? 'account=alice src_ip=10.0.0.1 outcome=denied\naccount=alice src_ip=10.0.0.1 outcome=denied\naccount=bob src_ip=10.0.0.2 outcome=allowed\n'
    : 'status=500 service=checkout latency_ms=400\nstatus=200 service=auth latency_ms=25\nstatus=500 service=checkout latency_ms=300\n';
  uploadPracticeFile(
    w,
    inputHost,
    source,
    mode === 'queue'
      ? Array.from({ length: 4 }, (_, i) => 'sequence=' + i + ' payload="' + 'x'.repeat(6000) + '"').join(
          '\n',
        ) + '\n'
      : rows,
  );
  if (mode === 'queue') {
    write(w, inputHost, '/opt/splunk/etc/system/local/limits.conf', '[thruput]\nmaxKBps=1\n');
    restartSplunk(w, resolveHost(w, inputHost)!);
    registerIngestionBuffer(w, inputHost, source);
  }
  configureMonitor(w, inputHost, mode === 'missing' ? '/var/log/practice/wrong.log' : source, {
    index: 'ops_logs',
    sourcetype: auth ? 'v7_auth' : 'v7_operations',
  });
  tickWorld(w, 1);
  if (mode === 'health') {
    stopSplunk(w, resolveHost(w, 'idx02')!);
    inspectPlatform(w, 'idx02');
  }
  if (mode === 'license') {
    uploadPracticeFile(
      w,
      'idx01',
      '/var/log/practice/noise.log',
      Array.from(
        { length: 20 },
        (_, i) => 'sequence=' + i + ' noisy=true payload="' + 'x'.repeat(500) + '"',
      ).join('\n') + '\n',
    );
    configureMonitor(w, 'idx01', '/var/log/practice/noise.log', {
      index: 'ops_logs',
      sourcetype: 'v7_noise',
    });
    tickWorld(w, 1);
  }
  if (mode === 'scheduler') {
    for (let i = 1; i <= 5; i++)
      saveReport(
        w,
        {
          host: 'sh01',
          app: 'search',
          owner: 'admin',
          sharing: 'App',
          title: 'Capacity report ' + i,
          search: 'index=ops_logs | stats count',
          scheduled: true,
          cron: '* * * * *',
        },
        { create: true },
      );
    tickWorld(w, Math.ceil((60000 - (w.clock.now % 60000)) / w.config.tickMs));
    inspectPlatform(w);
  }
  if (['acceleration', 'detection', 'response'].includes(mode)) configureCimFixture(w);
  if (mode === 'acceleration') {
    stageDataModel(w, 'sh01', 'v7_cim', AUTH_MODEL_SOURCE, { enabled: false, earliest: '-15m' });
    restartSplunk(w, resolveHost(w, 'sh01')!);
  }
  if (mode === 'response') {
    write(w, 'cm01', bundle, patchConf(cmfs.readFile(bundle, ROOT), 'notable', { repFactor: 'auto' }));
    applyClusterBundle(w, cm);
    const r = saveReport(
      w,
      {
        host: 'sh01',
        app: 'search',
        owner: 'admin',
        sharing: 'App',
        title: 'Authentication failure detection',
        search: 'index=ops_logs tag=authentication action=failure | stats count by user',
        alert: {
          type: 'custom',
          condition: 'search count > 1',
          relation: 'greater than',
          threshold: 0,
          digest: false,
          suppress: true,
          period: '5m',
          fields: ['user'],
          track: true,
          severity: 4,
          actions: ['notable'],
        },
      },
      { create: true },
    );
    executeReport(w, r.id);
    stageResponseAdapter(w, 'sh01', RESPONSE_ADAPTER_SOURCE.replace('training_valid', 'training_expired'));
    respondToNotable(w, 'sh01', w.security!.notables[0]!.id);
  }
  setClock(w, { paused: true });
}
/** Pure grading: no summary builds, searches, response creation or new observations. */
export function monitoringFoundationCheck(w: World, c: MonitoringFoundationCheck) {
  switch (c.kind) {
    case 'platform-observation': {
      const observations = (w.platform?.observations ?? []).filter((o) => !c.host || o.host === c.host),
        last = observations.at(-1);
      return (
        !!last &&
        (!c.priorDown || observations.some((o) => o.servicesDown.includes(c.priorDown!))) &&
        (!c.priorSkipped || observations.some((o) => o.schedulerSkipped > 0)) &&
        (!c.recovered ||
          (!last.servicesDown.length &&
            (!c.host || splunkdRunning(w, resolveHost(w, c.host)!)) &&
            observations.length >= 2))
      );
    }
    case 'input-buffer': {
      const b = ingestionBufferView(w).find((b) => b.host === c.host && b.source === c.source);
      return (
        !!b &&
        b.delivered === c.delivered &&
        b.pending === c.pending &&
        b.highWaterBytes >= c.minimumHighWater &&
        !b.lastError
      );
    }
    case 'data-model': {
      try {
        const model = activeDataModels(w, c.host, c.model)[0];
        return (
          !!model?.enabled &&
          !!w.dataModels?.summaries.some(
            (s) =>
              s.host === c.host &&
              s.model === c.model &&
              s.revision === model.revision &&
              s.rows.length === c.rows &&
              s.sourceScan === c.sourceScan,
          )
        );
      } catch {
        return false;
      }
    }
    case 'security-state': {
      const ns = w.security?.notables.filter((n) => n.host === c.host) ?? [];
      return (
        ns.length > 0 &&
        (c.notables === undefined || ns.length === c.notables) &&
        ns.some((n) => {
          const attempts = w.security?.attempts.filter((a) => a.notableId === n.id) ?? [],
            tickets = w.security?.tickets.filter((t) => t.notableId === n.id) ?? [];
          return (
            (!c.investigated || (n.notes.length > 0 && n.owner !== 'unassigned' && n.status !== 'new')) &&
            (!c.ticket || tickets.length === 1) &&
            (!c.priorFailure || attempts.some((a) => a.status === 'failed')) &&
            (!c.idempotent ||
              (attempts.some((a) => a.status === 'created') &&
                attempts.some((a) => a.status === 'existing') &&
                tickets.length === 1))
          );
        })
      );
    }
  }
}
