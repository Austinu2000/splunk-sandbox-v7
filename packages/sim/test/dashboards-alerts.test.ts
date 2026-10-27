import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  setupFoundation,
  saveWorld,
  loadWorld,
  listDashboards,
  saveDashboard,
  renderDashboard,
  classicSource,
  studioSource,
  parseDashboardSource,
  saveReport,
  executeReport,
  listReports,
  tickWorld,
  resolveHost,
  activateDashboardConf,
  activateReportConf,
  runSearch,
} from '../src';
import type { AlertConfiguration, DashboardInput, OperationalDashboardPanel } from '@sandbox/shared';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
import { testTerm } from './helpers';
const profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const fresh = () => {
  const w = createWorld(profileWorldConfig(profile));
  setupFoundation(
    w,
    JSON.parse(readFileSync(new URL('../../../lessons/v7/SP-035.json', import.meta.url), 'utf8')).setup,
  );
  return w;
};
const inputs: DashboardInput[] = [
  {
    token: 'status',
    label: 'HTTP status',
    type: 'dropdown',
    defaultValue: '500',
    choices: [
      { label: 'Errors', value: '500' },
      { label: 'OK', value: '200' },
    ],
  },
];
const panels: OperationalDashboardPanel[] = [
  {
    id: 'errors',
    title: 'HTTP responses',
    type: 'single',
    search: 'index=source_logs status=$status|s$ | stats count',
    earliest: '-15m',
    latest: 'now',
  },
];
const scope = { host: 'sh01', app: 'search', owner: 'admin', sharing: 'Private' as const };
const alert: AlertConfiguration = {
  type: 'custom',
  condition: 'search count > 1',
  relation: 'greater than',
  threshold: 0,
  digest: true,
  suppress: true,
  period: '5m',
  fields: [],
  track: true,
  severity: 4,
  actions: ['notification', 'audit'],
};
const report = (w: ReturnType<typeof fresh>, a = alert) =>
  saveReport(
    w,
    {
      ...scope,
      title: 'HTTP error alert',
      search: 'index=source_logs status=500 | stats count',
      earliest: '-15m',
      latest: 'now',
      scheduled: true,
      cron: '* * * * *',
      alert: a,
    },
    { create: true },
  );
const advance = (w: ReturnType<typeof fresh>) =>
  tickWorld(w, Math.ceil((60000 - (w.clock.now % 60000)) / w.config.tickMs));
