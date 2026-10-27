import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createWorld, hostname, setHealth, tickWorld, Rng, HEALTH_CODE } from '../src';
import { parseLine, ShellSyntaxError, wordText, type Word } from '../src/shell/tokenize';
import { stripAnsi } from '../src/shell/ansi';
import { testTerm } from './helpers';

const env = { home: '/home/splunk' };
const vars: Record<string, string> = { X: 'ex' };
const text = (w: Word) => wordText(w, (n) => vars[n]);

describe('parser', () => {
  it('handles quotes, variables, pipes, lists and redirects', () => {
    const items = parseLine(`echo 'a $X' "b $X" c\\ d $X | grep -v x > out.txt 2>&1 && ls ~/logs; pwd`, env);
    expect(items).toHaveLength(3);
    const [first] = items;
    expect(first!.pipeline[0]!.words.map(text)).toEqual(['echo', 'a $X', 'b ex', 'c d', 'ex']);
    expect(first!.pipeline[1]!.redirects.map((r) => [r.op, r.target && text(r.target)])).toEqual([
      ['>', 'out.txt'],
      ['2>&1', undefined],
    ]);
    expect(first!.next).toBe('&&');
    expect(text(items[1]!.pipeline[0]!.words[1]!)).toBe('/home/splunk/logs');
  });

  it('marks only unquoted globs', () => {
    const [item] = parseLine(`ls *.conf '*.log'`, env);
    expect(item!.pipeline[0]!.words.map((w) => w.glob)).toEqual([false, true, false]);
  });

  it('rejects command substitution, background jobs and dangling operators', () => {
    expect(() => parseLine('echo $(whoami)', env)).toThrow(ShellSyntaxError);
    expect(() => parseLine('echo `whoami`', env)).toThrow(/not supported/);
    expect(() => parseLine('sleep 10 &', env)).toThrow(/background/);
    expect(() => parseLine('ls |', env)).toThrow(/unexpected token/);
  });
});

describe('login flow', () => {
  it('starts on the bastion and logs in to hosts as splunk', () => {
    const t = testTerm();
    expect(t.run('whoami')).toBe('engineer\n');
    const first = t.run('ssh splunk@ds01');
    expect(first).toContain("Warning: Permanently added 'ds01' (ED25519) to the list of known hosts.");
    expect(first).toMatch(/Last login: \w{3} \w{3} +\d+ [\d:]+ 2026 from 10\.10\.0\.5/);
    expect(t.session.location).toEqual({ host: 'ds01', user: 'splunk' });
    expect(t.run('hostname -f')).toBe('ds01.corp.example\n');
    expect(t.run('exit')).toContain('Connection to ds01 closed.');
    expect(t.session.location.host).toBe('bastion01');
    expect(t.run('ssh splunk@ds01')).not.toContain('Permanently added');
  });

  it('fails like real ssh for unknown hosts, Windows hosts, root, and hops between hosts', () => {
    const t = testTerm();
    expect(t.run('ssh splunk@nope')).toContain('Could not resolve hostname nope');
    expect(t.run('ssh splunk@dal-win-0001')).toContain('port 22: Connection refused');
    expect(t.run('ssh root@idx01')).toContain('Permission denied (publickey');
    expect(t.run('ssh idx01')).toContain('engineer@idx01: Permission denied');
    t.run('ssh splunk@idx01');
    expect(t.run('ssh splunk@ds01')).toContain('Permission denied');
  });

  it('runs a remote command without logging in', () => {
    const t = testTerm();
    expect(t.run('ssh splunk@idx01 hostname')).toBe('idx01\n');
    expect(t.session.location.host).toBe('bastion01');
  });

  it('gives root via sudo, keeps splunk off root PATH, and denies sudo on the bastion', () => {
    const t = testTerm();
    expect(t.run('sudo -i')).toContain('engineer is not in the sudoers file');
    t.run('ssh splunk@idx01');
    expect(t.run('cat /etc/shadow')).toBe('cat: /etc/shadow: Permission denied\n');
    expect(t.run('sudo head -c 4 /etc/shadow')).toBe('root');
    t.run('sudo -i');
    expect(t.run('whoami; pwd')).toBe('root\n/root\n');
    expect(t.run('splunk status')).toBe('bash: splunk: command not found\n');
    expect(t.run('/opt/splunk/bin/splunk status')).toContain('splunkd is running');
    t.run('exit');
    expect(t.session.location.user).toBe('splunk');
  });
});

