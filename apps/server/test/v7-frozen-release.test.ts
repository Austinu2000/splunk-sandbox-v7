import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { createWorld, saveWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
const plan = JSON.parse(
  readFileSync(new URL('../../../docs/V7-CURRICULUM-PLAN.json', import.meta.url), 'utf8'),
);
for (const id of plan.existingLessonIds as string[]) {
  it('inherited:' + id + ':start-resume-reset-isolation', async () => {
    const store = new SessionStore(':memory:');
    const { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
    try {
      expect((await app.inject({ method: 'POST', url: '/api/profiles/lab/load' })).statusCode).toBe(200);
      live.world.uiState = { frozenAudit: 'preserve original free-practice notes' };
      const before = saveWorld(live.world);
      const start = (reset = false) =>
        app.inject({
          method: 'POST',
          url: '/api/learn/start',
          payload: { id, learner: 'Release verification', reset },
        });
      expect((await start()).statusCode).toBe(200);
      expect(live.world.lesson?.id).toBe(id);
      const catalog = (await app.inject('/api/learn')).json();
      expect(catalog.lessons).toHaveLength(169);
      expect(catalog.active.id).toBe(id);
      expect(catalog.progress.checks.length).toBeGreaterThan(0);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/learn/progress',
            payload: { notes: id + ' retained notes' },
          })
        ).statusCode,
      ).toBe(200);
      expect((await app.inject({ method: 'POST', url: '/api/learn/leave' })).statusCode).toBe(200);
      expect(saveWorld(live.world)).toEqual(before);
      expect((await start()).statusCode).toBe(200);
      expect(live.world.lesson?.notes).toBe(id + ' retained notes');
      const backupsBefore = store.list().filter((row) => row.kind === 'manual').length;
      expect((await start(true)).statusCode).toBe(200);
      expect(live.world.lesson?.notes).toBe('');
      expect(store.list().filter((row) => row.kind === 'manual')).toHaveLength(backupsBefore + 1);
      expect((await app.inject({ method: 'POST', url: '/api/learn/leave' })).statusCode).toBe(200);
      expect(saveWorld(live.world)).toEqual(before);
    } finally {
      await app.close();
      store.close();
    }
  });
}
it('rejects all deferred capstones without changing the active free-practice session', async () => {
  const store = new SessionStore(':memory:');
  const { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    const before = saveWorld(live.world);
    for (const lesson of plan.lessons.filter((l: { executable: boolean }) => !l.executable)) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/learn/start',
        payload: { id: lesson.id, learner: 'Release verification' },
      });
      expect(response.statusCode).toBe(400);
      expect(response.json().error).toBe('Unknown lesson');
      expect(saveWorld(live.world)).toEqual(before);
    }
  } finally {
    await app.close();
    store.close();
  }
});
