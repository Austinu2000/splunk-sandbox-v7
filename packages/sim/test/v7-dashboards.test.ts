import { readFileSync, readdirSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  setupFoundation,
  foundationCheck,
  foundationAnswer,
  engineeringLessonSchema,
  saveWorld,
  loadWorld,
  classicSource,
  studioSource,
  saveDashboard,
  renderDashboard,
  listDashboards,
  saveReport,
  listReports,
  tickWorld,
  resolveHost,
  activateReportConf,
  activateDashboardConf,
} from '../src';
import type { FoundationCheck } from '../src/engineering/foundations';
import type { AlertConfiguration, OperationalDashboardPanel, DashboardInput } from '@sandbox/shared';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
const dir = new URL('../../../lessons/v7/', import.meta.url),
  profile = parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'));
const lessons = readdirSync(dir)
  .filter((n) => /^SP-0(?:4[7-9]|5[0-4])\.json$/.test(n))
  .map((n) => engineeringLessonSchema.parse(JSON.parse(readFileSync(new URL(n, dir), 'utf8'))));
const scope = { host: 'sh01', app: 'search', owner: 'admin', sharing: 'Private' as const };
const panel: OperationalDashboardPanel = {
  id: 'errors',
  title: 'HTTP errors',
  type: 'single',
  search: 'index=source_logs status=500 | stats count',
  earliest: '-15m',
  latest: 'now',
};
const input: DashboardInput = {
  token: 'status',
  label: 'Status',
  type: 'dropdown',
  defaultValue: '500',
  choices: [
    { label: 'Errors', value: '500' },
    { label: 'OK', value: '200' },
  ],
};
const alert: AlertConfiguration = {
  type: 'custom',
  condition: 'search count > 1',
  relation: 'greater than',
  threshold: 0,
  digest: true,
  suppress: false,
  period: '5m',
  fields: [],
  track: true,
  severity: 4,
  actions: ['notification'],
};
const advance = (w: ReturnType<typeof createWorld>) =>
  tickWorld(w, Math.ceil((60000 - (w.clock.now % 60000)) / w.config.tickMs));
