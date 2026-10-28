import type { ConfigurationBackup } from '@sandbox/shared';
import type { World } from '../world';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { filesUnder } from '../hosts/cluster';
import { splunkVersion, splunkdRunning } from '../hosts/profile';
import { OperationsError, requireCapability } from './access';
import {
  maintenanceState,
  maintenanceHost,
  sha256Text,
  persistMaintenance,
  maintenanceReceipt,
} from './maintenance-state';
interface BackupMeta {
  owner: string;
  group: string;
  mode: number;
}
interface BackupBody {
  format: 'sandbox-configuration-archive-v1';
  host: string;
  root: string;
  packageVersion: string;
  files: Record<string, BackupMeta & { text: string }>;
  directories: Record<string, BackupMeta>;
}
function configurationDirectories(w: World, host: string) {
  const p = maintenanceHost(w, host),
    fs = hostFs(w, p),
    root = p.splunk!.home + '/etc',
    dirs: BackupBody['directories'] = {};
  fs.walk(root, ROOT, (path, node) => {
    if (node.type === 'dir')
      dirs[path.slice(root.length)] = { owner: node.owner, group: node.group, mode: node.mode };
  });
  return dirs;
}
export function configurationFingerprint(w: World, host: string) {
  const p = maintenanceHost(w, host),
    fs = hostFs(w, p),
    files = filesUnder(fs, p.splunk!.home + '/etc');
  return sha256Text(
    JSON.stringify([
      configurationDirectories(w, host),
      Object.entries(files)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, text]) => {
          const node = fs.findNode(p.splunk!.home + '/etc/' + name)!;
          return [name, text, node.owner, node.group, node.mode];
        }),
    ]),
  );
}
export function createConfigurationBackup(w: World, host: string, name: string) {
  const p = maintenanceHost(w, host);
  requireCapability(w, host, 'admin', 'indexes_edit');
  if (!/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(name))
    throw new OperationsError('Use a distinct archive name with letters, digits, _ or -');
  const s = maintenanceState(w);
  if (s.backups.length >= 30) throw new OperationsError('Configuration archive limit: 30');
  if (s.backups.some((b) => b.host === host && b.name === name))
    throw new OperationsError('Configuration backup name already exists on this host');
  const fs = hostFs(w, p),
    root = p.splunk!.home + '/etc',
    texts = filesUnder(fs, root),
    files: BackupBody['files'] = {};
  if (
    Object.keys(texts).length > 1000 ||
    new TextEncoder().encode(JSON.stringify(texts)).byteLength > 2000000
  )
    throw new OperationsError('Bounded configuration archive limit: 1,000 files / 2 MB');
  for (const [name, text] of Object.entries(texts)) {
    const node = fs.findNode(root + '/' + name)!;
    files[name] = { text, owner: node.owner, group: node.group, mode: node.mode };
  }
  if (Object.keys(configurationDirectories(w, host)).length > 1000)
    throw new OperationsError('Bounded configuration archive limit: 1,000 directories');
  const body: BackupBody = {
      format: 'sandbox-configuration-archive-v1',
      host,
      root,
      packageVersion: splunkVersion(w, p)!,
      files,
      directories: configurationDirectories(w, host),
    },
    text = JSON.stringify(body),
    path = '/var/backups/v7/' + host + '/' + name + '.json',
    digest = sha256Text(text);
  if (fs.exists(path) || fs.exists(path + '.sha256'))
    throw new OperationsError('Configuration archive path already exists; choose another name');
  fs.mkdir('/var/backups/v7/' + host, ROOT, { parents: true });
  fs.writeFile(path, text, ROOT);
  fs.setMeta(path, { owner: 'splunk', group: 'splunk', mode: 0o600 }, ROOT);
  fs.writeFile(path + '.sha256', digest + '  ' + path + '\n', ROOT);
  fs.setMeta(path + '.sha256', { owner: 'splunk', group: 'splunk', mode: 0o600 }, ROOT);
  const backup: ConfigurationBackup = {
    id: 'configuration-backup-' + s.nextId++,
    host,
    name,
    path,
    digest,
    sourceRevision: configurationFingerprint(w, host),
    packageVersion: body.packageVersion,
    tick: w.clock.tick,
  };
  s.backups.push(backup);
  persistMaintenance(w);
  return structuredClone(backup);
}
function readBackup(w: World, host: string, id: string) {
  const p = maintenanceHost(w, host),
    backup = w.maintenance?.backups.find(
      (b) => b.host === host && (b.id === id || b.path === id || b.name === id),
    );
  if (!backup) throw new OperationsError('Choose a registered configuration-only archive for this host');
  const fs = hostFs(w, p),
    text = fs.readFile(backup.path, { user: 'splunk', groups: ['splunk'] });
  if (sha256Text(text) !== backup.digest)
    throw new OperationsError(
      'Configuration archive SHA-256 check failed; preserve and inspect the corrupted artifact',
    );
  let body: BackupBody;
  try {
    body = JSON.parse(text) as BackupBody;
  } catch {
    throw new OperationsError('Malformed configuration archive');
  }
  if (
    body.format !== 'sandbox-configuration-archive-v1' ||
    body.host !== host ||
    body.root !== p.splunk!.home + '/etc' ||
    !body.files ||
    !body.directories ||
    Object.keys(body.files).length > 1000 ||
    Object.keys(body.directories).length > 1000
  )
    throw new OperationsError('Configuration archive scope mismatch');
  for (const [name, entry] of [...Object.entries(body.files), ...Object.entries(body.directories)]) {
    const directory = Object.hasOwn(body.directories, name);
    if (
      (name === '' && !directory) ||
      (!directory && name.startsWith('/')) ||
      (directory && name !== '' && !name.startsWith('/')) ||
      name.split('/').includes('..') ||
      name.includes('\\') ||
      !entry ||
      !Number.isInteger(entry.mode) ||
      entry.mode < 0 ||
      entry.mode > 0o7777 ||
      typeof entry.owner !== 'string' ||
      typeof entry.group !== 'string' ||
      (!directory && typeof (entry as { text?: unknown }).text !== 'string')
    )
      throw new OperationsError('Invalid archive member');
  }
  return { backup, body };
}
export function verifyConfigurationBackup(w: World, host: string, id: string) {
  const { backup, body } = readBackup(w, host, id);
  backup.verified = w.clock.tick;
  maintenanceReceipt(
    w,
    host,
    'backup-verified',
    backup.id + ' SHA-256 OK; ' + Object.keys(body.files).length + ' virtual configuration files',
  );
  return structuredClone(backup);
}
export function restoreConfigurationBackup(w: World, host: string, id: string) {
  const p = maintenanceHost(w, host);
  requireCapability(w, host, 'admin', 'indexes_edit');
  if (splunkdRunning(w, p))
    throw new OperationsError('Stop this virtual Enterprise service before restoring configuration');
  if (w.maintenance?.jobs.some((j) => j.status === 'running' || j.status === 'paused'))
    throw new OperationsError('Finish the upgrade job before a separate configuration restore');
  const { backup, body } = readBackup(w, host, id);
  if (backup.verified === undefined)
    throw new OperationsError('Verify this configuration archive before restoring it');
  const s = maintenanceState(w),
    before = createConfigurationBackup(w, host, 'before_restore_' + s.nextId),
    fs = hostFs(w, p),
    current = filesUnder(fs, body.root);
  for (const name of Object.keys(current))
    if (!Object.hasOwn(body.files, name)) fs.remove(body.root + '/' + name, ROOT);
  const dirs = configurationDirectories(w, host);
  for (const name of Object.keys(dirs).sort((a, b) => b.length - a.length))
    if (name && !Object.hasOwn(body.directories, name))
      fs.remove(body.root + name, ROOT, { recursive: true });
  for (const name of Object.keys(body.directories).sort((a, b) => a.length - b.length)) {
    const path = body.root + name,
      existing = fs.findNode(path);
    if (existing && existing.type !== 'dir') fs.remove(path, ROOT);
    fs.mkdir(path, ROOT, { parents: true });
  }

  for (const [name, file] of Object.entries(body.files)) {
    const path = body.root + '/' + name;
    fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
    fs.writeFile(path, file.text, ROOT);
    fs.setMeta(path, { owner: file.owner, group: file.group, mode: file.mode }, ROOT);
  }
  for (const [name, meta] of Object.entries(body.directories)) fs.setMeta(body.root + name, meta, ROOT);
  const record = {
    id: 'configuration-restore-' + s.nextId++,
    host,
    backupId: backup.id,
    tick: w.clock.tick,
    packageVersion: splunkVersion(w, p)!,
    beforeArchive: before.id,
  };
  s.restores.push(record);
  persistMaintenance(w);
  return structuredClone(record);
}
