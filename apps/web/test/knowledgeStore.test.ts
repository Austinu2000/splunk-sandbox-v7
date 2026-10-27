import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SearchJobDto } from '@sandbox/shared';

let storage: Map<string, string>;
beforeEach(() => {
  vi.resetModules();
  storage = new Map();
  vi.stubGlobal('window', new EventTarget());
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('local knowledge workspace', () => {
  it('preserves panel source and permissions through reload, clone, and delete', async () => {
    const first = await import('../src/replica/knowledgeStore');
    const item = first.addKnowledgeObject({
      kind: 'dashboard',
      title: 'Forwarder health',
      sharing: 'App',
      type: 'Dashboard Studio',
      panels: [
        {
          id: 'p1',
          title: 'Health',
          search: '| inputlookup forwarder_inventory | stats count by health',
          type: 'column',
        },
      ],
    });
    first.saveKnowledge({ ...first.readKnowledge(), homeDashboard: item.id });
    vi.resetModules();
    const second = await import('../src/replica/knowledgeStore');
    const reloaded = second.readKnowledge().objects.find((o) => o.id === item.id)!;
    expect(reloaded).toEqual(item);
    const clone = second.addKnowledgeObject({ ...reloaded, title: reloaded.title });
    expect(clone.id).not.toBe(item.id);
    expect(clone.panels).toEqual(item.panels);
    second.deleteKnowledgeObject(item.id);
    expect(second.readKnowledge().homeDashboard).toBeUndefined();
    expect(second.readKnowledge().objects.find((o) => o.id === clone.id)).toBeDefined();
  });
  it('recovers from malformed persisted data without crashing the listing', async () => {
    storage.set('splunk-sandbox-v3-knowledge-v1', JSON.stringify({ objects: [null], jobs: [], recent: [] }));
    const store = await import('../src/replica/knowledgeStore');
    expect(store.readKnowledge().objects.filter((o) => o.kind === 'report')).toHaveLength(10);
    storage.set('splunk-sandbox-v3-knowledge-v1', '{broken');
    expect(store.readKnowledge().objects.filter((o) => o.kind === 'dashboard')).toHaveLength(4);
  });
  it('still edits during blocked browser storage and broadcasts the change', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('blocked');
      },
    });
    const changed = vi.fn();
    window.addEventListener('splunk-knowledge-changed', changed);
    const store = await import('../src/replica/knowledgeStore');
    const item = store.addKnowledgeObject({
      kind: 'report',
      title: 'A local report',
      search: 'index=_internal',
    });
    store.updateKnowledgeObject({ ...item, title: 'Renamed report' });
    expect(store.readKnowledge().objects.find((o) => o.id === item.id)?.title).toBe('Renamed report');
    expect(changed).toHaveBeenCalledTimes(2);
  });
  it('retains a single current record for each actual search job', async () => {
    const store = await import('../src/replica/knowledgeStore');
    const job: SearchJobDto = {
      sid: 'test_sid',
      search: '| inputlookup forwarder_inventory',
      earliest: 100,
      latest: 200,
      status: 'done',
      kind: 'statistics',
      eventCount: 0,
      resultCount: 35,
      scanCount: 35,
      hostsScanned: 35,
      truncated: false,
      runMs: 8,
      messages: [],
      timeline: [],
      timelineSpanMs: 10,
      fields: [],
      columns: ['hostname'],
      phases: [],
    };
    store.recordSearchJob(job);
    store.recordSearchJob({ ...job, resultCount: 36 });
    expect(store.readKnowledge().jobs).toHaveLength(1);
    expect(store.readKnowledge().jobs[0].resultCount).toBe(36);
  });
});