function solve(w: ReturnType<typeof createWorld>, id: string) {
  if (id === 'SP-047') {
    const d = saveDashboard(
      w,
      {
        ...scope,
        name: 'http_overview',
        format: 'classic',
        source: classicSource(
          'HTTP overview',
          '',
          [],
          [{ ...panel, type: 'table', search: undefined, report: 'HTTP status report' }],
        ),
      },
      { create: true },
    );
    renderDashboard(w, d.id);
  } else if (id === 'SP-048') {
    const d = saveDashboard(
      w,
      {
        ...scope,
        name: 'http_studio',
        format: 'studio',
        source: studioSource(
          'HTTP Studio',
          '',
          [input],
          [{ ...panel, search: 'index=source_logs status=$status|s$ | stats count' }],
        ),
      },
      { create: true },
    );
    renderDashboard(w, d.id, { status: '500' });
    renderDashboard(w, d.id, { status: '200' });
  } else if (id === 'SP-049') {
    const d = listDashboards(w, 'sh01').find((d) => d.name === 'source_repair')!,
      fs = hostFs(w, resolveHost(w, 'sh01')!);
    fs.writeFile(d.sourcePath, classicSource(d.title, '', [], [panel]), ROOT);
    activateDashboardConf(w, resolveHost(w, 'sh01')!);
    renderDashboard(w, d.id);
  } else if (id === 'SP-054') {
    const d = listDashboards(w, 'sh01').find((d) => d.name === 'shared_http')!;
    const shared = saveDashboard(
      w,
      { ...scope, name: d.name, format: d.format, source: d.source, sharing: 'App' },
      { id: d.id, revision: d.revision },
    );
    renderDashboard(w, shared.id, {}, 'analyst');
  } else {
    const title =
      id === 'SP-050'
        ? 'HTTP scheduled alert'
        : id === 'SP-051'
          ? 'HTTP throttled alert'
          : id === 'SP-052'
            ? 'HTTP missing alert'
            : 'HTTP failed search';
    if (id === 'SP-052' || id === 'SP-053') advance(w);
    if (id === 'SP-053') {
      const r = listReports(w, 'sh01').find((r) => r.title === title)!,
        fs = hostFs(w, resolveHost(w, 'sh01')!);
      fs.writeFile(
        r.sourcePath,
        patchConf(fs.readFile(r.sourcePath, ROOT), title, { search: panel.search! }),
        ROOT,
      );
      activateReportConf(w, resolveHost(w, 'sh01')!);
    } else
      saveReport(
        w,
        {
          ...scope,
          title,
          search: id === 'SP-051' ? 'index=source_logs | stats count by status' : panel.search!,
          earliest: '-15m',
          latest: 'now',
          scheduled: true,
          cron: '* * * * *',
          alert:
            id === 'SP-051'
              ? {
                  ...alert,
                  type: 'number of events',
                  condition: '',
                  digest: false,
                  suppress: true,
                  fields: ['status'],
                }
              : id === 'SP-052'
                ? { ...alert, suppress: true }
                : alert,
        },
        { create: id === 'SP-050' || id === 'SP-051' },
      );
    advance(w);
    if (id === 'SP-051' || id === 'SP-052') advance(w);
  }
}
describe('V7 dashboard and alert lesson outcomes', () => {
  for (const definition of lessons) {
    describe(definition.id, () => {
      const fresh = () => {
        const w = createWorld(profileWorldConfig(profile));
        setupFoundation(w, definition.setup ?? []);
        w.lesson = {
          id: definition.id,
          learner: 'Dashboard regression',
          startedTick: w.clock.tick,
          hints: 0,
          notes: '',
        };
        return w;
      };
      const checks = definition.checks as FoundationCheck[],
        passed = (w: ReturnType<typeof fresh>) => checks.every((c) => foundationCheck(w, c)),
        answers = (w: ReturnType<typeof fresh>) => {
          w.lesson!.answers = Object.fromEntries(
            checks.filter((c) => c.kind === 'answer').map((c) => [c.id, foundationAnswer(w, c)!]),
          );
        };
      const complete = (w: ReturnType<typeof fresh>) => {
        solve(w, definition.id);
        answers(w);
      };
      it(definition.id + ':solution', () => {
        const w = fresh();
        expect(passed(w)).toBe(false);
        complete(w);
        expect(checks.map((c) => ({ label: c.label, passed: foundationCheck(w, c) }))).toEqual(
          checks.map((c) => ({ label: c.label, passed: true })),
        );
      });
      it(definition.id + ':incorrect-action', () => {
        const w = fresh();
        answers(w);
        saveReport(w, {
          ...scope,
          title: 'Unrelated alert',
          search: 'index=wrong_index | stats count',
          scheduled: true,
          cron: '* * * * *',
          alert,
        });
        advance(w);
        expect(passed(w)).toBe(false);
      });
      it(definition.id + ':no-false-completion', () => {
        const solved = fresh(),
          other = fresh();
        complete(solved);
        answers(other);
        expect(passed(solved)).toBe(true);
        expect(passed(other)).toBe(false);
      });
      it(definition.id + ':reset', () => {
        const w = fresh(),
          baseline = saveWorld(w);
        complete(w);
        expect(passed(w)).toBe(true);
        const reset = loadWorld(baseline, []);
        expect(passed(reset)).toBe(false);
        expect(saveWorld(reset).journal).toEqual(baseline.journal);
      });
      it(definition.id + ':resume', () => {
        const w = fresh();
        complete(w);
        const restored = loadWorld(saveWorld(w), []);
        expect(passed(restored)).toBe(true);
        expect(restored.dashboards).toEqual(w.dashboards);
        expect(restored.reports).toEqual(w.reports);
      });
      it(definition.id + ':isolation', () => {
        const w = fresh(),
          other = fresh(),
          before = saveWorld(other);
        complete(w);
        expect(saveWorld(other)).toEqual(before);
        expect(passed(other)).toBe(false);
      });
    });
  }
});
