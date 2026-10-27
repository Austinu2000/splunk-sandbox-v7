import type { World } from '../world';
import type { Tree } from '../git/state';
import { yaml } from './yaml';
import { TrainingError } from '../training/engine';
import { decodeVault, VAULT_HEADER } from './vault';
import { dirname, normalize, globToRegExp } from '../vfs/path';
import { hostname } from '../fleet/query';
import { resolveHost } from '../hosts/profile';

export type Variables = Record<string, unknown>;
export interface InventoryGroup {
  hosts: string[];
  children: string[];
  vars: Variables;
}
export interface Inventory {
  source: string;
  groups: Record<string, InventoryGroup>;
  hostvars: Record<string, Variables>;
}
const record = (v: unknown, label: string): Variables => {
  if (v === null || v === undefined) return {};
  if (typeof v !== 'object' || Array.isArray(v)) throw new TrainingError(`${label}: expected a mapping`);
  return v as Variables;
};
const safeName = (name: string) => {
  if (!/^[A-Za-z0-9_.-]+$/.test(name) || ['__proto__', 'constructor', 'prototype'].includes(name))
    throw new TrainingError(`Unsupported inventory name: ${name}`);
};
const relative = (path: string) => normalize('/' + path).slice(1);

/** One resolver for inventory CLI, automation views and playbook targeting. YAML subset only. */
export function parseInventory(
  tree: Tree,
  source: string,
  vaultPassword = '',
  includeVault = false,
): Inventory {
  source = relative(source);
  if (!tree[source]) throw new TrainingError(`Inventory file is missing: ${source}`);
  const groups: Record<string, InventoryGroup> = Object.create(null);
  const inlineHosts: Record<string, Variables> = Object.create(null);
  const get = (name: string) => {
    safeName(name);
    return (groups[name] ??= { hosts: [], children: [], vars: {} });
  };
  get('all');
  get('ungrouped');
  let visits = 0;
  const addGroup = (name: string, value: unknown, stack: string[] = []) => {
    if (++visits > 10000 || stack.length > 12) throw new TrainingError('Inventory nesting limit');
    if (stack.includes(name)) throw new TrainingError(`Circular inventory group: ${name}`);
    const node = record(value, name),
      group = get(name);
    for (const key of Object.keys(node))
      if (!['hosts', 'vars', 'children'].includes(key))
        throw new TrainingError(`Unsupported inventory property: ${name}.${key}`);
    Object.assign(group.vars, record(node.vars, `${name}.vars`));
    for (const [host, vars] of Object.entries(record(node.hosts, `${name}.hosts`))) {
      safeName(host);
      group.hosts.push(host);
      inlineHosts[host] = { ...inlineHosts[host], ...record(vars, host) };
    }
    for (const [child, contents] of Object.entries(record(node.children, `${name}.children`))) {
      if (!group.children.includes(child)) group.children.push(child);
      addGroup(child, contents, [...stack, name]);
    }
  };
  for (const [name, node] of Object.entries(record(yaml(tree[source]!.text), 'inventory')))
    addGroup(name, node);
  for (const group of Object.values(groups)) group.hosts = [...new Set(group.hosts)];
  const children = new Set(Object.values(groups).flatMap((g) => g.children));
  for (const name of Object.keys(groups))
    if (name !== 'all' && !children.has(name)) groups.all!.children.push(name);
  if (!groups.all!.children.includes('ungrouped')) groups.all!.children.push('ungrouped');
  const closure = (name: string, seen = new Set<string>()): Set<string> => {
    if (seen.has(name)) throw new TrainingError(`Circular inventory group: ${name}`);
    const g = groups[name]!;
    const out = new Set(g.hosts);
    for (const child of g.children)
      for (const host of closure(child, new Set([...seen, name]))) out.add(host);
    return out;
  };
  const membership = new Map(Object.keys(groups).map((name) => [name, closure(name)]));
  const allHosts = Object.keys(inlineHosts);
  if (allHosts.length > 100000) throw new TrainingError('Inventory host limit');
  groups.ungrouped!.hosts = allHosts.filter(
    (host) =>
      !Object.keys(groups).some((g) => g !== 'all' && g !== 'ungrouped' && membership.get(g)!.has(host)),
  );
  membership.set('ungrouped', new Set(groups.ungrouped!.hosts));
  membership.set('all', new Set(allHosts));
  const depths = new Map<string, number>([['all', 0]]);
  const depth = (name: string, n = 0, chain: string[] = []) => {
    if (chain.includes(name)) throw new TrainingError('Circular inventory group');
    depths.set(name, Math.max(n, depths.get(name) ?? 0));
    for (const child of groups[name]!.children) depth(child, n + 1, [...chain, name]);
  };
  depth('all');
  const order = Object.keys(groups).sort(
    (a, b) =>
      depths.get(a)! - depths.get(b)! ||
      Number(groups[a]!.vars.ansible_group_priority ?? 1) -
        Number(groups[b]!.vars.ansible_group_priority ?? 1) ||
      a.localeCompare(b, 'en'),
  );
  const inventoryBase = dirname('/' + source).slice(1);
  const variableCache = new Map<string, Variables>();
  const variableFiles = (kind: string, name: string) => {
    const cacheKey = `${kind}/${name}`;
    if (variableCache.has(cacheKey)) return variableCache.get(cacheKey)!;
    let vars: Variables = {};
    for (const base of [...new Set([inventoryBase, ''])]) {
      const prefix = (base ? base + '/' : '') + `${kind}/${name}`;
      const paths = Object.keys(tree)
        .filter(
          (p) =>
            p === prefix ||
            p === prefix + '.yml' ||
            p === prefix + '.yaml' ||
            (p.startsWith(prefix + '/') && /\.ya?ml$/.test(p)),
        )
        .sort();
      for (const path of paths) {
        const text = tree[path]!.text;
        if (text.startsWith(VAULT_HEADER) && !includeVault) continue;
        vars = {
          ...vars,
          ...record(yaml(text.startsWith(VAULT_HEADER) ? decodeVault(text, vaultPassword) : text), path),
        };
      }
    }
    variableCache.set(cacheKey, vars);
    return vars;
  };
  const hostvars: Record<string, Variables> = Object.create(null);
  for (const host of allHosts.sort()) {
    let vars: Variables = {};
    for (const group of order)
      if (membership.get(group)!.has(host))
        vars = { ...vars, ...groups[group]!.vars, ...variableFiles('group_vars', group) };
    hostvars[host] = { ...vars, ...inlineHosts[host], ...variableFiles('host_vars', host) };
  }
  return { source, groups, hostvars };
}

