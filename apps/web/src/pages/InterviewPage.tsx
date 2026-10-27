import { useEffect, useRef, useState } from 'react';
import type { DebriefDto, InterviewAnswerDto, InterviewDto, TimelineEntryDto } from '@sandbox/shared';
import { api } from '../api';
import { Countdown, fmtDuration } from '../components/InterviewBar';
import { fmtClock } from '../format';
import { usePoll } from '../usePoll';

const EMPTY: InterviewAnswerDto = { rootCause: '', fix: '', verification: '', prevention: '' };
const FIELDS: { key: keyof InterviewAnswerDto; label: string; hint: string }[] = [
  {
    key: 'rootCause',
    label: 'Root cause',
    hint: 'What actually broke, where, and why it caused the symptom.',
  },
  {
    key: 'fix',
    label: 'Fix',
    hint: 'The change you made and how you applied it (restart, reload, bundle push).',
  },
  { key: 'verification', label: 'Verification', hint: 'The data that shows it recovered.' },
  { key: 'prevention', label: 'Prevention', hint: 'What stops this happening again.' },
];
const TIME_LIMITS = [10, 15, 20, 25, 30, 45, 60];

/** Draft answers survive a page reload (per viewer, best effort). */
function useDraft(id: string): [InterviewAnswerDto, (a: InterviewAnswerDto) => void] {
  const key = `sandbox.interview.${id}.draft`;
  const [draft, setDraft] = useState<InterviewAnswerDto>(() => {
    try {
      return { ...EMPTY, ...JSON.parse(sessionStorage.getItem(key) ?? '{}') };
    } catch {
      return EMPTY;
    }
  });
  const update = (a: InterviewAnswerDto) => {
    setDraft(a);
    try {
      sessionStorage.setItem(key, JSON.stringify(a));
    } catch {
      /* storage unavailable: keep the draft in memory */
    }
  };
  return [draft, update];
}

// ---------------------------------------------------------------- setup

