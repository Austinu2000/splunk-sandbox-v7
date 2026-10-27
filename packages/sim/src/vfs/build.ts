import { shcDefault } from '../operations';
import { infraName } from '../infra';
import { journal } from '../journal';
import { allDeploymentApps, deploymentAppFiles } from '../hosts/apps';
import { hostDataFiles } from '../hosts/inputs';
import {
  builtinApps,
  clusterBundle,
  clusterIndexes,
  savedSearchesConf,
  systemDefaults,
  systemLocal,
} from '../hosts/confs';
import { licenseQuotaBytes } from '../ingest/license';
import { BASTION_USER, DOMAIN, buildFor, sshRoster, splunkVersion, type HostProfile } from '../hosts/profile';
import {
  messagesLog,
  notableLog,
  metricsLog,
  secureLog,
  licenseUsageLog,
  schedulerLog,
  smallLog,
  splunkdLog,
  type LogSource,
} from '../logs/sources';
import { mix32 } from '../rng';
import { deployedAppFiles, deployedApps } from '../derive/state';
import type { World } from '../world';
import { basename, dirname, segments } from './path';
import { Vfs, type FsDir, type FsFile, type NodeMeta, type OverlayEntry } from './vfs';

const DAY = 86_400_000;

class TreeBuilder {
  readonly root: FsDir;
  constructor(private readonly defaultTime: number) {
    this.root = {
      type: 'dir',
      owner: 'root',
      group: 'root',
      mode: 0o555,
      mtime: defaultTime,
      children: new Map(),
    };
  }

  dir(path: string, meta: Partial<NodeMeta> = {}): FsDir {
    let node = this.root;
    for (const seg of segments(path)) {
      let next = node.children.get(seg);
      if (!next) {
        next = {
          type: 'dir',
          owner: 'root',
          group: 'root',
          mode: 0o755,
          mtime: this.defaultTime,
          children: new Map(),
        };
        node.children.set(seg, next);
      }
      if (next.type !== 'dir') throw new Error(`not a dir: ${path}`);
      node = next;
    }
    Object.assign(node, meta);
    return node;
  }

  file(
    path: string,
    body: string | Omit<FsFile, 'type' | keyof NodeMeta>,
    meta: Partial<NodeMeta> = {},
  ): void {
    const parent = this.dir(dirname(path));
    const content = typeof body === 'string' ? { content: body } : body;
    parent.children.set(basename(path), {
      type: 'file',
      owner: 'root',
      group: 'root',
      mode: 0o644,
      mtime: this.defaultTime,
      ...content,
      ...meta,
    });
  }
}

/** Binaries in /usr/bin, one per simulated command. */
export type Binaries = readonly string[];

/** The shell registers its command names here, so every filesystem has the same /usr/bin. */
let registeredBinaries: Binaries = [];
export function registerBinaries(names: Binaries): void {
  registeredBinaries = names;
}

