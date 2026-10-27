import { indexCli } from '../../engineering/index-commands';
import { validateClusterIndexes } from '../../engineering/indexes';
import { kvCli } from '../../kvstore/commands';
import { clusterHealth, retirePeer } from '../../training/cluster';
import { trainingAction, getResource } from '../../training/engine';
import { operationMetrics, applyShcBundle, runPlaybook } from '../../operations';
import { checkConfs, formatIssue } from '../../conf/check';
import { formatBtool, loadConf, setting } from '../../conf/merge';
import { confBool } from '../../conf/parse';
import { hostOutputs, rowOutputs, targetStatus } from '../../derive/state';
import { buildFor, splunkdRunning, splunkVersion, type HostProfile } from '../../hosts/profile';
import {
  reloadDeployServer,
  restartSplunk,
  runningConf,
  runningVfs,
  startSplunk,
  stopSplunk,
  vfsReader,
} from '../../hosts/running';
import { globToRegExp } from '../../vfs/path';
import { ROOT } from '../../vfs/vfs';
import type { Shell } from '../shell';
import {
  fail,
  ok,
  type CmdResult,
  type CmdReturn,
  type CommandFn,
  type Program,
  type ProgramHost,
} from '../types';
import { applyClusterBundle, checksum, clusterPeers, managerBundle, peerBundle } from '../../hosts/cluster';

/**
 * The splunk CLI. btool reads config files on disk (like the real one); list/show commands report
 * what the running splunkd loaded; start/stop/restart and reload change what is running.
 */

const productName = (p: HostProfile) =>
  p.splunk!.product === 'enterprise' ? 'Splunk' : 'Splunk Universal Forwarder';

function notRunning(): CmdResult {
  return { stdout: '', stderr: 'Splunkd is not running.\n', code: 1 };
}

// ---------------------------------------------------------------- btool

const BTOOL_USAGE =
  'Usage: btool [options] CONF_FILE {list|check} [stanza]\n  Options: --debug  --app=APP_NAME';

export function btool(sh: Shell, args: string[]): CmdResult {
  const p = sh.host;
  const debug = args.includes('--debug');
  const app = args.find((a) => a.startsWith('--app='))?.slice(6);
  const rest = args.filter((a) => !a.startsWith('--'));
  const reader = vfsReader(sh.fs, sh.cred);
  const home = p.splunk!.home;

  if (rest[0] === 'check') {
    const issues = checkConfs(reader, home);
    return ok(issues.map((i) => formatIssue(i) + '\n').join(''));
  }
  const [conf, verb, stanza] = rest;
  if (!conf || verb !== 'list') return fail(BTOOL_USAGE);
  const name = conf.replace(/\.conf$/, '');
  return ok(formatBtool(loadConf(reader, home, name, { app }), { debug, stanza }));
}

// ---------------------------------------------------------------- start / stop / restart

function confProblems(sh: Shell): string {
  const issues = checkConfs(vfsReader(sh.fs, ROOT), sh.host.splunk!.home);
  return issues.map((i) => `\t\t${formatIssue(i)}\n`).join('');
}

function startOutput(sh: Shell): string {
  const p = sh.host;
  const enterprise = p.splunk!.product === 'enterprise';
  const web = enterprise && p.role !== 'indexer';
  const v = splunkVersion(sh.world, p)!;
  const lines = ['', 'Checking prerequisites...'];
  if (web) lines.push('\tChecking http port [8000]: open');
  lines.push(`\tChecking mgmt port [${p.splunk!.mgmtPort}]: open`);
  if (enterprise) lines.push('\tChecking appserver port [127.0.0.1:8065]: open');
  lines.push('\tChecking configuration... Done.');
  if (enterprise)
    lines.push(
      '\tChecking critical directories...\tDone',
      '\tChecking indexes...',
      '\t\tValidated: _audit _internal _introspection _metrics _telemetry history main summary',
      '\tDone',
    );
  lines.push('\tChecking conf files for problems...');
  const manifest = `${p.splunk!.home}/splunk${enterprise ? '' : 'forwarder'}-${v}-${buildFor(v)}-linux-amd64-manifest`;
  return (
    lines.join('\n') +
    '\n' +
    confProblems(sh) +
    `\tDone\n\tChecking default conf files for edits...\n\tValidating installed files against hashes from '${manifest}'\n` +
    `\tAll installed files intact.\n\tDone\nAll preliminary checks passed.\n\nStarting splunk server daemon (splunkd)...\nDone\n` +
    (web
      ? `\n\nWaiting for web server at http://127.0.0.1:8000 to be available..... Done\n\nThe Splunk web interface is at http://${p.hostname}:8000\n`
      : '')
  );
}

