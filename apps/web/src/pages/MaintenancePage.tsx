import { useEffect, useState } from 'react';
import type { MaintenanceRuntime } from '@sandbox/shared';
import { request } from './TrainingPage';
interface View {
  context: string;
  revision: string;
  clock: { tick: number; paused: boolean };
  hosts: {
    host: string;
    role: string;
    version: string;
    running: boolean;
    artifactDigest: string;
    storage: { availableMB: number; minimumMB: number };
  }[];
  state: MaintenanceRuntime | null;
}
export function MaintenancePage() {
  const [v, setV] = useState<View | null>(null),
    [host, setHost] = useState(''),
    [targets, setTargets] = useState<string[]>([]),
    [name, setName] = useState('before_upgrade'),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [accepted, setAccepted] = useState(false);
  const review = async () => {
    setError('');
    const next = await request<View>('maintenance');
    setV(next);
    setHost((h) => (next.hosts.some((p) => p.host === h) ? h : (next.hosts[0]?.host ?? '')));
    return next;
  };
  useEffect(() => {
    void review().catch((e) => setError(String(e)));
  }, []);
  const act = async (action: string, fields: Record<string, unknown>) => {
    if (!v) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await request('maintenance/action', { context: v.context, revision: v.revision, action, ...fields });
      await review();
      setNotice('Operation retained. Review the actual versions, service state and receipts below.');
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };
  const backups = v?.state?.backups.filter((b) => b.host === host) ?? [],
    preflight = v?.state?.preflights.at(-1);
  return (
    <main className="v5">
      <header className="v5-heading">
        <div>
          <span className="v5-eyebrow">V7 · UPGRADE AND RECOVERY PRACTICE</span>
          <h1>Enterprise maintenance</h1>
          <p>Verified configuration archives, ordered upgrades and recovery of paused work.</p>
        </div>
        <a href="#/terminal">Virtual terminal →</a>
      </header>
      <p className="v5-banner">
        Offline simulation: 9.4.1 → 9.4.2 is this exercise’s patch target. Staged .tgz files contain a
        teaching descriptor, not vendor binaries. Configuration archives exclude indexed data, KV Store data
        and installed packages. Back these up separately. License acknowledgement is a nonbinding training
        flag.
      </p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <button
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void review()
            .catch((e) => setError(String(e)))
            .finally(() => setBusy(false));
        }}
      >
        Review current maintenance state
      </button>
      {v && (
        <>
          <section className="v5-card">
            <h2>Prepare and recover one host</h2>
            <label>
              Virtual Enterprise host{' '}
              <select value={host} onChange={(e) => setHost(e.target.value)}>
                {v.hosts.map((p) => (
                  <option key={p.host} value={p.host}>
                    {p.host} · {p.role} · {p.version}
                  </option>
                ))}
              </select>
            </label>
            <div className="v5-actions">
              <button disabled={busy || !host} onClick={() => void act('stage-package', { host })}>
                Stage verified teaching package
              </button>
              <label>
                Archive name <input value={name} maxLength={40} onChange={(e) => setName(e.target.value)} />
              </label>
              <button disabled={busy || !host || !name} onClick={() => void act('backup', { host, name })}>
                Back up configuration only
              </button>
            </div>
            <p>
              Verify archives before the upgrade. Restore requires this virtual service to be stopped and no
              active upgrade job. Restore preserves the installed package version and saves the current
              configuration in a separate archive first.
            </p>
            {backups.map((b) => (
              <article key={b.id}>
                <strong>{b.name}</strong> · captured {b.packageVersion} ·{' '}
                {b.verified === undefined ? 'Unverified' : 'SHA-256 verified'}
                <p>
                  <code>{b.path}</code>
                </p>
                <div className="v5-actions">
                  <button disabled={busy} onClick={() => void act('verify', { host, id: b.id })}>
                    Verify {b.name}
                  </button>
                  <button
                    disabled={busy || b.verified === undefined}
                    onClick={() => void act('restore', { host, id: b.id })}
                  >
                    Restore {b.name}
                  </button>
                </div>
              </article>
            ))}
          </section>
          <section className="v5-card">
            <h2>Review the maintenance plan</h2>
            <p>
              Select targets after staging their packages, verifying current archives and backing up
              search-head KV Store data. Preflight orders prerequisites and checks service availability,
              recorded cluster health, native configuration and modeled storage.
            </p>
            <div className="v5-table">
              <table>
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Role</th>
                    <th>Version</th>
                    <th>Service</th>
                    <th>Package</th>
                    <th>Modeled free / required MB</th>
                  </tr>
                </thead>
                <tbody>
                  {v.hosts.map((p) => (
                    <tr key={p.host}>
                      <td>
                        <label>
                          <input
                            type="checkbox"
                            checked={targets.includes(p.host)}
                            onChange={(e) =>
                              setTargets((t) =>
                                e.target.checked ? [...t, p.host] : t.filter((h) => h !== p.host),
                              )
                            }
                          />
                          {p.host}
                        </label>
                      </td>
                      <td>{p.role}</td>
                      <td>{p.version}</td>
                      <td>{p.running ? 'Running' : 'Stopped'}</td>
                      <td>{p.artifactDigest ? 'Staged' : 'Missing'}</td>
                      <td>
                        {Math.floor(p.storage.availableMB)} / {p.storage.minimumMB}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button disabled={busy || !targets.length} onClick={() => void act('preflight', { targets })}>
              Capture upgrade preflight
            </button>
            {preflight && (
              <article>
                <h3>{preflight.valid ? 'Preflight ready' : 'Preflight blocked'}</h3>
                <p>
                  Order: {preflight.targets.join(' → ')}. Target: {preflight.targetVersion}.
                </p>
                <ul>
                  {preflight.issues.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
                <label>
                  <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                  Acknowledge the nonbinding training package flag
                </label>
                <button
                  disabled={busy || !preflight.valid || !accepted}
                  onClick={() => void act('queue', { id: preflight.id, acceptTrainingLicense: accepted })}
                >
                  Start reviewed upgrade
                </button>
              </article>
            )}
          </section>
          <section className="v5-card">
            <h2>Retained upgrade jobs</h2>
            <p>
              Each simulation tick advances one host phase. The clock was{' '}
              {v.clock.paused ? 'paused' : 'running'} at tick {v.clock.tick} when reviewed; running work
              advances automatically. Advance a shared simulation tick below, then review all affected state.
              Paused work retains completed hosts. Abort leaves current installed versions and service state
              for explicit recovery; it does not downgrade packages.
            </p>
            {v.state?.jobs
              .slice()
              .reverse()
              .map((j) => (
                <article key={j.id}>
                  <h3>
                    {j.id} · {j.status}
                  </h3>
                  <p>
                    Completed: {j.completed.join(', ') || 'None'}. Next:{' '}
                    {j.status === 'completed'
                      ? 'All verified'
                      : (j.targets[j.cursor] ?? 'None') + ' · ' + j.phase}
                  </p>
                  {j.error && <p role="alert">{j.error}</p>}
                  <div className="v5-actions">
                    <button
                      disabled={busy || j.status !== 'running'}
                      onClick={() => void act('advance', { id: j.id })}
                    >
                      Advance {j.id} one tick
                    </button>
                    <button
                      disabled={busy || j.status !== 'paused'}
                      onClick={() => void act('resume', { id: j.id })}
                    >
                      Resume {j.id}
                    </button>
                    <button
                      disabled={busy || !['running', 'paused'].includes(j.status)}
                      onClick={() => void act('abort', { id: j.id })}
                    >
                      Abort {j.id}
                    </button>
                  </div>
                  <details>
                    <summary>Phase and recovery history</summary>
                    <ol>
                      {j.events.map((e, i) => (
                        <li key={i}>
                          Tick {e.tick} · {e.host} · {e.phase}: {e.detail}
                        </li>
                      ))}
                    </ol>
                  </details>
                </article>
              ))}
          </section>
          <details>
            <summary>Verification and recovery receipts</summary>
            <pre>
              {JSON.stringify(
                { receipts: v.state?.receipts ?? [], restores: v.state?.restores ?? [] },
                null,
                2,
              )}
            </pre>
          </details>
          <p>
            <a href="#/kvstore">Independent KV Store data backups →</a> ·{' '}
            <a href="#/search">Verify actual searchable data →</a>
          </p>
        </>
      )}
    </main>
  );
}
