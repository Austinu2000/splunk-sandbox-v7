import type { World } from '../world';
import { filesUnder } from '../hosts/cluster';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ansibleConfig, inventoryDrift, inventoryGraph, parseInventory } from './inventory';
import { codeState } from '../git/code';
import type { Tree } from '../git/state';

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [
      k,
      /password|secret|token|vault|private_key/i.test(k) ? '[redacted]' : redact(v),
    ]),
  );
}
export function automationView(world: World) {
  const checkout = world.git?.checkouts.find((c) => c.repo === 'splunk-automation');
  const host = checkout && resolveHost(world, checkout.host);
  if (!checkout || !host) return { enabled: false as const, profileId: world.config.profileId };
  const tree: Tree = Object.fromEntries(
    Object.entries(filesUnder(hostFs(world, host), checkout.root)).map(([p, text]) => [
      p,
      { text, mode: 0o644 },
    ]),
  );
  const settings = ansibleConfig(tree['ansible.cfg']?.text ?? '');
  const source = settings['defaults.inventory'] ?? '';
  const code = codeState(world);
  let inventory = null;
  let error = '';
  try {
    const resolved = parseInventory(tree, source);
    inventory = {
      ...resolved,
      hostvars: redact(resolved.hostvars) as Record<string, Record<string, unknown>>,
      graph: inventoryGraph(resolved),
      drift: inventoryDrift(world, resolved),
    };
  } catch (e) {
    error = (e as Error).message;
  }
  return {
    enabled: true as const,
    profileId: world.config.profileId,
    host: host.hostname,
    root: checkout.root,
    branch: checkout.branch,
    committedBranches: world.git?.repos['splunk-automation']?.branches,
    source: 'working-tree' as const,
    settings,
    inventory,
    error,
    playbooks: Object.keys(tree)
      .filter((p) => p.startsWith('playbooks/') && /\.ya?ml$/.test(p))
      .map((path) => ({ path, text: tree[path]!.text })),
    roles: [
      ...new Set(
        Object.keys(tree)
          .filter((p) => p.startsWith('roles/'))
          .map((p) => p.split('/')[1]!),
      ),
    ],
    runs: code.runs.slice(-50).reverse(),
    schedules: code.schedules ?? [],
    deployments: code.reviews
      .filter((r) => r.deployed)
      .map((r) => ({ id: r.id, title: r.title, revision: r.deployed })),
  };
}
