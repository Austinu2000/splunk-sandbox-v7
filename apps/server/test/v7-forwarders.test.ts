import { SessionStore } from '../src/store';
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  saveWorld,
  runningConf,
  resolveHost,
} from '@sandbox/sim';
import { buildApp } from '../src/app';
describe('V7 Deployment Server administration', () => {
  it('stages, publishes and delivers shared configuration with revision/permission/context guards', async () => {
    const store = new SessionStore(':memory:');
    const { app, live } = buildApp(
      createWorld(
        profileWorldConfig(
          parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
        ),
      ),
      { aiGrader: null, store },
    );
    try {
      let source = (await app.inject('/api/ds/config')).json();
      const body = {
        context: source.context,
        revision: source.revision,
        name: 'v7_api',
        files: {
          'local/inputs.conf': '[monitor:///var/log/practice/api.log]\nindex = os\nsourcetype = v7_api\n',
        },
      };
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/ds/apps',
            payload: { ...body, principal: 'analyst' },
          })
        ).statusCode,
      ).toBe(400);
      expect((await app.inject({ method: 'POST', url: '/api/ds/apps', payload: body })).statusCode).toBe(200);
      expect((await app.inject({ method: 'POST', url: '/api/ds/apps', payload: body })).statusCode).toBe(400);
      source = (await app.inject('/api/ds/config')).json();
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/ds/serverclasses',
            payload: {
              context: source.context,
              revision: source.revision,
              name: 'v7_api',
              whitelist: ['lab-lnx-0001'],
              blacklist: [],
              apps: ['v7_api'],
              restart: true,
            },
          })
        ).statusCode,
      ).toBe(200);
      source = (await app.inject('/api/ds/config')).json();
      const host = resolveHost(live.world, 'lab-lnx-0001')!;
      expect(runningConf(live.world, host, 'inputs').stanzas.has('monitor:///var/log/practice/api.log')).toBe(
        false,
      );
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/forwarders/action',
            payload: { context: source.context, host: host.hostname, action: 'track' },
          })
        ).statusCode,
      ).toBe(200);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/ds/publish',
            payload: { context: source.context, revision: source.revision },
          })
        ).statusCode,
      ).toBe(200);
      expect(runningConf(live.world, host, 'inputs').stanzas.has('monitor:///var/log/practice/api.log')).toBe(
        false,
      );
      await app.inject({
        method: 'POST',
        url: '/api/forwarders/advance',
        payload: { context: source.context },
      });
      const detail = (await app.inject('/api/forwarders/detail?host=' + host.hostname)).json();
      expect(detail.apps).toContain('v7_api');
      expect(detail.runningCatalog).toBe(detail.downloadedCatalog);
      expect(runningConf(live.world, host, 'inputs').stanzas.has('monitor:///var/log/practice/api.log')).toBe(
        true,
      );
      await app.inject({
        method: 'POST',
        url: '/api/learn/start',
        payload: { id: 'AU-20', learner: 'Forwarder API' },
      });
      const after = saveWorld(live.world);
      expect(
        (
          await app.inject({
            method: 'POST',
            url: '/api/forwarders/action',
            payload: { context: source.context, host: host.hostname, action: 'stop' },
          })
        ).statusCode,
      ).toBe(400);
      expect(saveWorld(live.world)).toEqual(after);
    } finally {
      await app.close();
      store.close();
    }
  });
});
