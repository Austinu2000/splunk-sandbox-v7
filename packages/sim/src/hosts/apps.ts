import { infraName } from '../infra';
import type { World } from '../world';
import { DOMAIN, outputTargets } from './profile';

/**
 * Deployment apps: one definition feeds both the deployment server's etc/deployment-apps and
 * the apps installed on each forwarder, so the two can never disagree.
 */

export interface InputDef {
  stanza: string;
  sourcetype: string;
  index: string;
  /** Extra settings for the stanza. */
  extra?: Record<string, string>;
}

export interface ClassInputs {
  app: string;
  inputs: InputDef[];
}

export const CLASS_INPUTS: Record<string, ClassInputs> = {
  win_servers: {
    app: 'org_win_inputs',
    inputs: [
      {
        stanza: 'WinEventLog://Security',
        sourcetype: 'WinEventLog:Security',
        index: 'os',
        extra: { renderXml: 'false' },
      },
      { stanza: 'WinEventLog://System', sourcetype: 'WinEventLog:System', index: 'os' },
      { stanza: 'WinEventLog://Application', sourcetype: 'WinEventLog:Application', index: 'os' },
    ],
  },
  win_dc: {
    app: 'org_win_dc_inputs',
    inputs: [
      { stanza: 'WinEventLog://Security', sourcetype: 'WinEventLog:Security', index: 'os' },
      { stanza: 'WinEventLog://Directory Service', sourcetype: 'WinEventLog:Directory Service', index: 'os' },
    ],
  },
  linux_app: {
    app: 'org_linux_app_inputs',
    inputs: [
      {
        stanza: 'monitor:///var/log/app/*.log',
        sourcetype: 'app:log',
        index: 'app',
        // The app's debug log is far too verbose to collect.
        extra: { blacklist: 'debug\\.log$' },
      },
    ],
  },
  linux_web: {
    app: 'org_linux_web_inputs',
    inputs: [{ stanza: 'monitor:///var/log/nginx/access.log', sourcetype: 'access_combined', index: 'app' }],
  },
  linux_db: {
    app: 'org_linux_db_inputs',
    inputs: [{ stanza: 'monitor:///var/log/mysql/mysqld.log', sourcetype: 'mysqld', index: 'app' }],
  },
  syslog_relay: {
    app: 'org_syslog_relay_inputs',
    inputs: [
      {
        stanza: 'monitor:///data/syslog/*/*.log',
        sourcetype: 'syslog',
        index: 'network',
        extra: { host_segment: '3' },
      },
    ],
  },
};

export const NIX_INPUTS: InputDef[] = [
  { stanza: 'monitor:///var/log/messages', sourcetype: 'syslog', index: 'os' },
  { stanza: 'monitor:///var/log/secure', sourcetype: 'linux_secure', index: 'os' },
];

/** The concrete log file each class's monitored input reads on a host. */
export const CLASS_LOG_FILE: Record<string, string | undefined> = {
  linux_app: '/var/log/app/app.log',
  linux_web: '/var/log/nginx/access.log',
  linux_db: '/var/log/mysql/mysqld.log',
  syslog_relay: '/data/syslog/edge-fw01/edge-fw01.log',
};

/** Sourcetypes a forwarder of this class sends (for metrics.log per_sourcetype_thruput). */
export function classSourcetypes(classId: string, os: 'windows' | 'linux'): string[] {
  const own = CLASS_INPUTS[classId]?.inputs.map((i) => i.sourcetype) ?? [];
  return os === 'linux' ? [...own, ...NIX_INPUTS.map((i) => i.sourcetype)] : own;
}

export function outputsAppName(site: string, kind: 'indexers' | 'hf'): string {
  return kind === 'hf' ? `org_${site}_hf_outputs` : `org_${site}_outputs`;
}

export function outputGroupName(site: string, kind: 'indexers' | 'hf'): string {
  return `${site}_${kind}`;
}

/** Apps the deployment server maps a client to, given its site and (assigned) server class. */
export function appsForClient(world: World, site: string, classId: string): string[] {
  const cls = world.config.serverClasses.find((c) => c.id === classId)!;
  const apps = [
    'org_all_deploymentclient',
    outputsAppName(site, cls.outputs),
    classInputs(world, classId).app,
  ];
  if (cls.os === 'linux') apps.push('Splunk_TA_nix');
  return apps;
}

/** Every deployment app the DS serves. */
export function allDeploymentApps(world: World): string[] {
  const apps = new Set<string>(['org_all_deploymentclient', 'Splunk_TA_nix']);
  for (const s of world.config.sites) {
    apps.add(outputsAppName(s.id, 'indexers'));
    apps.add(outputsAppName(s.id, 'hf'));
  }
  for (const c of world.config.serverClasses) apps.add(classInputs(world, c.id).app);
  return [...apps].sort();
}

function stanzaText(input: InputDef): string {
  const lines = [
    `[${input.stanza}]`,
    `disabled = 0`,
    `index = ${input.index}`,
    `sourcetype = ${input.sourcetype}`,
  ];
  for (const [k, v] of Object.entries(input.extra ?? {})) lines.push(`${k} = ${v}`);
  return lines.join('\n');
}

const appConf = (label: string, version = '1.0.0') =>
  `[install]\nstate = enabled\n\n[ui]\nis_visible = false\nlabel = ${label}\n\n[launcher]\nversion = ${version}\ndescription = Managed by the deployment server. Do not edit on the client.\n`;

