/** Native-shaped, explicitly local teaching workflows. training-only is a fixture credential. */
export const V7_CLUSTER_STARTER_FILES: Readonly<Record<string, string>> = {
  'README.v7-clusters.md':
    '# V7 cluster and KV practice\n\nThese files are source additions, not a deployment. Review scope and source before running. Use the Cluster/SHC operation pages to advance and inspect coordinated jobs. URI uses virtual HTTPS only. admin:training-only is a built-in fictional practice principal, not a real credential. Native URI does not support check mode here; it skips unless a read-only task explicitly opts in. No dry-run override may write KV data.\n\nUse --limit cm01 for manager work, --limit deployer01 for SHC source, and --limit sh01 for KV maintenance. A completed Ansible run can mean a cluster job is queued; verify the job separately. Source editing, validation, publication and activation are separate.\n',
  'playbooks/v7_cluster_preflight.yml': `- name: Validate the current manager source without publishing
  hosts: cluster_manager
  become: true
  tasks:
    - command: splunk validate cluster-bundle
      register: bundle
      changed_when: false
    - assert:
        that: bundle.json.valid == true
`,
  'playbooks/v7_cluster_indexes.yml': `- name: Stage and publish reviewed index definitions
  hosts: cluster_manager
  become: true
  roles: [v7_cluster_indexes]
`,
  'roles/v7_cluster_indexes/defaults/main.yml': 'managed_index: automation_orders\n',
  'roles/v7_cluster_indexes/tasks/main.yml': `- name: Preserve existing indexes while adding the managed stanza
  blockinfile:
    path: /opt/splunk/etc/manager-apps/_cluster/local/indexes.conf
    block: |
      [{{ managed_index }}]
      homePath = $SPLUNK_DB/{{ managed_index }}/db
      coldPath = $SPLUNK_DB/{{ managed_index }}/colddb
      thawedPath = $SPLUNK_DB/{{ managed_index }}/thaweddb
      repFactor = auto
  notify: [validate cluster source, publish cluster source]
`,
  'roles/v7_cluster_indexes/handlers/main.yml': `- name: validate cluster source
  command: splunk validate cluster-bundle
  changed_when: false
- name: publish cluster source
  command: splunk apply cluster-bundle
`,
  'playbooks/v7_cluster_restart.yml': `- name: Inspect actual factors before requesting a searchable restart
  hosts: cluster_manager
  become: true
  tasks:
    - uri:
        url: https://{{ inventory_hostname }}:8089/services/cluster/manager/info
      register: health
      check_mode: false
    - assert:
        that: [health.json.searchFactorMet == true, health.json.allDataSearchable == true]
    - command: splunk rolling-restart cluster-peers -searchable true
`,
  'playbooks/v7_shc_stage.yml': `- name: Stage SHC application source only
  hosts: deployer
  become: true
  roles: [v7_shc_stage]
`,
  'roles/v7_shc_stage/tasks/main.yml': `- file: {path: /opt/splunk/etc/shcluster/apps/v7_status/local, state: directory, owner: splunk, group: splunk}
- copy:
    content: "[V7 cluster status]\\nsearch = index=source_logs | stats count\\n"
    dest: /opt/splunk/etc/shcluster/apps/v7_status/local/savedsearches.conf
    owner: splunk
    group: splunk
    mode: "0644"
`,
  'playbooks/v7_shc_deploy.yml': `- name: Stage then publish the reviewed SHC defaults
  hosts: deployer
  become: true
  roles: [v7_shc_deploy]
`,
  'roles/v7_shc_deploy/tasks/main.yml': `- file: {path: /opt/splunk/etc/shcluster/apps/v7_status/local, state: directory, owner: splunk, group: splunk}
- copy:
    content: "[V7 cluster status]\\nsearch = index=source_logs | stats count\\n"
    dest: /opt/splunk/etc/shcluster/apps/v7_status/local/savedsearches.conf
    owner: splunk
    group: splunk
    mode: "0644"
  notify: publish SHC defaults
`,
  'roles/v7_shc_deploy/handlers/main.yml': `- name: publish SHC defaults
  command: splunk apply shcluster-bundle -target https://sh01:8089
`,
  'playbooks/v7_kv_collection.yml': `- name: Configure a typed collection through virtual native REST
  hosts: search_heads
  tasks:
    - uri:
        url: https://{{ inventory_hostname }}:8089/servicesNS/nobody/kv_training/storage/collections/config
        method: POST
        body_format: json
        url_username: admin
        url_password: training-only
        body: {name: service_owners, field.service: string, field.owner: string, enforceTypes: "true"}
`,
  'playbooks/v7_kv_backup.yml': `- name: Verify readiness and take a named virtual snapshot
  hosts: search_heads
  become: true
  tasks:
    - uri: {url: "https://{{ inventory_hostname }}:8089/services/kvstore/status"}
      register: health
      check_mode: false
    - assert: {that: "health.json.status == 'ready'"}
    - command: splunk backup kvstore -archiveName v7_automated
`,
  'playbooks/v7_kv_restore.yml': `- name: Restore the verified snapshot then inspect the same management state
  hosts: search_heads
  become: true
  tasks:
    - command: splunk restore kvstore -archiveName v7_verified
    - uri: {url: "https://{{ inventory_hostname }}:8089/services/kvstore/status"}
      register: health
      when: not ansible_check_mode
    - assert: {that: "health.json.status == 'ready'"}
      when: not ansible_check_mode
`,
};
