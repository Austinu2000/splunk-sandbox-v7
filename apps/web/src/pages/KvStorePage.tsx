import { useState, useEffect } from 'react';
import type { KvStatus, KvState } from '@sandbox/shared';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
import './training.css';
interface View {
  context: string;
  revision: string;
  host: string;
  app: string;
  nodes: KvStatus[];
  collections: { collection: string; settings: Record<string, string>; count: number }[];
  files: Record<string, string>;
  backups: { name: string; tick: number; records: number }[];
  evidence: KvState['evidence'];
  incidents: KvState['incidents'];
  catalog: { id: string; title: string; profile: string }[];
}
export function KvStorePage() {
  const [host, setHost] = useState(''),
    [app, setApp] = useState('kv_training'),
    [collection, setCollection] = useState('assets'),
    [tab, setTab] = useState('Collections'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [output, setOutput] = useState<unknown>(null),
    [rows, setRows] = useState('[{"hostname":"db01","owner":"Database","criticality":4}]'),
    [query, setQuery] = useState('{}'),
    [schema, setSchema] = useState(
      '{"field.hostname":"string","field.owner":"string","field.criticality":"number","enforceTypes":"true"}',
    ),
    [archive, setArchive] = useState('assets-backup'),
    [conf, setConf] = useState('collections'),
    [draft, setDraft] = useState<string | null>(null),
    [notes, setNotes] = useState('');
  const poll = usePoll(
    () => request<View>(`kvstore?host=${encodeURIComponent(host)}&app=${encodeURIComponent(app)}`),
    [host, app],
    4000,
  );
  const v = poll.data;
  const [reviewed, setReviewed] = useState<{
    context: string;
    revision: string;
    host: string;
    app: string;
  } | null>(null);
  useEffect(() => {
    if (v && !reviewed && (!host || v.host === host) && v.app === app)
      setReviewed({ context: v.context, revision: v.revision, host: v.host, app: v.app });
  }, [v, reviewed, host, app]);
  const blocked = busy || !reviewed || reviewed.context !== v?.context;
  async function reviewCurrent() {
    try {
      const next = await request<View>('kvstore?app=' + encodeURIComponent(app));
      setHost(next.host);
      setReviewed({ context: next.context, revision: next.revision, host: next.host, app: next.app });
      setDraft(null);
      setOutput(null);
      setRows('[]');
      setQuery('{}');
      setSchema('{}');
      setNotes('');
      setArchive('assets-backup');
      setCollection('assets');
      setError('');
      await poll.refresh();
    } catch (e) {
      setError(String(e));
    }
  }
  async function action(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError('');
    try {
      if (!reviewed) throw new Error('Review the current KV environment before applying a change');
      const result = await request('kvstore/action', {
        context: reviewed.context,
        revision: reviewed.revision,
        action,
        host: host || v?.host,
        app,
        collection,
        ...extra,
      });
      setOutput(result);
      const next = await request<View>(
        `kvstore?host=${encodeURIComponent(host || v?.host || '')}&app=${encodeURIComponent(app)}`,
      );
      setReviewed({ context: next.context, revision: next.revision, host: next.host, app: next.app });
      await poll.refresh();
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function jsonAction(actionName: string) {
    try {
      await action(
        actionName,
        actionName === 'write' ? { records: JSON.parse(rows), mode: 'upsert' } : { query: JSON.parse(query) },
      );
    } catch (e) {
      setError('Invalid JSON: ' + String(e));
    }
  }
  const selected = v?.nodes.find((n) => n.host === (host || v.host));
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">V7 · SPLUNK ENTERPRISE 9.4.1 PRACTICE</span>
          <h1>KV Store administration</h1>
          <p>Manage collections, inspect replicas and recover data.</p>
        </div>
        <a href="#/learn">Guided lessons →</a>
      </header>
      <div className="v5-banner">
        Local simulation · KV server 7.0.0 is a practice fixture, not an installed MongoDB process. Collection
        data, configuration and command results share this environment’s saved state.
      </div>
      {(error || poll.error) && (
        <div role="alert" className="error">
          {error || poll.error}
        </div>
      )}
      {reviewed && v && (reviewed.context !== v.context || reviewed.revision !== v.revision) && (
        <p className="v5-banner">
          KV source or data changed after your review. Reload the current state before applying retained
          drafts.
        </p>
      )}
      <button disabled={busy} onClick={() => void reviewCurrent()}>
        Review current environment and clear record drafts
      </button>
      <div className="v5-toolbar">
        <label>
          Search head{' '}
          <select
            value={host || v?.host || ''}
            onChange={(e) => {
              setHost(e.target.value);
              setReviewed(null);
              setOutput(null);
              setDraft(null);
            }}
          >
            {v?.nodes.map((n) => (
              <option key={n.host}>{n.host}</option>
            ))}
          </select>
        </label>
        <label>
          App context{' '}
          <input
            value={app}
            onChange={(e) => {
              setApp(e.target.value);
              setReviewed(null);
              setDraft(null);
            }}
          />
        </label>
        <button disabled={blocked} onClick={() => action('inspect')}>
          Capture status
        </button>
      </div>
      {selected && (
        <>
          <div className="v5-metrics">
            {[
              ['Status', selected.status],
              ['Server version', selected.serverVersion],
              ['Role', selected.replicationStatus],
              ['Local / latest revision', `${selected.appliedRevision} / ${selected.latestRevision}`],
              ['Write availability', selected.writable ? 'Available' : 'Unavailable'],
            ].map(([k, val]) => (
              <div key={k}>
                <span>{k}</span>
                <strong>{val}</strong>
              </div>
            ))}
          </div>
          <p>
            {selected.reason} · Engine: {selected.storageEngine} · Port: {selected.port} · Primary:{' '}
            {selected.primary ?? 'none'}
          </p>
        </>
      )}
      <nav className="v5-tabs">
        {['Collections', 'Configuration', 'Replication', 'Backups', 'Incidents', 'Evidence'].map((t) => (
          <button
            key={t}
            aria-pressed={tab === t}
            onClick={() => {
              setTab(t);
              setOutput(null);
            }}
          >
            {t}
          </button>
        ))}
      </nav>
      {tab === 'Collections' && (
        <section>
          <h2>Collections and records</h2>
          <p>
            Define a collection, then insert or update JSON records. Schema validation and unique keys are
            checked before data changes.
          </p>
          <div className="v5-actions">
            {v?.collections.map((c) => (
              <button
                key={c.collection}
                onClick={() => {
                  setCollection(c.collection);
                  setSchema(JSON.stringify(c.settings, null, 2));
                  setOutput(null);
                }}
              >
                {c.collection} · {c.count} records
              </button>
            ))}
          </div>
          <label>
            Collection <input value={collection} onChange={(e) => setCollection(e.target.value)} />
          </label>
          <details>
            <summary>Create or update schema</summary>
            <label className="v5-note">
              Collection settings (JSON)
              <textarea value={schema} onChange={(e) => setSchema(e.target.value)} />
            </label>
            <button
              disabled={blocked}
              onClick={() => {
                try {
                  void action('collection', { settings: JSON.parse(schema) });
                } catch (e) {
                  setError(String(e));
                }
              }}
            >
              Apply collection settings
            </button>
            <button
              disabled={blocked}
              onClick={() => {
                if (
                  window.confirm(
                    `Delete custom collection ${collection} and all its records? Shipped defaults must be disabled instead.`,
                  )
                )
                  void action('drop');
              }}
            >
              Delete custom collection
            </button>
          </details>
          <label className="v5-note">
            Records (JSON array)
            <textarea value={rows} onChange={(e) => setRows(e.target.value)} />
          </label>
          <button disabled={blocked} onClick={() => jsonAction('write')}>
            Save records by key
          </button>
          <label className="v5-note">
            Equality query (JSON)
            <textarea value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <div className="v5-actions">
            <button disabled={blocked} onClick={() => jsonAction('read')}>
              Read records
            </button>
            <button
              disabled={blocked}
              onClick={() => {
                if (
                  window.confirm(
                    'Delete all records matching this query? An empty query matches all records. Take a backup first.',
                  )
                )
                  void jsonAction('delete');
              }}
            >
              Delete matching records
            </button>
            <a href="#/search?q=%7C%20inputlookup%20assets_lookup">
              Search assets_lookup on the default search head →
            </a>
          </div>
        </section>
      )}
      {tab === 'Configuration' && (
        <section>
          <h2>Configuration files</h2>
          <p>
            Disk edits remain pending until applied. Collections and lookup definitions use app reload; server
            settings require a Splunk restart. Configuration on a single member is local until distributed.
          </p>
          <label>
            File{' '}
            <select
              value={conf}
              onChange={(e) => {
                setConf(e.target.value);
                setDraft(null);
              }}
            >
              {['collections', 'transforms', 'server'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            .conf
          </label>
          <pre>
            /opt/splunk/etc/apps/{conf === 'server' ? 'kv_training' : app}/local/{conf}.conf
          </pre>
          <label className="v5-note">
            Configuration content
            <textarea
              style={{ minHeight: 220, fontFamily: 'monospace' }}
              value={draft ?? v?.files[conf] ?? ''}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <div className="v5-actions">
            <button
              disabled={blocked}
              onClick={async () => {
                if (await action('stage', { name: conf, text: draft ?? v?.files[conf] ?? '' }))
                  setDraft(null);
              }}
            >
              Save to disk
            </button>
            <button disabled={blocked} onClick={() => action(conf === 'server' ? 'restart' : 'reload')}>
              {conf === 'server' ? 'Restart Splunk' : 'Reload app configuration'}
            </button>
          </div>
          <p>
            Use the terminal’s btool command to inspect winning configuration paths, including system/local
            overrides.
          </p>
        </section>
      )}
      {tab === 'Replication' && (
        <section>
          <h2>Replica health</h2>
          <div className="v5-table">
            <table>
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Revision</th>
                  <th>Diagnostic</th>
                </tr>
              </thead>
              <tbody>
                {v?.nodes.map((n) => (
                  <tr key={n.host}>
                    <td>{n.host}</td>
                    <td>{n.status}</td>
                    <td>{n.replicationStatus}</td>
                    <td>
                      {n.appliedRevision}/{n.latestRevision}
                    </td>
                    <td>{n.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="v5-actions">
            <button disabled={blocked} onClick={() => action('resync')}>
              Resynchronize selected member
            </button>
            <button disabled={blocked} onClick={() => action('advance')}>
              Advance one simulation tick
            </button>
          </div>
          <details>
            <summary>Lab fault controls</summary>
            <p>These controls simulate a transport outage; they are not Splunk configuration settings.</p>
            <button disabled={blocked} onClick={() => action('transport', { enabled: false })}>
              Interrupt selected member transport
            </button>
            <button disabled={blocked} onClick={() => action('transport', { enabled: true })}>
              Restore selected member transport
            </button>
          </details>
          <p>
            APL supplies a multi-member replica set. Lab has one search head and exercises standalone
            behavior. The KV primary is elected separately from the search head captain.
          </p>
        </section>
      )}
      {tab === 'Backups' && (
        <section>
          <h2>Backup and restore</h2>
          <p>
            Backups contain this deployment’s collection data. Configuration definitions must exist before
            restore. Restoring also retains the pre-restore data as a safety snapshot.
          </p>
          <label>
            Archive name <input value={archive} onChange={(e) => setArchive(e.target.value)} />
          </label>
          <button disabled={blocked} onClick={() => action('backup', { name: archive })}>
            Create backup
          </button>
          {v?.backups.map((b) => (
            <article className="v5-card" key={b.name}>
              <h3>{b.name}</h3>
              <p>
                Tick {b.tick} · {b.records} records
              </p>
              <button
                disabled={blocked}
                onClick={() => {
                  if (
                    window.confirm(
                      `Restore ${b.name}? Current collection data will be replaced and backed up first.`,
                    )
                  )
                    void action('restore', { name: b.name });
                }}
              >
                Restore this backup
              </button>
            </article>
          ))}
        </section>
      )}
      {tab === 'Incidents' && (
        <section>
          <h2>KV Store practice incidents</h2>
          <div className="v5-grid">
            {v?.catalog.map((c) => (
              <article className="v5-card" key={c.id}>
                <span className="v5-eyebrow">{c.profile} profile</span>
                <h3>{c.title}</h3>
                <button
                  disabled={busy || v.incidents.some((i) => i.closed === undefined)}
                  onClick={() => action('incident', { name: c.id })}
                >
                  Start incident
                </button>
              </article>
            ))}
          </div>
          {v?.incidents.map((i) => (
            <article className="v5-card" key={i.id}>
              <h3>{v.catalog.find((c) => c.id === i.kind)?.title}</h3>
              <p>
                {i.host} · {i.closed !== undefined ? 'Resolved' : 'Investigating'}
              </p>
              {i.closed === undefined && (
                <>
                  <label className="v5-note">
                    Root cause, change and verification
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </label>
                  <button disabled={blocked} onClick={() => action('close', { name: i.id, text: notes })}>
                    Verify recovery and close
                  </button>
                </>
              )}
            </article>
          ))}
        </section>
      )}
      {tab === 'Evidence' && (
        <section>
          <h2>Saved operation history</h2>
          {[...(v?.evidence ?? [])].reverse().map((e) => (
            <p key={e.id}>
              <strong>
                #{e.id} · {e.host} · {e.action}
              </strong>{' '}
              · tick {e.tick} · {e.target}
              <br />
              {e.detail}
            </p>
          ))}
        </section>
      )}
      {output !== null && (
        <section aria-live="polite">
          <h3>Operation result</h3>
          <pre>{JSON.stringify(output, null, 2)}</pre>
        </section>
      )}
    </main>
  );
}
