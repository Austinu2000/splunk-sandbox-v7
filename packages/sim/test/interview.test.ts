import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  configureScenarios,
  createWorld,
  interviewCatalog,
  logAction,
  parseScenario,
  runSearch,
  saveNotes,
  startInterview,
  startScenario,
  submitInterview,
  takeHint,
  tickWorld,
} from '../src';
import { testTerm } from './helpers';

const dir = new URL('../../../scenarios/', import.meta.url);
const definitions = readdirSync(dir)
  .filter((n) => n.endsWith('.yaml'))
  .sort()
  .map((n) => parseScenario(readFileSync(new URL(n, dir), 'utf8')));

/** A world, a fake wall clock and a terminal/search/page recorder, as the server wires them. */
function rig() {
  const w = createWorld({ seed: 'interviews', fleetSize: 3000 });
  configureScenarios(w, definitions);
  let wall = Date.UTC(2026, 9, 23, 15, 0, 0);
  const clock = (advanceS = 20) => (wall += advanceS * 1000);
  const term = testTerm(w, undefined, (e) =>
    logAction(w, { kind: 'cmd', host: e.host, user: e.user, text: e.line }, clock()),
  );
  const page = (p: string) => logAction(w, { kind: 'page', text: p }, clock());
  const search = (q: string, earliest = '-15m') => {
    logAction(w, { kind: 'search', text: `${q} [earliest=${earliest} latest=now]` }, clock());
    return runSearch(w, { search: q, earliest, latest: 'now' });
  };
  return { w, term, page, search, clock, now: () => wall };
}

const GOOD_DS_ANSWER = {
  rootCause:
    'On ds01 the serverClass:linux_web whitelist was changed to dal-wbe-*, a typo for dal-web-*, so the Dallas web servers lost org_linux_web_inputs.',
  fix: 'Corrected whitelist.0 to dal-web-* in serverclass.conf on ds01 and ran splunk reload deploy-server.',
  verification:
    'Forwarder Management shows the Dallas web clients back in linux_web and access_combined events arrive again.',
  prevention: 'Peer review serverclass.conf changes and alert when a server class loses clients.',
};

