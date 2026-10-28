import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  createWorld,
  parseProfile,
  profileWorldConfig,
  setupFoundation,
  stageIdentitySource,
  SAML_AUTH_SOURCE,
  LDAP_AUTH_SOURCE,
  READER_ROLE_SOURCE,
  idpTeachingCertificate,
  probeIdentity,
  evaluateIdentity,
  resolveHost,
  restartSplunk,
  saveWorld,
  loadWorld,
  runSearch,
} from '../src';
import { hostFs } from '../src/vfs/build';
import { ROOT } from '../src/vfs/vfs';
const fresh = () => {
  const w = createWorld({
    ...profileWorldConfig(
      parseProfile(readFileSync(new URL('../../../profiles/lab.yaml', import.meta.url), 'utf8')),
    ),
    fleetSize: 50,
  });
  setupFoundation(w, [{ kind: 'monitoring-fixture', mode: 'cim' }]);
  const fs = hostFs(w, resolveHost(w, 'sh01')!);
  fs.mkdir('/opt/splunk/etc/auth/idpCerts', ROOT, { parents: true });
  fs.writeFile('/opt/splunk/etc/auth/idpCerts/practice-idp.json', idpTeachingCertificate(w), ROOT);
  return w;
};
const activate = (w: ReturnType<typeof fresh>) => restartSplunk(w, resolveHost(w, 'sh01')!);
describe('bounded native identity probes and shared role access', () => {
  it('keeps staged SAML inactive, then validates trust/attributes/groups and actual restricted source visibility', () => {
    const w = fresh();
    stageIdentitySource(w, 'sh01', 'authentication', SAML_AUTH_SOURCE);
    stageIdentitySource(w, 'sh01', 'authorize', READER_ROLE_SOURCE);
    expect(probeIdentity(w, 'sh01', 'saml-reader').authenticated).toBe(false);
    activate(w);
    const p = probeIdentity(w, 'sh01', 'saml-reader');
    expect(p.authenticated).toBe(true);
    expect(p.roles).toEqual(['user']);
    expect(p.indexes.find((i) => i.index === 'ops_logs')).toMatchObject({ allowed: true, recordedEvents: 3 });
    expect(p.capabilities).toEqual({ indexes_edit: false, edit_roles: false, edit_monitor: false });
    const query = runSearch(w, {
      host: 'sh01',
      principal: 'analyst',
      search: 'index=ops_logs | stats count',
    });
    expect(query.results[0]?.get('count')).toBe(3);
    const restored = loadWorld(saveWorld(w), []);
    expect(restored.identity).toEqual(w.identity);
    expect(evaluateIdentity(restored, 'sh01', 'saml-reader')).toMatchObject({
      authenticated: true,
      roles: ['user'],
    });
  });
  it('distinguishes audience, signature/trust, attribute and role failures without changing live browser authentication', () => {
    const w = fresh();
    for (const [source, message] of [
      [SAML_AUTH_SOURCE.replace('entityId=sandbox-v7', 'entityId=wrong'), 'audience'],
      [SAML_AUTH_SOURCE.replace('signedAssertion=true', 'signedAssertion=false'), 'signature'],
      [SAML_AUTH_SOURCE.replace('role=groups', 'role=missing'), 'attribute'],
      [SAML_AUTH_SOURCE.replace('SocReaders', 'socreaders'), 'role mapping'],
    ]) {
      stageIdentitySource(w, 'sh01', 'authentication', source);
      activate(w);
      const p = probeIdentity(w, 'sh01', 'saml-reader');
      expect(p.authenticated).toBe(false);
      expect(p.error).toContain(message);
    }
    stageIdentitySource(w, 'sh01', 'authentication', SAML_AUTH_SOURCE);
    const fs = hostFs(w, resolveHost(w, 'sh01')!);
    fs.writeFile(
      '/opt/splunk/etc/auth/idpCerts/practice-idp.json',
      idpTeachingCertificate(w).replace('training-idp-v1', 'wrong-idp'),
      ROOT,
    );
    activate(w);
    expect(probeIdentity(w, 'sh01', 'saml-reader').error).toContain('signer');
    fs.writeFile(
      '/opt/splunk/etc/auth/idpCerts/practice-idp.json',
      JSON.stringify({
        format: 'sandbox-idp-certificate-v1',
        fingerprint: 'training-idp-v1',
        notAfter: w.clock.now - 1,
      }),
      ROOT,
    );
    activate(w);
    expect(probeIdentity(w, 'sh01', 'saml-reader').error).toContain('expired');
    expect(w.identity!.probes).toHaveLength(6);
  });
  it('evaluates native LDAP search bases/attributes/filters and honors current custom roles/denies', () => {
    const w = fresh();
    stageIdentitySource(w, 'sh01', 'authentication', LDAP_AUTH_SOURCE.replace('ou=People', 'ou=Wrong'));
    activate(w);
    expect(probeIdentity(w, 'sh01', 'ldap-reader').error).toContain('search bases');
    stageIdentitySource(
      w,
      'sh01',
      'authentication',
      LDAP_AUTH_SOURCE + '\n[practice_ldap]\nuserBaseFilter=(uid=nobody)\n',
    );
    activate(w);
    expect(probeIdentity(w, 'sh01', 'ldap-reader').error).toContain('filters');
    stageIdentitySource(
      w,
      'sh01',
      'authentication',
      LDAP_AUTH_SOURCE.replace('user=SocReaders', 'soc_reader=SocReaders'),
    );
    stageIdentitySource(
      w,
      'sh01',
      'authorize',
      '[role_soc_reader]\nimportRoles=user\nsrchIndexesAllowed=ops_logs\nsrchIndexesDefault=ops_logs\nsrchIndexesDisallowed=notable;_*\n',
    );
    activate(w);
    const p = probeIdentity(w, 'sh01', 'ldap-reader');
    expect(p.authenticated).toBe(true);
    expect(p.roles).toEqual(['soc_reader']);
    expect(p.indexes.find((i) => i.index === 'ops_logs')?.recordedEvents).toBe(3);
    expect(p.capabilities.indexes_edit).toBe(false);
    const before = saveWorld(w);
    evaluateIdentity(w, 'sh01', 'ldap-reader');
    expect(saveWorld(w)).toEqual(before);
    expect(() => probeIdentity(w, 'sh01', 'ldap-reader', 'analyst')).toThrow('edit_roles');
    expect(() =>
      stageIdentitySource(
        w,
        'sh01',
        'authentication',
        LDAP_AUTH_SOURCE.replace('training-only', 'real-looking-secret'),
      ),
    ).toThrow('credentials');
    stageIdentitySource(w, 'sh01', 'authorize', '[role_soc_reader]\nimportRoles=soc_reader\n');
    activate(w);
    expect(probeIdentity(w, 'sh01', 'ldap-reader').error).toContain('Circular');
  });
});
