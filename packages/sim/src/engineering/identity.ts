import type { IdentityProbe, PracticePrincipal } from '@sandbox/shared';
import type { World } from '../world';
import { resolveHost, splunkdRunning } from '../hosts/profile';
import { runningConf, runningVfs } from '../hosts/running';
import { setting } from '../conf/merge';
import { confBool } from '../conf/parse';
import { hostFs } from '../vfs/build';
import { ROOT } from '../vfs/vfs';
import { filesUnder, checksum } from '../hosts/cluster';
import { mappedRoleSettings, indexAllowedByRole, requireCapability, OperationsError } from './access';
import { activeIndexNames } from './indexes';
import { searchableRecordedEvents } from './lifecycle';
import { journal } from '../journal';
export const SAML_AUTH_SOURCE =
  '[authentication]\nauthType=SAML\nauthSettings=samlv2\n[samlv2]\nentityId=sandbox-v7\nidpSSOUrl=https://idp.practice.invalid/sso\nidpCertPath=practice-idp.json\nsignedAssertion=true\n[authenticationResponseAttrMap_SAML]\nrole=groups\n[roleMap_samlv2]\nuser=SocReaders\n';
export const LDAP_AUTH_SOURCE =
  '[authentication]\nauthType=LDAP\nauthSettings=practice_ldap\n[practice_ldap]\nhost=directory.practice.invalid\nport=636\nSSLEnabled=1\nbindDN=cn=svc-splunk,ou=svc,dc=practice,dc=invalid\nbindDNpassword=training-only\nuserBaseDN=ou=People,dc=practice,dc=invalid\ngroupBaseDN=ou=Groups,dc=practice,dc=invalid\nuserNameAttribute=uid\ngroupNameAttribute=cn\ngroupMappingAttribute=dn\ngroupMemberAttribute=member\n[roleMap_practice_ldap]\nuser=SocReaders\n';
export const READER_ROLE_SOURCE =
  '[role_user]\nsrchIndexesAllowed=ops_logs\nsrchIndexesDefault=ops_logs\nsrchIndexesDisallowed=notable;_*\nindexes_edit=disabled\nedit_roles=disabled\nedit_monitor=disabled\n';
