import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createWorld, parseProfile, profileWorldConfig, saveWorld } from '@sandbox/sim';
import { buildApp } from '../src/app';
describe('V7 automation writes', () => {
  it('adds reviewed working files, rejects stale revisions and lesson-swapped requests', async () => {
    const profile = parseProfile(
      readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8'),
    );
    const { app, live } = buildApp(createWorld(profileWorldConfig(profile)), { aiGrader: null });
    try {
      const view = (await app.inject('/api/automation')).json();
      const before = structuredClone(live.world.git!.repos);
      const install = await app.inject({
        method: 'POST',
        url: '/api/automation/starters',
        payload: { context: view.context, revision: view.starters.revision },
      });
      expect(install.statusCode).toBe(200);
      expect(live.world.git!.repos).toEqual(before);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/automation/starters',
            payload: { context: view.context, revision: view.starters.revision },
          })
        ).statusCode,
      ).toBe(400);
      const code = (await app.inject('/api/code')).json(),
        revision = code.repos.find((r: { id: string }) => r.id === 'splunk-automation').branches.main;
      const payload = {
        repo: 'splunk-automation',
        branch: 'main',
        path: 'playbooks/ping.yml',
        context: code.context,
        expectedCommit: 'outdated',
      };
      expect((await app.inject({ method: 'POST', url: '/api/code/run', payload })).statusCode).toBe(400);
      await app.inject({
        method: 'POST',
        url: '/api/learn/start',
        payload: { id: 'AU-21', learner: 'Automation API' },
      });
      const saved = saveWorld(live.world);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/code/run',
            payload: { ...payload, expectedCommit: revision },
          })
        ).statusCode,
      ).toBe(400);
      expect(saveWorld(live.world)).toEqual(saved);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/automation/starters',
            payload: { context: view.context, revision: view.starters.revision },
          })
        ).statusCode,
      ).toBe(400);
      const list = (await app.inject('/api/learn')).json();
      expect(list.lessons.find((l: { id: string }) => l.id === 'AU-27').instructions).toContain('git revert');
      expect(list.lessons.find((l: { id: string }) => l.id === 'AU-27').setup).toBeUndefined();
    } finally {
      await app.close();
    }
  });
});
