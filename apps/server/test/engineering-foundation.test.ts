import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { createWorld, saveWorld, loadWorld, LEGACY_KNOWLEDGE_KEY } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
import { loadScenarioDefinitions } from '../src/scenarios';

it('keeps V6 UI and learner data intact across SQLite reopen; migration preview is read-only and profile scoped', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'v7-foundation-'));
  const path = join(dir, 'saved.db');
  let store = new SessionStore(path);
  const world = createWorld({ fleetSize: 1000 });
  world.uiState = { [LEGACY_KNOWLEDGE_KEY]: '{ malformed original', customNotes: 'retain' };
  world.lesson = { id: 'K1', learner: 'Test learner', startedTick: 0, hints: 2, notes: 'persist attempt' };
  const id = store.save(world, 'V6 attempt', 'manual', 1);
  const baseline = saveWorld(world);
  store.close();
  store = new SessionStore(path);
  const restored = loadWorld(store.get(id)!, loadScenarioDefinitions());
  const instance = buildApp(restored, { store, aiGrader: null });
  try {
    const before = saveWorld(restored);
    const response = await instance.app.inject('/api/engineering/migration');
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      mode: 'preview-only',
      profileId: 'default',
      operationalCutover: false,
      knowledgeCandidates: 0,
      issues: [{ code: 'invalid-json' }],
    });
    expect(JSON.stringify(response.json())).not.toContain('malformed original');
    expect(saveWorld(restored)).toEqual(before);
    expect(before).toEqual(baseline);
    expect(store.get(id)).toEqual(baseline);
    const profile = await instance.app.inject('/api/profile');
    expect(profile.json().uiState).toEqual(world.uiState);
    const other = buildApp(createWorld({ fleetSize: 1000 }), { aiGrader: null });
    try {
      expect((await other.app.inject('/api/engineering/migration')).json().issues).toEqual([]);
    } finally {
      await other.app.close();
    }
  } finally {
    await instance.app.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
