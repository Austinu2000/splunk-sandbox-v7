import { useEffect, useState } from 'react';
import type { IdentityProbe } from '@sandbox/shared';
import { request } from './TrainingPage';
interface View {
  context: string;
  host: string;
  hosts: string[];
  revision: string;
  configRevision: string;
  authentication: string;
  authorize: string;
  probes: IdentityProbe[];
}
export function IdentityOperationsPage() {
  const [v, setV] = useState<View | null>(null),
    [host, setHost] = useState(''),
    [conf, setConf] = useState<'authentication' | 'authorize'>('authentication'),
    [source, setSource] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState('');
  const review = async (h = host, c = conf) => {
    setBusy(true);
    setError('');
    try {
      const next = await request<View>('identity?host=' + encodeURIComponent(h));
      setV(next);
      setHost(next.host);
      setSource(next[c]);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void review('', 'authentication');
  }, []);
  const act = async (action: 'stage' | 'probe', fields: Record<string, unknown>) => {
    if (!v) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const r = await request<{ activation?: string; authenticated?: boolean; error?: string }>(
        'identity/action',
        { context: v.context, host: v.host, revision: v.revision, action, ...fields },
      );
      await review(v.host, conf);
      setNotice(
        r.activation
          ? 'Staged only. Restart this virtual search head to activate, review again, then probe.'
          : r.authenticated
            ? 'Fictional identity authenticated; inspect its mapped roles and actual index access.'
            : (r.error ?? 'Identity probe failed.'),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">V7 · IDENTITY CONFIGURATION PRACTICE</span>
          <h1>SAML, LDAP and role mapping</h1>
          <p>
            Probe explicit fictional assertions and directory entries against native running
            authentication.conf and authorize.conf.
          </p>
        </div>
        <a href="#/terminal">Virtual terminal →</a>
      </header>
      <p className="v5-banner">
        Offline teaching adapter. No IdP or directory connection, password login, XML signature verification
        or real certificate validation. Use only the supplied training identity and metadata certificate.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <div className="v5-toolbar">
        <label>
          Identity dispatch host{' '}
          <select
            value={host}
            onChange={(e) => {
              setHost(e.target.value);
              setV(null);
              setSource('');
            }}
          >
            {(v?.hosts ?? [host]).map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <button disabled={busy} onClick={() => void review()}>
          Review current identity source
        </button>
      </div>
      {v && (
        <>
          <label>
            Native source{' '}
            <select
              value={conf}
              onChange={(e) => {
                const c = e.target.value as typeof conf;
                setConf(c);
                setSource(v[c]);
                setNotice('');
              }}
            >
              <option value="authentication">authentication.conf</option>
              <option value="authorize">authorize.conf</option>
            </select>
          </label>
          <textarea
            aria-label="Native identity configuration"
            rows={16}
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
          <button disabled={busy} onClick={() => void act('stage', { conf, source })}>
            Stage native identity source
          </button>
          <p>
            Restart the selected virtual head after staging. Source fingerprint and active configuration
            revision are distinct. The SAML sample carries groups=[SocReaders], audience=sandbox-v7 and the
            training-idp-v1 signer. Its teaching trust artifact belongs under $SPLUNK_HOME/etc/auth/idpCerts.
            The LDAP sample uses uid=lab_reader under ou=People and group SocReaders under ou=Groups,
            dc=practice,dc=invalid.
          </p>
          <div className="v5-actions">
            <button disabled={busy} onClick={() => void act('probe', { sample: 'saml-reader' })}>
              Probe fictional SAML reader
            </button>
            <button disabled={busy} onClick={() => void act('probe', { sample: 'ldap-reader' })}>
              Probe fictional LDAP reader
            </button>
          </div>
          <h2>Retained identity probes</h2>
          <p>
            Probe success means this bounded configuration/fixture relationship matched. It does not create a
            browser login session. Search practice principals remain explicit.
          </p>
          {v.probes
            .slice(-20)
            .reverse()
            .map((p) => (
              <section className="v5-card" key={p.id}>
                <h3>
                  {p.method} · {p.subject} · {p.authenticated ? 'Authenticated' : 'Failed'}
                </h3>
                <p>
                  {p.error ?? 'Mapped roles: ' + p.roles.join(', ')} ·{' '}
                  {p.configRevision === v.configRevision ? 'Current active source' : 'Earlier active source'}
                </p>
                <p>
                  {p.authenticated &&
                    p.indexes
                      .filter((i) => i.allowed)
                      .map((i) => i.index + ': ' + i.recordedEvents + ' recorded events')
                      .join(' · ')}
                </p>
                <details>
                  <summary>Capabilities and all evaluated indexes</summary>
                  <pre>{JSON.stringify({ capabilities: p.capabilities, indexes: p.indexes }, null, 2)}</pre>
                </details>
              </section>
            ))}
        </>
      )}
    </main>
  );
}
