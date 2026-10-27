import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  closeTicket,
  configureScenarios,
  createWorld,
  loadWorld,
  logAction,
  monitoringConsole,
  parseScenario,
  rowToPlain,
  runSearch,
  saveWorld,
  startInterview,
  startScenario,
  submitInterview,
  takeHint,
  tickWorld,
  type World,
} from '../src';
import { attachAiAssessment } from '../src/interview/engine';
import { testTerm } from './helpers';

const dir = new URL('../../../scenarios/', import.meta.url);
const definitions = readdirSync(dir)
  .filter((n) => n.endsWith('.yaml'))
  .sort()
  .map((n) => parseScenario(readFileSync(new URL(n, dir), 'utf8')));

function fresh(): World {
  const w = createWorld({ seed: 'save-test', fleetSize: 3000 });
  configureScenarios(w, definitions);
  return w;
}

/** JSON with object keys and map entries sorted, so insertion order doesn't matter. */
function canon(v: unknown): string {
  return JSON.stringify(v, (_k, x) => {
    if (x instanceof Map) return [...x].sort((a, b) => (String(a[0]) < String(b[0]) ? -1 : 1));
    if (x && typeof x === 'object' && !Array.isArray(x))
      return Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1)));
    return x;
  });
}

/** Everything observable about a world, as plain data. */
function fingerprint(w: World) {
  const search = (q: string, earliest = '-30m') => {
    const r = runSearch(w, { search: q, earliest, latest: 'now' });
    return r.results.map((row) => rowToPlain(row, r.columns));
  };
  return {
    clock: { ...w.clock },
    health: Array.from(w.fleet.health),
    assigned: Array.from(w.fleet.assignedClass),
    // A host whose filesystem was only looked at has an empty overlay: the same as none.
    overlay: canon(new Map([...w.hosts.fsOverlay].filter(([, m]) => m.size))),
    services: canon(w.hosts.services),
    running: canon(w.hosts.restartSnapshot),
    revisions: canon(w.hosts.revisions),
    logins: canon(w.hosts.lastLogin),
    tickets: canon(w.scenarios.tickets),
    interviews: canon(w.interviews),
    actions: canon(w.actions),
    license: JSON.stringify(monitoringConsole(w, 'license').stats),
    usage: search('index=_internal source=*license_usage.log type=Usage | stats sum(b) by st'),
    app: search('index=app host=dal-app-0001 | stats count by sourcetype', '-15m'),
    internal: search('index=_internal host=idx0* log_level=WARN | stats count by host, component'),
  };
}

/** Equal fingerprints; on failure, names the parts that differ and where. */
function expectSame(a: World, b: World): void {
  const x = fingerprint(a) as Record<string, unknown>;
  const y = fingerprint(b) as Record<string, unknown>;
  const differs = Object.keys(x).filter((k) => JSON.stringify(x[k]) !== JSON.stringify(y[k]));
  const where = differs.map((k) => {
    const p = JSON.stringify(x[k]);
    const q = JSON.stringify(y[k]);
    let i = 0;
    while (p[i] === q[i]) i++;
    return `${k}: …${p.slice(Math.max(0, i - 120), i + 80)}… vs …${q.slice(Math.max(0, i - 120), i + 80)}…`;
  });
  expect(where).toEqual([]);
}

