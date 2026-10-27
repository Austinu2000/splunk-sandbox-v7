import { journal } from '../journal';
import { BASTION, BASTION_IP, BASTION_USER, resolveHost, type HostProfile } from '../hosts/profile';
import { lastLoginTs } from '../logs/format';
import { mix32 } from '../rng';
import { hostFs } from '../vfs/build';
import type { World } from '../world';
import { COMMAND_NAMES } from './commands';
import { credFor, Shell, type ShellKind } from './shell';

export function openShell(
  world: World,
  p: HostProfile,
  user: string,
  kind: ShellKind,
  parent: Shell | null,
  cwd?: string,
): Shell {
  const fs = hostFs(world, p, COMMAND_NAMES);
  return new Shell(world, p, fs, credFor(user), kind, parent, { cwd, liveFs: true });
}

export function bastionShell(world: World): Shell {
  return openShell(world, resolveHost(world, BASTION)!, BASTION_USER, 'bastion', null);
}

/** The "Last login" line, then records this login so the next one reports it. */
function lastLoginLine(world: World, p: HostProfile, from: string): string {
  const prev =
    world.hosts.lastLogin.get(p.hostname) ?? world.clock.now - (2 + (mix32(p.hash, 0x1a57) % 70)) * 3_600_000;
  world.hosts.lastLogin.set(p.hostname, world.clock.now);
  journal(world, { k: 'login', host: p.hostname });
  return `Last login: ${lastLoginTs(prev)} from ${from}\n`;
}

export function bastionBanner(world: World): string {
  const p = resolveHost(world, BASTION)!;
  return (
    `Authorized uses only. All activity may be monitored and reported.\n` +
    lastLoginLine(world, p, '192.168.1.24') +
    `\nWelcome, engineer. Hosts are listed in ~/README.txt. Try: ssh splunk@ds01\n`
  );
}

export type SshOutcome = { shell: Shell; output: string } | { error: string; code: number };

/** Opens an SSH session from `from` to `target` as `user`, with realistic failures. */
export function sshConnect(from: Shell, target: string, user: string): SshOutcome {
  const world = from.world;
  const p = resolveHost(world, target);
  if (!p)
    return { error: `ssh: Could not resolve hostname ${target}: Name or service not known\n`, code: 255 };
  if (p.fleetRow !== undefined && world.config.permanentOfflineRows?.includes(p.fleetRow))
    return { error: `ssh: connect to host ${p.hostname} port 22: Connection timed out\n`, code: 255 };
  if (p.os === 'windows')
    return { error: `ssh: connect to host ${p.hostname} port 22: Connection refused\n`, code: 255 };
  const methods = 'publickey,gssapi-keyex,gssapi-with-mic';
  // Only the bastion holds keys, and only the splunk account accepts them.
  if (
    from.host.hostname !== BASTION ||
    user !== (p.role === 'automation' ? 'svc_ansible' : 'splunk') ||
    p.hostname === BASTION
  )
    return { error: `${user}@${p.hostname}: Permission denied (${methods}).\n`, code: 255 };

  let output = '';
  const bastion = rootShell(from);
  if (!bastion.knownHosts.has(p.hostname)) {
    bastion.knownHosts.add(p.hostname);
    output += `Warning: Permanently added '${p.hostname}' (ED25519) to the list of known hosts.\n`;
  }
  const shell = openShell(world, p, user, 'ssh', from);
  try {
    output += shell.fs.readFile('/etc/motd', shell.cred);
  } catch {
    // no motd
  }
  output += lastLoginLine(world, p, BASTION_IP);
  return { shell, output };
}

function rootShell(sh: Shell): Shell {
  let s = sh;
  while (s.parent) s = s.parent;
  return s;
}
