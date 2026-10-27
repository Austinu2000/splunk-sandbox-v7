import { shcBundleState } from './engineering/shc-admin';
import { queueShcBundle } from './engineering/shc-bundles';
import { clusterHealth } from './training/cluster';
import { parseCron } from './scheduler';
import { extractTime, parseConfig } from './ingest/parsing';
import { setting } from './conf/merge';
import { infraByRole, infraName } from './infra';
import { resolveHost, splunkdRunning, type HostProfile } from './hosts/profile';
import { runningConf, runningVfs, restartSplunk } from './hosts/running';
import { hostFs } from './vfs/build';
import { filesUnder, checksum } from './hosts/cluster';
import { ROOT } from './vfs/vfs';
import type { World } from './world';

export function operationDefaults(world: World, p: HostProfile): Record<string, string> {
  if (!world.config.profile) return {};
  const profile = world.config.profile;
  const files: Record<string, string> = {};
  if (p.role === 'heavy_forwarder') {
    files['inputs.conf'] =
      '[aws_vpc_flow]\ncredential = simulated-current\nexpectedCredential = simulated-current\ndisabled = 0\n\n[udp://514]\nreceiveBufferSize = 8388608\ntransport = udp\n';
    files['app.conf'] = '[fortigate]\nenabled = true\n';
  }
  if (p.role === 'indexer') files['indexes.conf'] = '[volume:hot]\nmaxVolumeDataSizeMB = 500000\n';
  if (p.role === 'search_head') {
    files['eventtypes.conf'] = '[symantec_malware]\nsearch = sourcetype=symantec:ep:*\n';
    files['tags.conf'] = '[eventtype=symantec_malware]\nmalware = enabled\n';
    files['authentication.conf'] =
      `[saml]\nexpectedGroup = ${profile.auth.roleMappings[1]?.group ?? 'analysts'}\n`;
    files['limits.conf'] = '[scheduler]\nauto_summary_perc = 50\n';
  }
  if (p.role === 'cribl_poc') files['pipeline.conf'] = '[firewall]\ndeny_sample_rate = 1\ndrop_all = false\n';
  if (p.role === 'soar')
    files['assets.conf'] =
      '[servicenow]\ncredential = simulated-current\nexpectedCredential = simulated-current\nplaybook = create_ticket\n';
  return files;
}
export function opSetting(
  world: World,
  p: HostProfile,
  conf: string,
  stanza: string,
  key: string,
  fallback = '',
): string {
  return setting(runningConf(world, p, conf), stanza, key) ?? fallback;
}
export function deploymentInterval(world: World): number {
  const ds = resolveHost(world, infraName(world, 'deployment_server'))!;
  const fs = runningVfs(world, ds);
  const path = '/opt/splunk/etc/deployment-apps/org_all_deploymentclient/local/deploymentclient.conf';
  const text = fs.readFile(path, ROOT);
  return Number(/phoneHomeIntervalInSecs\s*=\s*(\d+)/.exec(text)?.[1] ?? 60);
}
export function streamState(
  world: World,
  p: HostProfile,
  sourceId: string,
): { enabled: boolean; multiplier: number; sourcetype?: string } {
  if (!world.config.profile) return { enabled: true, multiplier: 1 };
  if (!splunkdRunning(world, p)) return { enabled: false, multiplier: 0 };
  if (sourceId === 'aws_vpc_flow') {
    const ok =
      opSetting(world, p, 'inputs', sourceId, 'credential') ===
        opSetting(world, p, 'inputs', sourceId, 'expectedCredential') &&
      opSetting(world, p, 'inputs', sourceId, 'disabled') !== '1';
    return { enabled: ok, multiplier: ok ? 1 : 0 };
  }
  if (sourceId === 'scada_ics') {
    const ok =
      opSetting(world, p, 'inputs', 'udp://514', 'transport') === 'tcp' ||
      Number(opSetting(world, p, 'inputs', 'udp://514', 'receiveBufferSize')) >= 8388608;
    return { enabled: true, multiplier: ok ? 1 : 0.7 };
  }
  if (sourceId === 'fortigate') {
    const cribl = infraByRole(world, 'cribl_poc')[0];
    const cp = cribl && resolveHost(world, cribl.hostname)!;
    const sample =
      cp && splunkdRunning(world, cp)
        ? Number(opSetting(world, cp, 'pipeline', 'firewall', 'deny_sample_rate', '1'))
        : 1;
    const drop =
      cp && splunkdRunning(world, cp) && opSetting(world, cp, 'pipeline', 'firewall', 'drop_all') === 'true';
    return {
      enabled: !drop,
      multiplier: drop ? 0 : 0.55 + 0.45 * Math.max(0, Math.min(1, sample)),
      ...(opSetting(world, p, 'app', 'fortigate', 'enabled', 'true') === 'false'
        ? { sourcetype: 'fgt_log' }
        : {}),
    };
  }
  return { enabled: true, multiplier: 1 };
}
const baselineShc =
  '[Profile health check]\nenableSched = 1\ncron_schedule = */15 * * * *\nsearch = index=_internal | stats count\n';
