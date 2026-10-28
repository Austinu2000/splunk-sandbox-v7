import type { World } from '../world';
import type { HostProfile } from '../hosts/profile';
import { mix32 } from '../rng';
import { indexBuckets } from './lifecycle';
import { runningConf } from '../hosts/running';
import { setting } from '../conf/merge';
/** The same /opt capacity drives native virtual df and maintenance readiness. */
export function modeledOptStorage(w: World, p: HostProfile) {
  const baselinePercent =
      (p.role === 'indexer' ? 61 : 9) +
      (mix32(p.hash, 4) % ((p.role === 'indexer' ? 78 : 34) - (p.role === 'indexer' ? 61 : 9))),
    recordedBytes = indexBuckets(w)
      .filter((b) => b.host === p.hostname && b.state !== 'frozen')
      .reduce((n, b) => n + b.bytes, 0),
    availableMB = Math.max(0, (p.diskGB * 1024 * (100 - baselinePercent)) / 100 - recordedBytes / 1024 ** 2),
    minimum = p.splunk
      ? Number(setting(runningConf(w, p, 'server'), 'diskUsage', 'minFreeSpace') ?? '5000')
      : 5000;
  return {
    host: p.hostname,
    sizeGB: p.diskGB,
    baselinePercent,
    recordedBytes,
    availableMB,
    minimumMB: Math.max(2048, minimum),
  };
}
