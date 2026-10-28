import { V7_UPGRADE_STARTER_FILES } from './upgrade-starters';
import { V7_CLUSTER_STARTER_FILES } from './cluster-starters';
import { V7_FORWARDER_STARTER_FILES, V7_FORWARDER_CONNECTION_FILES } from './forwarder-starters';
import type { World } from '../world';
import { resolveHost } from '../hosts/profile';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { filesUnder, checksum } from '../hosts/cluster';
import { TrainingError } from '../training/engine';

/** Versioned additions. Never rewrite the V6 seed commits or existing learner files. */
export const V7_STARTER_FILES: Readonly<Record<string, string>> = {
  'README.v7.md':
    '# V7 operational starters\n\nThese are explicit source changes, not a deployment. Review git status and the files, create a feature branch, commit and push, then use Code & Ansible for checks/approval/merge. Run the committed playbook separately. A revert also needs a new reviewed deployment.\n\nplaybooks/v7_connectivity.yml checks Linux inventory transport.\nplaybooks/v7_inputs.yml installs an explicit training file and a monitored-input app on the Deployment Server, with ownership and an on-change restart handler. It does not modify indexer peers directly.\nplaybooks/v7_validate.yml reads the same virtual management service and btool configuration as Web/CLI.\n\nStart with --syntax-check, then --check --diff --limit ds01. Apply to ds01, run again for changed=0, and inspect btool inputs list --debug plus an independent search of sourcetype=v7_automation after a clock tick.\n\nLegacy playbooks remain for the original tutorials; their inherited limits do not establish forwarder installation, certificate rotation or other V7 operational coverage.\n',
  'playbooks/v7_connectivity.yml':
    '- name: Validate Linux managed-host connectivity\n  hosts: deployment_server\n  gather_facts: false\n  tasks:\n    - name: Verify simulated transport\n      ansible.builtin.ping: {}\n',
  'playbooks/v7_inputs.yml':
    '- name: Apply reviewed training input on the Deployment Server\n  hosts: deployment_server\n  gather_facts: false\n  become: true\n  serial: 1\n  roles:\n    - v7_inputs\n',
  'roles/v7_inputs/defaults/main.yml':
    'practice_index: os\npractice_sourcetype: v7_automation\npractice_source: /var/log/practice/automation.log\n',
  'roles/v7_inputs/templates/inputs.conf.j2':
    '[monitor://{{ practice_source }}]\nindex = {{ practice_index }}\nsourcetype = {{ practice_sourcetype }}\ndisabled = false\n',
  'roles/v7_inputs/files/automation.log':
    'status=200 service=automation message="Explicit V7 teaching fixture"\n',
  'roles/v7_inputs/tasks/main.yml':
    '- name: Create the managed input app\n  ansible.builtin.file:\n    path: "{{ splunk_home }}/etc/apps/v7_practice/local"\n    state: directory\n    owner: splunk\n    group: splunk\n    mode: "0750"\n- name: Supply the explicit teaching log\n  ansible.builtin.copy:\n    src: automation.log\n    dest: "{{ practice_source }}"\n    owner: splunk\n    group: splunk\n    mode: "0640"\n- name: Render the monitored input\n  ansible.builtin.template:\n    src: inputs.conf.j2\n    dest: "{{ splunk_home }}/etc/apps/v7_practice/local/inputs.conf"\n    owner: splunk\n    group: splunk\n    mode: "0640"\n  notify: v7 restart splunk\n',
  'roles/v7_inputs/handlers/main.yml':
    '- name: v7 restart splunk\n  ansible.builtin.service:\n    name: Splunkd\n    state: restarted\n',
  'playbooks/v7_validate.yml':
    '- name: Verify the deployed configuration and running management service\n  hosts: deployment_server\n  gather_facts: false\n  tasks:\n    - name: Inspect configuration provenance\n      ansible.builtin.command: splunk btool inputs list --debug\n      become: true\n      changed_when: false\n    - name: Read actual virtual management data\n      ansible.builtin.uri:\n        url: "https://{{ inventory_hostname }}:8089/services/server/info"\n        method: GET\n        return_content: true\n      register: management\n      when: not ansible_check_mode\n    - name: Verify management response\n      ansible.builtin.assert:\n        that: management.status == 200\n      when: not ansible_check_mode\n',
};
export const V7_OPERATIONAL_STARTER_FILES = {
  ...V7_UPGRADE_STARTER_FILES,
  ...V7_CLUSTER_STARTER_FILES,
  ...V7_STARTER_FILES,
  ...V7_FORWARDER_STARTER_FILES,
  ...V7_FORWARDER_CONNECTION_FILES,
};
function workspace(world: World) {
  const checkout = world.git?.checkouts.find((c) => c.repo === 'splunk-automation'),
    host = checkout && resolveHost(world, checkout.host);
  if (!checkout || !host) throw new TrainingError('Choose Lab or APL with an automation workspace');
  return { checkout, fs: hostFs(world, host) };
}
export function previewStarterPack(world: World) {
  const { checkout, fs } = workspace(world),
    tree = filesUnder(fs, checkout.root);
  const files = Object.entries(V7_OPERATIONAL_STARTER_FILES).map(([path, text]) => {
    const full = checkout.root + '/' + path,
      node = fs.findNode(full);
    let blocked = false;
    for (
      let parent = full.slice(0, full.lastIndexOf('/'));
      parent.length > checkout.root.length;
      parent = parent.slice(0, parent.lastIndexOf('/'))
    ) {
      const ancestor = fs.findNode(parent);
      if (ancestor && ancestor.type !== 'dir') blocked = true;
    }
    return {
      path,
      status:
        blocked || (node && (node.type !== 'file' || tree[path] !== text))
          ? ('conflict' as const)
          : node
            ? ('present' as const)
            : ('missing' as const),
    };
  });
  return { version: 4, host: checkout.host, root: checkout.root, revision: checksum(tree), files };
}
export function installStarterPack(world: World, revision: string) {
  const preview = previewStarterPack(world);
  if (preview.revision !== revision)
    throw new TrainingError('Working files changed; review the starter preview again');
  if (preview.files.some((file) => file.status === 'conflict'))
    throw new TrainingError(
      'Existing files conflict with the V7 starter additions. Review them; no files were overwritten.',
    );
  const { checkout, fs } = workspace(world),
    owner = checkout.root.split('/')[2]!;
  for (const file of preview.files.filter((file) => file.status === 'missing')) {
    const path = checkout.root + '/' + file.path;
    fs.mkdir(path.slice(0, path.lastIndexOf('/')), { user: owner, groups: [owner] }, { parents: true });
    fs.writeFile(path, V7_OPERATIONAL_STARTER_FILES[file.path]!, ROOT);
    fs.setMeta(path, { owner, group: owner, mode: 0o644 }, ROOT);
  }
  return previewStarterPack(world);
}
