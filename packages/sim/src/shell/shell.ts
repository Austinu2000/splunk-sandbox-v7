import type { HostProfile } from '../hosts/profile';
import { mix32 } from '../rng';
import { resolvePath } from '../vfs/path';
import { FsError, type Cred, type Vfs } from '../vfs/vfs';
import type { World } from '../world';

export function credFor(user: string): Cred {
  return { user, groups: [user] };
}

export function homeOf(user: string): string {
  return user === 'root' ? '/root' : `/home/${user}`;
}

export type ShellKind = 'bastion' | 'ssh' | 'sudo' | 'su' | 'oneshot';

/**
 * One interactive shell: a user logged in on a host. The terminal session keeps a stack of these
 * (bastion → ssh → sudo -i ...). Everything here is in-memory state; nothing touches the real machine.
 */
export class Shell {
  cwd: string;
  prevCwd: string | null = null;
  readonly env = new Map<string, string>();
  readonly aliases = new Map<string, string>();
  history: string[] = [];
  lastExit = 0;
  /** Hosts whose key has been accepted in this terminal session (only meaningful on the bastion shell). */
  readonly knownHosts = new Set<string>();
  readonly pid: number;

  constructor(
    readonly world: World,
    readonly host: HostProfile,
    readonly fs: Vfs,
    readonly cred: Cred,
    readonly kind: ShellKind,
    readonly parent: Shell | null,
    opts: { cwd?: string; inheritEnv?: Shell } = {},
  ) {
    this.cwd = opts.cwd ?? (this.fs.exists(this.home) ? this.home : '/');
    this.pid = 3000 + (mix32(host.hash, depth(parent), 0x5e11) % 60000);
    const user = cred.user;
    const base: Record<string, string> = {
      HOME: this.home,
      USER: user,
      LOGNAME: user,
      SHELL: '/bin/bash',
      HOSTNAME: host.hostname,
      TERM: 'xterm-256color',
      LANG: 'en_US.UTF-8',
      PATH:
        user === 'root'
          ? '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/root/bin'
          : '/usr/local/bin:/usr/bin:/usr/local/sbin:/usr/sbin',
    };
    if (opts.inheritEnv) for (const [k, v] of opts.inheritEnv.env) this.env.set(k, v);
    for (const [k, v] of Object.entries(base))
      if (!opts.inheritEnv || ['HOME', 'USER', 'LOGNAME'].includes(k)) this.env.set(k, v);
    if (opts.inheritEnv) this.env.set('PATH', opts.inheritEnv.env.get('PATH') ?? base.PATH!);
    // Login shells source ~/.bash_profile, which adds $SPLUNK_HOME/bin for the splunk account.
    if (user === 'splunk' && host.splunk && kind !== 'oneshot') {
      this.env.set('SPLUNK_HOME', host.splunk.home);
      this.env.set('PATH', `${this.env.get('PATH')}:${host.splunk.home}/bin`);
    }
    this.aliases.set('ll', 'ls -l');
    this.aliases.set('ls', 'ls --color=auto');
    this.aliases.set('grep', 'grep --color=auto');
    this.history = this.loadHistory();
  }

  get user(): string {
    return this.cred.user;
  }

  get home(): string {
    return homeOf(this.cred.user);
  }

  /** A shell for one command under different credentials (sudo cmd), sharing cwd and env. */
  as(cred: Cred): Shell {
    const sh = new Shell(this.world, this.host, this.fs, cred, 'oneshot', this, {
      cwd: this.cwd,
      inheritEnv: this,
    });
    sh.env.set('PATH', cred.user === 'root' ? '/sbin:/bin:/usr/sbin:/usr/bin' : this.env.get('PATH')!);
    return sh;
  }

  prompt(): string {
    const label =
      this.cwd === this.home ? '~' : this.cwd === '/' ? '/' : this.cwd.slice(this.cwd.lastIndexOf('/') + 1);
    return `[${this.user}@${this.host.hostname} ${label}]${this.user === 'root' ? '#' : '$'} `;
  }

  resolve(path: string): string {
    return resolvePath(this.cwd, path, this.home);
  }

  getVar(name: string): string | undefined {
    if (name === '?') return String(this.lastExit);
    if (name === '$') return String(this.pid);
    if (name === '#') return '0';
    if (name === 'PWD') return this.cwd;
    if (name === 'OLDPWD') return this.prevCwd ?? undefined;
    return this.env.get(name);
  }

  /** Whether a directory is on $PATH (used to decide if `splunk` resolves without a full path). */
  onPath(dir: string): boolean {
    return (this.env.get('PATH') ?? '').split(':').includes(dir);
  }

  private loadHistory(): string[] {
    try {
      return this.fs
        .readFile(`${this.home}/.bash_history`, this.cred)
        .split('\n')
        .filter((l) => l.trim());
    } catch {
      return [];
    }
  }
}

function depth(sh: Shell | null): number {
  let d = 0;
  for (let s = sh; s; s = s.parent) d++;
  return d;
}

/** "cmd: path: Permission denied" style message for a filesystem error. */
export function fsMessage(
  cmd: string,
  path: string,
  e: unknown,
  style: 'plain' | 'quoted' = 'plain',
): string {
  if (!(e instanceof FsError)) throw e;
  const shown = style === 'quoted' ? `'${path}'` : path;
  return `${cmd}: ${shown}: ${e.message}\n`;
}
