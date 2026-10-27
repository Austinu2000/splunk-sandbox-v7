import { hashString } from '../rng';
import { hostFs } from '../vfs/build';
import { ROOT, type Vfs } from '../vfs/vfs';
import type { World } from '../world';
import { resolveHost, splunkdRunning, type HostProfile } from './profile';
import { restartSplunk, runningVfs } from './running';

/**
 * The indexer cluster bundle: files under etc/manager-apps on the cluster manager, copied to
 * etc/peer-apps on every peer by `splunk apply cluster-bundle`, which then restarts the peers
 * that are running (a rolling restart), so the new config takes effect.
 */

export function filesUnder(vfs: Vfs, dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (vfs.findNode(dir)?.type !== 'dir') return out;
  vfs.walk(dir, ROOT, (path, node) => {
    if (node.type === 'file') out[path.slice(dir.length + 1)] = vfs.readFile(path, ROOT);
  });
  return out;
}

export function checksum(files: Record<string, string>): string {
  const text = Object.keys(files)
    .sort()
    .map((k) => `${k}\0${files[k]}`)
    .join('\0');
  return [0, 1, 2, 3]
    .map((i) => (hashString(`${i}:${text}`) >>> 0).toString(16).padStart(8, '0'))
    .join('')
    .toUpperCase();
}

export function clusterPeers(world: World): HostProfile[] {
  return world.infra
    .filter((n) => n.role === 'indexer' && !n.retired)
    .map((n) => resolveHost(world, n.hostname)!);
}

/** The bundle as saved on the manager's disk (what an apply would push). */
export function managerBundle(world: World, cm: HostProfile): Record<string, string> {
  return filesUnder(hostFs(world, cm), `${cm.splunk!.home}/etc/manager-apps`);
}

/** The bundle a peer is running with. */
export function peerBundle(world: World, peer: HostProfile): Record<string, string> {
  return filesUnder(runningVfs(world, peer), `${peer.splunk!.home}/etc/peer-apps`);
}

export function applyClusterBundle(world: World, cm: HostProfile): { checksum: string; restarted: string[] } {
  const files = managerBundle(world, cm);
  const restarted: string[] = [];
  for (const peer of clusterPeers(world)) {
    const fs = hostFs(world, peer);
    const base = `${peer.splunk!.home}/etc/peer-apps`;
    // The bundle replaces peer-apps wholesale: stale files from older bundles go away.
    for (const old of Object.keys(filesUnder(fs, base)))
      if (!(old in files)) fs.remove(`${base}/${old}`, ROOT);
    for (const [rel, text] of Object.entries(files)) {
      fs.mkdir(`${base}/${rel}`.replace(/\/[^/]+$/, ''), ROOT, { parents: true });
      fs.writeFile(`${base}/${rel}`, text, ROOT);
    }
    if (splunkdRunning(world, peer)) {
      restartSplunk(world, peer);
      restarted.push(peer.hostname);
    }
  }
  return { checksum: checksum(files), restarted };
}