describe('files and pipes', () => {
  it('navigates the generated Splunk tree', () => {
    const t = testTerm();
    t.run('ssh splunk@ds01');
    t.run('cd $SPLUNK_HOME/etc');
    expect(t.run('pwd')).toBe('/opt/splunk/etc\n');
    expect(t.run('ls -1')).toContain('deployment-apps\n');
    // 2 shared apps + an outputs and an hf-outputs app per site + one inputs app per server class
    expect(t.run('ls deployment-apps | wc -l').trim()).toBe(String(2 + 2 * 3 + 6));
    expect(t.run('cat system/local/serverclass.conf | grep -c whitelist')).toMatch(/^\d+\n$/);
    expect(t.run('cd nowhere')).toBe('bash: cd: nowhere: No such file or directory\n');
    expect(t.run('ls -la /root')).toBe("ls: cannot open directory '/root': Permission denied\n");
  });

  it('enforces permissions on writes and keeps edits in the overlay', () => {
    const t = testTerm();
    t.run('ssh splunk@idx01');
    expect(t.run('echo hi >> /etc/hosts')).toBe('bash: /etc/hosts: Permission denied\n');
    expect(t.run('echo one > /tmp/a.txt; echo two >> /tmp/a.txt; cat /tmp/a.txt')).toBe('one\ntwo\n');
    expect(t.run('rm -rf /')).toContain('dangerous');
    t.run('exit');
    t.run('ssh splunk@idx01');
    expect(t.run('cat /tmp/a.txt')).toBe('one\ntwo\n');
    expect(t.world.hosts.fsOverlay.get('idx01')?.has('/tmp/a.txt')).toBe(true);
  });

  it('supports grep, awk, sort, uniq, cut, head and tail in pipelines', () => {
    const t = testTerm();
    t.run('ssh splunk@dal-app-0001');
    const log = '/opt/splunkforwarder/var/log/splunk/metrics.log';
    const count = Number(t.run(`grep -c group=queue ${log}`));
    expect(count).toBeGreaterThan(0);
    expect(Number(t.run(`grep group=queue ${log} | wc -l`))).toBe(count);
    expect(Number(t.run(`awk '/group=queue/ {n++} END {print n}' ${log}`))).toBe(count);
    expect(t.run(`grep -o 'name=[a-z_]*' ${log} | sort | uniq -c | sort -rn | head -1`)).toMatch(
      /^\s+\d+ name=/,
    );
    expect(t.run(`printf_missing 2>/dev/null; echo $?`)).toBe('127\n');
    expect(t.run(`echo a:b:c | cut -d: -f2,3`)).toBe('b:c\n');
    expect(t.run(String.raw`echo -e '3 x\n1 y' | awk '{s+=$1} END {print s}'`)).toBe('4\n');
    expect(t.run(`tail -1 ${log} | awk '{print $5}'`)).toBe('Metrics\n');
  });

  it('expands globs against the virtual filesystem', () => {
    const t = testTerm();
    t.run('ssh splunk@dal-app-0001');
    t.run('cd /opt/splunkforwarder/etc/system/default');
    expect(t.run('ls *.conf | wc -l').trim()).toBe('6');
    expect(t.run('ls *.nothing')).toContain("cannot access '*.nothing'");
  });

  it('finds files and reports unreadable directories', () => {
    const t = testTerm();
    t.run('ssh splunk@dal-app-0001');
    expect(t.run('find /opt/splunkforwarder/etc/apps -name outputs.conf')).toBe(
      '/opt/splunkforwarder/etc/apps/org_dal_outputs/default/outputs.conf\n',
    );
    expect(t.run('find / -maxdepth 1 -name root 2>&1')).toContain('/root');
  });

  it('answers unknown commands like bash and expands $? per command', () => {
    const t = testTerm();
    expect(t.run('false_cmd 2>/dev/null; echo $?; echo $?')).toBe('127\n0\n');
    expect(t.run('kubectl get pods')).toBe('bash: kubectl: command not found\n');
    expect(t.run('echo $(id)')).toContain('not supported in this sandbox');
  });
});

