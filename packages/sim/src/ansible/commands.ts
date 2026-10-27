import { ansibleContext, discoverAnsibleConfig, parseAnsibleArguments } from './context';
import { inventoryGraph, inventoryHosts, inventoryList } from './inventory';
import type { CommandFn } from '../shell/types';
import { ok, fail } from '../shell/types';
import { runAnsible, type AnsibleOptions } from './runner';
import { filesUnder } from '../hosts/cluster';
import type { Tree } from '../git/state';
import { codeState } from '../git/code';
import { journal } from '../journal';
export const ansiblePlaybook: CommandFn = ({ world, sh, argv }) => {
  try {
    const checkout = world.git?.checkouts.find(
      (c) => c.host === sh.host.hostname && (sh.cwd === c.root || sh.cwd.startsWith(c.root + '/')),
    );
    if (!checkout) return fail('Run from a simulated automation repository');
    const tree: Tree = Object.fromEntries(
      Object.entries(filesUnder(sh.fs, checkout.root, sh.cred)).map(([p, text]) => [
        p,
        { text, mode: 0o644 },
      ]),
    );
    const opts: AnsibleOptions = {};
    let path = '';
    for (let i = 1; i < argv.length; i++) {
      const a = argv[i]!;
      if (a === '--check') opts.check = true;
      else if (a === '--diff') opts.diff = true;
      else if (a === '--syntax-check') opts.syntax = true;
      else if (['-i', '--inventory'].includes(a)) opts.inventory = argv[++i];
      else if (['-l', '--limit'].includes(a)) opts.limit = argv[++i];
      else if (a === '--vault-password-file')
        opts.vaultPassword = sh.fs.readFile(sh.resolve(argv[++i] ?? ''), sh.cred).trim();
      else if (/^-[v]{1,3}$/.test(a)) {
        // Verbose output already includes every task and host result.
      } else if (['-e', '--extra-vars'].includes(a)) {
        opts.extraVars = {};
        for (const kv of (argv[++i] ?? '').split(/\s+/)) {
          const at = kv.indexOf('=');
          if (at < 1) return fail('Use -e key=value');
          opts.extraVars[kv.slice(0, at)] = kv.slice(at + 1);
        }
      } else if (a === '-K' || a === '--ask-become-pass')
        return fail(
          'Use the simulated svc_ansible sudo policy; interactive become passwords are not supported',
        );
      else if (a.startsWith('-')) return fail(`Unsupported flag: ${a}`);
      else path = a;
    }
    if (!path) return fail('Usage: ansible-playbook playbooks/name.yml [--check --diff --limit group]');
    const relative = sh.resolve(path).slice(checkout.root.length + 1);
    const context = ansibleContext(sh, opts.inventory, false);
    opts.inventory = context.inventory.source;
    const r = runAnsible(world, tree, relative, opts);
    codeState(world).runs.push(r);
    journal(world, { k: 'code.state', state: structuredClone(codeState(world)) });
    const output =
      [
        ...r.logs,
        ...r.hosts.flatMap((h) => [h.host, ...h.messages]),
        `PLAY RECAP changed=${r.changed} failed=${r.failed} unreachable=${r.unreachable}`,
      ].join('\n') + '\n';
    return r.failed || r.unreachable ? fail('Playbook did not complete successfully', 2, output) : ok(output);
  } catch (e) {
    return fail(e instanceof Error ? e.message : String(e));
  }
};

