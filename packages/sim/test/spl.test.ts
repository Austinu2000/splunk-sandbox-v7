import { describe, expect, it } from 'vitest';
import { createWorld, summarizeFleet, tickWorld, type World } from '../src';
import { parseSearch, pushdown } from '../src/spl/search';
import { rowToPlain, runSearch, type SearchOutcome } from '../src/spl/run';
import { parseTime } from '../src/spl/time';
import { testTerm } from './helpers';

const NOW = Date.UTC(2026, 9, 23, 12, 34, 56);

function q(world: World, search: string, earliest = '-15m', latest = 'now'): SearchOutcome {
  const r = runSearch(world, { search, earliest, latest });
  if (r.status === 'failed') throw new Error(r.messages.map((m) => m.text).join('; '));
  return r;
}
const rows = (r: SearchOutcome) => r.results.map((x) => rowToPlain(x, r.columns));
const errorOf = (world: World, search: string) =>
  runSearch(world, { search }).messages.find((m) => m.type === 'error')?.text;

// A small world keeps fleet-wide searches fast; tick so there is history.
function smallWorld(seed = 'spl', ticks = 60): World {
  const w = createWorld({ seed, fleetSize: 3_000 });
  tickWorld(w, ticks);
  return w;
}

describe('time modifiers', () => {
  it('parses relative offsets, snapping, epoch and absolute times', () => {
    expect(parseTime('now', NOW)).toBe(NOW);
    expect(parseTime('-15m', NOW)).toBe(NOW - 15 * 60_000);
    expect(parseTime('-1d@d', NOW)).toBe(Date.UTC(2026, 9, 22));
    expect(parseTime('@d+8h', NOW)).toBe(Date.UTC(2026, 9, 23, 8));
    expect(parseTime('-2h@h', NOW)).toBe(Date.UTC(2026, 9, 23, 10));
    expect(parseTime('@w1', NOW)).toBe(Date.UTC(2026, 9, 19)); // Monday
    expect(parseTime('1792742400', NOW)).toBe(1792742400_000);
    expect(parseTime('10/23/2026:08:00:00', NOW)).toBe(Date.UTC(2026, 9, 23, 8));
    expect(parseTime('-3x', NOW)).toBeNull();
  });
});

describe('search language', () => {
  it('binds OR tighter than the implicit AND', () => {
    const n = parseSearch('a b OR c');
    expect(n).toMatchObject({ k: 'and', items: [{ k: 'term', text: 'a' }, { k: 'or' }] });
  });

  it('pushes down indexed fields, time modifiers and literal tokens only from top-level AND', () => {
    const p = pushdown(
      parseSearch('index=_internal host=dal-* earliest=-1h log_level=WARN blocked=true NOT error (x OR y)'),
    );
    expect(p.fields.get('index')).toEqual(['_internal']);
    expect(p.fields.get('host')).toEqual(['dal-*']);
    expect(p.earliest).toBe('-1h');
    // log_level is a regex-extracted field: its name never appears in _raw, its value does.
    expect(p.tokens).toEqual(['warn', 'blocked', 'true']);
  });
});

