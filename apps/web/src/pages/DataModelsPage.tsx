import { useState } from 'react';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
import { Modal } from '../replica/Modal';
import { searchHash } from '../links';
interface View {
  context: string;
  host: string;
  hosts: string[];
  revision: string;
  error: string;
  models: {
    name: string;
    dataset: string;
    app: string;
    fields: string[];
    search: string;
    enabled: boolean;
    earliest: string;
    cron: string;
    revision: string;
    sourcePath: string;
    source: string;
  }[];
  summaries: {
    id: string;
    model: string;
    dataset: string;
    rows: number;
    sourceScan: number;
    inputRevision: number;
    revision: string;
    earliest: number;
    latest: number;
  }[];
  builds: { id: string; model: string; status: string; rows: number; error?: string }[];
}
const initial = JSON.stringify(
  {
    modelName: 'Authentication',
    objects: [
      {
        objectName: 'Authentication',
        parentName: 'BaseEvent',
        constraints: [{ search: 'index=security_logs tag=authentication' }],
        fields: [
          { fieldName: 'user', type: 'string' },
          { fieldName: 'action', type: 'string' },
          { fieldName: 'src', type: 'string' },
          { fieldName: 'dest', type: 'string' },
        ],
      },
    ],
  },
  null,
  2,
);
export function DataModelsPage() {
  const [host, setHost] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [draft, setDraft] = useState<{
      host: string;
      context: string;
      revision: string;
      app: string;
      source: string;
      enabled: boolean;
      earliest: string;
    } | null>(null);
  const poll = usePoll(() => request<View>('data-models?host=' + encodeURIComponent(host)), [host], 4000),
    view = poll.data;
  const act = async (fields: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      const result = await request('data-models/action', { ...fields });
      setNotice(JSON.stringify(result, null, 2));
      await poll.refresh();
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const edit = (model?: View['models'][number]) => {
    if (view)
      setDraft({
        context: view.context,
        host: view.host,
        revision: view.revision,
        app: model?.app ?? 'v7_cim',
        source: model?.source ?? initial,
        enabled: model?.enabled ?? false,
        earliest: model?.earliest ?? '-15m',
      });
  };
  return (
    <div className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">KNOWLEDGE</span>
          <h1>Data models</h1>
          <p>
            Native JSON event datasets, search-time fields and bounded acceleration over actual searchable
            events.
          </p>
        </div>
        <a href="#/search">Search →</a>
      </header>
      {(error || poll.error || view?.error) && (
        <p role="alert" className="error">
          {error || poll.error || view?.error}
        </p>
      )}
      <div className="v5-toolbar">
        <label>
          Dispatch host
          <select value={host || view?.host || ''} onChange={(e) => setHost(e.target.value)}>
            {view?.hosts.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <button disabled={!view || busy} onClick={() => edit()}>
          Stage a data model
        </button>
      </div>
      <div className="v5-banner">
        V7 supports one root BaseEvent dataset, native aliases/calculated fields and recorded acceleration
        snapshots. This is a bounded teaching model; it does not create native .tsidx files or provide full
        CIM or Enterprise Security parity.
      </div>
      {view && (
        <>
          <section className="v5-card">
            <h2>Active definitions</h2>
            <p>
              Staged JSON and datamodels.conf settings need a restart of the selected search head.
              Acceleration follows the active cron and scheduler budget; a manual rebuild is available after
              activation.
            </p>
            {!view.models.length && <p>No supported active model on this dispatch host.</p>}
            {view.models.map((m) => (
              <article key={m.app + ':' + m.name}>
                <h3>
                  {m.name}.{m.dataset}
                </h3>
                <p>
                  {m.app} · acceleration {m.enabled ? 'enabled' : 'disabled'} · range {m.earliest} · cron{' '}
                  {m.cron}
                </p>
                <p>Fields: {m.fields.join(', ')}</p>
                <pre>{m.search}</pre>
                <p>Active source: {m.sourcePath}</p>
                <a
                  href={searchHash(
                    '| tstats summariesonly=true count from datamodel=' + m.name + '.' + m.dataset,
                    m.earliest,
                    'now',
                    view.host,
                  )}
                >
                  Search this acceleration snapshot →
                </a>
                <button disabled={busy} onClick={() => edit(m)}>
                  Edit source and settings
                </button>
                <button
                  disabled={busy || !m.enabled}
                  onClick={() =>
                    void act({
                      context: view.context,
                      host: view.host,
                      revision: view.revision,
                      action: 'build',
                      model: m.name,
                    })
                  }
                >
                  Rebuild acceleration snapshot
                </button>
              </article>
            ))}
          </section>
          <section className="v5-card">
            <h2>Acceleration coverage</h2>
            <p>
              summariesonly=true reads only a compatible stored snapshot. A normal tstats query scans the real
              model source when a complete current snapshot is unavailable. Current index permissions still
              apply.
            </p>
            <table>
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Stored rows / source scans</th>
                  <th>Covered time</th>
                  <th>Input revision</th>
                </tr>
              </thead>
              <tbody>
                {view.summaries.map((s) => (
                  <tr key={s.id}>
                    <td>
                      {s.model}.{s.dataset}
                    </td>
                    <td>
                      {s.rows} / {s.sourceScan}
                    </td>
                    <td>
                      {new Date(s.earliest).toISOString()} → {new Date(s.latest).toISOString()}
                    </td>
                    <td>{s.inputRevision}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <details>
              <summary>Actual build and skip receipts</summary>
              <pre>{JSON.stringify(view.builds.slice(-20), null, 2)}</pre>
            </details>
          </section>
        </>
      )}
      {notice && (
        <details className="v5-card">
          <summary>Last operation</summary>
          <pre>{notice}</pre>
        </details>
      )}
      {draft && (
        <Modal title="Stage data model source and acceleration settings" onClose={() => setDraft(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                if (await act({ ...draft, action: 'stage' })) setDraft(null);
              })();
            }}
          >
            {error && (
              <p role="alert" className="error">
                {error}
              </p>
            )}
            <label className="v5-note">
              App
              <input value={draft.app} onChange={(e) => setDraft({ ...draft, app: e.target.value })} />
            </label>
            <label className="v5-note">
              Native model JSON
              <textarea
                style={{ minHeight: 320, fontFamily: 'monospace' }}
                value={draft.source}
                onChange={(e) => setDraft({ ...draft, source: e.target.value })}
              />
            </label>
            <label className="v5-note">
              <input
                type="checkbox"
                checked={draft.enabled}
                onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
              />
              Enable acceleration after activation
            </label>
            <label className="v5-note">
              Summary range
              <input
                value={draft.earliest}
                onChange={(e) => setDraft({ ...draft, earliest: e.target.value })}
              />
            </label>
            <p>
              Writes stay on disk until you restart {draft.host}. Existing model defaults remain; this editor
              creates an app local override.
            </p>
            <button disabled={busy}>Stage reviewed source</button>
            <button type="button" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
