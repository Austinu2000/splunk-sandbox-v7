import { useState } from 'react';
import type { WorldInfo } from '@sandbox/shared';
import { api } from '../api';
import { fmtClock, fmtInt } from '../format';
import { usePoll } from '../usePoll';

const FLEET_SIZES = [1_000, 5_000, 10_000, 20_000, 35_000];

const wallTime = (ms: number) =>
  new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

export function SessionsPage({ world, onWorldChanged }: { world: WorldInfo; onWorldChanged: () => void }) {
  const info = usePoll(() => api.sessions(), [], 5000);
  const [profileFilter, setProfileFilter] = useState(world.profileId ?? 'default');
  const [name, setName] = useState('');
  const [seed, setSeed] = useState(world.seed);
  const [fleetSize, setFleetSize] = useState(world.fleetSize);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const d = info.data;

  const run = async (label: string, fn: () => Promise<string>) => {
    setBusy(label);
    setMessage(null);
    try {
      setMessage({ ok: true, text: await fn() });
      await info.refresh();
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const save = () =>
    run('save', async () => {
      const n = name.trim() || `Session at ${fmtClock(world.now).replace(' UTC', '')}`;
      await api.saveSession(n);
      setName('');
      return `Saved "${n}".`;
    });
  const load = (id: number, label: string) => {
    if (
      !confirm(`Load "${label}"? Open terminals close. Switching environments autosaves the current profile.`)
    )
      return;
    void run('load', async () => {
      await api.loadSession(id);
      onWorldChanged();
      return `Loaded "${label}".`;
    });
  };
  const remove = (id: number, label: string) => {
    if (!confirm(`Delete the saved session "${label}"? This can't be undone.`)) return;
    void run('delete', async () => {
      await api.deleteSession(id);
      return `Deleted "${label}".`;
    });
  };
  const reset = () => {
    if (
      !confirm(
        `Reset to a fresh world (seed "${seed}", ${fmtInt(fleetSize)} forwarders)? Unsaved changes are lost and open terminals close.`,
      )
    )
      return;
    void run('reset', async () => {
      await api.resetWorld({ seed: seed.trim() || world.seed, fleetSize });
      onWorldChanged();
      return 'Started a fresh world.';
    });
  };

  return (
    <main className="dashboard sessions-page">
      <div className="dash-header">
        <h1>Sessions</h1>
        <p className="subtitle">Save the world as it is now, come back to it later, or start over.</p>
      </div>
      {message && (
        <div className={message.ok ? 'notice' : 'error'} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </div>
      )}
      {busy === 'load' && (
        <div className="notice">Loading: replaying the saved session (about a second per sim hour)…</div>
      )}

      <div className="panel-row">
        <section className="panel">
          <h2>Current world</h2>
          <dl className="kv">
            <dt>Seed</dt>
            <dd className="mono">{world.seed}</dd>
            <dt>Forwarders</dt>
            <dd>{fmtInt(world.fleetSize)}</dd>
            <dt>Sim time</dt>
            <dd>{fmtClock(world.now)}</dd>
            <dt>Your changes</dt>
            <dd>{d ? fmtInt(d.changes) : '…'}</dd>
          </dl>
          {d && !d.persistence ? (
            <p className="muted">Saving is unavailable: the server was started without a session database.</p>
          ) : (
            <div className="inputs">
              <label>
                Name
                <input
                  className="search"
                  value={name}
                  maxLength={80}
                  placeholder="e.g. Before the license incident"
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && save()}
                />
              </label>
              <button className="primary-btn" disabled={!!busy} onClick={save}>
                {busy === 'save' ? 'Saving…' : 'Save session'}
              </button>
            </div>
          )}
          <p className="muted small">
            A save stores the seed and every change you made (commands, edits, restarts, incidents,
            interviews). Loading replays them on a fresh world, so it comes back exactly as it was. The server
            also autosaves every two minutes, when switching environments, and when it stops.
          </p>
        </section>
        <section className="panel">
          <h2>Start over</h2>
          {world.profileId !== 'default' && (
            <p>
              <a href="#/environments">Use Environments to start this profile fresh and keep a backup.</a>
            </p>
          )}
          <div className="inputs">
            <label>
              Seed
              <input
                className="search"
                value={seed}
                maxLength={64}
                onChange={(e) => setSeed(e.target.value)}
              />
            </label>
            <label>
              Forwarders
              <select value={fleetSize} onChange={(e) => setFleetSize(Number(e.target.value))}>
                {[...new Set([...FLEET_SIZES, world.fleetSize])]
                  .sort((a, b) => a - b)
                  .map((n) => (
                    <option key={n} value={n}>
                      {fmtInt(n)}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="secondary-btn"
              disabled={!!busy || world.profileId !== 'default'}
              onClick={reset}
            >
              {busy === 'reset' ? 'Resetting…' : 'Reset world'}
            </button>
          </div>
          <p className="muted small">
            The same seed gives the same world. Resetting clears incidents, tickets and interviews, so every
            incident can be used again. Interview scores in saved sessions are kept.
          </p>
        </section>
      </div>

      <section className="panel">
        <h2>Saved sessions by environment</h2>
        <label>
          Environment{' '}
          <select value={profileFilter} onChange={(e) => setProfileFilter(e.target.value)}>
            {['default', 'apl', 'erie'].map((id) => (
              <option key={id} value={id}>
                {id === 'apl'
                  ? 'Johns Hopkins APL'
                  : id === 'erie'
                    ? 'Erie Insurance'
                    : 'Default environment'}
              </option>
            ))}
          </select>
        </label>
        {info.error && <div className="error">Could not load sessions: {info.error}</div>}
        {d && d.saves.length === 0 && <p className="muted">Nothing saved yet.</p>}
        {d && d.saves.length > 0 && (
          <div className="table-scroll">
            <table className="results">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Seed</th>
                  <th className="num">Forwarders</th>
                  <th>Sim time</th>
                  <th>Saved</th>
                  <th className="num">Interviews</th>
                  <th className="num">Best</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {d.saves
                  .filter((s) => (s.profileId ?? 'default') === profileFilter)
                  .map((s) => (
                    <tr key={s.id}>
                      <td>
                        {s.name} {s.kind === 'autosave' && <span className="iv-chip">auto</span>}
                      </td>
                      <td className="mono">{s.seed}</td>
                      <td className="num">{fmtInt(s.fleetSize)}</td>
                      <td>{fmtClock(s.simTime)}</td>
                      <td>{wallTime(s.savedAt)}</td>
                      <td className="num">{s.interviews}</td>
                      <td className="num">{s.bestScore ?? '—'}</td>
                      <td className="row-actions">
                        <button className="link-btn" disabled={!!busy} onClick={() => load(s.id, s.name)}>
                          Load
                        </button>
                        <button
                          className="link-btn danger"
                          disabled={!!busy}
                          onClick={() => remove(s.id, s.name)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Interview history</h2>
        {d && d.history.length === 0 && <p className="muted">No interviews in saved sessions yet.</p>}
        {d && d.history.length > 0 && (
          <table className="results">
            <thead>
              <tr>
                <th>Incident</th>
                <th>Difficulty</th>
                <th>Submitted</th>
                <th>Session</th>
                <th className="num">Score</th>
              </tr>
            </thead>
            <tbody>
              {d.history
                .filter((h) => (h.profileId ?? 'default') === profileFilter)
                .map((h) => (
                  <tr key={`${h.sessionId}:${h.startedAt}`}>
                    <td>{h.title}</td>
                    <td>{h.difficulty}</td>
                    <td>{wallTime(h.submittedAt)}</td>
                    <td>{h.session}</td>
                    <td className="num">{h.total}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
