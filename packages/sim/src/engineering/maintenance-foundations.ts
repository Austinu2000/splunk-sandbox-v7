import type { World } from '../world';
import { resolveHost, splunkVersion, splunkdRunning } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { restartSplunk, stopSplunk } from '../hosts/running';
import { setupClusterFixture } from './cluster-foundations';
import {
  createConfigurationBackup,
  verifyConfigurationBackup,
  configurationFingerprint,
} from './config-backup';
import { inspectUpgrade, captureUpgradePreflight } from './upgrade-preflight';
import { stageEnterprisePackage, MAINTENANCE_TARGET } from './maintenance-state';
import { certificateRelationship } from './certificate-rotation';
export type MaintenanceFixtureMode = 'planning' | 'execution' | 'configuration-recovery';
export type MaintenanceFoundationCheck =
  | { kind: 'upgrade-preflight'; label: string; targets: string[] }
  | { kind: 'enterprise-upgrade'; label: string; targets: string[]; version: string; resumed?: boolean }
  | { kind: 'configuration-recovery'; label: string; host: string; backup: string; version: string }
  | {
      kind: 'certificate-rotation';
      label: string;
      host: string;
      server: string;
      oldIssuer: string;
      issuer: string;
    };
export function setupMaintenanceFixture(w: World, mode: MaintenanceFixtureMode) {
  setupClusterFixture(w, 'baseline');
  if (mode === 'planning') captureUpgradePreflight(w, ['lm01', 'cm01', 'sh01', 'idx01', 'idx02', 'idx03']);
  if (mode === 'execution') stageEnterprisePackage(w, 'hf01');
  if (mode === 'configuration-recovery') {
    const host = 'hf01',
      p = resolveHost(w, host)!,
      fs = hostFs(w, p),
      path = '/opt/splunk/etc/system/local/limits.conf';
    fs.writeFile(path, '[thruput]\nmaxKBps=128\n', ROOT);
    restartSplunk(w, p);
    const b = createConfigurationBackup(w, host, 'known_good');
    verifyConfigurationBackup(w, host, b.id);
    fs.writeFile(path, '[thruput]\nmaxKBps=1\n', ROOT);
    restartSplunk(w, p);
    stopSplunk(w, p);
  }
}
export function maintenanceFoundationCheck(w: World, c: MaintenanceFoundationCheck) {
  try {
    if (c.kind === 'upgrade-preflight') {
      const now = inspectUpgrade(w, c.targets);
      return (
        now.valid &&
        !!w.maintenance?.preflights.some(
          (f) =>
            f.valid &&
            f.targetVersion === MAINTENANCE_TARGET &&
            JSON.stringify(f.targets) === JSON.stringify(now.targets) &&
            JSON.stringify(f.sourceRevisions) === JSON.stringify(now.sourceRevisions) &&
            JSON.stringify(f.artifactDigests) === JSON.stringify(now.artifactDigests) &&
            JSON.stringify(f.backupIds) === JSON.stringify(now.backupIds),
        )
      );
    }
    if (c.kind === 'enterprise-upgrade')
      return (
        c.targets.every((h) => {
          const p = resolveHost(w, h);
          return p && splunkVersion(w, p) === c.version && splunkdRunning(w, p);
        }) &&
        !!w.maintenance?.jobs.some(
          (j) =>
            j.status === 'completed' &&
            j.targetVersion === c.version &&
            JSON.stringify(j.targets) === JSON.stringify(c.targets) &&
            j.completed.length === j.targets.length &&
            j.targets.every(
              (h) =>
                configurationFingerprint(w, h) === j.sourceRevisions[h] &&
                j.events.filter((e) => e.host === h && e.phase === 'installed').length === 1,
            ) &&
            (!c.resumed ||
              (j.events.some((e) => e.phase === 'paused') && j.events.some((e) => e.phase === 'resumed'))),
        )
      );
    if (c.kind === 'configuration-recovery') {
      const p = resolveHost(w, c.host),
        b = w.maintenance?.backups.find((x) => x.host === c.host && x.name === c.backup);
      return (
        !!p &&
        !!b &&
        b.verified !== undefined &&
        splunkVersion(w, p) === c.version &&
        splunkdRunning(w, p) &&
        configurationFingerprint(w, c.host) === b.sourceRevision &&
        !!w.maintenance?.restores.some(
          (r) =>
            r.host === c.host &&
            r.backupId === b.id &&
            r.packageVersion === c.version &&
            w.maintenance?.backups.some(
              (before) => before.id === r.beforeArchive && before.sourceRevision !== b.sourceRevision,
            ),
        )
      );
    }
    const current = certificateRelationship(w, c.host, c.server),
      history = w.maintenance?.tlsProbes?.filter((p) => p.host === c.host && p.server === c.server) ?? [],
      old = history.findIndex(
        (p) =>
          p.reachable &&
          p.verified &&
          p.issuer === c.oldIssuer &&
          p.caIssuers.length === 1 &&
          p.caIssuers[0] === c.oldIssuer,
      ),
      overlap = history.findIndex(
        (p, i) =>
          i > old &&
          p.reachable &&
          p.verified &&
          p.issuer === c.issuer &&
          p.caIssuers.includes(c.oldIssuer) &&
          p.caIssuers.includes(c.issuer),
      );
    return (
      history.some((p) => !p.reachable) &&
      old >= 0 &&
      overlap > old &&
      current.reachable &&
      current.verified &&
      current.issuer === c.issuer &&
      current.caIssuers.length === 1 &&
      current.caIssuers[0] === c.issuer &&
      history.some(
        (p, i) => i > overlap && p.reachable && p.verified && p.sourceRevision === current.sourceRevision,
      )
    );
  } catch {
    return false;
  }
}
