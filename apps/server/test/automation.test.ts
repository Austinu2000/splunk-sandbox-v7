import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';
import { createWorld, profileWorldConfig, saveWorld, loadWorld, TerminalSession } from '@sandbox/sim';
import { SessionStore } from '../src/store';
import { loadProfiles } from '../src/profiles';
import { buildApp } from '../src/app';

describe('automation profile persistence', () => {
  it('exposes Lab and saves terminal Git progress independently from APL', async () => {
    const store = new SessionStore(':memory:');
    const { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      const catalog = (await app.inject('/api/profiles')).json();
      expect(catalog.profiles.map((p: { id: string }) => p.id)).toContain('lab');
      expect((await app.inject({ method: 'POST', url: '/api/profiles/lab/load' })).statusCode).toBe(200);
      expect(live.world.git).toBeDefined();
      const term = new TerminalSession({ world: live.world });
      term.start();
      for (const line of ['ssh svc_ansible@ansible01', 'cd ~/splunk-automation', 'git switch -c retained'])
        term.input(line + '\r');
      term.dispose();
      const before = saveWorld(live.world);
      await app.inject({ method: 'POST', url: '/api/profiles/apl/load' });
      expect(live.world.git!.checkouts.every((c) => c.branch === 'main')).toBe(true);
      await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
      expect(saveWorld(live.world)).toEqual(before);
    } finally {
      await app.close();
      store.close();
    }
  });
  it('keeps an exact pre-upgrade backup once and can continue after SQLite reopen', () => {
    const dir = mkdtempSync(join(tmpdir(), 'automation-save-')),
      path = join(dir, 'test.db');
    let store = new SessionStore(path);
    const old = createWorld({
      ...profileWorldConfig(loadProfiles().find((p) => p.id === 'apl')!),
      automationVersion: 0,
      fleetSize: 50,
    });
    store.checkpoint(old);
    store.close();
    const db = new Database(path);
    const saved = { ...saveWorld(old), version: 2 };
    db.prepare("UPDATE sessions SET version=2,save_json=? WHERE kind='autosave'").run(JSON.stringify(saved));
    db.close();
    try {
      store = new SessionStore(path);
      const backups = store.list().filter((s) => s.slot?.startsWith('migration:git-v1:'));
      expect(backups).toHaveLength(1);
      expect(store.get(backups[0]!.id)).toEqual(saved);
      const upgraded = loadWorld(store.autosave('apl')!, []);
      expect(upgraded.git).toBeDefined();
      store.checkpoint(upgraded);
      store.close();
      store = new SessionStore(path);
      expect(store.list().filter((s) => s.slot?.startsWith('migration:git-v1:'))).toHaveLength(1);
      expect(loadWorld(store.autosave('apl')!, []).git).toEqual(upgraded.git);
    } finally {
      store.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
