import { normalize } from '../vfs/path';
import { can, FsError } from '../vfs/vfs';
import { COMMANDS } from './commands';
import { runLine } from './exec';
import { openShell, sshConnect } from './login';
import { credFor, homeOf, type Shell } from './shell';
import { fail, ok, type CmdCtx, type CmdReturn, type CommandFn } from './types';

/** Shell builtins: they change the shell itself (cwd, env, the session's shell stack). */

const cd: CommandFn = ({ sh, argv }) => {
  let target = argv[1];
  if (target === undefined || target === '~') target = sh.home;
  else if (target === '-') {
    if (!sh.prevCwd) return fail('bash: cd: OLDPWD not set');
    target = sh.prevCwd;
  }
  const path = sh.resolve(target);
  try {
    const node = sh.fs.lookup(path, sh.cred);
    if (node.type !== 'dir') return fail(`bash: cd: ${target}: Not a directory`);
    if (!can(node, sh.cred, 1)) return fail(`bash: cd: ${target}: Permission denied`);
  } catch (e) {
    if (e instanceof FsError) return fail(`bash: cd: ${target}: ${e.message}`);
    throw e;
  }
  sh.prevCwd = sh.cwd;
  sh.cwd = normalize(path);
  return ok(argv[1] === '-' ? sh.cwd + '\n' : '');
};

const exit: CommandFn = ({ sh, argv }) => {
  const code = argv[1] !== undefined ? Number(argv[1]) || 0 : sh.lastExit;
  return { exitShell: true, code };
};

const logout: CommandFn = (ctx) => {
  if (ctx.sh.kind !== 'ssh' && ctx.sh.kind !== 'bastion')
    return fail("bash: logout: not login shell: use `exit'");
  return exit(ctx);
};

const exportCmd: CommandFn = ({ sh, argv }) => {
  if (argv.length === 1 || argv[1] === '-p')
    return ok(
      [...sh.env.entries()]
        .sort()
        .map(([k, v]) => `declare -x ${k}="${v}"`)
        .join('\n') + '\n',
    );
  for (const a of argv.slice(1)) {
    const eq = a.indexOf('=');
    if (eq > 0) sh.env.set(a.slice(0, eq), a.slice(eq + 1));
    else if (!/^[A-Za-z_]\w*$/.test(a)) return fail(`bash: export: \`${a}': not a valid identifier`);
  }
  return ok();
};

const unset: CommandFn = ({ sh, argv }) => {
  for (const a of argv.slice(1)) sh.env.delete(a);
  return ok();
};

const history: CommandFn = ({ sh, argv }) => {
  if (argv[1] === '-c') {
    sh.history = [];
    return ok();
  }
  const n = argv[1] ? Number(argv[1]) : sh.history.length;
  const start = Math.max(0, sh.history.length - n);
  return ok(
    sh.history
      .slice(start)
      .map((h, i) => `${String(start + i + 1).padStart(5)}  ${h}`)
      .join('\n') + '\n',
  );
};

const alias: CommandFn = ({ sh, argv }) => {
  if (argv.length === 1)
    return ok(
      [...sh.aliases.entries()]
        .sort()
        .map(([k, v]) => `alias ${k}='${v}'`)
        .join('\n') + '\n',
    );
  for (const a of argv.slice(1)) {
    const eq = a.indexOf('=');
    if (eq > 0) sh.aliases.set(a.slice(0, eq), a.slice(eq + 1));
    else if (sh.aliases.has(a)) return ok(`alias ${a}='${sh.aliases.get(a)}'\n`);
    else return fail(`bash: alias: ${a}: not found`);
  }
  return ok();
};

const unalias: CommandFn = ({ sh, argv }) => {
  for (const a of argv.slice(1)) if (!sh.aliases.delete(a)) return fail(`bash: unalias: ${a}: not found`);
  return ok();
};

const type: CommandFn = ({ sh, argv }) => {
  let out = '';
  let code = 0;
  for (const name of argv.slice(1)) {
    if (sh.aliases.has(name)) out += `${name} is aliased to \`${sh.aliases.get(name)}'\n`;
    else if (BUILTINS[name]) out += `${name} is a shell builtin\n`;
    else if (COMMANDS[name])
      out += `${name} is ${name === 'splunk' ? `${sh.host.splunk?.home}/bin/splunk` : `/usr/bin/${name}`}\n`;
    else {
      out += `bash: type: ${name}: not found\n`;
      code = 1;
    }
  }
  return { stdout: out, code };
};

/** `source ~/.bash_profile`: applies export and alias lines; anything else is ignored. */
const source: CommandFn = ({ sh, argv, term }) => {
  if (!argv[1]) return fail('bash: source: filename argument required', 2);
  let text: string;
  try {
    text = sh.fs.readFile(sh.resolve(argv[1]), sh.cred);
  } catch (e) {
    if (e instanceof FsError) return fail(`bash: ${argv[1]}: ${e.message}`);
    throw e;
  }
  for (const line of text.split('\n')) if (/^\s*(export|alias)\s/.test(line)) runLine(sh, line.trim(), term);
  return ok();
};

