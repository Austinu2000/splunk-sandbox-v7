import { buckets } from '../training/cluster';
import { decodeVault, VAULT_HEADER } from './vault';
import { yaml } from './yaml';
import { ansibleConfig, parseInventory, inventoryHosts } from './inventory';
export { yaml } from './yaml';
import type { World } from '../world';
import { saveWorld, loadWorld } from '../save';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT, type Cred } from '../vfs/vfs';
import { startSplunk, stopSplunk, restartSplunk, reloadDeployServer } from '../hosts/running';
import { applyClusterBundle } from '../hosts/cluster';
import { applyShcBundle } from '../operations';
import { recordEvidence, persistTraining, TrainingError } from '../training/engine';
import type { Tree } from '../git/state';
import { checksum } from '../hosts/cluster';
type Obj = Record<string, unknown>;
const object = (v: unknown): Obj => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new TrainingError('Expected a YAML mapping');
  return v as Obj;
};
function list(v: unknown): Obj[] {
  if (!Array.isArray(v)) throw new TrainingError('Expected YAML list');
  return v.map(object);
}
function get(vars: Obj, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (o, k) => (o && typeof o === 'object' && Object.hasOwn(o, k) ? (o as Obj)[k] : undefined),
      vars,
    );
}
function render(v: unknown, vars: Obj): string {
  return String(v ?? '').replace(
    /{{\s*([\w.]+)(?:\s*\|\s*default\(['"]?([^)'"\s]+)['"]?\))?\s*}}/g,
    (_a, k: string, fallback: string) => {
      const x = get(vars, k) ?? fallback;
      if (x === undefined) throw new TrainingError(`Undefined variable: ${k}`);
      return String(x);
    },
  );
}
function condition(v: unknown, vars: Obj): boolean {
  if (v === undefined) return true;
  if (typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.every((x) => condition(x, vars));
  const s = String(v).trim();
  if (s.startsWith('not ')) return !condition(s.slice(4), vars);
  if (s === 'true' || s === 'True') return true;
  if (s === 'false' || s === 'False') return false;
  const m = /^([\w.]+)\s*(==|!=)\s*['"]?([^'"]+)['"]?$/.exec(s);
  if (m) return (String(get(vars, m[1]!)) === m[3]) === (m[2] === '==');
  if (!/^[\w.]+$/.test(s)) throw new TrainingError(`Unsupported condition: ${s}`);
  return !!get(vars, s);
}
export interface AnsibleResult {
  id: string;
  revision: string;
  check: boolean;
  syntax: boolean;
  changed: number;
  failed: number;
  unreachable: number;
  hosts: { host: string; changed: number; failed: boolean; unreachable: boolean; messages: string[] }[];
  logs: string[];
}
export interface AnsibleOptions {
  check?: boolean;
  diff?: boolean;
  syntax?: boolean;
  limit?: string;
  extraVars?: Record<string, string | number | boolean>;
  inventory?: string;
  vaultPassword?: string;
}
export function runAnsible(world: World, tree: Tree, path: string, opts: AnsibleOptions = {}): AnsibleResult {
  const file = tree[path];
  if (!file) throw new TrainingError(`Playbook not found: ${path}`);
  const plays = list(yaml(file.text));
  const revision = checksum(Object.fromEntries(Object.entries(tree).map(([k, v]) => [k, v.text])));
  const result: AnsibleResult = {
    id: `run-${world.clock.tick}-${world.training?.nextId ?? 1}`,
    revision,
    check: !!opts.check,
    syntax: !!opts.syntax,
    changed: 0,
    failed: 0,
    unreachable: 0,
    hosts: [],
    logs: [],
  };
  const target = opts.check ? loadWorld(saveWorld(world), world.scenarios.definitions) : world;
  const inventoryPath =
    opts.inventory ?? ansibleConfig(tree['ansible.cfg']?.text ?? '')['defaults.inventory'];
  if (!inventoryPath) throw new TrainingError('Inventory file is missing');
  const inventory = parseInventory(tree, inventoryPath, opts.vaultPassword, true);
  const selected = (pattern: string) => inventoryHosts(inventory, pattern);
  let budget = 0;
  function readYaml(p: string): unknown {
    const text = tree[p]?.text;
    return text
      ? yaml(text.startsWith(VAULT_HEADER) ? decodeVault(text, opts.vaultPassword ?? '') : text)
      : undefined;
  }
  const metadata = new Set([
    'name',
    'when',
    'notify',
    'register',
    'changed_when',
    'failed_when',
    'become',
    'become_user',
    'vars',
    'loop',
    'with_items',
    'run_once',
    'delegate_to',
    'no_log',
    'check_mode',
    'tags',
    'ignore_errors',
  ]);
  const supported = new Set([
    'include_role',
    'import_role',
    'include_tasks',
    'import_tasks',
    'ping',
    'debug',
    'assert',
    'set_fact',
    'copy',
    'template',
    'file',
    'lineinfile',
    'blockinfile',
    'ini_file',
    'service',
    'systemd',
    'command',
    'shell',
    'wait_for',
    'uri',
    'meta',
  ]);
  function validate(tasks: Obj[], depth = 0) {
    if (depth > 10) throw new TrainingError('Role include depth limit');
    for (const task of tasks) {
      const keys = Object.keys(task).filter((k) => !metadata.has(k));
      if (keys.length !== 1)
        throw new TrainingError(`Task ${task.name ?? ''}: exactly one module is required`);
      const key = keys[0]!,
        module = key.replace(/^ansible\.(builtin|posix)\./, '').replace(/^community\.general\./, '');
      if (!supported.has(module)) throw new TrainingError(`Unsupported module: ${module}`);
      if (module.endsWith('role')) {
        const role = String(object(task[key]).name);
        const data = readYaml(`roles/${role}/tasks/main.yml`);
        if (!data) throw new TrainingError(`Missing role: ${role}`);
        validate(list(data), depth + 1);
      }
    }
  }
  for (const play of plays) {
    validate(list(play.tasks ?? []));
    if (play.handlers) validate(list(play.handlers));
  }
  if (opts.syntax) {
    result.logs.push('Playbook syntax and supported modules validated');
    recordEvidence(world, 'syntax', path, 0, true, revision);
    persistTraining(world);
    return result;
  }
  for (const play of plays) {
    let names = selected(String(play.hosts ?? 'all'));
    if (opts.limit) {
      const allowed = new Set(selected(opts.limit));
      names = names.filter((n) => allowed.has(n));
    }
    if (!names.length) throw new TrainingError('No hosts matched inventory and limit');
    const serial =
      play.serial === undefined
        ? names.length
        : String(play.serial).endsWith('%')
          ? Math.ceil((names.length * Number(String(play.serial).slice(0, -1))) / 100)
          : Number(play.serial);
    if (!Number.isInteger(serial) || serial < 1) throw new TrainingError('Invalid serial');
    const maxFailure = Number(play.max_fail_percentage ?? 100);
    for (let offset = 0; offset < names.length; offset += serial) {
      const batch = names.slice(offset, offset + serial);
      const restarting = new Set<string>();
      result.logs.push(`BATCH ${offset / serial + 1}: ${batch.join(', ')}`);
      for (const [hostIndex, name] of batch.entries()) {
        const entry = { host: name, changed: 0, failed: false, unreachable: false, messages: [] as string[] };
        result.hosts.push(entry);
        const host = resolveHost(target, name);
        if (!host || (host.fleetRow !== undefined && target.fleet.health[host.fleetRow] === 3)) {
          entry.unreachable = true;
          result.unreachable++;
          entry.messages.push('UNREACHABLE: simulated managed-host transport');
          continue;
        }
        let vars: Obj = {
          ...inventory.hostvars[name],
          ...(play.vars ? object(play.vars) : {}),
          inventory_hostname: name,
          ansible_check_mode: !!opts.check,
          ...opts.extraVars,
        };
        const handlers = new Map<string, Obj>(list(play.handlers ?? []).map((t) => [String(t.name), t]));
        const pending = new Set<string>();
        let redactFailure = false;
        const flush = () => {
          for (const key of [...pending]) {
            pending.delete(key);
            entry.messages.push(`RUNNING HANDLER: ${key}`);
            const handler = handlers.get(key);
            if (!handler) throw new TrainingError(`Unknown handler: ${key}`);
            runTasks([handler], '', 0);
          }
        };
        function runTasks(tasks: Obj[], role: string, depth: number): void {
          if (depth > 12) throw new TrainingError('Include recursion limit');
          for (const task of tasks) {
            redactFailure = !!task.no_log;
            if (++budget > 200000) throw new TrainingError('Task budget exceeded');
            if (task.run_once && hostIndex > 0) continue;
            if (!condition(task.when, vars)) continue;
            const loops = task.loop ?? task.with_items;
            if (loops !== undefined) {
              if (!Array.isArray(loops) || loops.length > 1000)
                throw new TrainingError('Bounded literal loops only');
              for (const item of loops) {
                vars.item = item;
                const clone = { ...task };
                delete clone.loop;
                delete clone.with_items;
                runTasks([clone], role, depth + 1);
              }
              continue;
            }
            const key = Object.keys(task).find((k) => !metadata.has(k))!;
            const module = key
              .replace(/^ansible\.(builtin|posix)\./, '')
              .replace(/^community\.general\./, '');
            const raw = task[key];
            const a = typeof raw === 'string' ? { _raw: raw } : object(raw ?? {});
            if (module === 'include_role' || module === 'import_role') {
              const name = render(a.name, vars);
              for (const h of list(readYaml(`roles/${name}/handlers/main.yml`) ?? []))
                handlers.set(String(h.name), h);
              vars = { ...((readYaml(`roles/${name}/defaults/main.yml`) as Obj) ?? {}), ...vars };
              runTasks(list(readYaml(`roles/${name}/tasks/main.yml`)), name, depth + 1);
              continue;
            }
            if (module === 'include_tasks' || module === 'import_tasks') {
              const name = render(a._raw ?? a.file, vars);
              if (name.includes('..')) throw new TrainingError('Unsafe include path');
              runTasks(list(readYaml(role ? `roles/${role}/tasks/${name}` : name)), role, depth + 1);
              continue;
            }
            if (module === 'meta') {
              if (a._raw !== 'flush_handlers') throw new TrainingError('Only flush_handlers supported');
              flush();
              continue;
            }
            const hp = task.delegate_to ? resolveHost(target, render(task.delegate_to, vars)) : host;
            if (!hp) throw new TrainingError('Unknown delegated host');
            const fs = hostFs(target, hp);
            const cred: Cred =
              task.become === false
                ? { user: 'svc_ansible', groups: ['svc_ansible'] }
                : (task.become ?? play.become)
                  ? ROOT
                  : { user: 'svc_ansible', groups: ['svc_ansible'] };
            let changed = false;
            const noLog = !!task.no_log;
            if (task.become_user && task.become_user !== 'root')
              throw new TrainingError('Only root become_user is supported');
            if (task.ignore_errors)
              throw new TrainingError('ignore_errors is not supported; use explicit failure handling');
            const dest = render(a.dest ?? a.path, vars);
            const note = (v: string) => entry.messages.push(noLog ? '[redacted task output]' : v);
            const write = (path: string, text: string) => {
              if (!path.startsWith('/') || path.includes('/../'))
                throw new TrainingError('Destination must be an absolute virtual path');
              const before = fs.exists(path) ? fs.readFile(path, cred) : '';
              changed = before !== text;
              if (changed) {
                fs.mkdir(path.slice(0, path.lastIndexOf('/')), cred, { parents: true });
                fs.writeFile(path, text, cred);
                if (opts.diff && !noLog)
                  note(`DIFF ${path}\n- ${before.slice(0, 2000)}\n+ ${text.slice(0, 2000)}`);
              }
            };
            if (task.check_mode === true && !opts.check)
              throw new TrainingError(
                'Per-task check_mode:true requires running the whole playbook with --check in this simulator',
              );
            if (task.check_mode === false && opts.check)
              throw new TrainingError(
                'check_mode:false is rejected in sandbox dry runs to preserve nonmutation',
              );
            if (module === 'ping') note('pong');
            else if (module === 'debug') note(render(a.msg ?? get(vars, String(a.var)), vars));
            else if (module === 'assert') {
              if (!condition(a.that, vars))
                throw new TrainingError(render(a.fail_msg ?? 'Assertion failed', vars));
            } else if (module === 'set_fact') {
              for (const [k, v] of Object.entries(a)) vars[k] = typeof v === 'string' ? render(v, vars) : v;
            } else if (module === 'copy' || module === 'template') {
              let content: string;
              if (a.content !== undefined) content = render(a.content, vars);
              else {
                const src = render(a.src, vars);
                const source =
                  tree[src] ?? tree[`roles/${role}/${module === 'template' ? 'templates' : 'files'}/${src}`];
                if (!source) throw new TrainingError(`Missing source: ${src}`);
                content = module === 'template' ? render(source.text, vars) : source.text;
              }
              write(dest, content);
            } else if (module === 'lineinfile' || module === 'blockinfile') {
              const before = fs.exists(dest) ? fs.readFile(dest, cred) : '';
              const line = render(a.line ?? a.block, vars);
              if (module === 'blockinfile') {
                const begin = '# BEGIN ANSIBLE MANAGED BLOCK',
                  end = '# END ANSIBLE MANAGED BLOCK';
                const start = before.indexOf(begin),
                  finish = before.indexOf(end);
                const block = `${begin}\n${line}\n${end}\n`;
                write(
                  dest,
                  start >= 0 && finish >= start
                    ? before.slice(0, start) + block + before.slice(finish + end.length).replace(/^\n/, '')
                    : before + (before.endsWith('\n') ? '' : '\n') + block,
                );
              } else {
                const lines = before.split('\n');
                const re = a.regexp ? new RegExp(String(a.regexp)) : undefined;
                const i = lines.findIndex((v) => (re ? re.test(v) : v === line));
                if (a.state === 'absent') {
                  if (i >= 0) lines.splice(i, 1);
                } else if (i >= 0) lines[i] = line;
                else lines.push(line);
                write(dest, lines.join('\n'));
              }
            } else if (module === 'ini_file') {
              const before = fs.exists(dest) ? fs.readFile(dest, cred) : '';
              const section = render(a.section, vars),
                option = render(a.option, vars),
                value = render(a.value, vars);
              const lines = before.split('\n');
              let start = lines.indexOf(`[${section}]`);
              if (start < 0) {
                lines.push(`[${section}]`);
                start = lines.length - 1;
              }
              let end = lines.findIndex((v, i) => i > start && v.startsWith('['));
              if (end < 0) end = lines.length;
              const i = lines.findIndex((v, i) => i > start && i < end && v.split('=')[0]?.trim() === option);
              if (i >= 0) lines[i] = `${option} = ${value}`;
              else lines.splice(end, 0, `${option} = ${value}`);
              write(dest, lines.join('\n'));
            } else if (module === 'file') {
              if (a.state === 'directory') {
                changed = !fs.exists(dest);
                fs.mkdir(dest, cred, { parents: true });
              } else if (a.state === 'absent') {
                changed = fs.exists(dest);
                if (changed) fs.remove(dest, cred);
              } else if (a.state === 'touch') {
                changed = !fs.exists(dest);
                if (changed) write(dest, '');
              } else throw new TrainingError('Supported file states: directory, absent, touch');
            } else if (module === 'service' || module === 'systemd') {
              if (!['splunk', 'splunkd', 'splunkforwarder'].includes(render(a.name, vars).toLowerCase()))
                throw new TrainingError('Only simulated Splunk services supported');
              if (!hp.splunk) throw new TrainingError('Host has no Splunk service');
              const running = splunkdRunning(target, hp);
              const state = String(a.state);
              if (state === 'restarted') {
                restarting.add(hp.hostname);
                restartSplunk(target, hp);
                changed = true;
              } else if (state === 'started') {
                changed = !running;
                if (changed) startSplunk(target, hp);
              } else if (state === 'stopped') {
                changed = running;
                if (changed) stopSplunk(target, hp);
              } else throw new TrainingError('Unsupported service state');
            } else if (module === 'command' || module === 'shell') {
              const cmd = render(a._raw ?? a.cmd, vars).replace(/^\/opt\/splunk(?:forwarder)?\/bin\//, '');
              if (cmd === 'splunk enable maintenance-mode' || cmd === 'splunk disable maintenance-mode') {
                if (hp.role !== 'cluster_manager')
                  throw new TrainingError('Delegate maintenance to the manager');
                const confPath = '/opt/splunk/etc/system/local/server.conf';
                const before = fs.readFile(confPath, cred);
                const enabled = cmd.includes('enable');
                write(
                  confPath,
                  /maintenance_mode\s*=/.test(before)
                    ? before.replace(/maintenance_mode\s*=.*$/m, `maintenance_mode = ${enabled}`)
                    : before + `\n[clustering]\nmaintenance_mode = ${enabled}\n`,
                );
                restartSplunk(target, hp);
              } else if (cmd === 'splunk show cluster-status') note(JSON.stringify(buckets(target)));
              else if (cmd === 'splunk status') note(splunkdRunning(target, hp) ? 'running' : 'stopped');
              else if (cmd === 'splunk restart') {
                restarting.add(hp.hostname);
                restartSplunk(target, hp);
                changed = true;
              } else if (cmd === 'splunk reload deploy-server') {
                reloadDeployServer(target, hp);
                changed = true;
              } else if (cmd === 'splunk apply cluster-bundle') {
                applyClusterBundle(target, hp);
                changed = true;
              } else if (cmd === 'splunk apply shcluster-bundle') {
                applyShcBundle(target, hp);
                changed = true;
              } else throw new TrainingError('Command is outside the simulated allowlist');
            } else if (module === 'wait_for') {
              if (a.port && !splunkdRunning(target, hp))
                throw new TrainingError('Simulated port unavailable');
              if (a.path && !fs.exists(render(a.path, vars)))
                throw new TrainingError('Required path not present');
            } else if (module === 'uri') {
              const url = render(a.url, vars);
              if (!/^https:\/\/[\w.-]+:8089\/services\//.test(url))
                throw new TrainingError('Only simulated Splunk management endpoints supported');
              if (!splunkdRunning(target, hp)) throw new TrainingError('Management endpoint unavailable');
              note('status=200 simulated management endpoint');
            } else throw new TrainingError(`Unsupported module: ${module}`);
            const outcome = { changed, failed: false, rc: 0 };
            if (task.register) vars[String(task.register)] = outcome;
            if (task.failed_when !== undefined && condition(task.failed_when, vars))
              throw new TrainingError('failed_when condition matched');
            if (task.changed_when !== undefined) changed = condition(task.changed_when, vars);
            if (changed) {
              entry.changed++;
              for (const h of Array.isArray(task.notify) ? task.notify : task.notify ? [task.notify] : [])
                pending.add(String(h));
            }
            note(`${changed ? 'changed' : 'ok'}: ${task.name ?? module}`);
          }
        }
        try {
          runTasks(list(play.tasks ?? []), '', 0);
          flush();
        } catch (e) {
          entry.failed = true;
          result.failed++;
          entry.messages.push(
            redactFailure
              ? 'FAILED: [redacted task output]'
              : `FAILED: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
        result.changed += entry.changed;
      }
      const unavailable = buckets(target).filter(
        (b) =>
          b.stage !== 'frozen' && b.copies.filter((c) => c.searchable).every((c) => restarting.has(c.host)),
      );
      if (unavailable.length) {
        result.logs.push(
          `SEARCH OUTAGE: overlapping restart batch removes all searchable copies of ${unavailable.length} buckets. Use smaller serial batches.`,
        );
        recordEvidence(
          world,
          'ansible.outage',
          path,
          0,
          false,
          `Unavailable buckets: ${unavailable.map((b) => b.id).join(', ')}`,
        );
        result.failed++;
      }
      const failed = result.hosts.slice(-batch.length).filter((h) => h.failed || h.unreachable).length;
      if ((failed / batch.length) * 100 > maxFailure) {
        result.logs.push('Failure threshold reached; remaining batches not run');
        break;
      }
    }
  }
  const success = result.failed === 0 && result.unreachable === 0;
  recordEvidence(
    world,
    opts.check ? 'ansible.check' : 'ansible.run',
    path,
    0,
    success,
    JSON.stringify({
      revision,
      limit: opts.limit ?? 'all',
      changed: result.changed,
      failed: result.failed,
      unreachable: result.unreachable,
    }),
  );
  persistTraining(world);
  return result;
}
