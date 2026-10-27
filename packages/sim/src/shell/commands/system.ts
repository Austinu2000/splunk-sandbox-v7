import { setForwarderBoot } from '../../engineering/forwarders';
import { kvRuntime } from '../../kvstore/engine';
import { resolveHost, splunkdRunning, type HostProfile } from '../../hosts/profile';
import { clockTime, dateCmd } from '../../logs/format';
import { mix32, unit } from '../../rng';
import type { World } from '../../world';
import { CLEAR_SCREEN } from '../ansi';
import { pingProgram, pingReply, pingSummary } from '../programs/ping';
import type { Shell } from '../shell';
import { fail, ok, type CommandFn } from '../types';
import { serviceAction } from './splunk';
import { rowOutputs, targetStatus } from '../../derive/state';
import { getopt } from './util';

// --- Processes ---

interface Proc {
  user: string;
  pid: number;
  ppid: number;
  cpu: number;
  mem: number;
  vsz: number;
  rss: number;
  tty: string;
  stat: string;
  start: number;
  time: string;
  cmd: string;
}

function splunkdArgs(p: HostProfile): string {
  return `splunkd --under-systemd --systemd-delegate=yes -p ${p.splunk!.mgmtPort} _internal_launch_under_systemd`;
}

export function processes(sh: Shell): Proc[] {
  const p = sh.host;
  const boot = p.bootTime;
  const base = (pid: number, user: string, cmd: string, extra: Partial<Proc> = {}): Proc => ({
    user,
    pid,
    ppid: 1,
    cpu: 0,
    mem: 0.1,
    vsz: 20000 + (mix32(p.hash, pid) % 200000),
    rss: 4000 + (mix32(p.hash, pid, 1) % 20000),
    tty: '?',
    stat: 'Ss',
    start: boot,
    time: '0:00',
    cmd,
    ...extra,
  });
  const procs: Proc[] = [
    base(1, 'root', '/usr/lib/systemd/systemd --switched-root --system --deserialize 31', {
      ppid: 0,
      time: '1:12',
    }),
    base(2, 'root', '[kthreadd]', { ppid: 0, stat: 'S', vsz: 0, rss: 0 }),
    base(712, 'root', '/usr/lib/systemd/systemd-journald', { time: '0:41' }),
    base(812, 'chrony', '/usr/sbin/chronyd -F 2', { stat: 'S' }),
    base(905, 'root', '/usr/sbin/crond -n'),
    base(921, 'root', '/usr/sbin/rsyslogd -n', { stat: 'Ssl', time: '0:22' }),
    base(1104, 'root', 'sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups'),
  ];
  if (p.splunk && splunkdRunning(sh.world, p)) {
    const pid = p.splunk.pid;
    const big = p.splunk.product === 'enterprise';
    const since = p.fleetRow !== undefined ? Math.max(boot, sh.world.fleet.healthSince[p.fleetRow]!) : boot;
    procs.push(
      base(pid, 'splunk', splunkdArgs(p), {
        cpu: big ? 18.4 : 1.2,
        mem: big ? 12.5 : 1.8,
        vsz: big ? 9_821_000 : 812_000,
        rss: big ? 4_182_000 : 182_000,
        stat: 'Sl',
        start: since,
        time: big ? '412:08' : '38:12',
      }),
      base(pid + 22, 'splunk', `[splunkd pid=${pid}] ${splunkdArgs(p)} [process-runner]`, {
        ppid: pid,
        stat: 'Ss',
        start: since,
      }),
    );
    if (p.role === 'search_head' && kvRuntime(sh.world, p.hostname).running)
      procs.push(
        base(
          pid + 40,
          'splunk',
          `mongod --dbpath=/opt/splunk/var/lib/splunk/kvstore/mongo --storageEngine=wiredTiger --port=${kvRuntime(sh.world, p.hostname).port}`,
          { ppid: pid + 22, stat: 'Sl', mem: 2.1 },
        ),
      );
  }
  const now = sh.world.clock.now;
  const shells: Shell[] = [];
  for (let s: Shell | null = sh; s && s.host.hostname === p.hostname; s = s.parent) shells.unshift(s);
  for (const s of shells) {
    if (s.kind === 'ssh')
      procs.push(base(s.pid - 2, 'root', `sshd: ${s.user} [priv]`, { ppid: 1104, start: now, stat: 'Ss' }));
    if (s.kind === 'ssh')
      procs.push(
        base(s.pid - 1, s.user, `sshd: ${s.user}@pts/0`, { ppid: s.pid - 2, start: now, stat: 'S' }),
      );
    if (s.kind !== 'oneshot')
      procs.push(base(s.pid, s.user, '-bash', { ppid: s.pid - 1, tty: 'pts/0', start: now, stat: 'Ss' }));
  }
  return procs;
}