export const ansibleInventory: CommandFn = ({ sh, argv }) => {
  try {
    const { flags, positional } = parseAnsibleArguments(argv);
    const allowed = new Set(['-i', '--inventory', '--graph', '--list', '--host', '--vars']);
    for (const flag of flags.keys()) if (!allowed.has(flag)) return fail(`Unsupported flag: ${flag}`);
    const actions = ['--graph', '--list', '--host'].filter((flag) => flags.has(flag));
    if (actions.length !== 1) return fail('Choose one of --graph, --list or --host HOST');
    const { inventory } = ansibleContext(
      sh,
      String(flags.get('-i') ?? flags.get('--inventory') ?? '') || undefined,
    );
    if (flags.has('--graph')) {
      if (flags.has('--vars'))
        return fail('--graph --vars is not supported; use --host to inspect effective variables');
      return ok(inventoryGraph(inventory, positional[0] ?? 'all'));
    }
    if (positional.length) return fail('Unexpected inventory argument');
    if (flags.has('--host'))
      return ok(JSON.stringify(inventory.hostvars[String(flags.get('--host'))] ?? {}, null, 2) + '\n');
    return ok(JSON.stringify(inventoryList(inventory), null, 2) + '\n');
  } catch (e) {
    return fail((e as Error).message);
  }
};
export const ansibleConfiguration: CommandFn = ({ sh, argv }) => {
  try {
    const { configPath, settings } = discoverAnsibleConfig(sh);
    if (argv[1] !== 'dump' || argv.slice(2).some((a) => a !== '--only-changed'))
      return fail('Supported: ansible-config dump [--only-changed]');
    const defaults = {
      'defaults.inventory': '/etc/ansible/hosts',
      'defaults.remote_user': '',
      'defaults.roles_path': 'roles',
      'defaults.retry_files_enabled': 'False',
    };
    const names: Record<string, string> = {
      'defaults.inventory': 'DEFAULT_HOST_LIST',
      'defaults.remote_user': 'DEFAULT_REMOTE_USER',
      'defaults.roles_path': 'DEFAULT_ROLES_PATH',
      'defaults.retry_files_enabled': 'RETRY_FILES_ENABLED',
    };
    const values: Record<string, string> = { ...defaults, ...settings };
    if (sh.env.has('ANSIBLE_INVENTORY')) values['defaults.inventory'] = sh.env.get('ANSIBLE_INVENTORY')!;
    return ok(
      Object.entries(values)
        .filter(
          ([k]) =>
            !argv.includes('--only-changed') ||
            Object.hasOwn(settings, k) ||
            (k === 'defaults.inventory' && sh.env.has('ANSIBLE_INVENTORY')),
        )
        .map(
          ([k, v]) =>
            `${names[k] ?? k.toUpperCase().replace('.', '_')}(${k === 'defaults.inventory' && sh.env.has('ANSIBLE_INVENTORY') ? 'env: ANSIBLE_INVENTORY' : Object.hasOwn(settings, k) ? configPath : 'default'}) = ${v}`,
        )
        .join('\n') + '\n',
    );
  } catch (e) {
    return fail((e as Error).message);
  }
};
export const ansibleAdHoc: CommandFn = ({ world, sh, argv }) => {
  try {
    if (argv.length === 2 && argv[1] === '--version') {
      const { configPath } = discoverAnsibleConfig(sh);
      return ok(
        `ansible [core 2.17 compatibility simulation]\n  config file = ${configPath ?? 'None'}\n  executable location = /usr/bin/ansible (virtual)\n  Offline bounded interpreter; no native Ansible or Python process.\n`,
      );
    }
    const { flags, positional } = parseAnsibleArguments(argv);
    const allowed = new Set(['-i', '--inventory', '-l', '--limit', '-m', '--module-name', '--list-hosts']);
    for (const flag of flags.keys()) if (!allowed.has(flag)) return fail(`Unsupported flag: ${flag}`);
    if (positional.length !== 1)
      return fail('Usage: ansible PATTERN [-i INVENTORY] [--list-hosts | -m ping]');
    const { tree, inventory } = ansibleContext(
      sh,
      String(flags.get('-i') ?? flags.get('--inventory') ?? '') || undefined,
    );
    const pattern = positional[0]!;
    const limit = String(flags.get('-l') ?? flags.get('--limit') ?? 'all');
    const allowedHosts = new Set(inventoryHosts(inventory, limit));
    const hosts = inventoryHosts(inventory, pattern).filter((h) => allowedHosts.has(h));
    if (flags.has('--list-hosts'))
      return ok(`  hosts (${hosts.length}):\n${hosts.map((h) => '    ' + h).join('\n')}\n`);
    const module = flags.get('-m') ?? flags.get('--module-name');
    if (module !== 'ping' && module !== 'ansible.builtin.ping') return fail('Supported ad-hoc module: ping');
    tree['.adhoc.yml'] = {
      text: `- hosts: ${JSON.stringify(pattern)}\n  tasks:\n    - ping: {}\n`,
      mode: 0o644,
    };
    const r = runAnsible(world, tree, '.adhoc.yml', { inventory: inventory.source, limit });
    const output =
      r.hosts
        .map(
          (h) =>
            `${h.host} | ${h.unreachable ? 'UNREACHABLE!' : h.failed ? 'FAILED' : 'SUCCESS'} => ${h.messages.join('; ')}`,
        )
        .join('\n') + '\n';
    return r.failed || r.unreachable ? fail('Some hosts were not reachable', 2, output) : ok(output);
  } catch (e) {
    return fail((e as Error).message);
  }
};
