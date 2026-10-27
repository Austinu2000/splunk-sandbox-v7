import { describe, expect, it } from 'vitest';
import { createWorld, TerminalSession, saveWorld, loadWorld, logAction } from '@sandbox/sim';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';

describe('V7 foundation lesson API', () => {
  it('loads real new exercises, hides answer keys, preserves attempts and restores free practice', async () => {
    const store = new SessionStore(':memory:');
    const { app, live } = buildApp(createWorld({ fleetSize: 1000 }), { store, aiGrader: null });
    try {
      const list = (await app.inject('/api/learn')).json();
      expect(list.lessons).toHaveLength(46);
      expect(list.lessons.find((l: { id: string }) => l.id === 'AU-08').checks).toBeUndefined();
      expect(list.lessons.find((l: { id: string }) => l.id === 'AU-08').questions).toHaveLength(1);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/learn/start',
            payload: { id: 'AU-08', learner: 'V7 API' },
          })
        ).statusCode,
      ).toBe(200);
      const before = (await app.inject('/api/learn')).json();
      expect(before.progress.completed).toBe(false);
      const answer = await app.inject({
        method: 'POST',
        url: '/api/learn/progress',
        payload: { answers: { count: '3' } },
      });
      expect(answer.json().completed).toBe(false);
      const term = new TerminalSession({
        world: live.world,
        onCommand: (e) =>
          logAction(
            live.world,
            { kind: 'cmd', text: e.line, host: e.host, user: e.user, success: e.success },
            0,
          ),
      });
      term.start();
      for (const line of [
        'ssh svc_ansible@ansible01',
        'cd ~/splunk-automation',
        'ansible-inventory --graph',
        'ansible indexers --list-hosts',
      ])
        term.input(line + '\r');
      term.dispose();
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/learn/progress',
            payload: { notes: 'Verified from graph and target list' },
          })
        ).json().completed,
      ).toBe(true);
      const saved = saveWorld(live.world);
      expect((await app.inject('/api/automation')).json().inventory.groups.indexers.hosts).toHaveLength(3);
      expect((await app.inject('/api/automation/targets?pattern=indexers%3A!idx03')).json().hosts).toEqual([
        'idx01',
        'idx02',
      ]);
      expect((await app.inject({ method: 'POST', url: '/api/learn/leave' })).statusCode).toBe(200);
      expect(live.world.lesson).toBeUndefined();
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/learn/start',
            payload: { id: 'AU-08', learner: 'Other' },
          })
        ).statusCode,
      ).toBe(200);
      expect((await app.inject('/api/learn')).json().progress.completed).toBe(false);
      await app.inject({ method: 'POST', url: '/api/learn/leave' });
      await app.inject({
        method: 'POST',
        url: '/api/learn/start',
        payload: { id: 'AU-08', learner: 'V7 API' },
      });
      expect((await app.inject('/api/learn')).json().progress.completed).toBe(true);
      expect(live.world.lesson?.notes).toBe('Verified from graph and target list');
      expect(loadWorld(saved, []).lesson).toEqual(live.world.lesson);
      await app.inject({
        method: 'POST',
        url: '/api/learn/start',
        payload: { id: 'AU-08', learner: 'V7 API', reset: true },
      });
      expect((await app.inject('/api/learn')).json().progress.completed).toBe(false);
      expect(store.list().some((s) => s.name === 'Before resetting AU-08')).toBe(true);
    } finally {
      await app.close();
      store.close();
    }
  });
});
