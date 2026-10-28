import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  ingestText,
  tickWorld,
  runSearch,
  resolveHost,
  restartSplunk,
  saveWorld,
  loadWorld,
  saveReport,
  executeReport,
} from '../src';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
const fresh = () =>
  createWorld({
    ...profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/apl.yaml', import.meta.url), 'utf8')),
    ),
    fleetSize: 50,
  });
const config = (w: ReturnType<typeof fresh>, host: string, name: string, text: string) => {
  const fs = hostFs(w, resolveHost(w, host)!),
    path = '/opt/splunk/etc/apps/v7_cim/local';
  fs.mkdir(path, ROOT, { parents: true });
  fs.writeFile(path + '/' + name + '.conf', text, ROOT);
};
describe('native search-time knowledge on actual recorded events', () => {
  it('applies aliases, calculated fields, eventtypes and tags only after activating the selected dispatch host', () => {
    const w = fresh();
    tickWorld(w, 1);
    ingestText(
      w,
      'idx01',
      '/var/log/practice/auth.log',
      'v7_auth',
      'os',
      'account=alice src_ip=10.0.0.1 outcome=denied\naccount=bob src_ip=10.0.0.2 outcome=allowed\n',
    );
    config(
      w,
      'sh02',
      'props',
      '[v7_auth]\nFIELDALIAS-user = account AS user\nFIELDALIAS-src = src_ip AS src\nEVAL-action = if(outcome="denied","failure","success")\n',
    );
    config(w, 'sh02', 'eventtypes', '[v7_authentication]\nsearch = sourcetype=v7_auth\n');
    config(w, 'sh02', 'tags', '[eventtype=v7_authentication]\nauthentication = enabled\n');
    const search = 'index=os sourcetype=v7_auth tag=authentication action=failure | table user src action';
    expect(runSearch(w, { host: 'sh02', search }).results).toHaveLength(0);
    restartSplunk(w, resolveHost(w, 'sh02')!);
    const result = runSearch(w, { host: 'sh02', search });
    expect(result.status).toBe('done');
    expect(result.results.map((r) => r.toObject())).toEqual([
      { user: 'alice', src: '10.0.0.1', action: 'failure' },
    ]);
    expect(runSearch(w, { host: 'sh01', search }).results).toHaveLength(0);
    const restored = loadWorld(saveWorld(w), []);
    expect(runSearch(restored, { host: 'sh02', search }).results.map((r) => r.toObject())).toEqual(
      result.results.map((r) => r.toObject()),
    );
  });
  it('dispatches a canonical report on its own host instead of borrowing first-head configuration', () => {
    const w = fresh();
    tickWorld(w, 1);
    ingestText(
      w,
      'idx01',
      '/var/log/practice/report-auth.log',
      'v7_auth',
      'os',
      'account=alice outcome=denied\n',
    );
    config(w, 'sh02', 'props', '[v7_auth]\nFIELDALIAS-user=account AS user\n');
    restartSplunk(w, resolveHost(w, 'sh02')!);
    const report = saveReport(
      w,
      {
        host: 'sh02',
        app: 'search',
        owner: 'admin',
        sharing: 'Private',
        title: 'Scoped auth identity',
        search: 'index=os sourcetype=v7_auth | stats count by user',
      },
      { create: true },
    );
    const result = executeReport(w, report.id);
    expect(result.status).toBe('succeeded');
    expect(result.rows).toEqual([{ user: 'alice', count: 1 }]);
  });
});

