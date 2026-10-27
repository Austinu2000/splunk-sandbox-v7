import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  changeIndex,
  indexBuckets,
  thawPracticeBucket,
  appendRecordedEvents,
  tickWorld,
  runSearch,
  saveWorld,
  loadWorld,
  restartSplunk,
  resolveHost,
} from '../src/index';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
import { patchConf } from '../src/scenario/engine';
const fresh = () => {
  const w = createWorld(
      profileWorldConfig(
        parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
      ),
    ),
    h = resolveHost(w, 'idx01')!,
    fs = hostFs(w, h),
    file = '/opt/splunk/etc/system/local/server.conf';
  fs.writeFile(file, patchConf(fs.readFile(file, ROOT), 'clustering', { mode: 'disabled' }), ROOT);
  restartSplunk(w, h);
  changeIndex(
    w,
    'idx01',
    'lifecycle',
    {
      maxHotIdleSecs: 10,
      maxWarmDBCount: 1,
      frozenTimePeriodInSecs: 60,
      coldToFrozenDir: '/archive/lifecycle',
    },
    { create: true },
  );
  return w;
};
const add = (w: ReturnType<typeof fresh>, id: string) =>
  appendRecordedEvents(w, [
    {
      time: w.clock.now,
      indexTime: w.clock.now,
      raw: 'status=200',
      host: 'idx01',
      source: 'lifecycle-test',
      sourcetype: 'log',
      index: 'lifecycle',
      receiver: 'idx01',
      fields: {},
      provenance: 'input',
      operationId: id,
    },
  ]);
describe('recorded-data bucket lifecycle', () => {
  it('rolls idle hot buckets to warm, exceeds warm limit to cold, freezes and explicitly thaws archived data', () => {
    const w = fresh();
    add(w, 'first');
    expect(indexBuckets(w)[0]!.state).toBe('hot');
    tickWorld(w, 1);
    expect(indexBuckets(w)[0]!.state).toBe('warm');
    add(w, 'second');
    tickWorld(w, 1);
    expect(indexBuckets(w).map((b) => b.state)).toEqual(['cold', 'warm']);
    expect(
      runSearch(w, { search: '| dbinspect index=lifecycle | stats count by state' }).results,
    ).toHaveLength(2);
    tickWorld(w, 7);
    const frozen = indexBuckets(w);
    expect(frozen.every((b) => b.state === 'frozen' && b.archived)).toBe(true);
    expect(runSearch(w, { search: 'index=lifecycle | stats count' }).results[0]!.get('count')).toBe(0);
    changeIndex(w, 'idx01', 'lifecycle', { frozenTimePeriodInSecs: 99999 });
    expect(indexBuckets(w).every((b) => b.state === 'frozen')).toBe(true);
    expect(() => thawPracticeBucket(w, frozen[0]!.id, 'analyst')).toThrow(/Permission/);
    thawPracticeBucket(w, frozen[0]!.id);
    expect(indexBuckets(w)[0]!.state).toBe('thawed');
    expect(indexBuckets(w)[0]!.path).toContain('thaweddb');
    expect(runSearch(w, { search: 'index=lifecycle | stats count' }).results[0]!.get('count')).toBe(1);
    const loaded = loadWorld(saveWorld(w), []);
    expect(indexBuckets(loaded)).toEqual(indexBuckets(w));
  });
  it('does not resurrect deleted frozen data when retention increases', () => {
    const w = fresh();
    changeIndex(w, 'idx01', 'lifecycle', { coldToFrozenDir: '' });
    restartSplunk(w, resolveHost(w, 'idx01')!);
    add(w, 'deleted');
    tickWorld(w, 8);
    const b = indexBuckets(w)[0]!;
    expect(b.archived).toBe(false);
    expect(() => thawPracticeBucket(w, b.id)).toThrow(/archived/);
    changeIndex(w, 'idx01', 'lifecycle', { frozenTimePeriodInSecs: 99999 });
    expect(indexBuckets(w)[0]!.state).toBe('frozen');
  });
});
