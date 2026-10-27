import type { World } from '../world';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { restartSplunk, runningConf, vfsReader } from '../hosts/running';
import { loadConf, setting } from '../conf/merge';
import { automationView } from '../ansible/view';
import { inventoryHosts } from '../ansible/inventory';

export type FoundationCheck =
  | {
      kind: 'inspection';
      label: string;
      command: string;
      host?: string;
      user?: string;
      interface?: 'cli' | 'web';
      afterChange?: boolean;
    }
  | {
      kind: 'answer';
      label: string;
      id: string;
      expected?: string;
      derive?: 'role' | 'inventory-count' | 'group-count' | 'mgmt-port';
      host?: string;
      group?: string;
    }
  | {
      kind: 'configuration';
      label: string;
      host: string;
      conf: string;
      stanza: string;
      key: string;
      equals: string;
      source?: string;
      effective: boolean;
    }
  | { kind: 'permissions'; label: string; host: string; path: string; mode: number; owner: string }
  | {
      kind: 'inventory';
      label: string;
      pattern: string;
      expected?: string[];
      noMissing?: boolean;
      variable?: { host: string; name: string; value: string };
    };

export type FoundationSetup =
  | { kind: 'file'; host: string; path: string; text: string; mode?: number; owner?: string; apply?: boolean }
  | { kind: 'remove-inventory-host'; host: string; path: string; target: string };

export function setupFoundation(world: World, steps: FoundationSetup[]) {
  for (const step of steps) {
    const host = resolveHost(world, step.host);
    if (!host) throw new Error(`Unknown fixture host: ${step.host}`);
    const fs = hostFs(world, host);
    if (step.kind === 'remove-inventory-host') {
      const re = new RegExp('^\\s+' + step.target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':.*\\n', 'gm');
      fs.writeFile(step.path, fs.readFile(step.path, ROOT).replace(re, ''), ROOT);
    } else {
      fs.mkdir(step.path.slice(0, step.path.lastIndexOf('/')), ROOT, { parents: true });
      fs.writeFile(step.path, step.text, ROOT);
      if (step.mode !== undefined || step.owner)
        fs.setMeta(
          step.path,
          {
            ...(step.mode !== undefined ? { mode: step.mode } : {}),
            ...(step.owner ? { owner: step.owner, group: step.owner } : {}),
          },
          ROOT,
        );
      if (step.apply) restartSplunk(world, host);
    }
  }
}
export function foundationAnswer(
  world: World,
  check: Extract<FoundationCheck, { kind: 'answer' }>,
): string | undefined {
  const host = check.host && resolveHost(world, check.host);
  if (check.derive === 'role') return host ? host.role : undefined;
  if (check.derive === 'mgmt-port') return host ? String(host.splunk?.mgmtPort) : undefined;
  if (check.derive === 'inventory-count' || check.derive === 'group-count') {
    const view = automationView(world);
    if (!view.enabled || !view.inventory) return undefined;
    return String(
      check.derive === 'inventory-count'
        ? Object.keys(view.inventory.hostvars).length
        : inventoryHosts(view.inventory, check.group ?? 'all').length,
    );
  }
  return check.expected;
}
export function foundationCheck(world: World, check: FoundationCheck): boolean {
  switch (check.kind) {
    case 'inspection':
      return world.actions.some((a) => {
        if (!(
          a.kind === (check.interface === 'web' ? 'page' : 'cmd') &&
          (check.interface === 'web' ? a.success !== false : a.success === true) &&
          (!check.host || a.host === check.host) &&
          (!check.user || a.user === check.user) &&
          new RegExp(check.command, 'i').test(a.text)
        ))
          return false;
        if (!check.afterChange) return true;
        const changes = world.journal.log
          .map((m) => (m.k === 'fs' || m.k === 'svc') && (!check.host || m.host === check.host))
          .lastIndexOf(true);
        const observed = world.journal.log
          .map(
            (m) =>
              m.k === 'action' &&
              m.kind === a.kind &&
              m.host === a.host &&
              m.text === a.text &&
              m.success === a.success,
          )
          .lastIndexOf(true);
        return observed > changes;
      });
    case 'answer': {
      const expected = foundationAnswer(world, check);
      const value = world.lesson?.answers?.[check.id];
      return (
        expected !== undefined &&
        value !== undefined &&
        value.trim().toLowerCase() === expected.trim().toLowerCase()
      );
    }
    case 'configuration': {
      const host = resolveHost(world, check.host);
      if (!host?.splunk) return false;
      const conf = check.effective
        ? runningConf(world, host, check.conf)
        : loadConf(vfsReader(hostFs(world, host)), host.splunk.home, check.conf);
      const value = conf.stanzas.get(check.stanza)?.settings.get(check.key);
      return (
        setting(conf, check.stanza, check.key) === check.equals &&
        (!check.source || value?.path === check.source)
      );
    }
    case 'permissions': {
      const host = resolveHost(world, check.host);
      const node = host && hostFs(world, host).findNode(check.path);
      return !!node && node.mode === check.mode && node.owner === check.owner;
    }
    case 'inventory': {
      const view = automationView(world);
      if (!view.enabled || !view.inventory) return false;
      const names = inventoryHosts(view.inventory, check.pattern);
      if (check.expected && JSON.stringify(names) !== JSON.stringify([...check.expected].sort()))
        return false;
      if (check.noMissing && (view.inventory.drift.missing.length || view.inventory.drift.unknown.length))
        return false;
      if (
        check.variable &&
        String(view.inventory.hostvars[check.variable.host]?.[check.variable.name]) !== check.variable.value
      )
        return false;
      return names.length > 0;
    }
  }
}
