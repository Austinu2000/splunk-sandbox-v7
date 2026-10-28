import { hash } from 'fast-sha256';
import type { World } from '../world';
import { journal } from '../journal';
import { resolveHost, splunkVersion } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { OperationsError } from './access';
export const MAINTENANCE_TARGET = '9.4.2';
export const MAINTENANCE_PACKAGE = '/opt/staging/splunk-9.4.2-v7-practice-linux-amd64.tgz';
export function sha256Text(text: string) {
  return [...hash(new TextEncoder().encode(text))].map((n) => n.toString(16).padStart(2, '0')).join('');
}
export const maintenanceState = (w: World) =>
  (w.maintenance ??= {
    version: 1,
    nextId: 1,
    installations: {},
    backups: [],
    restores: [],
    preflights: [],
    jobs: [],
    receipts: [],
  });
export function persistMaintenance(w: World) {
  journal(w, { k: 'maintenance.state', state: structuredClone(w.maintenance!) });
}
export function maintenanceReceipt(w: World, host: string, kind: string, detail: string) {
  const s = maintenanceState(w),
    record = { id: 'maintenance-' + s.nextId++, host, tick: w.clock.tick, kind, detail };
  s.receipts.push(record);
  s.receipts = s.receipts.slice(-300);
  persistMaintenance(w);
  return record;
}
export function enterprisePackage(version = MAINTENANCE_TARGET) {
  if (!['9.4.1', MAINTENANCE_TARGET].includes(version))
    throw new OperationsError('This upgrade lab supports only its verified 9.4.1/9.4.2 teaching artifacts');
  return (
    JSON.stringify(
      {
        format: 'sandbox-enterprise-package-v1',
        product: 'Splunk Enterprise',
        version,
        platform: 'linux-amd64',
        trainingOnly: true,
      },
      null,
      2,
    ) + '\n'
  );
}
export function maintenanceHost(w: World, host: string) {
  const p = resolveHost(w, host);
  if (!p?.splunk || p.role === 'universal_forwarder' || p.os !== 'linux' || p.infra?.retired)
    throw new OperationsError('Choose an active Linux Splunk Enterprise host');
  return p;
}
export function stageEnterprisePackage(w: World, host: string, version = MAINTENANCE_TARGET) {
  const p = maintenanceHost(w, host),
    fs = hostFs(w, p),
    path = MAINTENANCE_PACKAGE.replace(MAINTENANCE_TARGET, version),
    text = enterprisePackage(version);
  fs.mkdir('/opt/staging', ROOT, { parents: true });
  fs.writeFile(path, text, ROOT);
  fs.setMeta(path, { owner: 'splunk', group: 'splunk', mode: 0o600 }, ROOT);
  fs.writeFile(path + '.sha256', sha256Text(text) + '  ' + path + '\n', ROOT);
  fs.setMeta(path + '.sha256', { owner: 'splunk', group: 'splunk', mode: 0o600 }, ROOT);
  return { path, digest: sha256Text(text) };
}
export function enterpriseArtifact(w: World, host: string, path = MAINTENANCE_PACKAGE) {
  const p = maintenanceHost(w, host),
    fs = hostFs(w, p),
    text = fs.readFile(path, { user: 'splunk', groups: ['splunk'] });
  let value: { version?: string; format?: string };
  try {
    value = JSON.parse(text) as typeof value;
  } catch {
    throw new OperationsError('Not a verified teaching Enterprise package');
  }
  if (!value || typeof value.version !== 'string' || text !== enterprisePackage(value.version))
    throw new OperationsError('Modified or unsupported Enterprise teaching artifact');
  const digest = sha256Text(text),
    manifest = fs.readFile(path + '.sha256', { user: 'splunk', groups: ['splunk'] }).trim();
  if (manifest !== digest + '  ' + path)
    throw new OperationsError('Package SHA-256 manifest differs from verified teaching artifact');
  return { path, version: value.version, digest, current: splunkVersion(w, p)! };
}
