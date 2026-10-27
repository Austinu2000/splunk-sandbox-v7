import type { Shell } from '../shell/shell';
import { filesUnder } from '../hosts/cluster';
import { ansibleConfig, parseInventory } from './inventory';
import type { Tree } from '../git/state';
import { dirname, resolvePath } from '../vfs/path';
import { TrainingError } from '../training/engine';

export function discoverAnsibleConfig(sh: Shell) {
  const explicit = sh.env.get('ANSIBLE_CONFIG');
  const candidates = explicit
    ? [sh.resolve(explicit)]
    : [sh.cwd + '/ansible.cfg', sh.home + '/.ansible.cfg', '/etc/ansible/ansible.cfg'];
  const configPath = candidates.find(
    (p, n) => sh.fs.exists(p) && (explicit || n !== 0 || !(sh.fs.lookup(sh.cwd, sh.cred).mode & 0o002)),
  );
  return {
    configPath: configPath ?? null,
    settings: configPath ? ansibleConfig(sh.fs.readFile(configPath, sh.cred)) : {},
  };
}
export function ansibleContext(sh: Shell, override?: string, includeVault = false, password = '') {
  const checkout = sh.world.git?.checkouts.find(
    (c) => c.host === sh.host.hostname && (sh.cwd === c.root || sh.cwd.startsWith(c.root + '/')),
  );
  if (!checkout) throw new TrainingError('Run from a simulated automation repository');
  const config = discoverAnsibleConfig(sh);
  const configured = config.settings['defaults.inventory'] ?? '/etc/ansible/hosts';
  const inventoryPath = override
    ? sh.resolve(override)
    : sh.env.has('ANSIBLE_INVENTORY')
      ? sh.resolve(sh.env.get('ANSIBLE_INVENTORY')!)
      : resolvePath(config.configPath ? dirname(config.configPath) : sh.cwd, configured, sh.home);
  if (!inventoryPath.startsWith(checkout.root + '/'))
    throw new TrainingError(
      'This simulator supports inventory files inside the current automation repository',
    );
  const tree: Tree = Object.fromEntries(
    Object.entries(filesUnder(sh.fs, checkout.root, sh.cred)).map(([p, text]) => [p, { text, mode: 0o644 }]),
  );
  const source = inventoryPath.slice(checkout.root.length + 1);
  return { ...config, checkout, tree, inventory: parseInventory(tree, source, password, includeVault) };
}

export function parseAnsibleArguments(argv: string[]) {
  const flags = new Map<string, string | boolean>();
  const positional: string[] = [];
  const takesValue = new Set([
    '-i',
    '--inventory',
    '-l',
    '--limit',
    '-m',
    '--module-name',
    '--host',
    '-e',
    '--extra-vars',
    '--vault-password-file',
  ]);
  for (let n = 1; n < argv.length; n++) {
    const argument = argv[n]!;
    if (!argument.startsWith('-')) {
      positional.push(argument);
      continue;
    }
    const at = argument.indexOf('=');
    const name = at > 0 ? argument.slice(0, at) : argument;
    if (takesValue.has(name)) {
      const value = at > 0 ? argument.slice(at + 1) : argv[++n];
      if (!value || value.startsWith('-')) throw new TrainingError(`Missing value for ${name}`);
      flags.set(name, value);
    } else flags.set(name, true);
  }
  return { flags, positional };
}
