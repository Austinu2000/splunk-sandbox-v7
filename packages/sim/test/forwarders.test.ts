import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  enableForwarderOperations,
  trackForwarder,
  setForwarderFixture,
  forwarderDetail,
  resolveHost,
  reloadDeployServer,
  runningConf,
  restartSplunk,
  tickWorld,
  saveWorld,
  loadWorld,
} from '../src';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
import { testTerm } from './helpers';
const fresh = () =>
  createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
const name = 'lab-lnx-0001',
  home = '/opt/splunkforwarder',
  stanza = 'monitor:///var/log/practice/deployment.log';
function publish(w: ReturnType<typeof fresh>, restart = false) {
  const ds = resolveHost(w, 'ds01')!,
    fs = hostFs(w, ds),
    path = '/opt/splunk/etc/deployment-apps/v7_test/local/inputs.conf';
  fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, { parents: true });
  fs.writeFile(path, '[' + stanza + ']\nindex = os\nsourcetype = v7_delivery\ndisabled = false\n', ROOT);
  const sc = '/opt/splunk/etc/system/local/serverclass.conf';
  fs.writeFile(sc, patchConf(fs.readFile(sc, ROOT), 'serverClass:v7_canary', { 'whitelist.0': name }), ROOT);
  fs.writeFile(
    sc,
    patchConf(fs.readFile(sc, ROOT), 'serverClass:v7_canary:app:v7_test', {
      restartSplunkd: String(restart),
    }),
    ROOT,
  );
  reloadDeployServer(w, ds);
}
describe('versioned forwarder operations', () => {
  it('rejects an oversized catalog before stopping a healthy Deployment Server', () => {
    const w = fresh();
    enableForwarderOperations(w);
    const ds = resolveHost(w, 'ds01')!, fs = hostFs(w, ds);
    const path = '/opt/splunk/etc/deployment-apps/v7_oversized/local/inputs.conf';
    fs.mkdir(path.slice(0, path.lastIndexOf('/')), ROOT, {parents: true});
    fs.writeFile(path, 'x'.repeat(2000001), ROOT);
    expect(() => restartSplunk(w, ds)).toThrow('catalog limit');
    expect(w.hosts.services.get(ds.hostname)?.running).not.toBe(false);
    expect(w.forwarders!.catalogs).toHaveLength(1);
  });
  it('installs only a verified teaching package, gates start and preserves identity/configuration on upgrade', () => {
    const w = fresh();
    setForwarderFixture(w, name, {
      installed: false,
      licenseAccepted: false,
      bootStart: false,
      version: '9.3.2',
    });
    const t = testTerm(w);
    t.run('ssh splunk@' + name);
    expect(t.run('rpm -q splunkforwarder')).toContain('not installed');
    expect(t.run('rpm -ivh /opt/staging/splunkforwarder-9.3.2-simulated.x86_64.rpm')).toContain('root');
    expect(t.run('sudo rpm -ivh /opt/staging/splunkforwarder-9.3.2-simulated.x86_64.rpm')).toContain(
      'installed',
    );
    expect(t.run(home + '/bin/splunk version')).toContain('9.3.2');
    expect(t.run(home + '/bin/splunk start')).toContain('accept');
    expect(t.run(home + '/bin/splunk start --accept-license --answer-yes --no-prompt')).toContain('Starting');
    expect(t.run('sudo ' + home + '/bin/splunk enable boot-start -user splunk')).toContain('enabled');
    expect(forwarderDetail(w, name)).toMatchObject({
      installed: true,
      version: '9.3.2',
      running: true,
      bootStart: true,
    });
    const p = resolveHost(w, name)!,
      fs = hostFs(w, p);
    fs.writeFile(home + '/etc/system/local/inputs.conf', '[monitor:///var/log/custom]\nindex=os\n', ROOT);
    const guid = fs.readFile(home + '/etc/instance.cfg', ROOT);
    expect(t.run('sudo rpm -Uvh /opt/staging/splunkforwarder-9.4.1-simulated.x86_64.rpm')).toContain('Stop');
    t.run(home + '/bin/splunk stop');
    expect(t.run('sudo rpm -Uvh /opt/staging/splunkforwarder-9.4.1-simulated.x86_64.rpm')).toContain(
      'installed',
    );
    t.run(home + '/bin/splunk start --accept-license --answer-yes --no-prompt');
    expect(forwarderDetail(w, name).version).toBe('9.4.1');
    expect(hostFs(w, p).readFile(home + '/etc/instance.cfg', ROOT)).toBe(guid);
    expect(hostFs(w, p).readFile(home + '/etc/system/local/inputs.conf', ROOT)).toContain('/var/log/custom');
    const loaded = loadWorld(saveWorld(w), []);
    expect(forwarderDetail(loaded, name)).toEqual(forwarderDetail(w, name));
    t.session.dispose();
  });
  it('requires reload, successful phone-home and separate activation when restartSplunkd=false', () => {
    const w = fresh();
    enableForwarderOperations(w);
    trackForwarder(w, name);
    const p = resolveHost(w, name)!;
    publish(w);
    expect(w.forwarders!.catalogs).toHaveLength(2);
    expect(hostFs(w, p).exists(home + '/etc/apps/v7_test/local/inputs.conf')).toBe(false);
    tickWorld(w, 7);
    expect(hostFs(w, p).readFile(home + '/etc/apps/v7_test/local/inputs.conf', ROOT)).toContain(
      'v7_delivery',
    );
    expect(runningConf(w, p, 'inputs').stanzas.has(stanza)).toBe(false);
    restartSplunk(w, p);
    expect(runningConf(w, p, 'inputs').stanzas.has(stanza)).toBe(true);
    expect(loadWorld(saveWorld(w), []).forwarders).toEqual(w.forwarders);
  });
  it('activates restart-enabled apps only after phone-home, and reports a broken deployment target', () => {
    const w = fresh();
    enableForwarderOperations(w);
    trackForwarder(w, name);
    const p = resolveHost(w, name)!;
    publish(w, true);
    expect(runningConf(w, p, 'inputs').stanzas.has(stanza)).toBe(false);
    tickWorld(w, 7);
    expect(runningConf(w, p, 'inputs').stanzas.has(stanza)).toBe(true);
    const before = forwarderDetail(w, name).lastPhoneHome;
    hostFs(w, p).writeFile(
      home + '/etc/system/local/deploymentclient.conf',
      patchConf('', 'target-broker:deploymentServer', { targetUri: 'missing-host:8089' }),
      ROOT,
    );
    restartSplunk(w, p);
    tickWorld(w, 7);
    expect(forwarderDetail(w, name).error).toContain('targetUri');
    expect(forwarderDetail(w, name).lastPhoneHome).toBe(before);
  });
  it('keeps global deployment packages shared for a large fleet', () => {
    const profile = parseProfile(
      readFileSync(new URL('../../../profiles/erie.yaml', import.meta.url), 'utf8'),
    );
    const w = createWorld({ ...profileWorldConfig(profile), fleetSize: 35000 });
    enableForwarderOperations(w);
    expect(Object.keys(w.forwarders!.clients)).toHaveLength(0);
    expect(w.forwarders!.catalogs).toHaveLength(1);
    expect(JSON.stringify(w.forwarders).length).toBeLessThan(100000);
  });
});