describe('consistency with the fleet', () => {
  function rowIn(world: ReturnType<typeof createWorld>, cls: string, health: number, start = 0): number {
    const c = world.config.serverClasses.findIndex((x) => x.id === cls);
    for (let r = start; r < world.fleet.size; r++)
      if (world.fleet.serverClass[r] === c && world.fleet.health[r] === health) return r;
    throw new Error('no such row');
  }

  it('an offline forwarder shows splunkd stopped everywhere', () => {
    const world = createWorld({ seed: 'consistency', fleetSize: 6_000 });
    const row = rowIn(world, 'linux_app', HEALTH_CODE.healthy);
    setHealth(world, row, HEALTH_CODE.offline, world.clock.now, new Rng('x'));
    const t = testTerm(world);
    t.run(`ssh splunk@${hostname(world, row)}`);
    expect(t.run('splunk status')).toBe('splunkd is not running.\n');
    expect(t.run('systemctl is-active SplunkForwarder')).toBe('failed\n');
    expect(t.run('ps aux | grep -c "splunkd --under-systemd"')).toBe('0\n');
    expect(t.run('ss -tln | grep -c 8089')).toBe('0\n');
  });

  it('a blocked forwarder logs blocked output and metrics', () => {
    const world = createWorld({ seed: 'consistency', fleetSize: 6_000 });
    const row = rowIn(world, 'linux_web', HEALTH_CODE.healthy);
    setHealth(world, row, HEALTH_CODE.blocked_queue, world.clock.now, new Rng('x'));
    tickWorld(world, 12);
    const t = testTerm(world);
    t.run(`ssh splunk@${hostname(world, row)}`);
    const home = '/opt/splunkforwarder/var/log/splunk';
    expect(
      Number(t.run(`grep -c 'has been blocked for blocked_seconds' ${home}/splunkd.log`)),
    ).toBeGreaterThan(0);
    expect(Number(t.run(`tail -20 ${home}/metrics.log | grep -c blocked=true`))).toBeGreaterThan(0);
  });

  it('a wrong-server-class forwarder has the other class’s inputs app installed', () => {
    const world = createWorld({ seed: 'consistency', fleetSize: 6_000 });
    const row = rowIn(world, 'linux_db', HEALTH_CODE.healthy);
    setHealth(world, row, HEALTH_CODE.wrong_serverclass, world.clock.now, new Rng('x'));
    const assigned = world.config.serverClasses[world.fleet.assignedClass[row]!]!.id;
    const t = testTerm(world);
    t.run(`ssh splunk@${hostname(world, row)}`);
    const apps = t.run('ls -1 /opt/splunkforwarder/etc/apps');
    if (assigned !== 'linux_db') expect(apps).not.toContain('org_linux_db_inputs');
    expect(
      t.run('grep -h "Installing app" /opt/splunkforwarder/var/log/splunk/splunkd.log | wc -l').trim(),
    ).toBe('1');
  });

  it('generated files and logs are identical for the same seed', () => {
    const read = () => {
      const t = testTerm(createWorld({ seed: 'determinism', fleetSize: 3_000 }));
      t.run('ssh splunk@idx01');
      return t.run(
        'cat /opt/splunk/var/log/splunk/splunkd.log /opt/splunk/var/log/splunk/metrics.log /opt/splunk/etc/system/local/server.conf',
      );
    };
    const a = read();
    expect(a.length).toBeGreaterThan(1000);
    expect(read()).toBe(a);
  });
});

