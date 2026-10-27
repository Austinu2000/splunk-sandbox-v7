import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  parseInventory,
  inventoryHosts,
  inventoryGraph,
  inventoryList,
  inventoryDrift,
  automationView,
  createWorld,
  parseProfile,
  profileWorldConfig,
  saveWorld,
  loadWorld,
  TerminalSession,
  stripAnsi,
} from '../src/index';
import type { Tree } from '../src/git/state';
import { runAnsible } from '../src/ansible/runner';
import { hostFs } from '../src/vfs/build';
import { resolveHost } from '../src/hosts/profile';
import { ROOT } from '../src/vfs/vfs';
const tree = (files: Record<string, string>): Tree =>
  Object.fromEntries(Object.entries(files).map(([p, text]) => [p, { text, mode: 0o644 }]));
const fixture = () =>
  tree({
    'inventory.yml': `all:\n  vars: { region: parent, priority: root }\n  children:\n    web:\n      vars: { region: web }\n      hosts:\n        idx01: { region: host }\n        idx02: {}\n    prod:\n      vars: { priority: prod }\n      hosts:\n        idx01: {}\n        idx03: {}\n`,
    'group_vars/all.yml': 'base: inherited\n',
    'group_vars/web.yml': 'web_only: true\n',
    'host_vars/idx01.yml': 'region: host_file\n',
  });
const lab = () =>
  createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );

describe('shared Ansible inventory resolver', () => {
  it('resolves groups and variables with host overrides, child priority and alphabetic peers', () => {
    const inventory = parseInventory(fixture(), 'inventory.yml');
    expect(inventory.hostvars.idx01).toMatchObject({
      region: 'host_file',
      priority: 'prod',
      base: 'inherited',
      web_only: true,
    });
    expect(inventory.hostvars.idx02).toMatchObject({ region: 'web', priority: 'root' });
    expect(inventoryGraph(inventory)).toContain('@web:');
    expect(inventoryList(inventory)._meta.hostvars.idx01).toEqual(inventory.hostvars.idx01);
  });
  it('uses the same union, intersection, exclusion, glob and limit semantics', () => {
    const inventory = parseInventory(fixture(), 'inventory.yml');
    expect(inventoryHosts(inventory, 'web,prod')).toEqual(['idx01', 'idx02', 'idx03']);
    expect(inventoryHosts(inventory, 'web:&prod')).toEqual(['idx01']);
    expect(inventoryHosts(inventory, 'all:!web')).toEqual(['idx03']);
    expect(inventoryHosts(inventory, 'idx0*')).toEqual(['idx01', 'idx02', 'idx03']);
    expect(inventoryHosts(inventory, 'missing')).toEqual([]);
    expect(() => inventoryHosts(inventory, '~unsafe')).toThrow();
  });
  it('supports repeated multi-parent groups, detects cycles and rejects unsupported properties/tags', () => {
    const data = tree({
      'i.yml':
        'all:\n  children:\n    a:\n      children:\n        shared:\n          hosts: { idx01: {} }\n    b:\n      children:\n        shared: {}\n',
    });
    expect(inventoryHosts(parseInventory(data, 'i.yml'), 'a:&b')).toEqual(['idx01']);
    data['i.yml']!.text =
      'all:\n  children:\n    a:\n      children:\n        b:\n          children: { a: {} }\n';
    expect(() => parseInventory(data, 'i.yml')).toThrow(/Circular/);
    for (const text of [
      'all: { shell: something }',
      'all: !execute code',
      'all: { hosts: { constructor: {} } }',
    ]) {
      data['i.yml']!.text = text;
      expect(() => parseInventory(data, 'i.yml')).toThrow();
    }
  });
  it('uses inventory-relative and playbook-relative group files; host files win', () => {
    const data = fixture();
    data['inventories/lab/hosts.yml'] = data['inventory.yml']!;
    data['inventories/lab/group_vars/web.yml'] = { text: 'setting: inventory\n', mode: 420 };
    data['group_vars/web.yml']!.text = 'setting: playbook\n';
    data['host_vars/idx02.yml'] = { text: 'setting: host\n', mode: 420 };
    expect(parseInventory(data, 'inventories/lab/hosts.yml').hostvars.idx02!.setting).toBe('host');
    expect(parseInventory(data, 'inventories/lab/hosts.yml').hostvars.idx01!.setting).toBe('playbook');
  });
  it('targets the same hosts in a real playbook and does not change the preview world', () => {
    const world = lab();
    const data = fixture();
    data['ansible.cfg'] = { text: '[defaults]\ninventory = inventory.yml\n', mode: 420 };
    data['ping.yml'] = { text: '- hosts: "web:&prod"\n  tasks:\n    - ping: {}\n', mode: 420 };
    const result = runAnsible(world, data, 'ping.yml', { check: true });
    expect(result.hosts.map((h) => h.host)).toEqual(['idx01']);
    expect(result.failed).toBe(0);
    expect(world.hosts.fsOverlay.size).toBe(0);
  });
  it('inspects a 35k-host inventory without materializing managed-host filesystems', () => {
    const world = lab();
    const data = tree({
      'large.yml':
        'all:\n  children:\n    fleet:\n      hosts:\n' +
        Array.from({ length: 35000 }, (_, n) => `        uf${n}: {}`).join('\n'),
    });
    const inventory = parseInventory(data, 'large.yml');
    expect(inventoryHosts(inventory, 'fleet')).toHaveLength(35000);
    expect(world.hosts.fsOverlay.size).toBe(0);
  }, 30000);
});

