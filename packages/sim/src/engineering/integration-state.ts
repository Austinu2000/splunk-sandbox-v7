import type { IntegrationKind, IntegrationReceipt } from '@sandbox/shared';
import type { World } from '../world';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { resolveHost } from '../hosts/profile';
import { checksum, filesUnder } from '../hosts/cluster';
import { journal } from '../journal';
import { OperationsError } from './access';
export const INTEGRATION_PATHS = {
  aws: '/opt/splunk/etc/apps/v7_aws/local/inputs.conf',
  awsPolicy: '/etc/v7-adapters/aws-policy.json',
  otel: '/etc/otelcol/config.yaml',
  cribl: '/opt/cribl/local/cribl/routes.yml',
  criblAvailability: '/etc/v7-adapters/cribl-destination.json',
  database: '/opt/splunk/etc/apps/splunk_app_db_connect/local/db_inputs.conf',
} as const;
export const integrationState = (w: World) => (w.integrations ??= { version: 1, nextId: 1, receipts: [] });
export function persistIntegrations(w: World) {
  journal(w, { k: 'integrations.state', state: structuredClone(w.integrations!) });
}
export function integrationReceipt(
  w: World,
  kind: IntegrationKind,
  sourceId: string,
  status: IntegrationReceipt['status'],
  eventIds: string[] = [],
  error?: string,
  checkpoint?: number,
) {
  const s = integrationState(w),
    r = {
      id: 'integration-' + s.nextId++,
      kind,
      tick: w.clock.tick,
      status,
      sourceId,
      eventIds,
      ...(error ? { error } : {}),
      ...(checkpoint === undefined ? {} : { checkpoint }),
    };
  s.receipts.push(r);
  s.receipts = s.receipts.slice(-500);
  persistIntegrations(w);
  return r;
}
export function integrationHost(w: World, kind: IntegrationKind) {
  const adapter = w.integrations?.[kind];
  if (!adapter) throw new OperationsError('Initialize this separate offline practice fixture first');
  return adapter.host;
}
export function readIntegrationSource(w: World, host: string, path: string) {
  const p = resolveHost(w, host);
  if (!p?.splunk) throw new OperationsError('Choose a virtual Splunk host');
  const fs = hostFs(w, p);
  return fs.exists(path) ? fs.readFile(path, ROOT) : '';
}
export function writeIntegrationSource(w: World, host: string, path: string, source: string) {
  const p = resolveHost(w, host);
  if (!p?.splunk) throw new OperationsError('Choose a virtual Splunk host');
  const fs = hostFs(w, p);
  fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(path, source, ROOT);
  fs.setMeta(path, { owner: 'splunk', group: 'splunk', mode: 0o600 }, ROOT);
}
export function integrationRevision(w: World, kind: IntegrationKind) {
  const host = integrationHost(w, kind),
    p = resolveHost(w, host)!;
  return checksum({
    kind,
    state: JSON.stringify(w.integrations?.[kind]),
    native: JSON.stringify(filesUnder(hostFs(w, p), p.splunk!.home + '/etc')),
    source: readIntegrationSource(w, host, INTEGRATION_PATHS[kind]),
    policy:
      kind === 'aws'
        ? readIntegrationSource(w, host, INTEGRATION_PATHS.awsPolicy)
        : kind === 'cribl'
          ? readIntegrationSource(w, host, INTEGRATION_PATHS.criblAvailability)
          : '',
    confVersion: String(w.hosts.confVersion),
  });
}
export function requireKeys(value: unknown, keys: string[], label: string): Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => !keys.includes(k))
  )
    throw new OperationsError('Unsupported ' + label + ' fields');
  return value as Record<string, unknown>;
}
export function parseTeachingJson(source: string, keys: string[], label: string) {
  let v: unknown;
  try {
    v = JSON.parse(source);
  } catch {
    throw new OperationsError('Invalid ' + label + ' JSON');
  }
  return requireKeys(v, keys, label);
}

export function integrationSourceExists(w: World, host: string, path: string) {
  const p = resolveHost(w, host);
  if (!p?.splunk) throw new OperationsError('Choose a virtual Splunk host');
  return hostFs(w, p).exists(path);
}
