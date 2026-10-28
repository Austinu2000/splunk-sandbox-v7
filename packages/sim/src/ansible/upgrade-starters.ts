import { enterprisePackage, MAINTENANCE_PACKAGE, sha256Text } from '../engineering/maintenance-state';
const packageText = enterprisePackage();
export const V7_UPGRADE_STARTER_FILES: Readonly<Record<string, string>> = {
  'README.v7-maintenance.md':
    '# V7 enterprise maintenance automation\n\nThese native-shaped playbooks operate only on the virtual World. The .tgz file is a JSON teaching descriptor, not a vendor archive. SHA-256 is real. GUI configuration archives and KV data backups are separate. Capture a current maintenance preflight before a standalone manual upgrade. The startup flag is a nonbinding simulation acknowledgement. Peer/search-head package changes require the reviewed coordinator. URI uses only known virtual management hosts.\n\nTransport checks are read-only. Policy application is scoped to standalone infrastructure components, with on-change handlers. v7_upgrade_activate.yml is an explicit recovery playbook: it deliberately requests a restart after a failed handler; use the normal policy playbook for the final idempotence check.\n',
  'playbooks/v7_enterprise_transport.yml': `- name: Inspect actual Linux indexer management versions
  hosts: indexers
  tasks:
    - name: Check transport
      ping: {}
    - name: Read actual server identity
      uri:
        url: https://{{ inventory_hostname }}:8089/services/server/info
      register: management
    - assert:
        that: [management.status == 200, management.json.entry.0.content.version == '9.4.1']
`,
  'playbooks/v7_upgrade_policy.yml': `- name: Reconcile reviewed standalone infrastructure throughput policy
  hosts: deployment_server:heavy_forwarders:license_manager
  become: true
  serial: 1
  any_errors_fatal: true
  roles: [v7_upgrade_checks]
`,
  'roles/v7_upgrade_checks/defaults/main.yml': 'policy_rate: 128\n',
  'roles/v7_upgrade_checks/tasks/main.yml': `- file:
    path: /opt/splunk/etc/apps/v7_upgrade_checks/local
    state: directory
    owner: splunk
    group: splunk
    mode: '0750'
- template:
    src: limits.conf.j2
    dest: /opt/splunk/etc/apps/v7_upgrade_checks/local/limits.conf
    owner: splunk
    group: splunk
    mode: '0640'
  notify: restart reviewed Splunk service
- name: Inspect active management identity
  uri:
    url: https://{{ inventory_hostname }}:8089/services/server/info
  register: management
- assert:
    that: management.status == 200
`,
  'roles/v7_upgrade_checks/templates/limits.conf.j2': '[thruput]\nmaxKBps={{ policy_rate }}\n',
  'roles/v7_upgrade_checks/handlers/main.yml': `- name: restart reviewed Splunk service
  service: {name: Splunkd, state: restarted}
`,
  'playbooks/v7_upgrade_activate.yml': `- name: Explicitly recover a previously failed restart handler
  hosts: deployment_server:heavy_forwarders:license_manager
  become: true
  serial: 1
  tasks:
    - name: Inspect staged native policy and explicitly request recovery activation
      command: splunk btool limits list --debug
      changed_when: true
      notify: restart reviewed Splunk service
  handlers:
    - name: restart reviewed Splunk service
      service: {name: Splunkd, state: restarted}
`,
  'playbooks/v7_enterprise_preflight.yml': `- name: Collect actual versions and verify staged teaching artifacts
  hosts: license_manager:cluster_manager:search_heads:indexers
  become: true
  serial: 1
  tasks:
    - command: sha256sum -c ${MAINTENANCE_PACKAGE}.sha256
      changed_when: false
    - uri:
        url: https://{{ inventory_hostname }}:8089/services/server/info
      register: management
    - assert:
        that: [management.status == 200, management.json.entry.0.content.version == '9.4.1']
`,
  'files/v7-enterprise.tgz': packageText,
  'files/v7-enterprise.sha256': sha256Text(packageText) + '  ' + MAINTENANCE_PACKAGE + '\n',
  'playbooks/v7_enterprise_repair.yml': `- name: Restore only the reviewed pending indexer package artifact
  hosts: indexers
  become: true
  serial: 1
  tasks:
    - copy:
        src: files/v7-enterprise.tgz
        dest: ${MAINTENANCE_PACKAGE}
        owner: splunk
        group: splunk
        mode: '0600'
    - copy:
        src: files/v7-enterprise.sha256
        dest: ${MAINTENANCE_PACKAGE}.sha256
        owner: splunk
        group: splunk
        mode: '0600'
    - command: sha256sum -c ${MAINTENANCE_PACKAGE}.sha256
      changed_when: false
`,
  'playbooks/v7_enterprise_upgrade.yml': `- name: Apply a preflight-reviewed standalone teaching package
  hosts: heavy_forwarders
  become: true
  serial: 1
  any_errors_fatal: true
  tasks:
    - uri:
        url: https://{{ inventory_hostname }}:8089/services/server/info
      register: before
    - command: sha256sum -c ${MAINTENANCE_PACKAGE}.sha256
      changed_when: false
    - service: {name: Splunkd, state: stopped}
      when: before.json.entry.0.content.version != '9.4.2'
    - command: tar -xzf ${MAINTENANCE_PACKAGE} -C /opt
      when: before.json.entry.0.content.version != '9.4.2'
    - name: Accept only the nonbinding training flag and start the virtual service
      command: splunk start --accept-license --answer-yes --no-prompt
      when: before.json.entry.0.content.version != '9.4.2'
    - uri:
        url: https://{{ inventory_hostname }}:8089/services/server/info
      register: upgraded
    - assert:
        that: upgraded.json.entry.0.content.version == '9.4.2'
`,
};