describe('data-transport relationships', () => {
  it('checks configured certificate trust, expiry and peer name against explicit teaching artifacts', async () => {
    const { forwarderConnection, teachingCA, teachingCertificate } = await import('../src');
    const w = fresh();
    trackForwarder(w, name);
    const p = resolveHost(w, name)!,
      idx = resolveHost(w, 'idx01')!,
      fs = hostFs(w, p),
      rx = hostFs(w, idx);
    fs.mkdir(home + '/etc/auth/v7', ROOT, { parents: true });
    fs.writeFile(home + '/etc/auth/v7/ca.pem', teachingCA(), ROOT);
    fs.writeFile(
      home + '/etc/system/local/outputs.conf',
      '[tcpout]\ndefaultGroup=v7_tls\n[tcpout:v7_tls]\nserver=idx01.corp.example:9998\nuseSSL=true\nsslVerifyServerCert=true\nsslRootCAPath=' +
        home +
        '/etc/auth/v7/ca.pem\nsslCommonNameToCheck=idx01.corp.example\nsslVersions=tls1.2\n',
      ROOT,
    );
    rx.mkdir('/opt/splunk/etc/auth/v7', ROOT, { parents: true });
    rx.writeFile('/opt/splunk/etc/auth/v7/server.pem', teachingCertificate('wrong-peer.corp.example'), ROOT);
    rx.writeFile(
      '/opt/splunk/etc/system/local/inputs.conf',
      '[splunktcp-ssl://9998]\ndisabled=false\n[SSL]\nserverCert=/opt/splunk/etc/auth/v7/server.pem\nsslVersions=tls1.2\n',
      ROOT,
    );
    restartSplunk(w, idx);
    restartSplunk(w, p);
    expect(forwarderConnection(w, p, 'idx01.corp.example:9998').error).toContain('peer name');
    rx.writeFile(
      '/opt/splunk/etc/auth/v7/server.pem',
      teachingCertificate('idx01.corp.example', 'training-ca', w.clock.now - 1),
      ROOT,
    );
    restartSplunk(w, idx);
    expect(forwarderConnection(w, p, 'idx01.corp.example:9998').error).toContain('expired');
    rx.writeFile('/opt/splunk/etc/auth/v7/server.pem', teachingCertificate('idx01.corp.example'), ROOT);
    restartSplunk(w, idx);
    expect(forwarderConnection(w, p, 'idx01.corp.example:9998')).toMatchObject({
      reachable: true,
      error: '',
    });
    fs.writeFile(home + '/etc/auth/v7/ca.pem', teachingCA('wrong-ca'), ROOT);
    restartSplunk(w, p);
    expect(forwarderConnection(w, p, 'idx01.corp.example:9998').error).toContain('issuer');
  });
  it('collects only explicitly queued Windows events through an enabled channel and EventID filters', () => {
    const w = fresh();
    enableForwarderOperations(w);
    const p = resolveHost(w, 'lab-win-0002')!,
      fs = hostFs(w, p);
    trackForwarder(w, p.hostname);
    const path = '/__teaching__/WinEventLog/Security.xml';
    fs.mkdir('/__teaching__/WinEventLog', ROOT, { parents: true });
    fs.writeFile(
      path,
      [4624, 4625, 4662]
        .map((id) => '<Event><EventID>' + id + '</EventID><Data>v7-win-' + id + '</Data></Event>')
        .join('\n') + '\n',
      ROOT,
    );
    const conf = p.splunk!.home + '/etc/system/local/inputs.conf';
    fs.writeFile(
      conf,
      '[WinEventLog://Security]\nindex=wineventlog\nsourcetype=v7_windows\ndisabled=true\nblacklist=4662,5156\n',
      ROOT,
    );
    restartSplunk(w, p);
    tickWorld(w);
    expect(w.ingestion?.events.filter((e) => e.host === p.hostname)??[]).toHaveLength(0);
    fs.writeFile(conf, fs.readFile(conf, ROOT).replace('disabled=true', 'disabled=false'), ROOT);
    restartSplunk(w, p);
    tickWorld(w);
    const events = w.ingestion?.events.filter((e) => e.host === p.hostname);
    expect(events).toHaveLength(2);
    expect(
      events?.every(
        (e) =>
          e.index === 'wineventlog' && e.sourcetype === 'v7_windows' && e.source === 'WinEventLog:Security',
      ),
    ).toBe(true);
    tickWorld(w);
    expect(w.ingestion?.events.filter((e) => e.host === p.hostname)).toHaveLength(2);
    expect(loadWorld(saveWorld(w), []).ingestion?.events).toEqual(w.ingestion?.events);
  });
});