const ps: CommandFn = ({ sh, argv }) => {
  const args = argv.slice(1).join(' ');
  const procs = processes(sh);
  const self = {
    ...procs[procs.length - 1]!,
    pid: sh.pid + 50 + (sh.history.length % 40),
    ppid: sh.pid,
    stat: 'R+',
    cmd: argv.join(' '),
    tty: 'pts/0',
    user: sh.user,
  };
  const all = [...procs, self];
  if (/aux|-aux|-ax|ax/.test(args) || /-e|-A/.test(args)) {
    if (args.includes('f') && args.includes('-e')) {
      return ok(
        'UID          PID    PPID  C STIME TTY          TIME CMD\n' +
          all
            .map(
              (p) =>
                `${p.user.padEnd(8)} ${String(p.pid).padStart(7)} ${String(p.ppid).padStart(7)}  0 ${clockTime(p.start).slice(0, 5)} ${p.tty.padEnd(8)} 00:${p.time.padStart(5, '0')} ${p.cmd}`,
            )
            .join('\n') +
          '\n',
      );
    }
    return ok(
      'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n' +
        all
          .map(
            (p) =>
              `${p.user.padEnd(8)} ${String(p.pid).padStart(7)} ${p.cpu.toFixed(1).padStart(4)} ${p.mem.toFixed(1).padStart(4)} ${String(p.vsz).padStart(6)} ${String(p.rss).padStart(5)} ${p.tty.padEnd(8)} ${p.stat.padEnd(4)} ${clockTime(p.start).slice(0, 5)} ${p.time.padStart(6)} ${p.cmd}`,
          )
          .join('\n') +
        '\n',
    );
  }
  const mine = all.filter((p) => p.tty === 'pts/0' && p.user === sh.user);
  return ok(
    '    PID TTY          TIME CMD\n' +
      mine
        .map((p) => `${String(p.pid).padStart(7)} pts/0    00:00:00 ${p.cmd.replace(/^-/, '').split(' ')[0]}`)
        .join('\n') +
      '\n',
  );
};

// --- Disks and memory ---

interface Mount {
  fs: string;
  sizeGB: number;
  usedPct: number;
  mount: string;
}

function mounts(sh: Shell): Mount[] {
  const p = sh.host;
  const pct = (salt: number, lo: number, hi: number) => lo + (mix32(p.hash, salt) % (hi - lo));
  const out: Mount[] = [
    { fs: 'devtmpfs', sizeGB: 0.004, usedPct: 0, mount: '/dev' },
    { fs: 'tmpfs', sizeGB: p.memMB / 2048, usedPct: 0, mount: '/dev/shm' },
    { fs: '/dev/mapper/rhel-root', sizeGB: 50, usedPct: pct(1, 18, 46), mount: '/' },
    { fs: '/dev/sda1', sizeGB: 1, usedPct: pct(2, 25, 40), mount: '/boot' },
    { fs: '/dev/mapper/rhel-var', sizeGB: 30, usedPct: pct(3, 20, 55), mount: '/var' },
  ];
  if (p.splunk)
    out.push({
      fs: '/dev/mapper/vg_opt-lv_opt',
      sizeGB: p.diskGB,
      usedPct: p.role === 'indexer' ? pct(4, 61, 78) : pct(4, 9, 34),
      mount: '/opt',
    });
  return out;
}