describe('interview mode', () => {
  it('a strong run scores high, with milestones, the fixing change and verification on the timeline', () => {
    const { w, term, page, search, clock, now } = rig();
    const iv = startInterview(w, { scenarioId: 'ds-serverclass-typo' }, now());
    expect(iv.prompt).toMatch(/access logs/);
    tickWorld(w, 8);
    page('fleet');
    search('index=app host=dal-web-* sourcetype=access_combined', '-30m');
    term.run('ssh splunk@ds01');
    expect(term.run('splunk btool serverclass list serverClass:linux_web --debug')).toContain('dal-wbe-*');
    term.run('tail -n 20 /opt/splunk/var/log/splunk/splunkd.log');
    // Fix it in vi: find the bad line, replace it, save.
    term.send('vi /opt/splunk/etc/system/local/serverclass.conf\r');
    term.send('/dal-wbe\r');
    term.send('dd');
    term.send('i');
    term.send('whitelist.0 = dal-web-*\r');
    term.send('\x1b');
    term.send(':wq\r');
    expect(term.run('grep -c dal-wbe /opt/splunk/etc/system/local/serverclass.conf')).toBe('0\n');
    term.run('splunk reload deploy-server');
    tickWorld(w, 12);
    page('forwarders/clients');
    expect(search('index=app host=dal-web-* sourcetype=access_combined', '-1m').eventCount).toBeGreaterThan(
      0,
    );
    const done = submitInterview(w, iv.id, GOOD_DS_ANSWER, clock(60));
    const d = done.debrief!;
    expect(d.fixed).toBe(true);
    expect(d.missed).toEqual([]);
    expect(Object.fromEntries(d.scores.map((s) => [s.dimension, s.score]))).toEqual({
      triage: 100,
      evidence: 100,
      rootCause: 100,
      fix: 100,
      verification: 100,
      safety: 100,
      communication: 100,
    });
    expect(d.total).toBe(100);
    expect(d.timeline.find((e) => e.tags.includes('fixed'))!.text).toBe('splunk reload deploy-server');
    expect(d.timeline.find((e) => e.text.startsWith('splunk btool'))!.milestones).toEqual(['ds-config']);
    expect(d.timeline.some((e) => e.tags.includes('verification'))).toBe(true);
    expect(d.timeUsedSeconds).toBeGreaterThan(0);
    expect(d.overtime).toBe(false);
    expect(w.scenarios.tickets[0]).toMatchObject({ status: 'closed', outcome: 'resolved' });
  });

  it('a careless run: changes first, restarts an indexer, never fixes it, vague answer', () => {
    const { w, term, clock, now } = rig();
    const iv = startInterview(w, { scenarioId: 'ds-serverclass-typo' }, now());
    term.run('ssh splunk@idx03 splunk restart');
    const d = submitInterview(
      w,
      iv.id,
      { rootCause: 'Network issue probably', fix: 'Restarted things', verification: '', prevention: '' },
      clock(30 * 60),
    ).debrief!;
    const s = Object.fromEntries(d.scores.map((x) => [x.dimension, x]));
    expect(s.triage!.score).toBe(0);
    expect(s.evidence!.score).toBe(0);
    expect(s.rootCause!.score).toBe(0);
    expect(s.fix!.score).toBe(0);
    expect(s.verification!.score).toBe(0);
    expect(s.safety!.score).toBe(50);
    expect(s.safety!.notes[0]).toMatch(/Restarted an indexer/);
    expect(d.total).toBeLessThan(15);
    expect(d.overtime).toBe(true);
    expect(d.missed).toHaveLength(3);
    // ssh host cmd is attributed to the target host.
    expect(d.timeline[0]).toMatchObject({
      host: 'idx03',
      text: 'splunk restart',
      tags: ['change', 'unsafe'],
    });
    expect(w.scenarios.tickets[0]).toMatchObject({ status: 'closed', outcome: 'unresolved' });
  });

  it('a permissions run without editing config: chmod is the fix, a search the verification', () => {
    const { w, term, search, clock, now } = rig();
    const iv = startInterview(w, { scenarioId: 'input-permissions' }, now());
    tickWorld(w, 4);
    search('index=app host=dal-db-0001 sourcetype=mysqld', '-1h');
    term.run('ssh splunk@dal-db-0001');
    term.run('grep TailReader /opt/splunkforwarder/var/log/splunk/splunkd.log | tail -2');
    term.run('ls -l /var/log/mysql');
    term.run('sudo chgrp splunk /var/log/mysql/mysqld.log');
    term.run('sudo chmod 640 /var/log/mysql/mysqld.log');
    tickWorld(w, 4);
    search('index=app host=dal-db-0001 sourcetype=mysqld', '-1m');
    const d = submitInterview(
      w,
      iv.id,
      {
        rootCause:
          'After the upgrade mysqld.log on dal-db-0001 was mysql:mysql 0600, so the splunk user could not read it (TailReader permission warnings).',
        fix: 'chgrp splunk and chmod 640 on the file; no forwarder restart needed.',
        verification: 'TailReader warnings stopped and new mysqld events arrive in index=app.',
        prevention: 'Set the log group and mode in logrotate and configuration management.',
      },
      clock(),
    ).debrief!;
    expect(d.missed).toEqual([]);
    expect(d.fixed).toBe(true);
    expect(d.total).toBeGreaterThanOrEqual(95);
  });

  it('hints cost points, notes are kept, and one interview runs at a time', () => {
    const { w, now, clock } = rig();
    const iv = startInterview(w, { scenarioId: 'skipped-searches' }, now());
    expect(() => startInterview(w, {}, now())).toThrow(/Finish the running interview/);
    takeHint(w, iv.id, clock());
    takeHint(w, iv.id, clock());
    expect(() => takeHint(w, iv.id, clock())).toThrow(/No more hints/);
    saveNotes(w, iv.id, 'Scheduler? Check skipped.');
    expect(iv.notes).toBe('Scheduler? Check skipped.');
    const d = submitInterview(
      w,
      iv.id,
      { rootCause: 'skipped searches', fix: '', verification: '', prevention: '' },
      clock(),
    ).debrief!;
    expect(d.hintPenalty).toBe(25);
    expect(d.timeline.filter((e) => e.kind === 'hint')).toHaveLength(2);
    expect(() => saveNotes(w, iv.id, 'x')).toThrow(/already been submitted/);
  });

  it('picks unseen incidents by topic and difficulty, and needs the sandbox tickets closed first', () => {
    const { w, now, clock } = rig();
    startScenario(w, 'event-line-breaking');
    expect(() => startInterview(w, {}, now())).toThrow(/Close the open sandbox tickets/);
    const w2 = rig();
    const a = startInterview(w2.w, { difficulty: 'hard' }, w2.now());
    expect(['timestamp-tz', 'skipped-searches']).toContain(a.scenarioId);
    submitInterview(w2.w, a.id, { rootCause: 'x', fix: '', verification: '', prevention: '' }, w2.clock());
    const b = startInterview(w2.w, { difficulty: 'hard' }, w2.now());
    expect(b.scenarioId).not.toBe(a.scenarioId);
    submitInterview(w2.w, b.id, { rootCause: 'x', fix: '', verification: '', prevention: '' }, w2.clock());
    expect(() => startInterview(w2.w, { difficulty: 'hard' }, w2.now())).toThrow(/No unseen incident/);
    const cat = interviewCatalog(w2.w, false);
    expect(
      cat.scenarios
        .filter((s) => s.seen)
        .map((s) => s.id)
        .sort(),
    ).toEqual([a.scenarioId, b.scenarioId].sort());
    // Same seed, same history: same pick.
    expect(startInterview(rig().w, { difficulty: 'hard' }, 0).scenarioId).toBe(a.scenarioId);
    void clock;
  });

  it('every scenario has an interview, and the scoring weights sum to 100', () => {
    expect(definitions.every((d) => d.interview)).toBe(true);
    const { w, now, clock } = rig();
    const iv = startInterview(w, { scenarioId: 'timestamp-tz' }, now());
    const d = submitInterview(
      w,
      iv.id,
      { rootCause: 'x', fix: '', verification: '', prevention: '' },
      clock(),
    ).debrief!;
    expect(d.scores.reduce((s, x) => s + x.weight, 0)).toBe(100);
  });
});