export function idpTeachingCertificate(w: World) {
  return (
    JSON.stringify(
      {
        format: 'sandbox-idp-certificate-v1',
        fingerprint: 'training-idp-v1',
        notAfter: w.config.startTime + 86400000,
      },
      null,
      2,
    ) + '\n'
  );
}
function head(w: World, host: string) {
  const p = resolveHost(w, host);
  if (!p?.splunk || p.role !== 'search_head') throw new OperationsError('Choose a search head');
  return p;
}
export function identityConfigurationRevision(w: World, host: string) {
  const p = head(w, host),
    conf = (name: string) =>
      Object.fromEntries(
        [...runningConf(w, p, name).stanzas].map(([n, s]) => [
          n,
          Object.fromEntries([...s.settings].map(([k, v]) => [k, v.value])),
        ]),
      );
  return checksum({
    authentication: JSON.stringify(conf('authentication')),
    authorize: JSON.stringify(conf('authorize')),
    certificates: JSON.stringify(filesUnder(runningVfs(w, p), p.splunk!.home + '/etc/auth/idpCerts')),
  });
}
function filterMatches(filter: string, record: Record<string, string>) {
  if (!filter) return true;
  if (filter.length > 300 || (filter.match(/\*/g)?.length ?? 0) > 5)
    throw new OperationsError('Directory filter size/wildcard limit');
  const m = /^\(([A-Za-z][\w]*)=([A-Za-z0-9 _.*-]+)\)$/.exec(filter);
  if (!m)
    throw new OperationsError(
      'This directory adapter supports a single equality/wildcard filter, not arbitrary LDAP filter trees',
    );
  const value = Object.entries(record).find(([k]) => k.toLowerCase() === m[1]!.toLowerCase())?.[1];
  if (value === undefined) return false;
  const pattern = m[2]!
    .split('*')
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp('^' + pattern + '$', 'i').test(value);
}
/** Pure evaluation of explicit fictional assertions/directory entries against native running config. */
export function evaluateIdentity(w: World, host: string, sample: 'saml-reader' | 'ldap-reader') {
  const p = head(w, host),
    method = sample === 'saml-reader' ? 'SAML' : 'LDAP',
    result: Omit<IdentityProbe, 'id' | 'tick'> = {
      host,
      sample,
      method,
      subject: 'lab_reader',
      configRevision: identityConfigurationRevision(w, host),
      authenticated: false,
      roles: [],
      indexes: [],
      capabilities: { indexes_edit: false, edit_roles: false, edit_monitor: false },
    };
  try {
    if (!splunkdRunning(w, p)) throw new OperationsError('Search head service is unavailable');
    const auth = runningConf(w, p, 'authentication'),
      strategy = setting(auth, 'authentication', 'authSettings') ?? '',
      get = (key: string) => setting(auth, strategy, key) ?? '';
    if (setting(auth, 'authentication', 'authType') !== method)
      throw new OperationsError('Active authentication method does not match the selected sample');
    if (!strategy || strategy.includes(';') || !/^[A-Za-z][\w-]*$/.test(strategy))
      throw new OperationsError('This adapter supports one named SAML or LDAP strategy');
    let groups: string[];
    if (method === 'SAML') {
      if (get('entityId') !== 'sandbox-v7')
        throw new OperationsError('SAML audience does not match the configured service provider entityId');
      if (get('idpSSOUrl') !== 'https://idp.practice.invalid/sso')
        throw new OperationsError('SAML IdP endpoint does not match the fictional issuer');
      if (!confBool(get('signedAssertion')))
        throw new OperationsError(
          'This exercise requires assertion signature verification; disabling it is not a repair',
        );
      if (w.clock.now < w.config.startTime - 60000 || w.clock.now >= w.config.startTime + 7200000)
        throw new OperationsError('Fictional assertion is outside its validity window');
      const name = get('idpCertPath');
      if (!/^[A-Za-z0-9_.-]{1,100}$/.test(name) || name.includes('..'))
        throw new OperationsError('Use the supplied teaching certificate filename under etc/auth/idpCerts');
      let cert: Record<string, unknown>;
      try {
        cert = JSON.parse(
          runningVfs(w, p).readFile(p.splunk!.home + '/etc/auth/idpCerts/' + name, {
            user: 'splunk',
            groups: ['splunk'],
          }),
        ) as Record<string, unknown>;
      } catch {
        throw new OperationsError('Active teaching IdP certificate is missing, unreadable or malformed');
      }
      if (!cert || cert.format !== 'sandbox-idp-certificate-v1' || cert.fingerprint !== 'training-idp-v1')
        throw new OperationsError('Assertion signer does not match the trusted teaching IdP certificate');
      if (typeof cert.notAfter !== 'number' || cert.notAfter <= w.clock.now)
        throw new OperationsError('Trusted teaching IdP certificate has expired');
      const attr =
        setting(auth, 'authenticationResponseAttrMap_' + strategy, 'role') ??
        setting(auth, 'authenticationResponseAttrMap_SAML', 'role') ??
        'role';
      if (attr !== 'groups')
        throw new OperationsError('Fictional assertion contains groups; review the role attribute mapping');
      groups = ['SocReaders'];
    } else {
      if (
        get('host') !== 'directory.practice.invalid' ||
        get('port') !== '636' ||
        !confBool(get('SSLEnabled'))
      )
        throw new OperationsError('Use the fictional directory LDAPS endpoint on port 636 with SSL enabled');
      if (
        get('bindDN') !== 'cn=svc-splunk,ou=svc,dc=practice,dc=invalid' ||
        get('bindDNpassword') !== 'training-only'
      )
        throw new OperationsError(
          'Fictional directory bind failed; use the supplied training-only bind identity',
        );
      const userDN = 'uid=lab_reader,ou=People,dc=practice,dc=invalid',
        groupDN = 'cn=SocReaders,ou=Groups,dc=practice,dc=invalid';
      const userBase = get('userBaseDN').toLowerCase(),
        groupBase = get('groupBaseDN').toLowerCase();
      if (
        !userBase ||
        !groupBase ||
        !(userDN.toLowerCase() === userBase || userDN.toLowerCase().endsWith(',' + userBase)) ||
        !(groupDN.toLowerCase() === groupBase || groupDN.toLowerCase().endsWith(',' + groupBase))
      )
        throw new OperationsError('Directory search bases do not contain the fictional user/group entries');
      if (
        get('userNameAttribute') !== 'uid' ||
        get('groupNameAttribute') !== 'cn' ||
        get('groupMappingAttribute') !== 'dn' ||
        get('groupMemberAttribute') !== 'member'
      )
        throw new OperationsError('Directory attributes do not match the explicit uid/cn/dn/member fixture');
      if (
        !filterMatches(get('userBaseFilter'), { uid: 'lab_reader', objectClass: 'person' }) ||
        !filterMatches(get('groupBaseFilter'), { cn: 'SocReaders', objectClass: 'groupOfNames' })
      )
        throw new OperationsError('Directory filters exclude the fictional user/group');
      groups = ['SocReaders'];
    }
    const map =
      auth.stanzas.get('roleMap_' + strategy) ??
      (method === 'SAML' ? auth.stanzas.get('roleMap_SAML') : undefined);
    result.roles = [
      ...new Set(
        [...(map?.settings ?? [])]
          .filter(([, v]) => v.value.split(';').some((g) => groups.includes(g.trim())))
          .map(([role]) => role),
      ),
    ].sort();
    // Native SAML can auto-map groups whose names are actual roles. This sample has no such group.
    if (!result.roles.length)
      throw new OperationsError(
        'No native role mapping matched the case-sensitive fictional group SocReaders',
      );
    const roles = mappedRoleSettings(w, host, result.roles),
      events = searchableRecordedEvents(w);
    result.indexes = activeIndexNames(w).map((index) => ({
      index,
      allowed: indexAllowedByRole(roles, index),
      recordedEvents: indexAllowedByRole(roles, index) ? events.filter((e) => e.index === index).length : 0,
    }));
    result.capabilities = {
      indexes_edit: ['enabled', 'true', '1'].includes(roles.indexes_edit ?? ''),
      edit_roles: ['enabled', 'true', '1'].includes(roles.edit_roles ?? ''),
      edit_monitor: ['enabled', 'true', '1'].includes(roles.edit_monitor ?? ''),
    };
    result.authenticated = true;
  } catch (e) {
    result.error = (e as Error).message;
  }
  return result;
}
export function probeIdentity(
  w: World,
  host: string,
  sample: 'saml-reader' | 'ldap-reader',
  principal: PracticePrincipal = 'admin',
) {
  requireCapability(w, host, principal, 'edit_roles');
  if (!['saml-reader', 'ldap-reader'].includes(sample))
    throw new OperationsError('Choose a supplied fictional identity sample');
  const value = evaluateIdentity(w, host, sample),
    s = (w.identity ??= { version: 1, nextId: 1, probes: [] }),
    probe = { ...value, id: 'identity-probe-' + s.nextId++, tick: w.clock.tick };
  s.probes.push(probe);
  s.probes = s.probes.slice(-200);
  journal(w, { k: 'identity.state', state: structuredClone(s) });
  return structuredClone(probe);
}
export function stageIdentitySource(
  w: World,
  host: string,
  conf: 'authentication' | 'authorize',
  source: string,
  principal: PracticePrincipal = 'admin',
) {
  requireCapability(w, host, principal, 'edit_roles');
  head(w, host);
  if (!['authentication', 'authorize'].includes(conf) || source.length > 30000 || source.includes('\0'))
    throw new OperationsError('Choose bounded native authentication/authorize source');
  // The only accepted password is the literal fictional fixture value; never invite a real bind secret.
  if (
    conf === 'authentication' &&
    source
      .split(/\r?\n/)
      .some(
        (l) =>
          /^\s*[^#;=]*(?:password|secret|token)[^=]*=/i.test(l) &&
          !/^\s*bindDNpassword\s*=\s*training-only\s*$/i.test(l),
      )
  )
    throw new OperationsError(
      'Real credentials are not accepted; the directory adapter uses only bindDNpassword=training-only',
    );
  const p = head(w, host),
    fs = hostFs(w, p),
    path = p.splunk!.home + '/etc/system/local/' + conf + '.conf';
  fs.writeFile(path, source, ROOT);
  return { path, activation: 'restart-required' };
}