function fmtGB(gb: number, human: boolean): string {
  if (!human) return String(Math.round(gb * 1024 * 1024));
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)}T`;
  if (gb >= 10) return `${Math.round(gb)}G`;
  if (gb >= 1) return `${gb.toFixed(1)}G`;
  return `${Math.round(gb * 1024)}M`;
}

const df: CommandFn = ({ sh, argv }) => {
  const o = getopt(argv.slice(1));
  const human = o.flags.has('h') || o.flags.has('H');
  let list = mounts(sh);
  if (o.operands.length) {
    const targets = o.operands.map((t) => sh.resolve(t));
    list = targets.map(
      (t) =>
        list
          .filter((m) => t === m.mount || t.startsWith(m.mount === '/' ? '/' : m.mount + '/'))
          .sort((a, b) => b.mount.length - a.mount.length)[0]!,
    );
  }
  const head = `Filesystem                 ${human ? ' Size  Used Avail' : '1K-blocks      Used Available'} Use% Mounted on`;
  const rows = list.map((m) => {
    const used = (m.sizeGB * m.usedPct) / 100;
    const cols = human
      ? `${fmtGB(m.sizeGB, true).padStart(5)} ${fmtGB(used, true).padStart(5)} ${fmtGB(m.sizeGB - used, true).padStart(5)}`
      : `${fmtGB(m.sizeGB, false).padStart(9)} ${fmtGB(used, false).padStart(9)} ${fmtGB(m.sizeGB - used, false).padStart(9)}`;
    return `${m.fs.padEnd(26)} ${cols} ${String(m.usedPct).padStart(3)}% ${m.mount}`;
  });
  return ok([head, ...rows].join('\n') + '\n');
};

function memory(sh: Shell): {
  total: number;
  used: number;
  free: number;
  shared: number;
  cache: number;
  avail: number;
  swap: number;
} {
  const p = sh.host;
  const total = p.memMB * 1024;
  const usedFrac =
    p.splunk?.product === 'enterprise' ? 0.38 + unit(p.hash, 9) * 0.25 : 0.18 + unit(p.hash, 9) * 0.2;
  const used = Math.round(total * usedFrac);
  const cache = Math.round(total * 0.3);
  return {
    total,
    used,
    free: total - used - cache,
    shared: 18_000,
    cache,
    avail: total - used,
    swap: 4_194_300,
  };
}

const free: CommandFn = ({ sh, argv }) => {
  const o = getopt(argv.slice(1));
  const m = memory(sh);
  const fmt = (kb: number) => {
    if (o.flags.has('h'))
      return kb >= 1048576 ? `${(kb / 1048576).toFixed(1)}Gi` : `${Math.round(kb / 1024)}Mi`;
    if (o.flags.has('g')) return String(Math.round(kb / 1048576));
    if (o.flags.has('m')) return String(Math.round(kb / 1024));
    return String(kb);
  };
  const w = 12;
  return ok(
    `${''.padEnd(15)}${'total'.padStart(w)}${'used'.padStart(w)}${'free'.padStart(w)}${'shared'.padStart(w)}${'buff/cache'.padStart(w)}${'available'.padStart(w)}\n` +
      `${'Mem:'.padEnd(15)}${fmt(m.total).padStart(w)}${fmt(m.used).padStart(w)}${fmt(m.free).padStart(w)}${fmt(m.shared).padStart(w)}${fmt(m.cache).padStart(w)}${fmt(m.avail).padStart(w)}\n` +
      `${'Swap:'.padEnd(15)}${fmt(m.swap).padStart(w)}${fmt(0).padStart(w)}${fmt(m.swap).padStart(w)}\n`,
  );
};

function uptimeLine(sh: Shell): string {
  const now = sh.world.clock.now;
  const mins = Math.floor((now - sh.host.bootTime) / 60_000);
  const days = Math.floor(mins / 1440);
  const hh = Math.floor((mins % 1440) / 60);
  const mm = mins % 60;
  const load = [0, 1, 2].map((k) =>
    (
      unit(sh.host.hash, Math.floor(now / 60_000), k) * (sh.host.splunk?.product === 'enterprise' ? 6 : 0.6)
    ).toFixed(2),
  );
  return ` ${clockTime(now)} up ${days} days, ${String(hh).padStart(2)}:${String(mm).padStart(2, '0')},  1 user,  load average: ${load.join(', ')}`;
}

const uptime: CommandFn = ({ sh }) => ok(uptimeLine(sh) + '\n');

const top: CommandFn = ({ sh, tty }) => {
  const procs = processes(sh).sort((a, b) => b.cpu - a.cpu);
  const m = memory(sh);
  const running = procs.filter((p) => p.cpu > 0).length;
  const out =
    `top - ${uptimeLine(sh).trim()}\n` +
    `Tasks: ${procs.length + 140} total,   ${running} running, ${procs.length + 139 - running} sleeping,   0 stopped,   0 zombie\n` +
    `%Cpu(s):  ${(procs.reduce((s, p) => s + p.cpu, 0) / sh.host.cpus).toFixed(1)} us,  0.8 sy,  0.0 ni, 96.9 id,  0.2 wa,  0.0 hi,  0.1 si,  0.0 st\n` +
    `MiB Mem : ${(m.total / 1024).toFixed(1).padStart(8)} total, ${(m.free / 1024).toFixed(1).padStart(8)} free, ${(m.used / 1024).toFixed(1).padStart(8)} used, ${(m.cache / 1024).toFixed(1).padStart(8)} buff/cache\n` +
    `MiB Swap: ${(m.swap / 1024).toFixed(1).padStart(8)} total, ${(m.swap / 1024).toFixed(1).padStart(8)} free,      0.0 used. ${(m.avail / 1024).toFixed(1).padStart(8)} avail Mem\n\n` +
    `    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND\n` +
    procs
      .map(
        (p) =>
          `${String(p.pid).padStart(7)} ${p.user.padEnd(9)} 20   0 ${String(p.vsz).padStart(7)} ${String(p.rss).padStart(6)} ${String(Math.round(p.rss / 4)).padStart(6)} ${p.stat[0]} ${p.cpu.toFixed(1).padStart(5)} ${p.mem.toFixed(1).padStart(5)} ${(p.time + '.00').padStart(9)} ${p.cmd.split(' ')[0]!.replace(/^\[splunkd$/, 'splunkd')}`,
      )
      .join('\n') +
    '\n';
  // A static snapshot (spec): print once rather than refreshing.
  return ok((tty ? CLEAR_SCREEN : '') + out);
};

// --- Services ---

const UNITS: Record<string, string> = {
  sshd: 'OpenSSH server daemon',
  chronyd: 'NTP client/server',
  crond: 'Command Scheduler',
  rsyslog: 'System Logging Service',
};

const systemctl: CommandFn = ({ sh, argv }) => {
  const o = getopt(argv.slice(1));
  const [verb, rawUnit] = o.operands;
  const p = sh.host;
  const unitName = (rawUnit ?? '').replace(/\.service$/, '');
  const isSplunk =
    !!p.splunk &&
    sh.world.forwarders?.clients[p.hostname]?.installed !== false &&
    unitName === p.splunk.service;
  if (!verb || verb === 'list-units') {
    const units = [...Object.keys(UNITS), ...(p.splunk ? [p.splunk.service] : [])];
    return ok(
      '  UNIT                          LOAD   ACTIVE SUB     DESCRIPTION\n' +
        units
          .map(
            (u) =>
              `  ${(u + '.service').padEnd(29)} loaded ${(u === p.splunk?.service && !splunkdRunning(sh.world, p) ? 'failed ' : 'active ').padEnd(6)} ${u === p.splunk?.service && !splunkdRunning(sh.world, p) ? 'failed ' : 'running'} ${UNITS[u] ?? "Systemd service file for Splunk, generated by 'splunk enable boot-start'"}`,
          )
          .join('\n') +
        '\n',
    );
  }
  if (!rawUnit) return fail(`Too few arguments.`);
  if (!isSplunk && !UNITS[unitName])
    return { stderr: `Unit ${unitName}.service could not be found.\n`, code: 4 };

  if (isSplunk && p.role === 'universal_forwarder' && ['enable', 'disable', 'is-enabled'].includes(verb)) {
    const enabled = sh.world.forwarders?.clients[p.hostname]?.bootStart ?? true;
    if (verb === 'is-enabled') return { stdout: enabled ? 'enabled\n' : 'disabled\n', code: enabled ? 0 : 1 };
    if (sh.user !== 'root') return fail('Root privilege required');
    setForwarderBoot(sh.world, p.hostname, verb === 'enable');
    return ok();
  }
  if (verb === 'status' || verb === 'is-active') {
    const running = isSplunk ? splunkdRunning(sh.world, p) : true;
    if (verb === 'is-active') return { stdout: running ? 'active\n' : 'failed\n', code: running ? 0 : 3 };
    const since =
      isSplunk && p.fleetRow !== undefined
        ? Math.max(p.bootTime, sh.world.fleet.healthSince[p.fleetRow]!)
        : p.bootTime;
    const ago = Math.floor((sh.world.clock.now - since) / 86_400_000);
    const sinceText = `${dateCmd(since).replace(/ UTC (\d{4})$/, '')} UTC; ${ago ? `${ago} days` : `${Math.max(1, Math.floor((sh.world.clock.now - since) / 60_000))}min`} ago`;
    const desc = isSplunk
      ? "Systemd service file for Splunk, generated by 'splunk enable boot-start'"
      : UNITS[unitName]!;
    const header = `${running ? '●' : '×'} ${unitName}.service - ${desc}\n     Loaded: loaded (/${isSplunk ? 'etc/systemd/system' : 'usr/lib/systemd/system'}/${unitName}.service; ${isSplunk && sh.world.forwarders?.clients[p.hostname]?.bootStart === false ? 'disabled' : 'enabled'}; preset: disabled)\n`;
    if (!running)
      return {
        stdout:
          header +
          `     Active: failed (Result: exit-code) since ${sinceText}\n    Process: ${p.splunk!.pid} ExecStart=${p.splunk!.home}/bin/splunk _internal_launch_under_systemd (code=exited, status=1/FAILURE)\n   Main PID: ${p.splunk!.pid} (code=exited, status=1/FAILURE)\n        CPU: 41.218s\n`,
        code: 3,
      };
    if (isSplunk) {
      const pid = p.splunk!.pid;
      return ok(
        header +
          `     Active: active (running) since ${sinceText}\n   Main PID: ${pid} (splunkd)\n      Tasks: ${p.splunk!.product === 'enterprise' ? 212 : 64} (limit: 48836)\n     Memory: ${p.splunk!.product === 'enterprise' ? '4.1G' : '182.4M'}\n        CPU: 2h 12min 3.551s\n     CGroup: /system.slice/${unitName}.service\n             ├─${pid} ${splunkdArgs(p)}\n             └─${pid + 22} "[splunkd pid=${pid}] ${splunkdArgs(p)} [process-runner]"\n`,
      );
    }
    return ok(header + `     Active: active (running) since ${sinceText}\n`);
  }
  if (['start', 'stop', 'restart', 'reload'].includes(verb)) {
    if (sh.user !== 'root')
      return fail(
        `Failed to ${verb} ${unitName}.service: Interactive authentication required.\nSee system logs and 'systemctl status ${unitName}.service' for details.`,
      );
    if (!isSplunk) return ok();
    if (verb === 'reload')
      return fail(
        `Failed to reload ${unitName}.service: Job type reload is not applicable for unit ${unitName}.service.`,
      );
    return serviceAction(sh, verb as 'start' | 'stop' | 'restart', true);
  }
  return fail(`Unknown command verb '${verb}'.`);
};

// --- Network ---

interface Socket {
  proto: 'tcp';
  local: string;
  remote: string;
  state: 'LISTEN' | 'ESTAB' | 'SYN-SENT';
  proc?: { name: string; pid: number; user: string };
}

export function listeningPorts(world: World, p: HostProfile): number[] {
  const ports = [22];
  if (p.splunk && splunkdRunning(world, p)) {
    ports.push(p.splunk.mgmtPort);
    // Receiving ports come from the running inputs.conf (splunktcp://), so disabling one takes effect on restart.
    ports.push(...(world.derived.listening.get(p.hostname) ?? []));
    if (p.role === 'indexer') ports.push(9887);
    if (p.splunk.product === 'enterprise' && p.role !== 'indexer') ports.push(8000);
    if (p.role === 'search_head' && kvRuntime(world, p.hostname).running)
      ports.push(kvRuntime(world, p.hostname).port);
  }
  return ports;
}

function sockets(sh: Shell): Socket[] {
  const p = sh.host;
  const out: Socket[] = [];
  const sshd = { name: 'sshd', pid: 1104, user: 'root' };
  for (const port of listeningPorts(sh.world, p)) {
    const proc =
      port === 22 ? sshd : { name: port === 8191 ? 'mongod' : 'splunkd', pid: p.splunk!.pid, user: 'splunk' };
    out.push({ proto: 'tcp', local: `0.0.0.0:${port}`, remote: '0.0.0.0:*', state: 'LISTEN', proc });
  }
  if (sh.kind === 'ssh' || sh.parent?.host.hostname === p.hostname)
    out.push({
      proto: 'tcp',
      local: `${p.ip}:22`,
      remote: `10.10.0.5:${40000 + (p.hash % 20000)}`,
      state: 'ESTAB',
      proc: sshd,
    });
  if (p.fleetRow !== undefined && splunkdRunning(sh.world, p)) {
    // Connected to a reachable indexer; when none is reachable the connect attempt sits in SYN-SENT.
    const targets = rowOutputs(sh.world, p.fleetRow).servers.map((srv) => targetStatus(sh.world, srv));
    const live = targets.filter((t) => t.reachable);
    const target = live[p.hash % Math.max(1, live.length)] ?? targets.find((t) => t.host);
    if (target?.host)
      out.push({
        proto: 'tcp',
        local: `${p.ip}:${40000 + (mix32(p.hash, 3) % 20000)}`,
        remote: `${target.host.ip}:${target.port}`,
        state: target.reachable ? 'ESTAB' : 'SYN-SENT',
        proc: { name: 'splunkd', pid: p.splunk!.pid, user: 'splunk' },
      });
  }
  return out;
}

function netCmd(style: 'ss' | 'netstat'): CommandFn {
  return ({ sh, argv }) => {
    const o = getopt(argv.slice(1));
    const f = o.flags;
    const listenOnly = f.has('l');
    const showProc = f.has('p');
    const list = sockets(sh).filter((s) =>
      listenOnly ? s.state === 'LISTEN' : f.has('a') || style === 'ss' ? true : s.state !== 'LISTEN',
    );
    const procText = (s: Socket) => {
      if (!showProc || !s.proc) return '';
      if (sh.user !== 'root' && s.proc.user !== sh.user) return style === 'ss' ? '' : '-';
      return style === 'ss'
        ? `users:(("${s.proc.name}",pid=${s.proc.pid},fd=${5 + (s.proc.pid % 30)}))`
        : `${s.proc.pid}/${s.proc.name}`;
    };
    let warn = '';
    if (showProc && sh.user !== 'root' && style === 'netstat')
      warn =
        '(Not all processes could be identified, non-owned process info\n will not be shown, you would have to be root to see it all.)\n';
    if (style === 'ss') {
      return ok(
        'State   Recv-Q  Send-Q   Local Address:Port    Peer Address:Port  Process\n' +
          list
            .map(
              (s) =>
                `${s.state.padEnd(7)} 0       ${s.state === 'LISTEN' ? '128' : '0  '}      ${s.local.padStart(19)} ${s.remote.padStart(20)}  ${procText(s)}`,
            )
            .join('\n') +
          '\n',
      );
    }
    return ok(
      warn +
        'Active Internet connections ' +
        (listenOnly ? '(only servers)' : '(servers and established)') +
        '\nProto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name\n' +
        list
          .map(
            (s) =>
              `tcp        0      0 ${s.local.padEnd(23)} ${s.remote.padEnd(23)} ${(s.state === 'ESTAB' ? 'ESTABLISHED' : s.state === 'SYN-SENT' ? 'SYN_SENT' : 'LISTEN').padEnd(11)} ${procText(s)}`,
          )
          .join('\n') +
        '\n',
    );
  };
}

/** Round-trip time between two hosts: sub-millisecond in a site, tens of ms across sites. */
export function rttMs(world: World, from: HostProfile, to: HostProfile, seq: number): number {
  const sites = world.config.sites.map((s) => s.id);
  const dist = Math.abs(sites.indexOf(from.site) - sites.indexOf(to.site));
  const base = from.hostname === to.hostname ? 0.03 : dist === 0 ? 0.35 : dist === 1 ? 28 : 92;
  return base * (0.85 + unit(from.hash, to.hash, seq) * 0.4);
}

const ping: CommandFn = ({ sh, argv }) => {
  const o = getopt(argv.slice(1), 'cWiw');
  const target = o.operands[0];
  if (!target) return fail('ping: usage error: Destination address required', 2);
  const to = resolveHost(sh.world, target);
  if (!to) return fail(`ping: ${target}: Name or service not known`, 2);
  const count = o.flags.has('c') ? Number(o.flags.get('c')) : Infinity;
  if (Number.isFinite(count)) {
    let out = `PING ${to.fqdn} (${to.ip}) 56(84) bytes of data.\n`;
    const rtts: number[] = [];
    for (let seq = 1; seq <= count; seq++) {
      const r = rttMs(sh.world, sh.host, to, seq);
      rtts.push(r);
      out += pingReply(to, seq, r);
    }
    out += pingSummary(to, count, rtts);
    return { stdout: out, code: rtts.length ? 0 : 1 };
  }
  return { program: pingProgram(sh, to) };
};

const nc: CommandFn = ({ sh, argv }) => {
  const o = getopt(argv.slice(1), 'wW');
  const [host, port] = o.operands;
  const banner = 'Ncat: Version 7.92 ( https://nmap.org/ncat )\n';
  if (!host || !port) return fail(`${banner}Ncat: You must specify a host to connect to. QUITTING.`, 2);
  const to = resolveHost(sh.world, host);
  if (!to)
    return fail(
      `${banner}Ncat: Could not resolve hostname "${host}": Name or service not known. QUITTING.`,
      2,
    );
  const open =
    to.os === 'windows'
      ? Number(port) === 8089 && splunkdRunning(sh.world, to)
      : listeningPorts(sh.world, to).includes(Number(port));
  if (!open) return fail(`${banner}Ncat: Connection refused.`, 1);
  return {
    stdout: '',
    stderr: `${banner}Ncat: Connected to ${to.ip}:${port}.\nNcat: 0 bytes sent, 0 bytes received in 0.01 seconds.\n`,
    code: 0,
  };
};

// --- Identity and environment ---

const uname: CommandFn = ({ sh, argv }) => {
  const o = getopt(argv.slice(1));
  const k = sh.host.distro.kernel;
  if (o.flags.has('a'))
    return ok(
      `Linux ${sh.host.hostname} ${k} #1 SMP PREEMPT_DYNAMIC Thu Apr 4 20:45:21 EDT 2024 x86_64 x86_64 x86_64 GNU/Linux\n`,
    );
  const parts: string[] = [];
  if (o.flags.has('s') || o.flags.size === 0) parts.push('Linux');
  if (o.flags.has('n')) parts.push(sh.host.hostname);
  if (o.flags.has('r')) parts.push(k);
  if (o.flags.has('m')) parts.push('x86_64');
  return ok(parts.join(' ') + '\n');
};

