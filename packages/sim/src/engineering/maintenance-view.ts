import type { World } from '../world';
import { resolveHost, splunkVersion, splunkdRunning } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { configurationFingerprint } from './config-backup';
import { maintenanceStorage } from './upgrade-preflight';
import { MAINTENANCE_PACKAGE, sha256Text } from './maintenance-state';
/** Review only: does not initialize maintenance, KV Store or operational fixtures. */
export function maintenanceView(w: World) {
  const hosts = w.infra
    .filter((n) => !n.retired)
    .map((n) => resolveHost(w, n.hostname)!)
    .filter((p) => p?.splunk?.product === 'enterprise' && p.os === 'linux')
    .map((p) => {
      const fs = hostFs(w, p),
        artifact = fs.exists(MAINTENANCE_PACKAGE) ? fs.readFile(MAINTENANCE_PACKAGE, ROOT) : '',
        manifest = fs.exists(MAINTENANCE_PACKAGE + '.sha256')
          ? fs.readFile(MAINTENANCE_PACKAGE + '.sha256', ROOT)
          : '';
      return {
        host: p.hostname,
        role: p.role,
        version: splunkVersion(w, p)!,
        running: splunkdRunning(w, p),
        sourceRevision: configurationFingerprint(w, p.hostname),
        artifactDigest: artifact ? sha256Text(artifact) : '',
        manifest,
        storage: maintenanceStorage(w, p.hostname),
      };
    });
  const state = w.maintenance ?? null,
    // Queue/installation recheck live readiness separately. Background KV heartbeat
    // and ingestion counters must not invalidate a review of unchanged source.
    revision = sha256Text(
      JSON.stringify({
        hosts: hosts.map(({ storage, ...h }) => {
          void storage;
          return h;
        }),
        state,
      }),
    );
  return { revision, hosts, state, clock: { tick: w.clock.tick, paused: w.clock.paused } };
}