/** Builds the generated (pre-overlay) filesystem for a host. Pure: same world state and host give the same tree. */
export function buildHostTree(world: World, p: HostProfile, binaries: Binaries = registeredBinaries): FsDir {
  const installTime = p.bootTime - (20 + (p.hash % 200)) * DAY;
  const b = new TreeBuilder(installTime);
  const at = (daysAgo: number, salt = 0) =>
    world.config.startTime - daysAgo * DAY - (mix32(p.hash, salt) % DAY);

  // Base OS
  b.dir('/tmp', { mode: 0o1777 });
  b.dir('/var/tmp', { mode: 0o1777 });
  b.dir('/dev');
  b.file('/dev/null', '', { mode: 0o666 });
  b.dir('/proc', { mode: 0o555 });
  b.dir('/boot', { mode: 0o555 });
  for (const name of binaries)
    b.file(
      `/usr/bin/${name}`,
      { exec: name, size: 30_000 + (mix32(p.hash, name.length) % 900_000) },
      { mode: 0o755 },
    );
  b.file('/etc/hostname', `${p.hostname}\n`);
  b.file('/etc/os-release', osRelease(p));
  b.file('/etc/redhat-release', `${p.distro.prettyName}\n`);
  b.file('/etc/hosts', etcHosts(world, p));
  b.file('/etc/resolv.conf', `search ${DOMAIN}\nnameserver 10.10.0.2\nnameserver 10.20.0.2\n`);
  b.file('/etc/motd', 'Authorized uses only. All activity may be monitored and reported.\n');
  b.file('/etc/shadow', 'root:$6$redacted::0:99999:7:::\n', { mode: 0o000 });
  b.file(
    '/etc/ssh/sshd_config',
    'PermitRootLogin no\nPasswordAuthentication no\nPubkeyAuthentication yes\n',
    { mode: 0o600 },
  );
  b.file('/etc/sudoers', 'root ALL=(ALL) ALL\n%wheel ALL=(ALL) ALL\n#includedir /etc/sudoers.d\n', {
    mode: 0o440,
  });
  b.dir('/root', { mode: 0o550 });
  b.file('/root/.bash_history', 'dnf -y update\nreboot\n', { mode: 0o600 });

  const users =
    p.role === 'bastion' ? [BASTION_USER] : p.role === 'automation' ? ['svc_ansible'] : ['splunk'];
  b.file('/etc/passwd', etcPasswd(p, users));
  b.file('/etc/group', etcGroup(p, users));

  // System logs
  b.dir('/var/log');
  b.file('/var/log/messages', { source: messagesLog(world, p) }, { mode: 0o640, group: users[0] });
  b.file('/var/log/secure', { source: secureLog(world, p) }, { mode: 0o640, group: users[0] });
  b.file('/var/log/cron', '', { mode: 0o600 });
  b.file('/var/log/dnf.log', `${new Date(at(9)).toISOString()} INFO --- logging initialized ---\n`);

  if (p.role === 'bastion') {
    buildBastion(world, b, at);
    return b.root;
  }

  if (world.git && (p.role === 'automation' || p.role === 'deployer')) {
    const user = p.role === 'automation' ? 'svc_ansible' : 'splunk';
    const own = { owner: user, group: user };
    b.dir(`/home/${user}`, { ...own, mode: 0o700 });
    b.file(`/etc/sudoers.d/${user}`, `${user} ALL=(ALL) NOPASSWD: ALL\n`, { mode: 0o440 });
    b.file(`/home/${user}/.bashrc`, '# Offline simulated automation workspace\n', own);
    b.file(
      `/home/${user}/README.txt`,
      'cd ~/splunk-automation\ngit status\ngit log --oneline\nConfigure your practice name with git config --global user.name and user.email before committing.\nUse Apps → Engineer Sandbox → Code & Ansible for reviews, CI checks, deployment and supported playbooks.\n',
      own,
    );
    for (const checkout of world.git.checkouts.filter((c) => c.host === p.hostname)) {
      const repo = world.git.repos[checkout.repo]!;
      const initial = Object.values(repo.commits).find((c) => c.parents.length === 0)!.tree;
      b.dir(checkout.root, own);
      for (const [path, file] of Object.entries(initial)) {
        let dir = dirname(`${checkout.root}/${path}`);
        while (dir.startsWith(checkout.root)) {
          b.dir(dir, own);
          if (dir === checkout.root) break;
          dir = dirname(dir);
        }
        b.file(`${checkout.root}/${path}`, file.text, { ...own, mode: file.mode });
      }
      b.dir(`${checkout.root}/.git`, own);
      b.file(`${checkout.root}/.git/HEAD`, `ref: refs/heads/main\n`, own);
      b.file(
        `${checkout.root}/.git/config`,
        `[remote "origin"]\nurl = git@github.apl.sim:splunk/${checkout.repo}.git\n`,
        own,
      );
    }
    if (p.role === 'automation') return b.root;
  }

  b.file('/etc/sudoers.d/splunk', 'splunk ALL=(ALL) NOPASSWD: ALL\n', { mode: 0o440 });
  const home = '/home/splunk';
  const own = { owner: 'splunk', group: 'splunk' };
  b.dir(home, { ...own, mode: 0o700 });
  if (!p.splunk) {
    // A decommissioned Splunk host: the OS and service account remain, the installation does not.
    b.file(`${home}/.bashrc`, '# .bashrc\n', own);
    b.file(
      `${home}/DECOMMISSIONED.txt`,
      `${p.hostname} was removed from the indexer cluster on 2026-09-14 (CHG-48213).\nSplunk Enterprise was uninstalled; buckets were migrated to ${infraName(world, 'indexer', 1)}/${infraName(world, 'indexer', 2)}.\nThis machine is scheduled for reimage.\n`,
      { ...own, mtime: at(39) },
    );
    return b.root;
  }
  const sp = p.splunk;
  b.file(
    `${home}/.bashrc`,
    `# .bashrc\nif [ -f /etc/bashrc ]; then\n  . /etc/bashrc\nfi\nalias ll='ls -l --color=auto'\n`,
    own,
  );
  b.file(
    `${home}/.bash_profile`,
    `# .bash_profile\nexport SPLUNK_HOME=${sp.home}\nexport PATH=$PATH:$SPLUNK_HOME/bin\n`,
    own,
  );
  b.file(`${home}/.bash_history`, p.detailed ? detailedHistory(p) : 'ls\ncd $SPLUNK_HOME\n', {
    ...own,
    mode: 0o600,
  });

  // Splunk installation
  const version = splunkVersion(world, p)!;
  const S = sp.home;
  if (p.role === 'search_head') {
    b.dir(`${S}/etc/apps/kv_training/default`, { owner: 'splunk', group: 'splunk', mode: 0o755 });
    b.dir(`${S}/etc/apps/kv_training/local`, { owner: 'splunk', group: 'splunk', mode: 0o755 });
    b.file(
      `${S}/etc/apps/kv_training/default/collections.conf`,
      '[assets]\nenforceTypes = true\nfield.hostname = string\nfield.owner = string\nfield.criticality = number\n',
    );
    b.file(
      `${S}/etc/apps/kv_training/default/transforms.conf`,
      '[assets_lookup]\nexternal_type = kvstore\ncollection = assets\nfields_list = _key,hostname,owner,criticality\n',
    );
    b.file(
      `${S}/etc/apps/kv_training/default/server.conf`,
      '[kvstore]\ndisabled = false\nport = 8191\nstorageEngine = wiredTiger\n',
    );
  }
  b.dir(S, own);
  b.file(`${S}/bin/splunk`, { exec: 'splunk', size: 612_448 }, { ...own, mode: 0o755 });
  b.file(`${S}/bin/splunkd`, { exec: 'splunkd', size: 168_221_904 }, { ...own, mode: 0o755 });
  b.file(`${S}/bin/btool`, { exec: 'splunk', size: 612_448 }, { ...own, mode: 0o755 });
  b.file(
    `${S}/etc/splunk-launch.conf`,
    `SPLUNK_HOME=${S}\nSPLUNK_SERVER_NAME=${sp.service}\nPYTHONHTTPSVERIFY=0\nSPLUNK_OS_USER=splunk\n`,
    own,
  );
  b.file(
    `${S}/etc/splunk.version`,
    `VERSION=${version}\nBUILD=${buildFor(version)}\nPRODUCT=${sp.product === 'enterprise' ? 'splunk' : 'splunkforwarder'}\nPLATFORM=Linux-x86_64\n`,
    own,
  );
  b.file(`${S}/etc/instance.cfg`, `[general]\nguid = ${sp.guid}\n`, { ...own, mode: 0o600 });
  b.file(`${S}/etc/auth/splunk.secret`, 'redacted-in-sandbox\n', { ...own, mode: 0o400 });
  b.file(`${S}/etc/passwd`, ':admin:$6$redacted::Administrator:admin:changeme@example.com:::50000\n', {
    ...own,
    mode: 0o600,
  });
  for (const [name, content] of Object.entries(systemDefaults(p, version)))
    b.file(`${S}/etc/system/default/${name}`, content, { ...own, mtime: installTime });
  for (const [name, content] of Object.entries(systemLocal(world, p)))
    b.file(`${S}/etc/system/local/${name}`, content, { ...own, mode: 0o600, mtime: at(30, 7) });

  for (const app of builtinApps(p, world)) {
    b.file(
      `${S}/etc/apps/${app}/default/app.conf`,
      `[install]\nstate = enabled\n\n[ui]\nis_visible = false\nlabel = ${app}\n`,
      { ...own, mtime: installTime },
    );
    b.dir(`${S}/etc/apps/${app}/metadata`, own);
    b.file(
      `${S}/etc/apps/${app}/metadata/default.meta`,
      '[]\naccess = read : [ * ], write : [ admin ]\nexport = system\n',
      own,
    );
  }
  for (const app of deployedApps(world, p)) {
    // Forwarders get each app as the deployment server currently serves it.
    const files = deployedAppFiles(world, app);
    if (files) addFiles(b, `${S}/etc/apps/${app}`, files, { ...own, mtime: at(12, app.length) });
  }

  if (world.config.profile && (p.role === 'deployer' || p.role === 'search_head'))
    b.file(
      `${S}/etc/${p.role === 'deployer' ? 'shcluster/apps' : 'apps'}/profile_search/local/savedsearches.conf`,
      shcDefault(),
      own,
    );
  if (world.config.profile && p.role === 'soar') b.file(`${S}/var/log/splunk/playbook.log`, '', own);
  if (p.role === 'deployment_server')
    for (const app of allDeploymentApps(world))
      addApp(world, b, `${S}/etc/deployment-apps/${app}`, app, { ...own, mtime: at(40, app.length) });
  if (p.role === 'indexer')
    for (const [rel, text] of Object.entries(clusterBundle(world)))
      b.file(`${S}/etc/peer-apps/${rel}`, text, { ...own, mtime: at(40) });
  if (p.role === 'cluster_manager')
    for (const [rel, text] of Object.entries(clusterBundle(world)))
      b.file(`${S}/etc/manager-apps/${rel}`, text, { ...own, mtime: at(40) });
  if (p.role === 'license_manager') {
    const gb = licenseQuotaBytes(world) / 1024 ** 3;
    b.file(
      `${S}/etc/licenses/enterprise/corp-enterprise-${gb}GB.lic`,
      `<license>\n  <signature>redacted</signature>\n  <payload><type>enterprise</type><quota>${licenseQuotaBytes(world)}</quota></payload>\n</license>\n`,
      { ...own, mode: 0o600 },
    );
  }
  if (p.hostname === infraName(world, 'search_head'))
    b.file(`${S}/etc/apps/search/local/savedsearches.conf`, savedSearchesConf(), { ...own, mtime: at(18) });

  // Logs and runtime state
  const logs: [string, LogSource][] = [
    ...(world.config.profile && p.hostname === 'es01'
      ? ([['notable.log', notableLog(world, p)]] as [string, LogSource][])
      : []),
    ['splunkd.log', splunkdLog(world, p)],
    ['metrics.log', metricsLog(world, p)],
    ['splunkd-utility.log', smallLog(world, p, 'utility')],
    ['audit.log', smallLog(world, p, 'audit')],
    ['health.log', smallLog(world, p, 'health')],
    ...(p.role === 'search_head'
      ? ([['scheduler.log', schedulerLog(world, p)]] as [string, LogSource][])
      : []),
    ...(p.role === 'license_manager'
      ? ([['license_usage.log', licenseUsageLog(world, p)]] as [string, LogSource][])
      : []),
  ];
  for (const [name, source] of logs)
    b.file(`${S}/var/log/splunk/${name}`, { source }, { ...own, mode: 0o600 });
  b.dir(`${S}/var/run/splunk`, own);
  b.file(`${S}/var/run/splunk/splunkd.pid`, `${sp.pid}\n`, own);
  if (sp.product === 'universal_forwarder') b.dir(`${S}/var/lib/splunk/fishbucket/splunk_private_db`, own);
  else
    for (const idx of [
      '_internaldb',
      'audit',
      'defaultdb',
      ...(p.role === 'indexer' ? clusterIndexes(world) : []),
    ])
      b.dir(`${S}/var/lib/splunk/${idx}/db`, own);

  b.file(
    `/etc/systemd/system/${sp.service}.service`,
    `[Unit]\nDescription=Systemd service file for Splunk, generated by 'splunk enable boot-start'\nAfter=network-online.target\nWants=network-online.target\n\n[Service]\nType=simple\nRestart=always\nExecStart=${S}/bin/splunk _internal_launch_under_systemd\nKillMode=mixed\nKillSignal=SIGINT\nTimeoutStopSec=360\nLimitNOFILE=65536\nLimitRTPRIO=99\nSuccessExitStatus=51 52\nRestartPreventExitStatus=51\nRestartForceExitStatus=52\nUser=splunk\nGroup=splunk\nDelegate=true\n\n[Install]\nWantedBy=multi-user.target\n`,
  );

  // Business data on forwarders
  if (p.fleetRow !== undefined || (world.config.profile && p.role === 'heavy_forwarder')) {
    for (const f of hostDataFiles(world, p))
      if (f.path !== '/var/log/messages' && f.path !== '/var/log/secure')
        b.file(f.path, { source: f.log }, { owner: f.owner, group: f.group, mode: f.mode });
  }
  // The installer runs as splunk: every directory under $SPLUNK_HOME is the service account's.
  ownDirs(b.dir(S), own);
  return b.root;
}