const hostname: CommandFn = ({ sh, argv }) => {
  const o = getopt(argv.slice(1));
  if (o.flags.has('f')) return ok(sh.host.fqdn + '\n');
  if (o.flags.has('i') || o.flags.has('I')) return ok(sh.host.ip + (o.flags.has('I') ? ' ' : '') + '\n');
  if (o.flags.has('s')) return ok(sh.host.hostname + '\n');
  return ok(sh.host.hostname + '\n');
};

const whoami: CommandFn = ({ sh }) => ok(sh.user + '\n');

const id: CommandFn = ({ sh, argv }) => {
  const user = argv[1] ?? sh.user;
  if (user === 'root')
    return ok(
      'uid=0(root) gid=0(root) groups=0(root) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023\n',
    );
  const account = sh.fs
    .readFile('/etc/passwd', sh.cred)
    .split('\n')
    .map((line) => line.split(':'))
    .find((fields) => fields[0] === user);
  if (!account) return fail(`id: '${user}': no such user`);
  return ok(
    `uid=${account[2]}(${user}) gid=${account[3]}(${user}) groups=${account[3]}(${user}) context=unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023\n`,
  );
};

const date: CommandFn = ({ sh, argv }) => {
  const fmt = argv.slice(1).find((a) => a.startsWith('+'));
  const now = sh.world.clock.now;
  if (!fmt) return ok(dateCmd(now) + '\n');
  const d = new Date(now);
  const p2 = (n: number) => String(n).padStart(2, '0');
  const out = fmt
    .slice(1)
    .replace(/%Y/g, String(d.getUTCFullYear()))
    .replace(/%m/g, p2(d.getUTCMonth() + 1))
    .replace(/%d/g, p2(d.getUTCDate()))
    .replace(/%H/g, p2(d.getUTCHours()))
    .replace(/%M/g, p2(d.getUTCMinutes()))
    .replace(/%S/g, p2(d.getUTCSeconds()))
    .replace(/%s/g, String(Math.floor(now / 1000)))
    .replace(/%F/g, d.toISOString().slice(0, 10))
    .replace(/%T/g, clockTime(now));
  return ok(out + '\n');
};

