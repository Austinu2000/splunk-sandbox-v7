import { hashString, mix32 } from '../rng';
import type { World } from '../world';
import { hostname } from '../fleet/query';

export interface GitFile {
  text: string;
  mode: number;
}
export type Tree = Record<string, GitFile>;
export interface Commit {
  id: string;
  parents: string[];
  tree: Tree;
  name: string;
  email: string;
  message: string;
  tick: number;
}
export interface Repo {
  id: string;
  commits: Record<string, Commit>;
  branches: Record<string, string>;
}
export interface Checkout {
  host: string;
  root: string;
  repo: string;
  branch: string | null;
  detached?: string;
  branches: Record<string, string>;
  tracking: Record<string, string>;
  upstream: Record<string, string>;
  index: Tree;
  conflicts: string[];
  mergeParent?: string;
  mergeOriginal?: Tree;
  stashes: { base: Tree; index: Tree; work: Tree }[];
  identity: { name?: string; email?: string };
}
export interface GitState {
  version: 1;
  repos: Record<string, Repo>;
  checkouts: Checkout[];
  identities: Record<string, { name?: string; email?: string }>;
  unsafe: { tick: number; host: string; command: string; reason: string }[];
}
export const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
export function commitObject(
  repo: Repo,
  tree: Tree,
  parents: string[],
  message: string,
  name: string,
  email: string,
  tick: number,
): Commit {
  const canonical = Object.fromEntries(Object.entries(tree).sort(([a], [b]) => a.localeCompare(b)));
  const text = JSON.stringify([parents, canonical, message, name, email, tick]);
  const h = hashString(text);
  const id = Array.from({ length: 5 }, (_, i) => mix32(h, i, text.length).toString(16).padStart(8, '0')).join(
    '',
  );
  const c = { id, tree: structuredClone(canonical), parents, message, name, email, tick };
  repo.commits[id] = c;
  return c;
}
export function head(c: Checkout): string {
  return c.branch ? c.branches[c.branch]! : c.detached!;
}
export function ancestor(repo: Repo, older: string, newer: string): boolean {
  const seen = new Set<string>();
  const queue = [newer];
  while (queue.length) {
    const id = queue.pop()!;
    if (id === older) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    queue.push(...(repo.commits[id]?.parents ?? []));
  }
  return false;
}
export function mergeBase(repo: Repo, a: string, b: string): string | undefined {
  const queue = [a],
    seen = new Set<string>();
  while (queue.length) {
    const id = queue.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    if (ancestor(repo, id, b)) return id;
    queue.push(...(repo.commits[id]?.parents ?? []));
  }
  return undefined;
}
export function initialFiles(world: World, repo: string): Tree {
  const out: Tree = {};
  const put = (path: string, text: string) => {
    out[path] = { text, mode: 0o644 };
  };
  put(
    'README.md',
    `# ${repo}\n\nOffline Splunk engineering practice repository.\nEdit, review, and deploy changes through the sandbox.\n`,
  );
  put('.gitignore', '.vault_pass\n*.retry\n');
  if (repo === 'splunk-apps') {
    put(
      'manager-apps/_cluster/default/indexes.conf',
      (world.config.profile?.indexes ?? [])
        .map(
          (i) =>
            `[${i.name}]\nfrozenTimePeriodInSecs = ${i.retentionDays * 86400}\nmaxTotalDataSizeMB = 500000\n`,
        )
        .join('\n'),
    );
    for (const scope of [
      'manager-apps/_cluster',
      'deployment-apps/TA_outputs',
      'shcluster/apps/search_baseline',
    ])
      put(`${scope}/default/app.conf`, '[install]\nstate = enabled\n[ui]\nis_visible = false\n');
    put(
      'deployment-apps/TA_outputs/default/outputs.conf',
      '[tcpout]\ndefaultGroup = indexers\n[tcpout:indexers]\nserver = idx01:9997,idx02:9997,idx03:9997\n',
    );
    put(
      'manager-apps/_cluster/default/props.conf',
      '[fgt_traffic]\nSHOULD_LINEMERGE = false\nLINE_BREAKER = ([\\r\\n]+)\n',
    );
    put(
      'manager-apps/_cluster/default/transforms.conf',
      '[set_fortinet]\nREGEX = .\nDEST_KEY = _MetaData:Index\nFORMAT = fortinet\n',
    );
    put(
      'deployment-apps/TA_outputs/default/inputs.conf',
      '[monitor:///var/log/messages]\nindex = os\nsourcetype = syslog\n',
    );
    put(
      'shcluster/apps/search_baseline/default/savedsearches.conf',
      '[Fleet health]\nsearch = index=_internal | stats count by host\ncron_schedule = */5 * * * *\nenableSched = 1\n',
    );
    return out;
  }
  const inventory = world.config.profileId === 'lab' ? 'lab' : 'prod';
  put(
    'ansible.cfg',
    `[defaults]\ninventory = inventories/${inventory}/hosts.yml\nremote_user = svc_ansible\nretry_files_enabled = True\nroles_path = roles\n`,
  );
  const groups: Record<string, string[]> = {
    indexers: [],
    search_heads: [],
    shc_members: [],
    deployer: [],
    cluster_manager: [],
    deployment_server: [],
    license_manager: [],
    heavy_forwarders: [],
    universal_forwarders: [],
  };
  const names: Record<string, string> = {
    indexer: 'indexers',
    search_head: 'search_heads',
    deployer: 'deployer',
    cluster_manager: 'cluster_manager',
    deployment_server: 'deployment_server',
    license_manager: 'license_manager',
    heavy_forwarder: 'heavy_forwarders',
  };
  for (const n of world.infra) {
    if (n.retired) continue;
    const group = names[n.role];
    if (group) groups[group]!.push(n.hostname);
    if (
      n.role === 'search_head' &&
      n.hostname !== 'es01' &&
      world.config.profile?.infra.searchHeadCluster.deployer
    )
      groups.shc_members!.push(n.hostname);
  }
  for (let row = 0; row < world.fleet.size; row++) {
    const host = hostname(world, row),
      site = world.config.sites[world.fleet.site[row]!]!.id,
      cls = world.config.serverClasses[world.fleet.serverClass[row]!]!.id;
    groups.universal_forwarders!.push(host);
    (groups[`uf_${site}_${cls}`] ??= []).push(host);
  }
  put(
    `inventories/${inventory}/hosts.yml`,
    'all:\n  children:\n' +
      Object.entries(groups)
        .map(
          ([g, hosts]) =>
            `    ${g}:\n      hosts:${hosts.length ? '\n' + hosts.map((h) => `        ${h}: {}`).join('\n') : ' {}'}`,
        )
        .join('\n') +
      '\n',
  );
  put('group_vars/all/main.yml', 'splunk_home: /opt/splunk\n');
  put('group_vars/indexers.yml', 'max_total_data_size: 500000\n');
  put('host_vars/idx01.yml', 'splunk_home: /opt/splunk\n');
  const roles: Record<string, string> = {
    uf_install: 'splunk_uf',
    deploy_apps: 'splunk_outputs',
    rolling_restart: 'splunk_restart',
    cluster_bundle: 'splunk_indexes',
    shc_bundle: 'splunk_shc',
    cert_rotate: 'splunk_certs',
    serverclass_update: 'splunk_serverclass',
  };
  for (const [play, role] of Object.entries(roles)) {
    const target =
      play === 'serverclass_update'
        ? 'deployment_server'
        : play === 'shc_bundle'
          ? 'deployer'
          : play === 'uf_install' || play === 'cert_rotate'
            ? 'universal_forwarders'
            : 'indexers';
    put(
      `playbooks/${play}.yml`,
      `- name: ${play.replaceAll('_', ' ')}\n  hosts: ${target}\n  become: true\n${play === 'rolling_restart' ? '  serial: 1\n' : ''}  tasks:\n    - name: Apply ${role}\n      include_role:\n        name: ${role}\n`,
    );
    put(`roles/${role}/defaults/main.yml`, 'splunk_home: /opt/splunk\n');
    put(
      `roles/${role}/handlers/main.yml`,
      '- name: restart splunk\n  service:\n    name: Splunkd\n    state: restarted\n',
    );
    const conf = role === 'splunk_indexes' ? 'indexes' : role === 'splunk_outputs' ? 'outputs' : 'server';
    put(
      `roles/${role}/templates/${conf}.conf.j2`,
      role === 'splunk_indexes'
        ? '[os]\nmaxTotalDataSizeMB = {{ max_total_data_size }}\n'
        : role === 'splunk_outputs'
          ? '[tcpout]\ndefaultGroup = indexers\n[tcpout:indexers]\nserver = idx01:9997,idx02:9997,idx03:9997\n'
          : '[general]\nserverName = {{ inventory_hostname }}\n',
    );
    put(
      `roles/${role}/tasks/main.yml`,
      `- name: Install managed ${conf} settings\n  template:\n    src: ${conf}.conf.j2\n    dest: "{{ splunk_home }}/etc/system/local/${conf}.conf"\n  notify: restart splunk\n`,
    );
  }
  return out;
}
export function initGit(world: World): void {
  if (world.config.automationVersion !== 1 || world.git) return;
  const state: GitState = { version: 1, repos: {}, checkouts: [], identities: {}, unsafe: [] };
  for (const id of ['splunk-automation', 'splunk-apps']) {
    const repo: Repo = { id, commits: {}, branches: {} };
    const first = commitObject(
      repo,
      initialFiles(world, id),
      [],
      'Initial practice repository',
      'Platform Team',
      'platform@example.test',
      0,
    );
    repo.branches.main = first.id;
    state.repos[id] = repo;
    for (const n of world.infra.filter((n) => n.role === 'automation' || n.role === 'deployer')) {
      const user = n.role === 'automation' ? 'svc_ansible' : 'splunk';
      state.checkouts.push({
        host: n.hostname,
        root: `/home/${user}/${id}`,
        repo: id,
        branch: 'main',
        branches: { main: first.id },
        tracking: { main: first.id },
        upstream: { main: 'main' },
        index: structuredClone(first.tree),
        conflicts: [],
        stashes: [],
        identity: {},
      });
    }
  }
  world.git = state;
}
