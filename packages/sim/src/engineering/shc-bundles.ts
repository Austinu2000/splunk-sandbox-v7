import type { World } from '../world';
import type { ClusterOperationJob } from '@sandbox/shared';
import { resolveHost, splunkdRunning, type HostProfile } from '../hosts/profile';
import { runningConf, runningVfs, stopSplunk, startSplunk } from '../hosts/running';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { filesUnder, checksum } from '../hosts/cluster';
import { mergeConf, setting } from '../conf/merge';
import { parseConf } from '../conf/parse';
import { parseCron } from '../scheduler';
import { dashboardDocument, parseDashboardSource } from './dashboard-source';
import { createClusterJob, clusterSourceRevision } from './cluster-jobs';
import { enableClusterManagement, clusterReceipt } from './cluster-state';
import { shcHealth } from './shc-health';
import { OperationsError } from './access';
export function inspectShcBundle(world: World, deployer: HostProfile) {
  if (deployer.role !== 'deployer' || !deployer.splunk)
    throw new OperationsError('Inspect shcluster/apps on the Deployer');
  const files = filesUnder(hostFs(world, deployer), deployer.splunk.home + '/etc/shcluster/apps');
  if (Object.keys(files).length > 500 || JSON.stringify(files).length > 2000000)
    throw new OperationsError('SHC bundle limit: 500 files / 2 MB');
  const out: Record<string, string> = {};
  const apps = [...new Set(Object.keys(files).map((path) => path.split('/')[0]!))];
  for (const app of apps) {
    if (!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(app) || ['constructor', 'prototype'].includes(app))
      throw new OperationsError('Invalid SHC app name');
    const read = (path: string) => files[path] ?? null,
      conf = mergeConf('app', { read, list: () => [] }, [
        { path: app + '/local/app.conf' },
        { path: app + '/default/app.conf' },
      ]),
      mode =
        setting(conf, 'shclustering', 'deployer_push_mode') ??
        setting(runningConf(world, deployer, 'app'), 'shclustering', 'deployer_push_mode') ??
        (app === 'search' ? 'local_only' : 'merge_to_default');
    if (mode !== 'merge_to_default')
      throw new OperationsError(
        'This SHC executor supports merge_to_default; other push modes must be reviewed separately',
      );
    const names = [
      ...new Set(
        Object.keys(files)
          .filter((path) => path.startsWith(app + '/local/') || path.startsWith(app + '/default/'))
          .map((path) => path.replace(new RegExp('^' + app + '/(local|default)/'), '')),
      ),
    ];
    for (const path of names) {
      const local = app + '/local/' + path,
        defaults = app + '/default/' + path;
      if (path.endsWith('.conf')) {
        for (const name of [local, defaults])
          if (files[name] !== undefined && parseConf(files[name]!).errors.length)
            throw new OperationsError('Invalid SHC configuration syntax: ' + name);
        const merged = mergeConf(path.slice(0, -5), { read, list: () => [] }, [
          { path: local },
          { path: defaults },
        ]);
        if (path === 'server.conf' && merged.stanzas.has('shclustering'))
          throw new OperationsError(
            'SHC membership settings need a separate coordinated configuration workflow, not this app rolling deployment',
          );
        const text =
          [...merged.stanzas]
            .map(
              ([name, s]) =>
                '[' +
                name +
                ']\n' +
                [...s.settings].map(([k, v]) => k + ' = ' + v.value.replace(/\n/g, '\\\n')).join('\n'),
            )
            .join('\n\n') + '\n';
        if (path === 'savedsearches.conf')
          for (const stanza of merged.stanzas.values()) {
            const cron = stanza.settings.get('cron_schedule')?.value;
            if (cron && !parseCron(cron)) throw new OperationsError('Invalid SHC cron schedule');
          }
        out[app + '/default/' + path] = text;
      } else {
        const text = files[local] ?? files[defaults]!;
        if (path.startsWith('data/ui/views/') && path.endsWith('.xml')) {
          const doc = dashboardDocument(text);
          parseDashboardSource(doc.source, doc.format);
        }
        out[app + '/default/' + path] = text;
      }
    }
    const meta = mergeConf('meta', { read, list: () => [] }, [
      { path: app + '/metadata/local.meta' },
      { path: app + '/metadata/default.meta' },
    ]);
    if (meta.stanzas.size)
      out[app + '/metadata/default.meta'] =
        [...meta.stanzas]
          .map(
            ([name, s]) =>
              '[' + name + ']\n' + [...s.settings].map(([k, v]) => k + ' = ' + v.value).join('\n'),
          )
          .join('\n\n') + '\n';
    for (const [path, text] of Object.entries(files))
      if (path.startsWith(app + '/') && !/^([^/]+)\/(local|default|metadata)\//.test(path)) out[path] = text;
  }
  return { checksum: checksum(files), files: out, apps };
}
export function queueShcBundle(world: World, deployer: HostProfile) {
  enableClusterManagement(world);
  const health = shcHealth(world);
  if (
    !splunkdRunning(world, deployer) ||
    !health.configured ||
    !health.majority ||
    !health.captain ||
    health.members.some((m) => !m.available)
  )
    throw new OperationsError(
      'Restore Deployer, captain and all SHC members before this controlled bundle push',
    );
  if (world.clusterManagement!.shc.replication.some((r) => r.completed.length < r.targets.length))
    throw new OperationsError('Wait for outstanding knowledge replication before preflighting the bundle');
  const artifact = inspectShcBundle(world, deployer);
  if (!artifact.apps.length)
    throw new OperationsError(
      'Empty SHC bundle removal is not implemented; retain or review deployed apps explicitly',
    );
  const previous = new Set(
    Object.values(world.clusterManagement!.shc.bundles).flatMap((v) => v.paths.map((p) => p.split('/')[0]!)),
  );
  if ([...previous].some((a) => !artifact.apps.includes(a)))
    throw new OperationsError(
      'App removal requires a separate reviewed workflow; this bundle does not silently uninstall apps',
    );
  return createClusterJob(world, {
    kind: 'shc-bundle',
    manager: deployer.hostname,
    targets: health.members
      .map((m) => m.host)
      .sort((a, b) => Number(a === health.captain) - Number(b === health.captain) || a.localeCompare(b)),
    files: artifact.files,
    checksum: artifact.checksum,
    priorMaintenance: false,
  });
}
export function queueShcRestart(world: World, deployer: HostProfile) {
  enableClusterManagement(world);
  const h = shcHealth(world);
  if (!h.members.some((m) => m.host === deployer.hostname))
    throw new OperationsError('Initiate an SHC restart on a cluster member');
  for (const member of h.members) {
    const p = resolveHost(world, member.host)!;
    const disk = mergeConf(
      'server',
      {
        read: (path) => {
          const fs = hostFs(world, p);
          return fs.exists(path) ? fs.readFile(path, ROOT) : null;
        },
        list: () => [],
      },
      [{ path: p.splunk!.home + '/etc/system/local/server.conf' }],
    );
    const active = runningConf(world, p, 'server');
    for (const [key, value] of disk.stanzas.get('shclustering')?.settings ?? []) {
      if (value.value !== setting(active, 'shclustering', key))
        throw new OperationsError(
          'Pending SHC membership settings require a coordinated configuration restart, not an ordinary rolling restart',
        );
    }
  }
  if (!h.majority || !h.captain || h.members.some((m) => !m.available))
    throw new OperationsError('Restore all members and an available captain first');
  return createClusterJob(world, {
    kind: 'shc-restart',
    manager: deployer.hostname,
    targets: h.members
      .map((m) => m.host)
      .sort((a, b) => Number(a === h.captain) - Number(b === h.captain) || a.localeCompare(b)),
    priorMaintenance: false,
  });
}
function matchesArtifact(world: World, host: string, files: Record<string, string>) {
  const p = resolveHost(world, host)!,
    fs = runningVfs(world, p),
    base = p.splunk!.home + '/etc/apps/';
  return Object.entries(files)
    .filter(([path]) => !path.includes('/lookups/'))
    .every(([path, text]) => fs.exists(base + path) && fs.readFile(base + path, ROOT) === text);
}
export function tickShcJob(world: World, j: ClusterOperationJob) {
  if (j.status !== 'running' || !j.kind.startsWith('shc-')) return;
  const name = j.targets[j.cursor];
  if (!name) {
    j.status = 'completed';
    j.finished = world.clock.tick;
    clusterReceipt(world, 'job.completed', j.manager, j.id);
    return;
  }
  const p = resolveHost(world, name)!;
  const note = (phase: string, detail: string) =>
    j.events.push({ tick: world.clock.tick, host: name, phase, detail });
  try {
    const h = shcHealth(world);
    if (!h.majority || !h.captain) throw new OperationsError('SHC majority or captain unavailable');
    if (j.phase === 'queued') {
      if (!h.members.find((m) => m.host === name)?.available)
        throw new OperationsError('Target member is unavailable');
      if (clusterSourceRevision(world, name) !== j.sourceRevisions[name])
        throw new OperationsError('Member configuration changed after preflight');
      if (h.available - 1 < h.quorumRequired)
        throw new OperationsError('Stopping this member would lose the SHC majority');
      j.phase = 'draining';
      note('draining', 'Available majority verified');
    } else if (j.phase === 'draining') {
      if (clusterSourceRevision(world, name) !== j.sourceRevisions[name])
        throw new OperationsError('Member source changed during drain');
      stopSplunk(world, p);
      j.phase = 'stopped';
      note('stopped', 'Other members retain majority');
    } else if (j.phase === 'stopped') {
      if (clusterSourceRevision(world, name) !== j.sourceRevisions[name])
        throw new OperationsError('Stopped member source changed; restore reviewed configuration');
      if (j.kind === 'shc-bundle') {
        const fs = hostFs(world, p),
          base = p.splunk!.home + '/etc/apps/',
          previous = world.clusterManagement!.shc.bundles[name]?.paths ?? [];
        for (const path of previous)
          if (!Object.hasOwn(j.files!, path) && !path.includes('/lookups/') && fs.exists(base + path))
            fs.remove(base + path, ROOT);
        for (const [path, text] of Object.entries(j.files!)) {
          if (path.includes('/lookups/') && fs.exists(base + path)) continue;
          fs.mkdir((base + path).replace(/\/[^/]+$/, ''), ROOT, { parents: true });
          fs.writeFile(base + path, text, ROOT);
        }
      }
      startSplunk(world, p);
      j.phase = 'verifying';
      note('verifying', 'Reviewed defaults activated; runtime local settings and existing lookups retained');
    } else {
      if (!splunkdRunning(world, p) || !h.members.find((m) => m.host === name)?.available)
        throw new OperationsError('Member failed to return');
      if (j.kind === 'shc-bundle') {
        if (!matchesArtifact(world, name, j.files!))
          throw new OperationsError('Member running defaults differ from the reviewed artifact');
        world.clusterManagement!.shc.bundles[name] = { checksum: j.checksum!, paths: Object.keys(j.files!) };
      }
      j.completed.push(name);
      j.cursor++;
      j.phase = 'queued';
      note('completed', 'Member rejoined before next member restarts');
    }
  } catch (e) {
    j.status = 'paused';
    j.error = (e as Error).message;
    note('paused', j.error);
  }
}
