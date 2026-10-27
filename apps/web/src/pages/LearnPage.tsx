import { useState } from 'react';
import { usePoll } from '../usePoll';
import { request } from './TrainingPage';
import { TerminalPage } from './TerminalPage';
interface LearnView {
  lessons: {
    id: string;
    title: string;
    minutes: number;
    level: number;
    profile: string;
    instructions: string;
    completionScope: string;
    setup?: unknown[];
    kvIncident?: string;
    seeded?: boolean;
    questions?: { id: string; prompt: string }[];
    references?: { url: string; vendorVersion: string; purpose: string }[];
  }[];
  active: {
    id: string;
    learner: string;
    hints: number;
    notes: string;
    answers?: Record<string, string>;
  } | null;
  hint?: string[];
  progress: {
    checks: { label: string; passed: boolean }[];
    completed: boolean;
    unsafeAttempts: number;
  } | null;
}
export function LearnPage() {
  const data = usePoll(() => request<LearnView>('learn'), [], 3000);
  const [learner, setLearner] = useState('Austin'),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false),
    [notes, setNotes] = useState<string | null>(null),
    [answers, setAnswers] = useState<Record<string, string>>({});
  const act = async (path: string, body?: unknown, reload = false) => {
    setBusy(true);
    setError('');
    try {
      await request('learn/' + path, body ?? {});
      if (reload) {
        window.location.hash = '#/learn';
        window.location.reload();
      } else await data.refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const current = data.data?.active;
  const lesson = data.data?.lessons.find((l) => l.id === current?.id);
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">GUIDED PRACTICE · SAVED PER LEARNER / LESSON</span>
          <h1>Learn Splunk engineering</h1>
          <p>Practice Splunk foundations, Git, Ansible and KV Store in isolated saved environments.</p>
        </div>
        <div className="v5-actions">
          <a href="#/kvstore">KV Store administration →</a>
          <a href="#/code">Code & Ansible →</a>
        </div>
      </header>
      {(error || data.error) && (
        <div role="alert" className="error">
          {error || data.error}
        </div>
      )}
      {!current ? (
        <>
          <label>
            Learner name <input value={learner} onChange={(e) => setLearner(e.target.value)} />
          </label>
          <p>
            Starting a lesson saves free practice and opens its own resumable session. Reset creates a backup
            first.
          </p>
          <div className="v5-grid">
            {data.data?.lessons.map((l) => (
              <article className="v5-card" key={l.id}>
                <span className="v5-eyebrow">
                  Level {l.level} · {l.profile} · {l.minutes} minutes
                </span>
                <h3>
                  {l.id}. {l.title}
                </h3>
                <button disabled={busy} onClick={() => act('start', { id: l.id, learner }, true)}>
                  Start / resume
                </button>
              </article>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="v5-toolbar">
            <h2>
              {current.id}. {lesson?.title}
            </h2>
            <div className="v5-actions">
              <button
                disabled={busy}
                onClick={() => act('start', { id: current.id, learner: current.learner, reset: true }, true)}
              >
                Reset with backup
              </button>
              <button disabled={busy} onClick={() => act('leave', {}, true)}>
                Return to free practice
              </button>
            </div>
          </div>
          <div className="v5-banner">
            {lesson?.completionScope}{' '}
            {lesson?.id.startsWith('K')
              ? lesson.kvIncident
                ? 'This lesson starts with a seeded KV Store incident. Open KV Store administration to investigate.'
                : 'Use KV Store administration or the terminal to complete the collection exercise.'
              : /^(SP-|AU-)/.test(lesson?.id ?? '')
                ? 'Complete the tasks, inspect the resulting state and save your evidence answers. Outcome checks determine completion.'
                : lesson?.seeded
                  ? 'This session includes seeded repository faults for the lesson.'
                  : 'This workspace starts with the profile’s standard repository baseline; follow the manual for additional challenge setup.'}
          </div>
          <div className="v5-learn-layout">
            <div>
              <TerminalPage visible={true} />
            </div>
            <section className="v5-card">
              <span className="v5-eyebrow">
                {current.learner} · {lesson?.minutes} minute exercise
              </span>
              <div className="v5-instructions">{lesson?.instructions}</div>
              {current.id === 'A6' && (
                <p>
                  Lab clarification: verify all 49 reachable forwarders; the known offline forwarder remains
                  intentionally excluded.
                </p>
              )}
              <h3>{lesson?.questions ? 'Outcome checks' : 'Workflow checks'}</h3>
              {data.data?.progress?.checks.map((c) => (
                <p key={c.label}>
                  {c.passed ? '✓' : '○'} {c.label}
                </p>
              ))}
              <p>
                {data.data?.progress?.completed
                  ? lesson?.questions
                    ? 'Lesson complete — verified outcomes and answers passed.'
                    : 'Workflow milestones met — review all manual success criteria below.'
                  : 'Keep practicing; checks update as you work.'}
              </p>
              {lesson && lesson.level < 4 && (
                <button disabled={busy} onClick={() => act('progress', { hint: true })}>
                  Hint ({current.hints} used)
                </button>
              )}
              {data.data?.hint?.map((hint, n) => (
                <p key={n}>{hint}</p>
              ))}
              {current.hints > 0 && !lesson?.questions && (
                <p>
                  {current.id.startsWith('K')
                    ? 'Compare running status, btool configuration and collection data. Apply the smallest repair, then verify the same record or revision from the affected member.'
                    : 'Read the failed output first, inspect the source and target, run a scoped dry run, then verify the same revision after deployment.'}
                </p>
              )}
              {lesson?.questions && (
                <fieldset>
                  <legend>Evidence questions</legend>
                  {lesson.questions.map((q) => (
                    <label className="v5-note" key={q.id}>
                      {q.prompt}
                      <input
                        value={answers[q.id] ?? current.answers?.[q.id] ?? ''}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      />
                    </label>
                  ))}
                  <button
                    disabled={busy}
                    onClick={() => act('progress', { answers: { ...current.answers, ...answers } })}
                  >
                    Save evidence answers
                  </button>
                </fieldset>
              )}
              {lesson?.references?.map((reference) => (
                <p key={reference.url}>
                  <a href={reference.url} target="_blank" rel="noreferrer">
                    {reference.purpose} · {reference.vendorVersion}
                  </a>
                </p>
              ))}
              <label className="v5-note">
                Your explanation and evidence
                <textarea value={notes ?? current.notes} onChange={(e) => setNotes(e.target.value)} />
              </label>
              <button disabled={busy} onClick={() => act('progress', { notes: notes ?? current.notes })}>
                Save lesson notes
              </button>
            </section>
          </div>
        </>
      )}
    </main>
  );
}