describe('interactive programs', () => {
  it('tail -f prints new log lines on each tick, filtered through grep, until Ctrl-C', () => {
    const t = testTerm();
    t.run('ssh splunk@idx01');
    t.send('tail -f -n 0 /opt/splunk/var/log/splunk/metrics.log | grep indexqueue\r');
    const out = (() => {
      let s = '';
      t.session.onOutput((d) => (s += d));
      tickWorld(t.world, 6);
      t.session.tick();
      return s;
    })();
    const lines = stripAnsi(out).trim().split('\r\n');
    expect(lines.length).toBe(2);
    for (const l of lines) expect(l).toContain('name=indexqueue');
    expect(t.send('\x03')).toContain('[splunk@idx01 ~]$');
  });

  it('vi edits and saves; the change survives logging out', () => {
    const t = testTerm();
    t.run('ssh splunk@ds01');
    t.send('vi /tmp/note.txt\r');
    t.send('ihello\x1b');
    t.send(':wq\r');
    expect(t.run('cat /tmp/note.txt')).toBe('hello\n');
    t.run('exit');
    t.run('ssh splunk@ds01');
    t.send('vi /tmp/note.txt\r');
    t.send('A world\x1b');
    t.send(':x\r');
    expect(t.run('cat /tmp/note.txt')).toBe('hello world\n');
  });

  it('vi refuses to save files the user cannot write', () => {
    const t = testTerm();
    t.run('ssh splunk@ds01');
    t.send('vi /etc/hosts\r');
    t.send('dd');
    expect(t.send(':wq\r')).toContain("E45: 'readonly' option is set");
    expect(t.send(':wq!\r')).toContain("E212: Can't open file for writing");
    t.send(':q!\r');
    expect(t.run('grep -c localhost /etc/hosts')).toBe('2\n');
  });

  it('nano writes on ^X then Y', () => {
    const t = testTerm();
    t.run('ssh splunk@ds01');
    t.send('nano /tmp/n.txt\r');
    t.send('line one\rline two');
    t.send('\x18');
    t.send('y');
    expect(t.run('cat /tmp/n.txt')).toBe('line one\nline two\n');
  });

  it('less pages and quits back to the prompt', () => {
    const t = testTerm(undefined, { cols: 80, rows: 10 });
    t.run('ssh splunk@idx01');
    const first = t.send('less /opt/splunk/etc/system/default/props.conf\r');
    expect(first).toContain('props.conf');
    expect(t.send('G')).toContain('(END)');
    expect(t.send('q')).toContain('[splunk@idx01 ~]$');
  });

  it('ping without -c streams replies until Ctrl-C', () => {
    const t = testTerm();
    t.send('ping idx01\r');
    t.fireTimers();
    t.fireTimers();
    expect(t.send('\x03')).toMatch(/3 packets transmitted, 3 received, 0% packet loss/);
  });
});

describe('line editor', () => {
  it('recalls history with the up arrow and completes paths with tab', () => {
    const t = testTerm();
    t.run('echo first');
    t.send('\x1b[A');
    expect(t.send('\r')).toContain('first');
    t.run('ssh splunk@idx01');
    t.send('ls /opt/spl');
    expect(t.send('\t')).toContain('ls /opt/splunk/');
    t.send('\x03');
    expect(t.run('history | tail -1')).toMatch(/history \| tail -1/);
  });
});

describe('safety (CLAUDE.md rule 1)', () => {
  it('no simulator or server source can start real processes or evaluate code', () => {
    const roots = [join(__dirname, '../src'), join(__dirname, '../../../apps/server/src')];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.ts')) {
          const src = readFileSync(p, 'utf8');
          // `eval(` right after a quote is SPL text inside a string, not JavaScript's eval.
          if (/child_process|(?<![\w.'"`])eval\s*\(|new Function\s*\(|\bexecSync\b|\bspawn\s*\(/.test(src))
            offenders.push(p);
        }
      }
    };
    roots.forEach(walk);
    expect(offenders).toEqual([]);
  });
});
