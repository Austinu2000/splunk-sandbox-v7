import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  tickWorld,
  setupFoundation,
  ingestText,
  saveReport,
  executeReport,
  listReports,
  saveWorld,
  loadWorld,
  runSearch,
  reviewNotable,
  stageResponseAdapter,
  respondToNotable,
  securityView,
  RESPONSE_ADAPTER_SOURCE,
  stopSplunk,
  resolveHost,
  startSplunk,
} from '../src';
import type { AlertConfiguration } from '@sandbox/shared';
const fresh = () => {
  const w = createWorld({
    ...profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
    fleetSize: 50,
  });
  tickWorld(w, 1);
  ingestText(
    w,
    'idx01',
    '/var/log/practice/detection.log',
    'v7_detection',
    'os',
    'user=alice src=10.0.0.10 action=failure\nuser=alice src=10.0.0.10 action=failure\nuser=bob action=success\n',
  );
  return w;
};
const index = (w: ReturnType<typeof fresh>) =>
  setupFoundation(w, [
    {
      kind: 'file',
      host: 'idx01',
      path: '/opt/splunk/etc/system/local/indexes.conf',
      text: '[notable]\nhomePath=$SPLUNK_DB/notable/db\ncoldPath=$SPLUNK_DB/notable/colddb\nthawedPath=$SPLUNK_DB/notable/thaweddb\n',
      apply: true,
    },
  ]);
const alert: AlertConfiguration = {
  type: 'custom',
  relation: 'greater than',
  threshold: 0,
  condition: 'search count > 1',
  digest: false,
  suppress: true,
  period: '5m',
  fields: ['user'],
  track: true,
  severity: 4,
  actions: ['notable', 'notification'],
  notable: {
    title: 'Repeated authentication failures',
    description: 'Investigate actual source events',
    securityDomain: 'access',
    severity: 'high',
  },
};
const detection = (w: ReturnType<typeof fresh>, a = alert) =>
  saveReport(
    w,
    {
      host: 'sh01',
      app: 'search',
      owner: 'admin',
      sharing: 'App',
      title: 'Authentication failure detection',
      search: 'index=os sourcetype=v7_detection action=failure | stats count by user',
      earliest: '-15m',
      latest: 'now',
      alert: a,
    },
    { create: true },
  );