function ownDirs(dir: FsDir, own: { owner: string; group: string }): void {
  Object.assign(dir, own);
  for (const child of dir.children.values()) if (child.type === 'dir') ownDirs(child, own);
}

function addApp(world: World, b: TreeBuilder, dir: string, app: string, meta: Partial<NodeMeta>): void {
  addFiles(
    b,
    dir,
    {
      ...deploymentAppFiles(world, app),
      'metadata/local.meta': `[]\naccess = read : [ * ], write : [ admin ]\nexport = system\n`,
    },
    meta,
  );
}

function addFiles(b: TreeBuilder, dir: string, files: Record<string, string>, meta: Partial<NodeMeta>): void {
  for (const [rel, content] of Object.entries(files))
    b.file(`${dir}/${rel}`, content, { ...meta, mode: rel.startsWith('bin/') ? 0o755 : 0o644 });
}

function buildBastion(world: World, b: TreeBuilder, at: (d: number, s?: number) => number): void {
  const home = `/home/${BASTION_USER}`;
  const own = { owner: BASTION_USER, group: BASTION_USER };
  b.dir(home, { ...own, mode: 0o700 });
  b.dir(`${home}/.ssh`, { ...own, mode: 0o700 });
  b.file(
    `${home}/.ssh/id_ed25519`,
    '-----BEGIN OPENSSH PRIVATE KEY-----\n(sandbox key, not a real key)\n-----END OPENSSH PRIVATE KEY-----\n',
    { ...own, mode: 0o600 },
  );
  b.file(`${home}/.ssh/config`, `Host *.${DOMAIN} *\n  User splunk\n  IdentityFile ~/.ssh/id_ed25519\n`, {
    ...own,
    mode: 0o600,
  });
  b.file(`${home}/.bashrc`, "# .bashrc\nalias ll='ls -l'\n", own);
  b.file(
    `${home}/.bash_history`,
    `ssh splunk@${infraName(world, 'deployment_server')}\nssh splunk@${infraName(world, 'indexer')}\n${world.config.profile ? '' : 'ssh splunk@dal-app-0001\n'}`,
    {
      ...own,
      mode: 0o600,
    },
  );
  const roster = sshRoster(world)
    .map(
      (r) => `  ${r.hostname.padEnd(16)} ${r.role.padEnd(20)} ${r.site}${r.detailed ? '   (detailed)' : ''}`,
    )
    .join('\n');
  b.file(
    `${home}/README.txt`,
    `Welcome to the bastion.\n\nLog in to Splunk hosts as the splunk service account:\n\n  ssh splunk@<host>\n\nThe splunk account has passwordless sudo. Root login over SSH is disabled.\n\nInfrastructure hosts:\n${roster}\n\nUniversal forwarders follow <site>-<class>-<nnnn>, e.g. dal-app-0001, ash-web-0012.\nLinux forwarders accept SSH; Windows forwarders (*-win-*, *-dc-*) do not run sshd.\n`,
    { ...own, mtime: at(3) },
  );
}

