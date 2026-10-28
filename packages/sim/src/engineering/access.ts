import type { PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost } from '../hosts/profile';
import { runningConf } from '../hosts/running';
import { globToRegExp } from '../vfs/path';

export class OperationsError extends Error {}
const defaults: Record<string, Record<string, string>> = {
  admin: {
    run_collect: 'enabled',
    importRoles: 'power',
    indexes_edit: 'enabled',
    edit_deployment_server: 'enabled',
    edit_monitor: 'enabled',
    edit_indexer_cluster: 'enabled',
    edit_roles: 'enabled',
    srchIndexesAllowed: '*;_*',
    srchIndexesDefault: '*',
  },
  power: {
    run_collect: 'enabled',
    importRoles: 'user',
    edit_monitor: 'enabled',
    srchIndexesAllowed: 'app;os;network;main',
    srchIndexesDefault: 'main',
  },
  user: { srchIndexesAllowed: 'main;app;os', srchIndexesDefault: 'main' },
};
export function practicePrincipal(value: string | undefined): PracticePrincipal {
  if (!value) return 'admin';
  if (!['admin', 'analyst', 'operator'].includes(value))
    throw new OperationsError('Unknown simulated principal');
  return value as PracticePrincipal;
}
export function roleSettings(world: World, host: string, principal: PracticePrincipal) {
  const root = { admin: 'admin', analyst: 'user', operator: 'power' }[principal];
  return mappedRoleSettings(world, host, [root], false);
}
export function mappedRoleSettings(world: World, host: string, roots: string[], validate = true) {
  const target = resolveHost(world, host);
  if (!target?.splunk) throw new OperationsError('No Splunk installation on this host');
  const conf = runningConf(world, target, 'authorize');
  if (!roots.length || roots.length > 20 || roots.some((r) => !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(r)))
    throw new OperationsError('Choose up to twenty valid native role names');
  const output: Record<string, string> = {};
  const visits = new Set<string>();
  const merge = (role: string, depth = 0) => {
    if (depth > 10 || visits.has(role)) throw new OperationsError('Circular or excessive role inheritance');
    if (validate && !defaults[role] && !conf.stanzas.has('role_' + role))
      throw new OperationsError('Mapped role is not defined: ' + role);
    visits.add(role);
    const settings = {
      ...defaults[role],
      ...Object.fromEntries(
        [...(conf.stanzas.get('role_' + role)?.settings ?? [])].map(([k, v]) => [k, v.value]),
      ),
    };
    for (const parent of (settings.importRoles ?? '').split(';').filter(Boolean)) merge(parent, depth + 1);
    for (const [key, value] of Object.entries(settings)) {
      if (['srchIndexesAllowed', 'srchIndexesDisallowed', 'srchIndexesDefault'].includes(key))
        output[key] = [output[key], value].filter(Boolean).join(';');
      else output[key] = value;
    }
    visits.delete(role);
  };
  for (const root of roots) merge(root);
  return output;
}
export function requireCapability(
  world: World,
  host: string,
  principal: PracticePrincipal,
  capability: string,
) {
  const value = roleSettings(world, host, principal)[capability];
  if (!['enabled', 'true', '1'].includes(value ?? ''))
    throw new OperationsError(`Permission denied: ${principal} requires ${capability}`);
}
export function canSearchIndex(
  world: World,
  host: string,
  principal: PracticePrincipal,
  index: string,
  defaultsOnly = false,
) {
  return indexAllowedByRole(roleSettings(world, host, principal), index, defaultsOnly);
}
export function indexAllowedByRole(role: Record<string, string>, index: string, defaultsOnly = false) {
  const matches = (value: string | undefined) =>
    (value ?? '')
      .split(';')
      .filter(Boolean)
      .some((pattern) => {
        if (index.startsWith('_') && !pattern.startsWith('_')) return false;
        return globToRegExp(pattern).test(index);
      });
  return (
    matches(role.srchIndexesAllowed) &&
    !matches(role.srchIndexesDisallowed) &&
    (!defaultsOnly || matches(role.srchIndexesDefault))
  );
}