const STOP_OUTPUT =
  'Stopping splunkd...\nShutting down.  Please wait, as this may take a few minutes.\n..\nStopping splunk helpers...\n\nDone.\n';

/** start/stop/restart, shared by the splunk CLI and systemctl. */
export function serviceAction(sh: Shell, action: 'start' | 'stop' | 'restart', quiet = false): CmdResult {
  const { world, host: p } = sh;
  const running = splunkdRunning(world, p);
  let out: string;
  if (action === 'stop') {
    if (!running) return ok(quiet ? '' : 'splunkd is not running.\n');
    out = STOP_OUTPUT;
    stopSplunk(world, p);
  } else if (action === 'start') {
    if (running) return ok(quiet ? '' : `\nsplunkd is already running (PID: ${p.splunk!.pid}).\n`);
    out = startOutput(sh);
    startSplunk(world, p);
  } else {
    out = (running ? STOP_OUTPUT : 'splunkd is not running.\n') + startOutput(sh);
    restartSplunk(world, p);
  }
  return ok(quiet ? '' : out);
}

// ---------------------------------------------------------------- list / show / reload

function listForwardServer(sh: Shell): CmdResult {
  const p = sh.host;
  if (!splunkdRunning(sh.world, p)) return notRunning();
  const out = p.fleetRow !== undefined ? rowOutputs(sh.world, p.fleetRow) : hostOutputs(sh.world, p);
  const active: string[] = [];
  const inactive: string[] = [];
  for (const s of out.servers) (targetStatus(sh.world, s).reachable ? active : inactive).push(s);
  const block = (items: string[]) => (items.length ? items.map((i) => `\t${i}`).join('\n') : '\tNone');
  return ok(`Active forwards:\n${block(active)}\nConfigured but inactive forwards:\n${block(inactive)}\n`);
}

function showDeployPoll(sh: Shell): CmdResult {
  if (!splunkdRunning(sh.world, sh.host)) return notRunning();
  const m = runningConf(sh.world, sh.host, 'deploymentclient');
  const uri = setting(m, 'target-broker:deploymentServer', 'targetUri');
  if (!uri || confBool(setting(m, 'deployment-client', 'disabled')))
    return ok('Deployment Server URI is not set.\n');
  return ok(`Deployment Server URI is set to "${uri}".\n`);
}

function listMonitor(sh: Shell): CmdResult {
  const p = sh.host;
  if (!splunkdRunning(sh.world, p)) return notRunning();
  const home = p.splunk!.home;
  const m = runningConf(sh.world, p, 'inputs');
  const vfs = runningVfs(sh.world, p);
  const dirs: string[] = [];
  const files: string[] = [];
  const names = [...m.stanzas.keys()].sort();
  for (const name of names) {
    const st = m.stanzas.get(name)!;
    if (!name.startsWith('monitor://') || confBool(st.settings.get('disabled')?.value)) continue;
    const spec = name.slice('monitor://'.length);
    const path = spec.replace('$SPLUNK_HOME', home);
    const found: string[] = [];
    if (vfs.findNode(path)?.type === 'dir') {
      vfs.walk(path, ROOT, (fp, n) => {
        if (n.type === 'file') found.push(fp);
      });
    } else if (/[*?]/.test(path)) {
      // Wildcards in any segment: walk from the last fixed directory and match the full path.
      const fixed = path.slice(0, path.search(/[*?]/)).replace(/\/[^/]*$/, '') || '/';
      const re = new RegExp(
        '^' +
          path
            .split('/')
            .map((seg) => globToRegExp(seg).source.slice(1, -1))
            .join('/') +
          '$',
      );
      if (vfs.findNode(fixed)?.type === 'dir')
        vfs.walk(fixed, ROOT, (fp, n) => {
          if (n.type === 'file' && re.test(fp)) found.push(fp);
        });
    } else {
      files.push(`\t${spec}`);
      continue;
    }
    dirs.push([`\t${spec}`, ...found.map((f) => `\t\t${f}`)].join('\n'));
  }
  return ok(`Monitored Directories:\n${dirs.join('\n')}\nMonitored Files:\n${files.join('\n')}\n`);
}

