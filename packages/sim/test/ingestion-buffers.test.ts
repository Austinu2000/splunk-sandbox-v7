import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  registerIngestionBuffer,
  ingestionBufferView,
  configureMonitor,
  uploadPracticeFile,
  tickWorld,
  resolveHost,
  restartSplunk,
  stopSplunk,
  startSplunk,
  runSearch,
  saveWorld,
  loadWorld,
  ingestText,
} from '../src';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
const fresh = () =>
  createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
describe('explicit recorded-input buffering and native throughput limits', () => {
  it('keeps unread/pending data, applies maxKBps only after activation and resumes the exact backlog', () => {
    const w = fresh(),
      host = resolveHost(w, 'hf01')!,
      fs = hostFs(w, host),
      limits = '/opt/splunk/etc/system/local/limits.conf',
      source = '/var/log/practice/buffer.log';
    fs.writeFile(limits, '[thruput]\nmaxKBps=1\n', ROOT);
    restartSplunk(w, host);
    registerIngestionBuffer(w, 'hf01', source);
    uploadPracticeFile(
      w,
      'hf01',
      source,
      Array.from({ length: 4 }, (_, i) => 'sequence=' + i + ' payload="' + 'x'.repeat(6000) + '"').join(
        '\n',
      ) + '\n',
    );
    configureMonitor(w, 'hf01', source, { index: 'os', sourcetype: 'v7_buffer' });
    tickWorld(w, 1);
    expect(ingestionBufferView(w)[0]).toMatchObject({ accepted: 4, delivered: 1, pending: 3 });
    const pending = loadWorld(saveWorld(w), []);
    expect(pending.ingestionBuffers).toEqual(w.ingestionBuffers);
    expect(pending.ingestion?.events).toHaveLength(1);
    fs.writeFile(limits, '[thruput]\nmaxKBps=0\n', ROOT);
    tickWorld(w, 1);
    expect(ingestionBufferView(w)[0]!.pending).toBeGreaterThan(0);
    restartSplunk(w, host);
    tickWorld(w, 1);
    expect(ingestionBufferView(w)[0]).toMatchObject({ accepted: 4, delivered: 4, pending: 0 });
    expect(
      runSearch(w, { search: 'index=os sourcetype=v7_buffer | stats count' }).results[0]?.get('count'),
    ).toBe(4);
    expect(loadWorld(saveWorld(w), []).ingestionBuffers).toEqual(w.ingestionBuffers);
  });
  it('does not discard queued data while services are unavailable or after rejected capacity writes', () => {
    const w = fresh(),
      source = '/var/log/practice/paused-buffer.log';
    registerIngestionBuffer(w, 'hf01', source);
    ingestText(w, 'hf01', source, 'v7_buffer', 'os', 'message=retained\n');
    stopSplunk(w, resolveHost(w, 'hf01')!);
    tickWorld(w, 2);
    expect(ingestionBufferView(w)[0]).toMatchObject({ pending: 1, delivered: 0 });
    startSplunk(w, resolveHost(w, 'hf01')!);
    tickWorld(w, 1);
    expect(ingestionBufferView(w)[0]).toMatchObject({ pending: 0, delivered: 1 });
    const before = structuredClone(w.ingestionBuffers),
      tooMuch = Array.from({ length: 40 }, () => 'x'.repeat(60000)).join('\n');
    expect(() => ingestText(w, 'hf01', source, 'v7_buffer', 'os', tooMuch)).toThrow('backpressure');
    expect(w.ingestionBuffers).toEqual(before);
  });
});