function osRelease(p: HostProfile): string {
  const d = p.distro;
  return `NAME="${d.name}"\nVERSION="${d.versionId} (${d.prettyName.match(/\((.*)\)/)?.[1] ?? ''})"\nID="${d.id}"\nID_LIKE="fedora"\nVERSION_ID="${d.versionId}"\nPLATFORM_ID="platform:el${d.versionId.split('.')[0]}"\nPRETTY_NAME="${d.prettyName}"\nANSI_COLOR="0;31"\nHOME_URL="https://www.redhat.com/"\n`;
}

function etcHosts(world: World, p: HostProfile): string {
  const lines = [
    '127.0.0.1   localhost localhost.localdomain',
    '::1         localhost localhost.localdomain',
    `${p.ip}   ${p.hostname}.${DOMAIN} ${p.hostname}`,
  ];
  if (p.role !== 'universal_forwarder')
    for (const n of world.infra)
      if (n.hostname !== p.hostname) lines.push(`${n.ip.padEnd(11)} ${n.hostname}.${DOMAIN} ${n.hostname}`);
  return lines.join('\n') + '\n';
}

function etcPasswd(p: HostProfile, users: string[]): string {
  const base = [
    'root:x:0:0:root:/root:/bin/bash',
    'bin:x:1:1:bin:/bin:/sbin/nologin',
    'daemon:x:2:2:daemon:/sbin:/sbin/nologin',
    'nobody:x:65534:65534:Kernel Overflow User:/:/sbin/nologin',
    'sshd:x:74:74:Privilege-separated SSH:/usr/share/empty.sshd:/sbin/nologin',
    'chrony:x:996:993:chrony system user:/var/lib/chrony:/sbin/nologin',
  ];
  for (const u of users)
    base.push(
      `${u}:x:1001:1001:${u === 'splunk' ? 'Splunk service account' : 'Platform engineer'}:/home/${u}:/bin/bash`,
    );
  void p;
  return base.join('\n') + '\n';
}

