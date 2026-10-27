import { inspectShcBundle } from './shc-bundles';
import type { World } from '../world';
import type { PracticePrincipal } from '@sandbox/shared';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { runningConf, runningVfs, vfsReader } from '../hosts/running';
import { setting, loadConf } from '../conf/merge';
import { patchConf } from '../scenario/engine';
import { shcHealth } from './shc-health';
import { listReports } from './reports';
import { listDashboards } from './dashboards';
import { checksum, filesUnder } from '../hosts/cluster';
import { OperationsError } from './access';
export function stageShcBundleFile(world: World, host: string, path: string, text: string) {
  const p = resolveHost(world, host);
  if (p?.role !== 'deployer' || !p.splunk) throw new OperationsError('Choose the Deployer');
  if (
    text.length > 100000 ||
    !/^([A-Za-z][A-Za-z0-9_-]{0,63})\/(?:(local|default)\/[A-Za-z][A-Za-z0-9_-]*\.conf|(local|default)\/data\/ui\/views\/[A-Za-z][A-Za-z0-9_-]*\.xml|metadata\/(local|default)\.meta|lookups\/[A-Za-z][A-Za-z0-9_.-]*\.csv)$/.test(
      path,
    )
  )
    throw new OperationsError(
      'Use a bounded app configuration, view, metadata or lookup path under shcluster/apps',
    );
  const fs = hostFs(world, p),
    full = p.splunk.home + '/etc/shcluster/apps/' + path;
  fs.mkdir(full.slice(0, full.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(full, text, ROOT);
  return { path: full, activation: 'deployer-push-required' };
}
export function stageShcMemberSettings(world: World, host: string, settings: Record<string, string>) {
  const health = shcHealth(world);
  if (!health.members.some((m) => m.host === host)) throw new OperationsError('Choose an SHC member');
  for (const [k, v] of Object.entries(settings)) {
    if (
      !['disabled', 'mgmt_uri', 'replication_port'].includes(k) ||
      typeof v !== 'string' ||
      v.length > 300 ||
      /[\r\n]/.test(v)
    )
      throw new OperationsError('Unsupported member setting');
    if (k === 'disabled' && !['true', 'false', '0', '1'].includes(v))
      throw new OperationsError('Use a boolean disabled setting');
    if (k === 'replication_port' && (!/^\d+$/.test(v) || Number(v) < 1 || Number(v) > 65535))
      throw new OperationsError('Use a valid port');
  }
  const p = resolveHost(world, host)!,
    fs = hostFs(world, p),
    path = p.splunk!.home + '/etc/system/local/server.conf';
  fs.writeFile(
    path,
    patchConf(fs.exists(path) ? fs.readFile(path, ROOT) : '', 'shclustering', settings),
    ROOT,
  );
  return { path, activation: 'member-restart-required' };
}
export function shcMemberSettings(world: World, host: string) {
  const p = resolveHost(world, host)!;
  const values = (conf: ReturnType<typeof runningConf>) => ({
    disabled: setting(conf, 'shclustering', 'disabled') ?? 'false',
    mgmt_uri: setting(conf, 'shclustering', 'mgmt_uri') ?? 'https://' + p.fqdn + ':8089',
    replication_port: setting(conf, 'shclustering', 'replication_port') ?? '8181',
  });
  return {
    running: values(runningConf(world, p, 'server')),
    declared: values(loadConf(vfsReader(hostFs(world, p)), p.splunk!.home, 'server')),
  };
}

export function shcKnowledgeDifferences(world: World, principal: PracticePrincipal = 'admin') {
  const health = shcHealth(world),
    items = new Map<
      string,
      {
        kind: string;
        title: string;
        app: string;
        owner: string;
        sharing: string;
        members: { host: string; signature: string; search?: string; sourcePath: string }[];
      }
    >();
  for (const member of health.members) {
    for (const report of listReports(world, member.host, principal)) {
      const key = 'report:' + JSON.stringify([report.app, report.title, report.owner, report.sharing]),
        item = items.get(key) ?? {
          kind: report.alert ? 'alert' : 'report',
          title: report.title,
          app: report.app,
          owner: report.owner,
          sharing: report.sharing,
          members: [],
        };
      item.members.push({
        host: member.host,
        signature: checksum({
          definition: JSON.stringify({
            search: report.search,
            earliest: report.earliest,
            latest: report.latest,
            scheduled: report.scheduled,
            cron: report.cron,
            alert: report.alert,
            enabled: report.enabled,
          }),
        }),
        search: report.search.slice(0, 500),
        sourcePath: report.sourcePath,
      });
      items.set(key, item);
    }
    for (const view of listDashboards(world, member.host, principal)) {
      const key = 'view:' + JSON.stringify([view.app, view.name, view.owner, view.sharing]),
        item = items.get(key) ?? {
          kind: 'dashboard',
          title: view.title,
          app: view.app,
          owner: view.owner,
          sharing: view.sharing,
          members: [],
        };
      item.members.push({
        host: member.host,
        signature: checksum({ source: view.source }),
        sourcePath: view.sourcePath,
      });
      items.set(key, item);
    }
  }
  return [...items.values()].slice(0, 200).map((item) => ({
    ...item,
    consistent:
      item.members.length === health.members.length &&
      new Set(item.members.map((m) => m.signature)).size === 1,
  }));
}
export function shcSourceFiles(world: World, host: string) {
  const p = resolveHost(world, host);
  if (!p?.splunk || p.role !== 'deployer') throw new OperationsError('Choose the Deployer');
  return filesUnder(hostFs(world, p), p.splunk.home + '/etc/shcluster/apps');
}
export function shcBundleState(world: World, host: string) {
  const p = resolveHost(world, host)!;
  const artifact = inspectShcBundle(world, p),
    health = shcHealth(world);
  return {
    checksum: artifact.checksum,
    members: health.members.map((m) => {
      const fs = runningVfs(world, resolveHost(world, m.host)!);
      return {
        host: m.host,
        available: m.available,
        inSync: Object.entries(artifact.files)
          .filter(([path]) => !path.includes('/lookups/'))
          .every(
            ([path, text]) =>
              fs.exists('/opt/splunk/etc/apps/' + path) &&
              fs.readFile('/opt/splunk/etc/apps/' + path, ROOT) === text,
          ),
      };
    }),
  };
}
