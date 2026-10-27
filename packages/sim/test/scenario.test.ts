import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  closeTicket,
  configureScenarios,
  createWorld,
  listHosts,
  parseScenario,
  refreshTickets,
  runSearch,
  scenarioCatalog,
  startScenario,
  summarizeFleet,
  tickWorld,
} from '../src';
import { hostFs } from '../src/vfs/build';
import { resolveHost } from '../src/hosts/profile';
import { ROOT } from '../src/vfs/vfs';
import { appLog } from '../src/logs/sources';
import { parseConf } from '../src/conf/parse';
import { patchConf } from '../src/scenario/engine';
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
function edit(
  w: ReturnType<typeof setup>,
  host: string,
  path: string,
  stanza: string,
  values: Record<string, string>,
) {
  const fs = hostFs(w, resolveHost(w, host)!);
  fs.writeFile(path, patchConf(fs.readFile(path, ROOT), stanza, values), ROOT);
}
function search(w: ReturnType<typeof setup>, text: string, earliest = '-1m', latest = 'now') {
  const r = runSearch(w, { search: text, earliest, latest });
  expect(r.status).toBe('done');
  return r;
}

const SC = '/opt/splunk/etc/system/local/serverclass.conf';
const PROPS = '/opt/splunk/etc/peer-apps/_cluster/local/props.conf';
const SERVER = '/opt/splunk/etc/system/local/server.conf';