export function shcDefault(): string {
  return baselineShc;
}
export function shcBundle(world: World, p: HostProfile, running = false): Record<string, string> {
  return filesUnder(
    running ? runningVfs(world, p) : hostFs(world, p),
    `/opt/splunk/etc/${p.role === 'deployer' ? 'shcluster/apps' : 'apps'}/profile_search`,
  );
}
export function applyShcBundle(world: World, deployer: HostProfile): string {
  if (world.clusterManagement) return queueShcBundle(world, deployer).checksum!;
  if (deployer.role !== 'deployer') throw new Error('Run apply shcluster-bundle on the deployer');
  const files = filesUnder(hostFs(world, deployer), '/opt/splunk/etc/shcluster/apps');
  for (const text of Object.values(files))
    for (const match of text.matchAll(/cron_schedule\s*=\s*([^\n]+)/g))
      if (!parseCron(match[1]!.trim()))
        throw new Error('Bundle rejected: invalid cron_schedule in a shcluster app');
  for (const node of infraByRole(world, 'search_head').filter((n) => n.hostname !== 'es01')) {
    const p = resolveHost(world, node.hostname)!;
    const fs = hostFs(world, p);
    for (const [path, text] of Object.entries(files)) {
      const target = `/opt/splunk/etc/apps/${path}`;
      fs.mkdir(target.slice(0, target.lastIndexOf('/')), ROOT, { parents: true });
      fs.writeFile(target, text, ROOT);
    }
    restartSplunk(world, p);
  }
  return checksum(files);
}
export function operationMetrics(world: World, p: HostProfile): Record<string, number | string | boolean> {
  if (!world.config.profile) return {};
  const metrics: Record<string, number | string | boolean> = { running: splunkdRunning(world, p) };
  if (p.role === 'deployment_server') {
    const interval = deploymentInterval(world);
    metrics.phoneHomeInterval = interval;
    metrics.phoneHomeLatency = interval >= 60 ? 1 : (60 / Math.max(1, interval)) * 5;
    metrics.cpuPct = interval >= 60 ? 24 : 96;
  }
  if (p.role === 'heavy_forwarder') {
    if (world.config.profile.dataSources.some((d) => d.id === 'fortigate' && d.via === p.hostname)) {
      const t = Math.floor(world.clock.now / 1000) * 1000;
      const stamp = new Date(t).toISOString();
      const raw = `date=${stamp.slice(0, 10)} time=${stamp.slice(11, 19)} tz="+0000"`;
      const parsed = extractTime(parseConfig(world, p, 'fgt_traffic', world.clock.now), raw);
      metrics['fortigate.timestampCorrect'] = parsed !== null && Math.abs(parsed - t) < 2000;
    }
    for (const d of world.config.profile.dataSources.filter((d) => d.via === p.hostname)) {
      const state = streamState(world, p, d.id);
      metrics[`${d.id}.receiving`] = state.enabled;
      metrics[`${d.id}.dropPct`] = Math.round((1 - state.multiplier) * 100);
      metrics[`${d.id}.classified`] = !state.sourcetype;
    }
  }
  if (p.role === 'indexer') {
    metrics.diskFull =
      Number(opSetting(world, p, 'indexes', 'volume:hot', 'maxVolumeDataSizeMB', '500000')) > p.diskGB * 1024;
    const indexes = runningConf(world, p, 'indexes');
    metrics.retentionSatisfied = world.config.profile.indexes.every((i) => {
      const share = world.config
        .profile!.dataSources.filter((d) => d.index === i.name)
        .reduce((n, d) => n + d.shareOfIngest, 0);
      const needed =
        (world.config.profile!.scale.targetDailyIngestTB! * 1e12 * share * i.retentionDays) /
        world.config.profile!.infra.indexerCluster.indexers /
        1024 ** 2;
      return (
        Number(
          setting(indexes, i.name, 'maxTotalDataSizeMB') ?? setting(indexes, 'default', 'maxTotalDataSizeMB'),
        ) >= needed && Number(setting(indexes, i.name, 'frozenTimePeriodInSecs')) >= i.retentionDays * 86400
      );
    });
  }
  if (p.role === 'cluster_manager') {
    const healthy = infraByRole(world, 'indexer').filter((n) => {
      const p = resolveHost(world, n.hostname)!;
      return splunkdRunning(world, p) && !operationMetrics(world, p).diskFull;
    }).length;
    const copies = clusterHealth(world);
    metrics.replicationMet = copies.replicationMet;
    metrics.searchFactorMet = copies.searchFactorMet;
    metrics.maintenance = opSetting(world, p, 'server', 'clustering', 'maintenance_mode', 'false') === 'true';
    metrics.fixupComplete = world.clusterManagement
      ? !metrics.maintenance && copies.replicationMet && copies.searchFactorMet
      : !metrics.maintenance && healthy === world.config.profile.infra.indexerCluster.indexers;
  }
  if (p.role === 'search_head') {
    metrics.malwareMapped =
      opSetting(world, p, 'eventtypes', 'symantec_malware', 'search').includes('symantec:ep:') &&
      opSetting(world, p, 'tags', 'eventtype=symantec_malware', 'malware') === 'enabled';
    metrics.accelerationComplete =
      Number(opSetting(world, p, 'limits', 'scheduler', 'auto_summary_perc', '50')) >= 25;
    metrics.notableCreated = p.hostname === 'es01' && metrics.accelerationComplete;
    const group = opSetting(world, p, 'authentication', 'saml', 'expectedGroup');
    const roles = opSetting(world, p, 'authentication', 'roleMap_saml', group);
    metrics.analystAccess = roles.split(';').includes('ess_analyst');
    metrics.analystAdmin = roles.split(';').includes('admin');
  }
  if (p.role === 'deployer') {
    const sum = checksum(shcBundle(world, p));
    if (world.clusterManagement) {
      try {
        metrics.membersInSync = shcBundleState(world, p.hostname).members.every(
          (m) => m.available && m.inSync,
        );
      } catch {
        metrics.membersInSync = false;
      }
      return metrics;
    }
    metrics.membersInSync = infraByRole(world, 'search_head')
      .filter((n) => n.hostname !== 'es01')
      .every((n) => checksum(shcBundle(world, resolveHost(world, n.hostname)!, true)) === sum);
  }
  if (p.role === 'cribl_poc') {
    metrics.denySampleRate = Number(opSetting(world, p, 'pipeline', 'firewall', 'deny_sample_rate', '1'));
    metrics.dropAll = opSetting(world, p, 'pipeline', 'firewall', 'drop_all') === 'true';
  }
  if (p.role === 'soar') {
    const fs = hostFs(world, p);
    const path = '/opt/splunk/var/log/splunk/playbook.log';
    metrics.playbookSuccess =
      fs.findNode(path)?.type === 'file' && fs.readFile(path, ROOT).trim().endsWith('status=success');
  }
  return metrics;
}
export function runPlaybook(world: World, p: HostProfile): boolean {
  if (p.role !== 'soar') throw new Error('Playbooks run on the SOAR host');
  const success =
    opSetting(world, p, 'assets', 'servicenow', 'credential') ===
      opSetting(world, p, 'assets', 'servicenow', 'expectedCredential') &&
    opSetting(world, p, 'assets', 'servicenow', 'playbook') === 'create_ticket';
  const fs = hostFs(world, p);
  const path = '/opt/splunk/var/log/splunk/playbook.log';
  const previous = fs.findNode(path) ? fs.readFile(path, ROOT) : '';
  fs.writeFile(
    path,
    previous +
      `${new Date(world.clock.now).toISOString()} playbook=create_ticket asset=servicenow status=${success ? 'success' : 'failed'}\n`,
    ROOT,
  );
  return success;
}
