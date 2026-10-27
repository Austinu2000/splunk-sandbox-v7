import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { configureScenarios, createWorld, parseScenario, runSearch, startScenario, tickWorld } from '../src';
import { hostFs } from '../src/vfs/build';
import { resolveHost } from '../src/hosts/profile';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
import { licenseStatus } from '../src/ingest/license';
import { projectedSkips } from '../src/scheduler';
import { forwarderInputs } from '../src/hosts/inputs';
import { testTerm } from './helpers';

const dir = new URL('../../../scenarios/', import.meta.url);
const definitions = readdirSync(dir)
  .filter((n) => n.endsWith('.yaml'))
  .sort()
  .map((n) => parseScenario(readFileSync(new URL(n, dir), 'utf8')));
function setup() {
  const w = createWorld({ seed: 'incidents', fleetSize: 3000 });
  configureScenarios(w, definitions);
  return w;
}
type W = ReturnType<typeof setup>;
function edit(
  w: W,
  host: string,
  path: string,
  stanza: string,
  values: Record<string, string>,
  unset: string[] = [],
) {
  const fs = hostFs(w, resolveHost(w, host)!);
  fs.writeFile(
    path,
    patchConf(fs.findNode(path) ? fs.readFile(path, ROOT) : '', stanza, values, unset),
    ROOT,
  );
}

const DEBUG_INPUTS = '/opt/splunk/etc/deployment-apps/org_linux_app_inputs/local/inputs.conf';
const MANAGER_PROPS = '/opt/splunk/etc/manager-apps/_cluster/local/props.conf';
const PEER_PROPS = '/opt/splunk/etc/peer-apps/_cluster/local/props.conf';
const SAVED = '/opt/splunk/etc/apps/search/local/savedsearches.conf';