describe('automation CLI and view consistency', () => {
  it('implements graph, list, hostvars, config discovery, patterns and ping with truthful errors', () => {
    const world = lab(),
      term = new TerminalSession({ world });
    let output = '';
    term.onOutput((v) => (output += v));
    term.start();
    const run = (command: string) => {
      output = '';
      term.input(command + '\r');
      return stripAnsi(output);
    };
    run('ssh svc_ansible@ansible01');
    run('cd ~/splunk-automation');
    expect(run('ansible --version')).toContain('compatibility simulation');
    expect(run('ansible-config dump')).toContain('DEFAULT_HOST_LIST');
    expect(run('ansible-inventory --graph')).toContain('@indexers:');
    expect(run('ansible-inventory --list')).toContain('hostvars');
    expect(run('ansible-inventory --host idx01')).toContain('splunk_home');
    expect(run('ansible "indexers:!idx03" --list-hosts')).toContain('hosts (2)');
    expect(run('ansible indexers -m ping --limit idx01')).toContain('idx01 | SUCCESS');
    expect(run('ansible --made-up')).toContain('Unsupported flag');
    run('export ANSIBLE_INVENTORY=missing.yml');
    expect(run('ansible-inventory --list')).toContain('missing.yml');
    expect(run('ansible-inventory -i inventories/lab/hosts.yml --graph')).toContain('@all:');
    term.dispose();
  });
  it('sees repository edits in UI, reports drift and keeps them after replay', () => {
    const world = lab();
    const host = resolveHost(world, 'ansible01')!,
      fs = hostFs(world, host);
    const path = '/home/svc_ansible/splunk-automation/inventories/lab/hosts.yml';
    fs.writeFile(path, fs.readFile(path, ROOT).replace(/^\s+idx03:.*\n/m, ''), ROOT);
    const view = automationView(world);
    expect(view.enabled && view.inventory?.drift.missing).toContain('idx03');
    expect(view.enabled && view.inventory?.hostvars.idx03).toBeUndefined();
    const restored = loadWorld(saveWorld(world), []);
    expect(automationView(restored)).toEqual(view);
    expect(
      inventoryDrift(world, parseInventory(tree({ 'i.yml': 'all: { hosts: { unknown: {} } }' }), 'i.yml'))
        .unknown,
    ).toContain('unknown');
  });
});
