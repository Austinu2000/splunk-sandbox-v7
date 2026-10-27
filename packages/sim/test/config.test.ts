import { describe, expect, it } from 'vitest';
import { createWorld, listHosts, summarizeFleet, tickWorld, type World } from '../src';
import { checkConfs } from '../src/conf/check';
import { formatBtool, loadConf, mergeConf, type ConfReader } from '../src/conf/merge';
import { parseConf } from '../src/conf/parse';
import { testTerm } from './helpers';

/** In-memory ConfReader over a path → content map. */
function memReader(files: Record<string, string>): ConfReader {
  return {
    read: (p) => files[p] ?? null,
    list: (dir) => {
      const names = new Set<string>();
      for (const p of Object.keys(files))
        if (p.startsWith(dir + '/')) names.add(p.slice(dir.length + 1).split('/')[0]!);
      return names.size ? [...names] : null;
    },
  };
}

/** Writes a file on a host as root, through the same overlay the shell uses. */
function edit(world: World, host: string, path: string, transform: (s: string) => string) {
  const t = testTerm(world);
  t.run(`ssh splunk@${host}`);
  const current = t.run(`sudo cat ${path} 2>/dev/null`);
  // Feed the new content through a heredoc-free path: echo -e with escaped newlines.
  const next = transform(current).replace(/\\/g, '\\\\').replace(/'/g, "'\\''").replace(/\n/g, '\\n');
  t.run(`echo -ne '${next}' > /tmp/new.conf && sudo cp /tmp/new.conf ${path}`);
  return t;
}

const settle = (world: World) => tickWorld(world, 12); // two phone-home intervals: the whole fleet has checked in

describe('conf parser', () => {
  it('handles comments, continuation, implicit default, repeated stanzas and bad lines', () => {
    const p = parseConf(
      'top = 1\n# comment\n[a]\nx = 1\n  y=two words  \n[b]\nlong = one \\\ntwo\n[a]\nx = 3\nnot a setting\n',
    );
    expect(p.stanzas.get('default')!.settings.get('top')!.value).toBe('1');
    expect(p.stanzas.get('a')!.settings.get('x')!.value).toBe('3');
    expect(p.stanzas.get('a')!.settings.get('y')!.value).toBe('two words');
    expect(p.stanzas.get('b')!.settings.get('long')!.value).toBe('one \ntwo');
    expect(p.errors).toEqual([{ line: 11, text: 'not a setting' }]); // the continuation spans lines 7-8
  });
});

describe('precedence and btool', () => {
  const H = '/opt/splunk';
  const files = {
    [`${H}/etc/system/default/inputs.conf`]:
      '[default]\nhost = $decideOnStartup\nindex = default\n[monitor:///x]\nindex = sysdefault\n',
    [`${H}/etc/apps/Bapp/default/inputs.conf`]: '[monitor:///x]\nindex = Bdefault\nsourcetype = b\n',
    [`${H}/etc/apps/aapp/local/inputs.conf`]: '[monitor:///x]\nsourcetype = alocal\n',
    [`${H}/etc/apps/Aapp/local/inputs.conf`]: '[monitor:///x]\nsourcetype = Alocal\n',
    [`${H}/etc/system/local/inputs.conf`]: '[default]\nhost = sh01\n',
  };

  it('applies global-context precedence with ASCII app order and [default] inheritance', () => {
    const r = memReader(files);
    const m = loadConf(r, H, 'inputs');
    const st = m.stanzas.get('monitor:///x')!;
    // system/local > app local (Aapp before aapp, uppercase first) > app default > system default
    expect(st.settings.get('sourcetype')!.value).toBe('Alocal');
    expect(st.settings.get('index')!.value).toBe('Bdefault');
    expect(st.settings.get('host')!.value).toBe('sh01');
    expect(st.settings.get('host')!.path).toBe(`${H}/etc/system/local/inputs.conf`);
  });

  it('gives cluster peer-apps the highest precedence', () => {
    const r = memReader({
      ...files,
      [`${H}/etc/peer-apps/_cluster/local/inputs.conf`]: '[monitor:///x]\nsourcetype = peer\n',
    });
    expect(loadConf(r, H, 'inputs').stanzas.get('monitor:///x')!.settings.get('sourcetype')!.value).toBe(
      'peer',
    );
  });

  it('formats btool --debug with the source of every line, padded to the longest path', () => {
    const r = memReader(files);
    const out = formatBtool(
      mergeConf('inputs', r, [
        { path: `${H}/etc/apps/Aapp/local/inputs.conf` },
        { path: `${H}/etc/system/default/inputs.conf` },
      ]),
      {
        debug: true,
        stanza: 'monitor:///x',
      },
    );
    const lines = out.trimEnd().split('\n');
    expect(lines[0]).toMatch(/^\/opt\/splunk\/etc\/apps\/Aapp\/local\/inputs\.conf\s+\[monitor:\/\/\/x\]$/);
    const col = lines[0]!.indexOf('[');
    for (const l of lines) {
      expect(l[col - 1]).toBe(' ');
      expect(l.slice(0, col).trim()).toMatch(/^\/opt\/splunk\/etc\/.*inputs\.conf$/);
    }
    expect(out).toContain('sourcetype = Alocal');
  });

  it('btool check reports unknown keys with file and line', () => {
    const r = memReader({
      [`${H}/etc/system/local/outputs.conf`]: '[tcpout:x]\nserver = a:9997\nsever = b:9997\n',
    });
    expect(checkConfs(r, H)).toEqual([
      {
        path: `${H}/etc/system/local/outputs.conf`,
        line: 3,
        stanza: 'tcpout:x',
        key: 'sever',
        value: 'b:9997',
      },
    ]);
  });
});

describe('splunk CLI on a host', () => {
  it('btool sees edits on disk immediately; the running config only after restart', () => {
    const world = createWorld({ seed: 'cli', fleetSize: 4_000 });
    const t = edit(
      world,
      'dal-app-0001',
      '/opt/splunkforwarder/etc/system/local/inputs.conf',
      (s) => s + '\n[monitor:///var/log/extra.log]\nindex = os\n',
    );
    expect(t.run('splunk btool inputs list monitor:///var/log/extra.log')).toContain('index = os');
    expect(t.run('splunk list monitor')).not.toContain('/var/log/extra.log');
    const restart = t.run('splunk restart');
    expect(restart).toContain('Stopping splunkd...');
    expect(restart).toContain('All preliminary checks passed.');
    expect(t.run('splunk list monitor')).toContain('/var/log/extra.log');
  });

  it('restart reports conf typos found while checking conf files', () => {
    const world = createWorld({ seed: 'cli', fleetSize: 4_000 });
    const t = edit(
      world,
      'dal-app-0001',
      '/opt/splunkforwarder/etc/system/local/outputs.conf',
      () => '[tcpout]\ndefaultGrup = dal_indexers\n',
    );
    expect(t.run('splunk btool check')).toMatch(
      /Invalid key in stanza \[tcpout\] in \/opt\/splunkforwarder\/etc\/system\/local\/outputs\.conf, line 2: defaultGrup/,
    );
    expect(t.run('splunk restart')).toContain('Invalid key in stanza [tcpout]');
  });

  it('stop/start change status, processes, the fleet view and the logs together', () => {
    const world = createWorld({ seed: 'cli', fleetSize: 4_000 });
    const t = testTerm(world);
    t.run('ssh splunk@dal-app-0001');
    expect(t.run('splunk stop')).toContain('Stopping splunkd');
    expect(t.run('splunk status')).toBe('splunkd is not running.\n');
    expect(t.run('ps aux | grep -c "splunkd --under"')).toBe('0\n');
    expect(listHosts(world, { q: 'dal-app-0001' }).rows[0]!.health).toBe('offline');
    tickWorld(world, 30);
    expect(listHosts(world, { q: 'dal-app-0001' }).rows[0]!.health).toBe('offline');
    t.run('splunk start');
    expect(listHosts(world, { q: 'dal-app-0001' }).rows[0]!.health).toBe('healthy');
    expect(t.run('grep -c "Shutting down splunkd" /opt/splunkforwarder/var/log/splunk/splunkd.log')).toBe(
      '1\n',
    );
    expect(t.run('grep -c "Splunkd starting" /opt/splunkforwarder/var/log/splunk/splunkd.log')).toBe('1\n');
  });

  it('systemctl needs root and drives the same service', () => {
    const world = createWorld({ seed: 'cli', fleetSize: 4_000 });
    const t = testTerm(world);
    t.run('ssh splunk@idx01');
    expect(t.run('systemctl stop Splunkd')).toContain('Interactive authentication required');
    t.run('sudo systemctl stop Splunkd');
    expect(t.run('splunk status')).toBe('splunkd is not running.\n');
    expect(world.infra.find((n) => n.hostname === 'idx01')!.status).toBe('down');
    t.run('sudo systemctl start Splunkd');
    expect(t.run('systemctl is-active Splunkd')).toBe('active\n');
  });

  it('list forward-server and show deploy-poll report the running config', () => {
    const world = createWorld({ seed: 'cli', fleetSize: 4_000 });
    const t = testTerm(world);
    t.run('ssh splunk@dal-app-0001');
    expect(t.run('splunk list forward-server')).toBe(
      'Active forwards:\n\tidx01.corp.example:9997\n\tidx02.corp.example:9997\nConfigured but inactive forwards:\n\tNone\n',
    );
    expect(t.run('splunk show deploy-poll')).toBe(
      'Deployment Server URI is set to "ds01.corp.example:8089".\n',
    );
  });
});

describe('config drives the fleet', () => {
  it('a serverclass whitelist typo only matters after reload deploy-server, then rolls across the class', () => {
    const world = createWorld({ seed: 'deploy', fleetSize: 8_000 });
    const scope = { site: 'dal', serverClass: 'linux_web' };
    const total = summarizeFleet(world, scope).total;
    const t = edit(world, 'ds01', '/opt/splunk/etc/system/local/serverclass.conf', (s) =>
      s.replace('dal-web-*', 'dal-wbe-*'),
    );
    expect(t.run('splunk btool serverclass list serverClass:linux_web')).toContain('whitelist.0 = dal-wbe-*');
    settle(world);
    expect(summarizeFleet(world, scope).byHealth.wrong_serverclass).toBe(0);

    expect(t.run('splunk reload deploy-server')).toBe('Reloading serverclass(es).\n\n');
    settle(world);
    expect(summarizeFleet(world, scope).byHealth.wrong_serverclass).toBe(total);
    expect(listHosts(world, scope, { limit: 1 }).rows[0]!.assignedServerClass).toBe('(none)');
    expect(t.run('grep -c "serverClass=linux_web matches" /opt/splunk/var/log/splunk/splunkd.log')).toBe(
      '1\n',
    );

    // The forwarder itself lost the app and logged it.
    const fwd = testTerm(world);
    fwd.run('ssh splunk@dal-web-0001');
    expect(fwd.run('ls /opt/splunkforwarder/etc/apps')).not.toContain('org_linux_web_inputs');
    expect(
      fwd.run('grep -c "Removing app=org_linux_web_inputs" /opt/splunkforwarder/var/log/splunk/splunkd.log'),
    ).toBe('1\n');

    // Other sites and classes are untouched.
    expect(
      summarizeFleet(world, { site: 'ash', serverClass: 'linux_web' }).byHealth.wrong_serverclass,
    ).toBeLessThan(5);

    edit(world, 'ds01', '/opt/splunk/etc/system/local/serverclass.conf', (s) =>
      s.replace('dal-wbe-*', 'dal-web-*'),
    );
    t.run('splunk reload deploy-server');
    settle(world);
    expect(summarizeFleet(world, scope).byHealth.wrong_serverclass).toBeLessThan(3);
  });

  it('changing a deployed outputs app on the DS reaches the forwarders after reload', () => {
    const world = createWorld({ seed: 'deploy', fleetSize: 8_000 });
    const app = '/opt/splunk/etc/deployment-apps/org_ash_outputs/default/outputs.conf';
    const t = edit(world, 'ds01', app, (s) => s.replace(/server = .*/, 'server = idx99.corp.example:9997'));
    t.run('splunk reload deploy-server');
    settle(world);
    const ash = summarizeFleet(world, { site: 'ash' });
    const relays = summarizeFleet(world, { site: 'ash', serverClass: 'syslog_relay' }).total;
    expect(ash.byHealth.blocked_queue).toBe(ash.total - relays);

    const fwd = testTerm(world);
    fwd.run('ssh splunk@ash-app-0001');
    expect(fwd.run('grep server /opt/splunkforwarder/etc/apps/org_ash_outputs/default/outputs.conf')).toBe(
      'server = idx99.corp.example:9997\n',
    );
    expect(fwd.run('splunk list forward-server')).toContain(
      'Configured but inactive forwards:\n\tidx99.corp.example:9997',
    );
    expect(
      fwd.run(
        'grep -c "Unable to resolve host=\'idx99.corp.example\'" /opt/splunkforwarder/var/log/splunk/splunkd.log',
      ),
    ).not.toBe('0\n');
    expect(listHosts(world, { q: 'ash-app-0001' }).rows[0]!.outputGroup).toBe('ash_indexers');

    edit(world, 'ds01', app, (s) =>
      s.replace(/server = .*/, 'server = idx03.corp.example:9997, idx04.corp.example:9997'),
    );
    t.run('splunk reload deploy-server');
    settle(world);
    expect(summarizeFleet(world, { site: 'ash' }).byHealth.blocked_queue).toBeLessThan(20);
  });

  it('stopping both indexers of a site blocks its forwarders until one comes back', () => {
    const world = createWorld({ seed: 'idx', fleetSize: 8_000 });
    const t = testTerm(world);
    for (const idx of ['idx01', 'idx02']) {
      t.run(`ssh splunk@${idx}`);
      t.run('splunk stop');
      t.run('exit');
    }
    settle(world);
    const dal = summarizeFleet(world, { site: 'dal' });
    const relays = summarizeFleet(world, { site: 'dal', serverClass: 'syslog_relay' }).total;
    expect(dal.byHealth.blocked_queue).toBe(dal.total - relays);
    expect(summarizeFleet(world, { site: 'ash' }).byHealth.blocked_queue).toBeLessThan(20);

    t.run('ssh splunk@idx02');
    t.run('splunk start');
    settle(world);
    expect(summarizeFleet(world, { site: 'dal' }).byHealth.blocked_queue).toBeLessThan(20);
  });

  it('disabling the receiving port on one indexer takes effect on restart and is survivable', () => {
    const world = createWorld({ seed: 'idx', fleetSize: 8_000 });
    const t = edit(world, 'idx01', '/opt/splunk/etc/system/local/inputs.conf', (s) =>
      s.replace('[splunktcp://9997]\ndisabled = 0', '[splunktcp://9997]\ndisabled = 1'),
    );
    expect(t.run('ss -tln | grep -c :9997')).toBe('1\n');
    t.run('splunk restart');
    expect(t.run('ss -tln | grep -c :9997')).toBe('0\n');
    t.run('exit');
    expect(t.run('nc -z idx01 9997 2>&1')).toContain('Connection refused');
    settle(world);
    expect(summarizeFleet(world, { site: 'dal' }).byHealth.blocked_queue).toBeLessThan(20);
    t.run('ssh splunk@dal-app-0001');
    expect(t.run('splunk list forward-server')).toContain(
      'Configured but inactive forwards:\n\tidx01.corp.example:9997',
    );
  });

  it('a local outputs edit on one forwarder affects only that forwarder, and only after restart', () => {
    const world = createWorld({ seed: 'local', fleetSize: 8_000 });
    const t = edit(
      world,
      'dal-app-0001',
      '/opt/splunkforwarder/etc/system/local/outputs.conf',
      () => '[tcpout:dal_indexers]\nserver = idx-old01.corp.example:9997\n',
    );
    settle(world);
    expect(listHosts(world, { q: 'dal-app-0001' }).rows[0]!.health).not.toBe('blocked_queue');
    t.run('splunk restart');
    expect(listHosts(world, { q: 'dal-app-0001' }).rows[0]!.health).toBe('blocked_queue');
    settle(world);
    expect(summarizeFleet(world, { site: 'dal' }).byHealth.blocked_queue).toBeLessThan(20);
    expect(t.run('ss -tan | grep -c SYN-SENT')).toBe('0\n'); // unresolvable: nothing to connect to
    expect(
      t.run(
        'grep -c "Unable to resolve host=\'idx-old01.corp.example\'" /opt/splunkforwarder/var/log/splunk/splunkd.log',
      ),
    ).not.toBe('0\n');
  });

  it('summary counts still equal host lists after config-driven changes', () => {
    const world = createWorld({ seed: 'consistent', fleetSize: 6_000 });
    const t = edit(world, 'ds01', '/opt/splunk/etc/system/local/serverclass.conf', (s) =>
      s.replace('fra-app-*', 'fra-ap-*'),
    );
    t.run('splunk reload deploy-server');
    settle(world);
    const s = summarizeFleet(world);
    for (const health of ['wrong_serverclass', 'blocked_queue', 'healthy'] as const)
      expect(listHosts(world, { health }).total).toBe(s.byHealth[health]);
    expect(summarizeFleet(world, {}, { forceScan: true })).toEqual(s);
  });

  it('the same seed and the same actions give the same world', () => {
    const run = () => {
      const world = createWorld({ seed: 'replay', fleetSize: 5_000 });
      const t = edit(world, 'ds01', '/opt/splunk/etc/system/local/serverclass.conf', (s) =>
        s.replace('ash-db-*', 'ash-bd-*'),
      );
      t.run('splunk reload deploy-server');
      tickWorld(world, 20);
      t.run('exit');
      t.run('ssh splunk@idx05');
      t.run('splunk stop');
      tickWorld(world, 20);
      return [Array.from(world.fleet.health).join(''), Array.from(world.fleet.assignedClass).join(',')].join(
        '|',
      );
    };
    expect(run()).toBe(run());
  });
});
