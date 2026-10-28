import { SearchLab } from './SearchLab';
import { useEffect, useState } from 'react';
import type {
  TrainingView,
  TrainingResource,
  TrainingValue,
  TrainingAttempt,
  TrainingQuestion,
} from '@sandbox/shared';
import { usePoll } from '../usePoll';
import './training.css';
export async function request<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(
    '/api/' + path,
    body === undefined
      ? {}
      : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  );
  const data = await r.json();
  if (!r.ok) throw new Error(data.error ?? data.message ?? 'Request failed');
  return data;
}
export function TrainingPage() {
  const view = usePoll(() => request<TrainingView>('training'), [], 4000);
  const [tab, setTab] = useState('incidents'),
    [track, setTrack] = useState('all'),
    [filter, setFilter] = useState(''),
    [selected, setSelected] = useState('aws'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  const act = async (action: string, target: string, value?: unknown) => {
    setError('');
    setBusy(true);
    try {
      await request('training/action', { action, target, value });
      await view.refresh();
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    } finally {
      setBusy(false);
    }
  };
  const data = view.data;
  if (!data)
    return (
      <main className="v5">
        <h1>Interview workbench</h1>
        <p>{view.error ?? 'Loading practice state…'}</p>
      </main>
    );
  const resource = data.state.resources.find((r) => r.id === selected)!;
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">V7 · ENGINEER SANDBOX</span>
          <h1>Interview workbench</h1>
          <p>Investigate incidents. Demonstrate recovery. Explain your decisions.</p>
        </div>
        <div className="v5-actions">
          <a href="#/settings/service-health">Recorded service health →</a>
          <a href="#/settings/integration-operations">Recorded integration operations →</a>
          <a href="#/settings/security-operations">Recorded security operations →</a>
          <a href="#/code">Code & Ansible →</a>
          <a href="#/terminal">Terminal →</a>
          <a href="#/search">Search →</a>
        </div>
      </header>
      <div className="v5-banner">
        Synthetic practice systems · Changes save in this environment. Vendor behavior is a bounded
        simulation. Use Environments → Lab or APL for automation.
      </div>
      {(error || view.error) && (
        <div className="error" role="alert">
          {error || view.error}
        </div>
      )}
      <nav className="v5-tabs">
        {['incidents', 'systems', 'search lab', 'questions', 'evidence'].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
            {t[0]!.toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>
      {tab === 'incidents' && (
        <>
          <div className="v5-toolbar">
            <h2>Incident library</h2>
            <select aria-label="Role track" value={track} onChange={(e) => setTrack(e.target.value)}>
              <option value="all">All role tracks</option>
              {[...new Set(data.cases.map((c) => c.track))].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="v5-grid">
            {data.cases
              .filter((c) => track === 'all' || c.track === track)
              .map((c) => (
                <article className="v5-card" key={c.id}>
                  <span className="v5-eyebrow">
                    {c.track} · {c.questionIds.join(', ')}
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.impact}</p>
                  <button
                    disabled={
                      busy || data.state.attempts.some((a) => a.scenario === c.id && a.closed === undefined)
                    }
                    onClick={async () => {
                      await act('start', c.id);
                      setSelected(c.resource);
                      setTab('systems');
                    }}
                  >
                    Start incident
                  </button>
                </article>
              ))}
          </div>
          <h2>Your attempts</h2>
          {data.state.attempts.length === 0 && <p>No attempts yet. Start an incident to open a ticket.</p>}
          {[...data.state.attempts].reverse().map((a) => (
            <Attempt
              key={a.id}
              attempt={a}
              data={data}
              busy={busy}
              submit={(notes) => act('submit', a.id, notes)}
              inspect={() => {
                setSelected(data.cases.find((c) => c.id === a.scenario)!.resource);
                setTab('systems');
              }}
            />
          ))}
        </>
      )}
      {tab === 'systems' && (
        <div className="v5-workspace">
          <aside>
            {data.state.resources.map((r) => (
              <button key={r.id} aria-pressed={selected === r.id} onClick={() => setSelected(r.id)}>
                {r.title}
              </button>
            ))}
          </aside>
          <Resource
            key={resource.id}
            r={resource}
            busy={busy}
            act={act}
            advance={async () => {
              setBusy(true);
              setError('');
              try {
                await request('training/advance', { ticks: 5 });
                await view.refresh();
              } catch (e) {
                setError(String(e));
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      )}
      {tab === 'questions' && (
        <>
          <div className="v5-toolbar">
            <h2>235 interview questions</h2>
            <input
              aria-label="Search questions"
              placeholder="Search question, topic or ID"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <label>
              Learner{' '}
              <select value={data.state.learner} onChange={(e) => act('learner', e.target.value)}>
                {data.state.learners.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </label>
            <button
              onClick={() => {
                const n = window.prompt('Local learner name');
                if (n) void act('learner', n);
              }}
            >
              Add learner
            </button>
          </div>
          <p>
            Answers stay local. Clearly distinguish employment experience from sandbox practice. Learner names
            separate answer notes; the operational world is shared.
          </p>
          {data.questions
            .filter((q) => `${q.id} ${q.question} ${q.topic}`.toLowerCase().includes(filter.toLowerCase()))
            .map((q) => (
              <Question
                key={`${data.state.learner}:${q.id}`}
                q={q}
                saved={data.state.answers[`${data.state.learner}:${q.id}`]}
                save={(text, basis) => act('answer', q.id, { text, basis })}
              />
            ))}
        </>
      )}
      {tab === 'search lab' && <SearchLab />}
      {tab === 'evidence' && (
        <>
          <h2>Action evidence</h2>
          <p>
            Pre-change inspection and post-change verification must concern the affected resource and applied
            revision.
          </p>
          <div className="v5-table">
            <table>
              <thead>
                <tr>
                  <th>ID / Tick</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Revision</th>
                  <th>Result</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {[...data.state.evidence]
                  .reverse()
                  .slice(0, 250)
                  .map((e) => (
                    <tr key={e.id}>
                      <td>
                        {e.id} / {e.tick}
                      </td>
                      <td>{e.kind}</td>
                      <td>{e.target}</td>
                      <td>{e.revision}</td>
                      <td>{e.success ? 'Success' : 'Failed'}</td>
                      <td>{e.detail}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
function Resource({
  r,
  busy,
  act,
  advance,
}: {
  r: TrainingResource;
  busy: boolean;
  act: (a: string, t: string, v?: unknown) => Promise<boolean>;
  advance: () => Promise<void>;
}) {
  const [patch, setPatch] = useState<Record<string, TrainingValue>>({});
  const dirty = Object.keys(patch).length > 0;
  if (r.kind === 'kvstore')
    return (
      <section>
        <h2>KV Store administration</h2>
        <p>V7 inherits persistent collections, per-member records and configuration-backed service health.</p>
        <pre>{JSON.stringify(r.metrics, null, 2)}</pre>
        <a href="#/kvstore">Open KV Store administration →</a>
        <button disabled={busy} onClick={() => act('inspect', r.id)}>
          Capture inspection
        </button>
      </section>
    );
  return (
    <section>
      <div className="v5-toolbar">
        <h2>{r.title}</h2>
        <span>
          Draft {r.revision} · Applied {r.appliedRevision}
        </span>
      </div>
      <div className="v5-actions">
        <button disabled={busy} onClick={() => act('inspect', r.id)}>
          Capture inspection
        </button>
        <button disabled={busy} onClick={advance}>
          Advance 5 ticks
        </button>
        {['shc', 'kvstore'].includes(r.kind) && (
          <button disabled={busy} onClick={() => act('resync', r.id)}>
            Resynchronize
          </button>
        )}
        {['hec', 'security'].includes(r.kind) && (
          <button disabled={busy} onClick={() => act('send', r.id)}>
            {r.kind === 'hec' ? 'Send test event' : 'Run response'}
          </button>
        )}
        {r.kind === 'cribl' && (
          <button disabled={busy} onClick={() => act('replay', r.id)}>
            Replay retained events
          </button>
        )}
        {r.kind === 'migration' && (
          <>
            <button disabled={busy} onClick={() => act('cutover', r.id)}>
              Cut over
            </button>
            <button disabled={busy} onClick={() => act('rollback', r.id)}>
              Roll back
            </button>
          </>
        )}
      </div>
      <div className="v5-metrics">
        {Object.entries(r.metrics).map(([k, v]) => (
          <div key={k}>
            <span>{k}</span>
            <strong>{String(v)}</strong>
          </div>
        ))}
      </div>
      <h3>Configuration</h3>
      <p>Stage the change, then apply it. Inspect again after recovery to record verification.</p>
      <div className="v5-fields">
        {Object.entries(r.config).map(([k, v]) => (
          <label key={k}>
            {k}
            {typeof v === 'boolean' ? (
              <select
                value={String(patch[k] ?? v)}
                onChange={(e) => setPatch({ ...patch, [k]: e.target.value === 'true' })}
              >
                <option>true</option>
                <option>false</option>
              </select>
            ) : (
              <input
                type={typeof v === 'number' ? 'number' : 'text'}
                value={String(patch[k] ?? v)}
                onChange={(e) =>
                  setPatch({ ...patch, [k]: typeof v === 'number' ? Number(e.target.value) : e.target.value })
                }
              />
            )}
          </label>
        ))}
      </div>
      <div className="v5-actions">
        <button
          disabled={busy || !dirty}
          onClick={async () => {
            if (await act('configure', r.id, patch)) setPatch({});
          }}
        >
          Stage configuration
        </button>
        <button disabled={busy || r.revision === r.appliedRevision} onClick={() => act('apply', r.id)}>
          Apply staged revision
        </button>
      </div>
      <h3>Delivery / diagnostic log</h3>
      <pre>{r.logs.join('\n') || 'No recorded changes.'}</pre>
      <details>
        <summary>Queue and delivered event IDs</summary>
        <pre>
          {JSON.stringify({ queued: r.queue, delivered: r.delivered, retained: r.retained }, null, 2)}
        </pre>
      </details>
      <a
        href={'#/search?q=' + encodeURIComponent('| inputlookup training_metrics | search resource=' + r.id)}
      >
        Query these metrics in Search →
      </a>
    </section>
  );
}
function Attempt({
  attempt: a,
  data,
  busy,
  submit,
  inspect,
}: {
  attempt: TrainingAttempt;
  data: TrainingView;
  busy: boolean;
  submit: (n: Record<string, string>) => Promise<boolean>;
  inspect: () => void;
}) {
  const [notes, setNotes] = useState(a.notes);
  const c = data.cases.find((c) => c.id === a.scenario)!;
  return (
    <article className="v5-card">
      <span className="v5-eyebrow">
        {a.id} ·{' '}
        {a.closed !== undefined
          ? 'Closed'
          : data.resolved[a.scenario]
            ? 'Recovered — submit debrief'
            : 'Investigating'}
      </span>
      <h3>{c.title}</h3>
      <button onClick={inspect}>Open affected system</button>
      <details open={a.closed === undefined}>
        <summary>Evidence and debrief</summary>
        <ul>
          {c.evidence.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        {['impact', 'rootCause', 'change', 'rollback', 'verification', 'prevention'].map((k) => (
          <label className="v5-note" key={k}>
            {k}
            <textarea value={notes[k] ?? ''} onChange={(e) => setNotes({ ...notes, [k]: e.target.value })} />
          </label>
        ))}
        <h4>Interviewer follow-ups</h4>
        <ul>
          {c.followups.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
        <button disabled={busy || a.closed !== undefined} onClick={() => submit(notes)}>
          Evaluate and close when recovered
        </button>
      </details>
      {a.score && (
        <>
          <p>
            <strong>{a.score.recovery + a.score.process + a.score.communication}/100</strong> · Recovery{' '}
            {a.score.recovery}/50 · Process {a.score.process}/30 · Explanation checklist{' '}
            {a.score.communication}/20
          </p>
          <ul>
            {a.score.feedback.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      )}
    </article>
  );
}
function Question({
  q,
  saved,
  save,
}: {
  q: TrainingQuestion;
  saved?: { text: string; basis: 'work experience' | 'sandbox practice' };
  save: (text: string, basis: 'work experience' | 'sandbox practice') => Promise<boolean>;
}) {
  const [text, setText] = useState(saved?.text ?? ''),
    [basis, setBasis] = useState<'work experience' | 'sandbox practice'>(saved?.basis ?? 'sandbox practice'),
    [status, setStatus] = useState(''),
    [seconds, setSeconds] = useState(120),
    [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    if (seconds === 0) setRunning(false);
  }, [seconds]);
  return (
    <details className="v5-card">
      <summary>
        <span className="v5-eyebrow">
          {q.id} · {q.reportedSessionCount} sessions · {q.topic}
        </span>
        <h3>{q.question}</h3>
      </summary>
      {q.relayedOrReconstructedWordingPresent && <p>Some source wording was relayed or reconstructed.</p>}
      <p>
        Related existing tickets:{' '}
        {q.relatedExistingScenarioIds.join(', ') || 'Use the role track and answer practice.'}
      </p>
      <div className="v5-actions">
        <strong role="timer">
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}
        </strong>
        <button onClick={() => setRunning(!running)} disabled={seconds === 0}>
          {running ? 'Pause' : 'Start 2-minute answer'}
        </button>
        <button
          onClick={() => {
            setRunning(false);
            setSeconds(120);
          }}
        >
          Reset timer
        </button>
        <a href="#/fleet">Inspect environment topology →</a>
      </div>
      <label>
        Answer basis{' '}
        <select value={basis} onChange={(e) => setBasis(e.target.value as typeof basis)}>
          <option>work experience</option>
          <option>sandbox practice</option>
        </select>
      </label>
      <label className="v5-note">
        Your answer
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Situation, your responsibility, evidence, action, result and tradeoff…"
        />
      </label>
      <button
        onClick={async () => {
          setStatus((await save(text, basis)) ? 'Saved' : 'Save failed — your draft is retained');
        }}
      >
        Save answer
      </button>{' '}
      <span role="status">{status}</span>
    </details>
  );
}
