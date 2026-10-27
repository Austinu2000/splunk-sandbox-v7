import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  enableClusterManagement,
  resolveHost,
  restartSplunk,
  tickWorld,
  runSearch,
  smartStoreView,
  evictSmartStoreBucket,
  setSmartStoreRemoteAvailability,
  saveWorld,
  loadWorld,
  advancedClusterHealth,
} from '../src';
import { applyClusterBundle } from '../src/hosts/cluster';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
function fresh() {
  const w = createWorld(
    profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
  );
  const cm = resolveHost(w, 'cm01')!,
    fs = hostFs(w, cm),
    path = '/opt/splunk/etc/manager-apps/_cluster/local/indexes.conf';
  fs.writeFile(
    path,
    fs.readFile(path, ROOT) +
      '\n[volume:remote_store]\nstorageType=remote\npath=s3://sandbox-smartstore/recorded\n[remote_events]\nrepFactor=auto\nremotePath=volume:remote_store/$_index_name\nmaxHotIdleSecs=10\n',
    ROOT,
  );
  applyClusterBundle(w, cm);
  const p = resolveHost(w, 'idx01')!,
    f = hostFs(w, p);
  f.mkdir('/var/log/practice', ROOT, { parents: true });
  f.writeFile('/var/log/practice/remote.log', 'service=checkout status=500\nservice=auth status=200\n', ROOT);
  f.writeFile(
    '/opt/splunk/etc/system/local/inputs.conf',
    '[monitor:///var/log/practice/remote.log]\nindex=remote_events\nsourcetype=app_log\n',
    ROOT,
  );
  restartSplunk(w, p);
  enableClusterManagement(w);
  tickWorld(w, 3);
  return w;
}
describe('recorded SmartStore objects and cache', () => {
  it('uploads warm data, evicts only uploaded cache, and localizes it on an actual matching search', () => {
    const w = fresh(),
      object = smartStoreView(w).objects[0]!;
    expect(object.key).toContain('s3://sandbox-smartstore/recorded/remote_events/bucket-');
    expect(object.cached.length).toBeGreaterThan(0);
    evictSmartStoreBucket(w, object.bucketId);
    expect(object.cached).toHaveLength(0);
    const unrelated = runSearch(w, { search: 'index=os | stats count' });
    expect(unrelated.status).toBe('done');
    expect(smartStoreView(w).fetches).toHaveLength(0);
    const result = runSearch(w, { search: 'index=remote_events | stats count' });
    expect(result.status).toBe('done');
    expect(result.results[0]?.get('count')).toBe(2);
    expect(smartStoreView(w).fetches).toHaveLength(1);
    expect(object.cached).toHaveLength(1);
    const restored = loadWorld(saveWorld(w), []);
    expect(restored.clusterManagement).toEqual(w.clusterManagement);
    expect(
      runSearch(restored, { search: 'index=remote_events | stats count' }).results[0]?.get('count'),
    ).toBe(2);
  });
  it('keeps cached data available during a simulated remote outage and reports uncached reads as failures', () => {
    const w = fresh(),
      object = smartStoreView(w).objects[0]!;
    setSmartStoreRemoteAvailability(w, false);
    expect(runSearch(w, { search: 'index=remote_events | stats count' }).status).toBe('done');
    evictSmartStoreBucket(w, object.bucketId);
    expect(advancedClusterHealth(w).allDataSearchable).toBe(false);
    const result = runSearch(w, { search: 'index=remote_events | stats count' });
    expect(result.status).toBe('failed');
    expect(result.messages.some((m) => m.text.includes('Remote store unavailable'))).toBe(true);
    setSmartStoreRemoteAvailability(w, true);
    expect(runSearch(w, { search: 'index=remote_events | stats count' }).results[0]?.get('count')).toBe(2);
    expect(() => evictSmartStoreBucket(w, 'hot-not-uploaded')).toThrow('successfully uploaded');
  });
});
