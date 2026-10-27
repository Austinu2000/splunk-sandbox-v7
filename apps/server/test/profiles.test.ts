import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { describe, it, expect } from 'vitest';
import { createWorld, tickWorld, saveWorld, loadWorld, SAVE_VERSION } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
import { loadScenarioDefinitions } from '../src/scenarios';

describe('environment persistence', () => {
  it('continues independent clock, UI and ticket state after switching and reopening SQLite', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'v4-profiles-'));
    const db = join(dir, 'sessions.db');
    let store = new SessionStore(db);
    let instance = buildApp(createWorld({ fleetSize: 1000 }), { store, aiGrader: null });
    const post = (url: string, payload?: unknown) =>
      instance.app.inject({ method: 'POST', url, ...(payload ? { payload } : {}) });
    try {
      expect((await post('/api/profiles/apl/load')).statusCode).toBe(200);
      tickWorld(instance.live.world, 6);
      expect(
        (await post('/api/profile/ui', { profileId: 'apl', state: { dashboard: 'APL-only' } })).statusCode,
      ).toBe(200);
      expect((await post('/api/scenarios/apl-aws-flowlogs-stalled/start')).statusCode).toBe(200);
      tickWorld(instance.live.world, 6);
      const apl = saveWorld(instance.live.world);
      expect((await post('/api/profiles/erie/load')).statusCode).toBe(200);
      expect(instance.live.world.config.profileId).toBe('erie');
      expect(instance.live.world.uiState).toEqual({});
      expect(
        (await post('/api/profile/ui', { profileId: 'apl', state: { dashboard: 'wrong' } })).statusCode,
      ).toBe(409);
      tickWorld(instance.live.world, 9);
      store.checkpoint(instance.live.world);
      expect(
        store
          .list()
          .filter((s) => s.kind === 'autosave')
          .map((s) => s.profileId)
          .sort(),
      ).toEqual(['apl', 'default', 'erie']);
      await instance.app.close();
      store.close();
      store = new SessionStore(db);
      expect(store.activeProfile()).toBe('erie');
      const restored = loadWorld(store.autosave(store.activeProfile()!)!, loadScenarioDefinitions());
      expect(restored.clock.tick).toBe(9);
      instance = buildApp(restored, { store, aiGrader: null });
      expect((await post('/api/profiles/apl/load')).statusCode).toBe(200);
      expect(saveWorld(instance.live.world)).toEqual(apl);
      expect((await post('/api/profiles/apl/reset')).statusCode).toBe(200);
      expect(instance.live.world.clock.tick).toBe(0);
      expect(instance.live.world.uiState).toEqual({});
      const backup = store.list().find((s) => s.slot === 'autosave:apl:previous')!;
      expect(store.get(backup.id)).toEqual(apl);
      expect((await post(`/api/sessions/${backup.id}/load`)).statusCode).toBe(200);
      expect(instance.live.world.uiState.dashboard).toBe('APL-only');
      expect((await post('/api/profiles/unknown/load')).statusCode).toBe(400);
      expect(instance.live.world.config.profileId).toBe('apl');
    } finally {
      await instance.app.close();
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  }, 60000);
  it('migrates a v3 database with one global autosave without losing the save', () => {
    const dir = mkdtempSync(join(tmpdir(), 'v4-migrate-'));
    const file = join(dir, 'old.db');
    const db = new Database(file);
    db.exec(
      `CREATE TABLE sessions(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,kind TEXT NOT NULL,seed TEXT NOT NULL,fleet_size INTEGER NOT NULL,tick INTEGER NOT NULL,sim_time INTEGER NOT NULL,saved_at INTEGER NOT NULL,version INTEGER NOT NULL,save_json TEXT NOT NULL);CREATE UNIQUE INDEX one_autosave ON sessions(kind) WHERE kind='autosave';`,
    );
    const w = createWorld({ fleetSize: 1000 });
    const save = saveWorld(w);
    const v1 = {
      version: 1,
      seed: save.seed,
      fleetSize: save.fleetSize,
      tick: save.tick,
      speed: save.speed,
      paused: save.paused,
      journal: save.journal,
    };
    db.prepare(
      'INSERT INTO sessions(name,kind,seed,fleet_size,tick,sim_time,saved_at,version,save_json) VALUES(?,?,?,?,?,?,?,?,?)',
    ).run('Autosave', 'autosave', w.config.seed, 1000, 0, w.clock.now, 1, 1, JSON.stringify(v1));
    db.close();
    const store = new SessionStore(file);
    try {
      expect(store.autosave('default')).toEqual(v1);
      store.checkpoint(w);
      expect(store.list()).toHaveLength(1);
      expect(store.autosave('default')!.version).toBe(SAVE_VERSION);
    } finally {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