function etcGroup(p: HostProfile, users: string[]): string {
  void p;
  return (
    [
      'root:x:0:',
      'bin:x:1:',
      'daemon:x:2:',
      'wheel:x:10:',
      'sshd:x:74:',
      ...users.map((u) => `${u}:x:1001:`),
    ].join('\n') + '\n'
  );
}

function detailedHistory(p: HostProfile): string {
  const S = p.splunk!.home;
  const common = [
    `cd ${S}`,
    'bin/splunk status',
    `tail -100 ${S}/var/log/splunk/splunkd.log`,
    `grep -i error ${S}/var/log/splunk/splunkd.log | tail`,
  ];
  if (p.role === 'deployment_server')
    return (
      [
        ...common,
        `vi ${S}/etc/system/local/serverclass.conf`,
        'splunk reload deploy-server',
        `ls ${S}/etc/deployment-apps`,
      ].join('\n') + '\n'
    );
  if (p.role === 'indexer')
    return (
      [
        ...common,
        `grep blocked=true ${S}/var/log/splunk/metrics.log | tail`,
        'df -h /opt/splunk',
        'splunk show cluster-status',
      ].join('\n') + '\n'
    );
  return (
    [
      ...common,
      'splunk list forward-server',
      `cat ${S}/etc/apps/*/default/outputs.conf`,
      'splunk show deploy-poll',
    ].join('\n') + '\n'
  );
}

