import { useEffect, useState } from 'react';
import type { SecurityNotable, ResponseAttempt, ResponseTicket } from '@sandbox/shared';
import { request } from './TrainingPage';
import { searchHash } from '../links';
interface View {
  context: string;
  host: string;
  hosts: string[];
  revision: string;
  principal: string;
  allowed: boolean;
  source: string;
  sourcePath: string;
  notables: SecurityNotable[];
  attempts: ResponseAttempt[];
  tickets: ResponseTicket[];
}
const example =
  'version: 1\nendpoint: https://servicenow.practice.invalid\ncredentialAlias: training_valid\nallowed: true\n';
export function SecurityOperationsPage() {
  const [v, setV] = useState<View | null>(null),
    [host, setHost] = useState(''),
    [principal, setPrincipal] = useState('admin'),
    [source, setSource] = useState(example),
    [note, setNote] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const review = async (h = host, p = principal) => {
    setBusy(true);
    setError('');
    try {
      const next = await request<View>('security?host=' + encodeURIComponent(h) + '&principal=' + p);
      setV(next);
      setHost(next.host);
      setSource(next.source || example);
      setNote('');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void review('', 'admin');
  }, []);
  const act = async (action: string, fields: Record<string, unknown>) => {
    if (!v) return;
    setBusy(true);
    setError('');
    try {
      await request('security/action', {
        context: v.context,
        host: v.host,
        revision: v.revision,
        principal: v.principal,
        action,
        ...fields,
      });
      await review(v.host, v.principal);
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
          <span className="v5-eyebrow">V7 · RECORDED SECURITY OPERATIONS</span>
          <h1>Detection, investigation and response</h1>
          <p>
            Notables come from completed canonical alert searches. Each retains its result rows, source
            revision and indexed event.
          </p>
        </div>
        <a href="#/alerts">Manage detections in Alerts →</a>
      </header>
      <p className="v5-banner">
        Bounded ES and SOAR practice. Tickets and credential aliases are fictional and stay in this
        environment. No external connection is made.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="v5-toolbar">
        <label>
          Dispatch host{' '}
          <select
            value={host}
            onChange={(e) => {
              setHost(e.target.value);
              setV(null);
            }}
          >
            {(v?.hosts ?? [host]).map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <label>
          Practice principal{' '}
          <select
            value={principal}
            onChange={(e) => {
              setPrincipal(e.target.value);
              setV(null);
            }}
          >
            {['admin', 'analyst', 'operator'].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <button disabled={busy} onClick={() => void review()}>
          Review current security evidence
        </button>
      </div>
      {v && (
        <>
          <p>
            {v.notables.length} recorded notables · {v.tickets.length} fictional tickets.{' '}
            {!v.allowed && 'This principal cannot read the notable index.'}
          </p>
          <label>
            Investigation note{' '}
            <textarea
              aria-label="Investigation note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="v5-grid">
            {v.notables.map((n) => (
              <section className="v5-card" key={n.id}>
                <h2>{n.title}</h2>
                <p>
                  {n.id} · {n.severity} · {n.securityDomain} · {n.status} · {n.owner}
                </p>
                <p>
                  Run {n.runId} · notification {n.notificationId} · {n.rows.length} source result rows.
                </p>
                <a href={searchHash('index=notable event_id="' + n.id + '"', '-24h', 'now', n.host)}>
                  Search indexed notable →
                </a>
                <details>
                  <summary>Source results and investigation history</summary>
                  <pre>{JSON.stringify({ rows: n.rows, notes: n.notes }, null, 2)}</pre>
                </details>
                <div className="v5-actions">
                  <button
                    disabled={busy || !note.trim()}
                    onClick={() =>
                      void act('review', { id: n.id, status: 'in-progress', owner: principal, note })
                    }
                  >
                    Assign and investigate
                  </button>
                  <button
                    disabled={busy || !note.trim()}
                    onClick={() =>
                      void act('review', { id: n.id, status: 'resolved', owner: principal, note })
                    }
                  >
                    Resolve with note
                  </button>
                  <button disabled={busy} onClick={() => void act('respond', { id: n.id })}>
                    Run fictional SOAR → ServiceNow response
                  </button>
                </div>
              </section>
            ))}
          </div>
          <details>
            <summary>Response adapter source (teaching control)</summary>
            <p>
              {v.sourcePath}. This bounded schema is separate from native SOAR asset configuration. It accepts
              only the fixed practice endpoint and training aliases.
            </p>
            <textarea
              aria-label="Response adapter YAML"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              rows={6}
            />
            <button disabled={busy} onClick={() => void act('stage-response', { source })}>
              Save fictional response adapter
            </button>
          </details>
          <h2>Response attempts and tickets</h2>
          <pre>{JSON.stringify({ attempts: v.attempts, tickets: v.tickets }, null, 2)}</pre>
          <p>
            To create a detection, activate an events index named notable, save an alert over recorded events,
            enable its notable action and execute or schedule it. An unmatched or failed search produces no
            notable. Successful suppression prevents repeat notables.
          </p>
        </>
      )}
    </main>
  );
}
