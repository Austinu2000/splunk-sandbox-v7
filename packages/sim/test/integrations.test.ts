import { readFileSync } from 'node:fs';
import { parse, stringify } from 'yaml';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  initializeIntegration,
  writeIntegrationSource,
  stageIntegration,
  activateIntegration,
  pollIntegration,
  readIntegrationSource,
  INTEGRATION_PATHS,
  AWS_POLICY_SOURCE,
  AWS_INPUT_SOURCE,
  CRIBL_ROUTES_SOURCE,
  DATABASE_SOURCE,
  appendDatabaseRow,
  kvRead,
  kvConfigureCollection,
  DBX_APP,
  DBX_COLLECTION,
  resolveHost,
  restartSplunk,
  stopSplunk,
  startSplunk,
  saveWorld,
  loadWorld,
  runSearch,
  tickWorld,
  parseCriblRoutes,
  parseCollector,
} from '../src';
const fresh = () =>
  createWorld({
    ...profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
    fleetSize: 50,
  });
const rows = (w: ReturnType<typeof fresh>, query: string) => {
  const r = runSearch(w, { search: query });
  expect(r.status).toBe('done');
  return r.results.map((v) => v.toObject());
};
describe('offline integrations deliver actual records and retain meaningful checkpoints', () => {
  it('retains denied SQS notifications, imports CloudWatch object messages and acknowledges duplicate versions without duplicate events', () => {
    const w = fresh();
    initializeIntegration(w, 'aws');
    pollIntegration(w, 'aws');
    expect(w.integrations!.receipts.at(-1)?.error).toContain('s3:GetObject');
    expect(w.integrations!.aws!.messages.every((m) => !m.acknowledged)).toBe(true);
    expect(w.ingestion?.events ?? []).toHaveLength(0);
    stageIntegration(w, 'aws', 'awsPolicy', AWS_POLICY_SOURCE);
    pollIntegration(w, 'aws');
    expect(w.integrations!.aws!.messages.every((m) => m.acknowledged)).toBe(true);
    expect(w.integrations!.receipts.filter((r) => r.status === 'duplicate')).toHaveLength(1);
    expect(rows(w, 'index=cloud_logs | stats count by action | sort action')).toEqual([
      { action: 'ACCEPT', count: 1 },
      { action: 'REJECT', count: 2 },
    ]);
    expect(rows(w, 'index=cloud_logs action=REJECT | stats count by dstport')).toHaveLength(2);
    const restored = loadWorld(saveWorld(w), []);
    expect(restored.integrations).toEqual(w.integrations);
    pollIntegration(restored, 'aws');
    expect(restored.ingestion!.events).toHaveLength(3);
    stageIntegration(
      w,
      'aws',
      'aws',
      AWS_INPUT_SOURCE.replace('aws_account=training_account', 'aws_account=missing'),
    );
    pollIntegration(w, 'aws');
    expect(w.integrations!.receipts.at(-1)?.status).toBe('empty');
    restartSplunk(w, resolveHost(w, 'hf01')!);
    pollIntegration(w, 'aws');
    expect(w.integrations!.receipts.at(-1)?.error).toContain('alias');
  });
  it('requires enabled Collector signal pipelines and effective HEC delivery, preserves trace correlation and retries only pending records', () => {
    const w = fresh();
    initializeIntegration(w, 'otel');
    activateIntegration(w, 'otel');
    pollIntegration(w, 'otel');
    expect(w.integrations!.otel!.pending).toHaveLength(2);
    expect(rows(w, 'index=app_logs | stats count')).toEqual([{ count: 1 }]);
    const source = readIntegrationSource(w, 'hf01', INTEGRATION_PATHS.otel),
      config = parse(source);
    config.service.pipelines.traces = {
      receivers: ['otlp'],
      processors: ['batch'],
      exporters: ['splunk_hec/traces'],
    };
    stageIntegration(w, 'otel', 'otel', stringify(config));
    pollIntegration(w, 'otel');
    expect(w.integrations!.otel!.pending).toHaveLength(2);
    activateIntegration(w, 'otel');
    stopSplunk(w, resolveHost(w, 'hf01')!);
    pollIntegration(w, 'otel');
    expect(w.integrations!.otel!.pending).toHaveLength(2);
    startSplunk(w, resolveHost(w, 'hf01')!);
    pollIntegration(w, 'otel');
    expect(w.integrations!.otel!.pending).toHaveLength(0);
    expect(rows(w, 'index=traces | stats count by trace_id')).toEqual([
      { trace_id: '11111111111111111111111111111111', count: 2 },
    ]);
    expect(
      rows(w, 'index=traces OR index=app_logs | stats dc(span_id) as spans count by trace_id')[0],
    ).toMatchObject({ spans: 2, count: 3 });
    pollIntegration(w, 'otel');
    expect(w.ingestion!.events).toHaveLength(3);
    expect(loadWorld(saveWorld(w), []).integrations).toEqual(w.integrations);
    expect(() => parseCollector(source.replace('splunk_hec/logs', 'unsupported_exporter'))).toThrow();
  });
  it('persists routing backpressure and drops only explicit debug noise after repair; arbitrary JavaScript is rejected', () => {
    const w = fresh();
    initializeIntegration(w, 'cribl');
    activateIntegration(w, 'cribl');
    pollIntegration(w, 'cribl');
    expect(w.integrations!.cribl!.pending).toHaveLength(3);
    expect(w.ingestion?.events ?? []).toHaveLength(0);
    const restored = loadWorld(saveWorld(w), []);
    expect(restored.integrations!.cribl!.pending).toEqual(w.integrations!.cribl!.pending);
    stageIntegration(restored, 'cribl', 'cribl', CRIBL_ROUTES_SOURCE);
    activateIntegration(restored, 'cribl');
    const destination = JSON.parse(
      readIntegrationSource(restored, 'hf01', INTEGRATION_PATHS.criblAvailability),
    );
    destination.available = true;
    stageIntegration(restored, 'cribl', 'criblAvailability', JSON.stringify(destination));
    pollIntegration(restored, 'cribl');
    expect(restored.integrations!.cribl!.pending).toHaveLength(0);
    expect(restored.integrations!.cribl!.dropped).toEqual(['debug-1']);
    expect(restored.integrations!.cribl!.delivered).toHaveLength(2);
    expect(rows(restored, 'index=routed_logs | stats count by severity')).toHaveLength(2);
    expect(rows(restored, 'index=routed_logs severity=debug | stats count')).toEqual([{ count: 0 }]);
    pollIntegration(restored, 'cribl');
    expect(restored.ingestion!.events).toHaveLength(2);
    expect(() =>
      parseCriblRoutes(CRIBL_ROUTES_SOURCE.replace("severity === 'debug'", 'process.exit()')),
    ).toThrow('arbitrary JavaScript');
  });
  it('uses native rising SQL with real KV checkpoints and replays accepted batches after checkpoint schema failure without duplicates', () => {
    const w = fresh();
    initializeIntegration(w, 'database');
    pollIntegration(w, 'database');
    expect(w.integrations!.receipts.at(-1)?.error).toContain('ORDER BY');
    expect(w.ingestion?.events ?? []).toHaveLength(0);
    stageIntegration(w, 'database', 'database', DATABASE_SOURCE);
    restartSplunk(w, resolveHost(w, 'sh01')!);
    kvConfigureCollection(w, 'sh01', DBX_APP, DBX_COLLECTION, {
      'field.checkpoint': 'string',
      enforceTypes: 'true',
    });
    pollIntegration(w, 'database');
    expect(w.integrations!.receipts.at(-1)?.status).toBe('failed');
    expect(w.ingestion!.events).toHaveLength(3);
    expect(kvRead(w, 'sh01', DBX_APP, DBX_COLLECTION)[0]?.checkpoint).toBe(0);
    const restored = loadWorld(saveWorld(w), []);
    kvConfigureCollection(restored, 'sh01', DBX_APP, DBX_COLLECTION, {
      'field.checkpoint': 'number',
      enforceTypes: 'true',
    });
    pollIntegration(restored, 'database');
    expect(restored.ingestion!.events).toHaveLength(3);
    expect(kvRead(restored, 'sh01', DBX_APP, DBX_COLLECTION)[0]?.checkpoint).toBe(3);
    appendDatabaseRow(restored, { id: 4, service: 'checkout', status: 200 });
    pollIntegration(restored, 'database');
    expect(kvRead(restored, 'sh01', DBX_APP, DBX_COLLECTION)[0]?.checkpoint).toBe(4);
    expect(rows(restored, 'index=db_logs | stats count dc(id) as ids')).toEqual([{ count: 4, ids: 4 }]);
    expect(() => appendDatabaseRow(restored, { id: 4, service: 'duplicate', status: 200 })).toThrow('unique');
    tickWorld(restored, 6);
    expect(restored.ingestion!.events).toHaveLength(4);
  });
  it('honors scoped IAM object resources and explicit deny while retaining a partially delivered queue for safe repair', () => {
    const w = fresh();
    initializeIntegration(w, 'aws');
    const policy = JSON.parse(AWS_POLICY_SOURCE);
    policy.Statement[1].Resource = 'arn:aws:s3:::sandbox-v7-vpcflow/flows/a.json';
    stageIntegration(w, 'aws', 'awsPolicy', JSON.stringify(policy));
    pollIntegration(w, 'aws');
    expect(w.ingestion!.events).toHaveLength(2);
    expect(w.integrations!.aws!.messages.filter((m) => !m.acknowledged)).toHaveLength(2);
    policy.Statement[1].Resource = 'arn:aws:s3:::sandbox-v7-vpcflow/*';
    policy.Statement.push({
      Effect: 'Deny',
      Action: 's3:GetObject',
      Resource: 'arn:aws:s3:::sandbox-v7-vpcflow/flows/b.json',
    });
    stageIntegration(w, 'aws', 'awsPolicy', JSON.stringify(policy));
    pollIntegration(w, 'aws');
    expect(w.ingestion!.events).toHaveLength(2);
    stageIntegration(w, 'aws', 'awsPolicy', AWS_POLICY_SOURCE);
    pollIntegration(w, 'aws');
    expect(w.ingestion!.events).toHaveLength(3);
    expect(w.integrations!.aws!.messages.every((m) => m.acknowledged)).toBe(true);
  });
  it('does not reset an existing adapter or overwrite another source occupying its practice path', () => {
    const w = fresh();
    initializeIntegration(w, 'aws');
    const before = saveWorld(w);
    initializeIntegration(w, 'aws');
    expect(saveWorld(w)).toEqual(before);
    expect(() => stageIntegration(w, 'aws', 'otel', '{}')).toThrow('belonging');
    const other = fresh();
    writeIntegrationSource(other, 'hf01', INTEGRATION_PATHS.aws, 'custom source preserved');
    expect(() => initializeIntegration(other, 'aws')).toThrow('preserved');
    expect(readIntegrationSource(other, 'hf01', INTEGRATION_PATHS.aws)).toBe('custom source preserved');
  });
});
