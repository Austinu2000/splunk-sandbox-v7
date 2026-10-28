import { parse } from 'yaml';
import type { World } from '../world';
import { OperationsError } from './access';
import { receiveHec } from './hec';
import { integrationReceipt, persistIntegrations, requireKeys } from './integration-state';
export const PRACTICE_HEC = 'https://hec.practice.invalid:8088/services/collector';
interface Exporter {
  endpoint: string;
  token: string;
  index: string;
  source?: string;
  sourcetype?: string;
}
interface Pipeline {
  receivers: string[];
  processors?: string[];
  exporters: string[];
}
export function parseCollector(source: string) {
  let raw: unknown;
  try {
    raw = parse(source, { maxAliasCount: 0 });
  } catch {
    throw new OperationsError('Invalid Collector YAML');
  }
  const top = requireKeys(raw, ['receivers', 'processors', 'exporters', 'service'], 'Collector'),
    receivers = requireKeys(top.receivers, ['otlp'], 'Collector receiver'),
    otlp = requireKeys(receivers.otlp, ['protocols'], 'OTLP receiver');
  const protocols = requireKeys(otlp.protocols, ['grpc', 'http'], 'OTLP protocols');
  if (!Object.keys(protocols).length) throw new OperationsError('Enable an OTLP gRPC or HTTP receiver');
  for (const value of Object.values(protocols)) {
    if (value === null) continue;
    const protocol = requireKeys(value, ['endpoint'], 'OTLP protocol');
    if (
      protocol.endpoint !== undefined &&
      !['127.0.0.1:4317', '127.0.0.1:4318', '0.0.0.0:4317', '0.0.0.0:4318'].includes(
        String(protocol.endpoint),
      )
    )
      throw new OperationsError('Use a supplied fictional OTLP listen endpoint');
  }
  const processors =
    top.processors === undefined ? {} : requireKeys(top.processors, ['batch'], 'Collector processors');
  if (processors.batch !== undefined && processors.batch !== null) {
    const batch = requireKeys(processors.batch, ['timeout', 'send_batch_size'], 'batch processor');
    if (
      batch.send_batch_size !== undefined &&
      (!Number.isInteger(batch.send_batch_size) ||
        Number(batch.send_batch_size) < 1 ||
        Number(batch.send_batch_size) > 1000)
    )
      throw new OperationsError('Batch size must be 1–1000');
    if (batch.timeout !== undefined && !/^\d{1,3}s$/.test(String(batch.timeout)))
      throw new OperationsError('Use a bounded batch timeout in seconds');
  }
  const exporters = requireKeys(
      top.exporters,
      ['splunk_hec/traces', 'splunk_hec/logs'],
      'Collector exporters',
    ),
    parsed: Record<string, Exporter> = {};
  for (const [name, value] of Object.entries(exporters)) {
    const x = requireKeys(
      value,
      ['endpoint', 'token', 'index', 'source', 'sourcetype'],
      'Splunk HEC exporter',
    );
    if (
      x.endpoint !== PRACTICE_HEC ||
      typeof x.token !== 'string' ||
      x.token.length > 100 ||
      typeof x.index !== 'string' ||
      !['traces', 'app_logs'].includes(x.index) ||
      (x.source !== undefined && typeof x.source !== 'string') ||
      (x.sourcetype !== undefined && typeof x.sourcetype !== 'string')
    )
      throw new OperationsError(
        'Use the fixed fictional HEC endpoint and a supplied traces/app_logs exporter',
      );
    parsed[name] = x as unknown as Exporter;
  }
  const service = requireKeys(top.service, ['pipelines'], 'Collector service'),
    pipelines = requireKeys(service.pipelines, ['traces', 'logs'], 'Collector pipelines'),
    active: Record<string, Pipeline> = {};
  for (const [name, value] of Object.entries(pipelines)) {
    const p = requireKeys(value, ['receivers', 'processors', 'exporters'], 'signal pipeline');
    if (
      !Array.isArray(p.receivers) ||
      p.receivers.length !== 1 ||
      p.receivers[0] !== 'otlp' ||
      !Array.isArray(p.exporters) ||
      p.exporters.length !== 1 ||
      !parsed[String(p.exporters[0])] ||
      (p.processors !== undefined &&
        (!Array.isArray(p.processors) ||
          p.processors.length > 1 ||
          p.processors.some((v) => v !== 'batch' || !Object.hasOwn(processors, 'batch'))))
    )
      throw new OperationsError(
        'Reference defined OTLP/optional batch and exactly one defined exporter in each pipeline',
      );
    if (parsed[String(p.exporters[0])]!.index !== (name === 'traces' ? 'traces' : 'app_logs'))
      throw new OperationsError('Route each signal to its matching traces/app_logs events index');
    active[name] = p as unknown as Pipeline;
  }
  if (!Object.keys(active).length)
    throw new OperationsError('Enable at least one signal in service.pipelines');
  return { exporters: parsed, pipelines: active };
}
export function pollTelemetry(w: World) {
  const a = w.integrations?.otel;
  if (!a) throw new OperationsError('Telemetry practice is not initialized');
  try {
    if (!a.activeSource) throw new OperationsError('Activate the Collector source in this offline adapter');
    const config = parseCollector(a.activeSource);
    for (const record of [...a.pending]) {
      const signal = record.signal!,
        pipeline = config.pipelines[signal];
      if (!pipeline) {
        integrationReceipt(
          w,
          'otel',
          record.id,
          'failed',
          [],
          'Signal is not enabled in service.pipelines: ' + signal,
        );
        continue;
      }
      if (a.delivered.includes(record.id)) {
        a.pending = a.pending.filter((r) => r.id !== record.id);
        continue;
      }
      const out = config.exporters[pipeline.exporters[0]!]!;
      const result = receiveHec(w, a.host, out.endpoint, 'Splunk ' + out.token, {
        event: record.fields,
        fields: record.fields,
        index: out.index,
        sourcetype: out.sourcetype ?? 'otel',
        source: out.source ?? 'otelcol',
      });
      a.delivered.push(record.id);
      a.pending = a.pending.filter((r) => r.id !== record.id);
      integrationReceipt(w, 'otel', record.id, 'delivered', result.eventIds);
    }
  } catch (e) {
    integrationReceipt(w, 'otel', 'collector', 'failed', [], (e as Error).message);
  }
  persistIntegrations(w);
}
