import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  configureHec,
  receiveHec,
  saveWorld,
  loadWorld,
  runSearch,
  TerminalSession,
  stripAnsi,
  restartSplunk,
  resolveHost,
} from '../src/index';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
const fresh = () =>
  createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
describe('HEC operational input', () => {
  it('uses one effective token configuration for Web service, btool, curl and indexed search', () => {
    const w = fresh(),
      input = configureHec(w, 'idx01', 'checkout', { index: 'os', sourcetype: 'checkout' });
    let output = '';
    const term = new TerminalSession({ world: w });
    term.onOutput((s) => (output += s));
    term.start();
    term.input('ssh splunk@idx01\r');
    output = '';
    term.input('splunk btool inputs list --debug\r');
    expect(stripAnsi(output)).toContain(input.token);
    term.input(
      `curl -k -H 'Authorization: Splunk ${input.token}' https://localhost:8088/services/collector/event -d '{"event":{"status":500,"service":"checkout"},"source":"hec-test"}'\r`,
    );
    expect(stripAnsi(output)).toContain('Success');
    term.dispose();
    expect(runSearch(w, { search: 'index=os source=hec-test | stats count' }).results[0]!.get('count')).toBe(
      1,
    );
    const loaded = loadWorld(saveWorld(w), []);
    expect(loaded.ingestion?.events).toEqual(w.ingestion?.events);
    expect(
      runSearch(loaded, {
        search: '| metadata type=sources index=os | search source=hec-test',
      }).results[0]!.get('totalCount'),
    ).toBe(1);
  });
  it('rejects invalid token, denied index, disabled input and metadata overrides atomically', () => {
    const w = fresh(),
      input = configureHec(w, 'idx01', 'checkout', { index: 'os', sourcetype: 'checkout' });
    const url = 'https://idx01:8088/services/collector/event',
      auth = 'Splunk ' + input.token,
      before = saveWorld(w);
    for (const [token, payload] of [
      ['bad', { event: 'no' }],
      [auth, { event: 'no', index: 'wineventlog' }],
      [auth, { event: 'no', fields: { index: 'spoofed' } }],
      [auth, { event: 'no', time: 'bad' }],
    ] as const)
      expect(() => receiveHec(w, 'idx01', url, token, payload)).toThrow();
    expect(saveWorld(w)).toEqual(before);
    expect(w.ingestion).toBeUndefined();
    configureHec(w, 'idx01', 'checkout', { index: 'os', sourcetype: 'checkout', disabled: true });
    expect(() => receiveHec(w, 'idx01', url, auth, { event: 'no' })).toThrow(/disabled/);
  });
  it('raw configuration remains staged until restart, and explicit envelope time wins', () => {
    const w = fresh(),
      input = configureHec(w, 'idx01', 'checkout', { index: 'os', sourcetype: 'checkout' }),
      host = resolveHost(w, 'idx01')!,
      fs = hostFs(w, host),
      file = '/opt/splunk/etc/apps/splunk_httpinput/local/inputs.conf';
    fs.writeFile(file, patchConf(fs.readFile(file, ROOT), 'http', { disabled: '1' }), ROOT);
    receiveHec(w, 'idx01', 'https://idx01:8088/services/collector/event', 'Splunk ' + input.token, {
      event: 'status=201',
      time: w.clock.now / 1000 - 15,
    });
    expect(w.ingestion!.events[0]!.time).toBe(w.clock.now - 15000);
    restartSplunk(w, host);
    expect(() =>
      receiveHec(w, 'idx01', 'https://idx01:8088/services/collector/event', 'Splunk ' + input.token, {
        event: 'no',
      }),
    ).toThrow(/globally disabled/);
  });
});
