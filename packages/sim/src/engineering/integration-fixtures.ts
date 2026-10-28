import { stringify } from 'yaml';
import type { IntegrationKind } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { patchConf } from '../scenario/engine';
import { applyClusterBundle } from '../hosts/cluster';
import { restartSplunk } from '../hosts/running';
import { configureHec } from './hec';
import { kvConfigureCollection, kvWrite, kvStatus, kvCollections, kvRead } from '../kvstore/engine';
import { OperationsError, requireCapability } from './access';
import {
  INTEGRATION_PATHS,
  integrationState,
  persistIntegrations,
  writeIntegrationSource,
  integrationSourceExists,
} from './integration-state';
import { AWS_BUCKET, AWS_INPUT_SOURCE, AWS_POLICY_SOURCE, VPC_PROPS } from './aws-practice';
import { PRACTICE_HEC } from './telemetry-practice';
import { DATABASE_SOURCE, DBX_APP, DBX_COLLECTION } from './database-practice';
export function collectorSource(token: string, traces = true) {
  return stringify({
    receivers: { otlp: { protocols: { grpc: { endpoint: '127.0.0.1:4317' } } } },
    processors: { batch: {} },
    exporters: {
      'splunk_hec/traces': { endpoint: PRACTICE_HEC, token, index: 'traces', sourcetype: 'v7_span' },
      'splunk_hec/logs': { endpoint: PRACTICE_HEC, token, index: 'app_logs', sourcetype: 'v7_otel_log' },
    },
    service: {
      pipelines: {
        ...(traces
          ? { traces: { receivers: ['otlp'], processors: ['batch'], exporters: ['splunk_hec/traces'] } }
          : {}),
        logs: { receivers: ['otlp'], processors: ['batch'], exporters: ['splunk_hec/logs'] },
      },
    },
  });
}
export const CRIBL_ROUTES_SOURCE = stringify({
  routes: [
    {
      id: 'drop_debug',
      name: 'Drop explicit debug noise',
      filter: "severity === 'debug'",
      output: 'devnull',
      final: true,
      pipeline: 'passthru',
    },
    {
      id: 'critical_to_splunk',
      name: 'Preserve operational events',
      filter: 'true',
      output: 'splunk_out',
      final: true,
      pipeline: 'passthru',
    },
  ],
});
/** Explicit opt-in fixtures add scoped native files/indexes; they never reset an existing adapter. */
export function initializeIntegration(w: World, kind: IntegrationKind) {
  if (!['lab', 'enterprise_lab_v1'].includes(w.config.profileId))
    throw new OperationsError(
      'Use Lab or Enterprise Automation Lab for these separate offline integration fixtures',
    );
  const s = integrationState(w);
  if (s[kind]) return s[kind]!;
  const host = kind === 'database' ? 'sh01' : 'hf01';
  requireCapability(w, host, 'admin', 'indexes_edit');
  if (!resolveHost(w, host)?.splunk || !resolveHost(w, 'cm01')?.splunk)
    throw new OperationsError('Use the Lab profile for these bounded integration fixtures');
  if (integrationSourceExists(w, host, INTEGRATION_PATHS[kind]))
    throw new OperationsError('An existing source occupies this practice path; it has been preserved');
  if (kind === 'database') {
    const kv = kvStatus(w, host);
    if (kv.status !== 'ready' || !kv.writable || !kv.membersInSync)
      throw new OperationsError('Initialize database practice only with a healthy, synchronized KV Store');
    if (
      kvCollections(w, host, DBX_APP).some((c) => c.collection === DBX_COLLECTION) &&
      kvRead(w, host, DBX_APP, DBX_COLLECTION, { _key: 'v7_inventory' }).length
    )
      throw new OperationsError('An existing v7_inventory checkpoint has been preserved');
  }
  const indexes =
      kind === 'aws'
        ? ['cloud_logs']
        : kind === 'otel'
          ? ['traces', 'app_logs']
          : kind === 'cribl'
            ? ['routed_logs']
            : ['db_logs'],
    cm = resolveHost(w, 'cm01')!,
    fs = hostFs(w, cm),
    bundle = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
  let native = fs.readFile(bundle, ROOT);
  for (const index of indexes) native = patchConf(native, index, { repFactor: 'auto' });
  fs.writeFile(bundle, native, ROOT);
  applyClusterBundle(w, cm);
  if (kind === 'aws') {
    const at = Math.floor(w.clock.now / 1000),
      flow = (action: string, port: number) =>
        '2 000000000000 eni-practice 10.0.0.10 10.0.1.20 52000 ' +
        port +
        ' 6 2 128 ' +
        at +
        ' ' +
        at +
        ' ' +
        action +
        ' OK',
      objects = [
        {
          bucket: AWS_BUCKET,
          key: 'flows/a.json',
          version: '1',
          raw: JSON.stringify({
            logEvents: [{ message: flow('ACCEPT', 443) }, { message: flow('REJECT', 22) }],
          }),
        },
        {
          bucket: AWS_BUCKET,
          key: 'flows/b.json',
          version: '1',
          raw: JSON.stringify({ logEvents: [{ message: flow('REJECT', 3389) }] }),
        },
      ];
    s.aws = {
      host,
      objects,
      messages: [
        ...objects.map((o, i) => ({
          id: 'sqs-' + i,
          bucket: o.bucket,
          key: o.key,
          version: o.version,
          acknowledged: false,
        })),
        { id: 'sqs-duplicate', bucket: AWS_BUCKET, key: 'flows/a.json', version: '1', acknowledged: false },
      ],
      processed: [],
    };
    writeIntegrationSource(w, host, INTEGRATION_PATHS.aws, AWS_INPUT_SOURCE);
    writeIntegrationSource(
      w,
      host,
      INTEGRATION_PATHS.awsPolicy,
      JSON.stringify(
        { ...JSON.parse(AWS_POLICY_SOURCE), Statement: JSON.parse(AWS_POLICY_SOURCE).Statement.slice(0, 1) },
        null,
        2,
      ),
    );
    writeIntegrationSource(w, 'sh01', '/opt/splunk/etc/apps/v7_aws/local/props.conf', VPC_PROPS);
    restartSplunk(w, resolveHost(w, 'sh01')!);
    restartSplunk(w, resolveHost(w, host)!);
  } else if (kind === 'otel') {
    const token = configureHec(w, host, 'v7_otel', {
      index: 'app_logs',
      indexes: 'traces,app_logs',
      sourcetype: 'otel',
    }).token;
    s.otel = {
      host,
      pending: [
        {
          id: 'span-root',
          signal: 'traces',
          fields: {
            trace_id: '11111111111111111111111111111111',
            span_id: '1111111111111111',
            parent_span_id: '',
            service_name: 'checkout',
            operation: 'POST /checkout',
            duration_ms: 450,
            status: 'ERROR',
          },
        },
        {
          id: 'span-child',
          signal: 'traces',
          fields: {
            trace_id: '11111111111111111111111111111111',
            span_id: '2222222222222222',
            parent_span_id: '1111111111111111',
            service_name: 'inventory',
            operation: 'reserve',
            duration_ms: 400,
            status: 'ERROR',
          },
        },
        {
          id: 'trace-log',
          signal: 'logs',
          fields: {
            trace_id: '11111111111111111111111111111111',
            span_id: '1111111111111111',
            service_name: 'checkout',
            message: 'reservation failed',
            severity: 'error',
          },
        },
      ],
      delivered: [],
    };
    writeIntegrationSource(w, host, INTEGRATION_PATHS.otel, collectorSource(token, false));
  } else if (kind === 'cribl') {
    const token = configureHec(w, host, 'v7_cribl', { index: 'routed_logs', sourcetype: 'v7_cribl' }).token;
    s.cribl = {
      host,
      pending: [
        {
          id: 'critical-1',
          fields: {
            event_id: 'critical-1',
            severity: 'error',
            service: 'checkout',
            message: 'payment failed',
          },
        },
        {
          id: 'critical-2',
          fields: {
            event_id: 'critical-2',
            severity: 'warn',
            service: 'authentication',
            message: 'login denied',
          },
        },
        {
          id: 'debug-1',
          fields: {
            event_id: 'debug-1',
            severity: 'debug',
            service: 'checkout',
            message: 'verbose heartbeat',
          },
        },
      ],
      delivered: [],
      dropped: [],
      highWater: 3,
    };
    writeIntegrationSource(
      w,
      host,
      INTEGRATION_PATHS.cribl,
      stringify({
        routes: [
          { id: 'all_to_splunk', filter: 'true', output: 'splunk_out', final: true, pipeline: 'passthru' },
        ],
      }),
    );
    writeIntegrationSource(
      w,
      host,
      INTEGRATION_PATHS.criblAvailability,
      JSON.stringify({ version: 1, available: false, token }, null, 2) + '\n',
    );
  } else {
    s.database = {
      host,
      rows: [
        { id: 1, service: 'checkout', status: 500 },
        { id: 2, service: 'auth', status: 200 },
        { id: 3, service: 'checkout', status: 200 },
      ],
      accepted: [],
    };
    kvConfigureCollection(w, host, DBX_APP, DBX_COLLECTION, {
      'field.checkpoint': 'number',
      enforceTypes: 'true',
    });
    kvWrite(w, host, DBX_APP, DBX_COLLECTION, [{ _key: 'v7_inventory', checkpoint: 0 }], 'upsert');
    writeIntegrationSource(
      w,
      host,
      INTEGRATION_PATHS.database,
      DATABASE_SOURCE.replace(' ORDER BY id ASC', ''),
    );
    restartSplunk(w, resolveHost(w, host)!);
  }
  persistIntegrations(w);
  return s[kind]!;
}
