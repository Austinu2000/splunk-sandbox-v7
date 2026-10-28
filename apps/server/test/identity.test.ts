import { it, expect } from 'vitest';
import {
  createWorld,
  setupFoundation,
  idpTeachingCertificate,
  SAML_AUTH_SOURCE,
  READER_ROLE_SOURCE,
  resolveHost,
  restartSplunk,
  loadWorld,
} from '@sandbox/sim';
import { hostFs } from '../../../packages/sim/src/vfs/build';
import { ROOT } from '../../../packages/sim/src/vfs/vfs';
import { buildApp } from '../src/app';
import { SessionStore } from '../src/store';
it('pins identity edits/probes to current environment and native source, with role privileges and replay intact', async () => {
  const store = new SessionStore(':memory:'),
    { app, live } = buildApp(createWorld({ fleetSize: 50 }), { store, aiGrader: null });
  try {
    await app.inject({ method: 'POST', url: '/api/profiles/lab/load' });
    setupFoundation(live.world, [{ kind: 'monitoring-fixture', mode: 'cim' }]);
    const fs = hostFs(live.world, resolveHost(live.world, 'sh01')!);
    fs.mkdir('/opt/splunk/etc/auth/idpCerts', ROOT, { parents: true });
    fs.writeFile('/opt/splunk/etc/auth/idpCerts/practice-idp.json', idpTeachingCertificate(live.world), ROOT);
    let v = (await app.inject('/api/identity')).json();
    const pins = () => ({ context: v.context, host: v.host, revision: v.revision });
    const stage = { ...pins(), action: 'stage', conf: 'authentication', source: SAML_AUTH_SOURCE };
    for (const payload of [
      { ...stage, context: 'stale' },
      { ...stage, principal: 'analyst' },
      { ...stage, sample: 'saml-reader' },
      { ...stage, source: SAML_AUTH_SOURCE + '\npassword=not-accepted\n' },
    ])
      expect((await app.inject({ method: 'POST', url: '/api/identity/action', payload })).statusCode).toBe(
        400,
      );
    expect(
      (await app.inject({ method: 'POST', url: '/api/identity/action', payload: stage })).statusCode,
    ).toBe(200);
    expect(
      (await app.inject({ method: 'POST', url: '/api/identity/action', payload: stage })).statusCode,
    ).toBe(400);
    v = (await app.inject('/api/identity')).json();
    const notActive = await app.inject({
      method: 'POST',
      url: '/api/identity/action',
      payload: { ...pins(), action: 'probe', sample: 'saml-reader' },
    });
    expect(notActive.json().authenticated).toBe(false);
    await app.inject({
      method: 'POST',
      url: '/api/identity/action',
      payload: { ...pins(), action: 'stage', conf: 'authorize', source: READER_ROLE_SOURCE },
    });
    restartSplunk(live.world, resolveHost(live.world, 'sh01')!);
    v = (await app.inject('/api/identity')).json();
    const probed = await app.inject({
      method: 'POST',
      url: '/api/identity/action',
      payload: { ...pins(), action: 'probe', sample: 'saml-reader' },
    });
    expect(probed.json().authenticated).toBe(true);
    expect(probed.json().roles).toEqual(['user']);
    const job = await app.inject({
      method: 'POST',
      url: '/api/search/jobs',
      headers: { 'x-sandbox-principal': 'analyst' },
      payload: { context: v.context, host: v.host, search: 'index=ops_logs | stats count' },
    });
    expect(job.json().results.items[0].count).toBe(3);
    expect(live.world.searchEvidence?.at(-1)).toMatchObject({ host: 'sh01', principal: 'analyst' });
    expect((await app.inject('/api/identity?principal=analyst')).statusCode).toBe(400);
    const restored = loadWorld(store.resume()!, []);
    expect(restored.identity).toEqual(live.world.identity);
    await app.inject({ method: 'POST', url: '/api/profiles/apl/load' });
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/identity/action',
          payload: { ...pins(), action: 'probe', sample: 'saml-reader' },
        })
      ).statusCode,
    ).toBe(400);
  } finally {
    await app.close();
    store.close();
  }
});