const env: CommandFn = ({ sh }) =>
  ok([...sh.env.entries()].map(([k, v]) => `${k}=${v}`).join('\n') + `\nPWD=${sh.cwd}\n`);

const which: CommandFn = ({ sh, argv }) => {
  let out = '';
  let err = '';
  for (const name of argv.slice(1)) {
    if (sh.aliases.has(name)) out += `alias ${name}='${sh.aliases.get(name)}'\n\t`;
    if (name === 'splunk' || name === 'splunkd') {
      if (sh.host.splunk && sh.onPath(`${sh.host.splunk.home}/bin`))
        out += `${sh.host.splunk.home}/bin/${name}\n`;
      else err += `/usr/bin/which: no ${name} in (${sh.env.get('PATH')})\n`;
    } else if (sh.fs.findNode(`/usr/bin/${name}`)) out += `/usr/bin/${name}\n`;
    else err += `/usr/bin/which: no ${name} in (${sh.env.get('PATH')})\n`;
  }
  return { stdout: out, stderr: err, code: err ? 1 : 0 };
};

const clear: CommandFn = () => ok(CLEAR_SCREEN);

const man: CommandFn = ({ argv }) =>
  fail(
    argv[1] ? `No manual entry for ${argv[1]}` : "What manual page do you want?\nFor example, try 'man man'.",
  );

const ip: CommandFn = ({ sh, argv }) => {
  const sub = argv[1] ?? '';
  if (!/^(a|addr|address)$/.test(sub)) return fail(`Object "${sub}" is unknown, try "ip help".`, 255);
  return ok(
    `1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000\n    inet 127.0.0.1/8 scope host lo\n` +
      `2: ens192: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc mq state UP group default qlen 1000\n    link/ether 00:50:56:${[1, 2, 3].map((k) => (mix32(sh.host.hash, k) % 256).toString(16).padStart(2, '0')).join(':')} brd ff:ff:ff:ff:ff:ff\n    inet ${sh.host.ip}/16 brd 10.${sh.host.ip.split('.')[1]}.255.255 scope global noprefixroute ens192\n`,
  );
};

export const SYSTEM_COMMANDS: Record<string, CommandFn> = {
  ps,
  df,
  free,
  top,
  uptime,
  systemctl,
  ss: netCmd('ss'),
  netstat: netCmd('netstat'),
  ping,
  nc,
  ncat: nc,
  uname,
  hostname,
  whoami,
  id,
  date,
  env,
  printenv: env,
  which,
  clear,
  man,
  ip,
};
