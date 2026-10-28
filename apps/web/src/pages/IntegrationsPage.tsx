import { useEffect, useState } from 'react';
import type { IntegrationKind, IntegrationReceipt } from '@sandbox/shared';
import { request } from './TrainingPage';
interface View {
  context: string;
  kind: IntegrationKind;
  host: string;
  initialized: boolean;
  revision: string;
  runtime: unknown;
  sources: Record<string, { path: string; source: string }>;
  receipts: IntegrationReceipt[];
}
const kinds: IntegrationKind[] = ['aws', 'otel', 'cribl', 'database'];
const names = { aws: 'AWS SQS / S3', otel: 'OpenTelemetry', cribl: 'Cribl routing', database: 'DB Connect' };
export function IntegrationsPage() {
  const [kind, setKind] = useState<IntegrationKind>('aws'),
    [v, setV] = useState<View | null>(null),
    [sourceName, setSourceName] = useState('aws'),
    [source, setSource] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [rowId, setRowId] = useState(4),
    [service, setService] = useState('checkout');
  const review = async (k = kind, selected = sourceName) => {
    setBusy(true);
    setError('');
    try {
      const next = await request<View>('integrations?kind=' + k),
        key = Object.hasOwn(next.sources, selected) ? selected : Object.keys(next.sources)[0]!;
      setV(next);
      setSourceName(key);
      setSource(next.sources[key]?.source ?? '');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void review('aws', 'aws');
  }, []);
  const act = async (action: string, fields: Record<string, unknown> = {}) => {
    if (!v) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await request('integrations/action', {
        context: v.context,
        kind: v.kind,
        revision: v.revision,
        action,
        ...fields,
      });
      await review(v.kind, sourceName);
      setNotice(
        action === 'stage' && ['aws', 'database'].includes(v.kind)
          ? 'Staged. Restart the virtual ' + v.host + ' Splunk service to activate this native input source.'
          : 'Operation retained. Inspect delivery receipts and actual Search results.',
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
          <span className="v5-eyebrow">V7 · OFFLINE INTEGRATION OPERATIONS</span>
          <h1>Recorded ingestion and delivery</h1>
          <p>Inspect actual source records, pending deliveries, event IDs and checkpoints.</p>
        </div>
        <a href="#/terminal">Virtual terminal →</a>
      </header>
      <p className="v5-banner">
        Fictional cloud, telemetry, routing and database fixtures. Sources use bounded native fields where
        shown; resource/service controls are labeled teaching adapters. No network, real credentials, SQL
        execution or external programs.
      </p>
      <nav className="v5-tabs">
        {kinds.map((k) => (
          <button
            key={k}
            aria-pressed={kind === k}
            disabled={busy}
            onClick={() => {
              setKind(k);
              setV(null);
              setSource('');
              setNotice('');
              void review(k, k);
            }}
          >
            {names[k]}
          </button>
        ))}
      </nav>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <button disabled={busy} onClick={() => void review()}>
        Review current integration
      </button>
      {v && !v.initialized && (
        <section className="v5-card">
          <p>
            Add a separate offline {names[v.kind]} fixture in Lab. It preserves existing adapter state and
            refuses occupied source paths.
          </p>
          <button disabled={busy} onClick={() => void act('initialize')}>
            Add offline {names[v.kind]} practice fixture
          </button>
        </section>
      )}
      {v?.initialized && (
        <>
          <h2>
            {names[v.kind]} · {v.host}
          </h2>
          <label>
            Source file{' '}
            <select
              value={sourceName}
              onChange={(e) => {
                setSourceName(e.target.value);
                setSource(v.sources[e.target.value]!.source);
              }}
            >
              {Object.entries(v.sources).map(([key, s]) => (
                <option value={key} key={key}>
                  {s.path}
                </option>
              ))}
            </select>
          </label>
          <textarea
            aria-label="Integration source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={16}
          />
          <div className="v5-actions">
            <button disabled={busy} onClick={() => void act('stage', { sourceName, source })}>
              Stage integration source
            </button>
            {['otel', 'cribl'].includes(v.kind) && (
              <button disabled={busy} onClick={() => void act('activate')}>
                Activate offline adapter source
              </button>
            )}
            <button disabled={busy} onClick={() => void act('poll')}>
              Poll offline source once
            </button>
          </div>
          <p>
            {v.kind === 'aws'
              ? 'The input reads active native inputs.conf. The resource file uses a bounded native IAM policy (Version/Statement/Effect/Action/Resource) for fixed fictional ARNs; notifications are retained until accepted and duplicates use object-version checkpoints.'
              : v.kind === 'otel'
                ? 'Define receiver/exporter components and enable each signal in service.pipelines. Activate explicitly, then flush the supplied signal records through the real virtual HEC receiver.'
                : v.kind === 'cribl'
                  ? 'Native route fields support true/false or one scalar ===/!== predicate, passthru, final and known outputs. Arbitrary JavaScript is rejected. The separate availability/token file controls a fictional HEC destination; pending records persist.'
                  : 'Native db_inputs.conf uses the supplied connection, numeric rising id, ordered parameterized query and KV checkpoint_key. This adapter accepts only the documented fixture table/query shape, with no JDBC or SQL execution.'}
          </p>
          {v.kind === 'database' && (
            <details>
              <summary>Append a fictional source database row</summary>
              <p>This changes the mock database, not indexed records. Poll the input afterwards.</p>
              <label>
                Increasing ID{' '}
                <input
                  aria-label="Database row ID"
                  type="number"
                  value={rowId}
                  onChange={(e) => setRowId(Number(e.target.value))}
                />
              </label>
              <label>
                Service <input value={service} onChange={(e) => setService(e.target.value)} />
              </label>
              <button
                disabled={busy}
                onClick={() => void act('append-row', { row: { id: rowId, service, status: 200 } })}
              >
                Append source row with status 200
              </button>
            </details>
          )}
          <details>
            <summary>Actual source and pending state</summary>
            <pre>{JSON.stringify(v.runtime, null, 2)}</pre>
          </details>
          <h2>Retained delivery receipts</h2>
          <div className="v5-table">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Indexed event IDs / checkpoint</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {v.receipts
                  .slice(-30)
                  .reverse()
                  .map((r) => (
                    <tr key={r.id}>
                      <td>{r.sourceId}</td>
                      <td>{r.status}</td>
                      <td>
                        {r.eventIds.join(', ')}
                        {r.checkpoint === undefined ? '' : ' · checkpoint ' + r.checkpoint}
                      </td>
                      <td>{r.error ?? 'Retained'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <a href="#/search">Independently verify actual records in Search →</a>
        </>
      )}
    </main>
  );
}