describe('recorded detection and offline response operations', () => {
  it('creates indexed notable evidence from actual matching rows and preserves suppression/replay', () => {
    const w = fresh();
    index(w);
    const report = detection(w),
      run = executeReport(w, report.id);
    expect(run.status).toBe('succeeded');
    expect(run.rows).toEqual([{ user: 'alice', count: 2 }]);
    expect(run.alert?.triggered).toBe(1);
    expect(w.security?.notables).toHaveLength(1);
    const n = w.security!.notables[0]!;
    expect(n.rows).toEqual(run.rows);
    expect(n.revision).toBe(report.revision);
    expect(n.title).toBe(alert.notable!.title);
    const q = runSearch(w, {
      search: 'index=notable event_id="' + n.id + '" | table user count rule_title source_run_id',
    });
    expect(q.status).toBe('done');
    expect(q.results[0]?.get('user')).toBe('alice');
    expect(q.results[0]?.get('count')).toBe(2);
    const repeated = executeReport(w, report.id);
    expect(repeated.alert?.suppressed).toBe(1);
    expect(w.security?.notables).toHaveLength(1);
    reviewNotable(w, 'sh01', n.id, {
      status: 'in-progress',
      owner: 'admin',
      note: 'Two matching authentication failures; source checked.',
    });
    const restored = loadWorld(saveWorld(w), []);
    expect(restored.security).toEqual(w.security);
    expect(runSearch(restored, { search: 'index=notable event_id="' + n.id + '"' }).events).toHaveLength(1);
  });
  it('does not suppress failed notable actions and retries after destination repair; unmatched/failed searches create nothing', () => {
    const w = fresh(),
      r = detection(w),
      first = executeReport(w, r.id);
    expect(first.status).toBe('failed');
    expect(first.error).toContain('notable events index');
    expect(Object.keys(w.reports!.alerts!.suppression)).toHaveLength(0);
    expect(w.security).toBeUndefined();
    index(w);
    expect(executeReport(w, r.id).alert?.triggered).toBe(1);
    expect(w.security?.notables).toHaveLength(1);
    const old = listReports(w, 'sh01').find((x) => x.id === r.id)!;
    const unmatched = saveReport(
      w,
      { ...old, alert: { ...alert, condition: 'search count > 10' } },
      { id: old.id, revision: old.revision },
    );
    expect(executeReport(w, unmatched.id).alert?.matched).toBe(false);
    expect(w.security?.notables).toHaveLength(1);
    const current = listReports(w, 'sh01').find((x) => x.id === unmatched.id)!;
    const broken = saveReport(
      w,
      { ...current, search: 'index=os | unsupported_command' },
      { id: current.id, revision: current.revision },
    );
    expect(executeReport(w, broken.id).status).toBe('failed');
    expect(w.security?.notables).toHaveLength(1);
  });
  it('retains authentication/authorization failures and creates exactly one ticket across retries and resume', () => {
    const w = fresh();
    index(w);
    const r = detection(w);
    executeReport(w, r.id);
    const n = w.security!.notables[0]!;
    expect(respondToNotable(w, 'sh01', n.id).error).toContain('missing');
    stageResponseAdapter(w, 'sh01', RESPONSE_ADAPTER_SOURCE.replace('training_valid', 'training_expired'));
    expect(respondToNotable(w, 'sh01', n.id).error).toContain('Authentication');
    stageResponseAdapter(w, 'sh01', RESPONSE_ADAPTER_SOURCE.replace('allowed: true', 'allowed: false'));
    expect(respondToNotable(w, 'sh01', n.id).error).toContain('Authorization');
    expect(w.security!.tickets).toHaveLength(0);
    stageResponseAdapter(w, 'sh01', RESPONSE_ADAPTER_SOURCE);
    const created = respondToNotable(w, 'sh01', n.id);
    expect(created.status).toBe('created');
    const restored = loadWorld(saveWorld(w), []),
      again = respondToNotable(restored, 'sh01', n.id);
    expect(again.status).toBe('existing');
    expect(again.ticketId).toBe(created.ticketId);
    expect(restored.security!.tickets).toHaveLength(1);
    expect(restored.security!.attempts.map((a) => a.status)).toEqual([
      'failed',
      'failed',
      'failed',
      'created',
      'existing',
    ]);
    expect(w.security!.attempts).toHaveLength(4);
  });
  it('enforces current index/capability/host availability and rejects real endpoint or credential fields', () => {
    const w = fresh();
    index(w);
    executeReport(w, detection(w).id);
    const n = w.security!.notables[0]!;
    expect(securityView(w, 'sh01', 'analyst').notables).toEqual([]);
    expect(() => respondToNotable(w, 'sh01', n.id, 'analyst')).toThrow('requires edit_monitor');
    for (const source of [
      RESPONSE_ADAPTER_SOURCE + 'password: test\n',
      RESPONSE_ADAPTER_SOURCE.replace('servicenow.practice.invalid', 'example.com'),
      'null',
      '[a,b]',
      RESPONSE_ADAPTER_SOURCE.replace('true', 'yes'),
    ])
      expect(() => stageResponseAdapter(w, 'sh01', source)).toThrow();
    expect(() => reviewNotable(w, 'sh01', n.id, { status: 'resolved', owner: 'admin', note: '' })).toThrow();
    stopSplunk(w, resolveHost(w, 'sh01')!);
    expect(() => respondToNotable(w, 'sh01', n.id)).toThrow('available');
    startSplunk(w, resolveHost(w, 'sh01')!);
    expect(securityView(w, 'sh01').notables).toHaveLength(1);
  });
});
