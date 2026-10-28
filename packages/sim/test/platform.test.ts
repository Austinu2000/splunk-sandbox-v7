import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  tickWorld,
  resolveHost,
  stopSplunk,
  startSplunk,
  ingestText,
  runSearch,
  inspectPlatform,
  platformSnapshot,
  saveWorld,
  loadWorld,
  appendRecordedEvents,
} from '../src';
import { licenseStatus, recordedLicenseUsage } from '../src/ingest/license';
const fresh = () =>
  createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
describe('V7 platform observations and actual ingest accounting', () => {
  it('records changing services and operational evidence, bounds history and replays independently', () => {
    const w = fresh();
    tickWorld(w, 1);
    const before = saveWorld(w);
    expect(loadWorld({ ...before, version: 9 }, []).platform).toBeUndefined();
    const original = inspectPlatform(w);
    expect(original.servicesDown).not.toContain('idx02');
    expect(original.servicesDown).not.toContain('ansible01');
    stopSplunk(w, resolveHost(w, 'idx02')!);
    const failed = inspectPlatform(w, 'idx02');
    expect(failed.servicesDown).toEqual(['idx02']);
    startSplunk(w, resolveHost(w, 'idx02')!);
    expect(inspectPlatform(w, 'idx02').servicesDown).toEqual([]);
    expect(platformSnapshot(w).services.find((s) => s.host === 'idx02')?.running).toBe(true);
    const restored = loadWorld(saveWorld(w), []);
    expect(restored.platform).toEqual(w.platform);
    expect(restored.platform!.observations[1]?.servicesDown).toEqual(['idx02']);
    for (let i = 0; i < 101; i++) inspectPlatform(w);
    expect(w.platform!.observations).toHaveLength(100);
    expect(restored.platform!.observations).toHaveLength(3);
  });
  it('accounts for actual input bytes in license status and native usage rows without billing summaries', () => {
    const w = fresh();
    tickWorld(w, 1);
    const before = licenseStatus(w),
      events = ingestText(
        w,
        'idx01',
        '/var/log/practice/accounted.log',
        'v7_license',
        'os',
        'service=checkout status=500\nservice=auth status=200\n',
      ),
      bytes = events.reduce((n, e) => n + e.bytes, 0);
    expect(licenseStatus(w).todayBytes - before.todayBytes).toBeCloseTo(bytes, 5);
    expect(licenseStatus(w).bySourcetype.some((s) => s.sourcetype === 'v7_license')).toBe(true);
    const event = events[0]!;
    appendRecordedEvents(w, [
      {
        time: event.time,
        indexTime: w.clock.now,
        raw: 'count=2',
        host: 'sh01',
        source: 'summary_test',
        sourcetype: 'stash',
        index: 'os',
        receiver: 'idx01',
        fields: { count: 2 },
        provenance: 'summary',
        operationId: 'summary-license-test',
      },
    ]);
    expect(
      [...recordedLicenseUsage(w, w.config.startTime, w.clock.now).values()].reduce((n, b) => n + b, 0),
    ).toBe(bytes);
    tickWorld(w, 6);
    const result = runSearch(w, {
      search: 'index=_internal source=*license_usage.log type=Usage st=v7_license | stats sum(b) as bytes',
      earliest: '-2m',
    });
    expect(result.status).toBe('done');
    expect(result.results[0]?.get('bytes')).toBe(bytes);
    expect(platformSnapshot(w).recorded.events).toBe(3);
    const restored = loadWorld(saveWorld(w), []);
    expect(licenseStatus(restored)).toEqual(licenseStatus(w));
  });
});