function Setup({ onStarted }: { onStarted: () => void }) {
  const catalog = usePoll(() => api.interviewCatalog(), [], 10_000);
  const history = usePoll(() => api.interviews(), [], 10_000);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [scenarioId, setScenarioId] = useState('');
  const [minutes, setMinutes] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const c = catalog.data;
  const unseen = c?.scenarios.filter((s) => !s.seen) ?? [];

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.startInterview({
        ...(scenarioId ? { scenarioId } : {}),
        ...(!scenarioId && topic ? { topic } : {}),
        ...(!scenarioId && difficulty ? { difficulty: difficulty as 'easy' | 'medium' | 'hard' } : {}),
        ...(minutes ? { timeLimitMinutes: minutes } : {}),
      });
      onStarted();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <section className="panel iv-setup">
        <h2>Start an interview</h2>
        <p className="muted">
          You get an incident the way an interviewer would pose it, a wall-clock timer and a notes box.
          Investigate in the sandbox (terminal, search, consoles), fix it, then write up the root cause, fix,
          verification and prevention. Everything you run is recorded and graded against an expected
          investigation path. Hints cost points.
        </p>
        <div className="inputs">
          <label>
            Topic
            <select value={topic} disabled={!!scenarioId} onChange={(e) => setTopic(e.target.value)}>
              <option value="">Any</option>
              {c?.topics.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            Difficulty
            <select
              value={difficulty}
              disabled={!!scenarioId}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">Any</option>
              <option>easy</option>
              <option>medium</option>
              <option>hard</option>
            </select>
          </label>
          <label>
            Incident
            <select value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
              <option value="">Surprise me ({unseen.length} unseen)</option>
              {unseen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.difficulty})
                </option>
              ))}
            </select>
          </label>
          <label>
            Time limit
            <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              <option value={0}>Incident default</option>
              {TIME_LIMITS.map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </select>
          </label>
          <button className="primary-btn" disabled={busy || !unseen.length} onClick={start}>
            {busy ? 'Starting…' : 'Start interview'}
          </button>
        </div>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {c && (
          <p className="muted small">
            {c.aiGrading
              ? 'Claude grading is on: your written answer is also assessed by Claude, shown next to the offline score.'
              : 'Grading runs offline. Set ANTHROPIC_API_KEY on the server to add a Claude assessment of written answers.'}{' '}
            Each incident can be used once per session (reset comes in milestone 8).
          </p>
        )}
      </section>
      {history.data && history.data.length > 0 && (
        <section className="panel">
          <h2>Past interviews</h2>
          <table className="results">
            <thead>
              <tr>
                <th>Interview</th>
                <th>Incident</th>
                <th>Difficulty</th>
                <th>Submitted</th>
                <th className="num">Score</th>
              </tr>
            </thead>
            <tbody>
              {history.data
                .filter((i) => i.status === 'submitted')
                .map((i) => (
                  <tr key={i.id}>
                    <td>
                      <a href={`#/interview/${i.id}`}>{i.id}</a>
                    </td>
                    <td>{i.title}</td>
                    <td>{i.difficulty}</td>
                    <td>{i.submittedAt ? fmtClock(i.submittedAt).replace(' UTC', '') : ''}</td>
                    <td className="num">{i.debrief?.total}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}

// ---------------------------------------------------------------- running

function Running({ interview, onChange }: { interview: InterviewDto; onChange: (i: InterviewDto) => void }) {
  const [notes, setNotes] = useState(interview.notes);
  const [saved, setSaved] = useState(true);
  const [draft, setDraft] = useDraft(interview.id);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  // Notes save shortly after typing stops.
  useEffect(() => {
    if (notes === interview.notes) return;
    setSaved(false);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await api.interviewNotes(interview.id, notes);
        setSaved(true);
      } catch (e) {
        setError((e as Error).message);
      }
    }, 800);
    return () => clearTimeout(timer.current);
  }, [notes, interview.id, interview.notes]);

  const hint = async () => {
    const next = interview.hintsAvailable - interview.hintsUsed.length;
    if (!next || !confirm('Take a hint? It costs points from your final score.')) return;
    try {
      onChange(await api.interviewHint(interview.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const submit = async () => {
    if (!draft.rootCause.trim()) return setError('Write at least a root cause before submitting.');
    if (!confirm('Submit your answer? The incident ends and you get your score and debrief.')) return;
    setBusy(true);
    setError(null);
    try {
      if (notes !== interview.notes) await api.interviewNotes(interview.id, notes);
      const done = await api.submitInterview(interview.id, draft);
      try {
        sessionStorage.removeItem(`sandbox.interview.${interview.id}.draft`);
      } catch {
        /* ignore */
      }
      window.location.hash = `#/interview/${done.id}`;
      onChange(done);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const hintsLeft = interview.hintsAvailable - interview.hintsUsed.length;
  return (
    <>
      <section className="panel iv-prompt-card">
        <div className="panel-head">
          <span className="iv-badge">Interview {interview.id}</span>
          <Countdown deadline={interview.deadline} large />
        </div>
        <blockquote className="iv-question">{interview.prompt}</blockquote>
        <p className="muted small">
          Investigate with <a href="#/terminal">Terminal</a>, <a href="#/search">Search</a>,{' '}
          <a href="#/fleet">Fleet Overview</a>, <a href="#/monitoring/indexing">Monitoring Console</a> and{' '}
          <a href="#/forwarders/clients">Forwarder Management</a>. The timer keeps running on every page.
        </p>
      </section>
      <div className="panel-row">
        <section className="panel">
          <div className="panel-head">
            <h2>Notes</h2>
            <span className="muted small">{saved ? 'Saved' : 'Saving…'}</span>
          </div>
          <textarea
            aria-label="Notes"
            className="iv-notes"
            value={notes}
            maxLength={20_000}
            placeholder="Think out loud: what you suspect, what you checked, what you ruled out."
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="panel-head">
            <h2>Hints</h2>
            <button className="secondary-btn" disabled={!hintsLeft} onClick={hint}>
              {hintsLeft ? `Get a hint (${hintsLeft} left)` : 'No hints left'}
            </button>
          </div>
          {interview.hintsUsed.length === 0 ? (
            <p className="muted small">Each hint costs points.</p>
          ) : (
            <ol className="iv-hints">
              {interview.hintsUsed.map((h, i) => (
                <li key={i}>
                  {h.text} <span className="muted small">(−{h.cost})</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="panel">
          <h2>Your answer</h2>
          {FIELDS.map((f) => (
            <label key={f.key} className="iv-field">
              <span>
                {f.label} <span className="muted small">{f.hint}</span>
              </span>
              <textarea
                aria-label={f.label}
                value={draft[f.key]}
                maxLength={4000}
                onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })}
              />
            </label>
          ))}
          {error && (
            <div className="error" role="alert">
              {error}
            </div>
          )}
          <button className="primary-btn" disabled={busy} onClick={submit}>
            {busy ? 'Grading…' : 'Submit answer'}
          </button>
        </section>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- debrief

const KIND_LABEL: Record<TimelineEntryDto['kind'], string> = {
  cmd: 'command',
  search: 'search',
  page: 'page',
  hint: 'hint',
  submit: 'submit',
};

function scoreTone(n: number): string {
  return n >= 80 ? 'good' : n >= 50 ? 'fair' : 'poor';
}

function Debrief({ interview, d }: { interview: InterviewDto; d: DebriefDto }) {
  return (
    <>
      <section className="panel iv-score">
        <div className={`iv-total ${scoreTone(d.total)}`}>
          <span className="iv-total-value">{d.total}</span>
          <span className="iv-total-label">/ 100</span>
        </div>
        <div className="iv-summary">
          <h2>
            {interview.id}: {interview.title}
          </h2>
          <p className="muted">{interview.prompt}</p>
          <p>
            {d.fixed ? 'Fixed.' : 'Not fixed when you submitted.'} Time used {fmtDuration(d.timeUsedSeconds)}{' '}
            of {interview.timeLimitMinutes}:00{d.overtime ? ' (over time)' : ''}.
            {d.hintPenalty > 0 && ` Hints cost ${d.hintPenalty} points.`} Topics:{' '}
            {interview.topics.join(', ')} · {interview.difficulty}.
          </p>
        </div>
      </section>

      <div className="panel-row">
        <section className="panel">
          <h2>Rubric</h2>
          {d.scores.map((s) => (
            <div key={s.dimension} className="iv-dim">
              <div className="iv-dim-head">
                <strong>{s.label}</strong>
                <span className="muted small">
                  {s.score}% × {s.weight} = {Math.round((s.score * s.weight) / 100)} pts
                </span>
              </div>
              <div className="iv-meter">
                <span className={scoreTone(s.score)} style={{ width: `${s.score}%` }} />
              </div>
              <ul className="iv-notes-list">
                {s.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Claude's assessment</h2>
          {d.ai ? (
            <>
              <p>
                Root cause <strong>{d.ai.rootCause}</strong> · Communication{' '}
                <strong>{d.ai.communication}</strong>{' '}
                <span className="muted small">({d.ai.model}; not part of the total)</span>
              </p>
              <p>{d.ai.feedback}</p>
            </>
          ) : (
            <p className="muted">{d.aiError ?? 'Off. Set ANTHROPIC_API_KEY on the server to add it.'}</p>
          )}
          <h2>What you missed</h2>
          {d.missed.length ? (
            <ul>
              {d.missed.map((m) => (
                <li key={m.id}>{m.label}</li>
              ))}
            </ul>
          ) : (
            <p className="muted">You made every key check.</p>
          )}
          <h2>60-second spoken answer</h2>
          <p className="iv-spoken">{d.spokenAnswer}</p>
        </section>
      </div>

      <section className="panel">
        <h2>Timeline</h2>
        {d.timeline.length === 0 ? (
          <p className="muted">Nothing was recorded.</p>
        ) : (
          <div className="table-scroll">
            <table className="results iv-timeline">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Kind</th>
                  <th>Host</th>
                  <th>Action</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {d.timeline.map((e, i) => {
                  return (
                    <tr
                      key={i}
                      className={
                        e.tags.includes('unsafe')
                          ? 'iv-row-unsafe'
                          : e.tags.includes('fixed')
                            ? 'iv-row-fixed'
                            : undefined
                      }
                    >
                      <td className="mono">{fmtDuration(e.at)}</td>
                      <td>{KIND_LABEL[e.kind]}</td>
                      <td className="mono">{e.host ?? ''}</td>
                      <td className="mono wrap">{e.text}</td>
                      <td>
                        {e.milestones.map((m) => (
                          <span key={m} className="iv-chip ok">
                            ✓ {m}
                          </span>
                        ))}
                        {e.tags.includes('fixed') && <span className="iv-chip ok">fixed it</span>}
                        {e.tags.includes('verification') && <span className="iv-chip ok">verified</span>}
                        {e.tags.includes('unsafe') && <span className="iv-chip bad">{e.note}</span>}
                        {e.tags.includes('change') &&
                          !e.tags.includes('fixed') &&
                          !e.tags.includes('unsafe') && <span className="iv-chip">change</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="panel-row">
        <section className="panel">
          <h2>Model answer</h2>
          {FIELDS.map((f) => (
            <div key={f.key} className="iv-answer">
              <h3>{f.label}</h3>
              <p>{d.modelAnswer[f.key]}</p>
            </div>
          ))}
        </section>
        <section className="panel">
          <h2>Your answer</h2>
          {FIELDS.map((f) => (
            <div key={f.key} className="iv-answer">
              <h3>{f.label}</h3>
              <p className={interview.answer?.[f.key] ? undefined : 'muted'}>
                {interview.answer?.[f.key] || '(blank)'}
              </p>
            </div>
          ))}
        </section>
      </div>
      <p>
        <a href="#/interview">← Back to interviews</a>
      </p>
    </>
  );
}

// ---------------------------------------------------------------- page

export function InterviewPage({
  view,
  current,
  onChange,
}: {
  view?: string;
  current: InterviewDto | null;
  onChange: () => void;
}) {
  const list = usePoll(() => api.interviews(), [view], 10_000);
  const shown = view ? list.data?.find((i) => i.id === view) : undefined;
  return (
    <main className="dashboard interview-page">
      <div className="dash-header">
        <h1>Interview</h1>
        <p className="subtitle">Practise an incident against the clock, then get a scored debrief.</p>
      </div>
      {view ? (
        shown?.debrief ? (
          <Debrief interview={shown} d={shown.debrief} />
        ) : list.data ? (
          <p className="muted">
            Interview {view} not found. <a href="#/interview">Back</a>
          </p>
        ) : null
      ) : current ? (
        <Running interview={current} onChange={onChange} />
      ) : (
        <Setup onStarted={onChange} />
      )}
    </main>
  );
}