describe('canonical dashboards and result-driven alerts', () => {
  for (const format of ['classic', 'studio'] as const)
    it('persists ' + format + ' views, substitutes inputs and renders actual data without writes', () => {
      const w = fresh(),
        source =
          format === 'classic'
            ? classicSource('HTTP dashboard', 'Recorded data', inputs, panels)
            : studioSource('HTTP dashboard', 'Recorded data', inputs, panels);
      const d = saveDashboard(w, { ...scope, name: 'http_dashboard', format, source }, { create: true });
      expect(d.issues).toEqual([]);
      expect(d.inputs).toEqual(inputs);
      expect(d.panels[0]?.type).toBe('single');
      const r = renderDashboard(w, d.id);
      expect(r.panels[0]).toMatchObject({ status: 'done', rows: [{ count: 2 }] });
      expect(renderDashboard(w, d.id, { status: '200' }).panels[0]).toMatchObject({
        status: 'done',
        rows: [{ count: 1 }],
      });
      expect(() => renderDashboard(w, d.id, { status: 'arbitrary' })).toThrow('Invalid value');
      const restored = loadWorld(saveWorld(w), []);
      expect(listDashboards(restored, 'sh01').find((x) => x.id === d.id)).toEqual(d);
      expect(restored.dashboards).toEqual(w.dashboards);
      const before = w.ingestion?.events.length;
      const bad = saveDashboard(
        w,
        {
          ...scope,
          name: 'write_attempt',
          format: 'classic',
          source: classicSource(
            'No writes',
            '',
            [],
            [{ ...panels[0]!, search: 'index=source_logs | collect index=source_logs' }],
          ),
        },
        { create: true },
      );
      expect(renderDashboard(w, bad.id).panels[0]?.status).toBe('failed');
      expect(w.ingestion?.events.length).toBe(before);
    });
  it('keeps disk edits staged, shares through metadata and enforces source revisions and viewer access', () => {
    const w = fresh(),
      source = classicSource('Private view', '', inputs, panels),
      d = saveDashboard(w, { ...scope, name: 'private_view', format: 'classic', source }, { create: true });
    expect(listDashboards(w, 'sh01', 'analyst').some((v) => v.name === 'private_view')).toBe(false);
    const moved = saveDashboard(
      w,
      { ...scope, name: d.name, format: d.format, source, sharing: 'App' },
      { id: d.id, revision: d.revision },
    );
    expect(listDashboards(w, 'sh01').filter((v) => v.name === d.name)).toHaveLength(1);
    expect(listDashboards(w, 'sh01', 'analyst').some((v) => v.id === moved.id)).toBe(true);
    expect(renderDashboard(w, moved.id, {}, 'analyst').panels[0]?.rows).not.toEqual([{ count: 2 }]);
    expect(() =>
      saveDashboard(
        w,
        { ...scope, name: moved.name, format: 'classic', source, sharing: 'App' },
        { principal: 'analyst', id: moved.id, revision: moved.revision },
      ),
    ).toThrow('Only admin');
    const fs = hostFs(w, resolveHost(w, 'sh01')!);
    fs.writeFile(moved.sourcePath, source.replace('Private view', 'Edited on disk'), ROOT);
    expect(listDashboards(w, 'sh01').find((v) => v.id === moved.id)?.title).toBe('Private view');
    expect(() =>
      saveDashboard(
        w,
        { ...scope, name: moved.name, format: 'classic', source, sharing: 'App' },
        { id: moved.id, revision: moved.revision },
      ),
    ).toThrow('changed');
    activateDashboardConf(w, resolveHost(w, 'sh01')!);
    expect(listDashboards(w, 'sh01').find((v) => v.id === moved.id)?.title).toBe('Edited on disk');
  });
  it('rejects unsupported/malformed source instead of inventing panel behavior', () => {
    expect(() =>
      parseDashboardSource(
        '<!DOCTYPE dashboard [<!ENTITY x SYSTEM "file:///secret">]><dashboard/>',
        'classic',
      ),
    ).toThrow();
    expect(() =>
      parseDashboardSource('<dashboard><label>X</label><html>script</html></dashboard>', 'classic'),
    ).toThrow('Unsupported');
    expect(() =>
      parseDashboardSource(
        JSON.stringify({ title: 'X', visualizations: {}, dataSources: {}, script: 'x' }),
        'studio',
      ),
    ).toThrow();
    const w = fresh(),
      d = saveDashboard(w, {
        ...scope,
        name: 'missing_report',
        format: 'classic',
        source: classicSource(
          'Missing reference',
          '',
          [],
          [{ ...panels[0]!, search: undefined, report: 'No such report' }],
        ),
      });
    expect(renderDashboard(w, d.id).panels[0]).toMatchObject({
      status: 'failed',
      error: 'Referenced report is unavailable or invalid',
    });
  });
  it('creates native view files through simulated REST and reads the same canonical catalog', () => {
    const w = fresh(),
      t = testTerm(w),
      xml = classicSource(
        'REST dashboard',
        '',
        [],
        [{ ...panels[0]!, search: 'index=source_logs | stats count' }],
      ),
      fs = hostFs(w, resolveHost(w, 'sh01')!);
    fs.writeFile('/tmp/view.xml', xml, ROOT);
    t.run('ssh splunk@sh01');
    const output = t.run(
      'curl -k -u admin:training-only -X POST https://sh01:8089/servicesNS/admin/search/data/ui/views --data-urlencode name=rest_view --data-urlencode eai:data@/tmp/view.xml',
    );
    expect(output).toContain('rest_view');
    expect(listDashboards(w, 'sh01').find((d) => d.name === 'rest_view')?.title).toBe('REST dashboard');
    t.session.dispose();
  });
  it('schedules real searches, tests their result predicate, suppresses repeats and resumes receipts', () => {
    const w = fresh(),
      r = report(w);
    advance(w);
    const run = w.reports!.runs.find((x) => x.reportId === r.id)!;
    expect(run, run.error).toMatchObject({
      status: 'succeeded',
      resultCount: 1,
      rows: [{ count: 2 }],
      alert: { matched: true, triggered: 1, suppressed: 0 },
    });
    advance(w);
    expect(w.reports!.runs.at(-1)?.alert).toMatchObject({ triggered: 0, suppressed: 1 });
    expect(w.reports!.alerts!.notifications).toHaveLength(1);
    const restored = loadWorld(saveWorld(w), []);
    expect(restored.reports).toEqual(w.reports);
    advance(restored);
    expect(restored.reports!.runs.at(-1)?.alert?.suppressed).toBe(1);
    const changed = saveReport(
      w,
      {
        ...scope,
        title: r.title,
        search: r.search,
        scheduled: true,
        cron: '* * * * *',
        alert: { ...alert, condition: 'search count > 3' },
      },
      { id: r.id, revision: listReports(w, 'sh01').find((x) => x.id === r.id)!.revision },
    );
    expect(executeReport(w, changed.id).alert).toMatchObject({ matched: false, triggered: 0 });
  });
  it('distinguishes result count from a transformed count, supports keyed suppression and refuses missing fields', () => {
    const w = fresh(),
      r = report(w, { ...alert, type: 'number of events', condition: '', threshold: 1 });
    expect(executeReport(w, r.id).alert?.matched).toBe(false);
    const p = saveReport(
      w,
      {
        ...scope,
        title: 'Per status',
        search: 'index=source_logs | stats count by status',
        alert: {
          ...alert,
          type: 'number of events',
          condition: '',
          threshold: 0,
          digest: false,
          fields: ['status'],
        },
      },
      { create: true },
    );
    expect(executeReport(w, p.id).alert).toMatchObject({ triggered: 2, suppressed: 0 });
    expect(executeReport(w, p.id).alert).toMatchObject({ triggered: 0, suppressed: 2 });
    const bad = saveReport(
      w,
      {
        ...scope,
        title: 'Missing field',
        search: 'index=source_logs | stats count',
        alert: { ...alert, digest: false, fields: ['absent'] },
      },
      { create: true },
    );
    const prior = w.reports!.alerts!.notifications.length;
    expect(executeReport(w, bad.id)).toMatchObject({ status: 'failed' });
    expect(w.reports!.alerts!.notifications).toHaveLength(prior);
  });
  it('preserves a failed scheduled search and creates no false trigger, then recovers from corrected config', () => {
    const w = fresh(),
      r = saveReport(
        w,
        {
          ...scope,
          title: 'Broken alert',
          search: 'index=source_logs | no_such_command',
          scheduled: true,
          cron: '* * * * *',
          alert,
        },
        { create: true },
      );
    advance(w);
    expect(w.reports!.runs.at(-1)).toMatchObject({ status: 'failed' });
    expect(w.reports!.alerts?.notifications ?? []).toHaveLength(0);
    const fs = hostFs(w, resolveHost(w, 'sh01')!);
    fs.writeFile(
      r.sourcePath,
      patchConf(fs.readFile(r.sourcePath, ROOT), r.title, {
        search: 'index=source_logs status=500 | stats count',
      }),
      ROOT,
    );
    activateReportConf(w, resolveHost(w, 'sh01')!);
    advance(w);
    expect(w.reports!.runs.at(-1), w.reports!.runs.at(-1)?.error).toMatchObject({
      status: 'succeeded',
      alert: { triggered: 1 },
    });
    expect(runSearch(w, { search: 'index=source_logs | stats count' }).results[0]?.get('count')).toBe(3);
  });
});
