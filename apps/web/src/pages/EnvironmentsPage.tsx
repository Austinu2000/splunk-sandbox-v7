import { useState } from 'react';
import { api } from '../api';
import { usePoll } from '../usePoll';
import { flushEnvironment } from '../environment';
import './environments.css';
export function EnvironmentsPage() {
  const list = usePoll(() => api.profiles(), [], 5000);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function open(id: string, reset = false) {
    if (
      reset &&
      !window.confirm(
        'Start this environment fresh? Its current progress will be kept in a “Before reset” saved session.',
      )
    )
      return;
    setBusy(id);
    setError('');
    try {
      await flushEnvironment();
      await api.loadProfile(id, reset);
      localStorage.setItem('splunk-v6-environment-selected', 'yes');
      window.location.hash = '#/home';
      window.location.reload();
    } catch (e) {
      setError((e as Error).message);
      setBusy('');
    }
  }
  return (
    <main className="environments-page">
      <div className="environment-heading">
        <div>
          <span className="environment-eyebrow">ENGINEER SANDBOX · V6</span>
          <h1>Choose your environment</h1>
          <p>
            Continue where you left off. Each environment keeps its own configuration, tickets, dashboards and
            interview progress.
          </p>
        </div>
        <a href="#/sessions">View saved sessions →</a>
      </div>
      {(error || list.error) && (
        <div className="error" role="alert">
          {error || list.error}
        </div>
      )}
      {!list.data && !list.error && <p>Loading environments…</p>}
      <div className="environment-grid">
        {list.data?.profiles.map((p) => (
          <article className={`environment-card ${p.id === list.data?.activeId ? 'active' : ''}`} key={p.id}>
            <div className="environment-card-top">
              <span className={`environment-monogram ${p.id}`}>
                {p.id === 'default' ? 'DEV' : p.id.toUpperCase()}
              </span>
              {p.id === list.data?.activeId && <span className="environment-current">Current</span>}
            </div>
            <h2>{p.name}</h2>
            <p className="environment-role">{p.role}</p>
            <p>{p.description}</p>
            <dl className="environment-scale">
              <div>
                <dt>Forwarders</dt>
                <dd>{p.scale.fleetSize.toLocaleString()}</dd>
              </div>
              <div>
                <dt>Indexers</dt>
                <dd>{p.infra.indexerCluster.indexers}</dd>
              </div>
              <div>
                <dt>Daily ingest</dt>
                <dd>
                  {p.scale.targetDailyIngestTB === null ? 'Original' : `~${p.scale.targetDailyIngestTB} TB`}
                </dd>
              </div>
            </dl>
            <p className="environment-last">
              {p.lastPlayed
                ? `Last saved ${new Date(p.lastPlayed).toLocaleString()}`
                : 'No saved progress yet'}
            </p>
            <div className="environment-actions">
              <button className="primary-btn" disabled={!!busy} onClick={() => void open(p.id)}>
                {busy === p.id
                  ? 'Opening…'
                  : p.hasAutosave || p.id === list.data?.activeId
                    ? 'Continue'
                    : 'Start environment'}
              </button>
              <button className="secondary-btn" disabled={!!busy} onClick={() => void open(p.id, true)}>
                Start fresh
              </button>
            </div>
            {p.id !== 'default' && (
              <details>
                <summary>Profile details & unconfirmed values</summary>
                <p>
                  {p.infra.searchHeadCluster.members} search heads
                  {p.infra.esSearchHead ? ' + dedicated ES' : ''} · {p.scale.users.toLocaleString()} users ·{' '}
                  {p.auth.method.toUpperCase()}
                </p>
                {p.warnings.map((w) => (
                  <p key={w} className="environment-warning">
                    {w}
                  </p>
                ))}
                <ul>
                  {p.confirmations.map((c, i) => (
                    <li key={i}>
                      <strong>{c.path}</strong>: {c.note}
                    </li>
                  ))}
                </ul>
                <p>
                  Figures marked “confirm” are the supplied placeholders. No replacement figures have been
                  inferred.
                </p>
              </details>
            )}
          </article>
        ))}
      </div>
      <p className="environment-footnote">
        Progress autosaves every two minutes, on environment changes, and when the server shuts down. TB uses
        decimal units. New-profile license allowances are simulated at 70% normal utilization; they are not
        company license figures.
      </p>
    </main>
  );
}