/** Files of a deployment app, relative to the app directory. */
export function deploymentAppFiles(world: World, app: string): Record<string, string> {
  const files: Record<string, string> = { 'default/app.conf': appConf(app) };

  if (app === 'org_all_deploymentclient') {
    files['local/deploymentclient.conf'] = [
      '[deployment-client]',
      'phoneHomeIntervalInSecs = 60',
      '',
      '[target-broker:deploymentServer]',
      `targetUri = ${infraName(world, 'deployment_server')}.${DOMAIN}:8089`,
      '',
    ].join('\n');
    return files;
  }

  const outputs = /^org_(\w+?)(_hf)?_outputs$/.exec(app);
  if (outputs) {
    const site = outputs[1]!;
    const kind = outputs[2] ? 'hf' : 'indexers';
    const group = outputGroupName(site, kind);
    const servers = outputTargets(world, site, kind).map((n) => `${n.hostname}.${DOMAIN}:9997`);
    files['default/outputs.conf'] = [
      '[tcpout]',
      `defaultGroup = ${group}`,
      '',
      `[tcpout:${group}]`,
      `server = ${servers.join(', ')}`,
      'autoLBFrequency = 30',
      'useACK = true',
      '',
    ].join('\n');
    return files;
  }

  if (app === 'Splunk_TA_nix') {
    files['default/app.conf'] = appConf('Splunk Add-on for Unix and Linux', '9.2.0');
    files['default/inputs.conf'] = [
      '[script://./bin/cpu.sh]',
      'interval = 30',
      'sourcetype = cpu',
      'disabled = 1',
      '',
      '[script://./bin/df.sh]',
      'interval = 300',
      'sourcetype = df',
      'disabled = 1',
      '',
    ].join('\n');
    files['local/inputs.conf'] = NIX_INPUTS.map(stanzaText).join('\n\n') + '\n';
    files['bin/cpu.sh'] = '#!/bin/sh\n# collects cpu stats\n';
    files['bin/df.sh'] = '#!/bin/sh\n# collects disk usage\n';
    return files;
  }

  const cls = world.config.serverClasses.map((c) => classInputs(world, c.id)).find((c) => c.app === app);
  if (cls) files['local/inputs.conf'] = cls.inputs.map(stanzaText).join('\n\n') + '\n';
  return files;
}

/** serverclass.conf on the deployment server: one whitelist entry per site for every class. */
export function serverclassConf(world: World): string {
  const out: string[] = [
    '[global]',
    'restartSplunkd = false',
    '',
    '[serverClass:all_deploymentclient]',
    'whitelist.0 = *',
    '',
    '[serverClass:all_deploymentclient:app:org_all_deploymentclient]',
    '',
  ];
  for (const site of world.config.sites) {
    if (world.config.profile) {
      for (const kind of ['indexers', 'hf'] as const) {
        const classes = world.config.serverClasses.filter((c) => c.outputs === kind);
        const name = kind === 'hf' ? `${site.id}_hf_outputs` : `${site.id}_outputs`;
        out.push(
          `[serverClass:${name}]`,
          ...classes.map((c, i) => `whitelist.${i} = ${site.id}-${c.short}-*`),
          '',
          `[serverClass:${name}:app:${outputsAppName(site.id, kind)}]`,
          'restartSplunkd = true',
          '',
        );
      }
      continue;
    }
    out.push(
      `[serverClass:${site.id}_outputs]`,
      `whitelist.0 = ${site.id}-*`,
      `blacklist.0 = ${site.id}-syslog-*`,
      '',
      `[serverClass:${site.id}_outputs:app:${outputsAppName(site.id, 'indexers')}]`,
      'restartSplunkd = true',
      '',
      `[serverClass:${site.id}_hf_outputs]`,
      `whitelist.0 = ${site.id}-syslog-*`,
      '',
      `[serverClass:${site.id}_hf_outputs:app:${outputsAppName(site.id, 'hf')}]`,
      'restartSplunkd = true',
      '',
    );
  }
  for (const cls of world.config.serverClasses) {
    out.push(`[serverClass:${cls.id}]`);
    world.config.sites.forEach((s, i) => out.push(`whitelist.${i} = ${s.id}-${cls.short}-*`));
    out.push(
      '',
      `[serverClass:${cls.id}:app:${classInputs(world, cls.id).app}]`,
      'restartSplunkd = true',
      '',
    );
  }
  const linux = world.config.serverClasses.filter((c) => c.os === 'linux');
  out.push('[serverClass:linux_all]');
  linux.forEach((c, i) => out.push(`whitelist.${i} = *-${c.short}-*`));
  out.push('', '[serverClass:linux_all:app:Splunk_TA_nix]', 'restartSplunkd = true', '');
  return out.join('\n');
}

export function classInputs(world: World, classId: string): ClassInputs {
  if (!world.config.profile) return CLASS_INPUTS[classId]!;
  const cls = world.config.serverClasses.find((c) => c.id === classId)!;
  const sources = world.config.profile.dataSources.filter(
    (d) =>
      d.via === 'forwarders' &&
      (cls.os === 'windows'
        ? d.sourcetypes.includes('XmlWinEventLog')
        : !d.sourcetypes.includes('XmlWinEventLog')),
  );
  return {
    app: CLASS_INPUTS[classId]?.app ?? `org_${classId}_inputs`,
    inputs: sources.flatMap((d) =>
      d.sourcetypes.map((st) => ({
        stanza:
          st === 'XmlWinEventLog'
            ? 'WinEventLog://Security'
            : `monitor:///var/log/profile/${d.id}/${st.replace(/:/g, '_')}.log`,
        sourcetype: st,
        index: d.index,
        extra: st === 'XmlWinEventLog' ? { renderXml: 'true', blacklist: '4662,5156' } : undefined,
      })),
    ),
  };
}