describe('milestone 6 incidents', () => {
  it('license: noisy debug log pushes the projection over quota until it stops being collected', () => {
    const w = setup();
    const before = licenseStatus(w).projectedPct;
    const t = startScenario(w, 'license-noisy-debug');
    tickWorld(w, 12);
    expect(licenseStatus(w).projectedPct).toBeGreaterThan(100);
    expect(licenseStatus(w).bySourcetype[0]!.sourcetype).toBe('app:debug');
    const r = runSearch(w, {
      search: 'index=_internal source=*license_usage.log type=Usage st=app:debug',
      earliest: '-5m',
      latest: 'now',
    });
    expect(r.eventCount).toBeGreaterThan(0);
    edit(w, 'ds01', DEBUG_INPUTS, 'monitor:///var/log/app/debug.log', { disabled: '1' });
    testTerm(w).run('ssh splunk@ds01 splunk reload deploy-server');
    tickWorld(w, 14);
    expect(licenseStatus(w).projectedPct).toBeCloseTo(before, 0);
    expect(t.status).toBe('resolved');
  });

  it('license: a nullQueue on the indexers is an alternative fix', () => {
    const w = setup();
    const t = startScenario(w, 'license-noisy-debug');
    tickWorld(w, 12);
    const term = testTerm(w);
    term.run('ssh splunk@cm01');
    edit(w, 'cm01', MANAGER_PROPS, 'app:debug', { 'TRANSFORMS-drop': 'drop_debug' });
    edit(w, 'cm01', '/opt/splunk/etc/manager-apps/_cluster/local/transforms.conf', 'drop_debug', {
      REGEX: '.',
      DEST_KEY: 'queue',
      FORMAT: 'nullQueue',
    });
    expect(term.run('splunk apply cluster-bundle --answer-yes')).toMatch(/checksum=[0-9A-F]{32}[\s\S]*OK/);
    expect(term.run('splunk show cluster-bundle-status')).not.toContain('out of date');
    tickWorld(w, 12);
    expect(licenseStatus(w).projectedPct).toBeLessThan(90);
    expect(t.status).toBe('resolved');
  });

  it('timestamps: TZ on a UTC log puts events four hours ahead; fixing the bundle repairs new events', () => {
    const w = setup();
    const t = startScenario(w, 'timestamp-tz');
    tickWorld(w, 6);
    const ahead = runSearch(w, {
      search: 'index=app host=dal-app-0001 | eval lag=_time-_indextime | stats max(lag) as lag',
      earliest: '-1h',
      latest: '+1d',
    });
    expect(Number(ahead.results[0]!.get('lag'))).toBeGreaterThan(4 * 3600 - 120);
    expect(
      runSearch(w, { search: 'index=app host=dal-app-0001', earliest: '-30s', latest: 'now' }).eventCount,
    ).toBe(0);
    const term = testTerm(w);
    term.run('ssh splunk@cm01');
    edit(w, 'cm01', MANAGER_PROPS, 'app:log', {}, ['TZ']);
    // Saved on the manager but not applied: still broken.
    tickWorld(w, 2);
    expect(t.status).toBe('open');
    expect(term.run('splunk show cluster-bundle-status')).toContain('out of date');
    expect(term.send('splunk apply cluster-bundle\r')).toContain('[y/n]');
    expect(term.send('y\r')).toContain('OK');
    expect(hostFs(w, resolveHost(w, 'idx05')!).readFile(PEER_PROPS, ROOT)).not.toContain('TZ =');
    tickWorld(w, 8);
    expect(t.status).toBe('resolved');
    const lag = runSearch(w, {
      search: 'index=app host=dal-app-0001 | eval lag=_time-_indextime | stats max(lag) as lag',
      earliest: '-1m',
      latest: 'now',
    });
    expect(Math.abs(Number(lag.results[0]!.get('lag')))).toBeLessThan(60);
  });

  it('timestamps: a format that reads the trailing Z also fixes it', () => {
    const w = setup();
    const t = startScenario(w, 'timestamp-tz');
    tickWorld(w, 4);
    edit(w, 'cm01', MANAGER_PROPS, 'app:log', { TIME_FORMAT: '%Y-%m-%dT%H:%M:%S.%3N%z' });
    testTerm(w).run('ssh splunk@cm01 splunk apply cluster-bundle --answer-yes');
    tickWorld(w, 8);
    expect(t.status).toBe('resolved');
  });

  it('retired indexer: one forwarder is blocked until its local outputs override goes', () => {
    const w = setup();
    const t = startScenario(w, 'forwarder-retired-indexer');
    tickWorld(w, 4);
    const row = resolveHost(w, 'ash-app-0001')!.fleetRow!;
    expect(w.fleet.health[row]).not.toBe(0);
    const term = testTerm(w);
    term.run('ssh splunk@ash-app-0001');
    expect(term.run('splunk btool outputs list tcpout:ash_indexers --debug')).toContain('idx07');
    expect(
      term.run('grep "Cooked connection" /opt/splunkforwarder/var/log/splunk/splunkd.log | tail -1'),
    ).toContain('ip=10.10.0.27:9997 timed out');
    term.run('rm /opt/splunkforwarder/etc/system/local/outputs.conf');
    tickWorld(w, 2);
    expect(t.status).toBe('open');
    term.run('splunk restart');
    tickWorld(w, 10);
    expect(t.status).toBe('resolved');
  });

  it('input permissions: unreadable file warns in splunkd.log; any permission fix restores collection', () => {
    for (const fix of [
      'chmod 644 /var/log/mysql/mysqld.log',
      'chgrp splunk /var/log/mysql/mysqld.log && chmod 640 /var/log/mysql/mysqld.log',
    ]) {
      const w = setup();
      const t = startScenario(w, 'input-permissions');
      tickWorld(w, 4);
      const p = resolveHost(w, 'dal-db-0001')!;
      expect(forwarderInputs(w, p).unreadable).toEqual(['/var/log/mysql/mysqld.log']);
      const term = testTerm(w);
      term.run('ssh splunk@dal-db-0001');
      expect(term.run('ls -l /var/log/mysql')).toMatch(/-rw-------\.? +1 mysql +mysql/);
      expect(term.run('grep TailReader /opt/splunkforwarder/var/log/splunk/splunkd.log | tail -1')).toContain(
        'Insufficient permissions',
      );
      term.run('sudo -i');
      term.run(fix);
      tickWorld(w, 4);
      expect(t.status).toBe('resolved');
      expect(
        runSearch(w, {
          search: 'index=app sourcetype=mysqld host=dal-db-0001',
          earliest: '-1m',
          latest: 'now',
        }).eventCount,
      ).toBeGreaterThan(0);
    }
  });

  it('skipped searches: twelve hourly -24h searches overrun the limit until they are staggered', () => {
    const w = setup();
    const sh = resolveHost(w, 'sh01')!;
    expect(projectedSkips(w, sh, 60)).toBe(0);
    const t = startScenario(w, 'skipped-searches');
    tickWorld(w, 2);
    expect(projectedSkips(w, sh, 60)).toBeGreaterThan(0);
    const names = definitions
      .find((d) => d.id === 'skipped-searches')!
      .changes.map((c) => ('stanza' in c ? c.stanza : ''));
    names.forEach((n, i) => edit(w, 'sh01', SAVED, n, { cron_schedule: `${(i * 5) % 60} * * * *` }));
    testTerm(w).run('ssh splunk@sh01 splunk restart');
    tickWorld(w, 8);
    expect(projectedSkips(w, sh, 60)).toBe(0);
    expect(t.status).toBe('resolved');
  });

  it('skipped searches: a schedule_window is an alternative fix', () => {
    const w = setup();
    const t = startScenario(w, 'skipped-searches');
    tickWorld(w, 2);
    for (const c of definitions.find((d) => d.id === 'skipped-searches')!.changes)
      if ('stanza' in c) edit(w, 'sh01', SAVED, c.stanza, { schedule_window: 'auto' });
    testTerm(w).run('ssh splunk@sh01 splunk restart');
    tickWorld(w, 8);
    expect(t.status).toBe('resolved');
  });
});