// --- Cache ---

/**
 * Apply a recorded overlay change directly (replay). The host's cached filesystem is dropped and
 * rebuilt from the generated tree plus the overlay on next use, which gives the same result.
 */
export function applyFsEntry(world: World, host: string, path: string, entry: OverlayEntry): void {
  let overlay = world.hosts.fsOverlay.get(host);
  if (!overlay) world.hosts.fsOverlay.set(host, (overlay = new Map()));
  if (entry.kind === 'deleted')
    for (const key of [...overlay.keys()]) if (key.startsWith(path + '/')) overlay.delete(key);
  overlay.set(path, structuredClone(entry));
  cache.get(world)?.delete(host);
}

interface Cached {
  signature: string;
  vfs: Vfs;
}
const cache = new WeakMap<World, Map<string, Cached>>();

/**
 * The live filesystem for a host. Rebuilt when the fleet state that shapes it changes
 * (assigned server class, version), with the user's overlay re-applied on top.
 */
export function hostFs(world: World, p: HostProfile, binaries: Binaries = registeredBinaries): Vfs {
  let perWorld = cache.get(world);
  if (!perWorld) cache.set(world, (perWorld = new Map()));
  const signature =
    p.fleetRow === undefined
      ? `static:${world.git?.version ?? 0}`
      : `${world.fleet.assignedClass[p.fleetRow]}:${world.fleet.version[p.fleetRow]}:${world.hosts.confVersion}`;
  const hit = perWorld.get(p.hostname);
  if (hit && hit.signature === signature) return hit.vfs;
  let overlay = world.hosts.fsOverlay.get(p.hostname);
  if (!overlay) world.hosts.fsOverlay.set(p.hostname, (overlay = new Map()));
  const vfs = new Vfs(
    buildHostTree(world, p, binaries),
    overlay,
    () => world.clock.now,
    (path, entry) => journal(world, { k: 'fs', host: p.hostname, path, entry }),
  );
  perWorld.set(p.hostname, { signature, vfs });
  return vfs;
}