function reloadDeploy(sh: Shell, args: string[]): CmdResult {
  const p = sh.host;
  if (args[0] !== 'deploy-server')
    return fail(`An error occurred: Unknown reload target '${args[0] ?? ''}'.`);
  if (p.role !== 'deployment_server')
    return fail(
      'An error occurred: This instance is not configured as a deployment server (no serverclass.conf).',
    );
  if (!splunkdRunning(sh.world, p)) return notRunning();
  const clsIdx = args.indexOf('-class');
  reloadDeployServer(sh.world, p, clsIdx >= 0 ? args[clsIdx + 1] : undefined);
  return ok('Reloading serverclass(es).\n\n');
}

// ---------------------------------------------------------------- cluster bundle

function notManager(): CmdResult {
  return fail("In handler 'clustermastercontrol': This node is not the cluster manager.");
}

function doApply(sh: Shell): string {
  const { checksum: sum, restarted } = applyClusterBundle(sh.world, sh.host);
  return (
    `Created new bundle with checksum=${sum}\n` +
    'Applying new bundle. The peers may restart depending on the configurations in applied bundle.\n' +
    "Use 'splunk show cluster-bundle-status' for checking the status of the applied bundle.\n" +
    (restarted.length ? `Rolling restart of peers: ${restarted.join(', ')}\n` : '') +
    'OK\n'
  );
}

const BUNDLE_WARNING =
  'Warning: Under some circumstances, this command will initiate a rolling restart\n' +
  'of all peers. This depends on the contents of the configuration bundle. For\n' +
  'details, refer to the documentation.\n';

function applyBundle(sh: Shell, args: string[]): CmdReturn {
  if (sh.host.role !== 'cluster_manager') return notManager();
  if (!splunkdRunning(sh.world, sh.host)) return notRunning();
  try { validateClusterIndexes(managerBundle(sh.world,sh.host)); } catch(e) { return fail((e as Error).message); }
  if (args.includes('--answer-yes')) return ok(BUNDLE_WARNING + doApply(sh));
  // Interactive confirmation, like the real CLI.
  let host: ProgramHost;
  let answer = '';
  const program: Program = {
    start(h) {
      host = h;
      host.write(BUNDLE_WARNING + 'Do you want to continue? [y/n]: ');
    },
    key(k) {
      if (k.name === 'ctrl' && k.ch === 'c') {
        host.write('^C\n');
        return host.exit(130);
      }
      if (k.name === 'backspace' && answer) {
        answer = answer.slice(0, -1);
        return host.write('\b \b');
      }
      if (k.name === 'char') {
        answer += k.ch;
        return host.write(k.ch!);
      }
      if (k.name !== 'enter') return;
      host.write('\n');
      if (/^y(es)?$/i.test(answer.trim())) {
        host.write(doApply(sh));
        host.exit(0);
      } else {
        host.write('Operation aborted.\n');
        host.exit(1);
      }
    },
  };
  return { program };
}

function bundleStatus(sh: Shell): CmdResult {
  if (sh.host.role !== 'cluster_manager') return notManager();
  if (!splunkdRunning(sh.world, sh.host)) return notRunning();
  const latest = checksum(managerBundle(sh.world, sh.host));
  const peers = clusterPeers(sh.world).map((p) => {
    const running = splunkdRunning(sh.world, p);
    const active = running ? checksum(peerBundle(sh.world, p)) : '';
    return `\t${p.hostname}\t${p.site}\t${running ? 'Up' : 'Down'}\tactive_bundle=${active || 'n/a'}\t${active === latest ? 'in sync' : 'out of date'}`;
  });
  return ok(`manager\n\tlatest_bundle (on disk)\n\t\tchecksum=${latest}\n\npeers\n${peers.join('\n')}\n`);
}

// ---------------------------------------------------------------- entry point