describe('commands', () => {
  const w = smallWorld();

  it('eval: arithmetic, concatenation, functions and comparisons', () => {
    const r = q(
      w,
      '| makeresults | eval a=7, b=a*2+1, s="x" . a, c=if(a>5,"big","small"), r=round(10/3,2), l=len("abcd"), u=upper(substr("hello",2,3)), m=mvcount(split("a,b,c",",")), cm=cidrmatch("10.10.0.0/16","10.10.4.5"), n=coalesce(missing, "fallback"), t=strftime(0, "%Y-%m-%d %H:%M:%S") | table a b s c r l u m cm n t',
    );
    expect(rows(r)).toEqual([
      {
        a: 7,
        b: 15,
        s: 'x7',
        c: 'big',
        r: 3.33,
        l: 4,
        u: 'ELL',
        m: 3,
        cm: 'true',
        n: 'fallback',
        t: '1970-01-01 00:00:00',
      },
    ]);
  });

  it('stats with by-clauses and the common aggregations', () => {
    const r = q(
      w,
      '| inputlookup forwarder_inventory | stats count, dc(server_class) as classes, values(site) as sites by os',
    );
    expect(r.columns).toEqual(['os', 'count', 'classes', 'sites']);
    const out = rows(r);
    expect(out.map((x) => x.os)).toEqual(['linux', 'windows']);
    expect((out[0]!.count as number) + (out[1]!.count as number)).toBe(3_000);
    expect(out[1]!.classes).toBe(2);
    expect(out[0]!.sites).toEqual(['ash', 'dal', 'fra']);
  });

  it('the inventory lookup agrees with the Fleet Overview', () => {
    const s = summarizeFleet(w);
    const out = rows(q(w, '| inputlookup forwarder_inventory | stats count by health'));
    for (const r of out) expect(r.count).toBe(s.byHealth[r.health as keyof typeof s.byHealth]);
  });

  it('sort, head, tail, dedup, top, rare, rename, fields, fillnull, lookup and where', () => {
    expect(
      rows(q(w, '| inputlookup forwarder_inventory | stats count by site | sort - count | head 1')).length,
    ).toBe(1);
    const top = rows(q(w, '| inputlookup forwarder_inventory | top limit=2 server_class'));
    expect(top).toHaveLength(2);
    expect(top[0]).toHaveProperty('percent');
    expect(top[0]!.count as number).toBeGreaterThanOrEqual(top[1]!.count as number);
    expect(rows(q(w, '| inputlookup forwarder_inventory | rare limit=1 server_class'))[0]!.server_class).toBe(
      'syslog_relay',
    );
    expect(rows(q(w, '| inputlookup forwarder_inventory | dedup site | table site | sort site'))).toEqual([
      { site: 'ash' },
      { site: 'dal' },
      { site: 'fra' },
    ]);
    expect(
      rows(q(w, '| makeresults count=3 | eval n=1 | tail 2 | rename n AS m | fields m | table m')),
    ).toEqual([{ m: 1 }, { m: 1 }]);
    expect(
      rows(
        q(
          w,
          '| makeresults | eval site="dal" | lookup site_contacts site OUTPUT oncall_team | fillnull value=none x | table site oncall_team x',
        ),
      ),
    ).toEqual([{ site: 'dal', oncall_team: 'platform-dal', x: 'none' }]);
    expect(
      rows(q(w, '| inputlookup site_contacts | where site!="dal" AND like(site_name, "%burn") | table site')),
    ).toEqual([{ site: 'ash' }]);
  });

  it('rex extracts named groups', () => {
    expect(
      rows(
        q(
          w,
          '| makeresults | eval x="user=alice id=42" | rex field=x "user=(?<user>\\w+) id=(?P<id>\\d+)" | table user id',
        ),
      ),
    ).toEqual([{ user: 'alice', id: '42' }]);
  });

  it('reports Splunk-style errors', () => {
    expect(errorOf(w, 'index=_internal | frobnicate')).toBe("Unknown search command 'frobnicate'.");
    expect(errorOf(w, '| makeresults | eval x=')).toMatch(
      /^Error in 'eval' command: The expression is malformed/,
    );
    expect(errorOf(w, '| makeresults | eval x=nosuchfn(1)')).toMatch(
      /The 'nosuchfn' function is unsupported/,
    );
    expect(errorOf(w, 'index=_internal | inputlookup site_contacts')).toMatch(/must be the first command/);
    expect(errorOf(w, '| stats count')).toMatch(/must be the first command/);
    expect(errorOf(w, 'index=_internal [search index=os]')).toMatch(/Subsearches are not supported/);
    expect(errorOf(w, '| inputlookup nope')).toMatch(/does not exist/);
    expect(errorOf(w, '| makeresults | stats foo(x)')).toMatch(/Error in 'stats' command/);
  });
});