describe('save and load', () => {
  it('replaying the journal rebuilds the same world, which then evolves identically', () => {
    const w = fresh();
    let wall = Date.UTC(2026, 9, 23, 15);
    const term = testTerm(w, undefined, (e) =>
      logAction(w, { kind: 'cmd', host: e.host, user: e.user, text: e.line }, (wall += 1000)),
    );
    tickWorld(w, 5);
    startScenario(w, 'license-noisy-debug');
    tickWorld(w, 7);
    void monitoringConsole(w, 'license'); // starts license history lazily
    term.run('ssh splunk@ds01');
    // The incident's stanza is the last in the file, so an appended line lands in it.
    term.run("echo 'disabled = 1' >> /opt/splunk/etc/deployment-apps/org_linux_app_inputs/local/inputs.conf");
    term.run('splunk reload deploy-server');
    term.run('exit');
    tickWorld(w, 9);
    term.run('ssh splunk@cm01');
    term.run("echo '[my:st]' >> /opt/splunk/etc/manager-apps/_cluster/local/props.conf");
    term.run('splunk apply cluster-bundle --answer-yes');
    term.run('exit');
    tickWorld(w, 4);
    term.run('ssh splunk@idx02 splunk stop');
    tickWorld(w, 3);
    term.run('ssh splunk@idx02 splunk start');
    tickWorld(w, 8);
    closeTicket(w, 'INC-0001', 'Disabled the debug input and reloaded the DS.');
    expect(() => startScenario(w, 'license-noisy-debug')).toThrow(); // rejected: not journaled
    const iv = startInterview(w, { scenarioId: 'input-permissions' }, (wall += 1000));
    tickWorld(w, 3);
    takeHint(w, iv.id, (wall += 1000));
    term.run('ssh splunk@dal-db-0001');
    term.run('sudo chmod 644 /var/log/mysql/mysqld.log');
    term.run('exit');
    logAction(w, { kind: 'search', text: 'index=app sourcetype=mysqld' }, (wall += 1000));
    tickWorld(w, 5);
    submitInterview(
      w,
      iv.id,
      {
        rootCause: 'mysqld.log 0600, splunk user cannot read',
        fix: 'chmod 644',
        verification: 'search',
        prevention: 'logrotate',
      },
      (wall += 1000),
    );
    attachAiAssessment(w, iv.id, { ai: { model: 'stub', rootCause: 90, communication: 70, feedback: 'ok' } });
    tickWorld(w, 4);

    const saved = saveWorld(w);
    expect(saved.journal.length).toBeGreaterThan(20);
    expect(saved.journal.filter((m) => m.k === 'scenario.start')).toHaveLength(1);
    // Inner effects of journaled operations are not journaled separately.
    expect(
      saved.journal.some((m) => m.k === 'fs' && m.host === 'ds01' && m.path.includes('local/inputs.conf')),
    ).toBe(true);
    expect(
      saved.journal.filter((m) => m.k === 'svc' && m.host === 'idx01').map((m) => (m as { op: string }).op),
    ).toEqual(['restart']);

    const loaded = loadWorld(JSON.parse(JSON.stringify(saved)), definitions);
    expectSame(loaded, w);
    expect(loaded.interviews[0]!.debrief!.ai?.rootCause).toBe(90);
    tickWorld(w, 20);
    tickWorld(loaded, 20);
    expectSame(loaded, w);
    // A save of the loaded world is the same save.
    expect(saveWorld(loaded).journal).toEqual(saveWorld(w).journal);
  });

  it('ticks and searches journal nothing, except a lazily started license history', () => {
    const w = fresh();
    tickWorld(w, 30);
    runSearch(w, { search: 'index=_internal sourcetype=splunkd host=idx01 | head 5' });
    expect(saveWorld(w)).toMatchObject({ seed: 'save-test', fleetSize: 3000, tick: 30, journal: [] });
    runSearch(w, { search: 'index=_internal source=*license_usage.log | head 5' });
    tickWorld(w, 10);
    const saved = saveWorld(w);
    expect(saved.journal).toEqual([{ t: 30, k: 'license.start' }]);
    expectSame(loadWorld(saved, definitions), w);
  });

  it('rejects unknown versions and journals that no longer replay', () => {
    const saved = saveWorld(fresh());
    expect(() => loadWorld({ ...saved, version: 99 as 1 }, definitions)).toThrow(/version/);
    expect(() =>
      loadWorld({ ...saved, tick: 3, journal: [{ t: 1, k: 'scenario.start', id: 'gone' }] }, definitions),
    ).toThrow(/Could not replay this save at tick 1/);
  });
});