describe('scenario engine and solution runs', () => {
  it('validates data, rejects duplicates and keeps generic stanza edits intact', () => {
    expect(() => parseScenario('id: invalid')).toThrow();
    expect(() => configureScenarios(setup(), [definitions[0]!, definitions[0]!])).toThrow(/Duplicate/);
    expect(
      parseConf(patchConf('[x]\na = old\n[x]\na = older\n', 'x', { a: 'new' }))
        .stanzas.get('x')
        ?.settings.get('a')?.value,
    ).toBe('new');
    expect(patchConf('[x]\na = old\n# comment\n[y]\nb = keep\n', 'x', { a: 'new', c: 'add' })).toContain(
      '[y]\nb = keep',
    );
  });

  it('shows only symptoms: the catalog and tickets never carry the root cause', () => {
    const w = setup();
    const catalog = scenarioCatalog(w);
    expect(catalog.map((c) => Object.keys(c).sort())).toEqual(
      catalog.map(() => ['difficulty', 'id', 'title', 'topics']),
    );
    for (const d of definitions) {
      expect(JSON.stringify(catalog)).not.toContain(d.summary);
      // Titles describe what the requester sees, not the config object at fault.
      expect(d.title).not.toMatch(/serverclass|whitelist|parsing ?queue|line.?break|props/i);
    }
    const t = startScenario(w, 'ds-serverclass-typo');
    expect(JSON.stringify(t)).not.toContain('dal-wbe');
  });

  it('server-class typo: only fixed after reload, then recovers and closes with a note', () => {
    const w = setup(),
      t = startScenario(w, 'ds-serverclass-typo');
    tickWorld(w, 7);
    const scope = { site: 'dal', serverClass: 'linux_web' };
    expect(summarizeFleet(w, scope).byHealth.wrong_serverclass).toBe(summarizeFleet(w, scope).total);
    expect(listHosts(w, { ...scope, health: 'wrong_serverclass' }).total).toBe(
      summarizeFleet(w, scope).total,
    );
    const term = testTerm(w);
    term.run('ssh splunk@ds01');
    expect(term.run('splunk btool serverclass list --debug')).toContain('dal-wbe-*');
    edit(w, 'ds01', SC, 'serverClass:linux_web', { 'whitelist.0': 'dal-web-*' });
    tickWorld(w, 12);
    expect(t.status).toBe('open'); // saved but not reloaded: nothing changes
    expect(() => closeTicket(w, t.id, 'fixed')).toThrow(/Verify/);
    term.run('splunk reload deploy-server');
    tickWorld(w, 12);
    expect(t.status).toBe('resolved');
    expect(summarizeFleet(w, scope).byHealth.wrong_serverclass).toBeLessThan(3);
    expect(() => closeTicket(w, t.id, ' ')).toThrow(/resolution note/);
    expect(
      closeTicket(w, t.id, 'Corrected whitelist, reloaded DS, verified Dallas web clients recovered.').status,
    ).toBe('closed');
  });

  it('a ticket is not fixed before its symptom has appeared', () => {
    const w = setup(),
      t = startScenario(w, 'ds-serverclass-typo');
    // The bad mapping reaches each forwarder at its next check-in, so the fleet still looks healthy.
    refreshTickets(w);
    expect(t.status).toBe('open');
    tickWorld(w, 1);
    expect(t.status).toBe('open');
    tickWorld(w, 12);
    expect(t.symptomSeen).toBe(true);
    expect(t.status).toBe('open');
  });

  it('server-class typo: a different correct whitelist also counts as fixed', () => {
    const w = setup(),
      t = startScenario(w, 'ds-serverclass-typo');
    tickWorld(w, 7);
    edit(w, 'ds01', SC, 'serverClass:linux_web', { 'whitelist.0': 'dal-web*' });
    testTerm(w).run('ssh splunk@ds01 splunk reload deploy-server');
    tickWorld(w, 12);
    expect(t.status).toBe('resolved');
  });

  it('line breaking: merges indexed events, source files stay intact, history stays broken after repair', () => {
    const w = setup(),
      t = startScenario(w, 'event-line-breaking');
    tickWorld(w, 18);
    const end = String(w.clock.now / 1000);
    const broken = search(w, 'index=app host=dal-app-0001', '-3m');
    expect(broken.events.some((e) => String(e.get('_raw')).includes('\n'))).toBe(true);
    const originals = new Set(
      appLog(w, resolveHost(w, 'dal-app-0001')!, 'linux_app').lines(w.config.startTime, w.clock.now),
    );
    expect(
      broken.events.flatMap((e) => String(e.get('_raw')).split('\n')).every((line) => originals.has(line)),
    ).toBe(true);
    const term = testTerm(w);
    term.run('ssh splunk@idx01');
    edit(w, 'idx01', PROPS, 'app:log', {
      SHOULD_LINEMERGE: 'false',
      LINE_BREAKER: '([\\r\\n]+)\\d{4}-\\d{2}-\\d{2}T',
    });
    refreshTickets(w);
    expect(t.status).toBe('open');
    term.run('splunk restart');
    tickWorld(w, 7);
    expect(t.status).toBe('resolved');
    expect(
      search(w, 'index=app host=dal-app-0001').events.every((e) => !String(e.get('_raw')).includes('\n')),
    ).toBe(true);
    expect(
      search(w, 'index=app host=dal-app-0001', String(w.config.startTime / 1000), end).events.map((e) =>
        e.get('_raw'),
      ),
    ).toEqual(broken.events.map((e) => e.get('_raw')));
    closeTicket(w, t.id, 'Fixed parsing-tier props, restarted idx01, verified newly indexed events.');
  });

  it('line breaking: turning line merging off is enough, even with the bad LINE_BREAKER left in place', () => {
    const w = setup(),
      t = startScenario(w, 'event-line-breaking');
    tickWorld(w, 6);
    edit(w, 'idx01', PROPS, 'app:log', { SHOULD_LINEMERGE: 'false' });
    testTerm(w).run('ssh splunk@idx01 splunk restart');
    tickWorld(w, 7);
    expect(t.status).toBe('resolved');
  });

  it('blocked parsing queue: saturated receiver, upstream backpressure, recovery after any adequate size', () => {
    const w = setup(),
      t = startScenario(w, 'blocked-parsing-queue');
    tickWorld(w, 7);
    expect(summarizeFleet(w, { site: 'dal' }).byHealth.blocked_queue).toBeGreaterThan(100);
    const query = 'index=_internal host=idx01 source="*metrics.log" name=parsingqueue blocked=true';
    expect(search(w, query).eventCount).toBeGreaterThan(0);
    const term = testTerm(w);
    term.run('ssh splunk@idx01');
    expect(term.run('grep blocked=true /opt/splunk/var/log/splunk/metrics.log')).toContain(
      'name=parsingqueue',
    );
    expect(term.run('ss -tln')).toContain('9997');
    edit(w, 'idx01', SERVER, 'queue=parsingQueue', { maxSize: '10MB' }); // not the original 6MB, still a fix
    refreshTickets(w);
    expect(t.status).toBe('open');
    term.run('splunk restart');
    tickWorld(w, 12);
    expect(t.status).toBe('resolved');
    expect(search(w, query).eventCount).toBe(0);
    expect(summarizeFleet(w, { site: 'dal' }).byHealth.blocked_queue).toBeLessThan(15);
    closeTicket(
      w,
      t.id,
      'Restored parsing queue capacity and restarted idx01; checked queues and fleet recovery.',
    );
  });

  it('red herrings are written to real logs while the incident is open, and stop when it closes', () => {
    const w = setup(),
      t = startScenario(w, 'ds-serverclass-typo');
    tickWorld(w, 30);
    const ds = testTerm(w);
    ds.run('ssh splunk@ds01');
    expect(ds.run('grep -c "phonehome delay of 412s" /opt/splunk/var/log/splunk/splunkd.log')).toMatch(
      /^[1-9]\d*\n$/,
    );
    const web = testTerm(w);
    web.run('ssh splunk@dal-web-0001');
    expect(web.run('grep -c "upstream response is buffered" /var/log/messages')).toMatch(/^[1-9]\d*\n$/);
    expect(
      search(w, 'index=_internal host=ds01 ClientSessionsManager WARN', '-5m').eventCount,
    ).toBeGreaterThan(0);

    edit(w, 'ds01', SC, 'serverClass:linux_web', { 'whitelist.0': 'dal-web-*' });
    ds.run('splunk reload deploy-server');
    tickWorld(w, 12);
    closeTicket(
      w,
      t.id,
      'Fixed the linux_web whitelist typo, reloaded the DS and confirmed clients recovered.',
    );
    const closedAt = t.closedAt! / 1000;
    tickWorld(w, 60);
    const after = search(
      w,
      'index=_internal host=ds01 "phonehome delay of 412s" | stats max(_time) as last',
      '-15m',
    );
    expect(after.results[0]!.get('last') as number).toBeLessThanOrEqual(closedAt);
  });

  it('red herrings on a forwarder stay searchable despite gate pushdown', () => {
    const herring = {
      host: 'dal-app-0001',
      file: 'splunkd' as const,
      level: 'WARN' as const,
      component: 'TailReader',
      message: 'Insufficient permissions to read file=/var/log/old-app/archive.log (reason: rotated)',
      everyMinutes: 1,
    };
    const def = { ...definitions.find((d) => d.id === 'event-line-breaking')!, redHerrings: [herring] };
    const w = createWorld({ seed: 'incidents', fleetSize: 3000 });
    configureScenarios(w, [def]);
    startScenario(w, def.id);
    tickWorld(w, 12);
    // "WARN" is gated to blocked/stale forwarders; a healthy forwarder with an injected WARN must still match.
    expect(search(w, 'index=_internal host=dal-app-0001 log_level=WARN', '-2m').eventCount).toBeGreaterThan(
      0,
    );
  });

  it('nothing starts on its own unless a file opts in to a schedule', () => {
    const w = setup();
    tickWorld(w, 60);
    expect(w.scenarios.tickets).toHaveLength(0);

    const scheduled = {
      ...definitions.find((d) => d.id === 'ds-serverclass-typo')!,
      trigger: { afterMinutes: 1 },
    };
    const w2 = createWorld({ seed: 'incidents', fleetSize: 3000 });
    configureScenarios(w2, [scheduled]);
    tickWorld(w2, 12);
    expect(w2.scenarios.tickets).toHaveLength(1);
    tickWorld(w2, 12);
    expect(w2.scenarios.tickets).toHaveLength(1);
  });

  it('enforces active limits and conflicting files', () => {
    const w = setup();
    startScenario(w, 'ds-serverclass-typo');
    expect(() => startScenario(w, 'ds-serverclass-typo')).toThrow(/already/);
    startScenario(w, 'event-line-breaking');
    expect(() => startScenario(w, 'blocked-parsing-queue')).toThrow(/maximum 2/);
  });

  it('replays deterministically from seed and actions', () => {
    const replay = () => {
      const w = setup();
      startScenario(w, 'blocked-parsing-queue');
      tickWorld(w, 10);
      return { tickets: w.scenarios.tickets, health: [...w.fleet.health] };
    };
    expect(replay()).toEqual(replay());
  });
});