describe('events reflect the world', () => {
  it('returns events newest first with default and extracted fields, and a matching timeline', () => {
    const w = smallWorld('events');
    const r = q(w, 'index=_internal host=dal-app-0001 source=*splunkd.log');
    expect(r.kind).toBe('events');
    expect(r.eventCount).toBeGreaterThan(0);
    const times = r.events.map((e) => e.time!);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(r.events[0]!.get('log_level')).toBe('INFO');
    expect(r.events[0]!.get('sourcetype')).toBe('splunkd');
    expect(r.events[0]!.get('splunk_server')).toMatch(/^idx0[12]$/);
    expect(r.timeline.reduce((s, b) => s + b.count, 0)).toBe(r.eventCount);
  });

  it('the terminal file and search return the same lines', () => {
    const w = smallWorld('same');
    const t = testTerm(w);
    t.run('ssh splunk@dal-app-0001');
    const file = t.run('tail -5 /opt/splunkforwarder/var/log/splunk/metrics.log').trimEnd().split('\n');
    const r = q(w, 'index=_internal host=dal-app-0001 source=*metrics.log | head 5', '-1m');
    expect(r.events.map((e) => e.get('_raw')).reverse()).toEqual(file);
  });

  it('an offline forwarder leaves a gap from the moment it went down', () => {
    const w = smallWorld('gap', 30);
    const t = testTerm(w);
    t.run('ssh splunk@dal-app-0001');
    t.run('splunk stop');
    const downAt = w.clock.now;
    tickWorld(w, 30);
    const [res] = rows(q(w, 'index=_internal host=dal-app-0001 | stats max(_time) as last count'));
    expect(res!.count as number).toBeGreaterThan(0);
    expect(res!.last as number).toBeLessThanOrEqual(downAt / 1000);
    expect(q(w, 'index=_internal host=dal-app-0001 earliest=-4m').eventCount).toBe(0);
  });

  it('a blocked forwarder delivers nothing until it unblocks, then its backlog arrives', () => {
    const w = smallWorld('block', 30);
    const t = testTerm(w);
    t.run('ssh splunk@ds01');
    t.run(
      `sudo sed_unavailable 2>/dev/null; echo -ne '[tcpout]\\ndefaultGroup = dal_indexers\\n\\n[tcpout:dal_indexers]\\nserver = idx99.corp.example:9997\\n' > /tmp/o.conf`,
    );
    t.run('cp /tmp/o.conf /opt/splunk/etc/deployment-apps/org_dal_outputs/default/outputs.conf');
    const reloadAt = w.clock.now;
    t.run('splunk reload deploy-server');
    tickWorld(w, 42);
    const during = q(w, `index=_internal host=dal-app-0001 earliest=-4m`);
    expect(during.eventCount).toBe(0);
    expect(rows(q(w, '| inputlookup forwarder_inventory | search host=dal-app-0001 | table health'))).toEqual(
      [{ health: 'blocked_queue' }],
    );

    t.run(
      `echo -ne '[tcpout]\\ndefaultGroup = dal_indexers\\n\\n[tcpout:dal_indexers]\\nserver = idx01.corp.example:9997\\n' > /tmp/o.conf`,
    );
    t.run('cp /tmp/o.conf /opt/splunk/etc/deployment-apps/org_dal_outputs/default/outputs.conf');
    t.run('splunk reload deploy-server');
    tickWorld(w, 12);
    const after = q(
      w,
      `index=_internal host=dal-app-0001 source=*metrics.log blocked=true earliest=-10m | stats min(_time) as first count`,
    );
    const [res] = rows(after);
    expect(res!.count as number).toBeGreaterThan(0);
    expect(res!.first as number).toBeGreaterThanOrEqual(reloadAt / 1000);
  });

  it('removing an inputs app on the DS stops that data but not _internal', () => {
    const w = smallWorld('inputs', 6);
    const t = testTerm(w);
    t.run('ssh splunk@ds01');
    t.run(
      `grep -v 'dal-web' /opt/splunk/etc/system/local/serverclass.conf > /tmp/sc && cp /tmp/sc /opt/splunk/etc/system/local/serverclass.conf`,
    );
    t.run('splunk reload deploy-server');
    tickWorld(w, 12);
    expect(q(w, 'index=app host=dal-web-0001 earliest=-60s').eventCount).toBe(0);
    expect(q(w, 'index=_internal host=dal-web-0001 earliest=-60s').eventCount).toBeGreaterThan(0);
    expect(q(w, 'index=app host=ash-web-0001 earliest=-60s').eventCount).toBeGreaterThanOrEqual(0);
  });

  it('metadata lastTime agrees with the newest event, and stopped indexers make a site go quiet', () => {
    const w = smallWorld('meta', 30);
    const meta = rows(q(w, '| metadata type=hosts index=_internal | search host=dal-app-0001'))[0]!;
    const newest = rows(q(w, 'index=_internal host=dal-app-0001 | stats max(_time) as t'))[0]!;
    expect(meta.lastTime).toBe(Math.floor(newest.t as number));

    const t = testTerm(w);
    for (const idx of ['idx01', 'idx02']) {
      t.run(`ssh splunk@${idx}`);
      t.run('splunk stop');
      t.run('exit');
    }
    tickWorld(w, 30);
    const silent = rows(
      q(
        w,
        '| metadata type=hosts index=_internal | eval age=now()-lastTime | where age > 120 | lookup forwarder_inventory host OUTPUT site | stats count by site',
      ),
    );
    const dal = silent.find((r) => r.site === 'dal')?.count as number;
    const dalForwarders =
      summarizeFleet(w, { site: 'dal' }).total -
      summarizeFleet(w, { site: 'dal', serverClass: 'syslog_relay' }).total;
    expect(dal).toBeGreaterThanOrEqual(dalForwarders - 5);
    expect((silent.find((r) => r.site === 'ash')?.count as number | undefined) ?? 0).toBeLessThan(30);
    expect(
      rows(q(w, '| rest /services/search/distributed/peers | where status="Down" | table peerName')),
    ).toEqual([{ peerName: 'idx01' }, { peerName: 'idx02' }]);
  });

  it('gate pushdown never changes results', () => {
    const w = smallWorld('gates', 90);
    // Full scans of every host's _internal are slow, so keep the windows short enough to finish well
    // inside the 8 s search budget even when the whole suite runs in parallel.
    const run = (s: string, window = '-5m') => {
      const r = q(w, s, window);
      expect(r.scan!.truncated).toBe(false);
      return r;
    };
    const pushed = run('index=_internal source=*metrics.log blocked=true | stats dc(host) as n');
    // Wrapping the term in an OR disables pushdown, forcing a full scan.
    const full = run(
      'index=_internal source=*metrics.log (blocked=true OR blocked=true) | stats dc(host) as n',
    );
    expect(pushed.results[0]!.get('n')).toBe(full.results[0]!.get('n'));
    expect(pushed.scan!.scanned).toBeLessThan(full.scan!.scanned / 5);
    const warnPushed = run('index=_internal log_level=WARN | stats count', '-90s').results[0]!.get('count');
    const warnFull = run(
      'index=_internal (log_level=WARN OR log_level=WARN) | stats count',
      '-90s',
    ).results[0]!.get('count');
    expect(warnPushed).toBe(warnFull);
  }, 60_000);

  it('is deterministic', () => {
    const search = 'index=_internal source=*splunkd.log | stats count by host | sort - count | head 5';
    const a = rows(q(smallWorld('det'), search, '-5m'));
    const b = rows(q(smallWorld('det'), search, '-5m'));
    expect(a).toEqual(b);
  }, 60_000);
});
