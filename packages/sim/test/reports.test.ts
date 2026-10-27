import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  saveReport,
  listReports,
  executeReport,
  saveWorld,
  loadWorld,
  tickWorld,
  setupFoundation,
  changeIndex,
  configureMonitor,
  uploadPracticeFile,
  runSearch,
  resolveHost,
  restartSplunk,
  TerminalSession,
  stripAnsi,
} from '../src/index';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
import { importLegacyReport } from '../src/engineering/reports';
import { collectSummary } from '../src/engineering/summary';
import { Row } from '../src/spl/row';
const fresh = () => {
  const w = createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
  setupFoundation(w, [
    {
      kind: 'file',
      host: 'idx01',
      path: '/opt/splunk/etc/system/local/server.conf',
      text: '[clustering]\nmode=disabled\n',
      apply: true,
    },
  ]);
  changeIndex(w, 'idx01', 'source_logs', {}, { create: true });
  changeIndex(w, 'idx01', 'summary_logs', {}, { create: true });
  configureMonitor(w, 'idx01', '/var/log/practice/report.log', {
    index: 'source_logs',
    sourcetype: 'app_log',
  });
  uploadPracticeFile(
    w,
    'idx01',
    '/var/log/practice/report.log',
    'status=500 service=checkout\nstatus=200 service=checkout\nstatus=500 service=checkout\n',
  );
  tickWorld(w, 1);
  return w;
};
const input = {
  host: 'sh01',
  app: 'search',
  owner: 'admin',
  sharing: 'App' as const,
  title: 'Status counts',
  search: 'index=source_logs | stats count by status',
  earliest: '-1m@m',
  latest: '@m',
  enabled: true,
  scheduled: true,
  cron: '* * * * *',
  summaryIndex: 'summary_logs',
};
describe('canonical saved reports and summary execution', () => {
  it('queries retained summary events beyond the generated 24-hour history', () => {
    const w = fresh(),
      end = w.clock.now - 2 * 86400000;
    collectSummary(w, [{ count: 7, _time: end / 1000 }], {
      index: 'summary_logs',
      host: 'sh01',
      principal: 'admin',
      earliest: end - 3600000,
      latest: end,
      writer: 'backfill-test',
    });
    const summary = runSearch(w, {
      search: 'index=summary_logs | stats sum(count) as total',
      earliest: '-3d',
    });
    expect(summary.status).toBe('done');
    expect(summary.results[0]!.get('total')).toBe(7);
    expect(
      runSearch(w, {
        search: 'index=summary_logs | stats sum(count) as total',
        earliest: '0',
      }).results[0]!.get('total'),
    ).toBe(7);
    const raw = runSearch(w, {
      search: 'index=_internal host=idx01 source=*splunkd.log | stats min(_time) as first',
      earliest: '-3d',
    });
    expect(Number(raw.results[0]!.get('first'))).toBeGreaterThanOrEqual((w.clock.now - 86400000) / 1000);
  });
  it('preserves dimensions that conflict with indexed metadata under explicit orig_ fields', () => {
    const w = fresh();
    collectSummary(w, [{ host: 'source-host', sourcetype: 'source-type', count: 3 }], {
      index: 'summary_logs',
      host: 'sh01',
      principal: 'admin',
      earliest: w.clock.now - 1000,
      latest: w.clock.now,
      writer: 'dimension-test',
    });
    const row = runSearch(w, { search: 'index=summary_logs | table host orig_host orig_sourcetype count' })
      .results[0]!;
    expect(row.get('host')).toBe('sh01');
    expect(row.get('orig_host')).toBe('source-host');
    expect(row.get('orig_sourcetype')).toBe('source-type');
  });
  it('keeps authoritative event metadata intact during automatic field extraction', () => {
    const row = new Row({
      time: 1,
      raw: 'host=spoofed index=other status=200',
      host: 'idx01',
      source: '/var/log/practice/test',
      sourcetype: 'app_log',
      index: 'source_logs',
      splunk_server: 'idx01',
    });
    expect(row.get('status')).toBe('200');
    expect(row.toObject()).toMatchObject({ host: 'idx01', index: 'source_logs' });
    row.set('host', 'explicit-display-change');
    expect(row.get('host')).toBe('explicit-display-change');
  });
  it('keeps inherited reports in the existing background model while new stanzas execute', () => {
    const w = fresh(),
      host = resolveHost(w, 'sh01')!,
      fs = hostFs(w, host),
      path = '/opt/splunk/etc/apps/search/local/savedsearches.conf';
    fs.writeFile(
      path,
      patchConf(fs.readFile(path, ROOT), 'Errors by host', { cron_schedule: '* * * * *', enableSched: '1' }),
      ROOT,
    );
    restartSplunk(w, host);
    tickWorld(w, 5);
    expect(w.reports?.runs ?? []).toEqual([]);
    fs.writeFile(
      path,
      patchConf(fs.readFile(path, ROOT), 'New shipped report', {
        search: 'index=source_logs | stats count',
        enableSched: '1',
        cron_schedule: '* * * * *',
      }),
      ROOT,
    );
    restartSplunk(w, host);
    tickWorld(w, 6);
    expect(w.reports!.runs).toHaveLength(1);
    expect(w.reports!.runs[0]).toMatchObject({ title: 'New shipped report', status: 'succeeded' });
  });
  it('stores Web service changes in the inspectable config and scopes identical titles by app/owner', () => {
    const w = fresh(),
      a = saveReport(w, { ...input, scheduled: false, summaryIndex: undefined }, { create: true });
    const b = saveReport(
      w,
      { ...input, app: 'operations', scheduled: false, summaryIndex: undefined },
      { create: true },
    );
    const c = saveReport(
      w,
      { ...input, owner: 'analyst', sharing: 'Private', scheduled: false, summaryIndex: undefined },
      { principal: 'analyst', create: true },
    );
    expect(new Set([a.id, b.id, c.id]).size).toBe(3);
    expect(listReports(w, 'sh01', 'operator').some((r) => r.id === c.id)).toBe(false);
    expect(a.sourcePath).toBe('/opt/splunk/etc/apps/search/local/savedsearches.conf');
    expect(
      runSearch(w, { search: '| rest /services/saved/searches | search title="Status counts"' }).results,
    ).toHaveLength(3);
    expect(() => saveReport(w, { ...input, search: 'index=changed' }, { revision: 'stale' })).toThrow(
      /changed/,
    );
    expect(() => saveReport(w, { ...input, owner: 'admin' }, { principal: 'analyst' })).toThrow(/Only admin/);
  });
  it('writes no summary data on creation, executes an exact scheduled window and preserves rows through replay', () => {
    const w = fresh(),
      report = saveReport(w, input, { create: true });
    expect(w.ingestion!.events.filter((e) => e.provenance === 'summary')).toEqual([]);
    tickWorld(w, 5);
    const run = w.reports!.runs.find((r) => r.reportId === report.id)!;
    expect(run).toMatchObject({
      status: 'succeeded',
      earliest: w.config.startTime,
      latest: w.config.startTime + 60000,
      resultCount: 2,
    });
    expect(run.summaryEventIds).toHaveLength(2);
    const result = runSearch(w, { search: 'index=summary_logs | stats sum(count) as total by status' });
    expect(result.results.map((r) => [r.get('status'), r.get('total')]).sort()).toEqual([
      ['200', 1],
      ['500', 2],
    ]);
    const loaded = loadWorld(saveWorld(w), []);
    expect(loaded.reports).toEqual(w.reports);
    expect(loaded.ingestion).toEqual(w.ingestion);
    tickWorld(w, 6);
    tickWorld(loaded, 6);
    expect(loaded.reports).toEqual(w.reports);
    expect(loaded.ingestion).toEqual(w.ingestion);
  });
  it('diagnoses missing destination, bad SPL, disabled dispatch and overlapping summary windows without partial event writes', () => {
    const w = fresh(),
      report = saveReport(w, { ...input, latest: 'now', earliest: '-1m', summaryIndex: 'not_created' });
    const before = w.ingestion!.events.length;
    expect(executeReport(w, report.id).error).toMatch(/destination/);
    expect(w.ingestion!.events).toHaveLength(before);
    const fixed = saveReport(w, { ...input, latest: 'now', earliest: '-1m' });
    expect(executeReport(w, fixed.id).status).toBe('succeeded');
    expect(executeReport(w, fixed.id).error).toMatch(/overlaps/);
    const bad = saveReport(w, { ...input, search: 'index=source_logs | no_such_command' });
    expect(executeReport(w, bad.id).status).toBe('failed');
    const disabled = saveReport(w, { ...input, enabled: false });
    expect(executeReport(w, disabled.id).error).toMatch(/disabled/);
  });
  it('activates native configuration only after reload/restart and dispatches through simulated REST', () => {
    const w = fresh(),
      h = resolveHost(w, 'sh01')!,
      fs = hostFs(w, h),
      path = '/opt/splunk/etc/apps/search/local/savedsearches.conf';
    fs.mkdir('/opt/splunk/etc/apps/search/local', ROOT, { parents: true });
    fs.writeFile(
      path,
      patchConf(fs.exists(path) ? fs.readFile(path, ROOT) : '', 'From config', {
        search: 'index=source_logs | stats count',
        'dispatch.earliest_time': '-5m',
        'dispatch.latest_time': 'now',
        enableSched: '0',
      }),
      ROOT,
    );
    expect(listReports(w, 'sh01').some((r) => r.title === 'From config')).toBe(false);
    restartSplunk(w, h);
    expect(listReports(w, 'sh01').some((r) => r.title === 'From config')).toBe(true);
    let output = '';
    const t = new TerminalSession({ world: w });
    t.onOutput((s) => (output += s));
    t.start();
    t.input('ssh splunk@sh01\r');
    t.input(
      'curl -k -u admin:training-only https://localhost:8089/servicesNS/nobody/search/saved/searches/From%20config/dispatch -d trigger_actions=0\r',
    );
    expect(stripAnsi(output)).toContain('succeeded');
    t.dispose();
  });
  it('collect persists searchable events, refuses absent indexes and commits nothing after a failed later command', () => {
    const w = fresh(),
      before = w.ingestion!.events.length;
    expect(runSearch(w, { search: 'index=source_logs | stats count | collect index=missing' }).status).toBe(
      'failed',
    );
    expect(w.ingestion!.events).toHaveLength(before);
    expect(
      runSearch(w, {
        search:
          'index=source_logs | stats count | collect index=summary_logs | lookup missing.csv host OUTPUT owner',
      }).status,
    ).toBe('failed');
    expect(w.ingestion!.events).toHaveLength(before);
    const ok = runSearch(w, {
      search: 'index=source_logs | stats count | addinfo | collect index=summary_logs',
    });
    expect(ok.status).toBe('done');
    expect(
      runSearch(w, { search: 'index=summary_logs | stats sum(count) as total' }).results[0]!.get('total'),
    ).toBe(3);
    expect(
      runSearch(w, { search: 'index=source_logs | stats count | collect index=summary_logs', readOnly: true })
        .status,
    ).toBe('failed');
  });
  it('keeps malformed legacy data byte-for-byte and imports a reviewed report once with scheduling off', () => {
    const w = fresh(),
      raw = JSON.stringify({
        objects: [
          {
            id: 'legacy',
            kind: 'report',
            title: 'Legacy report',
            description: 'kept',
            owner: 'admin',
            app: 'search',
            sharing: 'Private',
            search: 'index=source_logs | stats count',
            earliest: '-15m',
            latest: 'now',
            enabled: true,
            type: 'Classic',
            panels: [],
            updated: 'yesterday',
            schedule: '* * * * *',
          },
        ],
        unknown: 'preserved',
      });
    w.uiState = { 'splunk-sandbox-v3-knowledge-v1': raw, broken: '{not json' };
    const first = importLegacyReport(w, 'legacy', {
      host: 'sh01',
      app: 'search',
      owner: 'admin',
      sharing: 'Private',
    });
    expect(first.alreadyImported).toBe(false);
    expect(
      importLegacyReport(w, 'legacy', { host: 'sh01', app: 'search', owner: 'admin', sharing: 'Private' })
        .alreadyImported,
    ).toBe(true);
    expect(w.uiState['splunk-sandbox-v3-knowledge-v1']).toBe(raw);
    expect(w.reports!.archives[Object.values(w.reports!.imports)[0]!.archive]).toBe(raw);
    expect(listReports(w, 'sh01').find((r) => r.id === first.reportId)!.scheduled).toBe(false);
  });
  it('records capacity skips deterministically and isolates another world', () => {
    const w = fresh(),
      other = fresh(),
      before = saveWorld(other);
    for (let n = 0; n < 6; n++) saveReport(w, { ...input, title: 'Capacity ' + n, summaryIndex: undefined });
    tickWorld(w, 5);
    expect(w.reports!.runs.filter((r) => r.status === 'skipped')).toHaveLength(2);
    expect(saveWorld(other)).toEqual(before);
    expect(loadWorld(saveWorld(w), []).reports).toEqual(w.reports);
  });
});
