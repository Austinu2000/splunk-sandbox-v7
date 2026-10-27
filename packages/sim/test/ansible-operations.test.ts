import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  runAnsible,
  saveWorld,
  loadWorld,
  resolveHost,
  runningConf,
  kvCollections,
  kvRead,
  kvState,
} from '../src/index';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import type { Tree } from '../src/git/state';
const lab = () =>
  createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
const tree = (w: ReturnType<typeof lab>, text: string, files: Record<string, string> = {}): Tree => {
  const r = w.git!.repos['splunk-automation']!;
  return {
    ...structuredClone(r.commits[r.branches.main!]!.tree),
    'playbooks/operations.yml': { text, mode: 0o644 },
    ...Object.fromEntries(Object.entries(files).map(([path, text]) => [path, { text, mode: 0o644 }])),
  };
};
const execute = (w: ReturnType<typeof lab>, t: Tree, options: Parameters<typeof runAnsible>[3] = {}) =>
  runAnsible(w, t, 'playbooks/operations.yml', options);
describe('bounded Ansible operational semantics', () => {
  it('runs handlers once in definition order and retains role paths and scoped variables', () => {
    const w = lab(),
      t = tree(
        w,
        '- hosts: deployment_server\n  become: true\n  roles: [alpha, beta]\n  tasks:\n    - copy:\n        content: trigger\n        dest: /tmp/trigger\n      notify: [second, first, second]\n  handlers:\n    - name: first\n      copy: {content: first, dest: /tmp/first}\n    - name: second\n      copy: {content: second, dest: /tmp/second}\n',
        {
          'roles/alpha/defaults/main.yml': 'message: alpha\n',
          'roles/alpha/tasks/main.yml':
            '- template: {src: message.j2, dest: /tmp/alpha}\n  notify: alpha handler\n',
          'roles/alpha/templates/message.j2': '{{ message }}\n',
          'roles/alpha/handlers/main.yml':
            '- name: alpha handler\n  template: {src: message.j2, dest: /tmp/alpha-handler}\n',
          'roles/beta/defaults/main.yml': 'message: beta\n',
          'roles/beta/tasks/main.yml': '- template: {src: message.j2, dest: /tmp/beta}\n',
          'roles/beta/templates/message.j2': '{{ message }}\n',
        },
      );
    const result = execute(w, t);
    expect(result.failed).toBe(0);
    const fs = hostFs(w, resolveHost(w, 'ds01')!);
    expect(fs.readFile('/tmp/alpha', ROOT)).toBe('alpha\n');
    expect(fs.readFile('/tmp/beta', ROOT)).toBe('beta\n');
    expect(fs.readFile('/tmp/alpha-handler', ROOT)).toBe('alpha\n');
    expect(result.hosts[0]!.messages.filter((m) => m.startsWith('RUNNING HANDLER:'))).toEqual([
      'RUNNING HANDLER: first',
      'RUNNING HANDLER: second',
      'RUNNING HANDLER: alpha handler',
    ]);
    expect(execute(w, t).changed).toBe(0);
    expect(loadWorld(saveWorld(w), []).hosts.fsOverlay).toEqual(w.hosts.fsOverlay);
  });
  it('applies task variables, numeric conditions, facts and highest-priority extra variables without leaks', () => {
    const w = lab(),
      t = tree(
        w,
        '- hosts: deployment_server\n  become: true\n  vars: {message: play}\n  tasks:\n    - set_fact: {ready: true}\n    - copy: {content: "{{ message }}", dest: /tmp/scoped}\n      vars: {message: task}\n      when: ready\n    - copy: {content: "{{ message }}", dest: /tmp/unscoped}\n    - assert:\n        that: [ready is defined, not missing is defined, "2 > 1"]\n',
      );
    expect(execute(w, t).failed).toBe(0);
    t['playbooks/operations.yml']!.text = t['playbooks/operations.yml']!.text.replace(
      '"2 > 1"',
      '"counter >= 2"',
    ).replace('message: play', 'message: play, counter: 2');
    expect(execute(w, t).failed).toBe(0);
    const fs = hostFs(w, resolveHost(w, 'ds01')!);
    expect(fs.readFile('/tmp/scoped', ROOT)).toBe('task');
    expect(fs.readFile('/tmp/unscoped', ROOT)).toBe('play');
    expect(execute(w, t, { extraVars: { message: 'extra' } }).failed).toBe(0);
    expect(fs.readFile('/tmp/scoped', ROOT)).toBe('extra');
    expect(fs.readFile('/tmp/unscoped', ROOT)).toBe('extra');
  });
  it('predicts content and permission changes on a disposable world, then applies idempotently', () => {
    const w = lab(),
      t = tree(
        w,
        '- hosts: deployment_server\n  become: true\n  tasks:\n    - copy:\n        content: ""\n        dest: /tmp/empty\n        owner: splunk\n        group: splunk\n        mode: "0640"\n',
      );
    const check = execute(w, t, { check: true, diff: true });
    expect(check.changed).toBe(1);
    expect(hostFs(w, resolveHost(w, 'ds01')!).exists('/tmp/empty')).toBe(false);
    expect(execute(w, t).changed).toBe(1);
    const node = hostFs(w, resolveHost(w, 'ds01')!).findNode('/tmp/empty')!;
    expect(node).toMatchObject({ owner: 'splunk', group: 'splunk', mode: 0o640 });
    expect(execute(w, t).changed).toBe(0);
    hostFs(w, resolveHost(w, 'ds01')!).setMeta('/tmp/empty', { mode: 0o600 }, ROOT);
    expect(execute(w, t).changed).toBe(1);
    expect(loadWorld(saveWorld(w), []).hosts.fsOverlay).toEqual(w.hosts.fsOverlay);
  });
  it('returns actual URI JSON for a known service, fails unknown endpoints, and skips URI in check mode', () => {
    const w = lab(),
      source =
        '- hosts: deployment_server\n  tasks:\n    - uri: {url: "https://{{ inventory_hostname }}:8089/services/server/info"}\n      register: response\n    - assert:\n        that: response.status == 200\n      when: not ansible_check_mode\n',
      t = tree(w, source);
    expect(execute(w, t).failed).toBe(0);
    expect(execute(w, t, { check: true }).hosts[0]!.messages.join('\n')).toContain('skipped');
    t['playbooks/operations.yml']!.text = source.replace('/services/server/info', '/services/not-real');
    expect(execute(w, t).failed).toBe(1);
    t['playbooks/operations.yml']!.text = source
      .replace('ds01', 'missing-host')
      .replace('https://{{ inventory_hostname }}', 'https://unknown-host');
    expect(execute(w, t).failed).toBe(1);
  });
  it('does not grant service control without become or accept bundle deployment on the wrong component', () => {
    const w = lab();
    for (const task of [
      'service: {name: Splunkd, state: restarted}',
      'command: splunk apply cluster-bundle',
      'command: splunk reload deploy-server',
    ]) {
      const t = tree(w, '- hosts: indexers\n  tasks:\n    - ' + task + '\n');
      const result = execute(w, t, { limit: 'idx01' });
      expect(result.failed).toBe(1);
    }
    expect(
      runningConf(w, resolveHost(w, 'idx01')!, 'server').stanzas.get('clustering')?.settings.get('mode')
        ?.value,
    ).toBe('peer');
  });
  it('renders native KV JSON bodies, preserves numeric types and repeats configuration without changes', () => {
    const w = lab();
    const configure = `- hosts: search_heads
  vars: {collection_name: automated_services}
  tasks:
    - uri:
        url: https://{{ inventory_hostname }}:8089/servicesNS/nobody/sandbox_training/storage/collections/config
        method: POST
        body_format: json
        url_username: admin
        url_password: training-only
        body: {name: "{{ collection_name }}", field.name: string, field.priority: number, enforceTypes: "true"}
`;
    const t = tree(w, configure);
    expect(execute(w, t, { limit: 'sh01' }).failed).toBe(0);
    expect(execute(w, t, { limit: 'sh01' }).changed).toBe(0);
    expect(
      kvCollections(w, 'sh01', 'sandbox_training').find((c) => c.collection === 'automated_services')
        ?.settings,
    ).toMatchObject({ 'field.name': 'string', 'field.priority': 'number' });
    t['playbooks/operations.yml']!.text = `- hosts: search_heads
  vars: {service_name: checkout}
  tasks:
    - uri:
        url: https://{{ inventory_hostname }}:8089/servicesNS/nobody/sandbox_training/storage/collections/data/automated_services
        method: POST
        body_format: json
        url_username: admin
        url_password: training-only
        body: {_key: checkout, name: "{{ service_name }}", priority: 2}
`;
    expect(execute(w, t, { limit: 'sh01' }).failed).toBe(0);
    expect(kvRead(w, 'sh01', 'sandbox_training', 'automated_services')).toMatchObject([
      { name: 'checkout', priority: 2 },
    ]);
  });
  it('skips native URI writes in check mode and refuses a write override', () => {
    const w = lab();
    kvState(w);
    const source = `- hosts: search_heads
  tasks:
    - uri:
        url: https://{{ inventory_hostname }}:8089/servicesNS/nobody/sandbox_training/storage/collections/config
        method: POST
        body_format: json
        url_username: admin
        url_password: training-only
        body: {name: predicted, field.name: string}
`,
      t = tree(w, source),
      before = structuredClone({
        hosts: w.hosts,
        kvstore: w.kvstore,
        clock: w.clock,
        ingestion: w.ingestion,
      });
    const result = execute(w, t, { limit: 'sh01', check: true });
    expect(result.failed).toBe(0);
    expect(result.changed).toBe(0);
    expect(result.hosts[0]!.messages.join(' ')).toContain('skipped');
    expect({ hosts: w.hosts, kvstore: w.kvstore, clock: w.clock, ingestion: w.ingestion }).toEqual(before);
    t['playbooks/operations.yml']!.text = source + '      check_mode: false\n';
    const override = execute(w, t, { limit: 'sh01', check: true });
    expect(override.failed).toBe(1);
    expect({ hosts: w.hosts, kvstore: w.kvstore, clock: w.clock, ingestion: w.ingestion }).toEqual(before);
  });
});
