/** Explicit additions to the existing repository; never replace V6 seed commits. */
export const V7_FORWARDER_STARTER_FILES: Readonly<Record<string, string>> = {
  'playbooks/v7_uf_install.yml':
    '- name: Install one verified Linux teaching forwarder\n  hosts: universal_forwarders\n  become: true\n  serial: 1\n  gather_facts: false\n  roles:\n    - v7_uf_install\n',
  'roles/v7_uf_install/defaults/main.yml': 'uf_version: "9.4.1"\nuf_home: /opt/splunkforwarder\n',
  'roles/v7_uf_install/tasks/main.yml':
    '- name: Install the explicit local teaching package\n  ansible.builtin.dnf:\n    name: "/opt/staging/splunkforwarder-{{ uf_version }}-simulated.x86_64.rpm"\n    state: present\n- name: Accept the teaching flag and start\n  ansible.builtin.command: /opt/splunkforwarder/bin/splunk start --accept-license --answer-yes --no-prompt\n- name: Enable service boot start\n  ansible.builtin.service:\n    name: SplunkForwarder\n    enabled: true\n    state: started\n',
  'playbooks/v7_uf_upgrade.yml':
    '- name: Upgrade a canary before expanding scope\n  hosts: universal_forwarders\n  become: true\n  serial: 1\n  gather_facts: false\n  vars:\n    uf_version: "9.4.1"\n  tasks:\n    - name: Read running package version before change\n      ansible.builtin.uri:\n        url: "https://{{ inventory_hostname }}:8089/services/server/info"\n      register: current\n      check_mode: false\n    - name: Stop the prior forwarder\n      ansible.builtin.service:\n        name: SplunkForwarder\n        state: stopped\n      when: current.json.entry.0.content.version != uf_version\n    - name: Upgrade the verified teaching package\n      ansible.builtin.dnf:\n        name: "/opt/staging/splunkforwarder-{{ uf_version }}-simulated.x86_64.rpm"\n        state: present\n      when: current.json.entry.0.content.version != uf_version\n    - name: Accept training flag and start after upgrade\n      ansible.builtin.command: /opt/splunkforwarder/bin/splunk start --accept-license --answer-yes --no-prompt\n      when: current.json.entry.0.content.version != uf_version\n',
  'playbooks/v7_uf_outputs.yml':
    '- name: Render an explicitly scoped forwarder output group\n  hosts: universal_forwarders\n  become: true\n  serial: 1\n  roles:\n    - v7_uf_outputs\n',
  'roles/v7_uf_outputs/defaults/main.yml':
    'uf_home: /opt/splunkforwarder\nforward_receiver: idx01.corp.example:9997\n',
  'roles/v7_uf_outputs/templates/outputs.conf.j2':
    '[tcpout]\ndefaultGroup = v7_receiver\n\n[tcpout:v7_receiver]\nserver = {{ forward_receiver }}\n',
  'roles/v7_uf_outputs/tasks/main.yml':
    '- name: Render the canary output settings\n  ansible.builtin.template:\n    src: outputs.conf.j2\n    dest: "{{ uf_home }}/etc/system/local/outputs.conf"\n    owner: splunk\n    group: splunk\n    mode: "0640"\n  notify: restart canary forwarder\n',
  'roles/v7_uf_outputs/handlers/main.yml':
    '- name: restart canary forwarder\n  ansible.builtin.service:\n    name: SplunkForwarder\n    state: restarted\n',
  'playbooks/v7_deployment_app.yml':
    '- name: Stage and publish an explicit canary input app\n  hosts: deployment_server\n  become: true\n  serial: 1\n  roles:\n    - v7_deployment\n',
  'roles/v7_deployment/defaults/main.yml': 'canary_host: lab-lnx-0001\n',
  'roles/v7_deployment/templates/inputs.conf.j2':
    '[monitor:///var/log/practice/forwarder.log]\nindex = os\nsourcetype = v7_forwarder\ndisabled = false\n',
  'roles/v7_deployment/tasks/main.yml':
    '- name: Create the deployment app scope\n  ansible.builtin.file:\n    path: /opt/splunk/etc/deployment-apps/v7_forwarder/local\n    state: directory\n    owner: splunk\n    group: splunk\n    mode: "0755"\n- name: Stage the input app template\n  ansible.builtin.template:\n    src: inputs.conf.j2\n    dest: /opt/splunk/etc/deployment-apps/v7_forwarder/local/inputs.conf\n    owner: splunk\n    group: splunk\n    mode: "0644"\n  notify: publish canary deployment\n- name: Add the canary assignment without replacing other classes\n  ansible.builtin.blockinfile:\n    path: /opt/splunk/etc/system/local/serverclass.conf\n    block: |\n      [serverClass:v7_forwarder]\n      whitelist.0 = {{ canary_host }}\n      [serverClass:v7_forwarder:app:v7_forwarder]\n      restartSplunkd = true\n  notify: publish canary deployment\n',
  'roles/v7_deployment/handlers/main.yml':
    '- name: publish canary deployment\n  ansible.builtin.command: /opt/splunk/bin/splunk reload deploy-server\n',
};

export const V7_FORWARDER_CONNECTION_FILES: Readonly<Record<string, string>> = {
  'playbooks/v7_uf_client.yml':
    '- name: Configure the canary deployment client\n  hosts: universal_forwarders\n  become: true\n  serial: 1\n  roles:\n    - v7_uf_client\n',
  'roles/v7_uf_client/defaults/main.yml':
    'uf_home: /opt/splunkforwarder\ndeployment_target: ds01.corp.example:8089\nphonehome_interval: 60\n',
  'roles/v7_uf_client/templates/deploymentclient.conf.j2':
    '[deployment-client]\nphoneHomeIntervalInSecs = {{ phonehome_interval }}\n\n[target-broker:deploymentServer]\ntargetUri = {{ deployment_target }}\n',
  'roles/v7_uf_client/tasks/main.yml':
    '- name: Render deployment-client settings\n  ansible.builtin.template:\n    src: deploymentclient.conf.j2\n    dest: "{{ uf_home }}/etc/system/local/deploymentclient.conf"\n    owner: splunk\n    group: splunk\n    mode: "0640"\n  notify: restart deployment client\n',
  'roles/v7_uf_client/handlers/main.yml':
    '- name: restart deployment client\n  ansible.builtin.service:\n    name: SplunkForwarder\n    state: restarted\n',
  'playbooks/v7_hf_routing.yml':
    '- name: Deploy parsing-tier routing on the Heavy Forwarder\n  hosts: heavy_forwarders\n  become: true\n  serial: 1\n  tasks:\n    - name: Create the routing app scope\n      ansible.builtin.file:\n        path: /opt/splunk/etc/apps/v7_routing/local\n        state: directory\n        owner: splunk\n        group: splunk\n        mode: "0755"\n    - name: Declare the routing transform\n      ansible.builtin.copy:\n        content: "[v7_index]\\nREGEX = .\\nDEST_KEY = _MetaData:Index\\nFORMAT = os\\n"\n        dest: /opt/splunk/etc/apps/v7_routing/local/transforms.conf\n      notify: restart routing tier\n    - name: Attach the transform to the incoming sourcetype\n      ansible.builtin.copy:\n        content: "[v7_forwarder]\\nTRANSFORMS-routing = v7_index\\n"\n        dest: /opt/splunk/etc/apps/v7_routing/local/props.conf\n      notify: restart routing tier\n  handlers:\n    - name: restart routing tier\n      ansible.builtin.service:\n        name: Splunkd\n        state: restarted\n',
};