const ssh: CommandFn = ({ sh, argv, term }) => {
  let user = sh.user;
  let dest: string | undefined;
  const rest: string[] = [];
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i]!;
    if (dest === undefined && a.startsWith('-')) {
      if (a === '-l') user = argv[++i] ?? user;
      else if (['-p', '-i', '-o', '-F', '-J'].includes(a)) i++;
      continue;
    }
    if (dest === undefined) dest = a;
    else rest.push(a);
  }
  if (!dest)
    return fail(
      'usage: ssh [-46AaCfGgKkMNnqsTtVvXxYy] [-B bind_interface] [-b bind_address]\n           [-l login_name] [-p port] destination [command [argument ...]]',
      255,
    );
  const at = dest.lastIndexOf('@');
  if (at >= 0) {
    user = dest.slice(0, at);
    dest = dest.slice(at + 1);
  }
  const result = sshConnect(sh, dest, user);
  if ('error' in result) return fail(result.error, result.code);
  if (rest.length) {
    // ssh host command: run it remotely and come back, without a login banner.
    const r = runLine(result.shell, rest.join(' '), term);
    if (r.program) return { program: r.program };
    return { stdout: r.output, code: result.shell.lastExit };
  }
  return { push: result.shell, output: result.output };
};

function sudoersAllows(sh: Shell): boolean {
  return (
    sh.user === 'root' ||
    (sh.user === 'splunk' && sh.host.role !== 'bastion') ||
    (sh.user === 'svc_ansible' && sh.host.role === 'automation')
  );
}

const sudo: CommandFn = (ctx) => {
  const { sh, argv } = ctx;
  let target = 'root';
  let login = false;
  let shellMode = false;
  let i = 1;
  for (; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === '--') {
      i++;
      break;
    }
    if (!a.startsWith('-')) break;
    if (a === '-u') target = argv[++i] ?? 'root';
    else if (a === '-i') login = true;
    else if (a === '-s') shellMode = true;
    else if (a === '-l') {
      if (!sudoersAllows(sh)) return fail(`Sorry, user ${sh.user} may not run sudo on ${sh.host.hostname}.`);
      return ok(
        `User ${sh.user} may run the following commands on ${sh.host.hostname}:\n    (ALL) NOPASSWD: ALL\n`,
      );
    } else if (a === '-E' || a === '-H') continue;
    else return fail(`sudo: invalid option -- '${a.replace(/^-+/, '')}'\nusage: sudo -h | -K | -k | -V`);
  }
  if (!sudoersAllows(sh))
    return fail(`${sh.user} is not in the sudoers file.  This incident will be reported.`);
  if (target !== 'root' && target !== 'splunk')
    return fail(`sudo: unknown user ${target}\nsudo: error initializing audit plugin sudoers_audit`);

  const cmd = argv.slice(i);
  const wantsShell =
    login || shellMode || (cmd[0] === 'su' && cmd.length <= 3) || cmd[0] === 'bash' || cmd[0] === '-i';
  if (cmd.length === 0 && !login && !shellMode)
    return fail('usage: sudo -h | -K | -k | -V\nusage: sudo [-u user] [-i | -s] [command [arg ...]]');
  if (wantsShell && (cmd.length === 0 || cmd[0] === 'su' || cmd[0] === 'bash')) {
    const user = cmd[0] === 'su' ? (cmd.find((a, k) => k > 0 && a !== '-') ?? 'root') : target;
    const loginShell = login || (cmd[0] === 'su' && cmd.includes('-'));
    const next = openShell(sh.world, sh.host, user, 'sudo', sh, loginShell ? homeOf(user) : sh.cwd);
    return { push: next };
  }
  return runAs(ctx, cmd, target);
};

function runAs(ctx: CmdCtx, cmd: string[], user: string): CmdReturn {
  const name = cmd[0]!;
  const sh = ctx.sh.as(credFor(user));
  const builtin = BUILTINS[name];
  if (builtin && name !== 'cd') return builtin({ ...ctx, sh, argv: cmd });
  let impl: CommandFn | undefined = COMMANDS[name];
  if (name.includes('/')) {
    try {
      const node = sh.fs.lookup(sh.resolve(name), sh.cred);
      impl = node.type === 'file' && node.exec ? COMMANDS[node.exec] : undefined;
    } catch {
      impl = undefined;
    }
  } else if (name === 'splunk') impl = undefined; // root's secure_path does not include $SPLUNK_HOME/bin
  if (!impl) return fail(`sudo: ${name}: command not found`);
  return impl({ ...ctx, sh, argv: cmd });
}

const su: CommandFn = ({ sh, argv }) => {
  const args = argv.slice(1);
  const loginShell = args.includes('-') || args.includes('-l');
  const user = args.find((a) => !a.startsWith('-')) ?? 'root';
  if (sh.user !== 'root') return fail('Password: \nsu: Authentication failure');
  if (user !== 'root' && user !== 'splunk')
    return fail(`su: user ${user} does not exist or the user entry does not contain all the required fields`);
  return { push: openShell(sh.world, sh.host, user, 'su', sh, loginShell ? homeOf(user) : sh.cwd) };
};

export const BUILTINS: Record<string, CommandFn> = {
  cd,
  exit,
  logout,
  export: exportCmd,
  unset,
  history,
  alias,
  unalias,
  type,
  source,
  '.': source,
  ssh,
  sudo,
  su,
};
