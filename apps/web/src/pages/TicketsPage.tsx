import { useState } from 'react';
import type { TicketDto, WorldInfo } from '@sandbox/shared';
import { api } from '../api';
import { usePoll } from '../usePoll';

export function TicketsPage({ world }: { world: WorldInfo }) {
  const tickets = usePoll(() => api.tickets(), [], 2000);
  const catalog = usePoll(() => api.scenarios(), [], 10000);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const action = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
      await tickets.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="tickets-page">
      <div className="tickets-heading">
        <div>
          <h1>Incident desk</h1>
          <a href="#/training">Interview incidents and question practice →</a>
          <p>Investigate, repair, and verify recovery in the sandbox.</p>
        </div>
        <a className="ticket-link" href="#/terminal">
          Open terminal →
        </a>
      </div>
      {(error || tickets.error || catalog.error) && (
        <div className="error" role="alert">
          {error || tickets.error || catalog.error}
        </div>
      )}
      <section className="incident-catalog" aria-label="Incident library">
        {catalog.data?.map((s) => {
          const started = tickets.data?.some((t) => t.scenarioId === s.id);
          return (
            <article key={s.id}>
              {/* Topics would hint at the cause, so the card shows only the symptom and difficulty. */}
              <span className="ticket-eyebrow">{s.difficulty}</span>
              <h2>{s.title}</h2>
              <button
                disabled={busy || started || !tickets.data}
                onClick={() => action(() => api.startScenario(s.id))}
              >
                {started ? 'Started this session' : 'Start incident'}
              </button>
            </article>
          );
        })}
      </section>
      <h2>Tickets</h2>
      {tickets.data?.length === 0 && (
        <div className="ticket-empty">
          No tickets yet. Start an incident above; its ticket describes only what the requester sees.
        </div>
      )}
      <div className="ticket-list">
        {tickets.data?.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            now={world.now}
            busy={busy}
            close={(note) => action(() => api.closeTicket(t.id, note))}
          />
        ))}
      </div>
    </main>
  );
}
function TicketCard({
  ticket: t,
  now,
  busy,
  close,
}: {
  ticket: TicketDto;
  now: number;
  busy: boolean;
  close: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const minutes = Math.max(0, Math.floor(((t.closedAt ?? now) - t.openedAt) / 60000));
  return (
    <article className="ticket-card">
      <div className="ticket-meta">
        <span>
          {t.id} · {t.urgency} urgency
        </span>
        <strong className={`ticket-status status-${t.status}`}>{t.status}</strong>
        <span>{minutes} min elapsed</span>
      </div>
      <h3>{t.title}</h3>
      <p className="ticket-requester">
        {t.requester} · {t.persona}
      </p>
      <p>{t.text}</p>
      {t.interviewQuestionIds?.length ? <p>Interview questions: {t.interviewQuestionIds.join(', ')} · <a href="#/training">Practice answers</a></p> : null}
      {t.requestedEvidence && <details><summary>Required investigation evidence</summary><ul>{t.requestedEvidence.map(e => <li key={e}>{e}</li>)}</ul></details>}
      {t.followups && <details><summary>Interviewer follow-ups</summary><ul>{t.followups.map(e => <li key={e}>{e}</li>)}</ul></details>}
      <p className="ticket-guidance">
        {t.status === 'open'
          ? 'Investigate with fleet views, searches, and the terminal. Saved config edits need the appropriate restart or reload.'
          : t.status === 'recovering'
            ? 'The symptoms have cleared. Allow a short recovery period, then verify with new data.'
            : t.status === 'resolved'
              ? 'Recovery time has elapsed. Verify the symptoms, then record your root cause, fix, and verification.'
              : 'Ticket closed.'}
      </p>
      {t.status !== 'closed' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void close(note);
          }}
        >
          <label htmlFor={`note-${t.id}`}>Resolution note</label>
          <textarea
            id={`note-${t.id}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={4000}
            placeholder="Impact; root cause and evidence; scoped change; rollback; verification; prevention"
          />
          <button disabled={busy || t.status !== 'resolved' || !note.trim()}>Close ticket</button>
        </form>
      ) : (
        <blockquote>{t.resolutionNote}</blockquote>
      )}
    </article>
  );
}