import { stageDataModel, buildDataModel, activeDataModels } from '../src';
it('builds real acceleration snapshots, distinguishes summaries-only coverage and enforces current index access', () => {
  const w = fresh();
  tickWorld(w, 1);
  ingestText(
    w,
    'idx01',
    '/var/log/practice/model-auth.log',
    'v7_auth',
    'os',
    'account=alice outcome=denied\naccount=bob outcome=allowed\n',
  );
  config(
    w,
    'sh02',
    'props',
    '[v7_auth]\nFIELDALIAS-user=account AS user\nEVAL-action=if(outcome="denied","failure","success")\n',
  );
  config(w, 'sh02', 'eventtypes', '[v7_authentication]\nsearch=sourcetype=v7_auth\n');
  config(w, 'sh02', 'tags', '[eventtype=v7_authentication]\nauthentication=enabled\n');
  stageDataModel(
    w,
    'sh02',
    'v7_cim',
    JSON.stringify({
      modelName: 'Authentication',
      objects: [
        {
          objectName: 'Authentication',
          parentName: 'BaseEvent',
          constraints: [{ search: 'index=os sourcetype=v7_auth tag=authentication' }],
          fields: [
            { fieldName: 'user', type: 'string' },
            { fieldName: 'action', type: 'string' },
          ],
        },
      ],
    }),
  );
  config(w, 'sh02', 'datamodels', '[Authentication]\nacceleration=true\nacceleration.earliest_time=-15m\n');
  expect(activeDataModels(w, 'sh02')).toHaveLength(0);
  restartSplunk(w, resolveHost(w, 'sh02')!);
  const query =
    '| tstats summariesonly=true count from datamodel=Authentication.Authentication by Authentication.user';
  expect(runSearch(w, { host: 'sh02', search: query }).status).toBe('failed');
  const built = buildDataModel(w, 'sh02', 'Authentication');
  expect(built.rows).toHaveLength(2);
  expect(built.sourceScan).toBe(2);
  const result = runSearch(w, { host: 'sh02', search: query });
  expect(result.status).toBe('done');
  expect(result.results.map((r) => r.toObject())).toEqual([
    { 'Authentication.user': 'alice', count: 1 },
    { 'Authentication.user': 'bob', count: 1 },
  ]);
  ingestText(
    w,
    'idx01',
    '/var/log/practice/model-auth.log',
    'v7_auth',
    'os',
    'account=alice outcome=denied\n',
  );
  expect(
    runSearch(w, {
      host: 'sh02',
      search: '| tstats summariesonly=true count from datamodel=Authentication.Authentication',
    }).results[0]?.get('count'),
  ).toBe(2);
  expect(
    runSearch(w, {
      host: 'sh02',
      search: '| tstats count from datamodel=Authentication.Authentication',
    }).results[0]?.get('count'),
  ).toBe(3);
  buildDataModel(w, 'sh02', 'Authentication');
  const restored = loadWorld(saveWorld(w), []);
  expect(restored.dataModels).toEqual(w.dataModels);
  expect(runSearch(restored, { host: 'sh02', search: query }).results).toHaveLength(2);
  config(w, 'sh02', 'authorize', '[role_user]\nsrchIndexesDisallowed=os\n');
  restartSplunk(w, resolveHost(w, 'sh02')!);
  const denied = runSearch(w, { host: 'sh02', principal: 'analyst', search: query });
  expect(denied.status).toBe('failed');
  expect(denied.messages.some((m) => m.text.includes('cannot read all source indexes'))).toBe(true);
});

it('schedules acceleration from active cron settings and records unavailable capacity instead of manufacturing summaries', () => {
  const w = fresh();
  tickWorld(w, 1);
  ingestText(w, 'idx01', '/var/log/practice/auto-model.log', 'v7_auto', 'os', 'service=checkout\n');
  stageDataModel(
    w,
    'sh01',
    'v7_cim',
    JSON.stringify({
      modelName: 'Scheduled',
      objects: [
        {
          objectName: 'Events',
          parentName: 'BaseEvent',
          constraints: [{ search: 'index=os sourcetype=v7_auto' }],
          fields: [{ fieldName: 'service', type: 'string' }],
        },
      ],
    }),
  );
  config(
    w,
    'sh01',
    'datamodels',
    '[Scheduled]\nacceleration=true\nacceleration.earliest_time=-15m\nacceleration.cron_schedule=* * * * *\n',
  );
  const nativeFs = hostFs(w, resolveHost(w, 'sh01')!),
    limits = '/opt/splunk/etc/system/local/limits.conf';
  nativeFs.writeFile(
    limits,
    patchConf(nativeFs.exists(limits) ? nativeFs.readFile(limits, ROOT) : '', 'scheduler', {
      auto_summary_perc: '0',
    }),
    ROOT,
  );
  restartSplunk(w, resolveHost(w, 'sh01')!);
  tickWorld(w, 5);
  expect(w.dataModels?.summaries).toEqual([]);
  expect(w.dataModels?.builds.at(-1)?.status).toBe('skipped');
  nativeFs.writeFile(
    limits,
    patchConf(nativeFs.readFile(limits, ROOT), 'scheduler', { auto_summary_perc: '50' }),
    ROOT,
  );
  restartSplunk(w, resolveHost(w, 'sh01')!);
  tickWorld(w, 6);
  expect(w.dataModels?.summaries[0]?.rows).toHaveLength(1);
  expect(w.dataModels?.builds.at(-1)?.status).toBe('completed');
  expect(loadWorld(saveWorld(w), []).dataModels).toEqual(w.dataModels);
});

import { training, persistTraining } from '../src/training/engine';
it('retains previously saved legacy tstats datasets when no native definition overrides the name', () => {
  const w = fresh();
  training(w).summaries.LegacyAuth = {
    search: 'retained prior summary source',
    tick: w.clock.tick,
    rows: [{ user: 'retained-user', count: 2 }],
  };
  persistTraining(w);
  const r = runSearch(w, {
    search: '| tstats summariesonly=true sum(count) as total from datamodel=LegacyAuth',
  });
  expect(r.status).toBe('done');
  expect(r.results[0]?.get('total')).toBe(2);
  expect(
    runSearch(loadWorld(saveWorld(w), []), {
      search: '| tstats summariesonly=true sum(count) as total from datamodel=LegacyAuth',
    }).results[0]?.get('total'),
  ).toBe(2);
});