export function inventoryHosts(inventory: Inventory, pattern = 'all'): string[] {
  if (pattern.length > 1000 || pattern.includes('~') || pattern.includes('[') || pattern.includes(']'))
    throw new TrainingError('Supported patterns: names, globs, union, intersection and exclusion');
  const tokens = pattern.split(/[:,]/).filter(Boolean);
  const match = (token: string): Set<string> => {
    const re = globToRegExp(token);
    const hosts = new Set(Object.keys(inventory.hostvars).filter((h) => re.test(h)));
    const add = (g: string, seen = new Set<string>()) => {
      if (seen.has(g)) return;
      seen.add(g);
      for (const h of inventory.groups[g]!.hosts) hosts.add(h);
      for (const child of inventory.groups[g]!.children) add(child, seen);
    };
    for (const name of Object.keys(inventory.groups)) if (re.test(name)) add(name);
    if (token === 'all') for (const h of Object.keys(inventory.hostvars)) hosts.add(h);
    return hosts;
  };
  const positive = tokens.filter((p) => !/^[!&]/.test(p));
  let selected = new Set(positive.flatMap((p) => [...match(p)]));
  if (!positive.length) selected = match('all');
  for (const token of tokens.filter((p) => p.startsWith('&'))) {
    const allowed = match(token.slice(1));
    selected = new Set([...selected].filter((h) => allowed.has(h)));
  }
  for (const token of tokens.filter((p) => p.startsWith('!')))
    for (const h of match(token.slice(1))) selected.delete(h);
  return [...selected].sort();
}

export function inventoryGraph(inventory: Inventory, group = 'all'): string {
  if (!inventory.groups[group]) throw new TrainingError(`Unknown inventory group: ${group}`);
  const out: string[] = [];
  const visit = (name: string, indent: string, chain: string[]) => {
    if (chain.includes(name)) return;
    out.push(`${indent}@${name}:`);
    for (const child of inventory.groups[name]!.children) visit(child, indent + '  |--', [...chain, name]);
    for (const host of inventory.groups[name]!.hosts) out.push(`${indent}  |--${host}`);
  };
  visit(group, '', []);
  return out.join('\n') + '\n';
}
export function inventoryList(inventory: Inventory) {
  return {
    _meta: { hostvars: inventory.hostvars },
    ...Object.fromEntries(
      Object.entries(inventory.groups).map(([name, g]) => [name, { hosts: g.hosts, children: g.children }]),
    ),
  };
}
export function inventoryDrift(world: World, inventory: Inventory) {
  const actual = [
    ...world.infra.filter((n) => !n.retired && n.role !== 'automation').map((n) => n.hostname),
    ...Array.from({ length: world.fleet.size }, (_, row) => hostname(world, row)),
  ];
  const known = new Set(actual);
  return {
    missing: actual.filter((h) => !Object.hasOwn(inventory.hostvars, h)),
    unknown: Object.keys(inventory.hostvars).filter((h) => !known.has(h)),
    unreachable: Object.keys(inventory.hostvars).filter((name) => {
      const host = resolveHost(world, name);
      return (
        !host ||
        host.os === 'windows' ||
        (host.fleetRow !== undefined && world.fleet.health[host.fleetRow] === 3)
      );
    }),
  };
}

export function ansibleConfig(text: string): Record<string, string> {
  let section = '';
  const out: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const raw = line.trim();
    if (!raw || raw.startsWith('#') || raw.startsWith(';')) continue;
    if (/^\[[^\]]+\]$/.test(raw)) {
      section = raw.slice(1, -1);
      continue;
    }
    const at = raw.indexOf('=');
    if (at < 1) throw new TrainingError('Invalid ansible.cfg setting');
    out[`${section}.${raw.slice(0, at).trim()}`] = raw.slice(at + 1).trim();
  }
  return out;
}