export const splunk: CommandFn = (ctx) => {
  const { sh, argv } = ctx;
  const p = sh.host;
  if (!p.splunk) return fail(`bash: ${argv[0]}: command not found`, 127);
  // $SPLUNK_HOME/bin/btool is a shortcut for `splunk btool`.
  if (/(^|\/)btool$/.test(argv[0]!)) return btool(sh, argv.slice(1));
  const [cmd, ...rest] = argv.slice(1);
  if ((['add','edit','list'].includes(cmd ?? '') && rest[0] === 'index') || (cmd === 'validate' && rest[0] === 'cluster-bundle')) return indexCli(ctx);
  if (
    (['show', 'resync', 'backup', 'restore'].includes(cmd ?? '') &&
      (rest[0] === 'kvstore' || rest[0] === 'kvstore-status')) ||
    (cmd === 'reload' && ['collections', 'transforms'].includes(rest[0] ?? ''))
  )
    return kvCli(ctx);
  const version = splunkVersion(sh.world, p)!;

  switch (cmd) {
    case undefined:
    case 'help':
      return ok(
        `\nWelcome to ${productName(p)}'s Command Line Interface (CLI).\n\n` +
          `Commands simulated in this sandbox:\n\n` +
          `    status | start | stop | restart | version\n` +
          `    btool <conf> list [stanza] [--debug] [--app=APP]\n` +
          `    btool check\n` +
          `    list forward-server | list monitor\n` +
          `    show deploy-poll\n` +
          `    reload deploy-server [-class NAME]      (deployment server)\n` +
          `    apply cluster-bundle [--answer-yes]     (cluster manager)\n` +
          `    show cluster-bundle-status              (cluster manager)\n\n`,
      );
    case 'enable':
    case 'disable': {
      if (rest[0] !== 'maintenance-mode' || p.role !== 'cluster_manager')
        return fail('Maintenance mode is managed on the cluster manager');
      const path = `${p.splunk.home}/etc/system/local/server.conf`;
      const prior = sh.fs.exists(path) ? sh.fs.readFile(path, sh.cred) : '';
      const value = cmd === 'enable' ? 'true' : 'false';
      const next = /maintenance_mode\s*=/.test(prior)
        ? prior.replace(/maintenance_mode\s*=.*$/m, `maintenance_mode = ${value}`)
        : prior + `\n[clustering]\nmaintenance_mode = ${value}\n`;
      sh.fs.writeFile(path, next, sh.cred);
      restartSplunk(sh.world, p);
      return ok(`Maintenance mode ${value}\n`);
    }
    case 'offline': {
      try {
        retirePeer(sh.world, p.hostname);
        return serviceAction(sh, 'stop');
      } catch (e) {
        return fail((e as Error).message);
      }
    }
    case 'version':
      return ok(`${productName(p)} ${version} (build ${buildFor(version)})\n`);
    case 'status': {
      if (!splunkdRunning(sh.world, p)) return { stdout: 'splunkd is not running.\n', code: 3 };
      const pid = p.splunk.pid;
      return ok(`splunkd is running (PID: ${pid}).\nsplunk helpers are running (PIDs: ${pid + 22}).\n`);
    }
    case 'start':
    case 'stop':
    case 'restart':
      return serviceAction(sh, cmd);
    case 'btool':
      return btool(sh, rest);
    case 'cmd':
      if (rest[0] === 'btool') return btool(sh, rest.slice(1));
      return fail(`splunk cmd: '${rest[0] ?? ''}' is not available in this sandbox.`);
    case 'list':
      if (rest[0] === 'forward-server') return listForwardServer(sh);
      if (rest[0] === 'monitor') return listMonitor(sh);
      break;
    case 'run':
      if (rest[0] === 'playbook') {
        try {
          return runPlaybook(sh.world, sh.host)
            ? ok('Playbook create_ticket: status=success\n')
            : fail('Playbook failed: inspect the ServiceNow asset credential');
        } catch (e) {
          return fail((e as Error).message);
        }
      }
      return fail('Usage: splunk run playbook create_ticket');
    case 'show':
      if (rest[0] === 'cluster-status') return ok(JSON.stringify(clusterHealth(sh.world), null, 2) + '\n');
      if (rest[0] === 'shcluster-status' || rest[0] === 'kvstore-status') {
        const id = rest[0] === 'shcluster-status' ? 'shc' : 'kvstore';
        trainingAction(sh.world, 'inspect', id);
        return ok(JSON.stringify(getResource(sh.world, id).metrics, null, 2) + '\n');
      }

      if (rest[0] === 'profile-status')
        return ok(JSON.stringify(operationMetrics(sh.world, sh.host), null, 2) + '\n');
      if (rest[0] === 'deploy-poll') return showDeployPoll(sh);
      if (rest[0] === 'cluster-bundle-status') return bundleStatus(sh);
      break;
    case 'reload':
      return reloadDeploy(sh, rest);
    case 'apply':
      if (rest[0] === 'shcluster-bundle') {
        try {
          return ok(`SHC bundle applied: ${applyShcBundle(sh.world, sh.host)}\n`);
        } catch (e) {
          return fail((e as Error).message);
        }
      }
      if (rest[0] === 'cluster-bundle') return applyBundle(sh, rest.slice(1));
      break;
    default:
      break;
  }
  return fail(
    `Command error: The subcommand '${[cmd, ...rest].join(' ')}' is not supported in this sandbox. Run 'splunk help'.`,
  );
};

/** Running splunkd directly is never what you want. */
export const splunkd: CommandFn = () =>
  fail('splunkd: must be started through the splunk CLI or systemd (splunk start).');
