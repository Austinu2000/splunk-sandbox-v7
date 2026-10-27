import { describe, expect, it } from 'vitest';
import { createWorld, monitoringConsole, runSearch } from '../src';
import { extractTime, parseWithFormat, zoneOffset, type ParseConfig } from '../src/ingest/parsing';
import { parseCron } from '../src/scheduler';
import { patchConf } from '../src/scenario/engine';
import { resolveHost } from '../src/hosts/profile';
import { testTerm } from './helpers';

const cfg = (over: Partial<ParseConfig>): ParseConfig => ({
  merge: false,
  breaker: null,
  prefix: null,
  format: null,
  lookahead: 128,
  tzOffset: null,
  nullQueue: [],
  ...over,
});

describe('index-time parsing', () => {
  it('parses strptime formats, honours TZ and explicit zones', () => {
    const utc = Date.UTC(2026, 9, 23, 8, 15, 30, 250);
    expect(parseWithFormat('2026-10-23T08:15:30.250Z', '%Y-%m-%dT%H:%M:%S.%3N%z', null)).toBe(utc);
    expect(
      parseWithFormat('2026-10-23T08:15:30.250Z', '%Y-%m-%dT%H:%M:%S.%3N', zoneOffset('America/New_York')),
    ).toBe(utc + 4 * 3_600_000);
    expect(parseWithFormat('23/Oct/2026:08:15:30 +0200', '%d/%b/%Y:%H:%M:%S %z', null)).toBe(
      utc - 250 - 2 * 3_600_000,
    );
    expect(parseWithFormat('10/23/2026 08:15:30 PM', '%m/%d/%Y %I:%M:%S %p', null)).toBe(
      utc - 250 + 12 * 3_600_000,
    );
    expect(parseWithFormat('1792743330', '%s', null)).toBe(1792743330_000);
    expect(parseWithFormat('garbage', '%Y-%m-%d', null)).toBeNull();
    expect(zoneOffset('Etc/GMT+5')).toBe(-300);
  });

  it('extracts after TIME_PREFIX and keeps the write time when there is no format', () => {
    const raw = 'host=a ts=2026-10-23 08:15:30 msg=x';
    expect(extractTime(cfg({}), raw)).toBeNull();
    expect(extractTime(cfg({ prefix: /ts=/, format: '%Y-%m-%d %H:%M:%S' }), raw)).toBe(
      Date.UTC(2026, 9, 23, 8, 15, 30),
    );
    expect(extractTime(cfg({ prefix: /nope=/, format: '%Y' }), raw)).toBeNull();
  });

  it('cron expressions: steps, ranges, lists and bad input', () => {
    const at = (h: number, m: number) => Date.UTC(2026, 9, 23, h, m);
    expect(parseCron('*/15 * * * *')!(at(3, 45))).toBe(true);
    expect(parseCron('*/15 * * * *')!(at(3, 44))).toBe(false);
    expect(parseCron('5,35 8-17 * * 1-5')!(at(9, 35))).toBe(true); // Friday
    expect(parseCron('0 0 * * 0')!(at(0, 0))).toBe(false);
    expect(parseCron('61 * * * *')).toBeNull();
    expect(parseCron('* * *')).toBeNull();
  });

  it('patchConf can remove keys without touching the next stanza', () => {
    expect(patchConf('[a]\nx = 1\ny = 2\n[b]\nx = 3\n', 'a', { z: '9' }, ['y'])).toBe(
      '[a]\nx = 1\nz = 9\n[b]\nx = 3\n',
    );
  });
});

describe('cluster bundle and consoles', () => {
  it('apply cluster-bundle copies manager-apps to every live peer and restarts them; status reports sync', () => {
    const w = createWorld({ seed: 'bundle', fleetSize: 1000 });
    const term = testTerm(w);
    term.run('ssh splunk@cm01');
    expect(term.run('splunk show cluster-bundle-status')).not.toContain('out of date');
    term.run("echo '[my:st]' >> /opt/splunk/etc/manager-apps/_cluster/local/props.conf");
    expect(term.run('splunk show cluster-bundle-status')).toContain('out of date');
    expect(term.send('splunk apply cluster-bundle\r')).toContain('[y/n]');
    expect(term.send('n\r')).toContain('aborted');
    const out = term.run('splunk apply cluster-bundle --answer-yes');
    expect(out).toContain('Rolling restart of peers: idx01, idx02, idx03, idx04, idx05, idx06');
    expect(out).not.toContain('idx07');
    expect(term.run('splunk show cluster-bundle-status')).not.toContain('out of date');
    term.run('exit');
    term.run('ssh splunk@idx02');
    expect(term.run('splunk btool props list my:st --debug')).toContain(
      'peer-apps/_cluster/local/props.conf',
    );
    term.run('exit');
    term.run('ssh splunk@ds01');
    expect(term.run('splunk apply cluster-bundle --answer-yes')).toContain('not the cluster manager');
  });

  it('the retired indexer has no Splunk install and is not a cluster peer', () => {
    const w = createWorld({ seed: 'bundle', fleetSize: 1000 });
    expect(resolveHost(w, 'idx07')!.splunk).toBeNull();
    const term = testTerm(w);
    expect(term.run('ssh splunk@idx07 cat DECOMMISSIONED.txt')).toContain('removed from the indexer cluster');
  });

  it('Monitoring Console panels agree with the searches they link to', () => {
    const w = createWorld({ seed: 'mc', fleetSize: 1000 });
    for (const view of ['indexing', 'license', 'scheduler'] as const)
      for (const p of monitoringConsole(w, view).panels.filter(
        (x) => x.chart !== 'table' || x.id === 'skipped',
      )) {
        const r = runSearch(w, { search: p.search, earliest: p.earliest, latest: p.latest });
        expect(r.results.length).toBe(p.rows.length);
      }
  });
});
