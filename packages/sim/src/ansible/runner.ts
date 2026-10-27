import { validateManagedClusterBundle, queueIndexerRestart } from '../engineering/cluster-jobs';
import { advancedClusterHealth } from '../engineering/cluster-health';
import { setClusterMaintenance } from '../engineering/cluster-cli';
import { shcHealth } from '../engineering/shc-health';
import { kvBackup, kvRestore } from '../kvstore/engine';
import { installForwarderPackage, acceptForwarderLicense, setForwarderBoot } from '../engineering/forwarders';
import { buckets } from '../training/cluster';
import { decodeVault, VAULT_HEADER } from './vault';
import { yaml } from './yaml';
import { executeManagement } from './management';
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
import { formatBtool, loadConf } from '../conf/merge';
import { vfsReader } from '../hosts/running';
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
  let text = String(v ?? '');
  for (let depth = 0; depth < 10; depth++) {
    if (!text.includes('{{')) return text;
    const next = text.replace(
      /{{\s*([\w.]+)(?:\s*\|\s*default\(['"]?([^)'"\s]+)['"]?\))?\s*}}/g,
      (_a, k: string, fallback: string) => {
        const x = get(vars, k) ?? fallback;
        if (x === undefined) throw new TrainingError(`Undefined variable: ${k}`);
        return String(x);
      },
    );
    if (next === text) throw new TrainingError('Unsupported or recursive Jinja expression');
    text = next;
  }
  throw new TrainingError('Template expansion depth exceeded');
}
/** Render bounded JSON values without changing numeric/boolean record types. */
function renderBody(value: unknown, vars: Obj, depth = 0): unknown {
  if (depth > 12) throw new TrainingError('URI JSON nesting exceeds the practice limit');
  if (typeof value === 'string') return render(value, vars);
  if (Array.isArray(value)) {
    if (value.length > 500) throw new TrainingError('URI JSON array exceeds the practice limit');
    return value.map((item) => renderBody(item, vars, depth + 1));
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length > 100) throw new TrainingError('URI JSON object exceeds the practice limit');
    return Object.fromEntries(entries.map(([key, item]) => [key, renderBody(item, vars, depth + 1)]));
  }
  return value;
}
function condition(v: unknown, vars: Obj): boolean {
  if (v === undefined) return true;
  if (typeof v === 'boolean') return v;
  if (Array.isArray(v)) return v.every((x) => condition(x, vars));
  const s = String(v).trim();
  const defined = /^([\w.]+)\s+is\s+(not\s+)?defined$/.exec(s);
  if (defined) return (get(vars, defined[1]!) !== undefined) !== !!defined[2];
  if (s.startsWith('not ')) return !condition(s.slice(4), vars);
  if (s === 'true' || s === 'True') return true;
  if (s === 'false' || s === 'False') return false;
  const m = /^([\w.]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/.exec(s);
  if (m) {
    const left = /^-?\d+(\.\d+)?$/.test(m[1]!) ? Number(m[1]) : get(vars, m[1]!),
      raw = m[3]!.trim();
    if (left === undefined) throw new TrainingError('Undefined condition variable: ' + m[1]);
    const right = /^(['"]).*\1$/.test(raw)
      ? raw.slice(1, -1)
      : /^-?\d+(\.\d+)?$/.test(raw)
        ? Number(raw)
        : ['true', 'True', 'false', 'False'].includes(raw)
          ? raw.toLowerCase() === 'true'
          : get(vars, raw);
    if (right === undefined) throw new TrainingError('Undefined comparison value: ' + raw);
    if (m[2] === '==') return String(left) === String(right);
    if (m[2] === '!=') return String(left) !== String(right);
    const a = Number(left),
      b = Number(right);
    if (!Number.isFinite(a) || !Number.isFinite(b))
      throw new TrainingError('Ordered comparisons require numeric values');
    return m[2] === '>' ? a > b : m[2] === '<' ? a < b : m[2] === '>=' ? a >= b : a <= b;
  }
  if (!/^[\w.]+$/.test(s)) throw new TrainingError(`Unsupported condition: ${s}`);
  const value = get(vars, s);
  if (value === undefined) throw new TrainingError('Undefined condition variable: ' + s);
  return !!value;
}
function roleTasks(play: Obj): Obj[] {
  if (play.roles === undefined) return [];
  if (!Array.isArray(play.roles)) throw new TrainingError('roles must be a list');
  return play.roles.map((role) => {
    const data = typeof role === 'string' ? { role } : object(role);
    return {
      include_role: { name: data.role ?? data.name },
      ...(data.vars ? { vars: data.vars } : {}),
      ...(data.when !== undefined ? { when: data.when } : {}),
    };
  });
}
function safeVariable(name: string) {
  if (!/^[A-Za-z_][\w]*$/.test(name) || ['__proto__', 'constructor', 'prototype'].includes(name))
    throw new TrainingError('Invalid variable name: ' + name);
  return name;
}
export interface AnsibleResult {
  fixture?: boolean;
  playbook: string;
  inventory?: string;
  commit?: string;
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
    playbook: path,
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
  result.inventory = inventory.source;
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
    'dnf',
    'package',
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
        if (!/^[A-Za-z_][\w-]*$/.test(role)) throw new TrainingError('Only named local roles are supported');
        const data = readYaml(`roles/${role}/tasks/main.yml`);
        if (!data) throw new TrainingError(`Missing role: ${role}`);
        validate(list(data), depth + 1);
        const handlers = list(readYaml(`roles/${role}/handlers/main.yml`) ?? []);
        if (
          handlers.some((handler) =>
            Object.keys(handler).some((key) => /(?:^|\.)(?:include_role|import_role)$/.test(key)),
          )
        )
          throw new TrainingError('Handlers cannot include roles');
        validate(handlers, depth + 1);
      }
    }
  }
  for (const play of plays) {
    validate([
      ...list(play.pre_tasks ?? []),
      ...roleTasks(play),
      ...list(play.tasks ?? []),
      ...list(play.post_tasks ?? []),
    ]);
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
        if (
          !host ||
          host.os === 'windows' ||
          (host.fleetRow !== undefined &&
            target.fleet.health[host.fleetRow] === 3 &&
            target.hosts.services.get(host.hostname)?.running !== false &&
            target.forwarders?.clients[host.hostname]?.installed !== false)
        ) {
          entry.unreachable = true;
          result.unreachable++;
          entry.messages.push(
            host?.os === 'windows'
              ? 'UNREACHABLE: Windows remote transport is not implemented; manage Windows forwarder apps through the Deployment Server'
              : 'UNREACHABLE: simulated managed-host transport',
          );
          continue;
        }
        let vars: Obj = {
          ...inventory.hostvars[name],
          ...(play.vars ? object(play.vars) : {}),
          inventory_hostname: name,
          ansible_check_mode: !!opts.check,
          ...opts.extraVars,
        };
        const facts: Obj = {};
        const handlers = new Map<string, { task: Obj; role: string; defaults?: Obj; variables?: Obj }>(
          list(play.handlers ?? []).map((t) => [String(t.name), { task: t, role: '' }]),
        );
        const pending = new Set<string>();
        let redactFailure = false;
        let flushing = false;
        const flush = () => {
          if (flushing) throw new TrainingError('Recursive handler flush is not supported');
          for (const key of pending)
            if (!handlers.has(key)) throw new TrainingError(`Unknown handler: ${key}`);
          flushing = true;
          try {
            for (const [key, handler] of handlers) {
              if (!pending.has(key)) continue;
              pending.delete(key);
              entry.messages.push(`RUNNING HANDLER: ${key}`);
              const previous = vars;
              vars = { ...handler.defaults, ...vars, ...handler.variables, ...facts, ...opts.extraVars };
              try {
                runTasks([handler.task], handler.role, 0);
              } finally {
                vars = { ...previous, ...facts, ...opts.extraVars };
              }
            }
            if (pending.size)
              throw new TrainingError('Cyclic or late handler notifications are not supported');
          } finally {
            flushing = false;
          }
        };
        function runTasks(tasks: Obj[], role: string, depth: number): void {
          if (depth > 12) throw new TrainingError('Include recursion limit');
          for (const task of tasks) {
            const previous = vars;
            vars = { ...vars, ...(task.vars ? object(task.vars) : {}), ...opts.extraVars };
            try {
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
                const defaults = object(readYaml(`roles/${name}/defaults/main.yml`) ?? {}),
                  roleVars = object(readYaml(`roles/${name}/vars/main.yml`) ?? {});
                vars = {
                  ...defaults,
                  ...vars,
                  ...roleVars,
                  ...(task.vars ? object(task.vars) : {}),
                  ...opts.extraVars,
                };
                for (const h of list(readYaml(`roles/${name}/handlers/main.yml`) ?? [])) {
                  handlers.delete(String(h.name));
                  handlers.set(String(h.name), {
                    task: h,
                    role: name,
                    defaults,
                    variables: { ...roleVars, ...(task.vars ? object(task.vars) : {}) },
                  });
                }
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
              let response: Record<string, unknown> = {};
              if (task.become_user && task.become_user !== 'root')
                throw new TrainingError('Only root become_user is supported');
              if (task.ignore_errors)
                throw new TrainingError('ignore_errors is not supported; use explicit failure handling');
              const dest = render(a.dest ?? a.path, vars);
              const attributes: Partial<{ mode: number; owner: string; group: string }> = {};
              const fileModule = [
                'copy',
                'template',
                'file',
                'lineinfile',
                'blockinfile',
                'ini_file',
              ].includes(module);
              if (fileModule) {
                if (a.mode !== undefined) {
                  const raw = render(a.mode, vars);
                  if (typeof a.mode === 'number') {
                    if (!Number.isInteger(a.mode) || a.mode < 0 || a.mode > 0o7777)
                      throw new TrainingError('Invalid numeric mode; quote octal file modes');
                    attributes.mode = a.mode;
                  } else {
                    if (!/^[0-7]{3,4}$/.test(raw))
                      throw new TrainingError('Use a quoted octal mode such as 0640');
                    attributes.mode = parseInt(raw, 8);
                  }
                }
                for (const key of ['owner', 'group'] as const)
                  if (a[key] !== undefined) {
                    const value = render(a[key], vars);
                    if (
                      !/^[A-Za-z_][\w-]*$/.test(value) ||
                      !fs
                        .readFile(key === 'owner' ? '/etc/passwd' : '/etc/group', ROOT)
                        .split('\n')
                        .some((line) => line.split(':')[0] === value)
                    )
                      throw new TrainingError('Unknown virtual ' + key + ': ' + value);
                    attributes[key] = value;
                  }
              }
              const note = (v: string) => entry.messages.push(noLog ? '[redacted task output]' : v);
              const write = (path: string, text: string) => {
                if (!path.startsWith('/') || path.includes('/../'))
                  throw new TrainingError('Destination must be an absolute virtual path');
                const exists = fs.exists(path),
                  before = exists ? fs.readFile(path, cred) : '';
                changed = !exists || before !== text;
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
              if (task.check_mode === false && opts.check && !['uri', 'wait_for'].includes(module))
                throw new TrainingError(
                  'check_mode:false is rejected in sandbox dry runs to preserve nonmutation',
                );
              if (opts.check && task.check_mode !== false && ['uri', 'wait_for'].includes(module)) {
                if (task.register)
                  vars[safeVariable(String(task.register))] = facts[String(task.register)] = {
                    skipped: true,
                    changed: false,
                  };
                note('skipped: module does not support check mode');
                continue;
              }
              if (module === 'dnf' || module === 'package') {
                if (cred.user !== 'root')
                  throw new TrainingError('Package installation requires become: true');
                if (a.state && a.state !== 'present')
                  throw new TrainingError('Only explicit local package state: present is supported');
                const path = render(a.name, vars);
                changed = installForwarderPackage(target, hp.hostname, path, fs.readFile(path, cred), true);
                note('Verified local training package; no native installer');
              } else if (module === 'ping') note('pong');
              else if (module === 'debug') note(render(a.msg ?? get(vars, String(a.var)), vars));
              else if (module === 'assert') {
                if (!condition(a.that, vars))
                  throw new TrainingError(render(a.fail_msg ?? 'Assertion failed', vars));
              } else if (module === 'set_fact') {
                for (const [k, v] of Object.entries(a)) {
                  safeVariable(k);
                  vars[k] = facts[k] = typeof v === 'string' ? render(v, vars) : v;
                }
              } else if (module === 'copy' || module === 'template') {
                let content: string;
                if (a.content !== undefined) content = render(a.content, vars);
                else {
                  const src = render(a.src, vars);
                  const source =
                    tree[src] ??
                    tree[`roles/${role}/${module === 'template' ? 'templates' : 'files'}/${src}`];
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
                const i = lines.findIndex(
                  (v, i) => i > start && i < end && v.split('=')[0]?.trim() === option,
                );
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
                } else if (a.state === 'file') {
                  if (fs.findNode(dest)?.type !== 'file')
                    throw new TrainingError('file state requires an existing virtual file');
                } else throw new TrainingError('Supported file states: file, directory, absent, touch');
              } else if (module === 'service' || module === 'systemd') {
                if (cred.user !== 'root')
                  throw new TrainingError(
                    'Managing the service requires become: true in this practice transport',
                  );
                if (!['splunk', 'splunkd', 'splunkforwarder'].includes(render(a.name, vars).toLowerCase()))
                  throw new TrainingError('Only simulated Splunk services supported');
                if (!hp.splunk) throw new TrainingError('Host has no Splunk service');
                if (a.enabled !== undefined) {
                  if (hp.role !== 'universal_forwarder')
                    throw new TrainingError('Boot-start modeling currently supports Universal Forwarders');
                  changed = setForwarderBoot(target, hp.hostname, Boolean(a.enabled)) || changed;
                }
                const running = splunkdRunning(target, hp);
                const state = String(a.state);
                if (state === 'restarted') {
                  restarting.add(hp.hostname);
                  restartSplunk(target, hp);
                  changed = true;
                } else if (state === 'started') {
                  changed = !running || changed;
                  if (changed) startSplunk(target, hp);
                } else if (state === 'stopped') {
                  changed = running || changed;
                  if (changed) stopSplunk(target, hp);
                } else throw new TrainingError('Unsupported service state');
              } else if (module === 'command' || module === 'shell') {
                const cmd = render(a._raw ?? a.cmd, vars).replace(/^\/opt\/splunk(?:forwarder)?\/bin\//, '');
                if (cmd === 'splunk start --accept-license --answer-yes --no-prompt') {
                  if (cred.user !== 'root' || hp.role !== 'universal_forwarder')
                    throw new TrainingError('Use become on a Universal Forwarder');
                  acceptForwarderLicense(target, hp.hostname);
                  changed = !splunkdRunning(target, hp);
                  if (changed) startSplunk(target, hp);
                } else if (
                  cmd === 'splunk enable maintenance-mode' ||
                  cmd === 'splunk disable maintenance-mode'
                ) {
                  if (hp.role !== 'cluster_manager' || cred.user !== 'root')
                    throw new TrainingError('Delegate maintenance to the manager');
                  if (target.clusterManagement) {
                    const enabled = cmd.includes('enable');
                    changed = target.clusterManagement.manualMaintenance !== enabled;
                    setClusterMaintenance(target, enabled);
                  } else {
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
                  }
                } else if (cmd === 'splunk show cluster-status') {
                  response.stdout = JSON.stringify(
                    target.clusterManagement ? advancedClusterHealth(target) : buckets(target),
                  );
                  note(String(response.stdout));
                } else if (cmd === 'splunk status') {
                  response.stdout = splunkdRunning(target, hp) ? 'running' : 'stopped';
                  note(String(response.stdout));
                } else if (/^splunk btool [a-z]+ list(?: [^\s]+)?(?: --debug)?$/.test(cmd)) {
                  const match = /^splunk btool ([a-z]+) list(?: (?!-)([^\s]+))?(?: --debug)?$/.exec(cmd);
                  if (!match) throw new TrainingError('Unsupported btool validation form');
                  if (!hp.splunk) throw new TrainingError('Splunk is not installed on this host');
                  response.stdout = formatBtool(loadConf(vfsReader(fs, cred), hp.splunk!.home, match[1]!), {
                    debug: cmd.endsWith(' --debug'),
                    stanza: match[2],
                  });
                  note(String(response.stdout));
                } else if (cmd === 'splunk restart') {
                  if (cred.user !== 'root') throw new TrainingError('Restart requires become: true');
                  restarting.add(hp.hostname);
                  restartSplunk(target, hp);
                  changed = true;
                } else if (cmd === 'splunk reload deploy-server') {
                  if (hp.role !== 'deployment_server' || cred.user !== 'root')
                    throw new TrainingError('Delegate privileged deployment reload to the Deployment Server');
                  reloadDeployServer(target, hp);
                  changed = true;
                } else if (cmd === 'splunk validate cluster-bundle') {
                  if (cred.user !== 'root' || hp.role !== 'cluster_manager')
                    throw new TrainingError('Validate on the privileged Cluster Manager');
                  response.json = validateManagedClusterBundle(target, hp);
                  response.stdout = JSON.stringify(response.json);
                  note(String(response.stdout));
                } else if (cmd === 'splunk rolling-restart cluster-peers -searchable true') {
                  if (cred.user !== 'root' || hp.role !== 'cluster_manager')
                    throw new TrainingError('Initiate the restart on the privileged Cluster Manager');
                  response.json = queueIndexerRestart(target, hp);
                  changed = true;
                } else if (
                  /^splunk (backup|restore) kvstore -archiveName [A-Za-z][A-Za-z0-9_-]{0,63}$/.test(cmd)
                ) {
                  if (cred.user !== 'root' || hp.role !== 'search_head')
                    throw new TrainingError('Delegate KV maintenance to a privileged search head');
                  const parts = cmd.split(' ');
                  if (parts[1] === 'backup') kvBackup(target, hp.hostname, parts[4]!);
                  else kvRestore(target, hp.hostname, parts[4]!);
                  changed = true;
                } else if (cmd === 'splunk apply cluster-bundle') {
                  if (hp.role !== 'cluster_manager' || cred.user !== 'root')
                    throw new TrainingError(
                      'Delegate privileged cluster bundle application to the Cluster Manager',
                    );
                  applyClusterBundle(target, hp);
                  changed = true;
                } else if (
                  /^splunk apply shcluster-bundle(?: -target https:\/\/[A-Za-z0-9.-]+:8089)?(?: --answer-yes)?$/.test(
                    cmd,
                  )
                ) {
                  if (hp.role !== 'deployer' || cred.user !== 'root')
                    throw new TrainingError('Delegate privileged SHC bundle application to the Deployer');
                  const targetUri = / -target (\S+)/.exec(cmd)?.[1];
                  if (target.clusterManagement) {
                    if (!targetUri)
                      throw new TrainingError('Use -target https://MEMBER:8089 for an SHC bundle');
                    const member = resolveHost(target, new URL(targetUri).hostname);
                    if (
                      !member ||
                      !shcHealth(target).members.some((m) => m.host === member.hostname && m.available)
                    )
                      throw new TrainingError('Target an available SHC member');
                  }
                  applyShcBundle(target, hp);
                  changed = true;
                } else throw new TrainingError('Command is outside the simulated allowlist');
              } else if (module === 'wait_for') {
                const observedWorld = opts.check ? world : target;
                const waiting = resolveHost(observedWorld, a.host ? render(a.host, vars) : hp.hostname);
                const state = String(a.state ?? 'started');
                if (!['started', 'stopped', 'present', 'absent'].includes(state))
                  throw new TrainingError('Unsupported wait_for state');
                if (a.port) {
                  const port = Number(render(a.port, vars));
                  if (!Number.isInteger(port) || port < 1 || port > 65535 || !waiting?.splunk)
                    throw new TrainingError('Invalid virtual wait_for host or port');
                  const open =
                    splunkdRunning(observedWorld, waiting) &&
                    (port === waiting.splunk.mgmtPort ||
                      (observedWorld.derived.listening.get(waiting.hostname) ?? []).includes(port));
                  if (open === ['stopped', 'absent'].includes(state))
                    throw new TrainingError('Virtual port has not reached the requested state');
                } else if (a.path) {
                  const present = hostFs(observedWorld, hp).exists(render(a.path, vars));
                  if (present === ['stopped', 'absent'].includes(state))
                    throw new TrainingError('Virtual path has not reached the requested state');
                } else throw new TrainingError('wait_for requires a supported path or port check');
              } else if (module === 'uri') {
                const url = render(a.url, vars);
                const method = String(a.method ?? 'GET').toUpperCase();
                if (a.body_format !== undefined && a.body_format !== 'json')
                  throw new TrainingError('URI request bodies support JSON only');
                if (opts.check && task.check_mode === false && method !== 'GET')
                  throw new TrainingError('Check-mode override cannot write KV data in this practice model');
                const auth =
                  a.url_username === undefined
                    ? undefined
                    : render(a.url_username, vars) + ':' + render(a.url_password, vars);
                response = executeManagement(
                  opts.check && method === 'GET' ? world : target,
                  hp.hostname,
                  url,
                  method,
                  renderBody(a.body ?? {}, vars),
                  auth,
                );
                changed = Boolean(response.changed);
                const expected = Array.isArray(a.status_code)
                  ? a.status_code.map(Number)
                  : [Number(a.status_code ?? 200)];
                if (!expected.includes(Number(response.status)))
                  throw new TrainingError('Management response does not match status_code');
                note(`status=${response.status} verified virtual management endpoint`);
              } else throw new TrainingError(`Unsupported module: ${module}`);
              if (fileModule && a.state !== 'absent' && Object.keys(attributes).length) {
                const node = fs.lookup(dest, cred);
                if (
                  Object.entries(attributes).some(
                    ([key, value]) => node[key as keyof typeof attributes] !== value,
                  )
                ) {
                  fs.setMeta(dest, attributes, cred);
                  changed = true;
                  if (opts.diff && !noLog) note(`DIFF ${dest}\n+ metadata ${JSON.stringify(attributes)}`);
                }
              }
              const outcome = { changed, failed: false, rc: 0, ...response };
              if (task.register)
                vars[safeVariable(String(task.register))] = facts[String(task.register)] = outcome;
              if (task.failed_when !== undefined && condition(task.failed_when, vars))
                throw new TrainingError('failed_when condition matched');
              if (task.changed_when !== undefined) changed = condition(task.changed_when, vars);
              if (changed) {
                entry.changed++;
                for (const h of Array.isArray(task.notify) ? task.notify : task.notify ? [task.notify] : [])
                  pending.add(String(h));
              }
              note(`${changed ? 'changed' : 'ok'}: ${task.name ?? module}`);
            } finally {
              vars = { ...previous, ...facts, ...opts.extraVars };
            }
          }
        }
        try {
          runTasks(list(play.pre_tasks ?? []), '', 0);
          flush();
          runTasks([...roleTasks(play), ...list(play.tasks ?? [])], '', 0);
          flush();
          runTasks(list(play.post_tasks ?? []), '', 0);
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
