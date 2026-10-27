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
      Object.entries(filesUnder(sh.fs, checkout.root)).map(([p, text]) => [p, { text, mode: 0o644 }]),
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

export const ansibleInventory: CommandFn = ({ world, sh, argv }) => {
  try {
    const checkout = world.git?.checkouts.find(
      (c) => c.host === sh.host.hostname && (sh.cwd === c.root || sh.cwd.startsWith(c.root + '/')),
    );
    if (!checkout) return fail('Run from an automation repository');
    const path = argv.includes('-i')
      ? argv[argv.indexOf('-i') + 1]
      : /inventory\s*=\s*(.+)/.exec(sh.fs.readFile(checkout.root + '/ansible.cfg', sh.cred))?.[1]?.trim();
    if (!path) return fail('Inventory missing');
    const raw = sh.fs.readFile(checkout.root + '/' + path, sh.cred);
    return ok(raw + '\n');
  } catch (e) {
    return fail((e as Error).message);
  }
};
export const ansibleAdHoc: CommandFn = (ctx) => {
  const { world, sh, argv } = ctx;
  try {
    const checkout = world.git?.checkouts.find(
      (c) => c.host === sh.host.hostname && (sh.cwd === c.root || sh.cwd.startsWith(c.root + '/')),
    );
    if (!checkout) return fail('Run from an automation repository');
    const module = argv[argv.indexOf('-m') + 1];
    if (!argv.includes('-m') || module !== 'ping')
      return fail('Supported ad-hoc command: ansible group -m ping');
    const tree: Tree = Object.fromEntries(
      Object.entries(filesUnder(sh.fs, checkout.root)).map(([p, text]) => [p, { text, mode: 0o644 }]),
    );
    tree['.adhoc.yml'] = {
      text: `- hosts: ${JSON.stringify(argv[1] ?? 'all')}\n  tasks:\n    - ping: {}\n`,
      mode: 420,
    };
    const r = runAnsible(world, tree, '.adhoc.yml');
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
